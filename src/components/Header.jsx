// ═══════════════════════════════════════════════════════════════
// HeaderHUD — Global Market Intelligence Bar (v2)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import {
  Activity, Globe, TrendingUp, BarChart3, Zap,
  Wifi, RadioTower, Cpu,
} from 'lucide-react';
import { motion } from 'framer-motion';

const statusMap = {
  live:       { color: '#10B981', label: 'LIVE',    icon: Wifi },
  connecting: { color: '#F59E0B', label: 'SYNC',    icon: RadioTower },
  offline:    { color: '#94A3B8', label: 'MOCK',    icon: Cpu },
};

export default function HeaderHUD({ marketOverview, fearGreedInfo, wsStatus = 'live' }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const formatMC = (v) => `$${v.toFixed(2)}T`;
  const formatVol = (v) => `$${v.toFixed(1)}B`;

  const stats = [
    { icon: Globe,       label: 'Market Cap', value: formatMC(marketOverview.totalMarketCap),  color: 'text-blue-400' },
    { icon: BarChart3,   label: '24h Volume', value: formatVol(marketOverview.total24hVolume), color: 'text-purple-400' },
    { icon: TrendingUp,  label: 'BTC Dom',    value: `${marketOverview.btcDominance.toFixed(1)}%`, color: 'text-btc' },
    { icon: TrendingUp,  label: 'ETH Dom',    value: `${marketOverview.ethDominance.toFixed(1)}%`, color: 'text-eth' },
  ];

  const status = statusMap[wsStatus] || statusMap.live;
  const StatusIcon = status.icon;

  return (
    <header className="relative w-full border-b border-border px-4 py-3 lg:px-6 backdrop-blur-xl bg-bg-primary/40 z-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* ─── Logo ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/25 via-blue-500/20 to-purple-600/25 border border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.25)]">
              <Activity className="h-5 w-5 text-cyan-300" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-bull border-2 border-bg-primary animate-pulse-live" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-grad-neon">
              Crypto Pulse
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
              Institutional · Quant · Terminal
            </p>
          </div>
        </motion.div>

        {/* ─── Market Stats ──────────────────────────────── */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 bg-white/[0.03] border border-transparent hover:border-border-hover transition-colors min-w-fit"
            >
              <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
              <div className="flex flex-col leading-tight">
                <span className="text-[9px] font-medium uppercase tracking-wider text-text-muted">
                  {stat.label}
                </span>
                <span className="text-xs font-bold font-mono text-text-primary">
                  {stat.value}
                </span>
              </div>
            </motion.div>
          ))}

          {/* Fear & Greed */}
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 bg-white/[0.03] border border-transparent hover:border-border-hover transition-colors min-w-fit"
          >
            <Zap className="h-3.5 w-3.5" style={{ color: fearGreedInfo.color }} />
            <div className="flex flex-col leading-tight">
              <span className="text-[9px] font-medium uppercase tracking-wider text-text-muted">Fear & Greed</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold font-mono" style={{ color: fearGreedInfo.color }}>
                  {marketOverview.fearGreedIndex}
                </span>
                <span className="text-[9px] text-text-muted">{fearGreedInfo.label}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ─── Status / Clock ────────────────────────────── */}
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.03]">
            <span className="text-text-primary">{currentTime.toLocaleTimeString('en-GB')}</span>
            <span className="text-text-muted/60">
              UTC{currentTime.getTimezoneOffset() <= 0 ? '+' : '-'}{Math.abs(currentTime.getTimezoneOffset() / 60)}
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border"
            style={{
              borderColor: `${status.color}40`,
              background: `${status.color}15`,
            }}
          >
            <div
              className="h-1.5 w-1.5 rounded-full animate-pulse-live"
              style={{ backgroundColor: status.color }}
            />
            <StatusIcon className="h-3.5 w-3.5" style={{ color: status.color }} />
            <span className="text-[10px] font-bold tracking-wider" style={{ color: status.color }}>
              {status.label}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
