const { extractDocumentText } = require('./ai/visionService');
const { normalizeTests, generateSummary } = require('./ai/geminiService');
const { checkHallucination } = require('../utils/guardrails');
const tracer = require('../utils/tracer');

const processReport = async (req) => {
  let rawText, rawTests, confidence;

  // Step 1: Text Extraction (from file or body)
  tracer.log('SERVICE', 'Step 1: Extracting text from input...');
  if (req.file) {
    const visionResult = await extractDocumentText(req.file.buffer);
    rawText = visionResult.fullText;
    rawTests = visionResult.rawTests;
    confidence = visionResult.confidence;
  } else if (req.body.text) {
    rawText = req.body.text;
    rawTests = rawText.split(',').map(t => t.trim());
    confidence = 1.0;
  } else {
    throw new Error('Invalid input. Please provide a file or text.');
  }

  // Step 2: Normalization
  tracer.log('SERVICE', 'Step 2: Normalizing tests...');
  const { tests, normalizationConfidence } = await normalizeTests(rawText);
  
  // Step 3: Guardrail Implementation
  tracer.log('SERVICE', 'Step 3: Checking for hallucinations...');
  if (!checkHallucination(rawText, tests)) {
    const result = { status: 'unprocessed', reason: 'hallucinated tests not present in input' };
    tracer.log('RESULT', `Final Output: ${JSON.stringify(result, null, 2)}`);
    return result;
  }

  // Step 4: Summary Generation
  tracer.log('SERVICE', 'Step 4: Generating patient-friendly summary...');
  const { summary, explanations } = await generateSummary(tests);

  // Final Output
  const finalOutput = {
    status: 'ok',
    tests,
    summary,
    explanations,
    confidence,
    normalizationConfidence,
  };

  tracer.log('RESULT', `Final Output: ${JSON.stringify(finalOutput, null, 2)}`);

  return finalOutput;
};

module.exports = { processReport };
