import { useMemo, useEffect, useState, useRef } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

const BtcIcon = () => (
  <svg viewBox="0 0 32 32" className="h-8 w-8">
    <circle cx="16" cy="16" r="16" fill="#F7931A" />
    <path d="M22.5 14.2c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.6-.4-.7 2.6c-.4-.1-.8-.2-1.3-.3l.7-2.7-1.6-.4-.7 2.7c-.4-.1-.7-.2-1-.2v-.1l-2.2-.5-.4 1.7s1.2.3 1.2.3c.6.2.8.6.7 1l-.7 2.9c0 0 .1 0 .1 0l-.1 0-1 4.1c-.1.2-.3.5-.7.4 0 0-1.2-.3-1.2-.3l-.8 1.8 2.1.5c.4.1.8.2 1.1.3l-.7 2.8 1.6.4.7-2.7c.4.1.9.2 1.3.3l-.7 2.7 1.6.4.7-2.8c3 .6 5.2.3 6.1-2.4.8-2.1-.04-3.4-1.6-4.2 1.1-.3 2-1 2.2-2.5zm-3.9 5.5c-.6 2.3-4.4 1-5.6.8l1-4c1.3.3 5.2 1 4.6 3.2zm.6-5.5c-.5 2.1-3.7 1-4.7.8l.9-3.6c1.1.3 4.4.8 3.8 2.8z" fill="white"/>
  </svg>
);

const EthIcon = () => (
  <svg viewBox="0 0 32 32" className="h-8 w-8">
    <circle cx="16" cy="16" r="16" fill="#627EEA" />
    <path d="M16.5 4v8.9l7.5 3.3L16.5 4z" fill="white" fillOpacity="0.6"/>
    <path d="M16.5 4L9 16.2l7.5-3.3V4z" fill="white"/>
    <path d="M16.5 21.9v6.1L24 17.6l-7.5 4.3z" fill="white" fillOpacity="0.6"/>
    <path d="M16.5 28v-6.1L9 17.6l7.5 10.4z" fill="white"/>
    <path d="M16.5 20.6l7.5-4.4-7.5-3.3v7.7z" fill="white" fillOpacity="0.2"/>
    <path d="M9 16.2l7.5 4.4v-7.7L9 16.2z" fill="white" fillOpacity="0.6"/>
  </svg>
);

const fmtPrice = (p) => {
  const n = parseFloat(p);
  return isNaN(n) ? '$0.00' : n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtVol = (v) => {
  const n = parseFloat(v);
  if (isNaN(n)) return '$0';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${(n / 1e3).toFixed(0)}K`;
};

export default function AssetCard({ asset, ticker, candles, ta }) {
  const isBTC = asset === 'BTC';
  const accent = isBTC ? '#F7931A' : '#627EEA';
  const glowClass = isBTC ? 'glass-card-btc' : 'glass-card-eth';
  const isUp = parseFloat(ticker.change) >= 0;

  const prevPriceRef = useRef(ticker.price);
  const [flash, setFlash] = useState('');

  useEffect(() => {
    const curP = parseFloat(ticker.price);
    const prevP = parseFloat(prevPriceRef.current);
    
    if (curP > prevP) setFlash('flash-up');
    else if (curP < prevP) setFlash('flash-down');
    
    prevPriceRef.current = ticker.price;
    
    const t = setTimeout(() => setFlash(''), 500);
    return () => clearTimeout(t);
  }, [ticker.price]);

  const sparkData = useMemo(() => candles.slice(-50).map((c, i) => ({ i, close: c.close })), [candles]);

  const high = parseFloat(ticker.high), low = parseFloat(ticker.low), cur = parseFloat(ticker.price);
  const range = high - low;
  const pct = range > 0 ? ((cur - low) / range) * 100 : 50;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: isBTC ? 0 : 0.1 }} className={`glass-card ${glowClass} hud-corners p-5 flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isBTC ? <BtcIcon /> : <EthIcon />}
          <div>
            <h2 className={`text-base font-bold ${isBTC ? 'text-grad-btc' : 'text-grad-eth'}`}>{isBTC ? 'Bitcoin' : 'Ethereum'}</h2>
            <span className="text-xs font-mono text-text-muted">{asset}/USDT</span>
          </div>
        </div>
        <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${isUp ? 'bg-bull/10 text-bull' : 'bg-bear/10 text-bear'}`}>
          {isUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {isUp ? '+' : ''}{parseFloat(ticker.change).toFixed(2)}%
        </div>
      </div>

      <div className={`rounded-lg px-2 py-1 transition-colors ${flash}`}>
        <span className="text-2xl font-extrabold font-mono tracking-tight text-text-primary">{fmtPrice(ticker.price)}</span>
      </div>

      <div className="h-16 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id={`grad-${asset}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.3} />
                <stop offset="100%" stopColor={accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis domain={['dataMin', 'dataMax']} hide />
            <Area type="monotone" dataKey="close" stroke={accent} strokeWidth={2} fill={`url(#grad-${asset})`} dot={false} animationDuration={800} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[10px] text-text-muted">
          <span>24h Low: <span className="text-bear font-mono">{fmtPrice(ticker.low)}</span></span>
          <span>24h High: <span className="text-bull font-mono">{fmtPrice(ticker.high)}</span></span>
        </div>
        <div className="relative h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
          <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${isUp ? '#10B981' : '#EF4444'}, ${accent})` }} />
          <div className="absolute top-1/2 -translate-y-1/2 h-3 w-0.5 rounded-full bg-white shadow-lg transition-all duration-700" style={{ left: `${pct}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex flex-col">
          <span className="text-text-muted text-[10px]">24h Volume</span>
          <span className="font-mono font-semibold text-text-secondary">{fmtVol(ticker.volume)}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-text-muted text-[10px]">RSI (14)</span>
          <span className={`font-mono font-semibold ${ta.currentRSI > 70 ? 'text-bear' : ta.currentRSI < 30 ? 'text-bull' : 'text-text-secondary'}`}>{ta.currentRSI.toFixed(1)}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-text-muted text-[10px]">Volatility</span>
          <span className="font-mono font-semibold text-text-secondary">{ta.volatility.toFixed(1)}%</span>
        </div>
      </div>
    </motion.div>
  );
}
