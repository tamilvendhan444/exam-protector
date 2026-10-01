import { useEffect, useRef } from 'react';
import { proctorApi } from '../services/api';

export function useExamProctoring({
  id,
  attempt,
  policy,
  loading,
  reportIncident,
  setFullscreenBlockedModalOpen,
  setFullscreenEntryModalOpen,
  setIsFullscreen,
  triggerProctorAlert,
  lastDisconnectGap,
  setIdleModalOpen,
  idleModalTriggeredRef,
  lastActivityTimeRef
}) {
  const tabLeaveTimeRef = useRef(null);
  const tabSwitchCountRef = useRef(0);
  const lastDevToolsAlertRef = useRef(0);

  // Tab Switch, Window Focus, Fullscreen
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        tabLeaveTimeRef.current = Date.now();
      } else {
        if (tabLeaveTimeRef.current) {
          const duration = Math.max(1, Math.round((Date.now() - tabLeaveTimeRef.current) / 1000));
          tabLeaveTimeRef.current = null;

          if (policy.tabSwitchDetection !== false) {
            tabSwitchCountRef.current += 1;
            const count = tabSwitchCountRef.current;
            triggerProctorAlert(
              `Tab Switch Flagged #${count}`,
              `You navigated away from the active exam window for ${duration}s. This has been logged for faculty proctor review.`
            );

            const incidentPayload = {
              examId: id,
              attemptId: attempt?._id || attempt?.id,
              eventType: 'tab_switch',
              severity: count >= 3 ? 'critical' : (count >= 2 ? 'high' : 'medium'),
              confidence: 0.98,
              durationSeconds: duration,
              details: `Candidate switched away from exam tab for ${duration} seconds (Incident #${count}).`
            };

            if (reportIncident) reportIncident(incidentPayload);
            try { await proctorApi.logEvent(incidentPayload); } catch (e) {}
          }
        }
      }
    };

    const handleBlur = () => {
      if (!tabLeaveTimeRef.current) tabLeaveTimeRef.current = Date.now();
    };

    const handleFocus = () => {
      if (tabLeaveTimeRef.current && !document.hidden) handleVisibilityChange();
    };

    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) {
        if (policy.fullscreenEnforced !== false) {
          setFullscreenBlockedModalOpen(true);
          triggerProctorAlert('Fullscreen Exited', 'Full-screen exit detected and logged. Return to full-screen to continue.');
          const incidentPayload = {
            examId: id,
            attemptId: attempt?._id || attempt?.id,
            eventType: 'fullscreen_exit',
            severity: 'medium',
            confidence: 0.95,
            details: 'Candidate exited full-screen mode.'
          };
          if (reportIncident) reportIncident(incidentPayload);
          proctorApi.logEvent(incidentPayload).catch(() => {});
        }
      } else {
        setFullscreenBlockedModalOpen(false);
        setFullscreenEntryModalOpen(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [attempt, id, reportIncident, policy, triggerProctorAlert, setFullscreenBlockedModalOpen, setFullscreenEntryModalOpen, setIsFullscreen]);

  // Global Context Menu
  useEffect(() => {
    const handleContextMenu = (e) => {
      if (policy.contextMenuBlocked !== false) {
        e.preventDefault();
        triggerProctorAlert('Right-Click Disabled', 'Context menu inspection is strictly prohibited during this examination.');
        const incidentPayload = {
          examId: id,
          attemptId: attempt?._id || attempt?.id,
          eventType: 'contextmenu_blocked',
          severity: 'low',
          confidence: 0.98,
          details: 'Candidate attempted right-click context menu inspection.'
        };
        if (reportIncident) reportIncident(incidentPayload);
        proctorApi.logEvent(incidentPayload).catch(() => {});
      }
    };
    window.addEventListener('contextmenu', handleContextMenu);
    return () => window.removeEventListener('contextmenu', handleContextMenu);
  }, [policy, id, attempt, reportIncident, triggerProctorAlert]);

  // Multiple-Monitor & Browser DevTools Detection
  useEffect(() => {
    if (loading) return;
    const checkDisplays = () => {
      if (policy.multiDisplayDetection === false) return;
      let isMulti = false;
      let details = '';
      if (window.screen && typeof window.screen.isExtended === 'boolean' && window.screen.isExtended) {
        isMulti = true;
        details = 'Extended secondary monitor detected via Screen Details API.';
      } else if (window.screen && ((window.screen.availLeft && window.screen.availLeft !== 0) || (window.screen.availTop && window.screen.availTop !== 0))) {
        isMulti = true;
        details = 'Multi-monitor virtual display detected via desktop coordinate offset.';
      }
      if (isMulti) {
        triggerProctorAlert('Secondary Display Detected', 'Multiple monitors are strictly prohibited during proctored examinations.');
        const incidentPayload = {
          examId: id,
          attemptId: attempt?._id || attempt?.id,
          eventType: 'multiple_displays',
          severity: 'high',
          confidence: 0.95,
          details: details || 'Multiple screens detected.'
        };
        if (reportIncident) reportIncident(incidentPayload);
        proctorApi.logEvent(incidentPayload).catch(() => {});
      }
    };
    checkDisplays();
    window.screen?.addEventListener?.('change', checkDisplays);

    const devToolsInterval = setInterval(() => {
      if (policy.devtoolsDetection === false) return;
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      if (widthThreshold || heightThreshold) {
        if (Date.now() - lastDevToolsAlertRef.current > 12000) {
          lastDevToolsAlertRef.current = Date.now();
          triggerProctorAlert('DevTools Console Detected', 'Browser DevTools inspection or debugging has been detected and logged.');
          const incidentPayload = {
            examId: id,
            attemptId: attempt?._id || attempt?.id,
            eventType: 'devtools_open',
            severity: 'high',
            confidence: 0.95,
            details: `Developer Tools panel active (dimension delta: ${window.outerWidth - window.innerWidth}x${window.outerHeight - window.innerHeight}).`
          };
          if (reportIncident) reportIncident(incidentPayload);
          proctorApi.logEvent(incidentPayload).catch(() => {});
        }
      }
    }, 2500);

    return () => {
      window.screen?.removeEventListener?.('change', checkDisplays);
      clearInterval(devToolsInterval);
    };
  }, [loading, policy, id, attempt, reportIncident, triggerProctorAlert]);

  // Network Disconnect Grace Period
  useEffect(() => {
    if (!lastDisconnectGap) return;
    const graceSeconds = policy.networkGapGraceSeconds || 20;
    if (policy.networkGapDetection !== false && lastDisconnectGap.durationSeconds >= graceSeconds) {
      triggerProctorAlert('Network Gap Flagged', `Connection to proctoring gateway was lost for ${lastDisconnectGap.durationSeconds}s.`);
      const incidentPayload = {
        examId: id,
        attemptId: attempt?._id || attempt?.id,
        eventType: 'network_gap',
        severity: lastDisconnectGap.durationSeconds >= 60 ? 'high' : 'medium',
        confidence: 0.99,
        durationSeconds: lastDisconnectGap.durationSeconds,
        details: `Candidate experienced a proctoring gateway disconnection gap of ${lastDisconnectGap.durationSeconds}s.`
      };
      if (reportIncident) reportIncident(incidentPayload);
      proctorApi.logEvent(incidentPayload).catch(() => {});
    }
  }, [lastDisconnectGap, policy, id, attempt, reportIncident, triggerProctorAlert]);

  // Idle / Inactivity Detection
  useEffect(() => {
    if (loading) return;

    const handleUserActivity = () => {
      if (lastActivityTimeRef) lastActivityTimeRef.current = Date.now();
    };

    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);

    const idleCheckInterval = setInterval(() => {
      if (policy.idleDetection === false) return;
      const timeoutMinutes = policy.idleTimeoutMinutes || 3;
      const idleLimitMs = timeoutMinutes * 60 * 1000;
      const inactiveDuration = Date.now() - (lastActivityTimeRef?.current || Date.now());

      if (inactiveDuration >= idleLimitMs && idleModalTriggeredRef && !idleModalTriggeredRef.current) {
        idleModalTriggeredRef.current = true;
        setIdleModalOpen(true);
        triggerProctorAlert('Inactivity Detected', `No user activity detected for over ${timeoutMinutes} minutes.`);

        const incidentPayload = {
          examId: id,
          attemptId: attempt?._id || attempt?.id,
          eventType: 'candidate_idle',
          severity: 'low',
          confidence: 0.95,
          durationSeconds: Math.round(inactiveDuration / 1000),
          details: `Candidate idle without keyboard or mouse input for ${Math.round(inactiveDuration / 1000)}s.`
        };

        if (reportIncident) reportIncident(incidentPayload);
        proctorApi.logEvent(incidentPayload).catch(() => {});
      }
    }, 5000);

    return () => {
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      clearInterval(idleCheckInterval);
    };
  }, [loading, policy, id, attempt, reportIncident, setIdleModalOpen, idleModalTriggeredRef, lastActivityTimeRef, triggerProctorAlert]);
}
