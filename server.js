const express = require('cors') && require('express'); // または const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

// ★ 正しい初期化：オプションに空のオブジェクトを指定し、環境変数（GEMINI_API_KEY）を自動読み込みさせる
const ai = new GoogleGenAI({});

// 朱学院流のベテラン占い師としての「システムプロンプト（ペルソナ）」
const SYSTEM_INSTRUCTION = `
あなたは「朱学院流算命学」の熟練したベテラン占い師です。提供された正確な命式データ、天中殺、守護神、位相法等を基に、論理的かつ温かみのある的確なアドバイスを行ってください。
`;

// --- 鑑定APIエンドポイント ---
app.post('/api/kantei', async (req, res) => {
    try {
        const { menuType, meishikiData, partnerMeishikiData, additionalInfo } = req.body;
        let prompt = "";

        // 相性診断の判定
        if (menuType && menuType.startsWith('compatibility')) {
            if (!partnerMeishikiData) {
                return res.status(400).json({ error: 'お相手の命式データが見つかりません。先に二人目の算出を行ってください。' });
            }

            prompt = `
以下の2人の算命学のデータを元に、お互いの相性を深く鑑定してください。
合法・散法（位相法）、お互いの守護神や忌神、日干の結びつき、星の巡り合わせなどを総合的に分析してください。

【1人目（相談者）のデータ】
- 生年月日: ${meishikiData?.birthDate || '不明'} (${meishikiData?.gender || '不明'})
- 日干支: ${meishikiData?.eto?.day || '不明'} / 月干支: ${meishikiData?.eto?.month || '不明'} / 年干支: ${meishikiData?.eto?.year || '不明'}
- 天中殺: ${JSON.stringify(meishikiData?.tenchusatsu || '不明')}
- 守護神: ${JSON.stringify(meishikiData?.shugoshin || '不明')}

【2人目（お相手）のデータ】
- 生年月日: ${partnerMeishikiData?.birthDate || '不明'} (${partnerMeishikiData?.gender || '不明'})
- 日干支: ${partnerMeishikiData?.eto?.day || '不明'} / 月干支: ${partnerMeishikiData?.eto?.month || '不明'} / 年干支: ${partnerMeishikiData?.eto?.year || '不明'}
- 天中殺: ${JSON.stringify(partnerMeishikiData?.tenchusatsu || '不明')}
- 守護神: ${JSON.stringify(partnerMeishikiData?.shugoshin || '不明')}

※重要：上記はすでにアプリ内で正確に算出した公式な命式データです。この正確な天中殺や星のデータを前提として、お互いの相性を鑑定してください。
`;
        } else {
            let menuDescription = "";
            if (menuType === 'shukumei') {
                menuDescription = "この人の本質的な宿命、性格、持って生まれた使命について深く鑑定してください。";
            } else if (menuType === 'this-year') {
                menuDescription = "この人の今年の運勢について、巡ってくる星や位相法を踏まえて詳しく解説してください。";
            } else if (menuType === 'next-year') {
                menuDescription = "この人の来年の運勢について詳しく解説してください。";
            } else if (menuType === 'free') {
                menuDescription = `以下の自由な質問に対して回答してください: ${additionalInfo?.freeQuestion || ''}`;
            }

            prompt = `
以下の算命学のデータを基に鑑定を行ってください。

【命式データ】
- 生年月日: ${meishikiData?.birthDate || '不明'} (${meishikiData?.gender || '不明'})
- 日干支: ${meishikiData?.eto?.day || '不明'} / 月干支: ${meishikiData?.eto?.month || '不明'} / 年干支: ${meishikiData?.eto?.year || '不明'}
- 天中殺: ${JSON.stringify(meishikiData?.tenchusatsu || '不明')}
- 守護神: ${JSON.stringify(meishikiData?.shugoshin || '不明')}

【依頼内容】
${menuDescription}
`;
        }

        // --- AIモデルの呼び出し処理 ---
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash', // 推奨される最新の汎用モデル
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 0.7,
            }
        });

        res.json({ result: response.text });

    } catch (error) {
        console.error("Kantei API Error:", error);
        res.status(500).json({ error: 'AIとの通信中にエラーが発生しました。' });
    }
});

// Renderから指定されるポートを動的に取得して起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});