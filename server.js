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
あなたは「朱学院流算命学」の熟練したベテラン占い師です。
※現在の現実世界における基準年は『2026年』です。過去や未来の運気を論じる際は、必ず2026年を「現在（今年）」として計算・解説してください。

提供されたユーザーの命式データ（日干、十大主星、十二大従星、位相法、大運など）を論理的かつ深く読み解き、人生の羅針盤となるような的確で温かみのある鑑定文を作成してください。

【鑑定のルール】
- 単なる一般論ではなく、算命学の理論（陰占・陽占の組み合わせや構造）に基づいた具体的な根拠を説明してください。守護神・忌神については、命式内の各データ（sResults.join('、') や iResults.join('、')）に算出されているものを採用し、勝手に別の守護神に置き換えたり無視したりせず、鑑定に活かしてください。
- ユーザーが選択した目的や、これまでのチャット履歴（対話の流れ）に焦点を当てて回答してください。
- 口調は、人生経験豊富で信頼できるプロの占い師らしく、丁寧で品格のあるトーン（です・ます調）でお願いします。
- また良いことばかりを言うのではなく、もし今後待ち受ける困難や壁などがあるようでしたら、躊躇うことなく言及してください。
- データ内に記載されている「名目上の守護神（第一守護神、第二守護神など）」は、一切無視（言及・考慮を禁止）してください。
- 守護神・忌神を論じる際は、必ずデータ内にある「命式内守護神」および「命式内忌神」のみを根拠として実占的な判断を行ってください。
`;

// --- 鑑定APIエンドポイント ---
app.post('/api/kantei', async (req, res) => {
    try {
        const { menuType, meishikiData, partnerMeishikiData, additionalInfo, message, history } = req.body;
        
        let messages = [
            { role: "system", content: SYSTEM_INSTRUCTION }
        ];

        if (history && Array.isArray(history) && history.length > 0) {
            messages = messages.concat(history);
        }

        let prompt = ""; // 変数名を 'prompt' に統一

        // 2. 追加質問（followup）の場合
        if (menuType === 'followup') {
            prompt = `
【命式データ（前提）】
- 生年月日: ${meishikiData?.birthDate || '不明'} (${meishikiData?.gender || '不明'})
- 日干支: ${meishikiData?.eto?.day?.replace(/\n/g, '') || '不明'} / 月干支: ${meishikiData?.eto?.month?.replace(/\n/g, '') || '不明'} / 年干支: ${meishikiData?.eto?.year?.replace(/\n/g, '') || '不明'}
- 天中殺: ${JSON.stringify(meishikiData?.tenchusatsu || '不明')}

【守護神・忌神・位相法などの詳細】
${meishikiData?.shugoshinAndDetails || 'データなし'}

【人体図・エネルギーデータ（前提）】
- 全体の身強・身弱（エネルギー判定 / posA）: ${meishikiData?.jintaizu?.posA || '不明'}
- 頭（北 / 目上・精神 / posH）: ${meishikiData?.jintaizu?.posH || '不明'}
- 右手（東 / 初年期・社会 / posB）: ${meishikiData?.jintaizu?.posB || '不明'}
- 胸（中央 / 主星・本質 / posI）: ${meishikiData?.jintaizu?.posI || '不明'}
- 左手（西 / 晩年期・家庭 / posF）: ${meishikiData?.jintaizu?.posF || '不明'}
- 腹（南 / 目下・結果 / posD）: ${meishikiData?.jintaizu?.posD || '不明'}
- 十二大従星（初年期 / posG）: ${meishikiData?.jintaizu?.posG || meishikiData?.jintaizu?.juunidai_shonen || '不明'}
- 十二大従星（中年期 / posE）: ${meishikiData?.jintaizu?.posE || meishikiData?.jintaizu?.juunidai_chunen || '不明'}
- 十二大従星（晩年期 / posC）: ${meishikiData?.jintaizu?.posC || meishikiData?.jintaizu?.juunidai_bannen || '不明'}

【追加の質問・相談】
${message || '特になし'}

※上記はこれまでの会話の文脈を踏まえた上での「追加の質問」です。上記の正確な命式・守護神データを絶対にブレさせず、これまでのやり取りの流れを汲み取って回答してください。
`;
        } 
        // 3. 相性診断の場合
        else if (menuType && menuType.startsWith('compatibility')) {
            if (!partnerMeishikiData) {
                return res.status(400).json({ error: 'お相手の命式データが見つかりません。先に二人目の算出を行ってください。' });
            }

            prompt = `
以下の2人の算命学のデータを元に、お互いの相性（恋愛・対人関係・精神的な結びつき）を深く鑑定してください。
一人目を本人、二人目をその相手とし、解説の最初に各々の生年月日と性別を明記してください。

【1人目（相談者）のデータ】
- 生年月日: ${meishikiData?.birthDate || '不明'} (${meishikiData?.gender || '不明'})
- 日干支: ${meishikiData?.eto?.day?.replace(/\n/g, '') || '不明'} / 月干支: ${meishikiData?.eto?.month?.replace(/\n/g, '') || '不明'} / 年干支: ${meishikiData?.eto?.year?.replace(/\n/g, '') || '不明'}
- 天中殺: ${JSON.stringify(meishikiData?.tenchusatsu || '不明')}
- 守護神・詳細データ:
${meishikiData?.shugoshinAndDetails || 'データなし'}

