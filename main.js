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

// ローカルストレージのデータを一時的に記憶しておく変数（入れ物）
let tempPartnerData = null;

// --- 履歴リストを保持する大元の変数をグローバルに定義 ---
let historyList = [];

// 現在選択されている履歴のAI結果を一時保持する変数
let currentLoadedHistoryResult = "";

// 相性診断のAI結果を一時的に覚えておく専用の箱
let tempCompatResultText = "";

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

// ==========================================
// 3. 履歴管理モジュール (HistoryModule)
// ==========================================
const HistoryModule = {
    // データを保存して画面更新
    save: (date, comment, result = "") => {
        let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        
        // 現在選択されている性別ラジオボタンの値（'male' または 'female'）を取得
        const genderRadio = document.querySelector('input[name="gender"]:checked');
        const currentGender = genderRadio ? genderRadio.value : 'male';
        
        // 履歴オブジェクトに gender を追加して保存する
        history.unshift({ 
            date, 
            comment, 
            result: result,           // 個人鑑定のAI結果
            gender: currentGender,    // ★ここで性別を保存
            timestamp: Date.now() 
        });
        
        history = history.slice(0, 30); // 最大30件
        localStorage.setItem('searchHistory', JSON.stringify(history));
        HistoryModule.render();
    },

    render: () => {
    const list = document.getElementById('history-list');
    if (!list) return; // 最初に存在チェック

    const data = localStorage.getItem('searchHistory');
    const history = data ? JSON.parse(data) : [];

    // 履歴が空の場合の処理
    if (history.length === 0) {
        list.innerHTML = '<div style="color: #666; padding: 5px;">履歴はありません。</div>';
        return;
    }

    // ★ 画面に表示する件数を「最大5件」に絞り込む
    const displayHistory = history.slice(0, 5);

    // ★ displayHistory を使ってHTMLを一気に組み立てる
    const htmlString = displayHistory.map((h, index) => {
        const commentPart = (h.comment && h.comment.trim() !== "") ? ` - ${h.comment}` : "";
        return `
            <div class="history-item" style="display: flex; align-items: center; margin-bottom: 5px; width: 100%;">
                <input type="radio" name="history-radio" value="${index}" id="h${index}">
                <label for="h${index}" style="margin-left: 8px; flex-grow: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer;">
                    <strong>${h.date}</strong>
                    <span style="display: inline-block; max-width: 400px; overflow: hidden; text-overflow: ellipsis; vertical-align: bottom;">
                        ${commentPart}
                    </span>
                </label>
            </div>`;
    }).join('');

    // 画面に反映
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

        if (!h) return;


        // 日付解析＆フォーム反映
        const matches = h.date.match(/(\d+)\/(\d+)\/(\d+)/);
        if (matches) {
            document.getElementById('year-input').value = matches[1];
            document.getElementById('month-input').value = matches[2];
            document.getElementById('day-input').value = matches[3];
            
            const commentInput = document.getElementById('comment-input');
            if (commentInput) {
                commentInput.value = h.comment || "";
            }

            // --- 追加：履歴データから性別を復元してラジオボタンに反映する ---
            const savedGender = h.gender; // ※もし保存時のキー名が違えば h.sex 等に変更してください
            if (savedGender) {
                const gVal = String(savedGender).trim();
                const isFemale = gVal.includes('女') || gVal.toLowerCase().includes('female') || gVal.toLowerCase() === 'f';
                const targetRadio = document.getElementById(isFemale ? 'female' : 'male');
                
                if (targetRadio) {
                    targetRadio.checked = true;
                    // アプリ側が変更を検知できるようにイベントを発火させる
                    targetRadio.dispatchEvent(new Event('change', { bubbles: true }));
                    targetRadio.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
            // ------------------------------------------------------------------

            if (typeof performCalculation === 'function') {
                performCalculation();
            }
        }

        // ==========================================
        // 個人鑑定のAI結果ボタンの表示・非表示コントロールのみ
        // ==========================================
        const actionArea = document.getElementById('history-action-area'); 

        if (h.result) {
            currentLoadedHistoryResult = h.result;
            if (actionArea) actionArea.style.display = 'block';
            console.log("✅ 個人鑑定のAI結果ボタンを表示しました。");
        } else {
            currentLoadedHistoryResult = "";
            if (actionArea) actionArea.style.display = 'none';
            console.log("🚫 この履歴には個人鑑定のAI結果がありません。");
        }
    }
};

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
                <td style="font-size:20px;">${findJudai(eto[0])}</td>
                <td style="font-size:20px;">${findJuni(eto[1])}</td>
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
    // 【ステップ①】いまローカルストレージに残っている「直前のデータ」を一時変数に回収！
    const oldData = localStorage.getItem('sanmeigaku_previous_meishiki');
    if (oldData) {
        try {
            tempPartnerData = JSON.parse(oldData);
            console.log("一時変数 tempPartnerData に1人目のデータを退避しました:", tempPartnerData);
        } catch (e) {
            console.error("退避データのパースに失敗しました:", e);
        }
    }

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


    // 3. 表示の更新
    shugoshinContent.innerHTML = `
    <div style="font-size: 18px; font-family: '游明朝', 'Yu Mincho', serif;">
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

    showDiagnosis(map);

    // 【ステップ②】今回新しく計算された最新データを、ローカルストレージに新しく書き込む
    const newData = collectCurrentMeishikiData();
    if (newData && newData.birthDate) {
        localStorage.setItem('sanmeigaku_previous_meishiki', JSON.stringify(newData));
        console.log("ローカルストレージを最新データに更新しました:", newData);
    }
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

// ==========================================
// 4. 初期化イベント (全てここに統合)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 0. 初回読み込み時の表示 ---
    HistoryModule.render();

    // --- 1. 計算ボタンのイベント設定 ---
    const calcBtn = document.getElementById('calc-btn');
    if (calcBtn) {
        const newCalcBtn = calcBtn.cloneNode(true);
        calcBtn.parentNode.replaceChild(newCalcBtn, calcBtn);

        newCalcBtn.addEventListener('click', () => {
            performCalculation(); // 計算実行

            const y = document.getElementById('year-input')?.value || "";
            const m = document.getElementById('month-input')?.value || "";
            const d = document.getElementById('day-input')?.value || "";
            const comment = document.getElementById('comment-input')?.value || "";
            const title = (comment && comment.trim() !== "") ? comment.trim() : "";

            if (y && m && d) {
                // ★ 現在選択されている性別を取得する
                const genderRadio = document.querySelector('input[name="gender"]:checked');
                const currentGender = genderRadio ? genderRadio.value : 'male';

                // ★ 現在保持しているAI鑑定結果（もしあれば）を一緒に保存する
                const aiResultToSave = typeof currentLoadedHistoryResult !== 'undefined' ? currentLoadedHistoryResult : "";
                
                // 第4引数に性別（currentGender）を渡して保存する
                HistoryModule.save(`${y}/${m}/${d}`, title, aiResultToSave, currentGender);
                HistoryModule.render();
            }
        });
    }

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

    // ==========================================
    // 1. まず「aiPartElement」をここで作成する
    // ==========================================
    let aiHtmlContent = "";
    const chatContainer = document.getElementById('ai-chat-messages');
    if (chatContainer && chatContainer.innerText.trim() !== "") {
        aiHtmlContent = chatContainer.innerHTML;
    } else if (typeof currentLoadedHistoryResult !== 'undefined' && currentLoadedHistoryResult) {
        aiHtmlContent = currentLoadedHistoryResult.replace(/\n/g, '<br>');
    }

    let aiPartElement = null;
    if (aiHtmlContent) {
        aiPartElement = document.createElement('div');
        aiPartElement.style.cssText = `
            position: relative;
            /* ★ 枠線の幅を少し狭くする (550px ➔ 530px) */
            width: 530px; 
            /* ★ 枠線を右に寄せ、画像の左端との間に適度な隙間を作る (マイナスをプラスや0にする) */
            margin-left: 10px; 
            margin-top: 20px; 
            margin-bottom: 20px; 
            /* ★ 左側の広すぎた隙間を狭くする（上 右 下 左：15px 15px 15px 15px） */
            padding: 15px; 
            background: #ffffff; 
            border: 1px solid #d1d5db; 
            border-radius: 8px; 
            font-size: 12pt; 
            line-height: 1.6; 
            color: #1f2937;
            box-sizing: border-box;
            word-break: break-all;
        `;
        aiPartElement.innerHTML = `
            <div style="font-weight: bold; font-size: 13pt; margin-bottom: 10px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; color: #374151;">
                【AI鑑定結果】
            </div>
            <div>${aiHtmlContent}</div>
        `;
    }

    // 5. 各パーツの追加
    const parts = [
        originalArea.querySelector('.main-area'),
        document.getElementById('shugoshin-result'),
        document.getElementById('body-map'),
        document.querySelector('.side-area'),
        aiPartElement // ここで先ほど作ったパーツを無事に参照できる！
    ];

    parts.forEach(part => {
        if (part) {
            // 要素が既存のDOMノードか、新規作成したDIVかによって処理を分岐
            const clone = (part instanceof HTMLElement && part.parentNode) ? part.cloneNode(true) : part;
            
            const titleEl = clone.querySelector ? clone.querySelector('#display-title') : null;
            if (titleEl) titleEl.style.display = 'none'; // 重複タイトルを隠す
            
            clone.style.display = 'block';
            clone.style.marginBottom = '20px';
            container.appendChild(clone);
        }
    });

    // 6. 画像生成 (JPEG形式でダウンロード)
    try {
        const canvas = await html2canvas(container, {
            scale: 2,
            width: 590,
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
} // ← ★ 1. saveResultHandler 関数を閉じる括弧

}); // ← ★ 2. 最初（657行目）の document.addEventListener('DOMContentLoaded', () => { を閉じる括弧！

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


// 戦国武将を表示する関数
function displaySengoku() {
    // データが読み込まれているかチェック
    if (typeof window.SENGOKU_FIGURES_PART1 === 'undefined' || typeof window.SENGOKU_FIGURES_PART2 === 'undefined') {
        alert("戦国武将のデータがまだ読み込めていません。");
        return;
    }
    const part1 = window.SENGOKU_FIGURES_PART1 || [];
    const part2 = window.SENGOKU_FIGURES_PART2 || [];
    renderList(data);
}

// 江戸文化人を表示する関数
function displayEdo() {
    // データが読み込まれているかチェック
    if (typeof window.EDO_CULTURE_FIGURES === 'undefined') {
        alert("江戸文化人のデータがまだ読み込めていません。");
        return;
    }
    renderList(window.EDO_CULTURE_FIGURES);
}

// リストを表示する共通関数
function renderList(figures) {
    const area = document.getElementById('figures-display-area');
    if (!area) return;
    
    area.innerHTML = '';

    const ul = document.createElement('ul');
    sorted.forEach(p => {
        const li = document.createElement('li');
        li.textContent = `${p.name}（生年: ${p.birth || '不明'}）`;
        ul.appendChild(li);
    });
    area.appendChild(ul);
}

// ==========================================
// 5. 武将・文化人リスト表示機能
// ==========================================
function showList(type) {
    const displayArea = document.getElementById('figure-display-area');
    if (!displayArea) return;
    
    // 共通関数でデータを取得
    const data = getFigureData(type);
    
    if (!data) {
        displayArea.innerHTML = "データが読み込めていません。";
        return;
    }
    
    let html = `<ul style="list-style: none; padding: 0;">`;
    data.forEach(item => {
    // --- 1. 見出しや空行の判定 ---
    // もし name に "---" が含まれていたら見出しとして表示
    if (item.name.includes("---")) {
        html += `<li style="padding: 10px 0; font-weight: bold; color: #555; border-bottom: 2px solid #ddd;">${item.name}</li>`;
        return; // 次のデータへスキップ
    }
    // もし name が空白だけなら空行として表示
    if (item.name.trim() === "") {
        html += `<li style="height: 20px;"></li>`;
        return;
    }

    // --- 2. 通常の人物データ表示（既存の処理） ---
    let deathText = "";
    // (以下、既存の没年齢計算の処理...)
    const deathYear = new Date(item.death).getFullYear();
    if (item.birth && item.death && deathYear < 9999) {
        const b = new Date(item.birth);
        const d = new Date(item.death);
        const ageAtDeath = d.getFullYear() - b.getFullYear();
        deathText = `<div style="font-size:12px; color:#333; text-align: right; margin-top: 2px;">${deathYear}年 ${ageAtDeath}歳で没。</div>`;
    }

    html += `
        <li style="margin-bottom:10px; border-bottom:1px solid #ccc; padding:5px;">
            <div style="font-weight:bold; cursor:pointer; color:blue;" 
                 onclick="reflectData('${item.name}', '${type}')">
                ${item.name}
            </div>
            <div style="font-size:14px; margin-top:5px;">
                ${item.description || "説明なし"}
            </div>
            ${deathText}
        </li>`;
});
    html += `</ul>`;
    displayArea.innerHTML = html;
}

// ★ここが抜けていると Uncaught ReferenceError になります
function reflectData(name, type) {
    // 共通関数でデータを取得
    const data = getFigureData(type);
    const item = data ? data.find(i => i.name === name) : null;
    
    if (!item || !item.birth) return;

    const parts = item.birth.split('-');
    document.getElementById('year-input').value = parts[0];
    document.getElementById('month-input').value = parseInt(parts[1], 10);
    document.getElementById('day-input').value = parseInt(parts[2], 10);
    document.getElementById('comment-input').value = item.name;

    if (typeof performCalculation === 'function') {
        performCalculation();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 過去履歴ボタンから呼び出される関数

function showHistoryList() {
    const data = localStorage.getItem('searchHistory');
    const history = data ? JSON.parse(data) : []; // ← ここは全データ（最大30件）を取得
    
    const displayArea = document.getElementById('figure-display-area');
    if (!displayArea) return;

    if (history.length === 0) {
        displayArea.innerHTML = "履歴はありません。";
        return;
    }

    // （全データをそのままループさせる）
    let html = `<ul style="list-style: none; padding: 0;">`;
    history.forEach((h, index) => {
        const titleText = h.comment || '個人鑑定';
        
        html += `
            <li style="margin-bottom:10px; border-bottom:1px solid #ccc; padding:8px; cursor:pointer; background:#fff; border-radius:4px;" 
                onclick='reflectHistory(${index})' 
                onmouseover="this.style.background='#f7fafc'" 
                onmouseout="this.style.background='#fff'">
                <div style="font-size:0.85em; color:#666;">${h.date}</div>
                <div style="font-weight:bold; color:#2d3748;">${titleText}</div>
            </li>`;
    });
    html += `</ul>`;
    displayArea.innerHTML = html;
}


// 6. 下半ペインを閉じて元の命式だけの画面に戻す関数
function closeBottomPane() {
    const bottomPane = document.getElementById('bottom-pane');
    const topPane = document.getElementById('top-pane');
    
    if (bottomPane) bottomPane.style.display = 'none';
    if (topPane) {
        topPane.style.maxHeight = 'none'; 
        topPane.style.overflowY = 'visible';
    }
}

// 1. 履歴をクリックしたときの処理
// 履歴の項目をクリックしたときの処理（localStorageから直接結果をログ出力）
function reflectHistory(index) {
    console.log("=== 【デバッグ】履歴クリック（取込）開始 index:", index, " ===");

    // 1. ローカルストレージから履歴一覧を取得
    const data = localStorage.getItem('searchHistory');
    const history = data ? JSON.parse(data) : [];
    const h = history[index];

    if (!h) {
        console.log("❌ エラー: 指定されたインデックスの履歴データが存在しません。");
        return;
    }

    // --- ★追加：クリックされたら画面の上部へスムーズにスクロールする ---
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

    // 2. ★ここでローカルストレージ（または履歴データ内）のAI鑑定結果を強制的にコンソールに出力
    if (h.result) {
        console.log("✨ 【大成功】この履歴に保存されているAI鑑定結果のテキスト:", h.result);
    } else {
        console.log("⚠️ 【注意】この履歴データの中には 'result'（AI鑑定結果）が含まれていません。空っぽ、または保存されていない可能性があります。");
    }

    // 3. 既存の日付復元などの処理
    const parts = h.date.split('/');
    if (parts.length >= 3) {
        const yearInput = document.getElementById('year-input');
        const monthInput = document.getElementById('month-input');
        const dayInput = document.getElementById('day-input');
        if (yearInput) yearInput.value = parts[0];
        if (monthInput) monthInput.value = parseInt(parts[1], 10);
        if (dayInput) dayInput.value = parseInt(parts[2], 10);
    }
    
    const commentInput = document.getElementById('comment-input');
    if (commentInput) {
        commentInput.value = h.comment || "";
    }

    // --- ★ここから追加：履歴データから性別を復元する処理 ---
    const savedGender = h.gender || h.sex; // 保存されている性別を取得
    if (savedGender) {
        const gVal = String(savedGender).trim();
        // 'female', '女', 'f' などの文字が含まれていれば女性、それ以外は男性と判定
        const isFemale = gVal.includes('女') || gVal.toLowerCase().includes('female') || gVal.toLowerCase() === 'f';
        const targetRadio = document.getElementById(isFemale ? 'female' : 'male');
        
        if (targetRadio) {
            targetRadio.checked = true;
            targetRadio.dispatchEvent(new Event('change', { bubbles: true })); // 必要に応じて変更イベントを発火
        }
    }
    // ----------------------------------------------------

    if (typeof performCalculation === 'function') {
        performCalculation();
    }

    // 4. ボタンの表示・非表示の切り替え
    const actionArea = document.getElementById('history-action-area');
    if (h.result) {
        currentLoadedHistoryResult = h.result;
        if (actionArea) actionArea.style.display = 'block';
        console.log("✅ AI結果ボタンを表示しました。");
    } else {
        currentLoadedHistoryResult = "";
        if (actionArea) actionArea.style.display = 'none';
        console.log("🚫 AI結果ボタンを非表示にしました。");
    }
}

// 2. 「AI鑑定結果」ボタンが押されたときの処理（完全強制サルベージ版）
function showAiResultFromHistory() {
    console.log("--- AI結果ボタンが押されました (ステップ1) ---");

    try {
        // 1. 変数とストレージのチェック
        let targetResult = typeof currentLoadedHistoryResult !== 'undefined' ? currentLoadedHistoryResult : "";
        
        if (!targetResult) {
            console.log("メモリにないためlocalStorageから検索します (ステップ2)");
            const data = localStorage.getItem('searchHistory');
            if (data) {
                const history = JSON.parse(data);
                const found = history.find(item => item && item.result && item.result.trim() !== "");
                if (found) {
                    targetResult = found.result;
                    console.log("localStorageからの救出成功！");
                }
            }
        }

        console.log("表示するテキストの文字数:", targetResult ? targetResult.length : 0);

        if (!targetResult) {
            alert('この履歴には保存されたAI鑑定結果がありません。');
            return;
        }

        console.log("UIの切り替えを開始します (ステップ3)");

        // 2. UIを上下分割モードに切り替え
        const topPane = document.getElementById('top-pane');
        const bottomPane = document.getElementById('bottom-pane');
        
        if (bottomPane) bottomPane.style.display = 'flex';
        if (topPane) {
            topPane.style.maxHeight = '40vh'; 
            topPane.style.overflowY = 'auto';
        }

        console.log("チャットコンテナを探します (ステップ4)");

        // 3. 下半ペインのチャットエリアに結果を描画
        const chatContainer = document.getElementById('ai-chat-messages');
        if (chatContainer) {
            chatContainer.innerHTML = `
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #ddd; font-size: 0.95em; line-height: 1.6;">
                    <div style="font-size: 0.8em; color: #666; margin-bottom: 8px; border-bottom: 1px dashed #ccc; padding-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
                        <span>【過去のAI鑑定結果の控え】</span>
                        <button onclick="closeBottomPane()" style="background:none; border:none; color:#e53e3e; cursor:pointer; font-weight:bold; font-size: 1.1em;">✖ 閉じる</button>
                    </div>
                    ${targetResult.replace(/\n/g, '<br>')}
                </div>
            `;
            console.log("【大成功】下半ペインにAI鑑定結果を描画しました！");
        } else {
            console.error("エラー: #ai-chat-messages がHTML上に存在しません！");
        }

    } catch (err) {
        console.error("❌ 予期せぬエラーが発生しました:", err);
    }
}


// 1. 性格診断を表示する関数
function showDiagnosis(map) {
    const diagnosisArea = document.getElementById('diagnosis-area');
    if (!diagnosisArea) return;

    // mapから各場所の星を取得
    const 胸 = map['pos-i'];
    const 右手 = map['pos-b'];
    const 左手 = map['pos-f'];

    // 1. 基本メッセージ（本質）
    let message = `
        <div style="margin-top: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9; font-size: 14px;">
            <h3 style="margin-top:0; font-size: 16px;">性格診断メッセージ</h3>
            <p><strong>本質（胸）：</strong> ${胸}のあなたは、${window.STAR_DESCRIPTIONS[胸] || "独特の個性を持っています。"}</p>
            <p><strong>外面（右手）：</strong> 対外的な顔は${右手}の性質が強く、周囲には活動的で頼れる存在として映っているようです。</p>
            <p><strong>内面（左手）：</strong> 一方で内面には${左手}を秘めており、自分の中では着実さやこだわりを大切にする一面があります。</p>
    `;

    // 2. 組み合わせ診断（個別 → グループ → その他）
    const key = `${右手}_${左手}`; // 個別キー
    const groupKey = `グループ_${window.STAR_GROUPS[右手]}_${window.STAR_GROUPS[左手]}`; // グループキー
    
    let extraMessage = "";

    // 【優先順位1：個別データが存在するか】
    if (window.COMBINATION_DESCRIPTIONS[key]) {
        extraMessage = window.COMBINATION_DESCRIPTIONS[key];
    } 
    // 【優先順位2：グループデータが存在するか】
    else if (window.COMBINATION_DESCRIPTIONS[groupKey]) {
        extraMessage = window.COMBINATION_DESCRIPTIONS[groupKey];
    } 
    // 【優先順位3：どちらでもない場合（念のための補完）】
    else if (右手 === 左手) {
        extraMessage = "外面と内面が同じ星で、裏表のない一貫した誠実さが魅力です。";
    } else {
        extraMessage = "外面と内面で異なる魅力を持っており、周囲を飽きさせない不思議なオーラをお持ちです。";
    }

    // 3. 表示の組み立て
    diagnosisArea.innerHTML = message + `<p><strong>【深掘り分析】</strong>${extraMessage}</p></div>`;
}

// カテゴリ判定の共通関数
function getFigureData(type) {
    switch(type) {
        case 'sengoku':    return window.SENGOKU_FIGURES;
        case 'edo':        return window.EDO_CULTURE_FIGURES;
        case 'entertainer': return window.ENTERTAINER_FIGURES;
        case 'contributor': return window.CONTRIBUTOR_FIGURES;
        case 'shocking':    return window.SHOCKING_FIGURES;
        case 'royal_figures':    return window.ROYAL_FIGURES;
        case 'prime_ministers':    return window.PRIME_MINISTERS;
        default:           return null;
    }
}

function openHelp() {
    let modal = document.getElementById('help-modal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'help-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; justify-content: center;
        align-items: center; z-index: 1000;
    `;

    modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; width: 80%; max-width: 500px; max-height: 80vh; overflow-y: auto; position: relative;">
            <h3>使い方</h3>
            <div id="help-content">
                <p>・1800-2050年の範囲で算出できます</p>
                <p>・履歴取込ボタンから直近５件の内容を確認できます</p>
                <p>・算出ボタンを押すと検索履歴に反映されます</p>
                <p>・最下部のリスト一覧から、該当項目の命式が確認できます</p>
                <p>・歴史上の人物については、史書等で生年月日が確認できる人に限定しています</p>
                <p>・結果を保存ボタンから、内容の画像がダウンロードできます</p>
            </div>
            <button onclick="document.getElementById('help-modal').remove()" style="margin-top: 20px;">閉じる</button>
        </div>
    `;

    document.body.appendChild(modal);
}

function checkInput(current, nextId, maxLength) {
    // 1. 数字以外を削除
    current.value = current.value.replace(/[^0-9]/g, '');

    // 2. 指定桁数に達したら次へ移動
    if (current.value.length >= maxLength) {
        // スマホでの誤作動を防ぐため、100ミリ秒後に移動させる
        setTimeout(function() {
            const nextField = document.getElementById(nextId);
            if (nextField) {
                nextField.focus();
            }
        }, 100);
    }
}

// 1. AIメニューの選択肢に応じた入力欄の切り替え
function toggleAiInput() {
    const select = document.getElementById('ai-menu-select');
    const compArea = document.getElementById('compatibility-input-area');
    const freeArea = document.getElementById('free-input-area');

    // 要素が存在する場合のみ display を変更する
    if (compArea) {
        compArea.style.display = 'none';
    }
    if (freeArea) {
        freeArea.style.display = 'none';
    }

    // 選択された項目に応じて表示（select や要素が存在する場合のみ実行）
    if (select) {
        if (select.value === 'compatibility' && compArea) {
            compArea.style.display = 'block';
        } else if (select.value === 'free' && freeArea) {
            freeArea.style.display = 'block';
        }
    }
}

// --- AIへ渡すための命式データを収集する関数 ---
function collectCurrentMeishikiData() {
    // 入力値の取得
    const y = document.getElementById('year-input')?.value || "";
    const m = document.getElementById('month-input')?.value || "";
    const d = document.getElementById('day-input')?.value || "";
    const genderVal = document.querySelector('input[name="gender"]:checked')?.value;
    const gender = genderVal === 'male' ? '男性' : (genderVal === 'female' ? '女性' : '不明');
    const age = document.getElementById('age-display')?.innerText || "";
    const comment = document.getElementById('comment-input')?.value || "";

    // 画面に表示されている結果要素からテキストを安全に取得するヘルパー
    const getText = (id) => document.getElementById(id)?.innerText || "";

    return {
        birthDate: `${y}年${m}月${d}日`,
        gender: gender,
        age: age,
        comment: comment,
        // 各種干支
        eto: {
            day: getText('day-eto'),
            month: getText('month-eto'),
            year: getText('year-eto')
        },
        // 天中殺
        tenchusatsu: {
            nichi: getText('tenchusatsu-text'),
            nen: getText('nenkan-tenchu-text')
        },
        // 人体図・性格診断等の主要な位置の星
        jintaizu: {
            posA: getText('pos-a'), // 主気・全体傾向
            posB: getText('pos-b'),
            posC: getText('pos-c'), // 晩年
            posD: getText('pos-d'), // 腹（主星など）
            posE: getText('pos-e'), // 中年
            posF: getText('pos-f'),
            posG: getText('pos-h'),
            posH: getText('pos-g'),
            posI: getText('pos-i')
        },
        // 守護神・中殺・位相法などの詳細テキスト
        shugoshinAndDetails: getText('shugoshin-content')
    };
}

// 2. 「AIに鑑定を依頼する」ボタンが押されたときの処理
async function requestAiConsultation() {
    const menuType = document.getElementById('ai-menu-select').value;
    
    // --- ★ここで事前に meishikiData を宣言しておく ---
    let meishikiData = null; 
    let partnerMeishikiData = null; 
    let compatibilityTitle = ""; // ★ 相性診断用のタイトル保持用

    // --- 1人目（自分・相談者）の計算結果を取得 ---
    let selfMeishikiData = collectCurrentMeishikiData(); 

    if (!selfMeishikiData) {
        alert('まずは命式を算出してください。');
        return;
    }

    let additionalInfo = {};

    // --- 相性診断の場合の処理 ---
    if (menuType && menuType.includes('compatibility')) {
        
        // 1. お相手（2人目）のデータとして、いま画面に入力されている最新のデータを取得する
        partnerMeishikiData = collectCurrentMeishikiData();

        // 2. 1人目（自分）のデータは、事前に退避させておいた「tempPartnerData」またはローカルストレージから復元する
        let originalSelfData = null;
        if (typeof tempPartnerData !== 'undefined' && tempPartnerData) {
            originalSelfData = tempPartnerData; 
        } else {
            const savedData = localStorage.getItem('sanmeigaku_previous_meishiki');
            if (savedData) {
                try {
                    originalSelfData = JSON.parse(savedData);
                } catch (e) {
                    console.error("保存データのパースに失敗しました:", e);
                }
            }
        }

        if (!originalSelfData || !partnerMeishikiData) {
            alert('お相手または1人目の命式データが見つかりません。お手数ですが、別の方の生年月日を入力して算出してしてから再度お試しください。');
            return;
        }

        // --- タイトルを作成 ---
        const selfComment = (originalSelfData.comment && originalSelfData.comment.trim() !== "") 
            ? originalSelfData.comment.trim() 
            : `${originalSelfData.year || ''}/${originalSelfData.month || ''}/${originalSelfData.day || ''}`;
        
        const partnerCommentInput = document.getElementById('comment-input')?.value || "";
        const partnerComment = (partnerCommentInput.trim() !== "") 
            ? partnerCommentInput.trim() 
            : "お相手";

        compatibilityTitle = `相性診断書・${selfComment} + ${partnerComment}`;

        // 変数を正しい形で入れ替える
        meishikiData = originalSelfData; // ★ここで相性診断用の1人目をセット

        // 一時保存
        window.tempCompatSelfData = meishikiData;
        window.tempCompatPartnerData = partnerMeishikiData;

    } else {
        // --- ★通常の単体鑑定や自由記述の場合 ---
        meishikiData = selfMeishikiData; // ★通常の1人目データをセット
        
        if (menuType === 'free') {
            additionalInfo.freeQuestion = document.getElementById('ai-free-question')?.value || '';
            if (!additionalInfo.freeQuestion) {
                alert('質問内容を入力してください。');
                return;
            }
        }
    }

    // --- 実際にAIに送るためのデータをまとめているオブジェクト ---
    const aiPayload = {
        menuType: menuType,
        selfData: meishikiData,          // 1人目のデータ
        partnerData: partnerMeishikiData,// 2人目のデータ
        customTitle: compatibilityTitle  // タイトル
    };

    // ★ ここでコンソールに詳細を出力する
    console.log("========================================");
    console.log("【AI送信データ デバッグログ】");
    console.log("送信メニュー:", menuType);
    console.log("1人目 (selfData):", meishikiData);
    console.log("2人目 (partnerData):", partnerMeishikiData);
    console.log("送信オブジェクトまるごと:", aiPayload);
    console.log("========================================");

    // --- ★【復活】UIを上下分割モードに切り替え ---
    const topPane = document.getElementById('top-pane');
    const bottomPane = document.getElementById('bottom-pane');
    
    if (bottomPane) bottomPane.style.display = 'flex';
    if (topPane) {
        topPane.style.maxHeight = '40vh'; 
        topPane.style.overflowY = 'auto';
    }

    // --- ★【復活】チャットエリアに「鑑定中...」のメッセージを表示 ---
    const chatContainer = document.getElementById('ai-chat-messages');
    if (chatContainer) {
        chatContainer.innerHTML = `<div style="background: #fff; padding: 10px; border-radius: 8px; border: 1px solid #ddd; font-size: 0.9em;">🔮 朱学院流ベテラン占い師が命式を読み解いています...少々お待ちください。</div>`;
    }


    try {
        const response = await fetch('https://sanmeigaku-02ci.onrender.com/api/kantei', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                menuType: menuType,
                meishikiData: meishikiData,
                partnerMeishikiData: partnerMeishikiData,
                additionalInfo: additionalInfo,
                history: typeof chatHistory !== 'undefined' ? chatHistory : []
            })
        });

        const data = await response.json();
        console.log("鑑定結果受信:", data);

        const resultText = data.result || data.message || "鑑定結果を取得しました。";
        
        // ==========================================
        // ★ 修正：menuType が相性診断かどうかで処理を分岐する！
        // ==========================================
        if (menuType && menuType.includes('compatibility')) {
            // 【相性診断の場合】
            // 1. 個人鑑定の履歴は絶対に上書きせず、相性専用の変数に結果を退避する
            window.tempCompatResultText = resultText; 
            console.log("【相性診断】専用変数にAI結果を保持しました。");

            // 2. 相性診断結果の画像保存ボタンを出現させる
            const compatActionArea = document.getElementById('compat-image-action-area');
            if (compatActionArea) {
                compatActionArea.style.display = 'block';
            }

        } else {
            // 【通常の個人鑑定の場合】
            // 従来の通り、最新の履歴（先頭）にAI結果をドッキングする
            const rawData = localStorage.getItem('searchHistory');
            let historyArray = rawData ? JSON.parse(rawData) : [];

            if (historyArray.length > 0) {
                historyArray[0].result = resultText;
                localStorage.setItem('searchHistory', JSON.stringify(historyArray));
                console.log("【保存成功】最新の履歴にAI鑑定結果をドッキングしました！", historyArray[0]);
            }
        }
        // ==========================================

        // --- サーバーからの結果をチャットエリアに描画する（共通） ---
        if (chatContainer) {
            chatContainer.innerHTML = `
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #ddd; font-size: 0.95em; line-height: 1.6;">
                    ${resultText.replace(/\n/g, '<br>')}
                </div>
            `;
        }

    } catch (e) {
        console.error("通信エラー:", e);
        if (chatContainer) {
            chatContainer.innerHTML = `<div style="color: red; padding: 10px;">通信エラーが発生しました。時間をおいて再度お試しください。</div>`;
        }
    }
}

// 閉じるボタンの処理
function closeAIChat() {
    const topPane = document.getElementById('top-pane');
    document.getElementById('bottom-pane').style.display = 'none';
    
    // 制限を解除して元のフル画面に戻す
    topPane.style.maxHeight = 'none';
    topPane.style.overflowY = 'visible';
}

// 4. 追い質問（追加チャット）の送信処理
// 4. 追い質問（追加チャット）の送信処理
async function sendFollowUpMessage() {
    const inputEl = document.getElementById('ai-followup-input');
    const question = inputEl.value.trim();
    if (!question) return;

    // 画面に自分の質問をまず追加表示する
    appendChatMessage('user', question);
    inputEl.value = '';

    // 現在の命式データを取得
    const meishikiData = collectCurrentMeishikiData();

    // 画面上のチャット履歴（これまでのやり取り）を収集する
    const chatElements = document.querySelectorAll('#ai-result-view .chat-message, #chat-container .chat-message'); 
    let conversationHistory = [];
    
    chatElements.forEach(el => {
        const isUser = el.classList.contains('user'); 
        let text = el.innerText.replace(/^(【追加のご質問】|【AIからの回答】|あなた|AI):\s*/, '');
        conversationHistory.push({
            role: isUser ? 'user' : 'assistant',
            content: text
        });
    });

    try {
        const response = await fetch('https://sanmeigaku-02ci.onrender.com/api/kantei', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                menuType: 'followup', // ★ 追加質問であることを示すタイプを指定
                message: question,    // 今回の質問
                meishikiData: meishikiData,
                history: conversationHistory // ★ これまでの会話履歴を同梱
            })
        });

        const data = await response.json();
        console.log("追加質問の結果受信:", data);

        const resultText = data.result || data.reply || data.message || "回答を取得しました。";
        
        // AIからの回答を画面（結果エリアの末尾）に追記する
        appendChatMessage('ai', resultText);

        // 必要に応じてローカルストレージの履歴を最新のAI回答に更新する
        const rawData = localStorage.getItem('searchHistory');
        let historyArray = rawData ? JSON.parse(rawData) : [];
        if (historyArray.length > 0) {
            historyArray[0].result = resultText;
            localStorage.setItem('searchHistory', JSON.stringify(historyArray));
        }

    } catch (e) {
        console.error("追加質問の通信エラー:", e);
        appendChatMessage('ai', '通信エラーが発生しました。時間をおいて再度お試しください。');
    }
}

/**
 * 鑑定結果をローカルストレージに保存する共通関数
 * @param {string} type - 鑑定の種類 ('personal' または 'compatibility')
 * @param {Object} primaryData - 1人目のデータ（または個人鑑定のデータ）
 * @param {string} resultText - AIからの鑑定結果テキスト
 * @param {Object|null} partnerData - 2人目のデータ（相性診断の場合のみ）
 */
function saveKanteiHistory(type, primaryData, resultText, partnerData = null) {
    // 共通の保存先キー（あるいは type によってキーを分けることも可能）
    const STORAGE_KEY = 'sanmeigaku_all_history'; 
    
    let historyList = [];
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) historyList = JSON.parse(saved);
    } catch (e) {
        console.error("履歴の読み込みに失敗しました", e);
    }

    // 保存するデータの形を統一
    const newEntry = {
        id: Date.now(),
        date: new Date().toLocaleDateString('ja-JP'),
        type: type, // 'personal' または 'compatibility'
        primaryData: primaryData, // 1人目（または個人）
        partnerData: partnerData, // 2人目（相性診断でなければ null）
        result: resultText
    };

    // リストの先頭に追加（最大20件まで保持）
    historyList.unshift(newEntry);
    if (historyList.length > 20) {
        historyList = historyList.slice(0, 20);
    }

    // 保存
    localStorage.setItem(STORAGE_KEY, JSON.stringify(historyList));
}

async function downloadCompatImage() {
    console.log("【相性画像出力】処理を開始します...");

    // 1. 現在の画面に入力されている値を控えておく（後で元に戻すため）
    const originalYear = document.getElementById('year-input')?.value;
    const originalMonth = document.getElementById('month-input')?.value;
    const originalDay = document.getElementById('day-input')?.value;
    const originalGender = document.querySelector('input[name="gender"]:checked')?.value;
    const originalComment = document.getElementById('comment-input')?.value;

    // 2. 文字列から「年・月・日」を安全に抽出するヘルパー関数
    function parseBirthDate(birthDateStr) {
        if (!birthDateStr) return { year: '', month: '', day: '' };
        const match = birthDateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
        if (match) {
            return { year: match[1], month: match[2], day: match[3] };
        }
        return { year: '', month: '', day: '' };
    }

    // 3. 隠しコンテナ (幅820px)
    const container = document.createElement('div');
    container.style.cssText = "position:absolute; left:-9999px; top:0; width:820px; background:#fcfbf9; padding:20px; display:block; box-sizing:border-box; font-family: sans-serif;";
    document.body.appendChild(container);

    // --- メモ（コメント）の取得と優先順位の判定 ---
    // 1人目と2人目のデータを安全に取得（'name' プロパティも候補に追加）
    const selfData = window.tempCompatSelfData || {};
    const partnerData = window.tempCompatPartnerData || {};

    // 1人目のメモ候補（comment, name, memo などのプロパティがあればそれを拾う）
    const selfComment = (selfData.comment || selfData.name || selfData.memo || "").trim();

    // 1人目の基本情報
    const selfBirth = selfData.birthDate || ""; 
    const selfGender = selfData.gender || ""; 

    // 1人目の表示名：メモがあればメモを優先、なければ「生年月日 (性別)」にする
    let label1 = "";
    if (selfComment) {
        label1 = selfComment; // 一人目にメモがあればそれを採用！
    } else if (selfBirth) {
        label1 = selfGender ? `${selfBirth} (${selfGender})` : selfBirth;
    } else {
        label1 = "1人目";
    }

    // 2人目のメモ（いま画面に入力されているコメント欄）
    const partnerCommentInput = document.getElementById('comment-input')?.value || "";
    const partnerComment = (partnerData.comment || partnerData.name || partnerData.memo || partnerCommentInput).trim();
    
    const label2 = partnerComment !== "" ? partnerComment : "お相手";

    // 結合してタイトルを作成
    const combinedMemo = `${label1} + ${label2}`;

    let displayHeaderTitle = `相性診断書・${combinedMemo}`;
    let fileBaseName = `相性診断書・${combinedMemo}`;


    // 4. ヘッダーの組み立て（メモがあれば先頭・大きく表示）
    const infoHeader = document.createElement('div');
    infoHeader.style.cssText = "margin-bottom:20px; border-bottom:2px solid #333; padding-bottom:10px; text-align:center;";
    infoHeader.innerHTML = `
        <div style="font-weight:bold; font-size:20px; color:#1f2937; margin-bottom:5px;">${displayHeaderTitle}</div>
        <div style="font-size:13px; color:#6b7280;">作成日: ${new Date().toLocaleDateString()}</div>
    `;
    container.appendChild(infoHeader);

    // 5. 左右並びの親レイアウトを作成
    const flexWrapper = document.createElement('div');
    flexWrapper.style.cssText = "display:flex; justify-content:space-between; gap:15px; margin-bottom:20px; width:100%; box-sizing:border-box;";

    // --- 画面上の現在の算命学パーツをごっそり取得するヘルパー関数 ---
    function captureCurrentParts(titleText) {
        let finalTitle = titleText;

    if (titleText.includes('1人目') && window.tempCompatSelfData) {
        const comment = window.tempCompatSelfData.comment ? window.tempCompatSelfData.comment.trim() : "";
        const birth = window.tempCompatSelfData.birthDate || "";
        // メモがあれば「メモ（生年月日）」、なければ生年月日やデフォルト名にする
        finalTitle = comment ? `${comment}（${birth}）` : (birth ? `1人目（${birth}）` : titleText);
    } else if (titleText.includes('2人目') && window.tempCompatPartnerData) {
        const comment = window.tempCompatPartnerData.comment ? window.tempCompatPartnerData.comment.trim() : "";
        const birth = window.tempCompatPartnerData.birthDate || "";
        finalTitle = comment ? `${comment}（${birth}）` : (birth ? `2人目（${birth}）` : titleText);
    }

        const personCol = document.createElement('div');
        personCol.style.cssText = "width:48%; background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:12px; box-sizing:border-box;";

        const colTitle = document.createElement('div');
        colTitle.style.cssText = "font-weight:bold; font-size:15px; color:#1e3a8a; border-bottom:2px solid #3b82f6; padding-bottom:6px; margin-bottom:12px; text-align:center;";
        colTitle.textContent = finalTitle; // ★ 書き換えたタイトルをセット！
        personCol.appendChild(colTitle);

        const parts = [
            document.querySelector('.main-area'),
            document.getElementById('shugoshin-result'),
            document.getElementById('body-map'),
            document.querySelector('.side-area')
        ];

        parts.forEach(part => {
            if (part) {
                const clone = part.cloneNode(true);
                const titleEl = clone.querySelector ? clone.querySelector('#display-title') : null;
                if (titleEl) titleEl.style.display = 'none';
                
                clone.style.display = 'block';
                clone.style.marginBottom = '12px';
                personCol.appendChild(clone);
            }
        });
        return personCol;
    }

    try {
        // --- 【A】1人目（ご本人）のデータを画面に反映して計算・キャプチャ ---
        if (window.tempCompatSelfData && window.tempCompatSelfData.birthDate) {
            const p1 = parseBirthDate(window.tempCompatSelfData.birthDate);
            if (p1.year) document.getElementById('year-input').value = p1.year;
            if (p1.month) document.getElementById('month-input').value = p1.month;
            if (p1.day) document.getElementById('day-input').value = p1.day;

            if (window.tempCompatSelfData.gender) {
                const gRadio = document.querySelector(`input[name="gender"][value="${window.tempCompatSelfData.gender === '男性' ? 'male' : 'female'}"]`) ||
                               document.querySelector(`input[name="gender"][value="${window.tempCompatSelfData.gender}"]`);
                if (gRadio) gRadio.checked = true;
            }
            if (typeof performCalculation === 'function') performCalculation();
        }
        const col1 = captureCurrentParts('1人目（ご本人）');

        // --- 【B】2人目（お相手）のデータを画面に反映して計算・キャプチャ ---
        if (window.tempCompatPartnerData && window.tempCompatPartnerData.birthDate) {
            const p2 = parseBirthDate(window.tempCompatPartnerData.birthDate);
            if (p2.year) document.getElementById('year-input').value = p2.year;
            if (p2.month) document.getElementById('month-input').value = p2.month;
            if (p2.day) document.getElementById('day-input').value = p2.day;

            if (window.tempCompatPartnerData.gender) {
                const gRadio = document.querySelector(`input[name="gender"][value="${window.tempCompatPartnerData.gender === '男性' ? 'male' : 'female'}"]`) ||
                               document.querySelector(`input[name="gender"][value="${window.tempCompatPartnerData.gender}"]`);
                if (gRadio) gRadio.checked = true;
            }
            if (typeof performCalculation === 'function') performCalculation();
        }
        const col2 = captureCurrentParts('2人目（お相手）');

        flexWrapper.appendChild(col1);
        flexWrapper.appendChild(col2);
        container.appendChild(flexWrapper);

    } finally {
        // --- 【C】画面の入力値と表示をもとの状態に必ず復元する ---
        if (originalYear) document.getElementById('year-input').value = originalYear;
        if (originalMonth) document.getElementById('month-input').value = originalMonth;
        if (originalDay) document.getElementById('day-input').value = originalDay;
        if (originalGender) {
            const gRadio = document.querySelector(`input[name="gender"][value="${originalGender}"]`);
            if (gRadio) gRadio.checked = true;
        }
        if (originalComment) document.getElementById('comment-input').value = originalComment;
        if (typeof performCalculation === 'function') performCalculation();
    }

    // 6. 相性診断のAI結果パーツの追加
    let aiHtmlContent = typeof window.tempCompatResultText !== 'undefined' ? window.tempCompatResultText : "";

    if (aiHtmlContent) {
        const aiPartElement = document.createElement('div');
        aiPartElement.style.cssText = `
            width: 100%;
            margin-top: 10px;
            margin-bottom: 20px;
            padding: 15px;
            background: #ffffff; 
            border: 1px solid #bbf7d0; 
            border-radius: 8px; 
            font-size: 12pt; 
            line-height: 1.6; 
            color: #1f2937;
            box-sizing: border-box;
            word-break: break-all;
        `;
        aiPartElement.innerHTML = `
            <div style="font-weight: bold; font-size: 13pt; margin-bottom: 10px; border-bottom: 2px solid #bbf7d0; padding-bottom: 5px; color: #166534;">
                【相性診断AI結果】
            </div>
            <div>${aiHtmlContent.replace(/\n/g, '<br>')}</div>
        `;
        container.appendChild(aiPartElement);
    }

    // 7. html2canvas で画像化してファイル名を調整してダウンロード
    try {
        const canvas = await html2canvas(container, {
            scale: 2,
            width: 820,
            backgroundColor: "#fcfbf9"
        });

        canvas.toBlob(blob => {
            if (!blob) return;
            
            // ファイル名に使えない特殊文字を安全な記号に置換
            const safeFileName = fileBaseName.replace(/[\/\-\:\*\?\"\<\>\|]/g, '_');

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${safeFileName}.jpg`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log("【相性画像出力】ダウンロード完了:", `${safeFileName}.jpg`);
        }, "image/jpeg", 0.9);

    } catch (e) {
        console.error("相性画像生成失敗:", e);
        alert("相性診断画像の生成に失敗しました。");
    } finally {
        document.body.removeChild(container);
    }
}

