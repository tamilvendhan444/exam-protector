import bcrypt from 'bcryptjs';
import { User, Exam, Question, ExamAttempt, ProctoringEvent } from '../models/schemas.js';
import { connectDB } from '../db/database.js';

export async function seedDatabase() {
  console.log('[Seed] Starting database seeding...');
  await connectDB();

  // Clear existing items to prevent duplicates
  const userCount = await User.countDocuments({});
  if (userCount > 0) {
    console.log('[Seed] Database already populated with', userCount, 'users. Skipping destructive re-seed.');
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const commonPassword = await bcrypt.hash('password123', salt);

  // 1. Admin User
  const admin = await User.create({
    name: 'Dr. Sarah Connor',
    email: 'admin@eduproctor.ai',
    password: commonPassword,
    role: 'ADMIN',
    department: 'Office of Academic Affairs',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SarahAdmin',
    isActive: true,
    streak: 15
  });

  // 2. Faculty Users (3)
  const faculty1 = await User.create({
    name: 'Prof. Alan Turing',
    email: 'turing@eduproctor.ai',
    password: commonPassword,
    role: 'FACULTY',
    department: 'Computer Science & Engineering',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlanTuring',
    isActive: true
  });

  const faculty2 = await User.create({
    name: 'Dr. Grace Hopper',
    email: 'hopper@eduproctor.ai',
    password: commonPassword,
    role: 'FACULTY',
    department: 'Software Systems',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GraceHopper',
    isActive: true
  });

  const faculty3 = await User.create({
    name: 'Prof. Donald Knuth',
    email: 'knuth@eduproctor.ai',
    password: commonPassword,
    role: 'FACULTY',
    department: 'Theoretical Computer Science',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DonaldKnuth',
    isActive: true
  });

  // 3. Student Users (10)
  const studentNames = [
    { name: 'Alex Johnson', email: 'alex.student@eduproctor.ai', roll: 'CS2026-001' },
    { name: 'Sophia Chen', email: 'sophia.student@eduproctor.ai', roll: 'CS2026-002' },
    { name: 'Rahul Sharma', email: 'rahul.student@eduproctor.ai', roll: 'CS2026-003' },
    { name: 'Emma Watson', email: 'emma.student@eduproctor.ai', roll: 'CS2026-004' },
    { name: 'Lucas Silva', email: 'lucas.student@eduproctor.ai', roll: 'CS2026-005' },
    { name: 'Aaliyah Patel', email: 'aaliyah.student@eduproctor.ai', roll: 'CS2026-006' },
    { name: 'Liam Miller', email: 'liam.student@eduproctor.ai', roll: 'CS2026-007' },
    { name: 'Zara Khan', email: 'zara.student@eduproctor.ai', roll: 'CS2026-008' },
    { name: 'Noah Davis', email: 'noah.student@eduproctor.ai', roll: 'CS2026-009' },
    { name: 'Mia Tanaka', email: 'mia.student@eduproctor.ai', roll: 'CS2026-010' },
  ];

  const students = [];
  for (let i = 0; i < studentNames.length; i++) {
    const s = studentNames[i];
    const student = await User.create({
      name: s.name,
      email: s.email,
      password: commonPassword,
      role: 'STUDENT',
      department: 'Computer Science',
      rollNumber: s.roll,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.name)}`,
      streak: 3 + (i % 5),
      isActive: true
    });
    students.push(student);
  }

  // 4. Questions (Coding, MCQ, Descriptive)
  const qTwoSum = await Question.create({
    title: 'Two Sum Problem',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.
You may assume that each input would have exactly one solution, and you may not use the same element twice.
Output the indices separated by a space.`,
    type: 'coding',
    subject: 'Data Structures',
    topic: 'Arrays & Hash Maps',
    difficulty: 'Easy',
    marks: 20,
    negativeMarks: 0,
    tags: ['array', 'hash-table', 'algorithms'],
    inputFormat: 'Line 1: space-separated integers for nums\nLine 2: target integer',
    outputFormat: 'Indices i and j separated by space',
    constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nOnly one valid answer exists.',
    examples: [
      { input: '2 7 11 15\n9', output: '0 1', explanation: 'nums[0] + nums[1] == 9, so return 0 1.' },
      { input: '3 2 4\n6', output: '1 2', explanation: 'nums[1] + nums[2] == 6, so return 1 2.' }
    ],
    starterCode: {
      cpp: `vector<int> twoSum(vector<int>& nums, int target) {
    // Write your code here
    
}`,
      c: `int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    // Write your code here
    
}`,
      python: `def twoSum(nums, target):
    # Write your code here
    pass`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your code here
        
        return new int[]{};
    }
}`,
      javascript: `function twoSum(nums, target) {
    // Write your code here
    
}`
    },
    testCases: [
      { input: '2 7 11 15\n9', expectedOutput: '0 1', isHidden: false },
      { input: '3 2 4\n6', expectedOutput: '1 2', isHidden: false },
      { input: '3 3\n6', expectedOutput: '0 1', isHidden: true },
      { input: '1 5 8 10 12\n18', expectedOutput: '2 3', isHidden: true }
    ],
    timeLimitMs: 2000,
    memoryLimitMb: 128
  });

  const qValidParen = await Question.create({
    title: 'Valid Parentheses',
    description: `Given a string \`s\` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.
An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
Print 'true' if valid, otherwise 'false'.`,
    type: 'coding',
    subject: 'Data Structures',
    topic: 'Stacks & Queues',
    difficulty: 'Easy',
    marks: 20,
    tags: ['stack', 'string'],
    inputFormat: 'A single string s',
    outputFormat: 'true or false',
    constraints: '1 <= s.length <= 10^4',
    examples: [
      { input: '()[]{}', output: 'true', explanation: 'All brackets are matched properly.' },
      { input: '(]', output: 'false', explanation: 'Parenthesis mismatched.' }
    ],
    starterCode: {
      cpp: `bool isValid(string s) {
    // Write your code here
    
}`,
      c: `bool isValid(char* s) {
    // Write your code here
    
}`,
      python: `def isValid(s: str) -> bool:
    # Write your code here
    pass`,
      java: `class Solution {
    public boolean isValid(String s) {
        // Write your code here
        
        return false;
    }
}`,
      javascript: `function isValid(s) {
    // Write your code here
    
}`
    },
    testCases: [
      { input: '()[]{}', expectedOutput: 'true', isHidden: false },
      { input: '(]', expectedOutput: 'false', isHidden: false },
      { input: '{[]}', expectedOutput: 'true', isHidden: true },
      { input: '([)]', expectedOutput: 'false', isHidden: true }
    ],
    timeLimitMs: 2000,
    memoryLimitMb: 128
  });

  const qMaxSubarray = await Question.create({
    title: 'Maximum Subarray (Kadane\'s Algorithm)',
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and print its sum.`,
    type: 'coding',
    subject: 'Algorithms',
    topic: 'Dynamic Programming',
    difficulty: 'Medium',
    marks: 25,
    tags: ['kadane', 'array', 'dp'],
    inputFormat: 'Space-separated integers for nums',
    outputFormat: 'Max sum integer',
    constraints: '1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4',
    examples: [
      { input: '-2 1 -3 4 -1 2 1 -5 4', output: '6', explanation: 'Subarray [4, -1, 2, 1] has the largest sum 6.' }
    ],
    starterCode: {
      cpp: `int maxSubArray(vector<int>& nums) {
    // Write your code here
    
}`,
      c: `int maxSubArray(int* nums, int numsSize) {
    // Write your code here
    
}`,
      python: `def maxSubArray(nums):
    # Write your code here
    pass`,
      java: `class Solution {
    public int maxSubArray(int[] nums) {
        // Write your code here
        
        return 0;
    }
}`,
      javascript: `function maxSubArray(nums) {
    // Write your code here
    
}`
    },
    testCases: [
      { input: '-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6', isHidden: false },
      { input: '1', expectedOutput: '1', isHidden: false },
      { input: '5 4 -1 7 8', expectedOutput: '23', isHidden: true },
      { input: '-5 -2 -3 -1', expectedOutput: '-1', isHidden: true }
    ],
    timeLimitMs: 2000,
    memoryLimitMb: 128
  });

  // MCQ Questions
  const qMCQ1 = await Question.create({
    title: 'Time Complexity of QuickSort Worst Case',
    description: 'What is the worst-case time complexity of standard QuickSort with first element as pivot?',
    type: 'mcq',
    subject: 'Algorithms',
    topic: 'Sorting & Complexity',
    difficulty: 'Easy',
    marks: 10,
    negativeMarks: 2.5,
    tags: ['sorting', 'complexity'],
    options: [
      { id: 'opt_1', text: 'O(n log n)' },
      { id: 'opt_2', text: 'O(n)' },
      { id: 'opt_3', text: 'O(n^2)' },
      { id: 'opt_4', text: 'O(log n)' }
    ],
    correctOptionIds: ['opt_3'],
    isMultipleChoice: false,
    explanation: 'When the array is already sorted or reverse sorted and the first element is picked as pivot, QuickSort produces highly skewed partitions resulting in O(n^2) worst case.'
  });

  const qMCQ2 = await Question.create({
    title: 'Properties of Inorder Traversal in BST',
    description: 'Which of the following statements about Binary Search Tree (BST) traversal is always true?',
    type: 'mcq',
    subject: 'Data Structures',
    topic: 'Trees',
    difficulty: 'Easy',
    marks: 10,
    negativeMarks: 2.5,
    tags: ['trees', 'bst'],
    options: [
      { id: 'opt_1', text: 'Preorder traversal yields keys in ascending sorted order' },
      { id: 'opt_2', text: 'Inorder traversal yields keys in ascending sorted order' },
      { id: 'opt_3', text: 'Postorder traversal yields keys in descending sorted order' },
      { id: 'opt_4', text: 'Level order traversal always yields sorted keys' }
    ],
    correctOptionIds: ['opt_2'],
    isMultipleChoice: false,
    explanation: 'By definition of a BST, for every node, left subtree < node < right subtree, hence inorder traversal (left, root, right) always visits nodes in non-decreasing sorted order.'
  });

  const qMCQ3 = await Question.create({
    title: 'SQL Primary Key vs Unique Key',
    description: 'Select all true differences between a PRIMARY KEY and a UNIQUE constraint in standard relational databases.',
    type: 'mcq',
    subject: 'Database Systems',
    topic: 'Relational Model',
    difficulty: 'Medium',
    marks: 15,
    tags: ['sql', 'rdbms'],
    options: [
      { id: 'opt_1', text: 'A table can have only one PRIMARY KEY, but multiple UNIQUE constraints.' },
      { id: 'opt_2', text: 'A PRIMARY KEY column does not permit NULL values, whereas UNIQUE columns may accept NULL.' },
      { id: 'opt_3', text: 'PRIMARY KEY is always non-clustered index by default in MySQL/SQL Server.' },
      { id: 'opt_4', text: 'UNIQUE constraints automatically drop foreign keys on update.' }
    ],
    correctOptionIds: ['opt_1', 'opt_2'],
    isMultipleChoice: true,
    explanation: 'A table is strictly restricted to one primary key and cannot have NULLs. Unique constraints permit multiple definitions per table and allow NULL entries according to SQL standards.'
  });

  // Descriptive Question
  const qDesc1 = await Question.create({
    title: 'ACID Properties in Relational Databases',
    description: `Explain the ACID properties (Atomicity, Consistency, Isolation, Durability) in database transaction management. Illustrate each property with a real-world banking fund transfer scenario between two bank accounts.`,
    type: 'descriptive',
    subject: 'Database Systems',
    topic: 'Transaction Management',
    difficulty: 'Medium',
    marks: 20,
    minWords: 60,
    maxWords: 400,
    tags: ['acid', 'transactions', 'dbms'],
    rubricCriteria: [
      'Accurate definitions of Atomicity, Consistency, Isolation, Durability',
      'Realistic fund transfer example showing debit & credit pairing',
      'Clear explanation of rollback on network failure',
      'Concurrency isolation discussion'
    ]
  });

  // 5. Examinations (5 Realistic Exams)
  const qIdsDataStruct = [qTwoSum._id || qTwoSum.id, qValidParen._id || qValidParen.id, qMCQ2._id || qMCQ2.id];
  const examDS = await Exam.create({
    title: 'Data Structures Assessment',
    subject: 'Data Structures & Algorithms',
    description: 'Comprehensive assessment evaluating student proficiency in Arrays, Stacks, Hash Maps, and Binary Search Trees with automated code execution and live proctoring.',
    durationMinutes: 60,
    totalMarks: 50,
    difficulty: 'Intermediate',
    startDate: new Date(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    status: 'Active',
    questionTypes: ['Coding', 'MCQ'],
    negativeMarking: true,
    negativeMarksPerQuestion: 0.25,
    proctoringEnabled: true,
    proctoringSettings: {
      faceDetection: true,
      multipleFaceDetection: true,
      objectDetection: true,
      headPoseDetection: true,
      tabSwitchDetection: true,
      fullscreenEnforced: true,
      sensitivity: 'Medium',
      maxWarningsBeforeFlag: 3
    },
    questionIds: qIdsDataStruct,
    createdBy: faculty1._id || faculty1.id,
    createdByName: faculty1.name
  });

  const examAlgo = await Exam.create({
    title: 'Algorithms Coding Test',
    subject: 'Algorithm Design & Analysis',
    description: 'Advanced assessment covering Dynamic Programming, Kadane algorithm, and asymptotic complexity.',
    durationMinutes: 75,
    totalMarks: 35,
    difficulty: 'Advanced',
    startDate: new Date(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    status: 'Active',
    questionTypes: ['Coding', 'MCQ'],
    proctoringEnabled: true,
    questionIds: [qMaxSubarray._id || qMaxSubarray.id, qMCQ1._id || qMCQ1.id],
    createdBy: faculty3._id || faculty3.id,
    createdByName: faculty3.name
  });

  const examPython = await Exam.create({
    title: 'Python Programming Assessment',
    subject: 'Python Development',
    description: 'Practical evaluation testing Python scripting, data structures, dictionary lookups, and algorithmic problem solving.',
    durationMinutes: 45,
    totalMarks: 40,
    difficulty: 'Beginner',
    startDate: new Date(),
    endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    status: 'Active',
    questionTypes: ['Coding', 'MCQ'],
    proctoringEnabled: true,
    questionIds: [qTwoSum._id || qTwoSum.id, qValidParen._id || qValidParen.id],
    createdBy: faculty2._id || faculty2.id,
    createdByName: faculty2.name
  });

  const examDB = await Exam.create({
    title: 'Database Assessment',
    subject: 'Database Management Systems',
    description: 'Theory and practical examination on RDBMS constraints, transaction isolation levels, and ACID properties.',
    durationMinutes: 50,
    totalMarks: 35,
    difficulty: 'Intermediate',
    startDate: new Date(),
    endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    status: 'Active',
    questionTypes: ['MCQ', 'Descriptive'],
    proctoringEnabled: true,
    questionIds: [qMCQ3._id || qMCQ3.id, qDesc1._id || qDesc1.id],
    createdBy: faculty2._id || faculty2.id,
    createdByName: faculty2.name
  });

  const examAptitude = await Exam.create({
    title: 'Aptitude Assessment',
    subject: 'Analytical & Quantitative Aptitude',
    description: 'Evaluates logical deduction, quantitative aptitude, and data interpretation.',
    durationMinutes: 40,
    totalMarks: 20,
    difficulty: 'Beginner',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 'Active',
    questionTypes: ['MCQ'],
    proctoringEnabled: true,
    questionIds: [qMCQ1._id || qMCQ1.id, qMCQ2._id || qMCQ2.id],
    createdBy: faculty1._id || faculty1.id,
    createdByName: faculty1.name
  });

  // 6. Pre-generate an active exam attempt for student 2 (Sophia) so Faculty Live Monitoring shows real active cards on first launch!
  const activeAttempt = await ExamAttempt.create({
    examId: examDS._id || examDS.id,
    studentId: students[1]._id || students[1].id,
    studentName: students[1].name,
    studentEmail: students[1].email,
    startTime: new Date(Date.now() - 25 * 60 * 1000),
    status: 'in_progress',
    remainingSeconds: 35 * 60,
    answers: [
      { questionId: qTwoSum._id || qTwoSum.id, status: 'answered', selectedOptionIds: [], codeAnswer: qTwoSum.starterCode.cpp },
      { questionId: qValidParen._id || qValidParen.id, status: 'answered', selectedOptionIds: [] },
      { questionId: qMCQ2._id || qMCQ2.id, status: 'unanswered', selectedOptionIds: [] }
    ],
    totalPossibleMarks: 50,
    proctoringSummary: {
      totalIncidents: 1,
      mobilePhoneCount: 1,
      multipleFacesCount: 0,
      faceMissingCount: 0,
      lookingAwayCount: 0,
      tabSwitchesCount: 0,
      warningsSent: 0,
      overallStatus: 'Warning'
    }
  });

  // Pre-seed an incident for Sophia
  await ProctoringEvent.create({
    eventId: 'ev_init_001',
    examAttemptId: activeAttempt._id || activeAttempt.id,
    examId: examDS._id || examDS.id,
    studentId: students[1]._id || students[1].id,
    studentName: students[1].name,
    eventType: 'mobile_phone',
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    severity: 'high',
    confidence: 0.91,
    details: 'Potential mobile phone device detected in camera frame.',
    status: 'New'
  });

  console.log('[Seed] Database seeded successfully!');
  console.log(`[Seed] Created 1 Admin, 3 Faculty, 10 Students, 5 Exams, 7 Questions.`);
}

// If executed directly via CLI
if (process.argv[1]?.endsWith('seedData.js')) {
  seedDatabase().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
