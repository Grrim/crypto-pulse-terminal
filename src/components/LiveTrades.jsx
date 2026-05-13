// ═══════════════════════════════════════════════════════════════
// LiveTrades — time & sales tape with whale alerts
// ═══════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowUpCircle, ArrowDownCircle, Fish } from 'lucide-react';

const fmtNotional = (n) => {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

const fmtTime = (t) => new Date(t).toLocaleTimeString('en-GB', { hour12: false });

export default function LiveTrades({ trades }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass-card hud-corners p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-warning" />
          <h3 className="text-sm font-bold text-text-primary">Live Trades</h3>
          <span className="text-[9px] font-semibold text-text-muted uppercase tracking-wider">Tape</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-text-muted font-mono">
          <div className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse-live" />
          <span>{trades.length} prints</span>
        </div>
      </div>

      {/* Header */}
      <div className="grid grid-cols-[40px_1fr_1fr_1fr_60px] gap-2 text-[9px] font-semibold uppercase tracking-wider text-text-muted pb-1 border-b border-border/60">
        <span>Side</span>
        <span>Pair</span>
        <span className="text-right">Price</span>
        <span className="text-right">Notional</span>
        <span className="text-right">Time</span>
      </div>

      {/* List */}
      <div className="flex flex-col gap-px max-h-[260px] overflow-y-auto">
        <AnimatePresence initial={false}>
          {trades.map((t) => {
            const buy = t.side === 'buy';
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -10, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={`grid grid-cols-[40px_1fr_1fr_1fr_60px] gap-2 items-center px-2 py-1 rounded-md text-[11px] font-mono ${
                  t.isWhale
                    ? buy
                      ? 'bg-bull/10 border border-bull/20'
                      : 'bg-bear/10 border border-bear/20'
                    : ''
                }`}
              >
                <span className={`flex items-center ${buy ? 'text-bull' : 'text-bear'}`}>
                  {buy
                    ? <ArrowUpCircle className="h-3.5 w-3.5" />
                    : <ArrowDownCircle className="h-3.5 w-3.5" />}
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-text-primary font-semibold">{t.asset}</span>
                  <span className="text-text-muted">/USDT</span>
                  {t.isWhale && <Fish className="h-3 w-3 text-cyan-300" />}
                </span>
                <span className={`text-right ${buy ? 'text-bull' : 'text-bear'}`}>
                  {t.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className={`text-right font-semibold ${t.isWhale ? 'text-cyan-300 glow-neon' : 'text-text-secondary'}`}>
                  {fmtNotional(t.notional)}
                </span>
                <span className="text-right text-text-muted text-[10px]">{fmtTime(t.time)}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {trades.length === 0 && (
          <div className="text-center text-text-muted text-xs py-8">Waiting for trades…</div>
        )}
      </div>
    </motion.div>
  );
}