// チャット結果（追加のやり取り）を既存の鑑定結果欄の末尾に直接追加する関数
function appendChatMessage(sender, text) {
    // ★ 最初にAI鑑定結果が表示されるエリアのIDを指定してください（例: 'ai-result-view' や 'result-area' など）
    const resultArea = document.getElementById('ai-chat-messages'); 
    if (!resultArea) {
        console.error("エラー: 鑑定結果を表示するエリアが見つかりません！");
        return;
    }

    // 追加するメッセージ用の wrapper を作成
    const messageDiv = document.createElement('div');
    messageDiv.style.marginTop = "20px";
    messageDiv.style.padding = "15px";
    messageDiv.style.borderRadius = "8px";
    
    if (sender === 'user') {
        // 自分の質問のスタイル
        messageDiv.style.background = "#f0f4f8";
        messageDiv.style.borderLeft = "4px solid #3182ce";
        messageDiv.innerHTML = `<strong>【追加のご質問】</strong><br>${text.replace(/\n/g, '<br>')}`;
    } else {
        // AIの返答のスタイル
        messageDiv.style.background = "#fffaf0";
        messageDiv.style.borderLeft = "4px solid #dd6b20";
        messageDiv.innerHTML = `<strong>【AIからの回答】</strong><br>${text.replace(/\n/g, '<br>')}`;
    }

    // 既存の鑑定結果の「いちばん下（末尾）」に追加する
    resultArea.appendChild(messageDiv);

    // 追加した場所までスムーズにスクロール
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

