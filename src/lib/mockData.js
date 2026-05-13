// ═══════════════════════════════════════════════════════════════
// Mock Data Generator — Realistic Crypto Market Data
// Uses Geometric Brownian Motion for price simulation
// ═══════════════════════════════════════════════════════════════

/**
 * Generate random normal (Gaussian) using Box-Muller transform
 */
function randomNormal() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Generate realistic OHLCV candle data using Geometric Brownian Motion
 */
export function generateOHLCV({
  startPrice,
  volatility = 0.65,
  drift = 0.02,
  count = 200,
  intervalMinutes = 15,
}) {
  const candles = [];
  let price = startPrice;
  const dt = intervalMinutes / (365.25 * 24 * 60);
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const time = now - (count - i) * intervalMinutes * 60 * 1000;
    const open = price;

    const ticks = [open];
    for (let t = 0; t < 4; t++) {
      const dW = randomNormal() * Math.sqrt(dt);
      price = price * Math.exp((drift - 0.5 * volatility * volatility) * dt + volatility * dW);
      ticks.push(price);
    }

    const close = ticks[ticks.length - 1];
    const high = Math.max(...ticks) * (1 + Math.random() * 0.002);
    const low = Math.min(...ticks) * (1 - Math.random() * 0.002);

    const hour = new Date(time).getUTCHours();
    const volumeMultiplier = (hour >= 13 && hour <= 21) ? 1.5 : 0.8;
    const volume = (Math.random() * 0.5 + 0.75) * volumeMultiplier * startPrice * 0.001;

    candles.push({
      time,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.round(volume * 100) / 100,
    });

    price = close;
  }

  return candles;
}

/**
 * Generate correlated price series
 */
export function generateCorrelatedSeries(baseSeries, correlation, startPrice, volatility = 0.75) {
  const prices = [startPrice];
  const baseReturns = [];

  for (let i = 1; i < baseSeries.length; i++) {
    baseReturns.push(Math.log(baseSeries[i] / baseSeries[i - 1]));
  }

  for (let i = 0; i < baseReturns.length; i++) {
    const independentReturn = randomNormal() * volatility * 0.001;
    const correlatedReturn = correlation * baseReturns[i] + Math.sqrt(1 - correlation * correlation) * independentReturn;
    const newPrice = prices[prices.length - 1] * Math.exp(correlatedReturn);
    prices.push(Math.round(newPrice * 100) / 100);
  }

  return prices;
}

/**
 * Generate mock order book data
 */
export function generateOrderBook(midPrice, spreadBps = 5, levels = 14) {
  const spread = midPrice * (spreadBps / 10000);
  const bidStart = midPrice - spread / 2;
  const askStart = midPrice + spread / 2;
  const tickSize = midPrice * 0.0001;

  const bids = [];
  const asks = [];

  for (let i = 0; i < levels; i++) {
    const bidPrice = bidStart - i * tickSize * (1 + Math.random() * 0.5);
    const askPrice = askStart + i * tickSize * (1 + Math.random() * 0.5);

    const depthMultiplier = 1 + i * 0.3 + Math.random() * 0.5;

    bids.push({
      price: bidPrice.toFixed(2),
      amount: (Math.random() * 2 * depthMultiplier).toFixed(4),
      total: 0,
    });

    asks.push({
      price: askPrice.toFixed(2),
      amount: (Math.random() * 2 * depthMultiplier).toFixed(4),
      total: 0,
    });
  }

  let bidTotal = 0;
  bids.forEach(b => {
    bidTotal += parseFloat(b.amount);
    b.total = bidTotal.toFixed(4);
  });

  let askTotal = 0;
  asks.forEach(a => {
    askTotal += parseFloat(a.amount);
    a.total = askTotal.toFixed(4);
  });

  return { bids, asks };
}

/**
 * Generate mock global market data
 */
export function generateMarketOverview() {
  return {
    totalMarketCap: 3.42 + (Math.random() - 0.5) * 0.1,
    total24hVolume: 142.5 + (Math.random() - 0.5) * 20,
    btcDominance: 54.2 + (Math.random() - 0.5) * 2,
    ethDominance: 17.8 + (Math.random() - 0.5) * 1,
    fearGreedIndex: Math.floor(Math.random() * 100),
    activeCryptos: 2847 + Math.floor(Math.random() * 100),
  };
}