【2人目（お相手）のデータ】
- 生年月日: ${partnerMeishikiData?.birthDate || '不明'} (${partnerMeishikiData?.gender || '不明'})
- 日干支: ${partnerMeishikiData?.eto?.day?.replace(/\n/g, '') || '不明'} / 月干支: ${partnerMeishikiData?.eto?.month?.replace(/\n/g, '') || '不明'} / 年干支: ${partnerMeishikiData?.eto?.year?.replace(/\n/g, '') || '不明'}
- 天中殺: ${JSON.stringify(partnerMeishikiData?.tenchusatsu || '不明')}
- 守護神・詳細データ:
${partnerMeishikiData?.shugoshinAndDetails || 'データなし'}

※重要：上記はすでにアプリ内で正確に算出した公式な命式データおよび守護神データです。このデータを絶対の前提としてお互いの相性を鑑定してください。
`;
        } 
        // 4. 通常の各種鑑定（宿命、今年、来年、自由質問など）の場合
        else {
            let menuDescription = "";
            if (menuType === 'shukumei') {
                menuDescription = "この人の本質的な宿命、性格、持って生まれた使命について深く鑑定してください。";
            } else if (menuType === 'this-year') {
                menuDescription = "この人の今年の運勢（2026年時点）について、巡ってくる星や位相法を踏まえて詳しく解説してください。";
            } else if (menuType === 'next-year') {
                menuDescription = "この人の来年の運勢（2027年時点）について詳しく解説してください。";
            } else if (menuType === 'free') {
                menuDescription = `以下の自由な質問に対して回答してください: ${additionalInfo?.freeQuestion || ''}`;
            }

            prompt = `
以下の算命学のデータを基に鑑定を行ってください。なお、データ内に記載されている「名目上の守護神（第一守護神、第二守護神など）」は、一切無視（言及・考慮を禁止）し、守護神・忌神を論じる際は、必ずデータ内にある「命式内守護神」および「命式内忌神」のみを根拠として実占的な判断を行ってください。

【命式データ】
- 生年月日: ${meishikiData?.birthDate || '不明'} (${meishikiData?.gender || '不明'})
- 日干支: ${meishikiData?.eto?.day?.replace(/\n/g, '') || '不明'} / 月干支: ${meishikiData?.eto?.month?.replace(/\n/g, '') || '不明'} / 年干支: ${meishikiData?.eto?.year?.replace(/\n/g, '') || '不明'}
- 天中殺: ${JSON.stringify(meishikiData?.tenchusatsu || '不明')}

【守護神・忌神・位相法などの詳細】
${meishikiData?.shugoshinAndDetails || 'データなし'}

【人体図データ】
【人体図・エネルギーデータ（前提）】
- 全体の身強・身弱（エネルギー判定 / posA）: ${meishikiData?.jintaizu?.posA || '不明'}
- 頭（北 / 目上・精神 / posH）: ${meishikiData?.jintaizu?.posH || '不明'}
- 右手（東 / 初年期・社会 / posB）: ${meishikiData?.jintaizu?.posB || '不明'}
- 胸（中央 / 主星・本質 / posI）: ${meishikiData?.jintaizu?.posI || '不明'}
- 左手（西 / 晩年期・家庭 / posF）: ${meishikiData?.jintaizu?.posF || '不明'}
- 腹（南 / 目下・結果 / posD）: ${meishikiData?.jintaizu?.posD || '不明'}
- 十二大従星（初年期 / posG）: ${meishikiData?.jintaizu?.posG || meishikiData?.jintaizu?.juunidai_shonen || '不明'}
- 十二大従星（中年期 / posE）: ${meishikiData?.jintaizu?.posE || meishikiData?.jintaizu?.juunidai_chunen || '不明'}
- 十二大従星（晩年期 / posC）: ${meishikiData?.jintaizu?.posC || meishikiData?.jintaizu?.juunidai_bannen || '不明'}

【依頼内容】
${menuDescription}
`;
        }

        // 最後にプロンプトをメッセージ配列に格納
        messages.push({ role: "user", content: prompt });

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

    // 🔴 混雑エラー（503 または "high demand"）かどうかをチェックする
    const isBusyError = error.status === 503 || 
                        (error.message && error.message.includes('high demand')) ||
                        (error.message && error.message.includes('UNAVAILABLE'));

    if (isBusyError) {
        // ユーザー向けに親切なメッセージを返す
        return res.status(503).json({
            error: "現在、AIサーバーが非常に混み合っております。お手数ですが、1〜2分ほど時間を置いてから再度お試しください。"
        });
    }

    // その他の通常のエラーの場合
    res.status(500).json({
        error: "AIとの通信中にエラーが発生しました。"
    });
}
});

// Renderから指定されるポートを動的に取得して起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
