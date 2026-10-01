export const ROLL_NUMBER_REGEX = /^(2[4-8])(AD|AM|IT|CS|CB|SY|EC|EE|CE)\d{3}$/;

/**
 * Validates a student roll number against the institution-specific format.
 * Format: YY + DEPT + NNN
 * Example: 24AD007
 * 
 * @param {string} rollNumber - The raw input roll number
 * @returns {boolean} True if it exactly matches the required pattern
 */
export const isValidRollNumber = (rollNumber) => {
  if (!rollNumber) return false;
  const sanitized = rollNumber.trim().toUpperCase();
  return ROLL_NUMBER_REGEX.test(sanitized);
};
