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

// main.js の一番上のほうに書いてください
let sharedData = {
    y: "", m: "", d: "", comment: ""
};

function updateHistoryUI() {
    const listEl = document.getElementById('history-list');
    listEl.innerHTML = ''; 

    appHistory.forEach((data, index) => {
        const div = document.createElement('div');
        // ラジオボタンに index を持たせる
        div.innerHTML = `
            <input type="radio" name="history-radio" value="${index}" id="h${index}">
            <label for="h${index}">${data.y}年${data.m}月${data.d}日 (${data.gender === 'male' ? '男性' : '女性'})</label>
        `;
        listEl.appendChild(div);
    });
}

// main.js の一番上に配置
const isValidDate = (year, month, day) => {
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === parseInt(year) &&
           date.getMonth() === parseInt(month) - 1 &&
           date.getDate() === parseInt(day);
};

function showHistoryList() {
    console.log("過去履歴を表示します"); // 確認用
    ArchiveModule.render(); // 以前作成した関数を呼び出す
}

// --- スタイル定義 (ここでフォントサイズを一括管理できます＝歴史エリア) ---
const styles = {
    detailArea: `display: none; padding: 10px; font-size: 0.85em; background: #f9f9f9; color: #555; line-height: 1.4;`,
    deathInfo: `font-size: 0.9em; font-weight: bold; color: #333; text-align: right; border-top: 1px dashed #ccc; padding-top: 5px; margin-top: 5px;`
};

// --- 過去履歴（30件）専用の管理モジュール ---
const ArchiveModule = {
    STORAGE_KEY: 'myAppArchive', // 既存と被らない別のキー名

    // 1. 保存処理
    save: (data) => {
        let archive = JSON.parse(localStorage.getItem(ArchiveModule.STORAGE_KEY) || '[]');
        archive.unshift(data); // 先頭に追加
        if (archive.length > 30) archive = archive.slice(0, 30); // 30件制限
        localStorage.setItem(ArchiveModule.STORAGE_KEY, JSON.stringify(archive));
    },

    // 2. 表示処理
    render: () => {
        const archive = JSON.parse(localStorage.getItem(ArchiveModule.STORAGE_KEY) || '[]');
        const displayArea = document.getElementById('figure-display-area');
        
        if (archive.length === 0) {
            displayArea.innerHTML = "過去履歴はありません。";
            return;
        }

        let html = `<h4 style="margin: 10px 0;">過去の履歴（最新30件）</h4><ul style="list-style: none; padding: 0;">`;
        archive.forEach((h, index) => {
            html += `
                <li style="cursor: pointer; padding: 5px; border-bottom: 1px solid #eee;" 
                    onclick="ArchiveModule.load(${index})">
                    ${h.comment || '無題'} <small>(${h.year}/${h.month}/${h.day})</small>
                </li>`;
        });
        html += `</ul>`;
        displayArea.innerHTML = html;
    },

    // 3. 呼び出し処理
    load: (index) => {
        const archive = JSON.parse(localStorage.getItem(ArchiveModule.STORAGE_KEY) || '[]');
        const h = archive[index];
        
        document.getElementById('year-input').value = h.year;
        document.getElementById('month-input').value = h.month;
        document.getElementById('day-input').value = h.day;
        document.getElementById('comment-input').value = h.comment;
        
        // 計算実行（既存の関数を使用）
        if (typeof performCalculation === 'function') performCalculation();
    }
};

// ==========================================
// 3. 履歴管理モジュール (HistoryModule)
// ==========================================
const HistoryModule = {
    // データを保存して画面更新
    save: (date, comment) => {
        let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        history.unshift({ date, comment, timestamp: Date.now() });
        history = history.slice(0, 5);
        localStorage.setItem('searchHistory', JSON.stringify(history));
        HistoryModule.render();
    },

    render: () => {
    const list = document.getElementById('history-list');
    if (!list) return; // 最初に存在チェック

    const data = localStorage.getItem('searchHistory');
    const history = data ? JSON.parse(data) : [];

    // 変数に溜めてから、最後に一度だけ代入する
    const htmlString = history.map((h, index) => {
        const commentPart = (h.comment && h.comment.trim() !== "") ? ` - ${h.comment}` : "";
        return `
            <div class="history-item" style="display: flex; align-items: center; margin-bottom: 5px; width: 100%;">
                <input type="radio" name="history-radio" value="${index}" id="h${index}">
                <label for="h${index}" style="margin-left: 8px; flex-grow: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <strong>${h.date}</strong>
                    <span style="display: inline-block; max-width: 400px; overflow: hidden; text-overflow: ellipsis; vertical-align: bottom;">
                        ${commentPart}
                    </span>
                </label>
            </div>`;
    }).join('');

    // ここで一気に書き換える
    list.innerHTML = htmlString;
},

    // 取込処理 (ボタンから直接呼び出す)
    importSelected: () => {
        const selected = document.querySelector('input[name="history-radio"]:checked');
        if (!selected) {
            alert("履歴を選択してください");
            return;
        }

        const data = localStorage.getItem('searchHistory');
        const history = data ? JSON.parse(data) : [];
        const h = history[selected.value];

        // 日付解析
        const matches = h.date.match(/(\d+)\/(\d+)\/(\d+)/);
        if (matches) {
            document.getElementById('year-input').value = matches[1];
            document.getElementById('month-input').value = matches[2];
            document.getElementById('day-input').value = matches[3];
            
            // コメント反映
            const commentInput = document.getElementById('comment-input');
            if (commentInput) {
                commentInput.value = h.comment || "";
            }

            if (typeof performCalculation === 'function') {
                performCalculation();
            }
        }
    }
}; // ← これが唯一の締めくくりです。これより下に「initImportButton」などは置かないでください。



