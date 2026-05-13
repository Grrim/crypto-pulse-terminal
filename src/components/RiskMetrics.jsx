// ═══════════════════════════════════════════════════════════════
// RiskMetrics — Institutional-grade risk dashboard
// Sharpe, Sortino, VaR, CVaR, Max DD, ATR, ROC, Beta
// ═══════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { ShieldCheck, TrendingDown, Percent, Gauge, Target, Zap, Scale } from 'lucide-react';

const MetricCard = ({ label, value, unit, hint, color, icon: Icon }) => {
  // Color by semantic: invert=true means lower is better (e.g., VaR, MaxDD)
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2 border border-border hover:border-border-hover transition-colors">
      {Icon && (
        <div
          className="flex items-center justify-center h-8 w-8 rounded-lg shrink-0"
          style={{ background: `${color}15`, color }}
        >
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-text-muted truncate">{label}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-bold font-mono" style={{ color }}>
            {value}
          </span>
          {unit && <span className="text-[10px] font-mono text-text-muted">{unit}</span>}
        </div>
        {hint && <div className="text-[9px] text-text-muted mt-0.5">{hint}</div>}
      </div>
    </div>
  );
};

const colorFor = {
  // Higher is better
  sharpe:  (v) => v >= 1.5 ? '#10B981' : v >= 0.5 ? '#F59E0B' : '#EF4444',
  sortino: (v) => v >= 2.0 ? '#10B981' : v >= 0.8 ? '#F59E0B' : '#EF4444',
  roc:     (v) => v > 2 ? '#10B981' : v < -2 ? '#EF4444' : '#F59E0B',
  beta:    (v) => Math.abs(v - 1) < 0.2 ? '#94A3B8' : v > 1.5 ? '#EF4444' : v < 0.5 ? '#10B981' : '#F59E0B',
  // Lower is better
  var:     (v) => v < 1 ? '#10B981' : v < 3 ? '#F59E0B' : '#EF4444',
  maxDD:   (v) => v < 5 ? '#10B981' : v < 15 ? '#F59E0B' : '#EF4444',
};

const AssetRow = ({ label, color, data }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-2 pl-1">
      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-xs font-bold" style={{ color }}>{label}</span>
      <span className="text-[9px] text-text-muted font-mono">/ USDT</span>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <MetricCard
        label="Sharpe"  icon={Gauge}
        value={data.sharpe.toFixed(2)}
        color={colorFor.sharpe(data.sharpe)}
        hint="Risk-adjusted return"
      />
      <MetricCard
        label="Sortino" icon={Scale}
        value={data.sortino.toFixed(2)}
        color={colorFor.sortino(data.sortino)}
        hint="Downside-adjusted"
      />
      <MetricCard
        label="VaR 95%" icon={Percent}
        value={data.var95.toFixed(2)} unit="%"
        color={colorFor.var(data.var95)}
        hint="Max loss (95% conf)"
      />
      <MetricCard
        label="CVaR 95%" icon={TrendingDown}
        value={data.cvar95.toFixed(2)} unit="%"
        color={colorFor.var(data.cvar95)}
        hint="Expected tail loss"
      />
      <MetricCard
        label="Max DD" icon={TrendingDown}
        value={data.maxDrawdown.maxDD.toFixed(2)} unit="%"
        color={colorFor.maxDD(data.maxDrawdown.maxDD)}
        hint="Peak-to-trough"
      />
      <MetricCard
        label="ATR" icon={Zap}
        value={data.atr.toFixed(2)} unit="$"
        color="#A855F7"
        hint="Avg true range (14)"
      />
      <MetricCard
        label="ROC (10)" icon={Target}
        value={`${data.roc10 >= 0 ? '+' : ''}${data.roc10.toFixed(2)}`} unit="%"
        color={colorFor.roc(data.roc10)}
      />
      <MetricCard
        label="β vs BTC" icon={ShieldCheck}
        value={data.beta.toFixed(2)}
        color={colorFor.beta(data.beta)}
        hint="Market sensitivity"
      />
    </div>
  </div>
);

export default function RiskMetrics({ btcRisk, ethRisk }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.45 }}
      className="glass-card hud-corners p-5 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-purple-400" />
          <h3 className="text-sm font-bold text-text-primary">Risk & Performance Metrics</h3>
        </div>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-text-muted">Quant Lab</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AssetRow label="BTC" color="#F7931A" data={btcRisk} />
        <AssetRow label="ETH" color="#627EEA" data={ethRisk} />
      </div>

      <div className="neon-divider mt-1" />

      <p className="text-[9px] text-text-muted text-center leading-relaxed">
        Annualized assuming 15m candles · rf = 4.5% · historical VaR/CVaR method · Wilder-smoothed ATR · β regressed on BTC returns
      </p>
    </motion.div>
  );
}
