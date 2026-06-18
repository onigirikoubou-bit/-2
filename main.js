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

    // 画面に表示する
    render: () => {
        const list = document.getElementById('history-list');
        if (!list) return;

        const data = localStorage.getItem('searchHistory');
        const history = data ? JSON.parse(data) : [];

        list.innerHTML = history.map((h, index) => {
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
}

// --- 【新機能の統合】 ---
    // const を消して、既存の値を再利用します
    let comment = document.getElementById('comment-input').value;
    const result = document.getElementById('pos-a').innerText;
    const daiun = document.getElementById('daiun-table-body').innerText;

    // ※ y, m, d は関数の最初で定義したものをそのまま使います

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
    console.log("コピー成功！");
};
    
// 2. 履歴保存を実行
    try {
        const y = document.getElementById('year-input')?.value || "0000";
        const m = document.getElementById('month-input')?.value || "00";
        const d = document.getElementById('day-input')?.value || "00";
        
        const commentInput = document.getElementById('comment-input')?.value;
        const title = (commentInput && commentInput.trim() !== "") ? commentInput.trim() : "";
        // 【追加】ここで本当にコメントが取れているか確認！
console.log("保存しようとしているタイトル:", title); 

        // 履歴保存と反映をセットで実行
        if (typeof HistoryModule !== 'undefined') {
            HistoryModule.save(`${y}/${m}/${d}`, title);
            HistoryModule.render(); 
        } else {
            console.error("HistoryModuleが見つかりません");
        }
    } catch (e) {
        console.error("履歴保存中にエラーが発生しました:", e);
    }
}
// const を let に変更する
let y = document.getElementById('year-input').value;
let m = document.getElementById('month-input').value;
let d = document.getElementById('day-input').value;
comment = document.getElementById('comment-input').value;

HistoryModule.save(`${y}/${m}/${d}`, comment);
HistoryModule.render();

// ==========================================
// 4. 初期化イベント (全てここに統合)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. 計算ボタンのイベント一本化 ---
    const calcBtn = document.getElementById('calc-btn');
    if (calcBtn) {
        // 古いイベントを確実に消すために複製して置換
        const newCalcBtn = calcBtn.cloneNode(true);
        calcBtn.parentNode.replaceChild(newCalcBtn, calcBtn);

        newCalcBtn.addEventListener('click', () => {
            performCalculation(); // 計算

            const y = document.getElementById('year-input')?.value || "0000";
            const m = document.getElementById('month-input')?.value || "00";
            const d = document.getElementById('day-input')?.value || "00";
            const comment = document.getElementById('comment-input')?.value || "";

            HistoryModule.save(`${y}/${m}/${d}`, comment); // 保存
            HistoryModule.render(); // 表示更新
            console.log("計算完了: 履歴を1行だけ保存しました");
        });
    }

    // --- 2. 保存ボタンのイベント登録 ---
    const saveBtn = document.getElementById('share-or-copy-btn');
    if (saveBtn) {
        saveBtn.setAttribute('onclick', ''); 
        saveBtn.removeEventListener('click', saveResultHandler);
        saveBtn.addEventListener('click', saveResultHandler);
        saveBtn.style.display = 'block';
        console.log("画像保存ボタンを設定しました");
    }

    // --- 3. ページ初回読み込み時の履歴表示 ---
    HistoryModule.render();
    console.log("初期履歴を表示しました");
});

// --- saveResultHandler 関数はここより下（DOMContentLoadedの外）に定義してください ---
async function saveResultHandler() {
    const originalArea = document.getElementById('result-area');
    if (!originalArea) return;

    // 1. 隠しコンテナ (幅580px固定)
    const container = document.createElement('div');
    container.style.cssText = "position:absolute; left:-9999px; top:0; width:580px; background:#fcfbf9; padding:20px; display:block; box-sizing:border-box;";
    document.body.appendChild(container);

    // 2. タイトルとコメントの取得＆日付フォーマット加工
    const historyList = document.getElementById('history-list');
    let displayTitle = historyList?.innerText ? historyList.innerText.split('\n')[0].trim() : "算命学・命式算出";
    
    // タイトルの日付部分（例: 1988/6/3-）を探して「生」を付ける
    // 日付-見出しの形式と仮定して、'-' の直前に「生」を挿入
    if (displayTitle.includes('/')) {
        displayTitle = displayTitle.replace('-', '生-');
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

    parts.forEach(part => {
        if (part) {
            const clone = part.cloneNode(true);
            const titleEl = clone.querySelector('#display-title');
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
            width: 580,
            backgroundColor: "#fcfbf9"
        });

        canvas.toBlob(blob => {
            if (!blob) return;

            // --- ファイル名の生成ロジック ---
            const historyList = document.getElementById('history-list');
            const rawComment = historyList ? historyList.innerText.trim() : "";
            const firstLine = rawComment.split('\n')[0].trim();
            
            let fileName = "";
            
            if (firstLine && firstLine.length > 0) {
                // 1. コメントがある場合：
                // 「1989/3/31 - コメントテスト」などの形式を想定
                // 「/」はファイル名に使えないため「_」に置換し、6文字切り出し
                const cleanComment = firstLine.replace(/\//g, '_').replace(/-/g, '_');
                fileName = cleanComment.substring(0, 6);
            } else {
                // 2. コメントがない場合：
                const y = document.getElementById('year-input')?.value || "0000";
                const m = document.getElementById('month-input')?.value || "0";
                const d = document.getElementById('day-input')?.value || "0";
                fileName = `鑑定${y}_${m}_${d}`;
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
