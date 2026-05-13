import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { Gauge, AlertTriangle, Shield, Flame, Skull } from 'lucide-react';
import { motion } from 'framer-motion';

const getRiskInfo = (vol) => {
  if (vol < 30) return { label: 'Low', color: '#10B981', icon: Shield, bg: 'bg-bull/10' };
  if (vol < 60) return { label: 'Medium', color: '#F59E0B', icon: AlertTriangle, bg: 'bg-warning/10' };
  if (vol < 100) return { label: 'High', color: '#EF4444', icon: Flame, bg: 'bg-bear/10' };
  return { label: 'Extreme', color: '#DC2626', icon: Skull, bg: 'bg-bear/20' };
};

export default function VolatilityTracker({ btcTA, ethTA }) {
  const btcVol = btcTA.volatility;
  const ethVol = ethTA.volatility;
  const btcRisk = getRiskInfo(btcVol);
  const ethRisk = getRiskInfo(ethVol);

  const barData = [
    { name: 'BTC', vol: btcVol, color: '#F7931A' },
    { name: 'ETH', vol: ethVol, color: '#627EEA' },
  ];

  const maxVol = Math.max(btcVol, ethVol, 50);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }} className="glass-card hud-corners p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Gauge className="h-4 w-4 text-purple-400" />
        <h3 className="text-sm font-bold text-text-primary">Volatility Tracker</h3>
      </div>

      {/* Comparison Chart */}
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
            <XAxis type="number" domain={[0, maxVol * 1.2]} hide />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} width={30} />
            <Bar dataKey="vol" barSize={18} radius={[0, 6, 6, 0]} animationDuration={1000}>
              {barData.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.7} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Risk Cards */}
      <div className="flex flex-col gap-2">
        {[{ label: 'BTC', vol: btcVol, risk: btcRisk, color: '#F7931A' },
          { label: 'ETH', vol: ethVol, risk: ethRisk, color: '#627EEA' }].map(item => {
          const RiskIcon = item.risk.icon;
          return (
            <div key={item.label} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2 border border-border">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-semibold text-text-primary">{item.label}</span>
              </div>
              <span className="text-sm font-bold font-mono" style={{ color: item.color }}>
                {item.vol.toFixed(1)}%
              </span>
              <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${item.risk.bg}`}>
                <RiskIcon className="h-3 w-3" style={{ color: item.risk.color }} />
                <span className="text-[10px] font-bold" style={{ color: item.risk.color }}>{item.risk.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[9px] text-text-muted text-center">Annualized σ based on 15m returns</p>
    </motion.div>
  );
}
