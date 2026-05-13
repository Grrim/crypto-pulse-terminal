// ═══════════════════════════════════════════════════════════════
// Technical Analysis Engine — Institutional Grade
// Pure functions for RSI, MACD, Bollinger Bands, Volatility,
// Correlation, and Signal Generation
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate RSI (Relative Strength Index)
 * @param {number[]} closes - Array of closing prices
 * @param {number} period - RSI period (default 14)
 * @returns {number[]} Array of RSI values (0-100)
 */
export function calculateRSI(closes, period = 14) {
  if (closes.length < period + 1) return [];

  const rsiValues = [];
  const changes = [];

  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }

  // Initial average gain/loss
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < period; i++) {
    if (changes[i] >= 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }

  avgGain /= period;
  avgLoss /= period;

  // First RSI
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsiValues.push(100 - 100 / (1 + rs));

  // Subsequent RSI using Wilder's smoothing
  for (let i = period; i < changes.length; i++) {
    const gain = changes[i] >= 0 ? changes[i] : 0;
    const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const smoothedRS = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsiValues.push(100 - 100 / (1 + smoothedRS));
  }

  return rsiValues;
}

/**
 * Calculate EMA (Exponential Moving Average)
 * @param {number[]} data - Input data
 * @param {number} period - EMA period
 * @returns {number[]} EMA values
 */
export function calculateEMA(data, period) {
  if (data.length < period) return [];

  const k = 2 / (period + 1);
  const ema = [];

  // Seed with SMA
  let sum = 0;
  for (let i = 0; i < period; i++) sum += data[i];
  ema.push(sum / period);

  for (let i = period; i < data.length; i++) {
    ema.push(data[i] * k + ema[ema.length - 1] * (1 - k));
  }

  return ema;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @param {number[]} closes - Array of closing prices
 * @param {number} fast - Fast EMA period (default 12)
 * @param {number} slow - Slow EMA period (default 26)
 * @param {number} signal - Signal EMA period (default 9)
 * @returns {{ macdLine: number[], signalLine: number[], histogram: number[] }}
 */
export function calculateMACD(closes, fast = 12, slow = 26, signal = 9) {
  const emaFast = calculateEMA(closes, fast);
  const emaSlow = calculateEMA(closes, slow);

  if (emaFast.length === 0 || emaSlow.length === 0) {
    return { macdLine: [], signalLine: [], histogram: [] };
  }

  // Align EMA arrays — fast EMA starts earlier
  const offset = slow - fast;
  const macdLine = [];

  for (let i = 0; i < emaSlow.length; i++) {
    macdLine.push(emaFast[i + offset] - emaSlow[i]);
  }

  const signalLine = calculateEMA(macdLine, signal);

  // Align MACD and signal
  const signalOffset = signal - 1;
  const histogram = [];

  for (let i = 0; i < signalLine.length; i++) {
    histogram.push(macdLine[i + signalOffset] - signalLine[i]);
  }

  return {
    macdLine: macdLine.slice(signalOffset),
    signalLine,
    histogram,
  };
}

/**
 * Calculate Bollinger Bands
 * @param {number[]} closes - Array of closing prices
 * @param {number} period - SMA period (default 20)
 * @param {number} stdDevMultiplier - Standard deviation multiplier (default 2)
 * @returns {{ upper: number[], middle: number[], lower: number[] }}
 */
export function calculateBollingerBands(closes, period = 20, stdDevMultiplier = 2) {
  if (closes.length < period) return { upper: [], middle: [], lower: [] };

  const upper = [];
  const middle = [];
  const lower = [];

  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;

    const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    middle.push(mean);
    upper.push(mean + stdDevMultiplier * stdDev);
    lower.push(mean - stdDevMultiplier * stdDev);
  }

  return { upper, middle, lower };
}

/**
 * Calculate Volatility (Annualized Standard Deviation of Returns)
 * @param {number[]} closes - Array of closing prices
 * @returns {number} Annualized volatility as percentage
 */
export function calculateVolatility(closes) {
  if (closes.length < 2) return 0;

  const returns = [];
  for (let i = 1; i < closes.length; i++) {
    returns.push(Math.log(closes[i] / closes[i - 1]));
  }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);

  // Annualize: for 15-min candles, ~35040 periods/year
  // sqrt(35040) ≈ 187. We use a dampened factor for display.
  const annualized = stdDev * Math.sqrt(365) * 100;

  return Math.min(annualized, 200); // Cap at 200%
}

