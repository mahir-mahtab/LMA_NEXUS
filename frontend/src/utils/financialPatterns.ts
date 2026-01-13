/**
 * Financial Pattern Detection Utilities
 * Requirements: 4.6
 */

export interface FinancialPattern {
  pattern: string;
  value: string;
  unit?: string;
  type: 'percentage' | 'basis_points' | 'multiple' | 'currency';
  startIndex: number;
  endIndex: number;
}

/**
 * Regular expressions for detecting financial patterns
 */
const FINANCIAL_PATTERNS = [
  // Percentage patterns: 2.5%, 10.25%, etc.
  {
    regex: /(\d+(?:\.\d+)?)\s*%/gi,
    type: 'percentage' as const,
    unit: '%',
  },
  // Basis points: 250bps, 25 bps, etc.
  {
    regex: /(\d+(?:\.\d+)?)\s*(?:bps|basis\s+points?)/gi,
    type: 'basis_points' as const,
    unit: 'bps',
  },
  // Multiples: 2.5x, 3.0x, etc.
  {
    regex: /(\d+(?:\.\d+)?)\s*x/gi,
    type: 'multiple' as const,
    unit: 'x',
  },
  // Euro currency: €1,000,000, € 1000000, etc.
  {
    regex: /€\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)/gi,
    type: 'currency' as const,
    unit: 'EUR',
  },
  // Dollar currency: $1,000,000, $ 1000000, etc.
  {
    regex: /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)/gi,
    type: 'currency' as const,
    unit: 'USD',
  },
  // Pound currency: £1,000,000, £ 1000000, etc.
  {
    regex: /£\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)/gi,
    type: 'currency' as const,
    unit: 'GBP',
  },
];

/**
 * Detect financial patterns in text
 */
export function detectFinancialPatterns(text: string): FinancialPattern[] {
  const patterns: FinancialPattern[] = [];

  for (const patternDef of FINANCIAL_PATTERNS) {
    let match;
    const regex = new RegExp(patternDef.regex.source, patternDef.regex.flags);
    
    while ((match = regex.exec(text)) !== null) {
      const fullMatch = match[0];
      const value = match[1];
      
      patterns.push({
        pattern: fullMatch,
        value: value,
        unit: patternDef.unit,
        type: patternDef.type,
        startIndex: match.index,
        endIndex: match.index + fullMatch.length,
      });
    }
  }

  // Sort by position in text
  return patterns.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Check if text contains new financial patterns compared to previous text
 */
export function hasNewFinancialPatterns(
  currentText: string, 
  previousText: string
): FinancialPattern[] {
  const currentPatterns = detectFinancialPatterns(currentText);
  const previousPatterns = detectFinancialPatterns(previousText);

  // Find patterns that are new (not in previous text)
  return currentPatterns.filter(current => {
    return !previousPatterns.some(previous => 
      previous.pattern === current.pattern &&
      previous.startIndex === current.startIndex
    );
  });
}

/**
 * Get suggested variable label for a financial pattern
 */
export function getSuggestedVariableLabel(pattern: FinancialPattern): string {
  switch (pattern.type) {
    case 'percentage':
      return `Rate ${pattern.value}%`;
    case 'basis_points':
      return `Spread ${pattern.value}bps`;
    case 'multiple':
      return `Multiple ${pattern.value}x`;
    case 'currency':
      return `Amount ${pattern.unit} ${pattern.value}`;
    default:
      return `Value ${pattern.value}`;
  }
}

/**
 * Get suggested variable type for a financial pattern
 */
export function getSuggestedVariableType(pattern: FinancialPattern): 'financial' | 'covenant' | 'ratio' {
  switch (pattern.type) {
    case 'percentage':
    case 'basis_points':
    case 'currency':
      return 'financial';
    case 'multiple':
      return 'ratio';
    default:
      return 'financial';
  }
}