// app/callback/page.tsx

import React, { Suspense } from "react";
import CallbackPageClient from "./CallbackPageClient";

export default function CallbackPage() {
  return (
    <Suspense fallback={<p>ロード中...</p>}>
      <CallbackPageClient />
    </Suspense>
  );
}
