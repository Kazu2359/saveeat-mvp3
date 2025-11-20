import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

type PantryItem = { name: string; quantity?: number | null };

export async function POST(req: NextRequest) {
  try {
    const { items } = (await req.json().catch(() => ({}))) as { items?: PantryItem[] };
    if (!Array.isArray(items)) {
      console.error("Invalid items format", items);
      return NextResponse.json({ error: "items must be array" }, { status: 400 });
    }

    const names = items.map((item) => item.name).filter(Boolean);
    if (names.length === 0) {
      return NextResponse.json({ error: "食材を1つ以上入力してください" }, { status: 400 });
    }

    const ingredientList = names.join("、");
    const prompt = `あなたはプロの家庭料理研究家です。次の食材を使った日本の家庭料理を1品提案してください。食材: ${ingredientList}\n\n【出力フォーマット】\n{"title": "...", "description": "...", "ingredients": ["材料A 100g", "材料B 1個"], "steps": ["手順1", "手順2"]}\n\n【要件】\n・title/description/ingredients/steps をすべて含めて JSON のみで返してください（余計な文章は禁止）。\n・ingredients は「材料名 分量」の形式で配列にしてください。\n・steps は家庭で再現できるように具体的に日本語で書いてください。`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY is not set");
      return NextResponse.json({ error: "OPENAI_API_KEY が未設定です" }, { status: 500 });
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      console.error("OpenAI API request failed", res.status, await res.text());
      return NextResponse.json({ error: "OpenAI API リクエストに失敗しました" }, { status: 500 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error("OpenAI API response is empty", data);
      return NextResponse.json({ error: "AI 応答が空です" }, { status: 500 });
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
        return NextResponse.json({ error: "AI 応答のパースに失敗しました" }, { status: 500 });
      }
    }

    return NextResponse.json({ suggestion: parsed });
  } catch (e) {
    console.error("Server error", e);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
