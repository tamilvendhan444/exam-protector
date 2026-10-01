/**
 * Plagiarism & Code-Similarity Detection Engine
 * Implements token-based AST normalization and MOSS-style Winnowing algorithm
 * for robust, whitespace/rename-invariant code similarity detection.
 */

import { Exam, ExamAttempt, Question, ProctoringEvent } from '../models/schemas.js';

// Reserved language keywords preserved during tokenization
const RESERVED_KEYWORDS = new Set([
  // C / C++ / Java
  'int', 'float', 'double', 'char', 'bool', 'boolean', 'void', 'long', 'short',
  'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return',
  'class', 'struct', 'public', 'private', 'protected', 'static', 'const', 'new', 'delete',
  'vector', 'string', 'map', 'set', 'unordered_map', 'unordered_set', 'pair', 'queue', 'stack',
  'cin', 'cout', 'endl', 'include', 'namespace', 'std', 'import', 'package',
  // Python
  'def', 'class', 'elif', 'try', 'except', 'finally', 'with', 'as', 'in', 'is', 'not', 'and', 'or',
  'lambda', 'pass', 'raise', 'from', 'global', 'nonlocal', 'yield', 'print', 'range', 'len', 'enumerate',
  // JavaScript
  'function', 'var', 'let', 'const', 'typeof', 'instanceof', 'async', 'await', 'export', 'null', 'undefined'
]);

/**
 * 1. Normalize and tokenize source code
 * Removes comments, strings, numeric constants, and replaces arbitrary identifiers with generic 'ID'
 */
export function tokenizeCode(sourceCode = '', language = 'cpp') {
  if (!sourceCode || typeof sourceCode !== 'string') return [];

  // 1. Strip comments
  let clean = sourceCode
    // Multi-line comments /* ... */
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    // Single-line comments // ...
    .replace(/\/\/[^\r\n]*/g, ' ')
    // Python triple-quoted strings/comments
    .replace(/('''[\s\S]*?'''|"""[\s\S]*?""")/g, ' ')
    // Python single-line comments # ...
    .replace(/#[^\r\n]*/g, ' ');

  // 2. Tokenize into lexical units
  const rawTokens = clean.match(/[a-zA-Z_]\w*|\d+(?:\.\d+)?|"[^"]*"|'[^']*'|[+\-*/%=<>!&|^~?:;.,(){}[\]]/g) || [];

  const tokens = [];
  for (const raw of rawTokens) {
    // String literal -> 'STR'
    if (raw.startsWith('"') || raw.startsWith("'")) {
      tokens.push('STR');
    }
    // Number -> 'NUM'
    else if (/^\d+(?:\.\d+)?$/.test(raw)) {
      tokens.push('NUM');
    }
    // Reserved Keyword -> keep keyword
    else if (RESERVED_KEYWORDS.has(raw.toLowerCase())) {
      tokens.push(raw.toLowerCase());
    }
    // Generic identifier (variable/function name) -> 'ID'
    else if (/^[a-zA-Z_]\w*$/.test(raw)) {
      tokens.push('ID');
    }
    // Operator or delimiter
    else {
      tokens.push(raw);
    }
  }

  return tokens;
}

/**
 * 2. Rolling Polynomial Hash (Rabin-Karp Style)
 */
function hashString(str) {
  let hash = 0;
  const p = 31;
  const m = 1e9 + 9;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * p + str.charCodeAt(i)) % m;
  }
  return hash;
}

/**
 * 3. Generate K-Grams from token stream
 */
function generateKGrams(tokens, k = 12) {
  if (tokens.length < k) {
    return tokens.length > 0 ? [{ hash: hashString(tokens.join(' ')), pos: 0, text: tokens.join(' ') }] : [];
  }

  const kgrams = [];
  for (let i = 0; i <= tokens.length - k; i++) {
    const slice = tokens.slice(i, i + k).join(' ');
    kgrams.push({
      hash: hashString(slice),
      pos: i,
      text: slice
    });
  }
  return kgrams;
}

/**
 * 4. Winnowing Algorithm to select robust fingerprint set
 * @param {Array} kgrams - Array of { hash, pos, text }
 * @param {number} w - Window size (e.g. 6)
 */