function setEto(elementId, etoText) {
    const container = document.getElementById(elementId);
    if (!container) return;
    
    container.innerHTML = ''; 
    for (let char of etoText) {
        let span = document.createElement('span');
        span.innerText = char;
        container.appendChild(span);
    }
}

// 2支の判定表（位相法1）
const ishou1Map = {
    "子": {"丑": "支合", "卯": "旺気刑", "午": "冲動", "未": "害", "酉": "破"},
    "丑": {"子": "支合", "辰": "破", "巳": "害", "午": "冲動・庫気刑", "戌": "庫気刑"},
    "寅": {"巳": "害・生貴刑", "申": "冲動・生貴刑", "亥": "支合"},
    "卯": {"子": "旺気刑", "辰": "害", "午": "破", "酉": "冲動", "戌": "支合"},
    "辰": {"丑": "破", "卯": "害", "辰": "自刑", "酉": "支合", "戌": "冲動"},
    "巳": {"寅": "害・生貴刑", "申": "支合・生貴刑", "亥": "冲動"},
    "午": {"子": "冲動", "丑": "害", "卯": "破", "午": "自刑", "未": "支合"},
    "未": {"子": "害", "丑": "冲動・庫気刑", "未": "支合", "亥": "庫気刑・破"},
    "申": {"寅": "冲動・生貴刑", "巳": "支合・生貴刑", "亥": "害"},
    "酉": {"子": "破", "卯": "冲動", "辰": "支合", "酉": "自刑", "戌": "害"},
    "戌": {"丑": "庫気刑", "卯": "支合", "辰": "冲動", "未": "庫気刑・破", "酉": "害"},
    "亥": {"寅": "支合", "巳": "冲動", "申": "害", "亥": "自刑"}
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
    const strongStars = ["天禄", "天南", "天将", "天禄星", "天南星", "天将星"];
    const weakStars = ["天報", "天印", "天極", "天馳", "天胡", "天報星", "天印星", "天庫星"];
    
    // stars は主星（3つ）の配列である前提
    const strongStarCount = stars.filter(s => strongStars.includes(s)).length;
    const weakStarCount = stars.filter(s => weakStars.includes(s)).length;

    // --- 2. 優先判定ロジック ---
    // 1. 身強判定（身強星が1つ以上あれば身強、2つ以上で最身強）
    if (strongStarCount >= 2) return "最身強";
    if (strongStarCount >= 1) return "身強";
    
    // 2. 身弱判定（身強星が0個であることが前提）
    // 全てが身弱の星ならば最身弱
    if (weakStarCount === stars.length) return "最身弱";
    // 身弱の星が2つ以上あれば身弱
    if (weakStarCount >= 2) return "身弱";

    // --- 3. 従来のスコア計算（優先判定に該当しなかった場合） ---
    const scoreMap = {
        '甲': {'寅':3, '卯':3, '亥':2, '辰':1, '未':1, '子':1},
        '乙': {'卯':3, '寅':3, '亥':2, '未':1, '辰':1, '子':1},
        '丙': {'巳':3, '午':3, '寅':2, '戌':1, '未':1, '卯':1},
        '丁': {'午':3, '巳':3, '寅':2, '未':1, '戌':1, '卯':1},
        '戊': {'辰':3, '戌':3, '丑':3, '未':3, '巳':2, '午':2},
        '己': {'丑':3, '未':3, '辰':3, '戌':3, '巳':2, '午':2},
        '庚': {'申':3, '酉':3, '巳':2, '丑':1, '辰':1, '戌':1},
        '辛': {'酉':3, '申':3, '巳':2, '丑':1, '辰':1, '戌':1},
        '壬': {'亥':3, '子':3, '申':2, '辰':1, '丑':1, '酉':1},
        '癸': {'子':3, '亥':3, '申':2, '辰':1, '丑':1, '酉':1}
    };
    
    let score = 0;
    if (scoreMap[nikkan]) {
        score += (scoreMap[nikkan][gesshi] || 0) * 2;
        score += (scoreMap[nikkan][nishi] || 0);
        score += (scoreMap[nikkan][nenshi] || 0);
    }

    // --- 4. スコアによる最終判定 ---
    if (score >= 7) return "身強";
    if (score >= 4) return "身中";
    return "身弱";
}

