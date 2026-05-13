import useCryptoData from './hooks/useCryptoData.js';
import HeaderHUD from './components/Header.jsx';
import TickerRibbon from './components/TickerRibbon.jsx';
import AssetCard from './components/CryptoCard.jsx';
import MainTradingView from './components/CandlestickChart.jsx';
import OrderBook from './components/OrderBook.jsx';
import DepthChart from './components/DepthChart.jsx';
import CorrelationEngine from './components/CorrelationEngine.jsx';
import VolatilityTracker from './components/VolatilityTracker.jsx';
import SentimentSignals from './components/SentimentSignals.jsx';
import MarketHeatmap from './components/MarketHeatmap.jsx';
import LiveTrades from './components/LiveTrades.jsx';
import RiskMetrics from './components/RiskMetrics.jsx';

export default function App() {
  const {
    btcTicker, ethTicker,
    btcCandles, ethCandles,
    btcDepth, ethDepth,
    marketOverview, fearGreedInfo,
    technicalAnalysis,
    riskMetrics,
    watchlist,
    liveTrades,
    wsStatus,
  } = useCryptoData();

  const btcMid = parseFloat(btcTicker.price);
  const ethMid = parseFloat(ethTicker.price);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header HUD */}
      <HeaderHUD
        marketOverview={marketOverview}
        fearGreedInfo={fearGreedInfo}
        wsStatus={wsStatus}
      />

      {/* Ticker Ribbon */}
      <TickerRibbon watchlist={watchlist} />

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-6 flex flex-col gap-4 lg:gap-5 max-w-[1600px] w-full mx-auto">
        {/* Row 1: Asset Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
          <AssetCard asset="BTC" ticker={btcTicker} candles={btcCandles} ta={technicalAnalysis.btc} />
          <AssetCard asset="ETH" ticker={ethTicker} candles={ethCandles} ta={technicalAnalysis.eth} />
        </div>

        {/* Row 2: Trading View + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 lg:gap-5">
          <div className="min-w-0">
            <MainTradingView
              btcCandles={btcCandles}
              ethCandles={ethCandles}
              ta={technicalAnalysis}
            />
          </div>
          <div className="flex flex-col gap-4 lg:gap-5">
            <SentimentSignals btcTA={technicalAnalysis.btc} ethTA={technicalAnalysis.eth} />
            <VolatilityTracker btcTA={technicalAnalysis.btc} ethTA={technicalAnalysis.eth} />
          </div>
        </div>

        {/* Row 3: Heatmap + Live Trades */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 lg:gap-5">
          <MarketHeatmap watchlist={watchlist} />
          <LiveTrades trades={liveTrades} />
        </div>

        {/* Row 4: Risk Metrics */}
        <RiskMetrics btcRisk={riskMetrics.btc} ethRisk={riskMetrics.eth} />

        {/* Row 5: Order Books + Depth Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
          <OrderBook title="BTC/USDT Order Book" data={btcDepth} accent="#F7931A" />
          <OrderBook title="ETH/USDT Order Book" data={ethDepth} accent="#627EEA" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
          <DepthChart title="BTC Market Depth" depth={btcDepth} mid={btcMid} accent="#F7931A" />
          <DepthChart title="ETH Market Depth" depth={ethDepth} mid={ethMid} accent="#627EEA" />
        </div>

        {/* Row 6: Correlation Engine */}
        <CorrelationEngine
          btcCandles={btcCandles} ethCandles={ethCandles}
          correlation={technicalAnalysis.correlation}
          rollingCorrelation={technicalAnalysis.rollingCorrelation}
        />

        {/* Footer */}
        <footer className="text-center py-4 text-[10px] text-text-muted border-t border-border">
          <div className="neon-divider mb-3" />
          <p className="font-mono">Crypto Pulse Institutional Terminal · Quant Research · Binance WebSocket + Mock Engine</p>
          <p className="mt-1 uppercase tracking-[0.18em] text-text-dim">For educational purposes only · Not financial advice</p>
        </footer>
      </main>
    </div>
  );
}