export function winnow(kgrams, w = 6) {
  if (!kgrams || kgrams.length === 0) return [];
  if (kgrams.length <= w) {
    let minKg = kgrams[0];
    for (let i = 1; i < kgrams.length; i++) {
      if (kgrams[i].hash <= minKg.hash) minKg = kgrams[i];
    }
    return [minKg];
  }

  const fingerprints = [];
  let minIdx = -1;

  for (let i = 0; i <= kgrams.length - w; i++) {
    let windowMin = kgrams[i];
    let windowMinIdx = i;

    for (let j = 1; j < w; j++) {
      const current = kgrams[i + j];
      if (current.hash <= windowMin.hash) {
        windowMin = current;
        windowMinIdx = i + j;
      }
    }

    if (windowMinIdx !== minIdx) {
      minIdx = windowMinIdx;
      fingerprints.push(windowMin);
    }
  }

  return fingerprints;
}

/**
 * 5. Compare two code submissions
 * Returns detailed similarity percentage and overlapping fingerprints
 */
export function compareCodeSubmissions(codeA = '', codeB = '', langA = 'cpp', langB = 'cpp') {
  if (!codeA || !codeB || codeA.trim().length < 15 || codeB.trim().length < 15) {
    return { similarity: 0, jaccard: 0, matchCount: 0, totalA: 0, totalB: 0 };
  }

  const tokensA = tokenizeCode(codeA, langA);
  const tokensB = tokenizeCode(codeB, langB);

  const kgramsA = generateKGrams(tokensA, 10);
  const kgramsB = generateKGrams(tokensB, 10);

  const fpA = winnow(kgramsA, 5);
  const fpB = winnow(kgramsB, 5);

  if (fpA.length === 0 || fpB.length === 0) {
    return { similarity: 0, jaccard: 0, matchCount: 0, totalA: 0, totalB: 0 };
  }

  const setA = new Set(fpA.map(f => f.hash));
  const setB = new Set(fpB.map(f => f.hash));

  let common = 0;
  for (const h of setA) {
    if (setB.has(h)) common++;
  }

  const union = new Set([...setA, ...setB]).size;
  const jaccard = union > 0 ? (common / union) : 0;
  const minContainment = Math.min(setA.size, setB.size) > 0
    ? (common / Math.min(setA.size, setB.size))
    : 0;

  // Composite similarity score weighting containment and Jaccard
  const similarityScore = Math.min(100, Math.round((0.4 * jaccard + 0.6 * minContainment) * 100));

  return {
    similarity: similarityScore,
    jaccard: Math.round(jaccard * 100),
    containment: Math.round(minContainment * 100),
    matchCount: common,
    totalA: setA.size,
    totalB: setB.size
  };
}

/**
 * 6. Run full similarity scan across all student submissions in an exam
 * Flags pairs exceeding similarity threshold and generates proctoring incidents
 */
