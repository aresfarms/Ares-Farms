"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();
  const [count, setCount] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => c - 1);
    }, 1000);

    const timeout = setTimeout(() => {
      router.push("/test");
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "Arial" }}>
      <h1>Payment Successful 🎉</h1>

      <p>Your farm report is being unlocked...</p>

      <p>Redirecting in {count} seconds...</p>

      <button onClick={() => router.push("/test")}>
        Go back now
      </button>
    </div>
  );
}
