import { parseClausesFromText } from './clauseParser.js';
import { config } from 'dotenv';

// Load environment variables
config();

const sampleClausesText = `
1. INTEREST RATE
The Borrower shall pay interest on the outstanding principal amount at a rate of 5.5% per annum, calculated on a 360-day year basis.

2. FINANCIAL COVENANT - DEBT SERVICE COVERAGE RATIO
The Borrower shall maintain a Debt Service Coverage Ratio of not less than 1.25:1, tested quarterly on the last day of each fiscal quarter.

3. DEFINITION - EBITDA
"EBITDA" means, for any period, the consolidated earnings before interest, taxes, depreciation, and amortization of the Borrower and its subsidiaries.

4. CROSS REFERENCE - DEFAULT PROVISIONS
In the event of a breach of any financial covenant set forth in Section 2, the provisions of Article 8 (Events of Default) shall apply.

5. PREPAYMENT
The Borrower may prepay the Loan in whole or in part at any time without premium or penalty, provided that written notice is given to the Lender at least 30 days prior to the prepayment date.
`;

async function testAIParsing() {
  console.log('🧪 Testing AI Clause Parsing...\n');
  console.log('Sample Text:');
  console.log(sampleClausesText);
  console.log('\n' + '='.repeat(60) + '\n');

  try {
    console.log('📡 Calling AI to parse clauses...\n');
    const result = await parseClausesFromText(sampleClausesText);

    console.log('✅ AI Parse Result:\n');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`  - Clauses found: ${result.clauses.length}`);
    console.log(`  - Variables found: ${result.variables.length}`);
    console.log(`  - Covenants found: ${result.covenants.length}`);
    console.log(`  - Graph nodes: ${result.graphNodes.length}`);
    console.log(`  - Graph edges: ${result.graphEdges.length}`);
    console.log(`  - Integrity score: ${result.integrityScore}`);

    console.log('\n📝 Clause Types:');
    result.clauses.forEach((clause, idx) => {
      console.log(`  ${idx + 1}. ${clause.title} -> ${clause.type}`);
    });

    console.log('\n💰 Variables:');
    result.variables.forEach((variable, idx) => {
      const clause = result.clauses[variable.clauseIndex];
      console.log(`  ${idx + 1}. ${variable.label}: ${variable.value}${variable.unit || ''} (${variable.type}) [Clause: ${clause?.title || 'N/A'}]`);
    });

    console.log('\n📋 Covenants:');
    result.covenants.forEach((covenant, idx) => {
      const clause = result.clauses[covenant.clauseIndex];
      console.log(`  ${idx + 1}. ${covenant.name}`);
      console.log(`     - Threshold: ${covenant.threshold}`);
      console.log(`     - Test Frequency: ${covenant.testFrequency}`);
      console.log(`     - Source Clause: ${clause?.title || 'N/A'}`);
    });

    console.log('\n🔗 Graph Connections:');
    result.graphEdges.forEach((edge, idx) => {
      const sourceNode = result.graphNodes[edge.sourceNodeIndex];
      const targetNode = result.graphNodes[edge.targetNodeIndex];
      console.log(`  ${idx + 1}. ${sourceNode?.label} -> ${targetNode?.label} (weight: ${edge.weight})`);
    });

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
testAIParsing().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
