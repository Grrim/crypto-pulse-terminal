// ═══════════════════════════════════════════════════════════════
// Advanced Analytics — Institutional Quant Metrics
// Sharpe, Sortino, VaR, CVaR, Max Drawdown, ATR, ROC, Beta
// ═══════════════════════════════════════════════════════════════

/**
 * Simple log returns series
 */
export function logReturns(closes) {
  const out = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) out.push(Math.log(closes[i] / closes[i - 1]));
  }
  return out;
}

/**
 * Sharpe Ratio (annualized, assuming 15m candles)
 * rf = risk-free rate (annual, default 4.5% current T-bill proxy)
 */
export function calculateSharpeRatio(closes, rf = 0.045) {
  const r = logReturns(closes);
  if (r.length < 2) return 0;

  // Periods per year for 15-min candles
  const periodsPerYear = 365 * 24 * 4;
  const mean = r.reduce((a, b) => a + b, 0) / r.length;
  const variance = r.reduce((s, v) => s + (v - mean) ** 2, 0) / (r.length - 1);
  const std = Math.sqrt(variance);
  if (std === 0) return 0;

  // Annualize
  const annMean = mean * periodsPerYear;
  const annStd = std * Math.sqrt(periodsPerYear);
  return (annMean - rf) / annStd;
}

/**
 * Sortino Ratio — downside-only volatility
 */
export function calculateSortinoRatio(closes, rf = 0.045) {
  const r = logReturns(closes);
  if (r.length < 2) return 0;
  const periodsPerYear = 365 * 24 * 4;
  const mean = r.reduce((a, b) => a + b, 0) / r.length;
  const downside = r.filter(v => v < 0);
  if (downside.length === 0) return 0;
  const downVar = downside.reduce((s, v) => s + v * v, 0) / downside.length;
  const downStd = Math.sqrt(downVar);
  if (downStd === 0) return 0;
  return (mean * periodsPerYear - rf) / (downStd * Math.sqrt(periodsPerYear));
}

/**
 * Maximum Drawdown — peak-to-trough decline as positive %
 */
export function calculateMaxDrawdown(closes) {
  if (closes.length < 2) return { maxDD: 0, peakIdx: 0, troughIdx: 0 };
  let peak = closes[0];
  let peakIdx = 0;
  let maxDD = 0;
  let troughIdx = 0;
  let currentPeakIdx = 0;

  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > peak) {
      peak = closes[i];
      currentPeakIdx = i;
    }
    const dd = (peak - closes[i]) / peak;
    if (dd > maxDD) {
      maxDD = dd;
      peakIdx = currentPeakIdx;
      troughIdx = i;
    }
  }
  return { maxDD: maxDD * 100, peakIdx, troughIdx };
}

/**
 * Value at Risk — historical method (95% confidence by default)
 * Returns positive % expected loss in worst (1-alpha) percentile
 */
export function calculateVaR(closes, confidence = 0.95) {
  const r = logReturns(closes);
  if (r.length < 10) return 0;
  const sorted = [...r].sort((a, b) => a - b);
  const idx = Math.floor((1 - confidence) * sorted.length);
  return Math.abs(sorted[idx]) * 100;
}

/**
 * Conditional VaR (Expected Shortfall) — average of tail losses
 */
export function calculateCVaR(closes, confidence = 0.95) {
  const r = logReturns(closes);
  if (r.length < 10) return 0;
  const sorted = [...r].sort((a, b) => a - b);
  const cutoff = Math.floor((1 - confidence) * sorted.length) + 1;
  const tail = sorted.slice(0, Math.max(cutoff, 1));
  const mean = tail.reduce((a, b) => a + b, 0) / tail.length;
  return Math.abs(mean) * 100;
}

/**
 * ATR — Average True Range (absolute price units)
 */
export function calculateATR(candles, period = 14) {
  if (candles.length < period + 1) return 0;
  const trs = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i], p = candles[i - 1];
    const tr = Math.max(
      c.high - c.low,
      Math.abs(c.high - p.close),
      Math.abs(c.low - p.close)
    );
    trs.push(tr);
  }
  // Wilder smoothing
  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
  }
  return atr;
}

/**
 * ROC — Rate of Change over N periods, as %
 */
export function calculateROC(closes, period = 10) {
  if (closes.length < period + 1) return 0;
  const last = closes[closes.length - 1];
  const ref = closes[closes.length - 1 - period];
  if (!ref) return 0;
  return ((last - ref) / ref) * 100;
}

/**
 * Beta of asset vs benchmark (cov / var_benchmark)
 */
export function calculateBeta(assetCloses, benchmarkCloses) {
  const a = logReturns(assetCloses);
  const b = logReturns(benchmarkCloses);
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const aa = a.slice(-n), bb = b.slice(-n);
  const meanA = aa.reduce((s, v) => s + v, 0) / n;
  const meanB = bb.reduce((s, v) => s + v, 0) / n;
  let cov = 0, varB = 0;
  for (let i = 0; i < n; i++) {
    cov += (aa[i] - meanA) * (bb[i] - meanB);
    varB += (bb[i] - meanB) ** 2;
  }
  return varB === 0 ? 0 : cov / varB;
}

/**
 * VWAP — Volume-Weighted Average Price (rolling)
 */
export function calculateVWAP(candles, period = 20) {
  if (candles.length < period) return [];
  const out = [];
  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    let pv = 0, v = 0;
    for (const c of slice) {
      const typical = (c.high + c.low + c.close) / 3;
      pv += typical * c.volume;
      v += c.volume;
    }
    out.push(v === 0 ? slice[slice.length - 1].close : pv / v);
  }
  return out;
}

/**
 * OBV — On Balance Volume
 */
export function calculateOBV(candles) {
  if (candles.length < 2) return [];
  const obv = [0];
  for (let i = 1; i < candles.length; i++) {
    const prev = obv[i - 1];
    if (candles[i].close > candles[i - 1].close) obv.push(prev + candles[i].volume);
    else if (candles[i].close < candles[i - 1].close) obv.push(prev - candles[i].volume);
    else obv.push(prev);
  }
  return obv;
}

/**
 * Stochastic Oscillator %K
 */
export function calculateStochastic(candles, period = 14) {
  if (candles.length < period) return [];
  const out = [];
  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const highest = Math.max(...slice.map(c => c.high));
    const lowest = Math.min(...slice.map(c => c.low));
    const close = slice[slice.length - 1].close;
    out.push(highest === lowest ? 50 : ((close - lowest) / (highest - lowest)) * 100);
  }
  return out;
}
