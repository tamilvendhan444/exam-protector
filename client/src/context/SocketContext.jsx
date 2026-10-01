import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connected' | 'reconnecting' | 'disconnected'
  const [disconnectDurationSeconds, setDisconnectDurationSeconds] = useState(0);
  const [lastDisconnectGap, setLastDisconnectGap] = useState(null);
  const { user } = useAuth();

  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const activeExamSessionRef = useRef(null);

  useEffect(() => {
    let disconnectTimer = null;
    let disconnectedSince = null;

    const socketServerUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '') || window.location.origin;
    const socketInstance = io(socketServerUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketInstance.on('connect', () => {
      console.log('[TRIGGER-3-SOCKET] SocketClient Connected to gateway:', socketInstance.id);
      setIsConnected(true);
      setConnectionStatus('connected');

      // Auto-rejoin active exam session if recovering from disconnection
      if (activeExamSessionRef.current && userRef.current) {
        console.log('[TRIGGER-3-SOCKET] Auto re-joining active exam room on reconnect:', activeExamSessionRef.current.examId);
        socketInstance.emit('student:join', {
          studentId: userRef.current.id || userRef.current._id,
          studentName: userRef.current.name,
          studentEmail: userRef.current.email,
          examId: activeExamSessionRef.current.examId,
          attemptId: activeExamSessionRef.current.attemptId
        });
      }

      if (disconnectedSince) {
        const gap = Math.max(1, Math.round((Date.now() - disconnectedSince) / 1000));
        console.log('[TRIGGER-3-SOCKET] Reconnected after network gap of seconds:', gap);
        setLastDisconnectGap({ durationSeconds: gap, timestamp: Date.now() });
        disconnectedSince = null;
      }
      if (disconnectTimer) {
        clearInterval(disconnectTimer);
        disconnectTimer = null;
      }
      setDisconnectDurationSeconds(0);
    });

    socketInstance.on('disconnect', (reason) => {
      console.warn('[TRIGGER-3-SOCKET] SocketClient Disconnected from gateway. Reason:', reason);
      setIsConnected(false);
      setConnectionStatus('reconnecting');
      disconnectedSince = Date.now();

      if (!disconnectTimer) {
        disconnectTimer = setInterval(() => {
          if (disconnectedSince) {
            setDisconnectDurationSeconds(Math.max(1, Math.round((Date.now() - disconnectedSince) / 1000)));
          }
        }, 1000);
      }
    });

    socketInstance.on('reconnect_attempt', (attemptNum) => {
      console.log('[TRIGGER-3-SOCKET] SocketClient reconnect_attempt #', attemptNum);
      setConnectionStatus('reconnecting');
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('[TRIGGER-3-SOCKET] SocketClient reconnect_failed!');
      setConnectionStatus('disconnected');
    });

    setSocket(socketInstance);

    return () => {
      if (disconnectTimer) clearInterval(disconnectTimer);
      socketInstance.disconnect();
    };
  }, []);

  // Socket helper actions
  const joinExam = (examId, attemptId) => {
    activeExamSessionRef.current = { examId, attemptId };
    if (socket && user) {
      socket.emit('student:join', {
        studentId: user.id || user._id,
        studentName: user.name,
        studentEmail: user.email,
        examId,
        attemptId
      });
    }
  };

  const sendHeartbeat = ({ examId, snapshot, remainingSeconds, progressPercent }) => {
    if (socket && user) {
      socket.emit('student:heartbeat', {
        studentId: user.id || user._id,
        examId,
        snapshot,
        remainingSeconds,
        progressPercent
      });
    }
  };

  const reportIncident = (incidentData) => {
    if (socket && user) {
      socket.emit('proctor:incident', {
        studentId: user.id || user._id,
        studentName: user.name,
        ...incidentData
      });
    }
  };

  const joinMonitoring = (examId) => {
    if (socket && user) {
      socket.emit('faculty:join_monitoring', {
        examId,
        facultyId: user.id || user._id
      });
    }
  };

  const sendWarning = (studentId, message, examId) => {
    if (socket) {
      socket.emit('faculty:send_warning', {
        studentId,
        message,
        examId
      });
    }
  };

  const leaveExam = (examId, attemptId) => {
    activeExamSessionRef.current = null;
    if (socket && user) {
      socket.emit('student:leave', {
        studentId: user.id || user._id,
        examId,
        attemptId
      });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        connectionStatus,
        disconnectDurationSeconds,
        lastDisconnectGap,
        joinExam,
        leaveExam,
        sendHeartbeat,
        reportIncident,
        joinMonitoring,
        sendWarning
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
