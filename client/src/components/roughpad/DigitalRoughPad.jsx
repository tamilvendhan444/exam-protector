import React, { useRef, useState, useEffect } from 'react';
import {
  Pen,
  Eraser,
  Square,
  Circle as CircleIcon,
  Minus,
  Type,
  RotateCcw,
  RotateCw,
  Trash2,
  Download,
  ZoomIn,
  ZoomOut,
  X,
  Maximize2
} from 'lucide-react';

export default function DigitalRoughPad({ isOpen, onClose }) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  const [tool, setTool] = useState('pen'); // pen, eraser, line, rect, circle, text
  const [color, setColor] = useState('#ffffff');
  const [lineWidth, setLineWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Undo & Redo stacks
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    if (!isOpen) return;

    // Small delay to ensure canvas is mounted in DOM
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;

      const ctx = canvas.getContext('2d');
      ctx.scale(2, 2);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      contextRef.current = ctx;

      // Dark background for canvas
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, rect.width, rect.height);

      saveState();
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Update stroke properties
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = tool === 'eraser' ? '#0f172a' : color;
      contextRef.current.lineWidth = tool === 'eraser' ? lineWidth * 4 : lineWidth;
    }
  }, [color, lineWidth, tool]);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setHistory((prev) => {
      const newHist = prev.slice(0, historyIndex + 1);
      return [...newHist, dataUrl];
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const restoreState = (index) => {
    if (index < 0 || index >= history.length) return;
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    const img = new Image();
    img.src = history[index];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width / 2, canvas.height / 2);
    };
    setHistoryIndex(index);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      restoreState(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      restoreState(historyIndex + 1);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, rect.width, rect.height);
    saveState();
  };

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom
    };
  };

  const startDrawing = (e) => {
    const pos = getPos(e);
    setStartPos(pos);
    setIsDrawing(true);

    if (tool === 'pen' || tool === 'eraser') {
      const ctx = contextRef.current;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    } else if (tool === 'text') {
      const text = prompt('Enter text for rough calculation:');
      if (text) {
        const ctx = contextRef.current;
        ctx.font = `${lineWidth * 6 + 10}px Inter, sans-serif`;
        ctx.fillStyle = color;
        ctx.fillText(text, pos.x, pos.y);
        saveState();
      }
      setIsDrawing(false);
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    const ctx = contextRef.current;
    const canvas = canvasRef.current;

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === 'line' || tool === 'rect' || tool === 'circle') {
      // Re-draw from current snapshot to preview shape
      if (history[historyIndex]) {
        const img = new Image();
        img.src = history[historyIndex];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width / 2, canvas.height / 2);
      }

      ctx.beginPath();
      if (tool === 'line') {
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(pos.x, pos.y);
      } else if (tool === 'rect') {
        ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
      } else if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2));
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      }
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      if (contextRef.current) {
        contextRef.current.closePath();
      }
      setIsDrawing(false);
      saveState();
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `roughpad-notes-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-5xl h-[85vh] rounded-2xl bg-white border border-slate-300 shadow-2xl shadow-brand-500/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/20 text-brand-400">
              <Pen className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Digital Rough Pad & Scratch Work</h3>
              <p className="text-[11px] text-slate-600">Calculations, algorithm logic, and notes (Not submitted as answer)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadCanvas}
              title="Save PNG Notes"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-white border-b border-slate-200/80 text-xs">
          {/* Drawing Tools */}
          <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setTool('pen')}
              className={`p-2 rounded-lg transition ${tool === 'pen' ? 'bg-brand-600 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
              title="Pen"
            >
              <Pen className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-lg transition ${tool === 'eraser' ? 'bg-brand-600 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
              title="Eraser"
            >
              <Eraser className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTool('line')}
              className={`p-2 rounded-lg transition ${tool === 'line' ? 'bg-brand-600 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
              title="Line"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTool('rect')}
              className={`p-2 rounded-lg transition ${tool === 'rect' ? 'bg-brand-600 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
              title="Rectangle"
            >
              <Square className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTool('circle')}
              className={`p-2 rounded-lg transition ${tool === 'circle' ? 'bg-brand-600 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
              title="Circle"
            >
              <CircleIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTool('text')}
              className={`p-2 rounded-lg transition ${tool === 'text' ? 'bg-brand-600 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
              title="Text Annotation"
            >
              <Type className="h-4 w-4" />
            </button>
          </div>

          {/* Colors */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600 text-[11px] font-medium">Color:</span>
            {['#ffffff', '#38bdf8', '#fbbf24', '#f43f5e', '#34d399'].map((c) => (
              <button
                key={c}
                onClick={() => { setColor(c); if (tool === 'eraser') setTool('pen'); }}
                style={{ backgroundColor: c }}
                className={`h-5 w-5 rounded-full border-2 transition ${color === c && tool !== 'eraser' ? 'scale-125 border-white shadow' : 'border-transparent'}`}
              />
            ))}
          </div>

          {/* Stroke width */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600 text-[11px] font-medium">Size:</span>
            <input
              type="range"
              min="1"
              max="8"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-20 accent-brand-500 cursor-pointer"
            />
            <span className="text-[11px] text-slate-700 w-3">{lineWidth}</span>
          </div>

          {/* Undo / Redo / Clear / Zoom */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 disabled:opacity-40 transition"
              title="Undo"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 disabled:opacity-40 transition"
              title="Redo"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <button
              onClick={clearCanvas}
              className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 transition"
              title="Clear Canvas"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <div className="h-4 w-px bg-slate-100 mx-1"></div>

            <button
              onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-[11px] text-slate-600">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Canvas Workspace */}
        <div className="flex-1 relative bg-slate-50 overflow-hidden cursor-crosshair">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              width: '100%',
              height: '100%'
            }}
            className="w-full h-full block"
          />
        </div>
      </div>
    </div>
  );
}
