// ═══════════════════════════════════════════════════════════════
// useCryptoData — Central Data Management Hook
// Manages WebSocket, mocks, TA, watchlist, live trades, risk.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateVolatility,
  calculateCorrelation,
  calculateRollingCorrelation,
  calculateRollingVolatility,
  generateSignal,
  calculateEMA,
} from '../lib/technicalAnalysis.js';
import {
  calculateSharpeRatio,
  calculateSortinoRatio,
  calculateMaxDrawdown,
  calculateVaR,
  calculateCVaR,
  calculateATR,
  calculateROC,
  calculateBeta,
  calculateVWAP,
  calculateOBV,
  calculateStochastic,
} from '../lib/advancedAnalytics.js';
import {
  generateOHLCV,
  generateOrderBook,
  generateMarketOverview,
  getFearGreedInfo,
  generateWatchlist,
  generateTrade,
} from '../lib/mockData.js';

// ─── API Integration Ready ───────────────────────────────────

export async function fetchHistoricalData(symbol) {
  // Production: swap to Binance REST
  const startPrice = symbol === 'BTCUSDT' ? 104500 : 2520;
  const volatility = symbol === 'BTCUSDT' ? 0.55 : 0.72;
  return generateOHLCV({ startPrice, volatility, count: 200, intervalMinutes: 15 });
}

export async function fetchTickerData() { return null; }

// ─── Hook ────────────────────────────────────────────────────