export function getFearGreedInfo(value) {
  if (value <= 20) return { label: 'Extreme Fear', color: '#ef4444' };
  if (value <= 40) return { label: 'Fear', color: '#f97316' };
  if (value <= 60) return { label: 'Neutral', color: '#eab308' };
  if (value <= 80) return { label: 'Greed', color: '#22c55e' };
  return { label: 'Extreme Greed', color: '#10b981' };
}

/* ═══════════════════════════════════════════════════════════════
 * Top-10 market watchlist — mocked tickers
 * ═══════════════════════════════════════════════════════════════ */

const COIN_TEMPLATE = [
  { symbol: 'BTC',   name: 'Bitcoin',       price: 104532.80, color: '#F7931A' },
  { symbol: 'ETH',   name: 'Ethereum',      price: 2521.45,   color: '#627EEA' },
  { symbol: 'SOL',   name: 'Solana',        price: 184.22,    color: '#14F195' },
  { symbol: 'BNB',   name: 'BNB',           price: 702.15,    color: '#F3BA2F' },
  { symbol: 'XRP',   name: 'XRP',           price: 2.48,      color: '#23292F' },
  { symbol: 'ADA',   name: 'Cardano',       price: 0.954,     color: '#0033AD' },
  { symbol: 'DOGE',  name: 'Dogecoin',      price: 0.342,     color: '#C2A633' },
  { symbol: 'AVAX',  name: 'Avalanche',     price: 48.21,     color: '#E84142' },
  { symbol: 'LINK',  name: 'Chainlink',     price: 24.85,     color: '#2A5ADA' },
  { symbol: 'DOT',   name: 'Polkadot',      price: 9.12,      color: '#E6007A' },
  { symbol: 'MATIC', name: 'Polygon',       price: 0.524,     color: '#8247E5' },
  { symbol: 'TRX',   name: 'Tron',          price: 0.275,     color: '#EF0027' },
];

export function generateWatchlist() {
  return COIN_TEMPLATE.map(c => {
    const change = (Math.random() - 0.48) * 12;
    const volatility = 0.5 + Math.random() * 2;
    return {
      ...c,
      price: +(c.price * (1 + (Math.random() - 0.5) * 0.004)).toFixed(c.price > 100 ? 2 : c.price > 1 ? 3 : 4),
      change24h: +change.toFixed(2),
      volume24h: c.price * (Math.random() * 2e6 + 1e6),
      marketCap: c.price * (Math.random() * 2e7 + 5e6),
      volatility: +volatility.toFixed(2),
      sparkline: Array.from({ length: 24 }, (_, i) => {
        const trend = change > 0 ? 1 : -1;
        return 100 + trend * (i / 24) * Math.abs(change) + (Math.random() - 0.5) * 2;
      }),
    };
  });
}

/* ═══════════════════════════════════════════════════════════════
 * Live trades (time & sales) — tape
 * ═══════════════════════════════════════════════════════════════ */

export function generateTrade(asset, midPrice) {
  const side = Math.random() > 0.5 ? 'buy' : 'sell';
  const priceOffset = (Math.random() - 0.5) * midPrice * 0.0005;
  const price = midPrice + priceOffset;
  // Power-law distribution of size (most trades small, few whales)
  const u = Math.random();
  const size = Math.pow(1 - u, -0.7) * 0.005;
  const notional = size * price;
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    asset,
    side,
    price: +price.toFixed(2),
    size: +size.toFixed(5),
    notional: +notional.toFixed(2),
    time: Date.now(),
    isWhale: notional > midPrice * 0.5,
  };
}

/* ═══════════════════════════════════════════════════════════════
 * News ticker stubs
 * ═══════════════════════════════════════════════════════════════ */

export function getNewsFeed() {
  return [
    { tag: 'MACRO',  msg: 'Fed signals caution on near-term rate cuts as core PCE prints 2.7%' },
    { tag: 'BTC',    msg: 'Spot ETFs record $480M net inflows over past 24h — 11-day streak' },
    { tag: 'ETH',    msg: 'Dencun upgrade cuts L2 fees 90%; ETH ecosystem TVL hits $68B' },
    { tag: 'DeFi',   msg: 'Aave V4 governance vote passes — new GHO collateral types added' },
    { tag: 'SOL',    msg: 'Solana DEX volumes overtake Ethereum for 4th consecutive week' },
    { tag: 'REGIS',  msg: 'SEC chair confirms clearer framework for digital assets by Q3' },
    { tag: 'WHALE',  msg: 'Unknown wallet moves 12,400 BTC ($1.29B) from cold storage' },
    { tag: 'FLOWS',  msg: 'Stablecoin market cap reaches all-time high of $218B' },
  ];
}
