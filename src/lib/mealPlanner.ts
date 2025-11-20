/**
 * OpenAI API を使って食材リストからレシピ提案を生成する
 */
export async function suggestMenusWithAI(items: PantryItem[]): Promise<MenuSuggestion[]> {
  const res = await fetch("/api/ai-menu", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error("AI提案の取得に失敗しました");

  const data = await res.json();
  if (!data.suggestion) throw new Error("AI提案の取得に失敗しました");

  const parsed = data.suggestion;
  return [
    {
      title: parsed.title,
      url: "",
      source: "AI提案",
      description: parsed.description,
      mainReason: `手元の食材からAIが提案しました`,
      missing: [],
      sides: parsed.sides || [],
      ingredients: parsed.ingredients || [],
      steps: parsed.steps || [],
    },
  ];
}

export type PantryItem = {
  name: string;
  quantity?: number | null;
};

export type MenuSuggestion = {
  title: string;
  url: string;
  source: string;
  description: string;
  mainReason: string;
  missing: string[];
  sides?: string[];
  ingredients?: string[];
  steps?: string[];
};