export default function useCryptoData() {
  const [btcTicker, setBtcTicker] = useState({
    price: '104532.80', change: '2.34', volume: '28543210000',
    high: '105890.00', low: '102180.00',
  });
  const [ethTicker, setEthTicker] = useState({
    price: '2521.45', change: '3.12', volume: '14320650000',
    high: '2580.00', low: '2465.00',
  });

  const [btcCandles, setBtcCandles] = useState([]);
  const [ethCandles, setEthCandles] = useState([]);

  const [btcDepth, setBtcDepth] = useState({ bids: [], asks: [] });
  const [ethDepth, setEthDepth] = useState({ bids: [], asks: [] });

  const [marketOverview, setMarketOverview] = useState(generateMarketOverview());
  const [watchlist, setWatchlist] = useState(generateWatchlist());
  const [liveTrades, setLiveTrades] = useState([]);
  const [wsStatus, setWsStatus] = useState('connecting'); // connecting | live | offline

  const wsRef = useRef(null);
  const btcPriceRef = useRef(104500);
  const ethPriceRef = useRef(2520);

  // ─── Historical Data Init ──────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const [btcHistory, ethHistory] = await Promise.all([
        fetchHistoricalData('BTCUSDT'),
        fetchHistoricalData('ETHUSDT'),
      ]);
      setBtcCandles(btcHistory);
      setEthCandles(ethHistory);
      setBtcDepth(generateOrderBook(btcHistory[btcHistory.length - 1]?.close || 104500));
      setEthDepth(generateOrderBook(ethHistory[ethHistory.length - 1]?.close || 2520, 8));
    };
    init();
  }, []);

  // ─── WebSocket ─────────────────────────────────────────────
  useEffect(() => {
    let offlineTimer;
    let catchTimer;
    try {
      const ws = new WebSocket(
        'wss://stream.binance.com:9443/stream?streams=btcusdt@ticker/ethusdt@ticker/btcusdt@kline_15m/ethusdt@kline_15m/btcusdt@depth5/ethusdt@depth5'
      );
      offlineTimer = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) setWsStatus('offline');
      }, 5000);

      ws.onopen = () => { setWsStatus('live'); };
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        const stream = msg.stream;
        const data = msg.data;

        if (stream?.endsWith('@ticker')) {
          const ticker = {
            price: data.c, change: data.P, volume: data.q, high: data.h, low: data.l,
          };
          if (data.s === 'BTCUSDT') setBtcTicker(ticker);
          if (data.s === 'ETHUSDT') setEthTicker(ticker);
        }
        if (stream?.endsWith('@kline_15m')) {
          const k = data.k;
          const candle = {
            time: k.t,
            open: +k.o, high: +k.h, low: +k.l, close: +k.c, volume: +k.v,
            isClosed: k.x,
          };
          const update = (prev) => {
            if (prev.length === 0) return [candle];
            const last = prev[prev.length - 1];
            if (last.time === candle.time) {
              const u = [...prev]; u[u.length - 1] = candle; return u;
            }
            return [...prev, candle].slice(-200);
          };
          if (data.s === 'BTCUSDT') setBtcCandles(update);
          if (data.s === 'ETHUSDT') setEthCandles(update);
        }
        if (stream?.endsWith('@depth5')) {
          const depth = {
            bids: data.bids.map(d => ({ price: d[0], amount: d[1] })),
            asks: data.asks.map(d => ({ price: d[0], amount: d[1] })),
          };
          if (stream.startsWith('btcusdt')) setBtcDepth(depth);
          if (stream.startsWith('ethusdt')) setEthDepth(depth);
        }
      };
      ws.onerror = () => setWsStatus('offline');
      ws.onclose = () => setWsStatus(prev => (prev === 'live' ? 'offline' : prev));
      wsRef.current = ws;
    } catch {
      // defer setState out of effect body to avoid cascading-render warning
      catchTimer = setTimeout(() => setWsStatus('offline'), 0);
    }

    return () => {
      clearTimeout(offlineTimer);
      clearTimeout(catchTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  useEffect(() => { btcPriceRef.current = parseFloat(btcTicker.price) || 104500; }, [btcTicker.price]);
  useEffect(() => { ethPriceRef.current = parseFloat(ethTicker.price) || 2520; }, [ethTicker.price]);

  // ─── Periodic Mock Updates ─────────────────────────────────
  useEffect(() => {
    const tick = () => {
      setBtcDepth(() => generateOrderBook(btcPriceRef.current, 3 + Math.random() * 4));
      setEthDepth(() => generateOrderBook(ethPriceRef.current, 5 + Math.random() * 6));
      setMarketOverview(generateMarketOverview());
      setWatchlist(generateWatchlist());

      // micro-movements on last candle
      const bump = (prev, volScale = 0.002) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        const change = (Math.random() - 0.48) * last.close * volScale;
        const newClose = last.close + change;
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...last,
          close: Math.round(newClose * 100) / 100,
          high: Math.max(last.high, newClose),
          low:  Math.min(last.low, newClose),
          volume: last.volume + Math.random() * 0.5,
        };
        return updated;
      };
      setBtcCandles(prev => bump(prev, 0.002));
      setEthCandles(prev => bump(prev, 0.003));
    };

    const interval = setInterval(tick, 3000);
    return () => clearInterval(interval);
  }, []);

  // ─── Live Trades ───────────────────────────────────────────
  useEffect(() => {
    const emit = () => {
      const asset = Math.random() > 0.55 ? 'BTC' : 'ETH';
      const mid = asset === 'BTC' ? btcPriceRef.current : ethPriceRef.current;
      setLiveTrades(prev => [generateTrade(asset, mid), ...prev].slice(0, 40));
    };
    emit();
    const interval = setInterval(emit, 900 + Math.random() * 900);
    return () => clearInterval(interval);
  }, []);

  // ─── TA Core ───────────────────────────────────────────────
  const technicalAnalysis = useMemo(() => {
    const btcCloses = btcCandles.map(c => c.close);
    const ethCloses = ethCandles.map(c => c.close);

    const btcRSI = calculateRSI(btcCloses);
    const ethRSI = calculateRSI(ethCloses);

    const btcMACD = calculateMACD(btcCloses);
    const ethMACD = calculateMACD(ethCloses);

    const btcBB = calculateBollingerBands(btcCloses);
    const ethBB = calculateBollingerBands(ethCloses);

    const btcVol = calculateVolatility(btcCloses);
    const ethVol = calculateVolatility(ethCloses);

    const btcRollingVol = calculateRollingVolatility(btcCloses);
    const ethRollingVol = calculateRollingVolatility(ethCloses);

    const correlation = calculateCorrelation(btcCloses, ethCloses);
    const rollingCorr = calculateRollingCorrelation(btcCloses, ethCloses, 30);

    const btcEMA50  = calculateEMA(btcCloses, 50);
    const btcEMA200 = calculateEMA(btcCloses, 200);
    const ethEMA50  = calculateEMA(ethCloses, 50);
    const ethEMA200 = calculateEMA(ethCloses, 200);

    const btcCurrentRSI = btcRSI.length > 0 ? btcRSI[btcRSI.length - 1] : 50;
    const ethCurrentRSI = ethRSI.length > 0 ? ethRSI[ethRSI.length - 1] : 50;

    const last = (arr) => arr.length > 0 ? arr[arr.length - 1] : 0;
    const btcCurrentMACD = {
      macdLine: last(btcMACD.macdLine),
      signalLine: last(btcMACD.signalLine),
      histogram: last(btcMACD.histogram),
    };
    const ethCurrentMACD = {
      macdLine: last(ethMACD.macdLine),
      signalLine: last(ethMACD.signalLine),
      histogram: last(ethMACD.histogram),
    };

    const btcSignal = generateSignal(btcCurrentRSI, btcCurrentMACD);
    const ethSignal = generateSignal(ethCurrentRSI, ethCurrentMACD);

    return {
      btc: {
        rsi: btcRSI, currentRSI: btcCurrentRSI,
        macd: btcMACD, currentMACD: btcCurrentMACD,
        bollingerBands: btcBB,
        volatility: btcVol, rollingVolatility: btcRollingVol,
        signal: btcSignal,
        ema50: btcEMA50, ema200: btcEMA200,
      },
      eth: {
        rsi: ethRSI, currentRSI: ethCurrentRSI,
        macd: ethMACD, currentMACD: ethCurrentMACD,
        bollingerBands: ethBB,
        volatility: ethVol, rollingVolatility: ethRollingVol,
        signal: ethSignal,
        ema50: ethEMA50, ema200: ethEMA200,
      },
      correlation, rollingCorrelation: rollingCorr,
    };
  }, [btcCandles, ethCandles]);

  // ─── Advanced Risk Metrics ─────────────────────────────────
  const riskMetrics = useMemo(() => {
    const btcCloses = btcCandles.map(c => c.close);
    const ethCloses = ethCandles.map(c => c.close);

    return {
      btc: {
        sharpe:      calculateSharpeRatio(btcCloses),
        sortino:     calculateSortinoRatio(btcCloses),
        maxDrawdown: calculateMaxDrawdown(btcCloses),
        var95:       calculateVaR(btcCloses, 0.95),
        cvar95:      calculateCVaR(btcCloses, 0.95),
        atr:         calculateATR(btcCandles),
        roc10:       calculateROC(btcCloses, 10),
        roc30:       calculateROC(btcCloses, 30),
        beta:        1.0, // BTC is benchmark
        vwap:        calculateVWAP(btcCandles),
        obv:         calculateOBV(btcCandles),
        stoch:       calculateStochastic(btcCandles),
      },
      eth: {
        sharpe:      calculateSharpeRatio(ethCloses),
        sortino:     calculateSortinoRatio(ethCloses),
        maxDrawdown: calculateMaxDrawdown(ethCloses),
        var95:       calculateVaR(ethCloses, 0.95),
        cvar95:      calculateCVaR(ethCloses, 0.95),
        atr:         calculateATR(ethCandles),
        roc10:       calculateROC(ethCloses, 10),
        roc30:       calculateROC(ethCloses, 30),
        beta:        calculateBeta(ethCloses, btcCloses),
        vwap:        calculateVWAP(ethCandles),
        obv:         calculateOBV(ethCandles),
        stoch:       calculateStochastic(ethCandles),
      },
    };
  }, [btcCandles, ethCandles]);

  const fearGreedInfo = useMemo(
    () => getFearGreedInfo(marketOverview.fearGreedIndex),
    [marketOverview.fearGreedIndex]
  );

  return {
    btcTicker, ethTicker,
    btcCandles, ethCandles,
    btcDepth, ethDepth,
    marketOverview, fearGreedInfo,
    technicalAnalysis,
    riskMetrics,
    watchlist,
    liveTrades,
    wsStatus,
    fetchHistoricalData, fetchTickerData,
  };
}
