import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, History, RotateCcw, Trash2, Copy, CheckCircle2, Info, Layers, Download, BarChart3, ChevronDown, ChevronUp, Calculator, Sigma, Activity, TrendingUp, Loader2, WifiOff, Grid3x3, Wand2, Eraser, CheckCheck } from 'lucide-react';
import { useLotteryTrends } from './hooks/useLotteryTrends';

// 熱門度轉顏色：100=深紅，50=橙，0=藍
function hotnessColor(score) {
  if (score >= 75) return 'bg-red-500 text-white border-red-400';
  if (score >= 50) return 'bg-orange-400 text-white border-orange-300';
  if (score >= 25) return 'bg-amber-200 text-amber-800 border-amber-300';
  return 'bg-blue-100 text-blue-700 border-blue-200';
}

// 遺漏值標籤色
function gapColor(gap) {
  if (gap === 0) return 'text-emerald-600 font-bold';
  if (gap <= 3) return 'text-orange-500 font-semibold';
  if (gap >= 15) return 'text-blue-500';
  return 'text-slate-400';
}

// 趨勢指標區塊
function TrendsSection({ trends, status, show, onToggle }) {
  const headerContent = () => {
    if (status === 'loading') {
      return (
        <span className="flex items-center text-slate-500 text-sm ml-2">
          <Loader2 className="w-4 h-4 animate-spin mr-1" /> 載入中...
        </span>
      );
    }
    if (status === 'offline') {
      return (
        <span className="flex items-center text-slate-400 text-sm ml-2">
          <WifiOff className="w-4 h-4 mr-1" /> 離線（無歷史資料）
        </span>
      );
    }
    if (trends) {
      return (
        <span className="text-xs text-slate-400 ml-2 font-normal">
          近 {trends.window} 期資料 · 共 {trends.totalDraws} 期
        </span>
      );
    }
    return null;
  };

  return (
    <div className="max-w-2xl mx-auto mb-6">
      <button
        onClick={onToggle}
        className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors group"
      >
        <div className="flex items-center font-bold text-slate-700">
          <TrendingUp className="w-5 h-5 mr-2 text-emerald-500" />
          歷史趨勢指標（明牌模式）
          {headerContent()}
        </div>
        {show ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {show && (
        <div className="bg-white border-x border-b border-slate-200 rounded-b-xl p-5 space-y-6">

          {/* 免責聲明 */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-700 leading-relaxed">
            以下指標僅反映歷史統計分佈，每期開獎為獨立隨機事件，歷史資料不影響未來結果。僅供娛樂參考，請理性投注。
          </div>

          {status === 'offline' && (
            <div className="text-center text-slate-400 py-4 text-sm">
              <WifiOff className="w-6 h-6 mx-auto mb-2" />
              無法載入歷史資料（離線或檔案不存在）
            </div>
          )}

          {status === 'loading' && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
            </div>
          )}

          {status === 'ready' && trends && (
            <>
              {/* 最新一期開獎號碼 */}
              {trends.latestDraw && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    最新一期開獎號碼 · 第 {trends.latestDraw.drawId} 期
                    {trends.latestDraw.date && (
                      <span className="ml-1 font-normal normal-case">（{trends.latestDraw.date}）</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {trends.latestDraw.zoneA.map(n => (
                      <span
                        key={n}
                        className="w-9 h-9 bg-slate-700 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm"
                      >
                        {n}
                      </span>
                    ))}
                    <span className="text-slate-300 font-bold mx-1">+</span>
                    <span className="w-9 h-9 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                      {trends.latestDraw.special}
                    </span>
                  </div>
                </div>
              )}

              {/* 圖例 */}
              <div className="flex flex-wrap gap-3 text-xs items-center">
                <span className="font-bold text-slate-500">圖例：</span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded bg-red-500 inline-block"></span> 高熱門度
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded bg-orange-400 inline-block"></span> 中熱門度
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded bg-blue-100 border border-blue-200 inline-block"></span> 低熱門度
                </span>
                <span className="text-slate-400 ml-1">下方小字 = 遺漏期數</span>
              </div>

              {/* 第一區 1-38 */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  第一區 (1-38) — 熱門度 &amp; 遺漏值
                </h4>
                <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5">
                  {Array.from({ length: 38 }, (_, i) => {
                    const n = i + 1;
                    const info = trends.zoneA[n];
                    return (
                      <div key={n} className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border transition-colors ${hotnessColor(info.hotness)}`}
                          title={`號碼 ${n}｜出現 ${info.count} 次｜遺漏 ${info.gap} 期`}
                        >
                          {n}
                        </div>
                        <span className={`text-[9px] mt-0.5 ${gapColor(info.gap)}`}>
                          {info.gap}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-300 mt-2">數字下方 = 距上次出現的期數（遺漏值）；0 = 最近一期出現</p>
              </div>

              {/* 第二區 1-8 */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  第二區 (1-8) — 熱門度 &amp; 遺漏值
                </h4>
                <div className="flex gap-3 flex-wrap">
                  {Array.from({ length: 8 }, (_, i) => {
                    const n = i + 1;
                    const info = trends.zoneB[n];
                    return (
                      <div key={n} className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${info.hotness >= 60 ? 'bg-red-500 text-white border-red-400' : info.hotness >= 30 ? 'bg-orange-300 text-white border-orange-400' : 'bg-blue-100 text-blue-700 border-blue-300'}`}
                          title={`號碼 ${n}｜出現 ${info.count} 次｜遺漏 ${info.gap} 期`}
                        >
                          {n}
                        </div>
                        <span className={`text-[10px] mt-1 ${gapColor(info.gap)}`}>
                          遺漏 {info.gap}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top 熱門 / 高遺漏 快速參考 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <div className="text-xs font-bold text-red-500 mb-2 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" /> 第一區近期高頻號（Top 6）
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(trends.zoneA)
                      .sort((a, b) => b[1].count - a[1].count)
                      .slice(0, 6)
                      .map(([n, info]) => (
                        <div key={n} className="flex flex-col items-center">
                          <span className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">{n}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">{info.count}次</span>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <div className="text-xs font-bold text-blue-500 mb-2">高遺漏號（Top 6）</div>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(trends.zoneA)
                      .sort((a, b) => b[1].gap - a[1].gap)
                      .slice(0, 6)
                      .map(([n, info]) => (
                        <div key={n} className="flex flex-col items-center">
                          <span className="w-8 h-8 bg-blue-400 text-white rounded-full flex items-center justify-center text-xs font-bold">{n}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">+{info.gap}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const PowerLotteryApp = () => {
  const [currentDraw, setCurrentDraw] = useState({
    zoneA: [null, null, null, null, null, null],
    zoneB: null,
  });
  const [history, setHistory] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(null);
  const [generateCount, setGenerateCount] = useState(1);
  const [showStats, setShowStats] = useState(false);
  const [showTrends, setShowTrends] = useState(false);
  // 自訂球池包牌模式
  const [showCustomPool, setShowCustomPool] = useState(false);
  const [customPoolA, setCustomPoolA] = useState([]); // 第一區候選號（1-38）
  const [customPoolB, setCustomPoolB] = useState([]); // 第二區候選號（1-8）
  const [customCount, setCustomCount] = useState(1);
  const { trends, status: trendsStatus } = useLotteryTrends();

  // 初始化時讀取歷史紀錄
  useEffect(() => {
    const savedHistory = localStorage.getItem('powerLotteryHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 保存歷史紀錄
  useEffect(() => {
    localStorage.setItem('powerLotteryHistory', JSON.stringify(history));
  }, [history]);

  // 高質量隨機數生成函數
  // 拒絕抽樣：消除模數偏差，確保每個值機率完全相等
  const secureRandomInt = (max) => {
    // 計算 2^32 中可整除 max 的最大上界
    // 超過此上界的值一律捨棄重抽，避免低編號被多選到
    const limit = Math.floor(0x100000000 / max) * max;
    const buf = new Uint32Array(1);
    do {
      window.crypto.getRandomValues(buf);
    } while (buf[0] >= limit);
    return buf[0] % max;
  };

  // Fisher-Yates 洗牌 + 拒絕抽樣，確保每次抽取為獨立事件
  const secureRandomSample = (min, max, count) => {
    const pool = Array.from({ length: max - min + 1 }, (_, i) => i + min);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = secureRandomInt(i + 1);
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count).sort((a, b) => a - b);
  };

  // 從「使用者自訂候選池」中無偏差抽樣 count 個
  // 同樣使用 Fisher-Yates + secureRandomInt（拒絕抽樣），嚴禁 Math.random
  const secureSampleFromPool = (pool, count) => {
    const arr = [...pool];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = secureRandomInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, count).sort((a, b) => a - b);
  };

  const generateNumbers = () => {
    if (isAnimating) return;

    // 簡單驗證輸入
    let count = parseInt(generateCount);
    if (isNaN(count) || count < 1) count = 1;
    if (count > 500) {
        if(!window.confirm(`一次生成 ${count} 組可能會花費一點時間，確定要繼續嗎？`)) return;
    }

    setIsAnimating(true);

    // 動畫效果
    let frames = 0;
    const maxFrames = 20;

    const intervalId = setInterval(() => {
      const tempA = Array.from({ length: 6 }, () => Math.floor(Math.random() * 38) + 1);
      const tempB = Math.floor(Math.random() * 8) + 1;

      setCurrentDraw({ zoneA: tempA, zoneB: tempB });
      frames++;

      if (frames >= maxFrames) {
        clearInterval(intervalId);
        finalizeDraw(count);
      }
    }, 50);
  };

  const finalizeDraw = (count) => {
    const newDraws = [];
    const timestamp = new Date().toLocaleString('zh-TW', { hour12: false });

    for (let i = 0; i < count; i++) {
        const finalZoneA = secureRandomSample(1, 38, 6);
        const finalZoneB = secureRandomSample(1, 8, 1)[0];

        newDraws.push({
            id: Date.now() + i,
            timestamp: timestamp,
            zoneA: finalZoneA,
            zoneB: finalZoneB
        });
    }

    setCurrentDraw({ zoneA: newDraws[0].zoneA, zoneB: newDraws[0].zoneB });
    setHistory(newDraws);
    setIsAnimating(false);
  };

  // ===== 自訂球池包牌模式 =====
  const toggleCustomA = (n) => {
    if (isAnimating) return;
    setCustomPoolA((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  };

  const toggleCustomB = (n) => {
    if (isAnimating) return;
    setCustomPoolB((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  };

  const selectAllA = () => !isAnimating && setCustomPoolA(Array.from({ length: 38 }, (_, i) => i + 1));
  const selectAllB = () => !isAnimating && setCustomPoolB(Array.from({ length: 8 }, (_, i) => i + 1));
  const clearPoolA = () => !isAnimating && setCustomPoolA([]);
  const clearPoolB = () => !isAnimating && setCustomPoolB([]);

  const generateFromPool = () => {
    if (isAnimating) return;
    if (customPoolA.length < 6) {
      window.alert('第一區候選池至少要圈選 6 個號碼');
      return;
    }
    if (customPoolB.length < 1) {
      window.alert('第二區候選池至少要圈選 1 個號碼');
      return;
    }

    let count = parseInt(customCount);
    if (isNaN(count) || count < 1) count = 1;
    if (count > 500) {
      if (!window.confirm(`一次組合 ${count} 組可能會花費一點時間，確定要繼續嗎？`)) return;
    }

    setIsAnimating(true);

    // 純視覺動畫：從候選池中隨機閃動（不影響最終結果）
    let frames = 0;
    const maxFrames = 20;
    const intervalId = setInterval(() => {
      const tempA = Array.from({ length: 6 }, () => customPoolA[Math.floor(Math.random() * customPoolA.length)]);
      const tempB = customPoolB[Math.floor(Math.random() * customPoolB.length)];
      setCurrentDraw({ zoneA: tempA, zoneB: tempB });
      frames++;
      if (frames >= maxFrames) {
        clearInterval(intervalId);
        finalizePoolDraw(count);
      }
    }, 50);
  };

  const finalizePoolDraw = (count) => {
    const newDraws = [];
    const timestamp = new Date().toLocaleString('zh-TW', { hour12: false });

    for (let i = 0; i < count; i++) {
      // 公平性紅線：自訂池洗牌一律走 secureSampleFromPool（Fisher-Yates + 拒絕抽樣）
      const finalZoneA = secureSampleFromPool(customPoolA, 6);
      const finalZoneB = secureSampleFromPool(customPoolB, 1)[0];

      newDraws.push({
        id: Date.now() + i,
        timestamp,
        zoneA: finalZoneA,
        zoneB: finalZoneB,
        source: 'pool', // 標記來源，與一般批量產生共用同一結構
      });
    }

    setCurrentDraw({ zoneA: newDraws[0].zoneA, zoneB: newDraws[0].zoneB });
    // 加入（prepend）至既有歷史紀錄，與批量產生列表對齊，共用 localStorage / CSV / 統計
    setHistory((prev) => [...newDraws, ...prev]);
    setIsAnimating(false);
  };

  const clearHistory = () => {
    if (window.confirm('確定要清除所有歷史紀錄嗎？')) {
      setHistory([]);
    }
  };

  const copyToClipboard = (draw) => {
    const text = `威力彩選號:\nA區: ${draw.zoneA.join(', ')}\nB區: ${draw.zoneB}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(draw.id);
      setTimeout(() => setCopySuccess(null), 2000);
    });
  };

  // CSV 下載功能
  const downloadCSV = () => {
    if (history.length === 0) return;

    const headers = ['生成時間', '第一區-1', '第一區-2', '第一區-3', '第一區-4', '第一區-5', '第一區-6', '第二區', '第一區總和', '是否連號'];
    const rows = history.map(draw => {
        // 計算該筆資料的總和與連號
        const sumA = draw.zoneA.reduce((a, b) => a + b, 0);
        let hasConsecutive = false;
        for (let i = 0; i < draw.zoneA.length - 1; i++) {
            if (draw.zoneA[i] + 1 === draw.zoneA[i+1]) {
                hasConsecutive = true;
                break;
            }
        }

        return [
            `"${draw.timestamp}"`,
            ...draw.zoneA,
            draw.zoneB,
            sumA,
            hasConsecutive ? '是' : '否'
        ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `威力彩選號_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 統計數據計算 (Memoized)
  const stats = useMemo(() => {
    if (history.length === 0) return null;

    const countsA = {};
    const countsB = {};
    let totalSumA = 0;
    let drawsWithConsecutive = 0;

    // 初始化計數器
    for(let i=1; i<=38; i++) countsA[i] = 0;
    for(let i=1; i<=8; i++) countsB[i] = 0;

    // 計算頻率與進階數據
    history.forEach(draw => {
        let currentSumA = 0;
        let hasConsecutive = false;

        // 第一區分析
        draw.zoneA.forEach((num, index) => {
            countsA[num] = (countsA[num] || 0) + 1;
            currentSumA += num;

            // 檢查連號 (因已排序，只需檢查當前與下一個)
            if (index < draw.zoneA.length - 1) {
                if (draw.zoneA[index] + 1 === draw.zoneA[index+1]) {
                    hasConsecutive = true;
                }
            }
        });

        totalSumA += currentSumA;
        if (hasConsecutive) drawsWithConsecutive++;

        // 第二區分析
        countsB[draw.zoneB] = (countsB[draw.zoneB] || 0) + 1;
    });

    // 排序函數
    const getSorted = (counts) => Object.entries(counts)
        .map(([num, count]) => ({ num: parseInt(num), count }))
        .sort((a, b) => b.count - a.count); // 降序

    const sortedA = getSorted(countsA);
    const sortedB = getSorted(countsB);

    return {
        zoneA: {
            hot: sortedA.slice(0, 5),
            cold: sortedA.slice(-5).reverse(),
            // 進階數據
            avgSum: (totalSumA / history.length).toFixed(1),
            avgNum: (totalSumA / (history.length * 6)).toFixed(1),
            consecutiveRate: ((drawsWithConsecutive / history.length) * 100).toFixed(1),
            drawsWithConsecutive: drawsWithConsecutive
        },
        zoneB: {
            hot: sortedB.slice(0, 3),
            cold: sortedB.slice(-3).reverse(),
        },
        totalDraws: history.length
    };
  }, [history]);

  // 自訂池可組合的「不同組合總數」= C(A池, 6) × B池數量（純統計事實，非機率）
  const poolCombos = useMemo(() => {
    const a = customPoolA.length;
    const b = customPoolB.length;
    if (a < 6 || b < 1) return 0;
    const C = (n, k) => {
      let r = 1;
      for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
      return Math.round(r);
    };
    return C(a, 6) * b;
  }, [customPoolA, customPoolB]);

  const poolReady = customPoolA.length >= 6 && customPoolB.length >= 1;

  // 號碼球組件
  const Ball = ({ num, type, animate, size = 'normal' }) => {
    const isZoneB = type === 'zoneB';
    const isSmall = size === 'small';

    let sizeClasses = "w-12 h-12 sm:w-14 sm:h-14 text-lg sm:text-xl"; // Normal
    if (isSmall) sizeClasses = "w-8 h-8 text-sm"; // Small for stats

    const baseClasses = `${sizeClasses} rounded-full flex items-center justify-center font-bold shadow-lg transform transition-all duration-300`;

    const colorClasses = isZoneB
      ? "bg-gradient-to-br from-red-500 to-red-700 text-white border-2 border-red-300"
      : "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white border-2 border-emerald-200";

    return (
      <div className={`${baseClasses} ${colorClasses} ${animate ? 'scale-110' : 'scale-100'}`}>
        {num || '?'}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-100">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm mb-4">
            <Sparkles className="w-8 h-8 text-yellow-500 mr-2" />
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800">
              台灣威力彩 <span className="text-emerald-600">幸運產生器</span>
            </h1>
          </div>
          <p className="text-slate-500 text-sm sm:text-base">
            加密級隨機數 • 獨立事件 • 數據分析
          </p>
        </header>

        {/* Main Display Area */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-10 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-100 rounded-full -mr-10 -mt-10 opacity-50 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-100 rounded-full -ml-10 -mb-10 opacity-50 blur-2xl"></div>

          <div className="relative z-10">
            {/* Zone A */}
            <div className="mb-6">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                第一區 (1-38)
                <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">取 6 個</span>
              </h2>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                {currentDraw.zoneA.map((num, idx) => (
                  <Ball key={`a-${idx}`} num={num} type="zoneA" animate={isAnimating} />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center my-6 opacity-20">
              <div className="h-px bg-slate-800 w-full max-w-xs"></div>
            </div>

            {/* Zone B */}
            <div className="mb-8 text-center">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-center">
                第二區 (1-8)
                <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">取 1 個</span>
              </h2>
              <div className="flex justify-center">
                <Ball num={currentDraw.zoneB} type="zoneB" animate={isAnimating} />
              </div>
            </div>

            {/* Action Area */}
            <div className="flex flex-col items-center justify-center gap-4">

              {/* Batch Count Input */}
              <div className="flex items-center bg-slate-100 rounded-full px-5 py-2 shadow-inner w-full max-w-xs sm:w-auto">
                <Layers className="w-4 h-4 text-slate-500 mr-2 flex-shrink-0" />
                <span className="text-sm font-bold text-slate-600 mr-2 whitespace-nowrap">產生組數:</span>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={generateCount}
                  onChange={(e) => setGenerateCount(e.target.value)}
                  disabled={isAnimating}
                  className="bg-transparent font-bold text-slate-800 outline-none w-full sm:w-20 text-center border-b border-slate-300 focus:border-emerald-500 transition-colors"
                  placeholder="輸入數量"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={generateNumbers}
                disabled={isAnimating}
                className={`
                  group relative overflow-hidden rounded-full px-8 py-4
                  bg-slate-900 text-white font-bold text-lg shadow-xl
                  transition-all duration-200 w-full sm:w-auto
                  ${isAnimating ? 'opacity-80 cursor-wait' : 'hover:scale-105 hover:shadow-2xl active:scale-95'}
                `}
              >
                <span className="relative z-10 flex items-center justify-center">
                  {isAnimating ? (
                    <>
                      <RotateCcw className="w-5 h-5 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2 group-hover:text-yellow-400 transition-colors" />
                      立即生成 {generateCount} 組
                    </>
                  )}
                </span>
                <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
              </button>
            </div>
          </div>
        </div>

        {/* Custom Pool (Smart Wheel) Section */}
        <div className="max-w-2xl mx-auto mb-6">
          <button
            onClick={() => setShowCustomPool((v) => !v)}
            className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center font-bold text-slate-700">
              <Grid3x3 className="w-5 h-5 mr-2 text-violet-500" />
              自訂球池包牌（聰明自選組合）
              {poolReady && (
                <span className="ml-2 text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-normal">
                  已就緒
                </span>
              )}
            </div>
            {showCustomPool ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>

          {showCustomPool && (
            <div className="bg-white border-x border-b border-slate-200 rounded-b-xl p-5 space-y-6">
              {/* 說明 */}
              <div className="bg-violet-50 border border-violet-200 rounded-lg px-4 py-2.5 text-xs text-violet-700 leading-relaxed">
                手動圈選你偏好的號碼作為「候選球池」，點擊「開始組合」後，系統會以加密級隨機（Fisher-Yates + 拒絕抽樣）從你的池中抽出第一區 6 顆、第二區 1 顆。結果會自動加入下方的生成紀錄，可一併匯出 CSV。
              </div>

              {/* 第一區候選池 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    第一區候選池 (1-38)
                    <span className={`ml-2 px-2 py-0.5 rounded-full ${customPoolA.length >= 6 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      已選 {customPoolA.length}（至少 6）
                    </span>
                  </h4>
                  <div className="flex gap-2">
                    <button onClick={selectAllA} disabled={isAnimating} className="text-[11px] flex items-center text-violet-600 hover:text-violet-700 px-2 py-1 rounded-md hover:bg-violet-50 transition-colors disabled:opacity-40">
                      <CheckCheck className="w-3.5 h-3.5 mr-0.5" /> 全選
                    </button>
                    <button onClick={clearPoolA} disabled={isAnimating} className="text-[11px] flex items-center text-slate-500 hover:text-slate-700 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors disabled:opacity-40">
                      <Eraser className="w-3.5 h-3.5 mr-0.5" /> 清除
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5">
                  {Array.from({ length: 38 }, (_, i) => {
                    const n = i + 1;
                    const selected = customPoolA.includes(n);
                    return (
                      <button
                        key={n}
                        onClick={() => toggleCustomA(n)}
                        disabled={isAnimating}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border transition-all ${
                          selected
                            ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm scale-105'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50'
                        } disabled:cursor-not-allowed`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 第二區候選池 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    第二區候選池 (1-8)
                    <span className={`ml-2 px-2 py-0.5 rounded-full ${customPoolB.length >= 1 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                      已選 {customPoolB.length}（至少 1）
                    </span>
                  </h4>
                  <div className="flex gap-2">
                    <button onClick={selectAllB} disabled={isAnimating} className="text-[11px] flex items-center text-violet-600 hover:text-violet-700 px-2 py-1 rounded-md hover:bg-violet-50 transition-colors disabled:opacity-40">
                      <CheckCheck className="w-3.5 h-3.5 mr-0.5" /> 全選
                    </button>
                    <button onClick={clearPoolB} disabled={isAnimating} className="text-[11px] flex items-center text-slate-500 hover:text-slate-700 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors disabled:opacity-40">
                      <Eraser className="w-3.5 h-3.5 mr-0.5" /> 清除
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: 8 }, (_, i) => {
                    const n = i + 1;
                    const selected = customPoolB.includes(n);
                    return (
                      <button
                        key={n}
                        onClick={() => toggleCustomB(n)}
                        disabled={isAnimating}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                          selected
                            ? 'bg-red-500 text-white border-red-400 shadow-sm scale-105'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-red-300 hover:bg-red-50'
                        } disabled:cursor-not-allowed`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 組合數提示 */}
              <div className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 flex items-center">
                <Info className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                {poolReady ? (
                  <span>
                    依目前候選池，共可組合 <span className="font-bold text-violet-600">{poolCombos.toLocaleString()}</span> 種不同號碼組合（C({customPoolA.length},6) × {customPoolB.length}）。此為統計事實，與中獎與否無關。
                  </span>
                ) : (
                  <span>請先在上方圈選號碼：第一區至少 6 個、第二區至少 1 個，即可開始組合。</span>
                )}
              </div>

              {/* 組數 + 開始組合 */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-1">
                <div className="flex items-center bg-slate-100 rounded-full px-5 py-2 shadow-inner w-full max-w-xs sm:w-auto">
                  <Layers className="w-4 h-4 text-slate-500 mr-2 flex-shrink-0" />
                  <span className="text-sm font-bold text-slate-600 mr-2 whitespace-nowrap">組合組數:</span>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={customCount}
                    onChange={(e) => setCustomCount(e.target.value)}
                    disabled={isAnimating}
                    className="bg-transparent font-bold text-slate-800 outline-none w-full sm:w-20 text-center border-b border-slate-300 focus:border-violet-500 transition-colors"
                    placeholder="輸入數量"
                  />
                </div>

                <button
                  onClick={generateFromPool}
                  disabled={isAnimating || !poolReady}
                  className={`group relative overflow-hidden rounded-full px-8 py-3.5 font-bold text-base shadow-lg transition-all duration-200 w-full sm:w-auto flex items-center justify-center ${
                    isAnimating || !poolReady
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-violet-600 text-white hover:scale-105 hover:shadow-xl active:scale-95'
                  }`}
                >
                  {isAnimating ? (
                    <>
                      <RotateCcw className="w-5 h-5 mr-2 animate-spin" /> 組合中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 mr-2" /> 開始組合 {parseInt(customCount) > 0 ? `${parseInt(customCount)} 組` : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Trends Section */}
        <TrendsSection
          trends={trends}
          status={trendsStatus}
          show={showTrends}
          onToggle={() => setShowTrends(v => !v)}
        />

        {/* Statistics Section (Conditional) */}
        {stats && (
            <div className="max-w-2xl mx-auto mb-6">
                <button
                    onClick={() => setShowStats(!showStats)}
                    className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                >
                    <div className="flex items-center font-bold text-slate-700">
                        <BarChart3 className="w-5 h-5 mr-2 text-indigo-500" />
                        歷史數據統計分析 (樣本數: {stats.totalDraws})
                    </div>
                    {showStats ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>

                {showStats && (
                    <div className="bg-white border-x border-b border-slate-200 rounded-b-xl p-6">

                        {/* Zone A Advanced Stats */}
                        <div className="mb-8">
                             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                                <Activity className="w-3 h-3 mr-1" /> 第一區進階分析
                             </h4>
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex flex-col items-center justify-center">
                                    <div className="text-indigo-400 text-xs font-bold mb-1 flex items-center"><Sigma className="w-3 h-3 mr-1"/> 平均總和</div>
                                    <div className="text-2xl font-black text-indigo-700">{stats.zoneA.avgSum}</div>
                                    <div className="text-[10px] text-indigo-300">理論值約 117</div>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex flex-col items-center justify-center">
                                    <div className="text-purple-400 text-xs font-bold mb-1 flex items-center"><Calculator className="w-3 h-3 mr-1"/> 平均數值</div>
                                    <div className="text-2xl font-black text-purple-700">{stats.zoneA.avgNum}</div>
                                    <div className="text-[10px] text-purple-300">理論值約 19.5</div>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex flex-col items-center justify-center">
                                    <div className="text-orange-400 text-xs font-bold mb-1 flex items-center"><Layers className="w-3 h-3 mr-1"/> 連號發生率</div>
                                    <div className="text-2xl font-black text-orange-700">{stats.zoneA.consecutiveRate}%</div>
                                    <div className="text-[10px] text-orange-300">{stats.zoneA.drawsWithConsecutive} 次發生</div>
                                </div>
                             </div>
                        </div>

                        {/* Zone A Hot/Cold */}
                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">第一區 (1-38) 冷熱門</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="text-xs text-red-500 font-bold mb-2 flex items-center"><span className="mr-1">🔥</span> 最熱門 (Top 5)</div>
                                    <div className="flex gap-2 justify-between items-end">
                                        {stats.zoneA.hot.map((item, i) => (
                                            <div key={i} className="flex flex-col items-center">
                                                <div className="w-8 h-8 rounded-full bg-white text-red-600 shadow-sm flex items-center justify-center text-sm font-bold border border-red-100">{item.num}</div>
                                                <div className="text-[10px] text-slate-400 mt-1">{item.count}次</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="text-xs text-blue-500 font-bold mb-2 flex items-center"><span className="mr-1">🧊</span> 最冷門 (Bottom 5)</div>
                                    <div className="flex gap-2 justify-between items-end">
                                        {stats.zoneA.cold.map((item, i) => (
                                            <div key={i} className="flex flex-col items-center">
                                                <div className="w-8 h-8 rounded-full bg-white text-blue-600 shadow-sm flex items-center justify-center text-sm font-bold border border-blue-100">{item.num}</div>
                                                <div className="text-[10px] text-slate-400 mt-1">{item.count}次</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Zone B Stats */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">第二區 (1-8) 冷熱門</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="text-xs text-red-500 font-bold mb-2">🔥 熱門</div>
                                    <div className="flex gap-2">
                                        {stats.zoneB.hot.map((item, i) => (
                                            <div key={i} className="flex flex-col items-center mr-2">
                                                <div className="w-8 h-8 rounded-full bg-white text-red-600 shadow-sm flex items-center justify-center text-sm font-bold border border-red-100">{item.num}</div>
                                                <div className="text-[10px] text-slate-400 mt-1">{item.count}次</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="text-xs text-blue-500 font-bold mb-2">🧊 冷門</div>
                                    <div className="flex gap-2">
                                        {stats.zoneB.cold.map((item, i) => (
                                            <div key={i} className="flex flex-col items-center mr-2">
                                                <div className="w-8 h-8 rounded-full bg-white text-blue-600 shadow-sm flex items-center justify-center text-sm font-bold border border-blue-100">{item.num}</div>
                                                <div className="text-[10px] text-slate-400 mt-1">{item.count}次</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* History Section */}
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-bold text-slate-700 flex items-center">
              <History className="w-5 h-5 mr-2 text-slate-400" />
              生成紀錄
            </h3>
            <div className="flex gap-2">
                {history.length > 0 && (
                <>
                    <button
                        onClick={downloadCSV}
                        className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200"
                        title="下載 CSV 檔案"
                    >
                        <Download className="w-3.5 h-3.5 mr-1" /> 匯出 CSV
                    </button>
                    <button
                        onClick={clearHistory}
                        className="text-xs text-red-500 hover:text-red-600 flex items-center px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> 清空
                    </button>
                </>
                )}
            </div>
          </div>

          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
                <p className="text-slate-400 text-sm">尚未生成任何號碼</p>
              </div>
            ) : (
              history.map((draw) => {
                // 計算當前組的總和與平均值
                const sumA = draw.zoneA.reduce((a, b) => a + b, 0);
                const avgA = (sumA / 6).toFixed(1);

                return (
                    <div key={draw.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:shadow-md">
                    <div className="flex-1 w-full sm:w-auto">
                        <div className="text-xs text-slate-400 mb-2 font-mono flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2"></span>
                            {draw.timestamp}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                        <div className="flex gap-1.5">
                            {draw.zoneA.map((n, i) => (
                            <span key={i} className="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold">
                                {n}
                            </span>
                            ))}
                        </div>
                        <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>
                        <span className="w-7 h-7 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-sm font-bold">
                            {draw.zoneB}
                        </span>
                        </div>

                        {/* 單組統計數據 (總和/平均) */}
                        <div className="text-[10px] sm:text-xs text-slate-400 font-mono flex items-center gap-3 bg-slate-50 px-2 py-1 rounded-md w-fit">
                            <span className="flex items-center" title="第一區總和">
                                <Sigma className="w-3 h-3 mr-1 text-slate-500" />
                                總和: <span className="text-slate-600 font-bold ml-1">{sumA}</span>
                            </span>
                            <span className="w-px h-3 bg-slate-300"></span>
                            <span className="flex items-center" title="第一區平均值">
                                <Calculator className="w-3 h-3 mr-1 text-slate-500" />
                                平均: <span className="text-slate-600 font-bold ml-1">{avgA}</span>
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => copyToClipboard(draw)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors ml-auto sm:ml-0"
                        title="複製號碼"
                    >
                        {copySuccess === draw.id ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                        <Copy className="w-5 h-5" />
                        )}
                    </button>
                    </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer / Disclaimer */}
        <footer className="mt-12 text-center text-xs text-slate-400 pb-8 px-4">
          <div className="flex items-center justify-center mb-2">
            <Info className="w-4 h-4 mr-1" />
            <span>演算法說明</span>
          </div>
          <p className="max-w-md mx-auto leading-relaxed">
            本工具使用瀏覽器內建 <code className="bg-slate-100 px-1 rounded text-slate-600">crypto.getRandomValues()</code> 產生真隨機數，
            配合 Fisher-Yates 洗牌算法，確保每次抽取均為獨立事件。
            <br className="my-2"/>
            <span className="text-red-400">僅供娛樂與統計參考，不保證中獎。請理性投注。</span>
          </p>
        </footer>

      </div>

      <style>{`
        @keyframes shine {
          100% {
            left: 125%;
          }
        }
        .animate-shine {
          animation: shine 1s;
        }
      `}</style>
    </div>
  );
};

export default PowerLotteryApp;