function renderDaiunTable(startAge, baseEto, isForward, nikkan, currentAge) {
    const tableBody = document.getElementById('daiun-table-body');
    if (!tableBody) return;

    // 1. 変数を用意して空文字で初期化
    let newRows = '';
    let currentIndex = KANTO_LIST.indexOf(baseEto);

    // 2. ループ処理（ここで1回だけ回す）
    for (let i = 0; i < 10; i++) {
        const rowStart = startAge + (i * 10);
        const rowEnd = rowStart + 9;
        const ageRange = `${rowStart}歳〜${rowEnd}歳`;
        const eto = KANTO_LIST[currentIndex];
        
        // --- 判定ロジック ---
        const isCurrent = (currentAge >= rowStart && currentAge <= rowEnd);
        const findJudai = (target) => window.JUDAI_IMAGE_TABLE?.find(r => r[nikkan] === target)?.star || "--";
        const findJuni = (target) => window.JUNI_IMAGE_TABLE?.find(r => r[nikkan] === target)?.star || "--";
        
        // クラスの判定
        const rowClass = isCurrent ? 'current-age-row' : '';
        
        // 3. 文字列として変数に追加
        newRows += `
            <tr class="${rowClass}">
                <td>${ageRange}</td>
                <td style="font-size:22px; font-weight:bold;">${eto}</td>
                <td style="font-size:18px;">${findJudai(eto[0])}</td>
                <td style="font-size:18px;">${findJuni(eto[1])}</td>
            </tr>`;
        
        currentIndex = (currentIndex + (isForward ? 1 : -1) + 60) % 60;
    }
    
    // 4. ループが終わった後に、一回だけ代入する
    tableBody.innerHTML = newRows;
}
// ==========================================
// 3. メイン計算ロジック（中央揃え・複数蔵干出力版）
// ==========================================
function performCalculation() {
    const y = parseInt(document.getElementById('year-input').value, 10);
    const m = parseInt(document.getElementById('month-input').value, 10);
    const d = parseInt(document.getElementById('day-input').value, 10);
    const commentInput = document.getElementById('comment-input').value;

    if (!isValidDate(y, m, d)) {
        alert("存在しない日付です。正しい日付を入力してください。");
        return; // 計算処理を中断
    }
    
    const targetDate = new Date(y, m - 1, d, 12, 0, 0);
    const baseDate = new Date(2026, 5, 2, 12, 0, 0);
    const diffDays = Math.round((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let dayIndex = (diffDays + 43) % 60;
    if (dayIndex < 0) dayIndex += 60;
    const dayEto = KANTO_LIST[dayIndex];

    // --- 年齢計算の修正版 ---
    const today = new Date(); // これだけで「今日の日付」が自動取得されます
    let age = today.getFullYear() - y;
    const mDiff = (today.getMonth() + 1) - m;
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < d)) {
        age--;
    }
    
   
    // 1. まず節入り日のリストと、現在の月の節入り日を取得
    const setsuiriDays = (window.SETSUIRI_DATA && window.SETSUIRI_DATA[y]) ? window.SETSUIRI_DATA[y] : [5,4,5,5,5,6,7,7,8,8,7,7];
    const currentSetsuiri = setsuiriDays[m - 1]; // ここで定義！

    // 2. 定義した currentSetsuiri を使って判定する
    let sanmeiMonth = (d < currentSetsuiri) ? ((m === 1) ? 12 : m - 1) : m;
    let sanmeiYear = (m === 1 || (m === 2 && d < currentSetsuiri)) ? y - 1 : y;
    const yOff = (sanmeiYear - 4) % 60;
    const trueYearEto = KAN[yOff % 10] + SHI[yOff % 12];
    const mOff = (((sanmeiYear - 4) % 10 % 5) * 2 + 2 + (sanmeiMonth + 10) % 12) % 10;
    const mShi = (2 + (sanmeiMonth + 10) % 12) % 12;
    const trueMonthEto = KAN[mOff] + SHI[mShi];

        // 年干天中の計算
    const yearIndex = KANTO_LIST.indexOf(trueYearEto);
    const nenkanTenchuText = (yearIndex !== -1) ? calcTenchusatsu(yearIndex) : "--";

    // --- ここで全ての表示をまとめて更新 ---
    setEto('day-eto', dayEto);
    setEto('month-eto', trueMonthEto);
    setEto('year-eto', trueYearEto);
    setEto('tenchusatsu-text', calcTenchusatsu(dayIndex));
    setEto('nenkan-tenchu-text', nenkanTenchuText);
    
    // 基礎データの抽出は表示更新の後に行う
    const nikkan = dayEto[0], nishi = dayEto[1];
    const gesshi = trueMonthEto[1], nenshi = trueYearEto[1];
    const nenkan = trueYearEto[0], gekkan = trueMonthEto[0];

    // --- 【修正】蔵干計算のための正確な経過日数(dayDiff)の算出 ---
    let baseSetsuiriYear = y;
    let baseSetsuiriMonth = m;
    
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
    
    const baseSetsuiriDate = new Date(baseSetsuiriYear, baseSetsuiriMonth - 1, baseSetsuiriDay, 12, 0, 0);
    const birthDate = new Date(y, m - 1, d, 12, 0, 0);
    const dayDiff = Math.round((birthDate.getTime() - baseSetsuiriDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const bValue = getZoukanByDay(nishi, dayDiff);
    const fValue = getZoukanByDay(nenshi, dayDiff);
    const iValue = getZoukanByDay(gesshi, dayDiff);

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
    // 年齢を画面に表示
    document.getElementById('age-display').innerText = age + "歳";

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
        
        const displayGod = res.found; 
        const isDiff = (c !== res.found); // 本来と違う干が見つかったか
        
        // 守護神は干(displayGod)、忌神は元の文字(c)を表示
        const text = isShugo ? displayGod : c;
        return `${text}${(isShugo && isDiff) ? '※' : ''}`;
    }).filter(Boolean);

    // 呼び出し
    // 1. 守護神・忌神の計算
    const sResults = check([shugoInfo.p1, shugoInfo.p2, shugoInfo.p3], true, 0);
    const iResults = check([shugoInfo.i1, shugoInfo.i2], false, 0);

    // --- 中殺・干合の計算 ---
    const chusatsuData = getKanseiData(trueYearEto, trueMonthEto, dayEto);
    
    // --- 干合の判定 ---
    let kangoMsgs = [];
    
    // 年・月干合の場合
    const ngKango = getKangoInfo(nenkan, gekkan);
    if (ngKango) {
        // 月干が変化すると想定して「（月）」と表示
        kangoMsgs.push(`${ngKango.pairName}（月）`);
    }

    // 月・日干合の場合
    const gnKango = getKangoInfo(gekkan, nikkan);
    if (gnKango) {
        // 月干または日干が変化すると想定して「（月）」と表示
        kangoMsgs.push(`${gnKango.pairName}（月）`);
    }
    
    let msgs = [];
    if (chusatsuData.isNenChu) msgs.push("生年中殺");
    if (chusatsuData.isGetsuChu) msgs.push("生月中殺");
    if (chusatsuData.isNichiChu) msgs.push("生日中殺");
    if (chusatsuData.isNishu) msgs.push("宿命二中殺");
    if (chusatsuData.isGokan) msgs.push("互換中殺");
    if (chusatsuData.isNichiza) msgs.push("日座中殺");
    if (chusatsuData.isZen) msgs.push("全中殺");
    if (chusatsuData.ijoCount > 0) msgs.push(`異常干支(${chusatsuData.ijoCount}個)`);


// 3支の判定表（位相法2 - 三合会局・半会・方三位）
// const ishou3Map = [
//     {branch: "子", set: ["申", "辰"], type: "三合会局"},
//     {branch: "子", set: ["申", "辰"], type: "半会"}, // 簡略化のため条件は調整が必要
//     // ...必要に応じてここに3支の組み合わせデータを追加
// ];


    // 3. 表示の更新
    shugoshinContent.innerHTML = `
    <div style="font-size: 20px; font-family: '游明朝', 'Yu Mincho', serif;">
        <span style="font-family: '游明朝', 'Yu Mincho', serif;">守護神：</span>
        <span style="font-family: '游ゴシック', 'Yu Gothic', sans-serif; font-weight: 600;">${formatShugoList([shugoInfo.p1, shugoInfo.p2, shugoInfo.p3])}</span><br>
        
        <span style="font-family: '游明朝', 'Yu Mincho', serif;">忌神：</span>
        <span style="font-family: '游ゴシック', 'Yu Gothic', sans-serif; font-weight: 600;">${formatShugoList([shugoInfo.i1, shugoInfo.i2])}</span>
        
        <hr style="width: 80%; margin: 10px auto 10px 0; border: 0; border-top: 1px solid #ccc;">
        
        <span style="font-family: '游明朝', 'Yu Mincho', serif;">命式内守護神：</span>
        <span style="font-family: '游ゴシック', 'Yu Gothic', sans-serif; font-weight: 600;">${sResults.length > 0 ? sResults.join('、') : 'なし'}</span><br>
        
        <span style="font-family: '游明朝', 'Yu Mincho', serif;">命式内忌神：</span>
        <span style="font-family: '游ゴシック', 'Yu Gothic', sans-serif; font-weight: 600;">${iResults.length > 0 ? iResults.join('、') : 'なし'}</span>
        
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ccc;">
            <span style="font-family: '游明朝', 'Yu Mincho', serif;">中殺：</span>
            <span style="font-family: '游ゴシック', 'Yu Gothic', sans-serif; font-weight: 600;">${msgs.length > 0 ? msgs.join('、') : 'なし'}</span><br>
            
            <span style="font-family: '游明朝', 'Yu Mincho', serif;">干合：</span>
            <span style="font-family: '游ゴシック', 'Yu Gothic', sans-serif; font-weight: 600;">${kangoMsgs.length > 0 ? kangoMsgs.join('、') : 'なし'}</span><br>
            
            <span style="font-family: '游明朝', 'Yu Mincho', serif;">位相法：</span><br>
            <span style="font-family: '游ゴシック', 'Yu Gothic', sans-serif; font-weight: 600;">&nbsp;&nbsp;${calculateIshouhou(trueYearEto, trueMonthEto, dayEto).join('<br>&nbsp;&nbsp;')}</span>
        </div>
    </div>`;
    shugoshinArea.style.display = 'block';

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

    // --- 修正後の計算ロジック ---
    
    // 1. 日数計算（ミリ秒から整数にするため Math.floor を使用）
    const diffTime = Math.abs(targetSetsuiriDate - daiunBirthDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // 2. 流派のルールに基づき日数を確定
    // 「+ 1」は節入り日当日を含めるための調整として維持
    const kiunDays = diffDays + 1;
    
    // 3. 歳運数を算出（小数点以下を繰り上げる Math.ceil）
    const daiunNen = Math.max(0, Math.ceil(kiunDays / 3));

    console.log("計算デバッグ:", { kiunDays, daiunNen }); // コンソールで値を確認できます

    // 4. 結果の出力
    renderDaiunTable(daiunNen, KANTO_LIST[(KANTO_LIST.indexOf(trueMonthEto) + (isForward ? 1 : -1) + 60) % 60], isForward, nikkan, age);
    document.getElementById('result-area').style.display = 'block';
}
}

