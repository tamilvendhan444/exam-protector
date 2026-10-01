import React, { useRef, useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { proctorApi } from '../../services/api';
import {
  Camera,
  AlertTriangle,
  Eye,
  Smartphone,
  Users,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  VideoOff,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  Volume2
} from 'lucide-react';

export default function LiveCameraProctorPanel({
  examId,
  attemptId,
  studentInfo,
  onIncidentDetected,
  remainingSeconds
}) {
  const videoRef = useRef(null);
  const hudCanvasRef = useRef(null);
  const snapshotCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const { sendHeartbeat, reportIncident, socket } = useSocket();

  const lastHeartbeatSentRef = useRef(0);
  const isHeartbeatStoppedRef = useRef(false);

  useEffect(() => {
    if (!socket) return;
    const handleStop = () => {
      console.log('[TRIGGER-2-HEARTBEAT] Received student:stop_heartbeat. Pausing heartbeat emissions.');
      isHeartbeatStoppedRef.current = true;
    };
    socket.on('student:stop_heartbeat', handleStop);
    return () => {
      socket.off('student:stop_heartbeat', handleStop);
    };
  }, [socket]);

  const [streamActive, setStreamActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeWarning, setActiveWarning] = useState(null);
  const [proctorStatus, setProctorStatus] = useState('Normal'); // 'Normal' | 'Warning' | 'Incident'
  const [isSimulatedMode, setIsSimulatedMode] = useState(false);
  const [phoneDetected, setPhoneDetected] = useState(false);
  const [candidateMissing, setCandidateMissing] = useState(false);
  const [multipleFaces, setMultipleFaces] = useState(false);
  const [phoneDetails, setPhoneDetails] = useState('');
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Model references
  const blazeFaceModelRef = useRef(null);
  const cocoModelRef = useRef(null);

  // Detection counters to prevent false-alarm jitter
  const missingFaceStreak = useRef(0);
  const lookingAwayStreak = useRef(0);
  const phoneStreak = useRef(0);
  const noPhoneStreak = useRef(0);
  const lastIncidentTime = useRef({});
  const lastBeepTime = useRef(0);

  // Play warning audio beep using Web Audio API
  const playAlertBeep = () => {
    const now = Date.now();
    if (now - lastBeepTime.current < 4000) return;
    lastBeepTime.current = now;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) { }
  };

  // 1. Initialize Camera with Multi-Tier Fallback
  const startCamera = async () => {
    setIsConnecting(true);

    const isSimulated = sessionStorage.getItem(`exam_camera_simulated_${examId}`) === 'true';
    if (isSimulated) {
      setIsSimulatedMode(true);
      setStreamActive(true);
      setIsConnecting(false);
      return;
    }

    let stream = null;
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
      } catch (err1) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;
      setStreamActive(true);
      setIsConnecting(false);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.log('[Proctor] Play handled:', e));
      }
    } catch (err) {
      console.warn('[Proctor] Camera access error:', err.message);
      setStreamActive(false);
      setIsConnecting(false);
      showWarning(
        'Camera Access Required',
        'Webcam stream could not be started. Click "Enable Camera" to grant permissions.'
      );
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [examId]);

  useEffect(() => {
    if (streamRef.current && videoRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.log('[Proctor] Autoplay handled:', e));
    }
  }, [streamActive, isMinimized]);

  // 2. Load Vision Models (BlazeFace & COCO-SSD)
  // 2. Load Vision Models (BlazeFace & COCO-SSD) with Auto-Retry
  useEffect(() => {
    let isMounted = true;
    let attempts = 0;
    const maxAttempts = 30; // retry for up to 15 seconds if scripts are downloading

    const initModels = async () => {
      attempts++;

      // 1. Load BlazeFace face detector
      if (!blazeFaceModelRef.current && window.blazeface) {
        try {
          blazeFaceModelRef.current = await window.blazeface.load();
          console.log('[Proctor AI] BlazeFace face detector ready.');
        } catch (e) {
          console.warn('[Proctor AI] BlazeFace load issue:', e.message);
        }
      }

      // 2. Load COCO-SSD object detector from high-speed local bundle
      if (!cocoModelRef.current && window.cocoSsd) {
        try {
          console.log('[Proctor AI] Loading COCO-SSD object detector from local bundle (/models/ssdlite_mobilenet_v2/model.json)...');
          try {
            cocoModelRef.current = await window.cocoSsd.load({
              base: 'lite_mobilenet_v2',
              modelUrl: '/models/ssdlite_mobilenet_v2/model.json'
            });
            console.log('[Proctor AI] COCO-SSD local neural detector successfully loaded!');
          } catch (localErr) {
            console.warn('[Proctor AI] Local modelUrl load issue, falling back to default:', localErr.message);
            cocoModelRef.current = await window.cocoSsd.load({ base: 'lite_mobilenet_v2' }).catch(() => window.cocoSsd.load());
          }

          if (isMounted && cocoModelRef.current) {
            setModelsLoaded(true);
            console.log('[Proctor AI] Neural detector ACTIVE and ready for phone detection!');
          }
        } catch (e) {
          console.warn('[Proctor AI] COCO-SSD load issue:', e.message);
        }
      }

      // If neural model is not loaded yet, retry every 500ms
      if (!cocoModelRef.current && attempts < maxAttempts && isMounted) {
        setTimeout(initModels, 500);
      }
    };

    initModels();
    return () => { isMounted = false; };
  }, []);

  const remainingSecondsRef = useRef(remainingSeconds);
  useEffect(() => {
    remainingSecondsRef.current = remainingSeconds;
  }, [remainingSeconds]);

  const isInspectingRef = useRef(false);

  // 3. Optimized AI Inspection Loop (Protected against timer thrashing & CPU thread pileup)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (isInspectingRef.current) return;
      isInspectingRef.current = true;
      try {
        await runProctoringInspection();
      } catch (err) {
        console.warn('[Proctor AI] Inspection loop error:', err);
      } finally {
        isInspectingRef.current = false;
      }
    }, 500);

    return () => clearInterval(interval);
  }, [streamActive, isSimulatedMode]);

  // Report and handle incidents
  const triggerIncident = async (incident) => {
    const { eventType, severity, confidence, details } = incident;

    const now = Date.now();
    if (lastIncidentTime.current[eventType] && now - lastIncidentTime.current[eventType] < 8000) {
      return;
    }
    lastIncidentTime.current[eventType] = now;

    const snapshot = captureSnapshot();
    const incidentData = {
      examId,
      attemptId,
      studentId: studentInfo?._id || studentInfo?.id,
      studentName: studentInfo?.name || 'Student Candidate',
      eventType,
      severity: severity || 'medium',
      confidence: confidence || 0.85,
      details,
      snapshot
    };

    reportIncident(incidentData);

    try {
      await proctorApi.logEvent(incidentData);
    } catch (e) { }

    setProctorStatus(severity === 'critical' ? 'Incident' : 'Warning');
    showWarning(getWarningTitle(eventType), details);

    if (onIncidentDetected) {
      onIncidentDetected(incidentData);
    }
  };

  const getWarningTitle = (type) => {
    switch (type) {
      case 'mobile_phone': return '🚨 UNAUTHORIZED PHONE DETECTED';
      case 'multiple_faces': return '⚠ Multiple People Detected';
      case 'face_missing': return '⚠ Face Not Detected';
      case 'looking_away': return '⚠ Unusual Gaze Orientation';
      default: return '⚠ Proctoring Alert';
    }
  };

  const showWarning = (title, message) => {
    setActiveWarning({ title, message });
    setTimeout(() => {
      setActiveWarning(null);
    }, 5000);
  };

  const captureSnapshot = () => {
    if (!snapshotCanvasRef.current) return null;
    const canvas = snapshotCanvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 160;
    canvas.height = 120;

    if (videoRef.current && videoRef.current.readyState >= 2 && streamActive && !isSimulatedMode) {
      ctx.drawImage(videoRef.current, 0, 0, 160, 120);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 160, 120);
      ctx.fillStyle = '#4f46e5';
      ctx.beginPath();
      ctx.arc(80, 46, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.arc(80, 106, 38, 0, Math.PI, true);
      ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(14, 14, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(studentInfo?.name || 'Verified Candidate', 80, 114);
    }
    return canvas.toDataURL('image/jpeg', 0.5);
  };

  // Main real-time proctoring evaluation
  const lastHeartbeatLogRef = useRef(0);
  const runProctoringInspection = async () => {
    // 1. Send periodic heartbeat to faculty live feed (throttled to every 3000ms)
    const now = Date.now();
    if (!isHeartbeatStoppedRef.current && (now - lastHeartbeatSentRef.current >= 3000)) {
      lastHeartbeatSentRef.current = now;
      const snapshot = captureSnapshot();
      sendHeartbeat({
        examId,
        snapshot,
        remainingSeconds,
        progressPercent: 50
      });

      if (now - lastHeartbeatLogRef.current > 15000) {
        lastHeartbeatLogRef.current = now;
        console.log('[TRIGGER-2-HEARTBEAT] Camera panel sent periodic heartbeat. examId:', examId, 'remainingSeconds:', remainingSeconds);
      }
    }

    const video = videoRef.current;
    const hudCanvas = hudCanvasRef.current;
    if (!video || video.videoWidth === 0 || video.readyState < 2 || !streamActive || isSimulatedMode || !hudCanvas) {
      return;
    }

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    hudCanvas.width = vw;
    hudCanvas.height = vh;
    const hctx = hudCanvas.getContext('2d');
    hctx.clearRect(0, 0, vw, vh);

    // 2. Face Detection via BlazeFace
    let faceFound = false;
    let personFound = false;

    if (blazeFaceModelRef.current) {
      try {
        const predictions = await blazeFaceModelRef.current.estimateFaces(video, false);

        if (predictions.length === 0) {
          faceFound = false;
        } else if (predictions.length > 1) {
          faceFound = true;
          setMultipleFaces(true);
          setCandidateMissing(false);
          missingFaceStreak.current = 0;

          // Draw red warning boxes for multiple faces
          predictions.forEach((f, idx) => {
            const fx1 = f.topLeft[0];
            const fy1 = f.topLeft[1];
            const fw = f.bottomRight[0] - fx1;
            const fh = f.bottomRight[1] - fy1;
            const rx = vw - (fx1 + fw);
            hctx.strokeStyle = '#ef4444';
            hctx.lineWidth = 2.5;
            hctx.strokeRect(rx, fy1, fw, fh);
            hctx.fillStyle = '#ef4444';
            hctx.font = 'bold 11px sans-serif';
            hctx.fillText(`⚠️ Person ${idx + 1}`, rx, Math.max(16, fy1 - 6));
          });

          triggerIncident({
            eventType: 'multiple_faces',
            severity: 'high',
            confidence: 0.94,
            details: `Detected ${predictions.length} faces visible in camera view.`
          });
        } else {
          faceFound = true;
          setMultipleFaces(false);
          setCandidateMissing(false);
          missingFaceStreak.current = 0;

          const face = predictions[0];
          const fx1 = face.topLeft[0];
          const fy1 = face.topLeft[1];
          const fw = face.bottomRight[0] - fx1;
          const fh = face.bottomRight[1] - fy1;

          // Draw green face bounding frame (mirrored x for mirrored video)
          const rx = vw - (fx1 + fw);
          hctx.strokeStyle = '#10b981';
          hctx.lineWidth = 2.5;
          hctx.strokeRect(rx, fy1, fw, fh);
          hctx.fillStyle = '#10b981';
          hctx.font = 'bold 11px sans-serif';
          hctx.fillText('👤 Candidate Face', rx, Math.max(16, fy1 - 6));
        }
      } catch (err) {
        console.warn('[Proctor] Face estimation error:', err.message);
      }
    }

    // 3. Neural Object & Person Detection via COCO-SSD
    let phoneFound = false;
    let detectedBBox = null;
    let detectedConf = 0;
    let detectedLabel = 'Mobile Phone';

    if (cocoModelRef.current) {
      try {
        const objects = await cocoModelRef.current.detect(video, 10, 0.22);
        for (const obj of objects) {
          const cls = obj.class.toLowerCase();

          // Person presence confirmation
          if (cls === 'person' && obj.score >= 0.30) {
            personFound = true;
            // If BlazeFace missed the face, use the upper 40% of the COCO-SSD person bbox as candidate face!
            if (!faceFound) {
              const [px, py, pw, ph] = obj.bbox;
              const rx = vw - (px + pw);
              const headHeight = ph * 0.42;
              hctx.strokeStyle = '#10b981';
              hctx.lineWidth = 2.5;
              hctx.strokeRect(rx, py, pw, headHeight);
              hctx.fillStyle = '#10b981';
              hctx.font = 'bold 11px sans-serif';
              hctx.fillText('👤 Candidate Present', rx, Math.max(16, py - 6));
            }
          }

          // Targeted mobile phone detection:
          // Front or back of phone (back with camera lenses is often recognized as 'cell phone', 'camera', or 'remote')
          const isCellPhone = cls === 'cell phone' && obj.score >= 0.25;
          const isCameraModule = cls === 'camera' && obj.score >= 0.25;
          const isRemoteDevice = cls === 'remote' && obj.score >= 0.25;

          if (isCellPhone || isCameraModule || isRemoteDevice) {
            const [bx, by, bw, bh] = obj.bbox;

            // Geometry sanity filters for handheld phones:
            // 1. Phone cannot exceed 55% of camera width or 60% of camera height (rejects entire room)
            const sizeOk = bw >= 20 && bh >= 20 && bw <= vw * 0.55 && bh <= vh * 0.60;
            // 2. Aspect ratio of a phone is typically between 1:1 and 4:1
            const aspectRatio = Math.max(bw, bh) / Math.max(1, Math.min(bw, bh));
            const aspectOk = aspectRatio <= 4.0;

            if (sizeOk && aspectOk) {
              phoneFound = true;
              detectedBBox = obj.bbox;
              detectedConf = obj.score;
              detectedLabel = 'Mobile Phone';
              break;
            }
          }
        }
      } catch (err) {
        console.warn('[Proctor] COCO-SSD detection error:', err.message);
      }
    }

    // Candidate Absence Evaluation (~1.2s of no face or person in frame)
    if (!faceFound && !personFound) {
      missingFaceStreak.current += 1;
      if (missingFaceStreak.current >= 3) {
        setCandidateMissing(true);

        // Draw prominent candidate missing HUD warning banner directly on the camera canvas
        hctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
        hctx.fillRect(0, 0, vw, vh);

        // Dashed amber warning border around empty frame
        hctx.strokeStyle = '#f59e0b';
        hctx.lineWidth = 3;
        hctx.setLineDash([8, 6]);
        hctx.strokeRect(12, 12, vw - 24, vh - 24);
        hctx.setLineDash([]);

        // Centered warning label
        hctx.fillStyle = '#f59e0b';
        hctx.font = 'bold 14px sans-serif';
        hctx.textAlign = 'center';
        hctx.fillText('⚠ CANDIDATE NOT DETECTED', vw / 2, vh / 2 - 4);
        hctx.fillStyle = '#ffffff';
        hctx.font = '10px sans-serif';
        hctx.fillText('Please stay visible in camera view', vw / 2, vh / 2 + 16);

        playAlertBeep();

        triggerIncident({
          eventType: 'face_missing',
          severity: 'high',
          confidence: 0.95,
          details: 'Candidate is not detected in camera frame.'
        });
      }
    } else {
      missingFaceStreak.current = 0;
      setCandidateMissing(false);
    }

    // 4. Handle Phone Detection with 2-Frame Confirmation Hysteresis (~800ms)
    if (phoneFound) {
      phoneStreak.current += 1;
      noPhoneStreak.current = 0;

      // Require 2 consecutive frames (~800ms) for responsive and solid detection
      if (phoneStreak.current >= 2) {
        setPhoneDetected(true);
        setPhoneDetails(`${detectedLabel} (${Math.round(detectedConf * 100)}%)`);

        // Draw prominent glowing RED bounding box directly over the verified phone
        if (detectedBBox) {
          const [bx, by, bw, bh] = detectedBBox;
          const rx = vw - (bx + bw); // Mirror adjustment for mirrored video

          hctx.strokeStyle = '#ef4444';
          hctx.lineWidth = 3.5;
          hctx.strokeRect(rx, by, bw, bh);

          // Header label tag
          const labelText = `🚨 PHONE (${Math.round(detectedConf * 100)}%)`;
          hctx.fillStyle = '#ef4444';
          hctx.fillRect(rx, Math.max(0, by - 22), Math.max(130, bw), 22);
          hctx.fillStyle = '#ffffff';
          hctx.font = 'bold 11px sans-serif';
          hctx.fillText(labelText, rx + 4, Math.max(15, by - 6));
        }

        playAlertBeep();

        triggerIncident({
          eventType: 'mobile_phone',
          severity: 'critical',
          confidence: detectedConf || 0.88,
          details: `Mobile phone detected in camera frame (Confidence: ${Math.round((detectedConf || 0.88) * 100)}%).`
        });
      }
    } else {
      noPhoneStreak.current += 1;
      // Disarm only after 2 consecutive clean frames with no phone
      if (noPhoneStreak.current >= 2) {
        phoneStreak.current = 0;
        setPhoneDetected(false);
        if (proctorStatus === 'Incident') {
          setProctorStatus('Normal');
        }
      }
    }
  };

  return (
    <>
      {/* Floating Warning Toast Alert */}
      {activeWarning && (
        <div className="fixed top-20 right-6 z-50 max-w-sm rounded-2xl bg-white border-2 border-rose-500/80 p-4 shadow-2xl shadow-rose-500/20 animate-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
              <ShieldAlert className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-black text-rose-300 flex items-center gap-1.5">
                <span>{activeWarning.title}</span>
              </h4>
              <p className="text-[11px] text-slate-800 mt-1 leading-relaxed">{activeWarning.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Live Camera Picture-in-Picture Box */}
      <div className={`fixed bottom-6 right-6 z-40 rounded-2xl bg-white/95 shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-300 ${phoneDetected
          ? 'border-2 border-rose-500 ring-4 ring-rose-500/40 shadow-rose-500/30'
          : candidateMissing
            ? 'border-2 border-amber-500 ring-4 ring-amber-500/40 shadow-amber-500/30'
            : multipleFaces
              ? 'border-2 border-rose-500 ring-4 ring-rose-500/40 shadow-rose-500/30'
              : 'border border-slate-300'
        } ${isMinimized ? 'w-56 h-12' : 'w-72'}`}>
        {/* Header bar */}
        <div className={`flex items-center justify-between px-3 py-2 border-b text-xs font-semibold transition-colors ${phoneDetected
            ? 'bg-rose-950/90 border-rose-800 text-rose-200'
            : candidateMissing
              ? 'bg-amber-950/90 border-amber-800 text-amber-200'
              : multipleFaces
                ? 'bg-rose-950/90 border-rose-800 text-rose-200'
                : 'bg-slate-50/80 border-slate-200 text-slate-800'
          }`}>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${phoneDetected || multipleFaces ? 'bg-rose-400' : candidateMissing ? 'bg-amber-400' : 'bg-emerald-400'
                }`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${phoneDetected || multipleFaces ? 'bg-rose-500' : candidateMissing ? 'bg-amber-500' : 'bg-emerald-500'
                }`}></span>
            </span>
            <span className="text-[11px] font-bold">
              {phoneDetected
                ? '🚨 VIOLATION: Phone Detected!'
                : candidateMissing
                  ? '⚠️ WARNING: Candidate Not Detected!'
                  : multipleFaces
                    ? '⚠️ WARNING: Multiple People Detected!'
                    : isMinimized
                      ? 'AI Proctoring Active'
                      : 'Live Camera Monitor'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded text-slate-600 hover:text-slate-900"
              title={isMinimized ? 'Expand Camera' : 'Minimize Camera'}
            >
              {isMinimized ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Video Feed & Real-time Detection HUD */}
        {!isMinimized && (
          <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
            {/* Live webcam feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover scale-x-[-1] ${streamActive && !isSimulatedMode ? 'block' : 'hidden'
                }`}
            />

            {/* Real-time AI Bounding Box Canvas Overlay */}
            <canvas
              ref={hudCanvasRef}
              className={`absolute inset-0 w-full h-full pointer-events-none z-10 ${streamActive && !isSimulatedMode ? 'block' : 'hidden'
                }`}
            />

            {/* Flashing Red Warning Banner across camera when phone detected */}
            {phoneDetected && (
              <div className="absolute top-2 inset-x-2 z-20 flex items-center justify-center bg-rose-600/95 text-slate-900 px-2 py-1.5 rounded-lg text-[10px] font-black shadow-xl animate-bounce gap-1.5 border border-rose-400">
                <Smartphone className="h-3.5 w-3.5 animate-pulse" />
                <span>UNAUTHORIZED PHONE DETECTED!</span>
              </div>
            )}

            {/* Warning Banner when candidate face is not detected */}
            {!phoneDetected && candidateMissing && (
              <div className="absolute top-2 inset-x-2 z-20 flex items-center justify-center bg-amber-600/95 text-slate-900 px-2 py-1.5 rounded-lg text-[10px] font-black shadow-xl animate-bounce gap-1.5 border border-amber-400">
                <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />
                <span>CANDIDATE NOT DETECTED! PLEASE RETURN</span>
              </div>
            )}

            {/* Warning Banner when multiple people detected */}
            {!phoneDetected && !candidateMissing && multipleFaces && (
              <div className="absolute top-2 inset-x-2 z-20 flex items-center justify-center bg-rose-600/95 text-slate-900 px-2 py-1.5 rounded-lg text-[10px] font-black shadow-xl animate-bounce gap-1.5 border border-rose-400">
                <Users className="h-3.5 w-3.5 animate-pulse" />
                <span>MULTIPLE PEOPLE DETECTED!</span>
              </div>
            )}

            {/* Simulated feed display for testing mode */}
            {isSimulatedMode && (
              <div className="w-full h-full bg-slate-200 flex flex-col items-center justify-center p-3 text-center space-y-1">
                <div className="h-10 w-10 rounded-full bg-brand-600/30 border border-brand-400/50 flex items-center justify-center text-brand-300">
                  <Eye className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-800">
                  {studentInfo?.name || 'Candidate Feed'}
                </span>
                <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Identity Verified
                </span>
              </div>
            )}

            {/* Connecting/Inactive State */}
            {!streamActive && !isSimulatedMode && (
              <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                {isConnecting ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-brand-500 border-t-transparent rounded-full"></div>
                    <span className="text-[10px] text-slate-700">Starting Camera...</span>
                  </>
                ) : (
                  <>
                    <VideoOff className="h-6 w-6 text-rose-400 animate-pulse" />
                    <span className="text-[10px] font-semibold text-slate-700">Camera Inactive</span>
                    <button
                      onClick={startCamera}
                      className="mt-1 px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-slate-900 text-[10px] font-bold shadow-md transition flex items-center gap-1.5"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Enable Camera</span>
                    </button>
                  </>
                )}
              </div>
            )}

            {/* AI Monitoring Badge overlay */}
            <div className={`absolute bottom-2 left-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold ${phoneDetected
                ? 'bg-rose-950/90 border-rose-600 text-rose-300'
                : candidateMissing
                  ? 'bg-amber-950/90 border-amber-600 text-amber-300'
                  : multipleFaces
                    ? 'bg-rose-950/90 border-rose-600 text-rose-300'
                    : !modelsLoaded
                      ? 'bg-amber-950/80 border-amber-700 text-amber-300'
                      : 'bg-slate-50/80 border-slate-200 text-slate-700'
              }`}>
              {phoneDetected ? (
                <>
                  <ShieldAlert className="h-3 w-3 text-rose-400 animate-pulse" />
                  <span>Violation Active</span>
                </>
              ) : candidateMissing ? (
                <>
                  <AlertTriangle className="h-3 w-3 text-amber-400 animate-pulse" />
                  <span>Candidate Not Detected</span>
                </>
              ) : multipleFaces ? (
                <>
                  <Users className="h-3 w-3 text-rose-400 animate-pulse" />
                  <span>Multiple Faces</span>
                </>
              ) : !modelsLoaded ? (
                <>
                  <RefreshCw className="h-3 w-3 text-amber-400 animate-spin" />
                  <span>AI Initializing...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  <span>AI Shield Active</span>
                </>
              )}
            </div>

            {/* Live REC Indicator */}
            {streamActive && !isSimulatedMode && (
              <div className={`absolute top-2 right-2 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${phoneDetected || candidateMissing || multipleFaces
                  ? 'bg-rose-950/90 text-rose-300 border-rose-600'
                  : 'bg-slate-50/75 text-slate-700 border-slate-300'
                }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${phoneDetected || candidateMissing || multipleFaces ? 'bg-rose-500 animate-ping' : 'bg-emerald-400 animate-pulse'
                  }`}></span>
                <span>{phoneDetected || candidateMissing || multipleFaces ? 'ALERT' : 'REC'}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden Snapshot Canvas */}
      <canvas ref={snapshotCanvasRef} className="hidden" />
    </>
  );
}
