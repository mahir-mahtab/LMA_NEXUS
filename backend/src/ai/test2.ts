import { parseReconciliationChanges, validateSuggestionReferences, ReconciliationInput } from './reconciliationParser.js';
import { config } from 'dotenv';

// Load environment variables
config();

// Sample current document with clauses and variables
const sampleCurrentDocument: ReconciliationInput['currentDocument'] = {
    clauses: [
        {
            id: 'clause-001',
            title: 'Interest Rate',
            body: 'The Borrower shall pay interest on the outstanding principal amount at a rate of 5.5% per annum, calculated on a 360-day year basis.',
            type: 'financial',
            order: 1,
            variables: [
                {
                    id: 'var-001',
                    label: 'Interest Rate',
                    type: 'financial',
                    value: '5.5',
                    unit: '%',
                    baselineValue: '5.5',
                },
                {
                    id: 'var-002',
                    label: 'Day Count Basis',
                    type: 'financial',
                    value: '360',
                    unit: 'days',
                    baselineValue: '360',
                },
            ],
        },
        {
            id: 'clause-002',
            title: 'Debt Service Coverage Ratio',
            body: 'The Borrower shall maintain a Debt Service Coverage Ratio of not less than 1.25:1, tested quarterly on the last day of each fiscal quarter.',
            type: 'covenant',
            order: 2,
            variables: [
                {
                    id: 'var-003',
                    label: 'DSCR Minimum',
                    type: 'ratio',
                    value: '1.25',
                    unit: ':1',
                    baselineValue: '1.25',
                },
                {
                    id: 'var-004',
                    label: 'DSCR Test Frequency',
                    type: 'covenant',
                    value: 'quarterly',
                    unit: null,
                    baselineValue: 'quarterly',
                },
            ],
        },
        {
            id: 'clause-003',
            title: 'Loan Amount',
            body: 'The aggregate principal amount of the Loan shall not exceed $10,000,000 (Ten Million Dollars).',
            type: 'financial',
            order: 3,
            variables: [
                {
                    id: 'var-005',
                    label: 'Principal Amount',
                    type: 'financial',
                    value: '10000000',
                    unit: 'USD',
                    baselineValue: '10000000',
                },
            ],
        },
        {
            id: 'clause-004',
            title: 'Prepayment Terms',
            body: 'The Borrower may prepay the Loan in whole or in part at any time without premium or penalty, provided that written notice is given to the Lender at least 30 days prior to the prepayment date.',
            type: 'general',
            order: 4,
            variables: [
                {
                    id: 'var-006',
                    label: 'Prepayment Notice Period',
                    type: 'financial',
                    value: '30',
                    unit: 'days',
                    baselineValue: '30',
                },
            ],
        },
    ],
};

// Sample incoming markup document with proposed changes
const sampleIncomingDocument: ReconciliationInput['incomingDocument'] = {
    fileName: 'LoanAgreement_Amendment_v2.pdf',
    fileType: 'pdf',
    text: `
PROPOSED AMENDMENTS TO LOAN AGREEMENT
Date: January 10, 2026

The following amendments are proposed to the Loan Agreement dated January 1, 2025:

1. INTEREST RATE ADJUSTMENT
   Section 1 - Interest Rate: The interest rate shall be increased from 5.5% to 6.25% per annum, effective from the Amendment Date.

2. DEBT SERVICE COVERAGE RATIO MODIFICATION
   Section 2 - DSCR Covenant: The minimum Debt Service Coverage Ratio requirement shall be reduced from 1.25:1 to 1.15:1 to provide additional flexibility during the construction phase.

3. LOAN AMOUNT INCREASE
   Section 3 - Principal Amount: The aggregate principal amount of the Loan shall be increased from $10,000,000 to $12,500,000 to accommodate additional project costs.

4. PREPAYMENT NOTICE PERIOD
   Section 4 - Prepayment: The prepayment notice period shall be reduced from 30 days to 15 days.

All other terms and conditions of the Loan Agreement shall remain in full force and effect.

SIGNATURES
[Signature blocks to follow]
`,
};

