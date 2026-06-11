// ==========================================
// 1. 定数データ定義
// ==========================================
const KAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const SHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const KANTO_LIST = [
    '甲子','乙丑','丙寅','丁卯','戊辰','己巳','庚午','辛未','壬申','癸酉',
    '甲戌','乙亥','丙子','丁丑','戊寅','己卯','庚辰','辛巳','壬午','癸未',
    '甲申','乙酉','丙戌','丁亥','戊子','己丑','庚寅','辛卯','壬辰','癸巳',
    '甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑','壬寅','癸卯',
    '甲辰','乙巳','丙午','丁未','戊申','己酉','庚戌','辛亥','壬子','癸丑',
    '甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬戌','癸亥'
];

// 蔵干の全マッピングデータ（複数対応版）
const ZOUKAN_ALL_MAP = {
    '子': ['癸'], '丑': ['癸','辛','己'], '寅': ['戊','丙','甲'], '卯': ['乙'],
    '辰': ['乙','癸','戊'], '巳': ['庚','丙'], '午': ['己','丁'], '未': ['乙','丁','己'],
    '申': ['戊','壬','庚'], '酉': ['辛'], '戌': ['辛','丁','戊'], '亥': ['甲','壬']
};

// ==========================================
// 2. 補助計算関数
// ==========================================
function calcTenchusatsu(index) {
    const group = Math.floor(index / 10);
    if (group === 0) return "戌亥";
    if (group === 1) return "申酉";
    if (group === 2) return "午未";
    if (group === 3) return "辰巳";
    if (group === 4) return "寅卯";
    return "子丑";
}

function getZoukanByDay(shi, day) {
    // 節入り日からの経過日数（day）に基づいた正確なルール
    const rules = {
        '寅': (day <= 7) ? '戊' : (day <= 14) ? '丙' : '甲',
        '卯': '乙',
        '辰': (day <= 9) ? '乙' : (day <= 12) ? '癸' : '戊',
        '巳': (day <= 5) ? '戊' : (day <= 14) ? '庚' : '丙',
        '午': (day <= 19) ? '己' : '丁',
        '未': (day <= 9) ? '丁' : (day <= 12) ? '乙' : '己',
        '申': (day <= 10) ? '戊' : (day <= 13) ? '壬' : '庚',
        '酉': '辛',
        '戌': (day <= 9) ? '辛' : (day <= 12) ? '丁' : '戊',
        '亥': (day <= 12) ? '甲' : '壬',
        '子': '癸',
        '丑': (day <= 9) ? '癸' : (day <= 12) ? '辛' : '己'
    };
    
    return rules[shi] || '甲';
}

function calcMiKyoMiJakuFull(nikkan, nenshi, gesshi, nishi, stars) {
    // --- 1. 星の分類とカウント ---
    const specialStars = ["天禄星", "天南星", "天将星"];
    const weakStars = ["天報星", "天印星", "天庫星"]; // 身弱の星の定義例
    
    const strongStarCount = stars.filter(star => specialStars.includes(star)).length;
    const weakStarCount = stars.filter(star => weakStars.includes(star)).length;

    // --- 2. 優先判定ロジック ---
    // 最身強判定
    if (strongStarCount >= 2) return "最身強";
    
    // 最身弱判定（全てが身弱の星の場合）
    // stars.length は通常3ですが、万が一のために全星数と比較
    if (weakStarCount === stars.length) return "最身弱";

    // --- 3. 従来のスコア計算 ---
    const scoreMap = {
        '甲': {'寅':3, '卯':3, '亥':2, '辰':1, '未':1, '子':1},
        // ... (以下略)
    };
    
    let score = 0;
    if (scoreMap[nikkan]) {
        score += (scoreMap[nikkan][gesshi] || 0) * 2;
        score += (scoreMap[nikkan][nishi] || 0);
        score += (scoreMap[nikkan][nenshi] || 0);
    }

    // --- 4. スコアと星の組み合わせ判定 ---
    // 身弱が2つ以上ある場合の判定を追加
    if (weakStarCount >= 2) return "身弱";
    
    if (score >= 7) return "身強";
    if (score >= 4) return "身中";
    return "身弱";
}

