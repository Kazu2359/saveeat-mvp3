import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();
    if (!Array.isArray(items)) {
      console.error("Invalid items format", items);
      return NextResponse.json({ error: "items must be array" }, { status: 400 });
    }
    const ingredientList = items.map((i: any) => i.name).join("、");
    const prompt = `あなたはプロの家庭料理研究家です。次の食材を使った日本の家庭料理を1つ提案してください。食材: ${ingredientList}。\n\n【出力フォーマット】\n{\"title\":...,\"description\":...,\"ingredients\":[\"材料名: 分量\",...],\"steps\":[...]}\n\n【要件】\n・レシピ名（title）、説明（description）、必要な材料（ingredients: 材料名: 分量 の配列）、手順（steps: 1手順ごとの配列）を必ず含めてください。\n・手順は具体的に、家庭で再現できるように日本語で詳しく書いてください。\n・材料は必ず分量も記載し、'材料名: 分量' の形式で配列にしてください。\n・全体をJSON形式で返してください。`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY is not set");
      return NextResponse.json({ error: "OPENAI_API_KEYが未設定です" }, { status: 500 });
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });
    if (!res.ok) {
      console.error("OpenAI API request failed", res.status, await res.text());
      return NextResponse.json({ error: "OpenAI APIリクエスト失敗" }, { status: 500 });
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error("OpenAI API response is empty", data);
      return NextResponse.json({ error: "AI応答が空です" }, { status: 500 });
    }
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        console.error("Failed to parse AI response", content);
        return NextResponse.json({ error: "AI応答のパースに失敗" }, { status: 500 });
      }
    }
    return NextResponse.json({ suggestion: parsed });
  } catch (e) {
    console.error("Server error", e);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
