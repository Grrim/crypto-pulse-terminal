// ═══════════════════════════════════════════════════════════════
// TickerRibbon — scrolling market tape (Bloomberg-style)
// ═══════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function TickerRibbon({ watchlist }) {
  // duplicate list for seamless marquee loop
  const items = useMemo(() => [...watchlist, ...watchlist], [watchlist]);

  const fmt = (v) => {
    if (v >= 1000) return v.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (v >= 1)    return v.toFixed(3);
    return v.toFixed(4);
  };

  return (
    <div className="relative w-full border-y border-border bg-gradient-to-r from-bg-secondary/60 via-bg-primary/30 to-bg-secondary/60 backdrop-blur-xl overflow-hidden">
      <div className="marquee-mask overflow-hidden">
        <div className="flex gap-8 py-2 animate-marquee whitespace-nowrap will-change-transform">
          {items.map((coin, i) => {
            const up = coin.change24h >= 0;
            const Icon = up ? ArrowUp : ArrowDown;
            return (
              <div
                key={`${coin.symbol}-${i}`}
                className="flex items-center gap-2 text-[11px] font-mono shrink-0"
              >
                <span
                  className="font-bold tracking-wide"
                  style={{ color: coin.color }}
                >
                  {coin.symbol}
                </span>
                <span className="text-text-primary">${fmt(coin.price)}</span>
                <span
                  className={`flex items-center gap-0.5 font-semibold ${
                    up ? 'text-bull' : 'text-bear'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {up ? '+' : ''}{coin.change24h.toFixed(2)}%
                </span>
                <span className="text-text-muted/40">·</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
