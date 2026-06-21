import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';

/**
 * 解析 CSV → 計算第一區 (1-38) 與第二區 (1-8) 的趨勢指標
 *
 * 熱門度 (hotness)：最近 N 期各號碼出現次數，正規化至 0-100
 * 遺漏值 (gap)：距離上次出現已過多少期（0 = 本期出現）
 *
 * 設計紅線：不得出現「中獎機率」字眼；
 * 所有指標僅反映歷史統計，不預測未來。
 */

// 使用 BASE_URL 動態適應子路徑部署（GitHub Pages 為 /lottery-app/）
const CSV_URL = `${import.meta.env.BASE_URL}data/lottery_history.csv`;
const RECENT_WINDOW = 30; // 熱門度計算視窗（期數）

function computeTrends(draws) {
  const total = draws.length;
  if (total === 0) return null;

  // draws 已按從舊到新排列；用反向索引計算遺漏值
  // 最新一期 = draws[total-1]

  // --- 第一區 ---
  const hotnessA = {};
  const gapA = {};
  for (let n = 1; n <= 38; n++) {
    hotnessA[n] = 0;
    gapA[n] = total; // 預設：從未出現過
  }

  // 計算熱門度（最近 RECENT_WINDOW 期）
  const windowDraws = draws.slice(-RECENT_WINDOW);
  windowDraws.forEach(d => {
    d.zoneA.forEach(n => { hotnessA[n]++; });
  });

  // 計算遺漏值（從最新一期往回數）
  const reversedDraws = [...draws].reverse();
  for (let n = 1; n <= 38; n++) {
    const idx = reversedDraws.findIndex(d => d.zoneA.includes(n));
    gapA[n] = idx === -1 ? total : idx;
  }

  const maxHotnessA = Math.max(...Object.values(hotnessA), 1);

  // --- 第二區 ---
  const hotnessB = {};
  const gapB = {};
  for (let n = 1; n <= 8; n++) {
    hotnessB[n] = 0;
    gapB[n] = total;
  }
  windowDraws.forEach(d => { hotnessB[d.special]++; });
  for (let n = 1; n <= 8; n++) {
    const idx = reversedDraws.findIndex(d => d.special === n);
    gapB[n] = idx === -1 ? total : idx;
  }
  const maxHotnessB = Math.max(...Object.values(hotnessB), 1);

  return {
    zoneA: Object.fromEntries(
      Object.entries(hotnessA).map(([n, h]) => [
        n,
        {
          hotness: Math.round((h / maxHotnessA) * 100),
          gap: gapA[n],
          count: h,
        },
      ])
    ),
    zoneB: Object.fromEntries(
      Object.entries(hotnessB).map(([n, h]) => [
        n,
        {
          hotness: Math.round((h / maxHotnessB) * 100),
          gap: gapB[n],
          count: h,
        },
      ])
    ),
    totalDraws: total,
    window: Math.min(RECENT_WINDOW, total),
    latestDraw: draws[total - 1],
  };
}

export function useLotteryTrends() {
  const [rawDraws, setRawDraws] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | offline

  useEffect(() => {
    setStatus('loading');
    fetch(CSV_URL)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(text => {
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        const draws = result.data
          .map(row => ({
            drawId: row.Draw_ID,
            date: row.Date || null, // 舊版 CSV 無此欄位
            zoneA: [row.N1, row.N2, row.N3, row.N4, row.N5, row.N6].map(Number),
            special: Number(row.Special),
          }))
          .filter(d => d.zoneA.every(n => n >= 1 && n <= 38) && d.special >= 1 && d.special <= 8);
        setRawDraws(draws);
        setStatus('ready');
      })
      .catch(() => setStatus('offline'));
  }, []);

  const trends = useMemo(() => computeTrends(rawDraws), [rawDraws]);

  return { trends, status };
}
