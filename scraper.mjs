/**
 * 台灣威力彩歷史資料爬蟲
 * 資料來源：台灣彩券官方 API
 *   https://api.taiwanlottery.com/TLCAPIWeB/Lottery/SuperLotto638Result
 *
 * drawNumberSize 欄位：[N1, N2, N3, N4, N5, N6, Special]
 *   前 6 個 = 第一區 (1-38)，最後 1 個 = 第二區 (1-8)
 */
import { writeFileSync, renameSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';

const API = 'https://api.taiwanlottery.com/TLCAPIWeB/Lottery/SuperLotto638Result';
const OUTPUT = 'public/data/lottery_history.csv';
const TARGET_COUNT = 100; // 目標期數

const HEADERS_HTTP = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'zh-TW,zh;q=0.9',
  'Origin': 'https://www.taiwanlottery.com',
  'Referer': 'https://www.taiwanlottery.com/lotto/result/super_lotto638',
};

// 產生從 startYear-startMonth 到 endYear-endMonth 的月份清單
function monthRange(startYear, startMonth, endYear, endMonth) {
  const months = [];
  let y = startYear, m = startMonth;
  while (y < endYear || (y === endYear && m <= endMonth)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

async function fetchMonth(month) {
  const params = new URLSearchParams({ pageNum: '1', pageSize: '200', month, endMonth: month });
  const url = `${API}?${params}`;
  const res = await fetch(url, { headers: HEADERS_HTTP, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json?.content?.superLotto638Res || [];
}

async function main() {
  console.log('[scraper] 開始抓取台灣彩券官方威力彩資料...');
  console.log(`[scraper] 來源：${API}\n`);

  // 今天是 2026-05，往前抓 15 個月確保取得 >= 100 期
  const today = new Date();
  const endYear = today.getFullYear();
  const endMonth = today.getMonth() + 1;
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - 14);
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth() + 1;

  const months = monthRange(startYear, startMonth, endYear, endMonth);
  console.log(`[scraper] 查詢範圍：${months[0]} ~ ${months[months.length - 1]}（共 ${months.length} 個月）\n`);

  const allDraws = [];
  for (const month of months) {
    try {
      const draws = await fetchMonth(month);
      console.log(`  ${month}: ${draws.length} 期`);
      allDraws.push(...draws);
    } catch (e) {
      console.log(`  ${month}: 失敗 (${e.message})`);
    }
    // 避免打太快
    await new Promise(r => setTimeout(r, 200));
  }

  // 依期別排序（從舊到新），去重
  const seen = new Set();
  const unique = allDraws
    .filter(d => { if (seen.has(d.period)) return false; seen.add(d.period); return true; })
    .sort((a, b) => a.period - b.period);

  // 只保留最近 TARGET_COUNT 期
  const final = unique.slice(-TARGET_COUNT);
  console.log(`\n[scraper] 共取得 ${unique.length} 期，保留最近 ${final.length} 期`);

  // 驗證資料格式
  const valid = final.filter(d => {
    const nums = d.drawNumberSize;
    return Array.isArray(nums) && nums.length === 7 &&
      nums.slice(0, 6).every(n => n >= 1 && n <= 38) &&
      nums[6] >= 1 && nums[6] <= 8;
  });
  console.log(`[scraper] 格式驗證通過：${valid.length} 期`);

  if (valid.length === 0) {
    console.error('[scraper] 沒有有效資料，終止。');
    process.exit(1);
  }

  // 輸出 CSV（先寫暫存檔再取代，避免 Windows 檔案鎖定問題）
  mkdirSync('public/data', { recursive: true });
  const csvHeaders = 'Draw_ID,Date,N1,N2,N3,N4,N5,N6,Special\n';
  const csvRows = valid.map(d => {
    const [n1, n2, n3, n4, n5, n6, sp] = d.drawNumberSize;
    const date = d.lotteryDate.split('T')[0];
    return `${d.period},${date},${n1},${n2},${n3},${n4},${n5},${n6},${sp}`;
  }).join('\n');

  const csvContent = csvHeaders + csvRows;
  const TMP = OUTPUT + '.tmp';

  // 先寫暫存檔（不影響現有 CSV）
  writeFileSync(TMP, csvContent, 'utf-8');

  // 嘗試標準取代；若 EBUSY（Windows 檔案鎖定），改用 cmd move /y 強制覆蓋
  try {
    if (existsSync(OUTPUT)) unlinkSync(OUTPUT);
    renameSync(TMP, OUTPUT);
  } catch (e) {
    if (e.code === 'EBUSY') {
      console.log('[scraper] 檔案被鎖定，改用 cmd move /y 強制覆蓋...');
      execSync(`cmd /c move /y "${TMP.replace(/\//g, '\\')}" "${OUTPUT.replace(/\//g, '\\')}"`);
    } else {
      throw e;
    }
  }
  console.log(`\n[done] 已寫入 ${OUTPUT}（${valid.length} 筆）`);

  // 預覽最新 5 筆
  console.log('\n最新 5 筆開獎紀錄：');
  console.log('Draw_ID\tN1\tN2\tN3\tN4\tN5\tN6\tSpecial');
  valid.slice(-5).reverse().forEach(d => {
    const [n1, n2, n3, n4, n5, n6, sp] = d.drawNumberSize;
    const date = d.lotteryDate.split('T')[0];
    console.log(`${d.period} (${date})\t${n1}\t${n2}\t${n3}\t${n4}\t${n5}\t${n6}\t${sp}`);
  });
}

main().catch(e => {
  console.error('[fatal]', e.message);
  process.exit(1);
});