function renderDaiunTable(startAge, baseEto, isForward, nikkan) {
    const tableBody = document.getElementById('daiun-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    let currentIndex = KANTO_LIST.indexOf(baseEto);
    for (let i = 0; i < 10; i++) {
        const ageRange = `${startAge + (i * 10)}歳〜${startAge + (i * 10) + 9}歳`;
        const eto = KANTO_LIST[currentIndex];
        
        const findJudai = (target) => window.JUDAI_IMAGE_TABLE?.find(r => r[nikkan] === target)?.star || "--";
        const findJuni = (target) => window.JUNI_IMAGE_TABLE?.find(r => r[nikkan] === target)?.star || "--";
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${ageRange}</td>
            <td style="font-size:22px; font-weight:bold;">${eto}</td>
            <td>${findJudai(eto[0])}</td>
            <td>${findJuni(eto[1])}</td>
        `;
        tableBody.appendChild(row);
        currentIndex = (currentIndex + (isForward ? 1 : -1) + 60) % 60;
    }
}

// ==========================================
// 3. メイン計算ロジック（中央揃え・複数蔵干出力版）
// ==========================================
function performCalculation() {
    const y = parseInt(document.getElementById('year-input').value, 10);
    const m = parseInt(document.getElementById('month-input').value, 10);
    const d = parseInt(document.getElementById('day-input').value, 10);

    const targetDate = new Date(y, m - 1, d, 12, 0, 0);
    const baseDate = new Date(2026, 5, 2, 12, 0, 0);
    const diffDays = Math.round((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let dayIndex = (diffDays + 43) % 60;
    if (dayIndex < 0) dayIndex += 60;
    const dayEto = KANTO_LIST[dayIndex];

    document.getElementById('tenchusatsu-text').innerText = calcTenchusatsu(dayIndex);

    const setsuiriDays = (window.SETSUIRI_DATA && window.SETSUIRI_DATA[y]) ? window.SETSUIRI_DATA[y] : [5,4,5,5,5,6,7,7,8,8,7,7];
    const currentSetsuiri = setsuiriDays[m - 1];

    let sanmeiMonth = (d < setsuiriDays[m-1]) ? ((m === 1) ? 12 : m - 1) : m;
    let sanmeiYear = (m === 1 || (m === 2 && d < setsuiriDays[1])) ? y - 1 : y;

    const yOff = (sanmeiYear - 4) % 60;
    const trueYearEto = KAN[yOff % 10] + SHI[yOff % 12];
    const mOff = (((sanmeiYear - 4) % 10 % 5) * 2 + 2 + (sanmeiMonth + 10) % 12) % 10;
    const mShi = (2 + (sanmeiMonth + 10) % 12) % 12;
    const trueMonthEto = KAN[mOff] + SHI[mShi];

    document.getElementById('day-eto').innerText = dayEto;
    document.getElementById('month-eto').innerText = trueMonthEto;
    document.getElementById('year-eto').innerText = trueYearEto;
    
    // 年干天中
    const yearIndex = KANTO_LIST.indexOf(trueYearEto);
    if (yearIndex !== -1) document.getElementById('nenkan-tenchu-text').innerText = calcTenchusatsu(yearIndex);

    // 基礎データの抽出
    const nikkan = dayEto[0], nishi = dayEto[1];
    const gesshi = trueMonthEto[1], nenshi = trueYearEto[1];
    const nenkan = trueYearEto[0], gekkan = trueMonthEto[0];

    // --- 【修正】蔵干計算のための正確な経過日数(dayDiff)の算出 ---
    let baseSetsuiriYear = y;
    let baseSetsuiriMonth = m;
    
    // もし誕生日がその月の節入り日より前なら、前月の節入り日を基準にする
    if (d < currentSetsuiri) {
        baseSetsuiriMonth = m - 1;
        if (baseSetsuiriMonth === 0) {
            baseSetsuiriMonth = 12;
            baseSetsuiriYear = y - 1;
        }
    }
    
    const baseSetsuiriDays = (window.SETSUIRI_DATA && window.SETSUIRI_DATA[baseSetsuiriYear]) 
        ? window.SETSUIRI_DATA[baseSetsuiriYear] 
        : [5,4,5,5,5,6,7,7,8,8,7,7];
    const baseSetsuiriDay = baseSetsuiriDays[baseSetsuiriMonth - 1];
    
    // 正確な日付オブジェクトを作って引き算（これでマイナスを完全に防ぎます）
    const baseSetsuiriDate = new Date(baseSetsuiriYear, baseSetsuiriMonth - 1, baseSetsuiriDay, 12, 0, 0);
    const birthDate = new Date(y, m - 1, d, 12, 0, 0);
    const dayDiff = Math.round((birthDate.getTime() - baseSetsuiriDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // 各柱の蔵干の割り出し（右手・左手・中央すべてを経過日数 dayDiff で変化させる）
    const bValue = getZoukanByDay(nishi, dayDiff); // 右手
    const fValue = getZoukanByDay(nenshi, dayDiff); // 左手
    const iValue = getZoukanByDay(gesshi, dayDiff); // 中央
    // ----------------------------------------------------

    const findJuni = (target) => window.JUNI_IMAGE_TABLE?.find(r => r[nikkan] === target)?.star || "--";
    const findJudai = (target) => window.JUDAI_IMAGE_TABLE?.find(r => r[nikkan] === target)?.star || "--";


// --- 修正後 ---
// 星のリスト（例: [星1, 星2, 星3]）を定義している変数が既にあるはずです。
// それを fifth 引数として渡します。
const myStars = [findJuni(nenshi), findJuni(gesshi), findJuni(nishi)]; // ※お使いの変数名に合わせて調整してください

// --- 修正案: 確実に表示させるための出力処理 ---
const map = {
    'pos-a': calcMiKyoMiJakuFull(nikkan, nenshi, gesshi, nishi, myStars), // myStarsを忘れずに
    'pos-h': findJudai(nenkan), 
    'pos-g': findJuni(nenshi),
    'pos-b': findJudai(bValue), 
    'pos-c': findJuni(nishi),
    'pos-d': findJudai(gekkan), 
    'pos-e': findJuni(gesshi),
    'pos-f': findJudai(fValue), 
    'pos-i': findJudai(iValue)
};

for (const [id, val] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) { 
        el.innerText = val; 
        // スタイルを上書きして見出しにならないようにする
        el.style.fontSize = "18px";
        el.style.fontWeight = "normal"; // 見出しにならないよう太字を解除
        el.style.whiteSpace = "nowrap";
        el.style.display = "inline-block"; // 要素として正しく表示
    }
}

    // 蔵干表示
    document.getElementById('day-zoukan').innerHTML = (ZOUKAN_ALL_MAP[nishi] || []).join('<br>');
    document.getElementById('month-zoukan').innerHTML = (ZOUKAN_ALL_MAP[gesshi] || []).join('<br>');
    document.getElementById('year-zoukan').innerHTML = (ZOUKAN_ALL_MAP[nenshi] || []).join('<br>');

    // 守護神判定ロジック
const shugoshinArea = document.getElementById('shugoshin-result');
const shugoshinContent = document.getElementById('shugoshin-content');
const shugoInfo = window.SHUGOSHIN_MASTER?.[nikkan]?.[gesshi];

if (shugoshinArea && shugoshinContent && shugoInfo) {
    const allCandidates = [nenkan, gekkan, nikkan, ...ZOUKAN_ALL_MAP[nenshi], ...ZOUKAN_ALL_MAP[gesshi], ...ZOUKAN_ALL_MAP[nishi]];
    
    const evaluate = (target) => {
        if (!target) return { match: false };
        const gogyoMap = { '木':'甲乙寅卯', '火':'丙丁午巳', '土':'戊己辰戌丑未', '金':'庚辛申酉', '水':'壬癸亥子' };
        const getG = (c) => { for(let k in gogyoMap) if(gogyoMap[k].includes(c)) return k; return null; };
        
        // 1. 完全一致
        if (allCandidates.includes(target)) return { match: true, type: 'direct', found: target };
        
        // 2. 五行一致（同じ五行を持つ命式内の干を探す）
        const targetG = (['木','火','土','金','水'].includes(target)) ? target : getG(target);
        const found = allCandidates.find(c => getG(c) === targetG);
        if (targetG && found) return { match: true, type: 'gogyo', found: found };
        
        return { match: false };
    };

    const formatShugoList = (list) => list.filter(Boolean).map((c, i) => `${c}(第${i+1})`).join('、');
    
    const check = (list, isShugo, rankOffset) => list.filter(Boolean).map((c, idx) => {
        const res = evaluate(c);
        if (!res.match) return null;
        
        // 実際に命式内にあった干(res.found)を表示に使用する
        const displayGod = res.found; 
        const isDiff = (c !== res.found); // 本来と違う干が見つかったか
        
        return `${displayGod}(第${idx + 1 + rankOffset})${(isShugo && isDiff) ? '※' : ''}`;
    }).filter(Boolean);

    // ※rankOffsetを追加して「第1」「第2」が通し番号になるように調整
    const sResults = check([shugoInfo.p1, shugoInfo.p2, shugoInfo.p3], true, 0);
    const iResults = check([shugoInfo.i1, shugoInfo.i2], false, 0);

    shugoshinContent.innerHTML = `
        <div style="font-size: 20px;">
        守護神：${formatShugoList([shugoInfo.p1, shugoInfo.p2, shugoInfo.p3])}<br>
        忌神：${formatShugoList([shugoInfo.i1, shugoInfo.i2])}
        <hr style="width: 80%; margin: 10px auto 10px 0; border: 0; border-top: 1px solid #ccc;">
        命式内守護神：${sResults.length > 0 ? sResults.join('、') : 'なし'}<br>
        命式内忌神：${iResults.length > 0 ? iResults.join('、') : 'なし'}
        </div>`;
    shugoshinArea.style.display = 'block';
}

    // 大運計算
    const isMale = document.getElementById('male')?.checked || false;
    
    // 【修正】元の正しい判定（=== 0）に戻しました
    const isForward = (isMale === (yearIndex % 2 === 0));

    // 変数名の競合を防ぐため daiunBirthDate に変更
    const daiunBirthDate = new Date(y, m - 1, d, 12, 0, 0);
    let targetSetsuiriDate;

    if (isForward) {
        // 順行：次の節入り日までの日数を数える
        if (d < currentSetsuiri) {
            targetSetsuiriDate = new Date(y, m - 1, currentSetsuiri, 12, 0, 0);
        } else {
            let nextY = y, nextM = m;
            if (nextM === 12) { nextY += 1; nextM = 1; } else { nextM += 1; }
            const nextSetsuiriDay = setsuiriDays[(nextM - 1) % 12];
            targetSetsuiriDate = new Date(nextY, nextM - 1, nextSetsuiriDay, 12, 0, 0);
        }
    } else {
        // 逆行：前の節入り日までの日数を数える
        if (d >= currentSetsuiri) {
            targetSetsuiriDate = new Date(y, m - 1, currentSetsuiri, 12, 0, 0);
        } else {
            let prevY = y, prevM = m;
            if (prevM === 1) { prevY -= 1; prevM = 12; } else { prevM -= 1; }
            const prevSetsuiriDay = setsuiriDays[(prevM - 1) % 12];
            targetSetsuiriDate = new Date(prevY, prevM - 1, prevSetsuiriDay, 12, 0, 0);
        }
    }

    // タイムスタンプの差から日数を算出
    const diffTime = Math.abs(targetSetsuiriDate - daiunBirthDate);
    const kiunDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // 大運の年数を算出
    const daiunNen = Math.max(0, Math.round(kiunDays / 3));

    renderDaiunTable(daiunNen, KANTO_LIST[(KANTO_LIST.indexOf(trueMonthEto) + (isForward ? 1 : -1) + 60) % 60], isForward, nikkan);
    document.getElementById('result-area').style.display = 'block';
}

// ==========================================
// 4. 初期化イベント
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    document.getElementById('year-input').value = today.getFullYear();
    document.getElementById('month-input').value = today.getMonth() + 1;
    document.getElementById('day-input').value = today.getDate();
    document.getElementById('calc-btn').addEventListener('click', performCalculation);
});