// --- 【新機能の統合】 ---
    // const を消して、既存の値を再利用します
    let comment = document.getElementById('comment-input').value;
    const result = document.getElementById('pos-a').innerText;
    const daiun = document.getElementById('daiun-table-body').innerText;

    // 共有ボタンのイベント設定
    document.getElementById('share-or-copy-btn').onclick = async () => {
    const result = document.getElementById('pos-a').innerText;
    // ここでさっきの sharedData を使う！
    const text = `【${sharedData.comment}】\n日時: ${sharedData.y}/${sharedData.m}/${sharedData.d}\n結果: ${result}`;
        await performCopy(fullResult, title);
    };

// 1. ボタンを表示する
const shareBtn = document.getElementById('share-or-copy-btn');
if (shareBtn) {
    shareBtn.style.display = 'inline-block';

    shareBtn.onclick = async () => {
    // 1. 必要なデータを全部この関数の中で揃える
    const y = document.getElementById('year-input').value;
    const m = document.getElementById('month-input').value;
    const d = document.getElementById('day-input').value;
    const commentVal = document.getElementById('comment-input').value || "";
    
    const result = document.getElementById('pos-a').innerText;
    const daiun = document.getElementById('daiun-table-body').innerText;
    
    // 2. コピー用のテキスト（fullResult）とタイトル（title）をここで作る
    const fullResult = `【${commentVal}】\n日時: ${y}/${m}/${d}\n結果: ${result}\n\n[大運表]\n${daiun}`;
    const title = commentVal;
    
    // 3. 完成した変数を関数に渡す
    await performCopy(fullResult, title);
};
}