export async function runPlagiarismScanForExam(examId, threshold = 65) {
  const exam = await Exam.findById(examId);
  if (!exam) throw new Error('Exam not found');

  const attempts = await ExamAttempt.find({ examId });
  const questions = await Question.find({ _id: { $in: exam.questionIds || [] } });
  const codingQuestions = questions.filter(q => q.type === 'coding');

  const flaggedPairs = [];
  const similarityMatrix = [];

  // Loop over each coding question
  for (const q of codingQuestions) {
    const qIdStr = String(q._id || q.id);

    // Extract all non-empty code submissions for this question
    const submissions = [];
    for (const att of attempts) {
      const ans = (att.answers || []).find(a => String(a.questionId) === qIdStr);
      if (ans && ans.codeAnswer && ans.codeAnswer.trim().length > 20) {
        submissions.push({
          attemptId: String(att._id || att.id),
          studentId: String(att.studentId),
          studentName: att.studentName || 'Student',
          studentEmail: att.studentEmail,
          code: ans.codeAnswer,
          language: ans.language || 'cpp'
        });
      }
    }

    // Pairwise comparison (N * (N - 1) / 2)
    for (let i = 0; i < submissions.length; i++) {
      for (let j = i + 1; j < submissions.length; j++) {
        const subA = submissions[i];
        const subB = submissions[j];

        // Skip same student
        if (subA.studentId === subB.studentId) continue;

        const result = compareCodeSubmissions(subA.code, subB.code, subA.language, subB.language);

        similarityMatrix.push({
          questionId: qIdStr,
          questionTitle: q.title,
          studentA: { id: subA.studentId, name: subA.studentName, attemptId: subA.attemptId },
          studentB: { id: subB.studentId, name: subB.studentName, attemptId: subB.attemptId },
          similarity: result.similarity,
          matchCount: result.matchCount
        });

        // If similarity exceeds threshold, record a flagged pair
        if (result.similarity >= threshold) {
          const severity = result.similarity >= 85 ? 'critical' : 'high';

          flaggedPairs.push({
            questionId: qIdStr,
            questionTitle: q.title,
            studentA: subA,
            studentB: subB,
            similarity: result.similarity,
            severity
          });

          // Create or update Proctoring Incident for Student A
          await recordPlagiarismIncident({
            examId,
            attemptId: subA.attemptId,
            studentId: subA.studentId,
            studentName: subA.studentName,
            peerStudentId: subB.studentId,
            peerStudentName: subB.studentName,
            questionTitle: q.title,
            similarity: result.similarity,
            severity,
            codeA: subA.code,
            codeB: subB.code
          });

          // Create or update Proctoring Incident for Student B
          await recordPlagiarismIncident({
            examId,
            attemptId: subB.attemptId,
            studentId: subB.studentId,
            studentName: subB.studentName,
            peerStudentId: subA.studentId,
            peerStudentName: subA.studentName,
            questionTitle: q.title,
            similarity: result.similarity,
            severity,
            codeA: subB.code,
            codeB: subA.code
          });
        }
      }
    }
  }

  return {
    examId,
    examTitle: exam.title,
    scannedQuestionsCount: codingQuestions.length,
    totalComparisons: similarityMatrix.length,
    flaggedPairsCount: flaggedPairs.length,
    flaggedPairs,
    similarityMatrix
  };
}

/**
 * Record plagiarism proctoring event in database
 */
async function recordPlagiarismIncident({
  examId,
  attemptId,
  studentId,
  studentName,
  peerStudentId,
  peerStudentName,
  questionTitle,
  similarity,
  severity,
  codeA,
  codeB
}) {
  const details = `High code similarity (${similarity}%) detected with candidate ${peerStudentName} on question "${questionTitle}".`;

  // Check if identical incident already logged
  const existing = await ProctoringEvent.findOne({
    examAttemptId: attemptId,
    eventType: 'code_plagiarism',
    'metadata.peerStudentId': peerStudentId,
    'metadata.questionTitle': questionTitle
  });

  if (existing) {
    // Update confidence / similarity if re-scanned
    await ProctoringEvent.findByIdAndUpdate(existing._id || existing.id, {
      confidence: similarity / 100,
      severity,
      details,
      metadata: {
        peerStudentId,
        peerStudentName,
        questionTitle,
        similarity,
        codeA,
        codeB
      }
    });
    return existing;
  }

  const newEvent = await ProctoringEvent.create({
    eventId: 'ev_plag_' + Math.random().toString(36).substr(2, 9),
    examId,
    examAttemptId: attemptId,
    studentId,
    studentName,
    eventType: 'code_plagiarism',
    severity,
    confidence: similarity / 100,
    details,
    metadata: {
      peerStudentId,
      peerStudentName,
      questionTitle,
      similarity,
      codeA,
      codeB
    },
    status: 'New'
  });

  // Update attempt proctoring summary
  const attempt = await ExamAttempt.findById(attemptId);
  if (attempt) {
    const summary = attempt.proctoringSummary || {};
    summary.totalIncidents = (summary.totalIncidents || 0) + 1;
    summary.plagiarismFlagsCount = (summary.plagiarismFlagsCount || 0) + 1;
    summary.overallStatus = 'Incident';
    await ExamAttempt.findByIdAndUpdate(attemptId, { proctoringSummary: summary });
  }

  return newEvent;
}
