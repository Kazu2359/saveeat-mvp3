"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

/** アプリ起動時に SW 登録 → 通知許諾 → 購読 → サーバ保存 */
export default function PushClient() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    (async () => {
      try {
        const supabase = createClient();

        // SW 登録
        const reg = await navigator.serviceWorker.register("/sw.js");
        // 通知許可
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        // 公開鍵取得
        const { publicKey } = await fetch("/api/push/public-key").then(r => r.json());

        // 購読（applicationServerKey は Uint8Array 形式）
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        // ログイン必須
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // サーバに購読情報を保存
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub),
        });
      } catch (e) {
        console.error("PushClient error:", e);
      }
    })();
  }, []);

  return null;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = typeof window !== "undefined" ? window.atob(base64) : "";
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
