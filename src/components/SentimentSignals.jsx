import { Target, TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

const signalConfig = {
  'Strong Buy':  { color: '#10B981', bg: 'rgba(16,185,129,0.1)',  icon: ChevronUp,   barPct: 90 },
  'Buy':         { color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   icon: TrendingUp,  barPct: 70 },
  'Neutral':     { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  icon: Minus,       barPct: 50 },
  'Sell':        { color: '#F97316', bg: 'rgba(249,115,22,0.1)',   icon: TrendingDown, barPct: 30 },
  'Strong Sell': { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',    icon: ChevronDown, barPct: 10 },
};

function SignalGauge({ signal, strength }) {
  const cfg = signalConfig[signal] || signalConfig['Neutral'];
  const Icon = cfg.icon;
  // Map strength (-100 to 100) to gauge position (0 to 100)
  const gaugePos = ((strength + 100) / 200) * 100;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Signal Badge */}
      <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ backgroundColor: cfg.bg }}>
        <Icon className="h-4 w-4" style={{ color: cfg.color }} />
        <span className="text-sm font-bold" style={{ color: cfg.color }}>{signal}</span>
      </div>

      {/* Gauge Bar */}
      <div className="w-full relative">
        <div className="h-2 rounded-full bg-gradient-to-r from-bear via-warning to-bull overflow-hidden opacity-30" />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-4 w-1 rounded-full bg-white shadow-lg transition-all duration-700"
          style={{ left: `${gaugePos}%` }}
        />
      </div>

      {/* Strength */}
      <span className="text-[10px] font-mono text-text-muted">
        Score: <span style={{ color: cfg.color }}>{strength > 0 ? '+' : ''}{strength.toFixed(0)}</span>
      </span>
    </div>
  );
}

function IndicatorRow({ label, value, unit, good, bad }) {
  const isGood = good?.(value);
  const isBad = bad?.(value);
  const color = isGood ? '#10B981' : isBad ? '#EF4444' : '#94A3B8';

  return (
    <div className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
      <span className="text-[10px] text-text-muted">{label}</span>
      <span className="text-xs font-mono font-semibold" style={{ color }}>
        {typeof value === 'number' ? value.toFixed(2) : value}{unit || ''}
      </span>
    </div>
  );
}

export default function SentimentSignals({ btcTA, ethTA }) {
  const assets = [
    { key: 'BTC', ta: btcTA, accent: '#F7931A' },
    { key: 'ETH', ta: ethTA, accent: '#627EEA' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card hud-corners p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-info" />
        <h3 className="text-sm font-bold text-text-primary">Sentiment & Signals</h3>
      </div>

      <div className="flex flex-col gap-5">
        {assets.map(({ key, ta, accent }) => (
          <div key={key} className="flex flex-col gap-3">
            {/* Asset Label */}
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
              <span className="text-xs font-bold" style={{ color: accent }}>{key}/USDT</span>
            </div>

            {/* Signal Gauge */}
            <SignalGauge signal={ta.signal.signal} strength={ta.signal.strength} />

            {/* Indicator Breakdown */}
            <div className="flex flex-col">
              <IndicatorRow label="RSI (14)" value={ta.currentRSI} good={v => v < 30} bad={v => v > 70} />
              <IndicatorRow label="MACD Hist" value={ta.currentMACD.histogram} good={v => v > 0} bad={v => v < 0} />
              <IndicatorRow label="MACD Cross" value={ta.signal.details.macdCrossover} />
              <IndicatorRow label="Volatility" value={ta.volatility} unit="%" bad={v => v > 80} />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