// ==========================================
// 4. 初期化イベント (全てここに統合)
// ==========================================
// --- [2] 初期化処理 ---
document.addEventListener('DOMContentLoaded', () => {
    
    // 0. 初回表示
    HistoryModule.render();

    // 1. 計算ボタンのイベント設定
    const calcBtn = document.getElementById('calc-btn');
    if (calcBtn) {
        const newCalcBtn = calcBtn.cloneNode(true);
        calcBtn.parentNode.replaceChild(newCalcBtn, calcBtn);

        newCalcBtn.addEventListener('click', () => {
            performCalculation(); 

            const y = document.getElementById('year-input')?.value || "";
            const m = document.getElementById('month-input')?.value || "";
            const d = document.getElementById('day-input')?.value || "";
            const comment = document.getElementById('comment-input')?.value || "";
            const title = (comment && comment.trim() !== "") ? comment.trim() : "";

            if (y && m && d) {
                // 既存の履歴
                HistoryModule.save(`${y}/${m}/${d}`, title);
                HistoryModule.render();
                
                // 新規：過去履歴（30件）にも保存
                ArchiveModule.save({ year: y, month: m, day: d, comment: title });
            }
        });
    }

    // 2. 保存ボタン(saveBtn)の処理など...
    const saveBtn = document.getElementById('share-or-copy-btn');
    if (saveBtn) {
        saveBtn.style.display = 'block';
        saveBtn.addEventListener('click', (e) => {
            if (typeof saveResultHandler === 'function') {
                saveResultHandler(e);
            }
        });
    }
});

