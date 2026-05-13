// ═══════════════════════════════════════════════════════════════
// MainTradingView — Institutional Trading Chart
// Real candlesticks (SVG) + Bollinger + EMA50/200 + RSI + MACD
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  ComposedChart, Area, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import {
  Layers, TrendingUp, BarChart3, Activity, CandlestickChart as CandleIcon,
  LineChart as LineIcon, Waves,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Custom Candlestick Shape (range-bar based) ─────────────

function CandleShape(props) {
  const { x, y, width, height, payload } = props;
  if (!payload || payload.open == null || payload.close == null) return null;
  const { open, close, high, low } = payload;
  if (high === low) return null;

  const bullish = close >= open;
  const color = bullish ? '#10B981' : '#EF4444';

  // y = top of range (high), y+height = bottom of range (low)
  const range = high - low;
  const topVal = Math.max(open, close);
  const botVal = Math.min(open, close);
  const bodyTop = y + ((high - topVal) / range) * height;
  const bodyBot = y + ((high - botVal) / range) * height;
  const bodyH = Math.max(bodyBot - bodyTop, 1);

  const cx = x + width / 2;
  const candleW = Math.max(width * 0.62, 2);

  return (
    <g>
      {/* Wick */}
      <line x1={cx} x2={cx} y1={y} y2={y + height} stroke={color} strokeWidth={1} />
      {/* Body */}
      <rect
        x={cx - candleW / 2} y={bodyTop}
        width={candleW} height={bodyH}
        fill={color} fillOpacity={bullish ? 0.88 : 0.96}
        stroke={color} strokeWidth={0.8}
      />
    </g>
  );
}

// Tooltip
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const delta = d.close != null && d.open != null ? d.close - d.open : 0;
  const pct = d.open ? (delta / d.open) * 100 : 0;
  const up = delta >= 0;
  return (
    <div className="glass-card p-3 text-xs font-mono border border-border" style={{ backdropFilter: 'blur(12px)' }}>
      <div className="text-text-muted mb-1.5">{new Date(d.time).toLocaleString()}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        <span className="text-text-muted">O:</span><span className="text-text-primary">${d.open?.toFixed(2)}</span>
        <span className="text-text-muted">H:</span><span className="text-bull">${d.high?.toFixed(2)}</span>
        <span className="text-text-muted">L:</span><span className="text-bear">${d.low?.toFixed(2)}</span>
        <span className="text-text-muted">C:</span><span className="text-text-primary">${d.close?.toFixed(2)}</span>
        <span className="text-text-muted">Δ:</span>
        <span className={up ? 'text-bull' : 'text-bear'}>
          {up ? '+' : ''}{delta?.toFixed(2)} ({up ? '+' : ''}{pct.toFixed(2)}%)
        </span>
        {d.volume != null && (<><span className="text-text-muted">Vol:</span><span className="text-info">{d.volume.toFixed(2)}</span></>)}
      </div>
    </div>
  );
};

const indicators = [
  { key: 'bollinger', label: 'BB',    icon: Layers,     color: '#8B5CF6' },
  { key: 'ema',       label: 'EMA',   icon: Waves,      color: '#22D3EE' },
  { key: 'rsi',       label: 'RSI',   icon: Activity,   color: '#F59E0B' },
  { key: 'macd',      label: 'MACD',  icon: BarChart3,  color: '#3B82F6' },
];

const chartTypes = [
  { key: 'candles', label: 'Candles', icon: CandleIcon },
  { key: 'area',    label: 'Area',    icon: LineIcon },
];

