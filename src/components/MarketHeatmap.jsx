// ═══════════════════════════════════════════════════════════════
// MarketHeatmap — treemap-ish grid of coins
// Cell size = market cap weight, color = 24h change
// ═══════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { Grid3x3 } from 'lucide-react';
import { motion } from 'framer-motion';

const heatColor = (change) => {
  const clamped = Math.max(-10, Math.min(10, change));
  if (clamped >= 0) {
    const alpha = 0.15 + (clamped / 10) * 0.55;
    return `rgba(16, 185, 129, ${alpha})`;
  }
  const alpha = 0.15 + (Math.abs(clamped) / 10) * 0.55;
  return `rgba(239, 68, 68, ${alpha})`;
};

const borderColor = (change) => {
  if (change >= 5) return 'rgba(16,185,129,0.6)';
  if (change >= 2) return 'rgba(16,185,129,0.35)';
  if (change <= -5) return 'rgba(239,68,68,0.6)';
  if (change <= -2) return 'rgba(239,68,68,0.35)';
  return 'rgba(148,163,184,0.15)';
};

const fmtPrice = (p) => p >= 1000
  ? p.toLocaleString('en-US', { maximumFractionDigits: 0 })
  : p >= 1 ? p.toFixed(2) : p.toFixed(4);

const fmtMC = (mc) => {
  if (mc >= 1e12) return `$${(mc / 1e12).toFixed(2)}T`;
  if (mc >= 1e9)  return `$${(mc / 1e9).toFixed(2)}B`;
  if (mc >= 1e6)  return `$${(mc / 1e6).toFixed(0)}M`;
  return `$${mc.toFixed(0)}`;
};

export default function MarketHeatmap({ watchlist }) {
  const cells = useMemo(() => {
    return [...watchlist].sort((a, b) => b.marketCap - a.marketCap);
  }, [watchlist]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card hud-corners p-5 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid3x3 className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-text-primary">Market Heatmap</h3>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-wider text-text-muted">
          <span>−10%</span>
          <div className="h-2 w-28 rounded-full bg-gradient-to-r from-bear via-text-muted/30 to-bull" />
          <span>+10%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {cells.map((coin) => {
          const up = coin.change24h >= 0;
          const bg = heatColor(coin.change24h);
          const bd = borderColor(coin.change24h);
          return (
            <motion.div
              key={coin.symbol}
              layout
              className="heatmap-cell relative rounded-xl p-3 flex flex-col justify-between gap-1 min-h-[110px] cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${bg} 0%, rgba(0,0,0,0.3) 100%)`,
                border: `1px solid ${bd}`,
                boxShadow: up
                  ? `inset 0 0 30px rgba(16,185,129,0.08)`
                  : `inset 0 0 30px rgba(239,68,68,0.08)`,
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-extrabold tracking-wide"
                  style={{ color: coin.color }}
                >
                  {coin.symbol}
                </span>
                <span className={`text-[10px] font-bold font-mono ${up ? 'text-bull' : 'text-bear'}`}>
                  {up ? '+' : ''}{coin.change24h.toFixed(2)}%
                </span>
              </div>

              <div className="absolute inset-x-2 bottom-[34px] h-6 opacity-70">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={coin.sparkline.map((v, i) => ({ i, v }))}>
                    <defs>
                      <linearGradient id={`heat-${coin.symbol}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={up ? '#10B981' : '#EF4444'} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={up ? '#10B981' : '#EF4444'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <YAxis domain={['dataMin', 'dataMax']} hide />
                    <Area
                      type="monotone" dataKey="v"
                      stroke={up ? '#10B981' : '#EF4444'}
                      strokeWidth={1.2}
                      fill={`url(#heat-${coin.symbol})`} dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col leading-tight">
                <span className="text-[10px] font-semibold font-mono text-text-primary">
                  ${fmtPrice(coin.price)}
                </span>
                <span className="text-[9px] text-text-muted font-mono">
                  {fmtMC(coin.marketCap)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
