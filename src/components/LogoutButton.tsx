"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/login");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "ログアウトに失敗しました";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-full border border-gray-200 px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-60"
    >
      {loading ? "ログアウト中..." : "ログアウト"}
    </button>
  );
}