export default function MainTradingView({ btcCandles, ethCandles, ta }) {
  const [activeAsset, setActiveAsset] = useState('BTC');
  const [chartType, setChartType] = useState('candles');
  const [activeIndicators, setActiveIndicators] = useState(new Set(['bollinger', 'ema', 'rsi', 'macd']));

  const toggle = (key) => {
    setActiveIndicators(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const candles = activeAsset === 'BTC' ? btcCandles : ethCandles;
  const taData  = activeAsset === 'BTC' ? ta.btc : ta.eth;
  const accent  = activeAsset === 'BTC' ? '#F7931A' : '#627EEA';

  const chartData = useMemo(() => {
    const last = candles.slice(-80);
    const bb = taData.bollingerBands;
    const bbOffset = candles.length - bb.upper.length;
    const e50Offset  = candles.length - taData.ema50.length;
    const e200Offset = candles.length - taData.ema200.length;

    return last.map((c, i) => {
      const globalIdx = candles.length - last.length + i;
      const bbIdx  = globalIdx - bbOffset;
      const e50Idx  = globalIdx - e50Offset;
      const e200Idx = globalIdx - e200Offset;
      return {
        ...c,
        timeLabel: new Date(c.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        range: [c.low, c.high],
        bbUpper:  bbIdx >= 0 && bbIdx < bb.upper.length  ? bb.upper[bbIdx]  : null,
        bbMiddle: bbIdx >= 0 && bbIdx < bb.middle.length ? bb.middle[bbIdx] : null,
        bbLower:  bbIdx >= 0 && bbIdx < bb.lower.length  ? bb.lower[bbIdx]  : null,
        ema50:  e50Idx  >= 0 && e50Idx  < taData.ema50.length  ? taData.ema50[e50Idx]   : null,
        ema200: e200Idx >= 0 && e200Idx < taData.ema200.length ? taData.ema200[e200Idx] : null,
      };
    });
  }, [candles, taData]);

  const { priceMin, priceMax } = useMemo(() => {
    if (chartData.length === 0) return { priceMin: 0, priceMax: 1 };
    const highs = chartData.map(d => d.high).filter(v => v != null);
    const lows  = chartData.map(d => d.low).filter(v => v != null);
    const upper = Math.max(...highs, ...chartData.map(d => d.bbUpper || 0).filter(Boolean));
    const lower = Math.min(...lows, ...chartData.map(d => d.bbLower || Infinity).filter(v => v !== Infinity));
    const pad = (upper - lower) * 0.05;
    return { priceMin: lower - pad, priceMax: upper + pad };
  }, [chartData]);

  const rsiData = useMemo(() => taData.rsi.slice(-60).map((v, i) => ({ i, rsi: v })), [taData.rsi]);

  const macdData = useMemo(() => {
    const m = taData.macd;
    const len = Math.min(m.macdLine.length, m.signalLine.length, m.histogram.length);
    return Array.from({ length: Math.min(len, 60) }, (_, i) => {
      const idx = len - Math.min(len, 60) + i;
      return { i, macd: m.macdLine[idx], signal: m.signalLine[idx], hist: m.histogram[idx] };
    });
  }, [taData.macd]);

  // Current price/delta for header
  const priceInfo = useMemo(() => {
    if (candles.length < 2) return null;
    const cur = candles[candles.length - 1].close;
    const prev = candles[0].close;
    const delta = cur - prev;
    const pct = prev ? (delta / prev) * 100 : 0;
    return { cur, delta, pct };
  }, [candles]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card hud-corners p-5 flex flex-col gap-4 h-full"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5" style={{ color: accent }} />
          <div className="flex flex-col leading-tight">
            <h2 className="text-base font-bold text-text-primary">Trading Terminal</h2>
            {priceInfo && (
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="font-bold" style={{ color: accent }}>
                  ${priceInfo.cur.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </span>
                <span className={priceInfo.delta >= 0 ? 'text-bull' : 'text-bear'}>
                  {priceInfo.delta >= 0 ? '+' : ''}{priceInfo.pct.toFixed(2)}%
                </span>
                <span className="text-text-muted">· 15m · {candles.length} bars</span>
              </div>
            )}
          </div>
        </div>

        {/* Asset Toggle */}
        <div className="flex items-center rounded-xl bg-white/[0.04] p-0.5 border border-border">
          {['BTC', 'ETH'].map(a => (
            <button
              key={a} onClick={() => setActiveAsset(a)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
                activeAsset === a ? 'text-white shadow-lg' : 'text-text-muted hover:text-text-secondary'
              }`}
              style={activeAsset === a ? { background: a === 'BTC' ? '#F7931A' : '#627EEA' } : {}}
            >
              {a}
            </button>
          ))}
        </div>

        {/* Chart Type */}
        <div className="flex items-center rounded-xl bg-white/[0.04] p-0.5 border border-border">
          {chartTypes.map(ct => {
            const Icon = ct.icon;
            const active = chartType === ct.key;
            return (
              <button
                key={ct.key} onClick={() => setChartType(ct.key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  active ? 'bg-white/[0.08] text-text-primary' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <Icon className="h-3 w-3" />
                {ct.label}
              </button>
            );
          })}
        </div>

        {/* Indicators */}
        <div className="flex items-center gap-1">
          {indicators.map(ind => {
            const active = activeIndicators.has(ind.key);
            return (
              <button
                key={ind.key} onClick={() => toggle(ind.key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all duration-200 cursor-pointer border ${
                  active ? 'border-white/10 bg-white/[0.06]' : 'border-transparent bg-transparent text-text-muted hover:text-text-secondary'
                }`}
                style={active ? { color: ind.color } : {}}
              >
                <ind.icon className="h-3 w-3" />
                {ind.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main chart */}
      <div className="flex-1 w-full min-w-0 min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.25} />
                <stop offset="100%" stopColor={accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="timeLabel"
              tick={{ fontSize: 9, fill: '#64748B' }}
              axisLine={false} tickLine={false}
              interval="preserveStartEnd" minTickGap={40}
            />
            <YAxis
              yAxisId="price"
              domain={[priceMin, priceMax]}
              tick={{ fontSize: 9, fill: '#64748B' }}
              axisLine={false} tickLine={false}
              width={60}
              tickFormatter={v => `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              orientation="right"
            />
            <YAxis yAxisId="vol" hide domain={[0, d => d * 5]} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#64748B', strokeDasharray: '3 3' }} />

            {/* Volume bars behind */}
            <Bar yAxisId="vol" dataKey="volume" barSize={4}>
              {chartData.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.close >= entry.open ? '#10B981' : '#EF4444'}
                  fillOpacity={0.20}
                />
              ))}
            </Bar>

            {/* Bollinger Bands */}
            {activeIndicators.has('bollinger') && (
              <>
                <Line yAxisId="price" type="monotone" dataKey="bbUpper" stroke="#8B5CF6" strokeWidth={1} strokeDasharray="3 3" dot={false} connectNulls isAnimationActive={false} />
                <Line yAxisId="price" type="monotone" dataKey="bbMiddle" stroke="#8B5CF6" strokeWidth={1} strokeOpacity={0.5} dot={false} connectNulls isAnimationActive={false} />
                <Line yAxisId="price" type="monotone" dataKey="bbLower" stroke="#8B5CF6" strokeWidth={1} strokeDasharray="3 3" dot={false} connectNulls isAnimationActive={false} />
              </>
            )}

            {/* EMA 50 / 200 */}
            {activeIndicators.has('ema') && (
              <>
                <Line yAxisId="price" type="monotone" dataKey="ema50"  stroke="#22D3EE" strokeWidth={1.5} dot={false} connectNulls isAnimationActive={false} />
                <Line yAxisId="price" type="monotone" dataKey="ema200" stroke="#E879F9" strokeWidth={1.5} dot={false} connectNulls isAnimationActive={false} />
              </>
            )}

            {/* Price render */}
            {chartType === 'area' && (
              <Area
                yAxisId="price"
                type="monotone" dataKey="close"
                stroke={accent} strokeWidth={2}
                fill="url(#areaGrad)" dot={false} animationDuration={600}
              />
            )}

            {chartType === 'candles' && (
              <Bar
                yAxisId="price"
                dataKey="range"
                shape={<CandleShape />}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* RSI Sub-chart */}
      <AnimatePresence>
        {activeIndicators.has('rsi') && rsiData.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 80, opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }} className="overflow-hidden"
          >
            <div className="flex items-center gap-1 mb-1">
              <Activity className="h-3 w-3 text-warning" />
              <span className="text-[10px] font-bold text-warning">RSI (14)</span>
              <span className="text-[10px] font-mono text-text-muted ml-auto">{taData.currentRSI.toFixed(1)}</span>
            </div>
            <ResponsiveContainer width="100%" height={60}>
              <ComposedChart data={rsiData} margin={{ top: 2, right: 10, bottom: 0, left: 10 }}>
                <YAxis domain={[0, 100]} ticks={[30, 70]} tick={{ fontSize: 8, fill: '#64748B' }} axisLine={false} tickLine={false} width={25} />
                <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" strokeOpacity={0.4} />
                <ReferenceLine y={30} stroke="#10B981" strokeDasharray="3 3" strokeOpacity={0.4} />
                <Area type="monotone" dataKey="rsi" stroke="#F59E0B" strokeWidth={1.5} fill="none" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MACD Sub-chart */}
      <AnimatePresence>
        {activeIndicators.has('macd') && macdData.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 100, opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }} className="overflow-hidden"
          >
            <div className="flex items-center gap-1 mb-1">
              <BarChart3 className="h-3 w-3 text-info" />
              <span className="text-[10px] font-bold text-info">MACD (12, 26, 9)</span>
            </div>
            <ResponsiveContainer width="100%" height={75}>
              <ComposedChart data={macdData} margin={{ top: 2, right: 10, bottom: 0, left: 10 }}>
                <YAxis tick={{ fontSize: 8, fill: '#64748B' }} axisLine={false} tickLine={false} width={40} />
                <ReferenceLine y={0} stroke="#64748B" strokeOpacity={0.3} />
                <Bar dataKey="hist" barSize={3}>
                  {macdData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.hist >= 0 ? '#10B981' : '#EF4444'} fillOpacity={0.55} />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="macd"   stroke="#3B82F6" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="signal" stroke="#EF4444" strokeWidth={1} strokeDasharray="3 3" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