/**
 * Calculate Rolling Volatility
 * @param {number[]} closes - Array of closing prices
 * @param {number} window - Rolling window size
 * @returns {number[]} Array of volatility values
 */
export function calculateRollingVolatility(closes, window = 20) {
  if (closes.length < window + 1) return [];

  const result = [];

  for (let i = window; i < closes.length; i++) {
    const slice = closes.slice(i - window, i + 1);
    result.push(calculateVolatility(slice));
  }

  return result;
}

/**
 * Calculate Pearson Correlation Coefficient
 * @param {number[]} seriesA - First series
 * @param {number[]} seriesB - Second series
 * @returns {number} Correlation coefficient (-1 to 1)
 */
export function calculateCorrelation(seriesA, seriesB) {
  const n = Math.min(seriesA.length, seriesB.length);
  if (n < 2) return 0;

  const a = seriesA.slice(-n);
  const b = seriesB.slice(-n);

  const meanA = a.reduce((s, v) => s + v, 0) / n;
  const meanB = b.reduce((s, v) => s + v, 0) / n;

  let cov = 0, varA = 0, varB = 0;

  for (let i = 0; i < n; i++) {
    const diffA = a[i] - meanA;
    const diffB = b[i] - meanB;
    cov += diffA * diffB;
    varA += diffA * diffA;
    varB += diffB * diffB;
  }

  const denom = Math.sqrt(varA * varB);
  return denom === 0 ? 0 : cov / denom;
}

/**
 * Calculate Rolling Correlation
 * @param {number[]} seriesA - First series
 * @param {number[]} seriesB - Second series
 * @param {number} window - Rolling window size
 * @returns {number[]} Array of correlation values
 */
export function calculateRollingCorrelation(seriesA, seriesB, window = 30) {
  const n = Math.min(seriesA.length, seriesB.length);
  if (n < window) return [];

  const result = [];
  for (let i = window; i <= n; i++) {
    const a = seriesA.slice(i - window, i);
    const b = seriesB.slice(i - window, i);
    result.push(calculateCorrelation(a, b));
  }

  return result;
}

/**
 * Generate trading signal based on RSI + MACD
 * @param {number} rsi - Current RSI value
 * @param {{ macdLine: number, signalLine: number, histogram: number }} macd - Current MACD values
 * @returns {{ signal: string, strength: number, details: object }}
 */
export function generateSignal(rsi, macd) {
  let score = 0; // -100 to +100

  // RSI component (-50 to +50)
  if (rsi <= 20) score += 50;        // Extremely oversold
  else if (rsi <= 30) score += 35;   // Oversold
  else if (rsi <= 40) score += 15;   // Slightly oversold
  else if (rsi >= 80) score -= 50;   // Extremely overbought
  else if (rsi >= 70) score -= 35;   // Overbought
  else if (rsi >= 60) score -= 15;   // Slightly overbought
  // 40-60 neutral: 0

  // MACD component (-50 to +50)
  const { histogram } = macd;
  if (histogram > 0) {
    score += Math.min(histogram * 500, 50);  // Bullish momentum
  } else {
    score += Math.max(histogram * 500, -50); // Bearish momentum
  }

  // MACD crossover bonus
  if (macd.macdLine > macd.signalLine && histogram > 0) score += 10;
  if (macd.macdLine < macd.signalLine && histogram < 0) score -= 10;

  // Clamp
  score = Math.max(-100, Math.min(100, score));

  // Determine signal
  let signal;
  if (score >= 60) signal = 'Strong Buy';
  else if (score >= 25) signal = 'Buy';
  else if (score > -25) signal = 'Neutral';
  else if (score > -60) signal = 'Sell';
  else signal = 'Strong Sell';

  return {
    signal,
    strength: score,
    details: {
      rsiScore: rsi,
      macdHistogram: histogram,
      macdCrossover: macd.macdLine > macd.signalLine ? 'bullish' : 'bearish',
    },
  };
}

/**
 * Calculate SMA (Simple Moving Average)
 * @param {number[]} data - Input data
 * @param {number} period - SMA period
 * @returns {number[]} SMA values
 */
export function calculateSMA(data, period) {
  if (data.length < period) return [];

  const result = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / period);
  }

  return result;
}
