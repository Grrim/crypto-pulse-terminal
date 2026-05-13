import { useMemo } from 'react';
import { BookOpen, ArrowLeftRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrderBook({ title, data, accent = '#10B981' }) {
  const { bids, asks } = data;

  const maxBidAmt = useMemo(() => Math.max(...bids.map(b => parseFloat(b.amount) || 0), 0.001), [bids]);
  const maxAskAmt = useMemo(() => Math.max(...asks.map(a => parseFloat(a.amount) || 0), 0.001), [asks]);

  const spread = useMemo(() => {
    if (asks.length > 0 && bids.length > 0) {
      const askP = parseFloat(asks[0].price);
      const bidP = parseFloat(bids[0].price);
      const mid = (askP + bidP) / 2;
      return { value: (askP - bidP).toFixed(2), pct: ((askP - bidP) / mid * 100).toFixed(3), mid: mid.toFixed(2) };
    }
    return { value: '0', pct: '0', mid: '0' };
  }, [bids, asks]);

  if (bids.length === 0 && asks.length === 0) {
    return (
      <div className="glass-card p-5 flex items-center justify-center h-48">
        <span className="text-text-muted text-sm">Loading order book...</span>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="glass-card hud-corners p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" style={{ color: accent }} />
          <h3 className="text-sm font-bold text-text-primary">{title}</h3>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 py-1">
          <ArrowLeftRight className="h-3 w-3 text-text-muted" />
          <span className="text-[10px] font-mono text-text-muted">
            Spread: <span className="text-text-secondary">${spread.value}</span> <span className="text-text-muted">({spread.pct}%)</span>
          </span>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex justify-between text-[9px] font-semibold uppercase tracking-wider text-text-muted mb-1.5 px-1">
            <span>Price (USDT)</span>
            <span>Amount</span>
          </div>
          {bids.slice(0, 8).map((bid, i) => {
            const pct = (parseFloat(bid.amount) / maxBidAmt) * 100;
            return (
              <div key={`bid-${i}`} className="relative flex justify-between items-center py-0.5 px-1 text-xs font-mono rounded-sm mb-px">
                <div className="absolute inset-0 depth-bar-bid rounded-sm" style={{ width: `${pct}%` }} />
                <span className="relative text-bull">{parseFloat(bid.price).toFixed(2)}</span>
                <span className="relative text-text-secondary">{parseFloat(bid.amount).toFixed(4)}</span>
              </div>
            );
          })}
        </div>
        <div>
          <div className="flex justify-between text-[9px] font-semibold uppercase tracking-wider text-text-muted mb-1.5 px-1">
            <span>Price (USDT)</span>
            <span>Amount</span>
          </div>
          {asks.slice(0, 8).map((ask, i) => {
            const pct = (parseFloat(ask.amount) / maxAskAmt) * 100;
            return (
              <div key={`ask-${i}`} className="relative flex justify-between items-center py-0.5 px-1 text-xs font-mono rounded-sm mb-px">
                <div className="absolute inset-0 depth-bar-ask rounded-sm" style={{ width: `${pct}%` }} />
                <span className="relative text-bear">{parseFloat(ask.price).toFixed(2)}</span>
                <span className="relative text-text-secondary">{parseFloat(ask.amount).toFixed(4)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mid Price */}
      <div className="flex items-center justify-center gap-2 pt-1 border-t border-border">
        <span className="text-[10px] text-text-muted">Mid Price:</span>
        <span className="text-xs font-mono font-bold" style={{ color: accent }}>${spread.mid}</span>
      </div>
    </motion.div>
  );
}
