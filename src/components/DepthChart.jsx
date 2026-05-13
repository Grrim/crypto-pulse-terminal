// ═══════════════════════════════════════════════════════════════
// DepthChart — cumulative liquidity curve (bids vs asks)
// ═══════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Layers3 } from 'lucide-react';
import { motion } from 'framer-motion';

const DepthTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="glass-card p-2.5 text-[10px] font-mono border border-border">
      <div className="text-text-muted mb-1">Price: <span className="text-text-primary">${d.price?.toFixed(2)}</span></div>
      {d.bid != null && <div>Bids: <span className="text-bull">{d.bid.toFixed(4)}</span></div>}
      {d.ask != null && <div>Asks: <span className="text-bear">{d.ask.toFixed(4)}</span></div>}
    </div>
  );
};

export default function DepthChart({ title, depth, mid, accent = '#22D3EE' }) {
  const { data, minP, maxP } = useMemo(() => {
    const bids = [...(depth.bids || [])]
      .map(b => ({ price: +b.price, amount: +b.amount }))
      .sort((a, b) => b.price - a.price);
    const asks = [...(depth.asks || [])]
      .map(a => ({ price: +a.price, amount: +a.amount }))
      .sort((a, b) => a.price - b.price);

    const bidPts = bids.reduce((acc, b) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].bid : 0;
      return [...acc, { price: b.price, bid: prev + b.amount, ask: null }];
    }, []).reverse();

    const askPts = asks.reduce((acc, a) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].ask : 0;
      return [...acc, { price: a.price, bid: null, ask: prev + a.amount }];
    }, []);

    const combined = [...bidPts, ...askPts];
    const prices = combined.map(p => p.price);
    return {
      data: combined,
      minP: Math.min(...prices),
      maxP: Math.max(...prices),
    };
  }, [depth]);

  if (!data.length) {
    return (
      <div className="glass-card p-5 flex items-center justify-center h-48">
        <span className="text-text-muted text-sm">Loading depth…</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="glass-card hud-corners p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers3 className="h-4 w-4" style={{ color: accent }} />
          <h3 className="text-sm font-bold text-text-primary">{title}</h3>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-semibold">
          <div className="flex items-center gap-1"><div className="h-0.5 w-4 rounded bg-bull" /><span className="text-text-muted">Bids</span></div>
          <div className="flex items-center gap-1"><div className="h-0.5 w-4 rounded bg-bear" /><span className="text-text-muted">Asks</span></div>
        </div>
      </div>

      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
            <defs>
              <linearGradient id="bidArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="askArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="price" type="number" domain={[minP, maxP]}
              tick={{ fontSize: 9, fill: '#64748B' }}
              axisLine={false} tickLine={false}
              tickFormatter={v => v.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            />
            <YAxis tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} width={35} />
            <Tooltip content={<DepthTooltip />} cursor={{ stroke: '#64748B', strokeDasharray: '3 3' }} />
            <ReferenceLine x={mid} stroke={accent} strokeDasharray="2 4" strokeWidth={1} />
            <Area type="stepAfter" dataKey="bid" stroke="#10B981" strokeWidth={1.5} fill="url(#bidArea)" connectNulls={false} isAnimationActive={false} />
            <Area type="stepBefore" dataKey="ask" stroke="#EF4444" strokeWidth={1.5} fill="url(#askArea)" connectNulls={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
