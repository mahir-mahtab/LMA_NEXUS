import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import { aiReconciliationResultSchema, AIReconciliationResult } from './schemas.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// ============================================
// TYPES
// ============================================

export interface ClauseWithVariables {
  id: string;
  title: string;
  body: string;
  type: string;
  order: number;
  variables: {
    id: string;
    label: string;
    type: string;
    value: string;
    unit?: string | null;
    baselineValue?: string | null;
  }[];
}

export interface ReconciliationInput {
  currentDocument: {
    clauses: ClauseWithVariables[];
  };
  incomingDocument: {
    text: string;
    fileName: string;
    fileType: 'pdf' | 'docx';
  };
}

// ============================================
// SYSTEM PROMPT
// ============================================

const RECONCILIATION_SYSTEM_PROMPT = `You are a legal document reconciliation expert specializing in loan agreements and financial documents. Your task is to compare an existing structured loan agreement with an incoming markup/amendment document and extract all proposed changes.

CONTEXT:
- You will receive the current loan agreement as structured JSON with clauses and their associated variables (financial terms, amounts, rates, covenants, etc.)
- You will receive an incoming markup document that contains proposed changes, amendments, or redlined text
- Your job is to identify what has changed and map each change to the correct clause/variable in the existing document

FOR EACH PROPOSED CHANGE:
1. Extract the exact text snippet from the incoming document showing the change (incomingSnippet)
2. Match it to the correct clause ID from the current document (targetClauseId) - MUST match exactly
3. If the change affects a specific variable, include its ID (targetVariableId)
4. Assign a confidence level:
   - HIGH: Explicit numeric change with clear before/after values (e.g., "Interest Rate: 5.5% → 6.5%")
   - MEDIUM: Text changes or ambiguous wording that likely represents a change
   - LOW: Inferred changes, unclear intent, or cannot definitively match to existing structure
5. Extract values:
   - baselineValue: The original approved value from the current document
   - currentValue: The current draft value (may equal baseline if unchanged)
   - proposedValue: The new value being proposed in the markup
6. Optionally provide a brief changeDescription explaining the change

IMPORTANT RULES:
- Only include changes that can be mapped to existing clauses/variables
- If you cannot find a matching clause/variable, assign LOW confidence and use the closest match
- For numeric values, extract just the number (e.g., "5.5" not "5.5% per annum")
- For text changes, include the full proposed text as proposedValue
- Be conservative with HIGH confidence - only use when change is unambiguous

RESPONSE FORMAT:
Respond with valid JSON matching this exact schema:
${JSON.stringify(zodToJsonSchema(aiReconciliationResultSchema), null, 2)}`;

// ============================================
// PARSER FUNCTION
// ============================================

/**
 * Parse incoming markup document and extract reconciliation suggestions
 * by comparing against existing workspace clauses and variables
 */
export async function parseReconciliationChanges(
  input: ReconciliationInput
): Promise<AIReconciliationResult> {
  // Build the user prompt with current document structure
  const currentDocJson = JSON.stringify(
    input.currentDocument.clauses.map((c) => ({
      id: c.id,
      title: c.title,
      body: c.body.substring(0, 500) + (c.body.length > 500 ? '...' : ''), // Truncate long bodies
      type: c.type,
      order: c.order,
      variables: c.variables.map((v) => ({
        id: v.id,
        label: v.label,
        type: v.type,
        value: v.value,
        unit: v.unit,
        baselineValue: v.baselineValue,
      })),
    })),
    null,
    2
  );

  const userPrompt = `
CURRENT LOAN AGREEMENT STRUCTURE:
${currentDocJson}

INCOMING MARKUP DOCUMENT:
File: ${input.incomingDocument.fileName} (${input.incomingDocument.fileType})

Content:
${input.incomingDocument.text}

---
Analyze the incoming document and extract ALL proposed changes. Map each change to the corresponding clause and variable in the current document structure. Return your analysis as valid JSON.
`;

  const { text } = await generateText({
    model: openrouter(`${process.env.ANSWER_MODEL || 'google/gemini-3-flash-preview'}`),
    system: RECONCILIATION_SYSTEM_PROMPT,
    prompt: userPrompt,
    temperature: 0.1,
    maxOutputTokens: 12000,
  });

  // Parse JSON from response (remove markdown code blocks if present)
  let jsonText = text.trim();
  if (jsonText.startsWith('```')) {
    const match = jsonText.match(/```(?:json)?\n([\s\S]*?)\n```/);
    if (match) {
      jsonText = match[1];
    }
  }

  const parsed = JSON.parse(jsonText);

  // Validate against schema
  const result = aiReconciliationResultSchema.parse(parsed);

  return result;
}

/**
 * Validate that suggested clause/variable IDs exist in the document
 * Returns filtered suggestions with only valid references
 */
export function validateSuggestionReferences(
  suggestions: AIReconciliationResult['suggestions'],
  clauses: ClauseWithVariables[]
): AIReconciliationResult['suggestions'] {
  const clauseIds = new Set(clauses.map((c) => c.id));
  const variableIds = new Set(clauses.flatMap((c) => c.variables.map((v) => v.id)));

  return suggestions.filter((suggestion) => {
    // Must have valid clause ID
    if (!clauseIds.has(suggestion.targetClauseId)) {
      console.warn(`Invalid clause ID in suggestion: ${suggestion.targetClauseId}`);
      return false;
    }

    // If variable ID specified, must be valid
    if (suggestion.targetVariableId && !variableIds.has(suggestion.targetVariableId)) {
      console.warn(`Invalid variable ID in suggestion: ${suggestion.targetVariableId}`);
      return false;
    }

    return true;
  });
}
