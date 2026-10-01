import express from 'express';
import { Question } from '../models/schemas.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List all questions from Question Bank with filters
router.get('/', async (req, res) => {
  try {
    const { subject, topic, difficulty, type, search } = req.query;
    const filter = {};

    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;
    if (type) filter.type = type;

    let questions = await Question.find(filter);

    if (search) {
      const q = search.toLowerCase();
      questions = questions.filter(item =>
        item.title.toLowerCase().includes(q) ||
        (item.topic && item.topic.toLowerCase().includes(q)) ||
        (item.tags && item.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    return res.json({ success: true, questions, count: questions.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve questions from question bank.' });
  }
});

// Get single question
router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }
    return res.json({ success: true, question });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve question.' });
  }
});

// Add new question to bank (Faculty/Admin)
router.post('/', authenticate, requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const {
      title,
      description,
      type = 'coding',
      subject,
      topic,
      difficulty = 'Medium',
      marks = 10,
      negativeMarks = 0,
      tags = [],
      options = [],
      correctOptionIds = [],
      isMultipleChoice = false,
      explanation = '',
      inputFormat = '',
      outputFormat = '',
      constraints = '',
      examples = [],
      starterCode = {},
      testCases = [],
      timeLimitMs = 2000,
      memoryLimitMb = 128,
      minWords = 50,
      maxWords = 500
    } = req.body;

    if (!title || !description || !subject) {
      return res.status(400).json({ success: false, message: 'Title, description, and subject are required.' });
    }

    const question = await Question.create({
      title,
      description,
      type,
      subject,
      topic: topic || subject,
      difficulty,
      marks: Number(marks),
      negativeMarks: Number(negativeMarks),
      tags,
      options,
      correctOptionIds,
      isMultipleChoice,
      explanation,
      inputFormat,
      outputFormat,
      constraints,
      examples,
      starterCode,
      testCases,
      timeLimitMs: Number(timeLimitMs),
      memoryLimitMb: Number(memoryLimitMb),
      minWords: Number(minWords),
      maxWords: Number(maxWords)
    });

    return res.status(201).json({ success: true, message: 'Question added to Question Bank', question });
  } catch (err) {
    console.error('Error creating question:', err);
    return res.status(500).json({ success: false, message: 'Failed to add question to bank.' });
  }
});

// Update question
router.put('/:id', authenticate, requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const updated = await Question.findByIdAndUpdate(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }
    return res.json({ success: true, message: 'Question updated', question: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update question.' });
  }
});

// Delete question
router.delete('/:id', authenticate, requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    await Question.deleteOne({ _id: req.params.id });
    return res.json({ success: true, message: 'Question removed from Question Bank.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete question.' });
  }
});

export default router;
