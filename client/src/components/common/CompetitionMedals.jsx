import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { studentApi } from '../../services/api';
import {
  Trophy,
  Zap,
  Cpu,
  Sparkles,
  Users,
  CheckCircle2,
  Lock,
  ExternalLink,
  X,
  ChevronRight,
  ShieldCheck,
  Clock,
  Gauge
} from 'lucide-react';

export default function CompetitionMedals({ className = '', onMedalClick }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMedal, setSelectedMedal] = useState(null);
  const [activeView, setActiveView] = useState('all'); // 'all' | 'mine'

  useEffect(() => {
    let mounted = true;
    async function fetchMedals() {
      try {
        const res = await studentApi.getCompetitionMedals();
        if (res.success && mounted) {
          setData(res);
        }
      } catch (err) {
        console.warn('Failed to load competition medals from API, using fallback catalog');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchMedals();
    return () => { mounted = false; };
  }, []);

  const medals = data?.medals || defaultMedals;

  return (
    <div className={`relative rounded-3xl overflow-hidden shadow-2xl border border-amber-900/30 ${className}`}>
      
      {/* ── Luxury Jewelry Box Velvet Tray ──────────────────────────────── */}
      <div className="relative bg-[#07090e] p-6 sm:p-10 text-white select-none">
        
        {/* Subtle velvet texture and ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#111625] via-[#090b12] to-[#040508] opacity-90 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-amber-500/10 via-yellow-500/15 to-purple-600/10 blur-[100px] pointer-events-none" />
        
        {/* Sunken inner shadow / bezel rim */}
        <div className="absolute inset-0 border border-white/10 rounded-3xl shadow-[inset_0_4px_35px_rgba(0,0,0,0.9)] pointer-events-none" />

        {/* ── Header: "Competition Medals" ─────────────────────────────── */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-12">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-serif text-2xl sm:text-3xl tracking-wide text-[#e8d5b5] drop-shadow-[0_2px_10px_rgba(232,213,181,0.25)]">
                Competition Medals
              </h2>
              <span className="text-amber-400/80 animate-pulse text-xs">✦</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-sans tracking-wide">
              Elite institutional honors for code execution speed, time/space complexity, and tournament champions.
            </p>
          </div>

          {/* Quick Filter Pill */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedMedal(medals[1])}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-amber-200 text-xs font-semibold backdrop-blur-md transition"
            >
              <Users className="h-3.5 w-3.5 text-amber-300" />
              <span>Hall of Fame (All Users)</span>
            </button>
          </div>
        </div>

        {/* ── 3 Medals Showcase Display ────────────────────────────────── */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-6 items-center justify-items-center max-w-4xl mx-auto py-2">
          
          {/* MEDAL 1: FASTEST SOLVER (Left) */}
          <MedalCard
            medal={medals[0]}
            onClick={() => setSelectedMedal(medals[0])}
          >
            <FastestSolverSvg />
          </MedalCard>

          {/* MEDAL 2: PLATINUM OVERALL CHAMPION (Centerpiece, Large) */}
          <MedalCard
            medal={medals[1]}
            isCenterpiece={true}
            onClick={() => setSelectedMedal(medals[1])}
          >
            <PlatinumChampionSvg />
          </MedalCard>

          {/* MEDAL 3: CODE OPTIMIZER (Right) */}
          <MedalCard
            medal={medals[2]}
            onClick={() => setSelectedMedal(medals[2])}
          >
            <CodeOptimizerSvg />
          </MedalCard>

        </div>

        {/* Bottom Sparkle Accent */}
        <div className="absolute bottom-4 right-6 pointer-events-none text-amber-200/40 text-lg">
          ✦
        </div>
      </div>

      {/* ── DETAIL / HALL OF FAME MODAL ────────────────────────────────── */}
      <AnimatePresence>
        {selectedMedal && (
          <MedalDetailModal
            medal={selectedMedal}
            onClose={() => setSelectedMedal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── MEDAL CARD WRAPPER ──────────────────────────────────────────────────
function MedalCard({ medal, isCenterpiece = false, children, onClick }) {
  if (!medal) return null;

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex flex-col items-center text-center cursor-pointer group relative ${
        isCenterpiece ? 'order-first md:order-none' : ''
      }`}
    >
      {/* Medal Graphic SVG */}
      <div className="relative filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)] transition-transform duration-300">
        {children}

        {/* Shine beam on hover */}
        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-tr from-transparent via-white/10 to-transparent blur-md" />
      </div>

      {/* Centerpiece Distinctive Pill Banner vs Text */}
      {isCenterpiece ? (
        <div className="mt-5 px-5 py-2 rounded-xl bg-gradient-to-r from-slate-900 via-black to-slate-900 border border-amber-400/40 shadow-lg shadow-black/80 flex flex-col items-center">
          <span className="text-[11px] sm:text-xs font-black tracking-widest text-slate-200 uppercase">
            PLATINUM
          </span>
          <span className="text-xs sm:text-sm font-black tracking-wider text-[#e6cb97] uppercase">
            OVERALL CHAMPION
          </span>
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center">
          <h3 className="text-sm sm:text-base font-serif font-black tracking-wider text-[#e2c799] uppercase drop-shadow-sm">
            {medal.title}
          </h3>
        </div>
      )}

      {/* Subtitle / Metric Preview */}
      <div className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-300 group-hover:border-amber-400/40 group-hover:text-amber-200 transition">
        {medal.type === 'fastest' && <Zap className="h-3 w-3 text-amber-400" />}
        {medal.type === 'champion' && <Trophy className="h-3 w-3 text-yellow-400" />}
        {medal.type === 'optimizer' && <Cpu className="h-3 w-3 text-orange-400" />}
        <span>{medal.holders?.[0]?.metricDisplay || medal.criteria}</span>
      </div>

      <span className="mt-1 text-[10px] text-amber-400/60 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition">
        Click to view all badge holders →
      </span>
    </motion.div>
  );
}

// ── 1. FASTEST SOLVER SVG (Silver / Platinum Hexagon with Stopwatch) ────
export function FastestSolverSvg({ size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Hexagon Outer Silver Rim Gradient */}
        <linearGradient id="silverRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="25%" stopColor="#cbd5e1" />
          <stop offset="50%" stopColor="#64748b" />
          <stop offset="75%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>

        {/* Hexagon Face Brushed Titanium */}
        <radialGradient id="silverFace" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="60%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1e293b" />
        </radialGradient>

        {/* Stopwatch Metallic Gradient */}
        <linearGradient id="stopwatchMetal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>

        {/* Drop shadow filter */}
        <filter id="hexGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.8" />
        </filter>
      </defs>

      {/* Hexagon Beveled Outer Ring */}
      <polygon
        points="70,8 126,40 126,100 70,132 14,100 14,40"
        fill="url(#silverRim)"
        filter="url(#hexGlow)"
      />

      {/* Hexagon Inner Recessed Face */}
      <polygon
        points="70,15 120,44 120,96 70,125 20,96 20,44"
        fill="url(#silverFace)"
        stroke="#1e293b"
        strokeWidth="1.5"
      />

      {/* Inner Hexagon Outline Highlight */}
      <polygon
        points="70,22 113,47 113,93 70,118 27,93 27,47"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="1"
        strokeOpacity="0.5"
      />

      {/* ── STOPWATCH ICON & MOTION SPEED DASHES ── */}
      <g transform="translate(70, 68)">
        
        {/* Top Stem & Button */}
        <rect x="-3" y="-38" width="6" height="7" rx="1.5" fill="url(#stopwatchMetal)" />
        <path d="M-8 -38 L8 -38" stroke="url(#stopwatchMetal)" strokeWidth="2.5" strokeLinecap="round" />

        {/* Stopwatch Outer Ring */}
        <circle cx="0" cy="-14" r="23" fill="none" stroke="url(#stopwatchMetal)" strokeWidth="4.5" />
        <circle cx="0" cy="-14" r="19" fill="#1e293b" stroke="#64748b" strokeWidth="1" />

        {/* Clock Center Pin */}
        <circle cx="0" cy="-14" r="3" fill="#ffffff" />

        {/* Clock Hand (pointing to 10-to-2) */}
        <line x1="0" y1="-14" x2="8" y2="-23" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

        {/* Left Motion Speed Dashes */}
        <line x1="-34" y1="-22" x2="-26" y2="-22" stroke="url(#stopwatchMetal)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="-38" y1="-14" x2="-27" y2="-14" stroke="url(#stopwatchMetal)" strokeWidth="3" strokeLinecap="round" />
        <line x1="-33" y1="-6" x2="-26" y2="-6" stroke="url(#stopwatchMetal)" strokeWidth="2.5" strokeLinecap="round" />

        {/* Engraved bottom text "DAVS" */}
        <text
          x="0"
          y="28"
          fill="#cbd5e1"
          fontSize="8"
          fontWeight="900"
          fontFamily="system-ui, sans-serif"
          letterSpacing="2.5"
          textAnchor="middle"
          opacity="0.9"
        >
          DAVS
        </text>
      </g>
    </svg>
  );
}

// ── 2. PLATINUM OVERALL CHAMPION SVG (24K Gold 16-point Starburst) ─────
export function PlatinumChampionSvg({ size = 150 }) {
  // Generate 16 outer ray points & 16 inner base points for starburst
  const points = [];
  const numPoints = 16;
  const outerR = 64;
  const innerR = 46;
  const cx = 70;
  const cy = 70;

  for (let i = 0; i < numPoints * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / numPoints - Math.PI / 2;
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }

  // Secondary offset star for the magnificent multi-layer effect in the reference
  const points2 = [];
  for (let i = 0; i < numPoints * 2; i++) {
    const r = i % 2 === 0 ? outerR * 0.94 : innerR * 0.92;
    const angle = (i * Math.PI) / numPoints - Math.PI / 2 + Math.PI / (numPoints * 2);
    points2.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }

  return (
    <svg width={size} height={size} viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* 24K Gold Rich Gradient */}
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="25%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="75%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>

        {/* Star Shading Facets */}
        <linearGradient id="goldDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>

        {/* Center Platinum Disc */}
        <radialGradient id="centerDisc" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#e2e8f0" />
          <stop offset="75%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </radialGradient>

        <filter id="starGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#f59e0b" floodOpacity="0.4" />
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000000" floodOpacity="0.9" />
        </filter>
      </defs>

      {/* Layer 1: Secondary 16-point Gold Star Base */}
      <polygon
        points={points2.join(' ')}
        fill="url(#goldDark)"
        stroke="#fde047"
        strokeWidth="1"
        filter="url(#starGlow)"
      />

      {/* Layer 2: Primary 16-point Gold Starburst */}
      <polygon
        points={points.join(' ')}
        fill="url(#goldGradient)"
        stroke="#fef08a"
        strokeWidth="1.5"
      />

      {/* Inner Concentric Gold Rings with Relief */}
      <circle cx="70" cy="70" r="34" fill="url(#goldDark)" stroke="#fef08a" strokeWidth="2" />
      <circle cx="70" cy="70" r="30" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="3 2" />

      {/* Layer 3: Brushed Platinum Centerpiece Disc */}
      <circle cx="70" cy="70" r="25" fill="url(#centerDisc)" stroke="#ffffff" strokeWidth="2" />
      <circle cx="70" cy="70" r="22" fill="none" stroke="#475569" strokeWidth="1" opacity="0.6" />

      {/* Center Coding Emblem `</>` */}
      <g transform="translate(70, 68)" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Left bracket < */}
        <polyline points="-11,-6 -17,0 -11,6" />
        
        {/* Slash / */}
        <line x1="-3" y1="9" x2="3" y2="-9" />
        
        {/* Right bracket > */}
        <polyline points="11,-6 17,0 11,6" />
      </g>

      {/* Engraved Laurel Wreath Crest Underneath */}
      <path
        d="M60 81 C64 85, 76 85, 80 81 M65 83 L63 85 M75 83 L77 85"
        stroke="#334155"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// ── 3. CODE OPTIMIZER SVG (Antique Bronze Hexagon with Gear) ────────────
export function CodeOptimizerSvg({ size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Hexagon Outer Bronze/Copper Gradient */}
        <linearGradient id="bronzeRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="30%" stopColor="#f97316" />
          <stop offset="60%" stopColor="#c2410c" />
          <stop offset="85%" stopColor="#7c2d12" />
          <stop offset="100%" stopColor="#431407" />
        </linearGradient>

        {/* Hexagon Face Brushed Copper */}
        <radialGradient id="bronzeFace" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ea580c" />
          <stop offset="60%" stopColor="#9a3412" />
          <stop offset="100%" stopColor="#431407" />
        </radialGradient>

        {/* Gear Copper Relief */}
        <linearGradient id="gearMetal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffedd5" />
          <stop offset="50%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#7c2d12" />
        </linearGradient>
      </defs>

      {/* Hexagon Beveled Outer Ring */}
      <polygon
        points="70,8 126,40 126,100 70,132 14,100 14,40"
        fill="url(#bronzeRim)"
        filter="url(#hexGlow)"
      />

      {/* Hexagon Inner Recessed Face */}
      <polygon
        points="70,15 120,44 120,96 70,125 20,96 20,44"
        fill="url(#bronzeFace)"
        stroke="#431407"
        strokeWidth="1.5"
      />

      {/* Inner Hexagon Outline Highlight */}
      <polygon
        points="70,22 113,47 113,93 70,118 27,93 27,47"
        fill="none"
        stroke="#fdba74"
        strokeWidth="1"
        strokeOpacity="0.4"
      />

      {/* ── MECHANICAL GEAR WITH CODE SYMBOL ── */}
      <g transform="translate(70, 68)">
        
        {/* 8-Teeth Gear Shape */}
        <path
          d="M-7 -27 L7 -27 L8 -22 A21 21 0 0 1 15 -19 L20 -21 L27 -14 L24 -8 A21 21 0 0 1 27 0 L32 2 L32 12 L27 14 A21 21 0 0 1 24 22 L27 28 L20 35 L14 32 A21 21 0 0 1 7 35 L5 40 L-5 40 L-7 35 A21 21 0 0 1 -14 32 L-20 35 L-27 28 L-24 22 A21 21 0 0 1 -27 14 L-32 12 L-32 2 L-27 0 A21 21 0 0 1 -24 -8 L-27 -14 L-20 -21 L-14 -19 A21 21 0 0 1 -7 -22 Z"
          fill="url(#gearMetal)"
          stroke="#431407"
          strokeWidth="1.5"
          transform="translate(0, -6)"
        />

        {/* Center Recessed Gear Core */}
        <circle cx="0" cy="-6" r="14" fill="#431407" stroke="#fdba74" strokeWidth="1" />

        {/* Code Symbol `</>` inside gear */}
        <g stroke="#ffedd5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" transform="translate(0, -6)">
          <polyline points="-8,-4 -12,0 -8,4" />
          <line x1="-2" y1="6" x2="2" y2="-6" />
          <polyline points="8,-4 12,0 8,4" />
        </g>

        {/* Engraved bottom text "DAVS" */}
        <text
          x="0"
          y="28"
          fill="#fed7aa"
          fontSize="8"
          fontWeight="900"
          fontFamily="system-ui, sans-serif"
          letterSpacing="2.5"
          textAnchor="middle"
          opacity="0.9"
        >
          DAVS
        </text>
      </g>
    </svg>
  );
}

// ── MODAL: MEDAL LEDGER & HALL OF FAME ──────────────────────────────────
function MedalDetailModal({ medal, onClose }) {
  const [tab, setTab] = useState('holders'); // 'holders' | 'criteria'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="bg-[#0b0e17] text-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-amber-900/50 flex flex-col"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <Trophy className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#e8d5b5]">
                {medal.title}
              </h3>
              <p className="text-xs text-slate-400">{medal.tier}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Medal Hero Summary in Modal */}
        <div className="p-6 bg-gradient-to-b from-white/[0.04] to-transparent border-b border-white/5 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            {medal.type === 'fastest' && <FastestSolverSvg size={100} />}
            {medal.type === 'champion' && <PlatinumChampionSvg size={115} />}
            {medal.type === 'optimizer' && <CodeOptimizerSvg size={100} />}
          </div>
          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 font-bold text-[10px] uppercase tracking-wider">
              {medal.tag || 'COMPETITION HONOR'}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {medal.description}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-bold text-amber-200 bg-black/40 px-3 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                {medal.criteria}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs for Holders vs Criteria */}
        <div className="flex border-b border-white/10 px-6 bg-black/30">
          <button
            onClick={() => setTab('holders')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
              tab === 'holders'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            All Medal Holders ({medal.holders?.length || 0})
          </button>
          <button
            onClick={() => setTab('criteria')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
              tab === 'criteria'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Award Rules & Complexity Thresholds
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[340px] overflow-y-auto space-y-3">
          {tab === 'holders' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 mb-2">
                Students across the institution who met the benchmark and unlocked this badge:
              </p>
              {medal.holders?.map((holder, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 transition ${
                    holder.isCurrent
                      ? 'bg-amber-500/10 border-amber-400/40 shadow-inner'
                      : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={holder.avatar}
                      alt={holder.name}
                      className="h-10 w-10 rounded-xl border border-white/20 object-cover bg-slate-800"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">
                          {holder.name}
                        </span>
                        {holder.isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-400 text-black uppercase">
                            YOU
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {holder.rollNumber} &bull; {holder.examTitle}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-300 block">
                      {holder.metricDisplay}
                    </span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 justify-end font-semibold">
                      <ShieldCheck className="h-3 w-3" /> Verified by AI Proctor
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <h4 className="font-bold text-amber-300">Technical Qualification Criteria:</h4>
                {medal.type === 'fastest' && (
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li>Execution runtime must be &lt; 150ms on all hidden and edge test suites.</li>
                    <li>First candidate in the active exam slot to submit error-free code.</li>
                    <li>Zero runtime warnings or memory segment faults.</li>
                  </ul>
                )}
                {medal.type === 'champion' && (
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li>Score 100% total possible marks across all coding and conceptual questions.</li>
                    <li>First to submit final exam attempt in the examination slot.</li>
                    <li>Maintain 100% clean proctoring trust score with 0 incidents.</li>
                  </ul>
                )}
                {medal.type === 'optimizer' && (
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li>Time Complexity: Must strictly achieve optimal asymptotic lower bound <code className="text-amber-200">O(N)</code> or <code className="text-amber-200">O(log N)</code>.</li>
                    <li>Space Complexity: Auxiliary memory must not exceed <code className="text-amber-200">O(1)</code> (constant auxiliary space).</li>
                    <li>Code submitted undergoes static AST parsing and algorithmic memory allocation profiling.</li>
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-black/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── FALLBACK MEDALS CATALOG ─────────────────────────────────────────────
const defaultMedals = [
  {
    id: 'fastest_solver',
    title: 'FASTEST SOLVER',
    type: 'fastest',
    tier: 'Platinum Silver Hexagon',
    tag: 'DAVS SPEED DEMON',
    criteria: 'Sub-150ms execution speed & first error-free code submission',
    description: 'Awarded to developers with the fastest code execution runtime and quickest problem resolution.',
    holders: [
      {
        name: 'Tamilvendhan C',
        rollNumber: '24AD118',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tamilvendhan',
        metricDisplay: '⚡ 114ms Execution • 1st to submit',
        examTitle: 'DSA Grand Sprint',
        isCurrent: true
      },
      {
        name: 'Alex Johnson',
        rollNumber: 'CS2026-001',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexJohnson',
        metricDisplay: '⚡ 128ms Execution • 2nd to submit',
        examTitle: 'Algorithmic Optimization Sprint',
        isCurrent: false
      }
    ]
  },
  {
    id: 'platinum_champion',
    title: 'PLATINUM OVERALL CHAMPION',
    type: 'champion',
    tier: '24K Imperial Starburst',
    tag: 'PLATINUM OVERALL CHAMPION',
    criteria: 'Rank #1 overall, solved first with 100% score & 0 proctoring infractions',
    description: 'The supreme competition medal crowned to the overall tournament champion who finishes first with maximum marks and immaculate integrity.',
    holders: [
      {
        name: 'Tamilvendhan C',
        rollNumber: '24AD118',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tamilvendhan',
        metricDisplay: '👑 Rank #1 Overall • 100/100 • 0 Flags',
        examTitle: 'Code Championship 2026',
        isCurrent: true
      }
    ]
  },
  {
    id: 'code_optimizer',
    title: 'CODE OPTIMIZER',
    type: 'optimizer',
    tier: 'Antique Bronze Hexagon',
    tag: 'DAVS COMPLEXITY MASTER',
    criteria: 'Optimal Time Complexity O(N) or O(log N) & Space Complexity O(1)',
    description: 'Awarded to algorithmic architects whose solutions achieve the theoretical lower bound for Time and Auxiliary Space complexity.',
    holders: [
      {
        name: 'Tamilvendhan C',
        rollNumber: '24AD118',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tamilvendhan',
        metricDisplay: '⚙️ Time: O(N) • Space: O(1) Constant',
        examTitle: 'Memory-Constrained DP Challenge',
        isCurrent: true
      },
      {
        name: 'Rahul Sharma',
        rollNumber: 'CS2026-003',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RahulSharma',
        metricDisplay: '⚙️ Time: O(log N) • Space: O(1)',
        examTitle: 'Binary Search Optimization',
        isCurrent: false
      }
    ]
  }
];
