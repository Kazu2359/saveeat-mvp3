"use client";

export default function DeleteButton({ action }: { action: (formData: FormData) => void }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("本当に削除しますか？")) e.preventDefault();
      }}
    >
      <button type="submit" className="text-xs text-red-600 underline hover:text-red-800">
        🗑️ 削除
      </button>
    </form>
  );
}
