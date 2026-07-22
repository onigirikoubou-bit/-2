const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

// Renderの環境変数（GEMINI_API_KEY）からAPIキーを自動読み込み
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 朱学院流のベテラン占い師としての「システムプロンプト（ペルソナ）」
const SYSTEM_INSTRUCTION = `
あなたは「朱学院流算命学」の熟練したベテラン占い師です。
提供されたユーザーの命式データ（日干、十大主星、十二大従星、位相法、大運など）を論理的かつ深く読み解き、人生の羅針盤となるような的確で温かみのある鑑定文を作成してください。

【鑑定のルール】
- 単なる一般論ではなく、算命学の理論（陰占・陽占の組み合わせや構造）に基づいた具体的な根拠を説明してください。
- ユーザーが選択した目的（宿命、今年の運勢、来年の運勢、相性、自由な質問）に焦点を当てて回答してください。
- 口調は、人生経験豊富で信頼できるプロの占い師らしく、丁寧で品格のあるトーン（です・ます調）でお願いします。
`;

// ① 初回鑑定のエンドポイント
app.post('/api/kantei', async (req, res) => {
    try {
        // ★ partnerMeishikiData も受け取れるように分割代入に追加します
        const { menuType, meishikiData, partnerMeishikiData, additionalInfo } = req.body;

        // メニューに応じた指示の切り分け
        let menuPrompt = "";
        
        // 相性診断系かどうかの判定
if (menuType.startsWith('compatibility') && partnerMeishikiData) {
    
    // どちらの相性かを判定して指示文を変える
    let relationFocus = "";
    if (menuType === 'compatibility-love') {
        relationFocus = "【視点の指定】恋愛・結婚パートナーとしての相性を重視してください。お互いの惹かれ合う部分、異性としての引き合い、家庭環境や夫婦としての結びつき、愛情表現の違いなどを深く鑑定してください。";
    } else {
        relationFocus = "【視点の指定】ビジネスや友人などの一般対人関係としての相性を重視してください。お互いの役割分担、仕事上の相性、コミュニケーションの取り方、衝突しやすいポイントへのアドバイスを深く鑑定してください。";
    }

    menuPrompt = `
    
以下の2人の算命学のデータを元に、お互いの相性（恋愛・対人関係・精神的な結びつき）を深く鑑定してください。
合法・散法（位相法）、お互いの守護神や忌神、日干の結びつきなどを総合的に分析してください。
懸念するべき点があれば遠慮なく指摘してください。陰占と陽占で各々の項目で判定し、点数をつけてください。
解説の最初に各々の生年月日と性別を明記してください。

${relationFocus}

【1人目（相談者）のデータ】
- 生年月日: ${meishikiData?.birthDate || '不明'} (${meishikiData?.gender || '不明'})
- 日干支: ${meishikiData?.eto?.day || '不明'} / 月干支: ${meishikiData?.eto?.month || '不明'} / 年干支: ${meishikiData?.eto?.year || '不明'}
- 天中殺: ${JSON.stringify(meishikiData?.tenchusatsu || '不明')}
- 守護神: ${JSON.stringify(meishikiData?.shugoshin || '不明')}

【2人目（お相手）のデータ】
- 生年月日: ${partnerMeishikiData.birthDate || additionalInfo?.partnerBirthday} (${additionalInfo?.partnerGender})
- 日干支: ${partnerMeishikiData.eto?.day || '不明'} / 月干支: ${partnerMeishikiData.eto?.month || '不明'} / 年干支: ${partnerMeishikiData.eto?.year || '不明'}
- 天中殺: ${JSON.stringify(partnerMeishikiData.tenchusatsu || '不明')}
- 守護神: ${JSON.stringify(partnerMeishikiData.shugoshin || '不明')}

`;
        } else {
            if (menuType === 'shukumei') {
            menuPrompt = "この人の本質的な宿命、性格、持って生まれた使命について深く鑑定してください。";
        } else if (menuType === 'this-year') {
            menuPrompt = "この人の今年の運勢について、巡ってくる星や位相法（天中殺や刑・害・支合など）を踏まえて詳しく解説してください。";
        } else if (menuType === 'next-year') {
            menuPrompt = "この人の来年の運勢について、どのような心構えで過ごすべきかアドバイスを含めて解説してください。";
        } else if (menuType === 'free') {
            menuPrompt = `以下のご質問・ご相談内容に対して、朱学院流の算命学の観点から具体的にお答えください。\nご相談内容: ${additionalInfo.freeQuestion}`;
        }
            // Geminiに渡す最終的なプロンプト
        const fullPrompt = `
【ユーザーの命式データ】
${JSON.stringify(meishikiData, null, 2)}

【依頼内容】
${menuPrompt}
        `;
        }

        // --- AIモデルの呼び出し処理 ---
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: [{ role: 'user', parts: [{ text: menuPrompt }] }],
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 0.7, // 占い師らしい深みのある表現を引き出すための適度な温度感
            }
        });

        res.json({ result: response.text });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'エラーが発生しました。' });
    }
});

// ② 追加の質問（チャット）用エンドポイント
// ※必要に応じて、過去の会話履歴を保持してやり取りできるように拡張できます
app.post('/api/chat', async (req, res) => {
    try {
        const { message, meishiki } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'メッセージがありません。' });
        }

        // 命式データが送られてきている場合、プロンプトの前提としてAIに伝える
        let contextPrompt = "";
        if (meishiki) {
            contextPrompt = `
【相談者の命式データ前提】
- 生年月日: ${meishiki.birthDate}
- 性別: ${meishiki.gender}
- 年齢: ${meishiki.age}
- 日干支: ${meishiki.eto?.day || '不明'} / 月干支: ${meishiki.eto?.month || '不明'} / 年干支: ${meishiki.eto?.year || '不明'}
- 天中殺: ${meishiki.tenchusatsu?.nichi || '不明'}
- 主要な星（人体図）: 主気(pos-a): ${meishiki.jintaizu?.posA || '--'}, 初年: ${meishiki.jintaizu?.posH || '--'}, 中年: ${meishiki.jintaizu?.posE || '--'}, 晩年: ${meishiki.jintaizu?.posC || '--'}
- その他詳細: ${meishiki.shugoshinAndDetails || 'なし'}
--------------------------------------------------
`;
        }

        // チャット用のAIモデルを呼び出し（systemInstructionに命式データを含めるか、ユーザーメッセージの前に付与する）
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash', // またはお使いのモデル名
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: `${contextPrompt}\nユーザーからの追加質問・相談:\n${message}` }
                    ]
                }
            ],
            config: {
                systemInstruction: "あなたは優秀な算命学の鑑定士です。上記の相談者の命式データを念頭に置き、追加の質問や相談に対して、一貫性のある的確で心に寄り添うアドバイスを行ってください。"
            }
        });

        res.json({ reply: response.text });

    } catch (error) {
        console.error("Chat API Error:", error);
        res.status(500).json({ error: 'AIとの通信中にエラーが発生しました。' });
    }
});