/**
 * Verification Script for Advanced Anti-Cheat & Adaptive Learning Suite
 */

import { compareCodeSubmissions, tokenizeCode, winnow } from './server/services/plagiarismService.js';
import { calculateIntegrityMetrics } from './server/services/integrityService.js';

async function runUnitAndIntegrationTests() {
  console.log('====================================================');
  console.log('🧪 Starting Advanced Anti-Cheat & Adaptive Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(name, condition, extra = '') {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${name} ${extra}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${extra}`);
    }
  }

  // 1. AST Tokenization & Winnowing Fingerprinting
  console.log('\n--- 1. Testing MOSS-style Plagiarism & Similarity Detection ---');
  
  const snippet1 = `
    #include <iostream>
    #include <vector>
    using namespace std;

    // Standard Two Sum solution
    vector<int> twoSum(vector<int>& nums, int target) {
        for (int i = 0; i < nums.size(); i++) {
            for (int j = i + 1; j < nums.size(); j++) {
                if (nums[i] + nums[j] == target) {
                    return {i, j};
                }
            }
        }
        return {};
    }
  `;

  // Renamed variables, changed whitespace, added dummy comments
  const snippet2 = `
    #include <iostream>
    #include <vector>
    using namespace std;

    /* Plagiarized renamed version */
    vector<int> solveProblem(vector<int>& arr, int sumValue) {
        for (int p = 0; p < arr.size(); p++) {
            for (int q = p + 1; q < arr.size(); q++) {
                if (arr[p] + arr[q] == sumValue) {
                    return {p, q};
                }
            }
        }
        return {};
    }
  `;

  // Completely different algorithm: Hash map lookup
  const snippet3 = `
    #include <iostream>
    #include <unordered_map>
    #include <vector>
    using namespace std;

    vector<int> twoSumHashMap(vector<int>& nums, int target) {
        unordered_map<int, int> table;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (table.find(complement) != table.end()) {
                return {table[complement], i};
            }
            table[nums[i]] = i;
        }
        return {};
    }
  `;

  const tokens1 = tokenizeCode(snippet1, 'cpp');
  const tokens2 = tokenizeCode(snippet2, 'cpp');
  assert('Tokenization strips comments and normalizes IDs', tokens1.length > 10 && tokens1.includes('ID') && tokens1.includes('for'));

  const simIdentical = compareCodeSubmissions(snippet1, snippet2, 'cpp', 'cpp');
  console.log(`   -> Snippet1 vs Snippet2 (Renamed variables): Similarity = ${simIdentical.similarity}%, Jaccard = ${simIdentical.jaccard}%`);
  assert('Detects high similarity despite variable renaming (>70%)', simIdentical.similarity >= 70);

  const simDifferent = compareCodeSubmissions(snippet1, snippet3, 'cpp', 'cpp');
  console.log(`   -> Snippet1 vs Snippet3 (Brute-force vs Hash map): Similarity = ${simDifferent.similarity}%`);
  assert('Distinguishes completely different algorithmic structure', simDifferent.similarity < 60);

  // 2. Testing Integrity Scoring Engine
  console.log('\n--- 2. Testing Multi-Signal Integrity Scoring Service ---');

  const cleanAttempt = {
    proctoringSummary: {
      mobilePhoneCount: 0,
      multipleFacesCount: 0,
      faceMissingCount: 0,
      tabSwitchesCount: 0,
      suspiciousPastesCount: 0,
      typingBurstsCount: 0,
      plagiarismFlagsCount: 0
    }
  };

  const cleanIntegrity = calculateIntegrityMetrics(cleanAttempt, []);
  console.log(`   -> Clean Attempt Score: ${cleanIntegrity.score}%, Tier: ${cleanIntegrity.tier}`);
  assert('Clean session awards 100% Verified Clean integrity', cleanIntegrity.score === 100 && cleanIntegrity.tier === 'Verified Clean');

  const compromisedEvents = [
    { eventType: 'mobile_phone', severity: 'critical' },
    { eventType: 'tab_switch', durationSeconds: 15 },
    { eventType: 'suspicious_paste', details: '120 chars pasted' },
    { eventType: 'code_plagiarism', details: '85% match' }
  ];

  const compromisedIntegrity = calculateIntegrityMetrics({}, compromisedEvents);
  console.log(`   -> Compromised Attempt Score: ${compromisedIntegrity.score}%, Tier: ${compromisedIntegrity.tier}`);
  assert('Penalizes multi-signal violations into High Risk tier', compromisedIntegrity.score < 65 && compromisedIntegrity.tier === 'High Risk');
  assert('Computes itemized deductions for faculty audit', compromisedIntegrity.deductions.length >= 4);

  // Summary
  console.log('\n====================================================');
  console.log(`📊 Test Results: ${passed}/${total} assertions passed!`);
  console.log('====================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runUnitAndIntegrationTests();
