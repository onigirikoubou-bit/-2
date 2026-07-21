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
        const { menuType, meishikiData, additionalInfo } = req.body;

        // メニューに応じた指示の切り分け
        let menuPrompt = "";
        if (menuType === 'shukumei') {
            menuPrompt = "この人の本質的な宿命、性格、持って生まれた使命について深く鑑定してください。";
        } else if (menuType === 'this-year') {
            menuPrompt = "この人の今年の運勢について、巡ってくる星や位相法（天中殺や刑・害・支合など）を踏まえて詳しく解説してください。";
        } else if (menuType === 'next-year') {
            menuPrompt = "この人の来年の運勢について、どのような心構えで過ごすべきかアドバイスを含めて解説してください。";
        } else if (menuType === 'compatibility') {
            menuPrompt = `この人と、お相手（生年月日: ${additionalInfo.partnerBirthday}, 性別: ${additionalInfo.partnerGender}）との相性（恋愛・対人関係）について、お互いの星の結びつきから深く鑑定してください。`;
        } else if (menuType === 'free') {
            menuPrompt = `以下のご質問・ご相談内容に対して、算命学の観点から具体的にお答えください。\nご相談内容: ${additionalInfo.freeQuestion}`;
        }

        // Geminiに渡す最終的なプロンプト
        const fullPrompt = `
【ユーザーの命式データ】
${JSON.stringify(meishikiData, null, 2)}

【依頼内容】
${menuPrompt}
        `;

        // Gemini APIの呼び出し（最新の推奨モデルを使用）
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: fullPrompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 0.7, // 占い師らしい深みのある表現を引き出すための適度な温度感
            }
        });

        res.json({ result: response.text });

    } catch (error) {
        console.error("AI Kantei Error:", error);
        res.status(500).json({ error: 'AI鑑定の処理中にエラーが発生しました。' });
    }
});

// ② 追加の質問（チャット）用エンドポイント
// ※必要に応じて、過去の会話履歴を保持してやり取りできるように拡張できます
app.post('/api/chat', async (req, res) => {
    try {
        const { question } = req.body;

        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: `先ほどの鑑定を踏まえ、ユーザーからの以下の追加質問にお答えください。\n質問: ${question}`,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
            }
        });

        res.json({ result: response.text });

    } catch (error) {
        console.error("AI Chat Error:", error);
        res.status(500).json({ error: 'チャットの処理中にエラーが発生しました。' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sanmeigaku AI Server running on port ${PORT}`);
});