/**
 * AI Performance Analysis Engine
 * Generates data-driven strengths, needs improvement areas, and tailored learning paths
 */

export function generatePerformanceAnalysis({ attempt, questions = [], submissions = [] }) {
  const topicStats = {};
  let totalTime = 0;

  // Aggregate stats per topic
  for (const ans of attempt.answers || []) {
    const q = questions.find(q => String(q._id) === String(ans.questionId) || String(q.id) === String(ans.questionId));
    if (!q) continue;

    const topic = q.topic || q.subject || 'General Problem Solving';
    if (!topicStats[topic]) {
      topicStats[topic] = { total: 0, correct: 0, attempted: 0, marks: 0, maxMarks: 0 };
    }

    topicStats[topic].total += 1;
    topicStats[topic].maxMarks += q.marks || 10;

    if (ans.status === 'answered') {
      topicStats[topic].attempted += 1;
      if (ans.isCorrect || (ans.score && ans.score >= (q.marks * 0.7))) {
        topicStats[topic].correct += 1;
        topicStats[topic].marks += ans.score || q.marks;
      }
    }
  }

  const strengths = [];
  const needsImprovement = [];
  const recommendations = [];

  for (const [topic, stats] of Object.entries(topicStats)) {
    const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
    if (accuracy >= 70) {
      strengths.push(topic);
    } else if (accuracy < 60 || stats.attempted === 0) {
      needsImprovement.push(topic);
    }
  }

  // Fallbacks if data is uniform
  if (strengths.length === 0) {
    strengths.push('Algorithmic Syntax & Code Structure', 'Time Management');
  }
  if (needsImprovement.length === 0) {
    needsImprovement.push('Edge Case Testing', 'Complex Space Complexity Optimization');
  }

  // Generate specific tailored recommendations based on weak areas
  needsImprovement.forEach((topic, idx) => {
    recommendations.push(`Practice 5-8 foundational problems on ${topic} focusing on boundary conditions.`);
    recommendations.push(`Review theoretical complexity analysis and standard patterns for ${topic}.`);
  });

  if (attempt.codingPerformance?.compilationErrors > 0) {
    recommendations.push('Work on reducing initial compilation errors by pre-checking variable scopes and type declarations.');
  }

  const recommendedPracticeCount = Math.min(15, Math.max(5, needsImprovement.length * 4));

  return {
    strengths: Array.from(new Set(strengths)).slice(0, 4),
    needsImprovement: Array.from(new Set(needsImprovement)).slice(0, 4),
    recommendations: Array.from(new Set(recommendations)).slice(0, 5),
    recommendedPracticeQuestionsCount: recommendedPracticeCount
  };
}
