import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { GitCompareArrows } from 'lucide-react';
import { motion } from 'framer-motion';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="glass-card p-2 text-[10px] font-mono border border-border">
      <div>ρ: <span className="text-info font-bold">{d.corr?.toFixed(4)}</span></div>
    </div>
  );
};

export default function CorrelationEngine({ btcCandles, ethCandles, correlation, rollingCorrelation }) {
  const corrColor = correlation >= 0.7 ? '#10B981' : correlation >= 0.3 ? '#F59E0B' : '#EF4444';
  const corrLabel = correlation >= 0.7 ? 'Strong' : correlation >= 0.3 ? 'Moderate' : 'Weak';

  // Normalized price overlay (last 80 points)
  const normalizedData = useMemo(() => {
    const btcSlice = btcCandles.slice(-80);
    const ethSlice = ethCandles.slice(-80);
    const len = Math.min(btcSlice.length, ethSlice.length);
    if (len < 2) return [];

    const btcBase = btcSlice[0].close;
    const ethBase = ethSlice[0].close;

    return Array.from({ length: len }, (_, i) => ({
      i,
      btc: ((btcSlice[i].close / btcBase - 1) * 100),
      eth: ((ethSlice[i].close / ethBase - 1) * 100),
      time: new Date(btcSlice[i].time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    }));
  }, [btcCandles, ethCandles]);

  // Rolling correlation chart
  const corrData = useMemo(() => {
    return rollingCorrelation.slice(-60).map((val, i) => ({ i, corr: val }));
  }, [rollingCorrelation]);

  // Scatter data for returns
  const scatterData = useMemo(() => {
    const btcSlice = btcCandles.slice(-60);
    const ethSlice = ethCandles.slice(-60);
    const len = Math.min(btcSlice.length, ethSlice.length);
    if (len < 3) return [];

    return Array.from({ length: len - 1 }, (_, i) => ({
      btcRet: ((btcSlice[i + 1].close / btcSlice[i].close - 1) * 100),
      ethRet: ((ethSlice[i + 1].close / ethSlice[i].close - 1) * 100),
    }));
  }, [btcCandles, ethCandles]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="glass-card hud-corners p-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GitCompareArrows className="h-5 w-5 text-info" />
          <h2 className="text-base font-bold text-text-primary">Correlation Engine</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1 bg-white/[0.04] border border-border">
            <span className="text-[10px] text-text-muted">Pearson ρ:</span>
            <span className="text-sm font-bold font-mono" style={{ color: corrColor }}>{correlation.toFixed(4)}</span>
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${corrColor}15`, color: corrColor }}>{corrLabel}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Normalized Price Overlay */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Normalized Returns</span>
            <div className="flex items-center gap-3 ml-auto">
              <div className="flex items-center gap-1"><div className="h-0.5 w-4 rounded bg-btc" /><span className="text-[9px] text-text-muted">BTC</span></div>
              <div className="flex items-center gap-1"><div className="h-0.5 w-4 rounded bg-eth" /><span className="text-[9px] text-text-muted">ETH</span></div>
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={normalizedData} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
                <XAxis dataKey="time" tick={{ fontSize: 8, fill: '#64748B' }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={60} />
                <YAxis tick={{ fontSize: 8, fill: '#64748B' }} axisLine={false} tickLine={false} width={35} tickFormatter={v => `${v.toFixed(1)}%`} />
                <Line type="monotone" dataKey="btc" stroke="#F7931A" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="eth" stroke="#627EEA" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scatter Plot */}
        <div>
          <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-2">Return Scatter</span>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <XAxis dataKey="btcRet" tick={{ fontSize: 8, fill: '#64748B' }} axisLine={false} name="BTC %" tickFormatter={v => `${v.toFixed(1)}%`} />
                <YAxis dataKey="ethRet" tick={{ fontSize: 8, fill: '#64748B' }} axisLine={false} name="ETH %" tickFormatter={v => `${v.toFixed(1)}%`} width={35} />
                <ZAxis range={[15, 15]} />
                <Scatter data={scatterData} fill="#627EEA" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Rolling Correlation */}
      {corrData.length > 0 && (
        <div>
          <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-1">Rolling Correlation (30-period)</span>
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={corrData} margin={{ top: 2, right: 5, bottom: 0, left: 5 }}>
                <YAxis domain={[-1, 1]} ticks={[0, 0.5, 1]} tick={{ fontSize: 8, fill: '#64748B' }} axisLine={false} tickLine={false} width={25} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="corr" stroke="#3B82F6" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.div>
  );
}
