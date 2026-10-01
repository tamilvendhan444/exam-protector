/**
 * EduProctor AI - Notification & Distraction Shield
 * 
 * Provides:
 * 1. Safe detection of browser Notification.permission ('granted', 'default', 'denied').
 * 2. In-app distraction suppression: intercepts window.Notification constructor and audio alerts
 *    during active exam attempts so no unexpected sounds or popups interrupt the student.
 * 3. Advisory helpers and platform instructions for managing notification permissions.
 */

let originalNotification = null;
let originalAudioPlay = null;
let isShieldActive = false;

/**
 * Returns current Notification permission: 'granted' | 'default' | 'denied'
 */
export function getBrowserNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      return Notification.permission || 'default';
    } catch (e) {
      console.warn('[NotificationGuard] Error reading Notification.permission:', e);
      return 'default';
    }
  }
  return 'default';
}

/**
 * Activates zero-distraction mode for the duration of the exam attempt:
 * - Monkey-patches window.Notification constructor to silence desktop alerts
 * - Suppresses non-critical Audio.prototype.play()
 * - Sets global flags indicating exam is in-progress
 */
export function enableExamDistractionFreeMode() {
  if (typeof window === 'undefined') return;
  if (isShieldActive) return;

  try {
    sessionStorage.setItem('eduproctor_exam_active', 'true');
    window.__EDUPROCTOR_EXAM_IN_PROGRESS__ = true;

    // 1. Intercept desktop Notification constructor
    if ('Notification' in window && !originalNotification) {
      originalNotification = window.Notification;

      // Create a mock Notification class that no-ops
      const MockNotification = function (title, options) {
        console.warn(
          `[NotificationGuard] Suppressed desktop notification during in-progress exam attempt: "${title}"`
        );
        this.title = title;
        this.options = options;
        this.close = () => {};
        this.onclick = null;
        this.onclose = null;
        this.onerror = null;
        this.onshow = null;
        return this;
      };

      // Preserve static properties
      MockNotification.permission = originalNotification.permission;
      MockNotification.requestPermission = () => Promise.resolve('denied');
      MockNotification.maxActions = originalNotification.maxActions || 0;

      window.Notification = MockNotification;
    }

    // 2. Intercept audio playback for external/non-proctor sounds
    if (typeof HTMLMediaElement !== 'undefined' && !originalAudioPlay) {
      originalAudioPlay = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        // Allow elements explicitly tagged as essential proctoring audio
        if (this.dataset?.proctoringEssential === 'true') {
          return originalAudioPlay.apply(this, arguments);
        }
        // Check if exam is in-progress
        if (window.__EDUPROCTOR_EXAM_IN_PROGRESS__) {
          console.warn('[NotificationGuard] Suppressed non-essential audio play during exam attempt');
          return Promise.resolve();
        }
        return originalAudioPlay.apply(this, arguments);
      };
    }

    isShieldActive = true;
    console.log('[NotificationGuard] Exam distraction-free shield activated.');
  } catch (err) {
    console.error('[NotificationGuard] Failed to activate distraction shield:', err);
  }
}

/**
 * Deactivates zero-distraction mode when the student exits or submits the exam.
 */
export function disableExamDistractionFreeMode() {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem('eduproctor_exam_active');
    window.__EDUPROCTOR_EXAM_IN_PROGRESS__ = false;

    // Restore Notification constructor
    if (originalNotification && window.Notification !== originalNotification) {
      window.Notification = originalNotification;
      originalNotification = null;
    }

    // Restore Audio.play
    if (originalAudioPlay && HTMLMediaElement.prototype.play !== originalAudioPlay) {
      HTMLMediaElement.prototype.play = originalAudioPlay;
      originalAudioPlay = null;
    }

    isShieldActive = false;
    console.log('[NotificationGuard] Exam distraction-free shield deactivated.');
  } catch (err) {
    console.error('[NotificationGuard] Failed to deactivate distraction shield:', err);
  }
}

/**
 * Returns true if an exam attempt is actively in progress.
 */
export function isExamDistractionFreeActive() {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.__EDUPROCTOR_EXAM_IN_PROGRESS__ ||
      sessionStorage.getItem('eduproctor_exam_active') === 'true'
  );
}
