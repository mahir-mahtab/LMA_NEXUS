import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import { aiParseResultSchema, AIParseResult } from './schemas.js';
import { zodToJsonSchema } from 'zod-to-json-schema';



const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const SYSTEM_PROMPT = `You are a legal document parser specializing in loan agreements. Extract structured clause information from the provided text.

For each clause:
1. Capture the title and body exactly as they appear.
2. Classify the clause type: 'financial', 'covenant', 'definition', 'xref', or 'general'.
3. Flag whether it includes sensitive information (PII, confidential terms).
4. Preserve its order in the source document.

For variables (extract from financial and covenant clauses):
- Extract all financial terms, amounts, rates, ratios, and dates as separate variables.
- Each variable must reference its parent clause via clauseIndex.
- Types: 'financial' (amounts, fees), 'definition' (defined terms), 'covenant' (covenant thresholds), 'ratio' (financial ratios like leverage).
- Include the unit where applicable (USD, EUR, bps, %, x for ratios).
- Set baselineValue equal to value initially (this becomes the approved baseline for drift detection).

For covenants (extract from covenant-type clauses):
- Extract all financial covenant definitions with their testing requirements.
- Each covenant must reference its source clause via clauseIndex.
- Capture: name (e.g., "Leverage Ratio"), testFrequency (e.g., "Quarterly", "Semi-annually"), threshold (e.g., "< 3.5x", ">= 1.25x"), calculationBasis (the full calculation formula or definition).

For graph nodes:
- Provide at least one node per clause, but add extra nodes when a clause contains multiple salient elements (e.g., a numeric obligation plus a defined term).
- Each node should reference the clause via clauseIndex.
- If a node represents a variable, also set variableIndex to link to the variables array.
- The value field should hold the most relevant number or textual datum from that node, if any.

For graph edges:
- Link nodes that reference one another, express dependencies, or reuse definitions; cross-references must become edges between the referenced nodes and the referencing nodes.
- Ensure edges reflect the direction or logical flow you infer, so definitions used by another clause point from the dependent node to the definition node.
- Weigh each edge based on the significance of the relationship (default weight is 1 if unsure).

You MUST respond with valid JSON matching this exact schema:
${JSON.stringify(zodToJsonSchema(aiParseResultSchema), null, 2)}`;

export async function parseClausesFromText(txtContent: string): Promise<AIParseResult> {
  const { text } = await generateText({
    model: openrouter(`${process.env.ANSWER_MODEL || "google/gemini-3-flash-preview"}`),
    system: SYSTEM_PROMPT,
    prompt: `Parse the following document text into structured clauses. Return ONLY valid JSON, no markdown or code blocks:\n\n${txtContent}`,
    temperature: 0.1,
    maxOutputTokens:20000,
    
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
  const result = aiParseResultSchema.parse(parsed);
  
  return result;
}
