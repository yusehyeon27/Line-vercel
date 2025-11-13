"use client";

import { useState } from "react";

export default function ReservationPage() {
  const [userList, setUserList] = useState([]);

  const handleLogin = () => {
    const authUrl = new URL(
      "https://auth.worksmobile.com/oauth2/v2.0/authorize"
    );
    authUrl.searchParams.set("client_id", process.env.NEXT_PUBLIC_CLIENT_ID!);
    authUrl.searchParams.set(
      "redirect_uri",
      process.env.NEXT_PUBLIC_REDIRECT_URI!
    );
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", process.env.NEXT_PUBLIC_SCOPE!);
    authUrl.searchParams.set("state", "lineworks_oauth");
    // redirect to LINE WORKS OAuth
    window.location.href = authUrl.toString();
  };
  // NOTE: do not log secrets or client ids in production

  return (
    <div>
      <h1>LINEWORKS ログイン</h1>
      <button
        onClick={handleLogin}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        ログイン
      </button>
      {/* debug URL removed */}
    </div>
  );
}
