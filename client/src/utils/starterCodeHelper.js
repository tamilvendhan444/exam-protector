/**
 * Universal Starter Code & Function Template Generator
 * Supports: C, C++, Python 3, Java, JavaScript
 * Provides robust fallback function signatures for standard coding problems (Two Sum, Valid Parentheses, Kadane's, etc.)
 * as well as dynamically generated function stubs for custom questions.
 */

export function getStarterCodeForLanguage(question, language = 'cpp') {
  if (!question) return '';
  const lang = (language || 'cpp').toLowerCase();

  // 1. If question has non-empty starterCode for this language, use it
  if (question.starterCode && question.starterCode[lang] && typeof question.starterCode[lang] === 'string' && question.starterCode[lang].trim().length > 0) {
    return question.starterCode[lang];
  }

  const title = (question.title || '').toLowerCase();

  // 2. Specialized Templates for Known Core Problems

  // A. Two Sum
  if (title.includes('two sum')) {
    if (lang === 'c') {
      return `/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    *returnSize = 2;
    int* result = (int*)malloc(2 * sizeof(int));
    
    // Write your code here
    
    return result;
}`;
    }
    if (lang === 'python') {
      return `def twoSum(nums, target):
    # Write your code here
    pass`;
    }
    if (lang === 'cpp') {
      return `vector<int> twoSum(vector<int>& nums, int target) {
    // Write your code here
    
}`;
    }
    if (lang === 'java') {
      return `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your code here
        
        return new int[]{};
    }
}`;
    }
    if (lang === 'javascript') {
      return `function twoSum(nums, target) {
    // Write your code here
    
}`;
    }
  }

  // B. Valid Parentheses
  if (title.includes('parenthes') || title.includes('valid')) {
    if (lang === 'c') {
      return `#include <stdbool.h>

bool isValid(char* s) {
    // Write your code here
    
    return false;
}`;
    }
    if (lang === 'python') {
      return `def isValid(s: str) -> bool:
    # Write your code here
    pass`;
    }
    if (lang === 'cpp') {
      return `bool isValid(string s) {
    // Write your code here
    
}`;
    }
    if (lang === 'java') {
      return `class Solution {
    public boolean isValid(String s) {
        // Write your code here
        
        return false;
    }
}`;
    }
    if (lang === 'javascript') {
      return `function isValid(s) {
    // Write your code here
    
}`;
    }
  }

  // C. Maximum Subarray / Kadane's
  if (title.includes('subarray') || title.includes('kadane') || title.includes('max sum')) {
    if (lang === 'c') {
      return `int maxSubArray(int* nums, int numsSize) {
    // Write your code here
    
    return 0;
}`;
    }
    if (lang === 'python') {
      return `def maxSubArray(nums):
    # Write your code here
    pass`;
    }
    if (lang === 'cpp') {
      return `int maxSubArray(vector<int>& nums) {
    // Write your code here
    
}`;
    }
    if (lang === 'java') {
      return `class Solution {
    public int maxSubArray(int[] nums) {
        // Write your code here
        
        return 0;
    }
}`;
    }
    if (lang === 'javascript') {
      return `function maxSubArray(nums) {
    // Write your code here
    
}`;
    }
  }

  // 3. Fallback to existing starterCode in other languages if available
  if (question.starterCode) {
    if (question.starterCode.python && lang === 'python') return question.starterCode.python;
    if (question.starterCode.c && lang === 'c') return question.starterCode.c;
    if (question.starterCode.cpp && lang === 'cpp') return question.starterCode.cpp;
  }

  // 4. Clean generic function signature based on question title
  const rawWords = (question.title || 'solve').replace(/[^a-zA-Z0-9]/g, ' ').split(' ').filter(Boolean);
  const fnName = rawWords.map((w, idx) => idx === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('').slice(0, 24) || 'solution';

  if (lang === 'c') {
    return `#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

/**
 * Problem: ${question.title || 'Algorithm Challenge'}
 */
int ${fnName}() {
    // Write your code here
    
    return 0;
}`;
  }

  if (lang === 'python') {
    return `# Problem: ${question.title || 'Algorithm Challenge'}
def ${fnName}():
    # Write your code here
    pass`;
  }

  if (lang === 'cpp') {
    return `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

// Problem: ${question.title || 'Algorithm Challenge'}
int ${fnName}() {
    // Write your code here
    
    return 0;
}`;
  }

  if (lang === 'java') {
    return `import java.util.*;

class Solution {
    public int ${fnName}() {
        // Write your code here
        
        return 0;
    }
}`;
  }

  if (lang === 'javascript') {
    return `/**
 * Problem: ${question.title || 'Algorithm Challenge'}
 */
function ${fnName}() {
    // Write your code here
    
}`;
  }

  return '';
}
