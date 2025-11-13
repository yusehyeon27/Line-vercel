// app/callback/CallbackPageClient.tsx
"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function CallbackPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      router.push("/");
      return;
    }

    const exchangeCodeForToken = async () => {
      try {
        const tokenRes = await fetch("/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        if (!tokenRes.ok) {
          console.error("Token exchange failed:", tokenRes.status);
          router.push("/");
          return;
        }

        router.push("/main");
      } catch (err) {
        console.error("Error exchanging code:", err);
        router.push("/");
      }
    };

    exchangeCodeForToken();
  }, [searchParams, router]);

  return (
    <div style={{ textAlign: "center", padding: "40px" }}>
      <p>ログイン中...</p>
    </div>
  );
}
