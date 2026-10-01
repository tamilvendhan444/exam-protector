/**
 * Post-Exam Integrity & Trust Scoring Service
 * Aggregates multi-signal proctoring metrics (camera, tab switches, keystroke paste telemetry, plagiarism)
 * into a single unified 0-100% integrity index and dossier.
 */

import { ExamAttempt, ProctoringEvent } from '../models/schemas.js';

export function calculateIntegrityMetrics(attempt, events = []) {
  let score = 100;
  const deductions = [];
  const riskFactors = [];

  // Count incidents by category
  let mobilePhoneCount = 0;
  let multipleFacesCount = 0;
  let faceMissingCount = 0;
  let lookingAwayCount = 0;
  let tabSwitchCount = 0;
  let suspiciousPasteCount = 0;
  let typingBurstCount = 0;
  let plagiarismCount = 0;
  let multipleDisplaysCount = 0;
  let devtoolsOpenCount = 0;
  let contextMenuBlockedCount = 0;
  let candidateIdleCount = 0;
  let networkGapCount = 0;
  let fullscreenExitCount = 0;
  let totalDurationAwaySeconds = 0;

  for (const ev of events) {
    if (ev.status === 'Dismissed') continue; // Exclude dismissed false alarms!

    switch (ev.eventType) {
      case 'mobile_phone':
        mobilePhoneCount++;
        break;
      case 'multiple_faces':
        multipleFacesCount++;
        break;
      case 'face_missing':
        faceMissingCount++;
        break;
      case 'looking_away':
        lookingAwayCount++;
        break;
      case 'tab_switch':
        tabSwitchCount++;
        totalDurationAwaySeconds += (ev.durationSeconds || 3);
        break;
      case 'suspicious_paste':
        suspiciousPasteCount++;
        break;
      case 'typing_burst':
        typingBurstCount++;
        break;
      case 'code_plagiarism':
        plagiarismCount++;
        break;
      case 'multiple_displays':
        multipleDisplaysCount++;
        break;
      case 'devtools_open':
        devtoolsOpenCount++;
        break;
      case 'contextmenu_blocked':
        contextMenuBlockedCount++;
        break;
      case 'candidate_idle':
        candidateIdleCount++;
        break;
      case 'network_gap':
        networkGapCount++;
        break;
      case 'fullscreen_exit':
        fullscreenExitCount++;
        break;
      default:
        break;
    }
  }

  // Fallback to attempt counters if no raw events fetched
  const summary = attempt?.proctoringSummary || {};
  if (events.length === 0) {
    mobilePhoneCount = summary.mobilePhoneCount || 0;
    multipleFacesCount = summary.multipleFacesCount || 0;
    faceMissingCount = summary.faceMissingCount || 0;
    lookingAwayCount = summary.lookingAwayCount || 0;
    tabSwitchCount = summary.tabSwitchesCount || 0;
    suspiciousPasteCount = summary.suspiciousPastesCount || 0;
    typingBurstCount = summary.typingBurstsCount || 0;
    plagiarismCount = summary.plagiarismFlagsCount || 0;
    multipleDisplaysCount = summary.multipleDisplaysCount || 0;
    devtoolsOpenCount = summary.devtoolsOpenCount || 0;
    contextMenuBlockedCount = summary.contextMenuBlockedCount || 0;
    candidateIdleCount = summary.idleCount || 0;
    networkGapCount = summary.networkDisconnectionsCount || 0;
    fullscreenExitCount = summary.fullscreenExitCount || 0;
  }

  // 1. Mobile Phone Deductions
  if (mobilePhoneCount > 0) {
    const penalty = Math.min(50, mobilePhoneCount * 25);
    score -= penalty;
    deductions.push({ label: 'Unauthorized Device / Mobile Phone', penalty, count: mobilePhoneCount });
    riskFactors.push(`Mobile device detected in camera frame (${mobilePhoneCount} time${mobilePhoneCount > 1 ? 's' : ''})`);
  }

  // 2. Multiple Persons Deductions
  if (multipleFacesCount > 0) {
    const penalty = Math.min(40, multipleFacesCount * 20);
    score -= penalty;
    deductions.push({ label: 'Multiple Persons in Camera View', penalty, count: multipleFacesCount });
    riskFactors.push(`Multiple individuals detected during session (${multipleFacesCount} instance${multipleFacesCount > 1 ? 's' : ''})`);
  }

  // 3. Face Missing / Seat Left Deductions
  if (faceMissingCount > 0) {
    const penalty = Math.min(30, faceMissingCount * 8);
    score -= penalty;
    deductions.push({ label: 'Candidate Absence / Frame Left', penalty, count: faceMissingCount });
    riskFactors.push(`Candidate left camera view (${faceMissingCount} occurrence${faceMissingCount > 1 ? 's' : ''})`);
  }

  // 4. Tab Switches / Window Blur
  if (tabSwitchCount > 0) {
    const penalty = Math.min(35, tabSwitchCount * 8);
    score -= penalty;
    deductions.push({ label: 'Browser Tab Switches / Window Deflection', penalty, count: tabSwitchCount });
    riskFactors.push(`Left active examination window ${tabSwitchCount} time${tabSwitchCount > 1 ? 's' : ''} (~${totalDurationAwaySeconds || tabSwitchCount * 3}s total away)`);
  }

  // 5. Suspicious Paste / Keystroke Events
  if (suspiciousPasteCount > 0) {
    const penalty = Math.min(35, suspiciousPasteCount * 12);
    score -= penalty;
    deductions.push({ label: 'Large Clipboard Paste Injections', penalty, count: suspiciousPasteCount });
    riskFactors.push(`${suspiciousPasteCount} abnormal paste event${suspiciousPasteCount > 1 ? 's' : ''} detected in code editor`);
  }

  // 6. Typing Velocity Bursts
  if (typingBurstCount > 0) {
    const penalty = Math.min(25, typingBurstCount * 10);
    score -= penalty;
    deductions.push({ label: 'Non-Human Typing Velocity Bursts', penalty, count: typingBurstCount });
    riskFactors.push(`${typingBurstCount} abnormal keystroke speed burst${typingBurstCount > 1 ? 's' : ''} logged`);
  }

  // 7. Plagiarism / Code Similarity Flags
  if (plagiarismCount > 0) {
    const penalty = Math.min(60, plagiarismCount * 35);
    score -= penalty;
    deductions.push({ label: 'High Code-Similarity / Plagiarism Match', penalty, count: plagiarismCount });
    riskFactors.push(`High code similarity flagged across candidate submissions`);
  }

  // 8. Multiple Display / Auxiliary Monitors
  if (multipleDisplaysCount > 0) {
    const penalty = Math.min(40, multipleDisplaysCount * 20);
    score -= penalty;
    deductions.push({ label: 'Auxiliary / Multi-Display Detected', penalty, count: multipleDisplaysCount });
    riskFactors.push(`Secondary monitor or extended display detected (${multipleDisplaysCount} instance${multipleDisplaysCount > 1 ? 's' : ''})`);
  }

  // 9. DevTools Opened
  if (devtoolsOpenCount > 0) {
    const penalty = Math.min(40, devtoolsOpenCount * 25);
    score -= penalty;
    deductions.push({ label: 'Browser Developer Tools Detected', penalty, count: devtoolsOpenCount });
    riskFactors.push(`Browser DevTools inspection opened during exam (${devtoolsOpenCount} time${devtoolsOpenCount > 1 ? 's' : ''})`);
  }

  // 10. Context Menu / Right-Click Attempt
  if (contextMenuBlockedCount > 0) {
    const penalty = Math.min(15, contextMenuBlockedCount * 3);
    score -= penalty;
    deductions.push({ label: 'Right-Click / Context Menu Blocked', penalty, count: contextMenuBlockedCount });
  }

  // 11. Candidate Inactivity / Idle
  if (candidateIdleCount > 0) {
    const penalty = Math.min(20, candidateIdleCount * 5);
    score -= penalty;
    deductions.push({ label: 'Candidate Idle / Inactivity Warnings', penalty, count: candidateIdleCount });
  }

  // 12. Network Gap / Disconnections
  if (networkGapCount > 0) {
    const penalty = Math.min(25, networkGapCount * 8);
    score -= penalty;
    deductions.push({ label: 'Protracted Network Disconnection Gaps', penalty, count: networkGapCount });
    riskFactors.push(`${networkGapCount} prolonged network disconnection gap${networkGapCount > 1 ? 's' : ''} recorded`);
  }

  // 13. Fullscreen Exits
  if (fullscreenExitCount > 0) {
    const penalty = Math.min(25, fullscreenExitCount * 8);
    score -= penalty;
    deductions.push({ label: 'Fullscreen Mode Exits', penalty, count: fullscreenExitCount });
  }

  // Clamp score
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Trust Tier Assignment
  let tier = 'Verified Clean';
  let tierColor = 'emerald';
  let badgeText = 'High Integrity';

  if (score < 65 || mobilePhoneCount > 0 || plagiarismCount > 0 || tabSwitchCount >= 4 || devtoolsOpenCount > 0 || multipleDisplaysCount > 0) {
    tier = 'High Risk';
    tierColor = 'rose';
    badgeText = 'Integrity Breach Risk';
  } else if (score < 88 || tabSwitchCount >= 1 || suspiciousPasteCount >= 1 || faceMissingCount >= 2 || candidateIdleCount >= 2 || networkGapCount >= 2) {
    tier = 'Review Advised';
    tierColor = 'amber';
    badgeText = 'Manual Audit Advised';
  }

  return {
    score,
    tier,
    tierColor,
    badgeText,
    deductions,
    riskFactors,
    signals: {
      cameraIncidentsCount: mobilePhoneCount + multipleFacesCount + faceMissingCount + lookingAwayCount,
      tabSwitchesCount: tabSwitchCount,
      pastesCount: suspiciousPasteCount,
      typingBurstsCount: typingBurstCount,
      plagiarismFlagsCount: plagiarismCount,
      multipleDisplaysCount,
      devtoolsOpenCount,
      contextMenuBlockedCount,
      candidateIdleCount,
      networkGapCount,
      fullscreenExitCount,
      totalDurationAwaySeconds
    },
    verifiedAt: new Date().toISOString()
  };
}

/**
 * Fetch events for an attempt and compute updated integrity profile
 */
export async function getAttemptIntegrityProfile(attemptId) {
  const attempt = await ExamAttempt.findById(attemptId);
  if (!attempt) return null;

  const events = await ProctoringEvent.find({ examAttemptId: String(attempt._id || attempt.id) });
  const metrics = calculateIntegrityMetrics(attempt, events);

  // Update attempt model with latest integrity score
  if (attempt.proctoringSummary) {
    const summary = {
      ...attempt.proctoringSummary,
      integrityScore: metrics.score,
      integrityTier: metrics.tier === 'High Risk' ? 'High Risk' : (metrics.tier === 'Review Advised' ? 'Review Advised' : 'Clean')
    };
    await ExamAttempt.findByIdAndUpdate(attemptId, { proctoringSummary: summary });
  }

  return {
    attempt,
    events,
    integrity: metrics
  };
}