async function testReconciliationParsing() {
    console.log('🧪 Testing AI Reconciliation Parsing...\n');
    console.log('📄 Current Document Structure:');
    console.log('='.repeat(60));
    sampleCurrentDocument.clauses.forEach((clause) => {
        console.log(`\n  📌 ${clause.title} (${clause.id})`);
        console.log(`     Type: ${clause.type}`);
        console.log('     Variables:');
        clause.variables.forEach((v) => {
            console.log(`       - ${v.label}: ${v.value}${v.unit || ''} (${v.id})`);
        });
    });

    console.log('\n' + '='.repeat(60));
    console.log('📨 Incoming Markup Document:');
    console.log(`   File: ${sampleIncomingDocument.fileName}`);
    console.log(`   Type: ${sampleIncomingDocument.fileType}`);
    console.log('\n' + sampleIncomingDocument.text);
    console.log('='.repeat(60) + '\n');

    try {
        console.log('📡 Calling AI to parse reconciliation changes...\n');

        const input: ReconciliationInput = {
            currentDocument: sampleCurrentDocument,
            incomingDocument: sampleIncomingDocument,
        };

        const result = await parseReconciliationChanges(input);

        console.log('✅ AI Reconciliation Result:\n');
        console.log(JSON.stringify(result, null, 2));

        console.log('\n' + '='.repeat(60));
        console.log('📊 Summary:');
        console.log(`  - Total suggestions: ${result.suggestions.length}`);
        console.log(`  - Parsing confidence: ${result.parsingConfidence ?? 'N/A'}`);
        if (result.summary) {
            console.log(`  - AI Summary: ${result.summary}`);
        }

        // Breakdown by confidence level
        const highConfidence = result.suggestions.filter((s) => s.confidence === 'HIGH');
        const mediumConfidence = result.suggestions.filter((s) => s.confidence === 'MEDIUM');
        const lowConfidence = result.suggestions.filter((s) => s.confidence === 'LOW');

        console.log('\n📈 Confidence Breakdown:');
        console.log(`  - HIGH: ${highConfidence.length}`);
        console.log(`  - MEDIUM: ${mediumConfidence.length}`);
        console.log(`  - LOW: ${lowConfidence.length}`);

        console.log('\n📝 Detailed Suggestions:');
        result.suggestions.forEach((suggestion, idx) => {
            console.log(`\n  ${idx + 1}. Change to Clause: ${suggestion.targetClauseId}`);
            if (suggestion.targetVariableId) {
                console.log(`     Variable: ${suggestion.targetVariableId}`);
            }
            console.log(`     Confidence: ${suggestion.confidence}`);
            console.log(`     Baseline: ${suggestion.baselineValue}`);
            console.log(`     Current: ${suggestion.currentValue}`);
            console.log(`     Proposed: ${suggestion.proposedValue}`);
            if (suggestion.changeDescription) {
                console.log(`     Description: ${suggestion.changeDescription}`);
            }
            console.log(`     Snippet: "${suggestion.incomingSnippet.substring(0, 80)}..."`);
        });

        // Validate references
        console.log('\n🔍 Validating Suggestion References...');
        const validatedSuggestions = validateSuggestionReferences(
            result.suggestions,
            sampleCurrentDocument.clauses
        );
        console.log(`  - Valid suggestions: ${validatedSuggestions.length}/${result.suggestions.length}`);

        if (validatedSuggestions.length < result.suggestions.length) {
            console.log('  ⚠️ Some suggestions had invalid clause/variable references');
        }

        console.log('\n✅ Test passed! Schema validation successful.');
    } catch (error: any) {
        console.error('\n❌ Test failed!');
        console.error('Error:', error.message);
        if (error.errors) {
            console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
        }
        process.exit(1);
    }
}

// Run test
testReconciliationParsing().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
