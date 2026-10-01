import { executeCode } from '../../code-execution/executor.js';
import { Submission, Question, ExamAttempt } from '../models/schemas.js';

export async function runCodeAgainstCases({ language, code = '', testCases, timeLimitMs = 2000 }) {
  if (code === undefined || code === null || !language) {
    throw new Error('Code and language are required.');
  }

  const result = await executeCode({
    language,
    code,
    testCases,
    timeLimitMs
  });

  return result;
}

export async function evaluateSubmission({
  studentId,
  examId,
  attemptId,
  questionId,
  code,
  language
}) {
  const question = await Question.findById(questionId);
  if (!question) {
    throw new Error('Question not found');
  }

  const testCases = question.testCases || [];
  const result = await executeCode({
    language,
    code,
    testCases,
    timeLimitMs: question.timeLimitMs || 2000
  });

  // Calculate score based on proportion of passed test cases
  const total = testCases.length || 1;
  const passed = result.passedTestCases || 0;
  const maxMarks = question.marks || 10;
  const earnedMarks = Math.round((passed / total) * maxMarks);

  // Save submission document
  const submission = await Submission.create({
    studentId,
    examId,
    attemptId,
    questionId,
    code,
    language,
    status: result.status,
    allPassed: result.allPassed,
    passedTestCases: passed,
    totalTestCases: total,
    results: result.results,
    executionTimeMs: result.averageExecutionTimeMs || 15
  });

  // If tied to an active ExamAttempt, update answer slot & codingPerformance stats
  if (attemptId) {
    try {
      const attempt = await ExamAttempt.findById(attemptId);
      if (attempt) {
        const answers = attempt.answers || [];
        const idx = answers.findIndex(a => String(a.questionId) === String(questionId));
        const updatedAns = {
          questionId: String(questionId),
          type: 'coding',
          codeAnswer: code,
          language,
          status: 'answered',
          isCorrect: result.allPassed,
          score: earnedMarks,
          passedTestCases: passed,
          totalTestCases: total,
          autoSavedAt: new Date()
        };

        if (idx !== -1) {
          answers[idx] = { ...answers[idx], ...updatedAns };
        } else {
          answers.push(updatedAns);
        }

        const codingPerformance = attempt.codingPerformance || {};
        codingPerformance.submissionCount = (codingPerformance.submissionCount || 0) + 1;
        if (result.status === 'Compilation Error') {
          codingPerformance.compilationErrors = (codingPerformance.compilationErrors || 0) + 1;
        }

        await ExamAttempt.findByIdAndUpdate(attemptId, {
          answers,
          codingPerformance
        });
      }
    } catch (err) {
      console.error('[codeExecutionService] Error updating attempt answer:', err.message);
    }
  }

  return {
    submissionId: submission._id || submission.id,
    status: result.status,
    message: result.message,
    stdout: result.stdout,
    stderr: result.stderr,
    allPassed: result.allPassed,
    passedTestCases: passed,
    totalTestCases: total,
    earnedMarks,
    maxMarks,
    results: result.results.map(r => ({
      testCaseIndex: r.testCaseIndex,
      status: r.status,
      input: r.isHidden ? '[Hidden Test Case]' : r.input,
      expectedOutput: r.isHidden ? '[Hidden]' : r.expectedOutput,
      actualOutput: r.isHidden ? (r.passed ? '[Passed]' : '[Hidden Failed]') : r.actualOutput,
      error: r.error,
      passed: r.passed,
      executionTimeMs: r.executionTimeMs,
      isHidden: r.isHidden
    })),
    averageExecutionTimeMs: result.averageExecutionTimeMs,
    maxMemoryKb: result.maxMemoryKb
  };
}