// --- saveResultHandler 関数はここより下（DOMContentLoadedの外）に定義してください ---
async function saveResultHandler() {
    const originalArea = document.getElementById('result-area');
    if (!originalArea) return;

    // 1. 隠しコンテナ (幅580px固定)
    const container = document.createElement('div');
    container.style.cssText = "position:absolute; left:-9999px; top:0; width:800px; background:#fcfbf9; padding:20px; display:block; box-sizing:border-box;";
    document.body.appendChild(container);

    // 2. 入力欄から直接、誕生日とコメントを取得する
    const y = document.getElementById('year-input').value;
    const m = document.getElementById('month-input').value;
    const d = document.getElementById('day-input').value;
    const comment = document.getElementById('comment-input').value;

    // 誕生日をフォーマット（例: 1988/6/3生）
    let displayTitle = `${y}/${m}/${d}生`;
    
    // コメントがある場合はタイトルに付け加える（適宜調整してください）
    if (comment && comment.trim() !== "") {
        displayTitle += ` (${comment})`;
    }
    
    // 3. データ取得
    const genderVal = document.querySelector('input[name="gender"]:checked')?.value;
    const gender = genderVal === 'male' ? '男性' : (genderVal === 'female' ? '女性' : '不明');
    const age = document.getElementById('age-display')?.innerText || "0歳";
    
    // 4. ヘッダー組み立て（誕生日行を廃止し、2行に集約）
    const infoHeader = document.createElement('div');
    infoHeader.style.cssText = "margin-bottom:20px; border-bottom:2px solid #333; padding-bottom:10px;";
    infoHeader.innerHTML = `
        <div style="font-weight:bold; font-size:22px; margin-bottom:10px;">${displayTitle}</div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:15px; font-weight:bold;">
            <div style="flex-grow:1;">性別: ${gender} / 年齢: ${age}</div>
            <div style="white-space:nowrap; flex-shrink:0; margin-left:10px; font-size:13px;">作成日: ${new Date().toLocaleDateString()}</div>
        </div>
    `;
    container.appendChild(infoHeader);

    // 5. 各パーツの追加
    const parts = [
        originalArea.querySelector('.main-area'),
        document.getElementById('shugoshin-result'),
        document.getElementById('body-map'),
        document.querySelector('.side-area')
    ];

// テーブルの表示を強制的に再レンダリングさせる処理
const map = document.getElementById('body-map');
if (map) {
    map.style.display = 'none'; // 一瞬消す
    map.offsetHeight;           // 再計算を強制的にトリガーさせる
    map.style.display = 'table'; // 再表示する
}

    // --- 修正箇所：パーツをコピーして表示する処理 ---
parts.forEach(part => {
    if (part) {
        const clone = part.cloneNode(true);
        
        // 【1】表示用のスタイルを直接書き込む（クラスやCSSファイルに依存させない）
        clone.style.display = 'block';
        clone.style.marginBottom = '20px';
        
        // 【2】クローンの中にあるテーブルを探して強制的にスタイルを直書きする
        const table = clone.querySelector('table');
        if (table) {
            table.style.cssText = `
                display: table !important;
                border-collapse: collapse !important;
                table-layout: fixed !important;
                width: 240px !important;
                margin: 20px auto !important;
                border: 1px solid #000 !important;
            `;
            
            // 【3】tdにも直接スタイルを適用
            const tds = table.querySelectorAll('td');
            tds.forEach(td => {
                td.style.cssText = `
                    width: 80px !important;
                    height: 80px !important;
                    padding: 0 !important;
                    border: 1px solid #000 !important;
                    text-align: center !important;
                    vertical-align: middle !important;
                    font-size: 19px !important;
                `;
            });
        }
        
        container.appendChild(clone);
    }
});

    // 6. 画像生成 (JPEG形式でダウンロード)
    try {
        const canvas = await html2canvas(container, {
            scale: 2,
            width: 580,
            backgroundColor: "#fcfbf9"
        });

        canvas.toBlob(blob => {
            if (!blob) return;

            // --- ファイル名の生成ロジック ---
            // 入力欄から現在の値を直接取得
            const y = document.getElementById('year-input')?.value || "0000";
            const m = document.getElementById('month-input')?.value || "0";
            const d = document.getElementById('day-input')?.value || "0";
            const comment = document.getElementById('comment-input')?.value || "";

            let fileName = "";

            if (comment && comment.trim().length > 0) {
                // コメントがある場合：日付とコメントを組み合わせてファイル名にする
                // ファイル名に使えない文字を「_」に置換し、長さを調整
                const cleanComment = comment.replace(/[\/\-\:\*\?\"\<\>\|]/g, '_');
                fileName = `鑑定_${y}_${m}_${d}_${cleanComment.substring(0, 10)}`;
            } else {
                // コメントがない場合：日付のみ
                fileName = `鑑定_${y}_${m}_${d}`;
            }
            // ---------------------------

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${fileName}.jpg`; // ここにファイル名を指定
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            //alert(`${fileName}.jpg をダウンロードしました！`);
        }, "image/jpeg", 0.9);

    } catch (e) {
        console.error("生成失敗:", e);
    } finally {
        document.body.removeChild(container);
    }
    }

// 1. 位相法グループの定義（位相法2の表を整理）
const ishou2Groups = [
    { name: "申子辰", branches: ["申", "子", "辰"] },
    { name: "巳酉丑", branches: ["巳", "酉", "丑"] },
    { name: "寅午戌", branches: ["寅", "午", "戌"] },
    { name: "亥卯未", branches: ["亥", "卯", "未"] }
];

    // 2. 位相法算出関数
function calculateIshouhou(y, m, d) {
    let results = [];
    const getBranch = (str) => str.slice(-1);
    const bY = getBranch(y), bM = getBranch(m), bD = getBranch(d);
    const branches = [bY, bM, bD];

    // (1) 2支の判定（位相法1）
    const pairs = [["年", bY, "月", bM], ["月", bM, "日", bD], ["年", bY, "日", bD]];
    pairs.forEach(([label1, b1, label2, b2]) => {
        if (ishou1Map[b1] && ishou1Map[b1][b2]) {
            results.push(`${ishou1Map[b1][b2]}（${label1}・${label2}）`);
        }
    });

    // (2) 3支/2支のグループ判定（位相法2：三合会局・半会）
    ishou2Groups.forEach(g => {
        // 命式内の支が、このグループにいくつ含まれているかカウント
        const matches = branches.filter(b => g.branches.includes(b));
        const uniqueMatches = [...new Set(matches)]; // 重複を除去

        if (uniqueMatches.length === 3) {
            results.push(`三合会局（${g.name}）`);
        } else if (uniqueMatches.length === 2) {
            // ここで、揃った2つの支だけを表示するように変更
            const matchStr = uniqueMatches.join('・');
            results.push(`半会（${matchStr}）`);
        }
    });

    return results;
}


    const getKanseiData = (yEto, mEto, dEto) => {
    // 支（2文字目）を取り出す
    const yShi = yEto[1];
    const mShi = mEto[1];
    const dShi = dEto[1];

    // 日干支から天中殺グループを判定（インデックスが不明なので、日干支そのものから判定）
    // 既存の calcTenchusatsu がインデックスを受け取るものなら、indexを逆算するか、
    // ここで直接「日干支の支」から判定ロジックを書く必要があります。
    // 今回は最も確実な「日干支の支」による判定に変更します
    
    // 【重要】既存の calcTenchusatsu が index 依存なら、以下の簡易判定を使ってください
    // ここでは天中殺の「2文字」が取得できればOKです
    const tsGroup = getTenchusatsuByDayKanshi(dEto); 

    const isNenChu = tsGroup.includes(yShi);
    const isGetsuChu = tsGroup.includes(mShi);
    const isNichiChu = tsGroup.includes(dShi);

    const isNishu = isNenChu && isGetsuChu;
    const isNichiza = ['甲戌', '乙亥'].includes(dEto);
    const isGokan = (tsGroup.includes(yShi) && tsGroup.includes(dShi)) && (yShi !== dShi);
    const isZen = isNichiza && isGetsuChu && isNenChu;

    const ijoList = ['甲午', '丁亥', '戊子', '己亥', '辛巳', '壬午', '癸巳'];
    const ijoCount = [yEto, mEto, dEto].filter(k => ijoList.includes(k)).length;

    return { isNenChu, isGetsuChu, isNichiChu, isNishu, isGokan, isNichiza, isZen, ijoCount };
};

// 補助関数：日干支から天中殺の支を取得
function getTenchusatsuByDayKanshi(dEto) {
    // 60干支のリストから位置を特定して天中殺を返す
    const idx = KANTO_LIST.indexOf(dEto);
    const group = Math.floor(idx / 10);
    const table = ["戌亥", "申酉", "午未", "辰巳", "寅卯", "子丑"];
    const str = table[group];
    return [str[0], str[1]];
}

function getKangoInfo(kan1, kan2) {
    // 変化する対象の干を定義
    const kangoTable = [
        { pair: ['甲', '己'], name: '甲己', result: '甲' }, 
        { pair: ['乙', '庚'], name: '乙庚', result: '乙' },
        { pair: ['丙', '辛'], name: '丙辛', result: '丙' },
        { pair: ['丁', '壬'], name: '丁壬', result: '丁' },
        { pair: ['戊', '癸'], name: '戊癸', result: '戊' }
    ];

    const match = kangoTable.find(item => 
        (item.pair[0] === kan1 && item.pair[1] === kan2) || 
        (item.pair[0] === kan2 && item.pair[1] === kan1)
    );
    
    return match ? { pairName: match.name, result: match.result } : null;
}


// リストを表示する共通関数
function renderList(figures) {
    const area = document.getElementById('figures-display-area');
    if (!area) return;
    
    area.innerHTML = '';
    
    // 生年順にソート
    const sorted = [...figures].sort((a, b) => {
        // もしデータに birth がない場合に備えての安全策
        const b1 = new Date(a.birth || "0001-01-01");
        const b2 = new Date(b.birth || "0001-01-01");
        return b1 - b2;
    });

    const ul = document.createElement('ul');
    sorted.forEach(p => {
        const li = document.createElement('li');
        li.textContent = `${p.name}（生年: ${p.birth || '不明'}）`;
        ul.appendChild(li);
    });
    area.appendChild(ul);
}


/**
 * 武将・文化人リストを表示する関数
 * @param {string} type - 'sengoku' か 'edo'
 */
function showList(type) {
    const displayArea = document.getElementById('figure-display-area');
    
    // データを取得（window直下にあるか確認）
    const data = (type === 'sengoku') ? window.SENGOKU_FIGURES : window.EDO_CULTURE_FIGURES;
    
    // デバッグ用：データがない場合にコンソールに出力
    if (!data) {
        console.error("データが見つかりません:", type, window.SENGOKU_FIGURES, window.EDO_CULTURE_FIGURES);
        displayArea.innerHTML = "データが読み込めていません。コンソールを確認してください。";
        return;
    }
    
    // リスト生成（見出しを削除）
    let html = `<ul style="list-style: none; padding: 0;">`;
    
    // main.js の showList 関数のループ部分を修正
data.forEach(item => {
    // 一意なIDを作る（評伝を表示・非表示するためのID）
    const detailId = `detail-${item.name.replace(/\s+/g, '')}`;
    
    let deathInfoText = ""; // 表示する文字列を入れる箱

    if (item.birth && item.death) {
        try {
            const bDate = new Date(item.birth);
            const dDate = new Date(item.death);

            // 1. 西暦没年を取得
            const dYear = dDate.getFullYear();

            // 2. 年齢を計算 (没年月日 - 生年月日)
            let age = dYear - bDate.getFullYear();
            
            // 没月日が生まれる前なら、年齢を1つ引く (満年齢計算)
            const dMonth = dDate.getMonth();
            const dDay = dDate.getDate();
            const bMonth = bDate.getMonth();
            const bDay = bDate.getDate();

            if (dMonth < bMonth || (dMonth === bMonth && dDay < bDay)) {
                age--;
            }

            // 3. 表示用の文字列を作る (例: "1581年52歳で没。")
            // ※当時の「数え年」ではなく、現代的な「満年齢」での計算です。
            deathInfoText = `${dYear}年${age}歳で没。`;

        } catch (e) {
            console.error("日付計算エラー:", item.name, e);
        }
    }

    // （showList関数のリスト生成ループ内）
html += `
    <li style="margin-bottom: 5px; border-bottom: 1px solid #eee;">
        <div style="cursor: pointer; padding: 5px;" 
             onclick="fillForm('${item.name}', '${item.birth}'); toggleDetail('${detailId}')">
            <strong>${item.name}</strong> <small>(${item.birth})</small>
        </div>
        
        <!-- ここで定義したスタイルを適用 -->
        <div id="${detailId}" style="${styles.detailArea}">
            <div style="margin-bottom: 8px;">
                ${item.description || "評伝データがありません。"}
            </div>
            ${deathInfoText ? `<div style="${styles.deathInfo}">${deathInfoText}</div>` : ""}
        </div>
    </li>`;
});
    html += `</ul>`;
    
    displayArea.innerHTML = html;
}

/**
 * 誕生日をフォームに自動入力する関数
 * @param {string} birthDate - "YYYY-MM-DD" 形式の文字列
 */
/**
 * フォームへの自動入力と算出の実行
 * @param {string} name - 名前
 * @param {string} birthDate - "YYYY-MM-DD" 形式
 */
function fillForm(name, birthDate) {
    // 1. 日付をフォームへセット
    const parts = birthDate.split('-');
    document.getElementById('year-input').value = parseInt(parts[0], 10);
    document.getElementById('month-input').value = parseInt(parts[1], 10);
    document.getElementById('day-input').value = parseInt(parts[2], 10);
    
    // 2. メモ欄（またはコメント欄）へ名前をセット
    const commentInput = document.getElementById('comment-input');
    if (commentInput) {
        commentInput.value = name;
    }
    
    // 3. 【重要】履歴取込ボタンと同じ「計算関数」を呼び出す
    // これにより、算出結果は出るが、履歴の更新処理（保存・移動）は走らない！
    if (typeof performCalculation === 'function') {
        performCalculation();
    }
}

function toggleDetail(id) {
    const el = document.getElementById(id);
    // 他の開いている詳細を閉じる（オプション：1つだけ表示させたい場合）
    document.querySelectorAll('[id^="detail-"]').forEach(d => {
        if (d.id !== id) d.style.display = 'none';
    });
    // クリックした要素の表示/非表示を切り替え
    el.style.display = (el.style.display === 'none') ? 'block' : 'none';
}