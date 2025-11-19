"use client";
import { suggestMenusWithAI, type PantryItem } from "@/lib/mealPlanner";
import { useState } from "react";

type Props = {
  items: PantryItem[];
};

export default function MealPlanSection({ items }: Props) {
  const [aiSuggestions, setAiSuggestions] = useState<Awaited<ReturnType<typeof suggestMenusWithAI>>>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);

  if (!items.length) return null;

  const handleAISuggest = async () => {
    setAiLoading(true);
    setAiError(null);
    setRequested(true);
    try {
      const res = await suggestMenusWithAI(items);
      setAiSuggestions(res);
    } catch (e) {
      setAiError("AI提案の取得に失敗しました");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
            AI献立サジェスト
          </p>
          <h2 className="text-xl font-bold text-gray-900">
            今ある食材から作りやすいメニュー
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            在庫名をキーワード解析して、レシピサイトで人気の定番料理にマッチングしました。
            足りない材料があればメモして買い足してください。
          </p>
        </div>

        {/* --- AI提案 --- */}
        <div className="mt-4">
          <p className="text-sm font-bold text-emerald-700">AIのおすすめレシピ</p>
          <button
            className="mb-2 rounded bg-emerald-600 px-4 py-2 text-white font-semibold hover:bg-emerald-700 disabled:bg-gray-300"
            onClick={handleAISuggest}
            disabled={aiLoading}
          >
            {aiLoading ? "AI提案を取得中..." : "AIに献立を提案してもらう"}
          </button>
          {requested && aiError && <p className="text-xs text-red-500">{aiError}</p>}
          {requested && !aiLoading && !aiError && aiSuggestions.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-1">
              {aiSuggestions.map((suggestion) => (
                <article
                  key={suggestion.title}
                  className="rounded-2xl border border-emerald-200 bg-white p-4"
                >
                  <div className="flex flex-col gap-4">
                    <div>
                      <span className="text-lg font-semibold text-emerald-700">
                        {suggestion.title}
                      </span>
                      <p className="text-xs text-emerald-800">
                        出典: {suggestion.source}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700">{suggestion.description}</p>
                    <p className="text-sm font-medium text-gray-900">{suggestion.mainReason}</p>
                    {/* 材料テーブル表示 */}
                    {suggestion.ingredients && suggestion.ingredients.length > 0 && (
                      <div className="mb-2">
                        <p className="text-base font-bold mt-2 mb-1">材料</p>
                        <table className="w-full text-sm border-separate border-spacing-y-1">
                          <tbody>
                            {suggestion.ingredients.map((ing: string, idx: number) => {
                              // "材料名: 分量" の形式を分割
                              const [name, amount] = ing.split(":");
                              return (
                                <tr key={idx}>
                                  <td className="pr-2 text-gray-800 whitespace-nowrap">{name?.trim()}</td>
                                  <td className="text-gray-600">{amount ? amount.trim() : ""}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {/* 手順番号付きリスト */}
                    {suggestion.steps && suggestion.steps.length > 0 && (
                      <div className="mb-2">
                        <p className="text-base font-bold mt-2 mb-1">作り方</p>
                        <ol className="list-decimal list-inside text-sm text-gray-700">
                          {suggestion.steps.map((step: string, idx: number) => (
                            <li key={idx} className="mb-1">{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {suggestion.sides && suggestion.sides.length > 0 && (
                      <p className="text-xs text-gray-600">
                        相性の良い副菜: {suggestion.sides.join(" / ")}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* --- テンプレート提案（定番レシピのおすすめ）は非表示にしました --- */}
      </div>
    </section>
  );
}