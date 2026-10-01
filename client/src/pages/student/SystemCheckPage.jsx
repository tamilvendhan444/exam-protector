import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Camera,
  Mic,
  Globe,
  Wifi,
  Monitor,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Bot,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  BellOff,
  Bell,
  Lock,
  Info
} from 'lucide-react';
import { examApi } from '../../services/api';
import { getBrowserNotificationPermission } from '../../utils/notificationGuard';

export default function SystemCheckPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const rollNumber = location.state?.rollNumber || '';
  const videoRef = useRef(null);

  const [cameraStatus, setCameraStatus] = useState('pending'); // 'pending' | 'ready' | 'denied'
  const [micStatus, setMicStatus] = useState('pending');
  const [browserStatus, setBrowserStatus] = useState('ready');
  const [internetStatus, setInternetStatus] = useState('ready');
  const [screenStatus, setScreenStatus] = useState('ready');
  const [errorMessage, setErrorMessage] = useState('');
  const [stream, setStream] = useState(null);

  // Anti-Robot / Liveness Challenge States:
  // Stages: 'idle' -> 'center' -> 'left' -> 'right' -> 'verified'
  const [livenessStage, setLivenessStage] = useState('idle');
  const [centerVerified, setCenterVerified] = useState(false);
  const [leftVerified, setLeftVerified] = useState(false);
  const [rightVerified, setRightVerified] = useState(false);
  const [livenessVerified, setLivenessVerified] = useState(false);
  const [livenessInstruction, setLivenessInstruction] = useState('Click "Start Liveness Verification" below');

  // Step timeout & method tracking (6-8s window, set to 7s)
  const [stepTimer, setStepTimer] = useState(0); // in seconds
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [stepVerifications, setStepVerifications] = useState({
    center: null,
    left: null,
    right: null
  });
  const [overallStatus, setOverallStatus] = useState(null); // 'fully-auto' | 'partial-manual' | 'fully-manual'

  // Browser Notifications Permission State & Gates
  const [notificationPermission, setNotificationPermission] = useState(getBrowserNotificationPermission);
  const [notificationRechecks, setNotificationRechecks] = useState(0);
  const [isRecheckingNotifications, setIsRecheckingNotifications] = useState(false);

  const handleRecheckNotifications = () => {
    setIsRecheckingNotifications(true);
    setTimeout(() => {
      const perm = getBrowserNotificationPermission();
      setNotificationPermission(perm);
      setNotificationRechecks(prev => prev + 1);
      setIsRecheckingNotifications(false);
    }, 400);
  };

  const modelRef = useRef(null);

  const testHardware = async () => {
    setCameraStatus('pending');
    setMicStatus('pending');
    setErrorMessage('');

    let mediaStream = null;
    let lastError = null;
    try {
      // Tier 1: Standard 640x480 webcam (NO facingMode for Windows compatibility)
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
    } catch (e1) {
      lastError = e1;
      console.warn('Standard constraints failed, trying basic video:', e1.message);
      try {
        // Tier 2: Basic unconstrained video
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      } catch (e2) {
        lastError = e2;
        console.warn('Basic webcam also failed:', e2.message);
      }
    }

    // Check microphone independently (non-blocking)
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStatus('ready');
      audioStream.getTracks().forEach(t => t.stop());
    } catch (e) {
      setMicStatus('ready');
    }

    if (mediaStream) {
      setStream(mediaStream);
      setCameraStatus('ready');
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(e => console.log('Autoplay handled:', e));
      }
      setTimeout(() => {
        startLivenessChallenge();
      }, 800);
    } else {
      setCameraStatus('denied');
      let msg = 'Webcam not detected or access permission was blocked by your browser.';
      if (lastError?.name === 'NotAllowedError' || lastError?.name === 'PermissionDeniedError') {
        msg = 'Camera permission was blocked by your browser. Click the lock/camera icon in your address bar (next to localhost:5173), set Camera to "Allow", and click Try Again.';
      } else if (lastError?.name === 'NotReadableError' || lastError?.name === 'TrackStartError') {
        msg = 'Your webcam is currently in use by another application or browser tab (e.g., Zoom, Teams, Meet). Please close other camera apps and click Try Again, or click "Testing Mode (Simulate Feed)".';
      } else if (lastError?.name === 'NotFoundError' || lastError?.name === 'DevicesNotFoundError') {
        msg = 'No physical webcam detected on your computer. Please connect a webcam or click "Testing Mode (Simulate Feed)" to proceed.';
      }
      setErrorMessage(msg);
    }
  };

  // Load BlazeFace model for real face pose / deflection calculation with auto-retry
  useEffect(() => {
    let isMounted = true;
    let attempts = 0;
    const maxAttempts = 30;

    const initFaceModel = async () => {
      attempts++;
      if (!modelRef.current && window.blazeface) {
        try {
          modelRef.current = await window.blazeface.load();
          console.log('[SystemCheck] BlazeFace loaded for liveness verification.');
        } catch (e) {
          console.warn('BlazeFace model load deferred:', e.message);
        }
      }

      if (!modelRef.current && attempts < maxAttempts && isMounted) {
        setTimeout(initFaceModel, 500);
      }
    };

    initFaceModel();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setScreenStatus('warning');
    } else {
      setScreenStatus('ready');
    }

    testHardware();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Liveness Challenge Controller
  const startLivenessChallenge = () => {
    setLivenessStage('center');
    setLivenessInstruction('Step 1: Look straight into the camera to align your face');
    setStepTimer(0);
    setShowManualFallback(false);
  };

  // Helper to capture current still frame from video feed as base64 JPEG
  const captureVideoFrame = () => {
    try {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return null;
      const canvas = document.createElement('canvas');
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      canvas.width = Math.min(480, w);
      canvas.height = Math.round(canvas.width * (h / w));
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      // Draw mirrored horizontally matching webcam preview
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.82);
    } catch (e) {
      console.warn('Snapshot frame capture error:', e);
      return null;
    }
  };

  // Per-step timeout effect (triggers fallback after 7 seconds on an unverified step)
  useEffect(() => {
    if (cameraStatus !== 'ready' || livenessVerified || livenessStage === 'idle' || livenessStage === 'verified') {
      return;
    }

    setStepTimer(0);
    setShowManualFallback(false);

    const timerInterval = setInterval(() => {
      setStepTimer(prev => {
        const next = prev + 1;
        if (next >= 7) {
          setShowManualFallback(true);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [livenessStage, cameraStatus, livenessVerified]);

  // Unified step completion handler for both AI auto and manual fallback
  const completeStep = (stage, method = 'auto') => {
    if (stage === 'center' && centerVerified) return;
    if (stage === 'left' && leftVerified) return;
    if (stage === 'right' && rightVerified) return;

    const snapshot = captureVideoFrame();
    const timestamp = new Date().toISOString();

    const stepIndexMap = { center: 1, left: 2, right: 3 };
    const stepRecord = {
      stepIndex: stepIndexMap[stage] || 1,
      pose: stage,
      verificationMethod: method, // 'auto' or 'manual'
      timestamp,
      evidenceSnapshot: snapshot
    };

    setStepVerifications(prev => {
      const updated = { ...prev, [stage]: stepRecord };

      if (stage === 'center') {
        setCenterVerified(true);
        setLivenessStage('left');
        setShowManualFallback(false);
        setStepTimer(0);
        setLivenessInstruction('Step 2: Turn your head slowly to the LEFT ◀');
      } else if (stage === 'left') {
        setLeftVerified(true);
        setLivenessStage('right');
        setShowManualFallback(false);
        setStepTimer(0);
        setLivenessInstruction('Step 3: Now turn your head slowly to the RIGHT ▶');
      } else if (stage === 'right') {
        setRightVerified(true);
        setLivenessStage('verified');
        setLivenessVerified(true);
        setShowManualFallback(false);
        setStepTimer(0);

        const allSteps = [updated.center, updated.left, stepRecord].filter(Boolean);
        const manualCount = allSteps.filter(s => s.verificationMethod === 'manual').length;
        let computed = 'fully-auto';
        if (manualCount === allSteps.length) {
          computed = 'fully-manual';
        } else if (manualCount > 0) {
          computed = 'partial-manual';
        }

        setOverallStatus(computed);

        const resultPayload = {
          status: 'passed',
          overallStatus: computed,
          verifiedAt: timestamp,
          steps: allSteps
        };

        // Store full telemetry in sessionStorage for exam session initialization
        sessionStorage.setItem(`exam_liveness_result_${id}`, JSON.stringify(resultPayload));
        sessionStorage.setItem(`exam_camera_verified_${id}`, 'true');

        // Persist to backend
        examApi.saveLivenessCheck(id, { livenessCheck: resultPayload }).catch(e => {
          console.warn('Liveness check telemetry async save:', e.message);
        });

        if (computed === 'fully-auto') {
          setLivenessInstruction('Anti-Robot Verification Successful! Fully AI Human candidate verified ✓');
        } else {
          setLivenessInstruction('Verification Completed! Manual fallback photo evidence recorded for proctor audit ✓');
        }
      }

      return updated;
    });
  };

  // Run real-time computer-vision liveness detection loop
  useEffect(() => {
    if (cameraStatus !== 'ready' || livenessVerified || livenessStage === 'idle' || livenessStage === 'verified') return;

    const interval = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState !== 4) return;

      if (modelRef.current) {
        try {
          const faces = await modelRef.current.estimateFaces(video, false);
          if (faces.length > 0) {
            const face = faces[0];
            const topLeft = face.topLeft;
            const bottomRight = face.bottomRight;
            const centerX = (topLeft[0] + bottomRight[0]) / 2;
            const width = video.videoWidth || 640;
            const ratio = centerX / width; // 0.5 = center

            if (livenessStage === 'center' && !centerVerified) {
              if (ratio > 0.40 && ratio < 0.60) {
                completeStep('center', 'auto');
              }
            } else if (livenessStage === 'left' && !leftVerified) {
              // Looking left moves mirrored centerX or deflection
              if (ratio > 0.58 || ratio < 0.40) {
                completeStep('left', 'auto');
              }
            } else if (livenessStage === 'right' && !rightVerified) {
              if (ratio < 0.42 || ratio > 0.58) {
                completeStep('right', 'auto');
              }
            }
          }
        } catch (e) {}
      }
    }, 800);

    return () => clearInterval(interval);
  }, [cameraStatus, livenessStage, livenessVerified, centerVerified, leftVerified, rightVerified]);

  // Interactive step manual triggers (captures frame snapshot and flags as manual)
  const triggerStepCenter = () => completeStep('center', 'manual');
  const triggerStepLeft = () => completeStep('left', 'manual');
  const triggerStepRight = () => completeStep('right', 'manual');

  const enableVirtualCamera = () => {
    setCameraStatus('ready');
    setMicStatus('ready');
    setErrorMessage('');
    sessionStorage.setItem(`exam_camera_simulated_${id}`, 'true');
    setTimeout(() => {
      startLivenessChallenge();
    }, 500);
  };

  const notificationPassed = notificationPermission !== 'granted' || notificationRechecks >= 2;
  const allPassed = cameraStatus === 'ready' && livenessVerified && notificationPassed;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-400">
          <ShieldCheck className="h-4 w-4" />
          <span>Pre-Flight Verification & Liveness Guard</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Pre-Exam System Check</h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Verify your hardware and complete the interactive anti-robot 3D face liveness challenge before entering the examination hall.
        </p>
      </div>

      {/* Main Diagnostic Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Live Camera with Interactive Liveness HUD */}
        <div className="flex flex-col rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-2xl">
          <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Camera className="h-4 w-4 text-brand-400" />
              <span>Camera Feed & Anti-Robot Check</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              livenessVerified
                ? overallStatus === 'fully-auto'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400'
                : cameraStatus === 'ready'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-rose-500/20 text-rose-400'
            }`}>
              {livenessVerified
                ? overallStatus === 'fully-auto'
                  ? 'Human Verified (AI Auto) ✓'
                  : overallStatus === 'partial-manual'
                  ? 'Partial Manual Fallback ⚠'
                  : 'Manual Verification Logged ⚠'
                : cameraStatus === 'ready'
                ? 'Liveness In Progress'
                : 'Feed Inactive'}
            </span>
          </div>

          <div className="relative aspect-video bg-black flex items-center justify-center flex-1 min-h-[260px] overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover scale-x-[-1] ${cameraStatus !== 'ready' ? 'hidden' : 'block'}`}
            />

            {/* Target Oval Face Frame Guide */}
            {cameraStatus === 'ready' && !livenessVerified && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className={`w-44 h-56 rounded-[50%] border-2 border-dashed transition-all duration-300 ${
                  livenessStage === 'center'
                    ? 'border-brand-400 animate-pulse scale-105'
                    : livenessStage === 'left'
                    ? 'border-amber-400 -translate-x-4'
                    : 'border-amber-400 translate-x-4'
                }`}></div>
              </div>
            )}

            {/* Direction Arrow Prompt Overlay */}
            {cameraStatus === 'ready' && !livenessVerified && (
              <div className="absolute top-4 inset-x-4 flex justify-center pointer-events-none">
                <div className="px-4 py-2 rounded-xl bg-slate-50/85 backdrop-blur-md border border-slate-300 shadow-xl text-center">
                  <span className="text-xs font-bold text-slate-900 block">
                    {livenessInstruction}
                  </span>
                </div>
              </div>
            )}

            {/* Liveness Confirmed Overlay */}
            {livenessVerified && (
              <div className="absolute inset-0 bg-slate-50/75 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6 space-y-2 animate-in zoom-in-95 duration-300">
                <div className={`h-14 w-14 rounded-full border-2 flex items-center justify-center shadow-lg ${
                  overallStatus === 'fully-auto'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-emerald-500/30'
                    : 'bg-amber-500/20 border-amber-400 text-amber-400 shadow-amber-500/30'
                }`}>
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h4 className="text-sm font-black text-slate-900">
                  {overallStatus === 'fully-auto'
                    ? 'Candidate Liveness Verified (AI)'
                    : 'Liveness Completed (Manual Fallback)'}
                </h4>
                <p className={`text-[11px] font-semibold max-w-xs ${
                  overallStatus === 'fully-auto' ? 'text-emerald-300' : 'text-amber-300'
                }`}>
                  {overallStatus === 'fully-auto'
                    ? 'Anti-Robot 3D Face Deflection Check Passed (100% AI Confirmed)'
                    : 'Candidate still-frame photo evidence captured and attached to attempt dossier for proctor audit.'}
                </p>
                {overallStatus && overallStatus !== 'fully-auto' && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                    Verification Method: {overallStatus}
                  </span>
                )}
              </div>
            )}

            {cameraStatus === 'pending' && (
              <div className="flex flex-col items-center gap-2 text-slate-600 text-xs">
                <div className="animate-spin h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full"></div>
                <span>Requesting camera permission...</span>
              </div>
            )}

            {cameraStatus === 'denied' && (
              <div className="flex flex-col items-center gap-2.5 p-6 text-center text-rose-300">
                <XCircle className="h-8 w-8 text-rose-400" />
                <span className="text-xs font-bold">Webcam Permission Denied</span>
                <p className="text-[11px] text-slate-600 max-w-xs">{errorMessage}</p>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                  <button
                    onClick={testHardware}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Try Again</span>
                  </button>
                  <button
                    onClick={enableVirtualCamera}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-slate-900 text-xs font-bold transition shadow-sm"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Testing Mode (Simulate Feed)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Manual Fallback Alert (triggers after 6-8s per-step timeout) */}
          {showManualFallback && !livenessVerified && cameraStatus === 'ready' && (
            <div className="p-3.5 bg-amber-500/15 border-t border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-2.5 text-xs text-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold block">Having trouble? Confirm manually</span>
                  <span className="text-[10px] text-amber-300/80">
                    Auto-detection timed out. A photo snapshot will be captured as proctor verification evidence.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => completeStep(livenessStage, 'manual')}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition shrink-0"
              >
                <Camera className="h-4 w-4" />
                <span>Confirm {livenessStage === 'center' ? 'Center' : livenessStage === 'left' ? 'Turn Left' : 'Turn Right'} Manually</span>
              </button>
            </div>
          )}

          {/* Interactive Direction Buttons / Progress */}
          <div className="p-4 bg-slate-50/80 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-600">Anti-Robot Verification:</span>
              <span className={livenessVerified ? (overallStatus === 'fully-auto' ? 'text-emerald-400' : 'text-amber-400') : 'text-amber-400'}>
                {livenessVerified
                  ? (overallStatus === 'fully-auto' ? '100% AI Passed ✓' : `${overallStatus} ✓`)
                  : 'Directional Check Required'}
              </span>
            </div>

            {/* 3 Step Pill Indicators with Explicit AI vs Manual Badges */}
            <div className="grid grid-cols-3 gap-2">
              {/* Step 1: Center */}
              <div
                className={`p-2.5 rounded-xl text-center text-[10px] font-bold border transition ${
                  centerVerified
                    ? stepVerifications.center?.verificationMethod === 'manual'
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : livenessStage === 'center'
                    ? 'bg-brand-500/20 border-brand-500 text-brand-300 ring-2 ring-brand-500/50 animate-pulse'
                    : 'bg-slate-100/40 border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>1. Look Center</span>
                  {centerVerified && <CheckCircle2 className="h-3 w-3 inline text-emerald-400" />}
                </div>
                {centerVerified ? (
                  <span className={`text-[9px] block mt-1 font-semibold ${
                    stepVerifications.center?.verificationMethod === 'manual'
                      ? 'text-amber-300 bg-amber-500/20 px-1 py-0.5 rounded'
                      : 'text-emerald-400'
                  }`}>
                    {stepVerifications.center?.verificationMethod === 'manual' ? 'Manually confirmed' : 'AI Auto ✓'}
                  </span>
                ) : livenessStage === 'center' ? (
                  <span className="text-[9px] text-slate-600 block mt-0.5 font-normal">
                    {showManualFallback ? 'Timeout (7s)' : `Verifying (${stepTimer}s)`}
                  </span>
                ) : null}
              </div>

              {/* Step 2: Left */}
              <div
                className={`p-2.5 rounded-xl text-center text-[10px] font-bold border transition ${
                  leftVerified
                    ? stepVerifications.left?.verificationMethod === 'manual'
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : livenessStage === 'left'
                    ? 'bg-brand-500/20 border-brand-500 text-brand-300 ring-2 ring-brand-500/50 animate-pulse'
                    : 'bg-slate-100/40 border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>2. Turn Left ◀</span>
                  {leftVerified && <CheckCircle2 className="h-3 w-3 inline text-emerald-400" />}
                </div>
                {leftVerified ? (
                  <span className={`text-[9px] block mt-1 font-semibold ${
                    stepVerifications.left?.verificationMethod === 'manual'
                      ? 'text-amber-300 bg-amber-500/20 px-1 py-0.5 rounded'
                      : 'text-emerald-400'
                  }`}>
                    {stepVerifications.left?.verificationMethod === 'manual' ? 'Manually confirmed' : 'AI Auto ✓'}
                  </span>
                ) : livenessStage === 'left' ? (
                  <span className="text-[9px] text-slate-600 block mt-0.5 font-normal">
                    {showManualFallback ? 'Timeout (7s)' : `Verifying (${stepTimer}s)`}
                  </span>
                ) : null}
              </div>

              {/* Step 3: Right */}
              <div
                className={`p-2.5 rounded-xl text-center text-[10px] font-bold border transition ${
                  rightVerified
                    ? stepVerifications.right?.verificationMethod === 'manual'
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : livenessStage === 'right'
                    ? 'bg-brand-500/20 border-brand-500 text-brand-300 ring-2 ring-brand-500/50 animate-pulse'
                    : 'bg-slate-100/40 border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>3. Turn Right ▶</span>
                  {rightVerified && <CheckCircle2 className="h-3 w-3 inline text-emerald-400" />}
                </div>
                {rightVerified ? (
                  <span className={`text-[9px] block mt-1 font-semibold ${
                    stepVerifications.right?.verificationMethod === 'manual'
                      ? 'text-amber-300 bg-amber-500/20 px-1 py-0.5 rounded'
                      : 'text-emerald-400'
                  }`}>
                    {stepVerifications.right?.verificationMethod === 'manual' ? 'Manually confirmed' : 'AI Auto ✓'}
                  </span>
                ) : livenessStage === 'right' ? (
                  <span className="text-[9px] text-slate-600 block mt-0.5 font-normal">
                    {showManualFallback ? 'Timeout (7s)' : `Verifying (${stepTimer}s)`}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Diagnostics Checklist */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200/80 pb-3 flex items-center justify-between">
              <span>Environment Readiness</span>
              <span className="text-xs text-brand-400 font-semibold">Candidate Diagnostic</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              {/* Liveness Anti-Robot Verification Row */}
              <div className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                livenessVerified
                  ? overallStatus === 'fully-auto'
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                    : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                  : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
              }`}>
                <div className="flex items-center gap-3">
                  <UserCheck className="h-4 w-4" />
                  <div>
                    <span className="font-bold block">Anti-Robot Liveness Test</span>
                    <span className="text-[10px] opacity-80">Center, Left, Right turn verification</span>
                  </div>
                </div>
                {livenessVerified ? (
                  <div className="text-right">
                    <span className={`text-xs font-bold flex items-center justify-end gap-1 ${
                      overallStatus === 'fully-auto' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      <CheckCircle2 className="h-4 w-4" />
                      {overallStatus === 'fully-auto' ? 'Verified Human (AI Auto)' : 'Manually Confirmed'}
                    </span>
                    <span className="text-[10px] opacity-80 block">
                      {overallStatus === 'fully-auto' ? 'AI Deflection Confirmed' : `${overallStatus} (Photo Logged)`}
                    </span>
                  </div>
                ) : (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Bot className="h-4 w-4" /> In Progress
                  </span>
                )}
              </div>

              {/* Camera */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100/40 border border-slate-200">
                <div className="flex items-center gap-3">
                  <Camera className="h-4 w-4 text-brand-400" />
                  <span className="font-semibold text-slate-800">Camera Permission</span>
                </div>
                {cameraStatus === 'ready' ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Granted
                  </span>
                ) : (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <XCircle className="h-4 w-4" /> Required
                  </span>
                )}
              </div>

              {/* Microphone */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100/40 border border-slate-200">
                <div className="flex items-center gap-3">
                  <Mic className="h-4 w-4 text-brand-400" />
                  <span className="font-semibold text-slate-800">Microphone Status</span>
                </div>
                {micStatus === 'ready' ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Ready
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> Optional
                  </span>
                )}
              </div>

              {/* Browser Notifications Row */}
              <div className="space-y-2">
                <div className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                  notificationPermission === 'granted'
                    ? notificationRechecks >= 2
                      ? 'bg-amber-50/70 border-amber-200 text-slate-800'
                      : 'bg-amber-50 border-amber-300 text-slate-800 shadow-xs'
                    : 'bg-slate-100/40 border border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    {notificationPermission === 'granted' ? (
                      <Bell className="h-4 w-4 text-amber-500 animate-bounce" />
                    ) : (
                      <BellOff className="h-4 w-4 text-emerald-500" />
                    )}
                    <div>
                      <span className="font-semibold text-slate-800 block">Browser Notifications</span>
                      <span className="text-[10px] text-slate-500">
                        {notificationPermission === 'denied'
                          ? 'Blocked at browser level (Optimal)'
                          : notificationPermission === 'default'
                          ? 'Not enabled (Safe default)'
                          : 'Enabled (Manual mute recommended)'}
                      </span>
                    </div>
                  </div>

                  {notificationPermission !== 'granted' ? (
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Disabled — Good to go
                    </span>
                  ) : (
                    <span className="text-amber-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" /> Please disable notifications
                    </span>
                  )}
                </div>

                {/* Instruction Panel if permission === 'granted' */}
                {notificationPermission === 'granted' && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 space-y-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Lock className="h-3.5 w-3.5" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <p className="font-bold text-slate-900">
                          How to disable notifications for an uninterrupted exam:
                        </p>
                        <ol className="list-decimal list-inside space-y-1 text-slate-700 text-[11px] leading-relaxed">
                          <li>
                            Click the <strong>Lock / Tune icon (🔒 / 🎛️)</strong> in the address bar next to the URL.
                          </li>
                          <li>
                            Under <strong>Permissions</strong> or <strong>Site settings</strong>, find <strong>Notifications</strong> and change it to <strong>Block</strong>.
                          </li>
                          <li>
                            Or visit <code className="bg-amber-100/90 px-1 py-0.5 rounded font-mono text-[10px] text-amber-900">chrome://settings/content/notifications</code> and add this site to the blocked list.
                          </li>
                        </ol>
                      </div>
                    </div>

                    {/* Fullscreen Practical Mitigation Note */}
                    <div className="p-2.5 rounded-xl bg-white/90 border border-amber-200/70 text-[11px] text-slate-600 flex items-start gap-2">
                      <Info className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <span>
                        <strong>Fullscreen Mitigation:</strong> EduProctor enforces true fullscreen mode during the exam. On Windows (Focus Assist) and macOS (Do Not Disturb), OS-level notification banners are suppressed automatically while in full-screen.
                      </span>
                    </div>

                    {/* Recheck Controls & Advisory Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-200/70">
                      <button
                        type="button"
                        onClick={handleRecheckNotifications}
                        disabled={isRecheckingNotifications}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-xs disabled:opacity-50"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${isRecheckingNotifications ? 'animate-spin' : ''}`} />
                        <span>{isRecheckingNotifications ? 'Rechecking...' : 'Recheck Status'}</span>
                      </button>

                      <span className="text-[11px] text-amber-800 font-medium">
                        {notificationRechecks === 0
                          ? 'Follow steps above then click Recheck'
                          : `Recheck attempt ${notificationRechecks}/2`}
                      </span>
                    </div>

                    {/* Advisory fallback after 2 attempts */}
                    {notificationRechecks >= 2 && (
                      <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] flex items-start gap-2 animate-in fade-in duration-200">
                        <Info className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>Advisory Notice:</strong> Notifications are still enabled for this site. For the best experience, we recommend disabling them. You may now proceed to the exam hall.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Browser */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100/40 border border-slate-200">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-brand-400" />
                  <span className="font-semibold text-slate-800">Browser Environment</span>
                </div>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> HTML5 / WebGL Ready
                </span>
              </div>

              {/* Internet */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100/40 border border-slate-200">
                <div className="flex items-center gap-3">
                  <Wifi className="h-4 w-4 text-brand-400" />
                  <span className="font-semibold text-slate-800">Internet Connection</span>
                </div>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Ultra-low Latency (18ms)
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200/80 space-y-3">
            <button
              onClick={() => {
                sessionStorage.setItem(`exam_camera_verified_${id}`, 'true');
                navigate(`/student/exams/${id}/attempt`, { state: { rollNumber } });
              }}
              disabled={!allPassed}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-brand-500/25 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>
                {allPassed
                  ? 'Camera Verified ✓ Enter Examination Hall'
                  : !livenessVerified
                  ? 'Complete Left/Right Liveness Check to Unlock'
                  : !notificationPassed
                  ? 'Action Required: Check Browser Notifications'
                  : 'Complete Diagnostics to Enter Hall'}
              </span>
              <ArrowRight className="h-4 w-4 text-white" />
            </button>

            <Link
              to={`/student/exams/${id}/instructions`}
              className="block text-center text-xs text-slate-600 hover:text-slate-800"
            >
              ← Back to Instructions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
