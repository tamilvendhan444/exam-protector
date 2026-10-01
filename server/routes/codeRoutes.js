import express from 'express';
import { runCodeAgainstCases, evaluateSubmission } from '../services/codeExecutionService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Run code against test cases (Interactive sandbox execution in Monaco Editor)
router.post('/run', authenticate, async (req, res) => {
  try {
    const { language, code, testCases = [], customInput } = req.body;

    if (code === undefined || code === null || !language) {
      return res.status(400).json({ success: false, message: 'Code and language are required.' });
    }

    let casesToRun = testCases;
    if (customInput !== undefined && customInput !== null && customInput.trim()) {
      casesToRun = [{
        input: customInput,
        expectedOutput: '',
        isHidden: false
      }];
    }

    if (casesToRun.length === 0) {
      casesToRun = [{ input: '', expectedOutput: '', isHidden: false }];
    }

    const result = await runCodeAgainstCases({
      language,
      code,
      testCases: casesToRun,
      timeLimitMs: 3000
    });
    console.log('[DEBUG-CHECKPOINT-1] /api/code/run response result:', typeof result, result !== null ? Object.keys(result) : null);

    return res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error('Code execution error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Execution failed.'
    });
  }
});

// Submit code for grading against full test suite
router.post('/submit', authenticate, async (req, res) => {
  try {
    const { examId, attemptId, questionId, code, language } = req.body;

    if (!questionId || code === undefined || code === null || !language) {
      return res.status(400).json({ success: false, message: 'QuestionId, code, and language required.' });
    }

    const submissionResult = await evaluateSubmission({
      studentId: req.user.id,
      examId,
      attemptId,
      questionId,
      code,
      language
    });

    return res.json({
      success: true,
      message: 'Code evaluated',
      ...submissionResult
    });
  } catch (err) {
    console.error('Submission error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Evaluation failed.' });
  }
});

export default router;
