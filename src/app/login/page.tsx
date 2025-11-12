"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");

const handleAuth = async () => {
  setError("");

  let result;
  if (mode === "login") {
    result = await supabase.auth.signInWithPassword({ email, password });
  } else {
    result = await supabase.auth.signUp({ email, password });
  }

  if (result.error) setError(result.error.message);
  else router.push("/");
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-80">
        <h1 className="text-2xl font-bold text-center mb-4 text-gray-800">
          {mode === "login" ? "ログイン" : "新規登録"}
        </h1>

        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-gray-300 w-full mb-3 p-2 rounded focus:border-black focus:ring-1 focus:ring-black"
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-300 w-full mb-4 p-2 rounded focus:border-black focus:ring-1 focus:ring-black"
        />

        <button
          onClick={handleAuth}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition font-semibold"
        >
          {mode === "login" ? "ログイン" : "登録"}
        </button>

        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="text-sm text-blue-600 mt-4 w-full hover:underline"
        >
          {mode === "login" ? "アカウントを作成する" : "すでに登録済みの方はこちら"}
        </button>
      </div>
    </div>
  );
}
