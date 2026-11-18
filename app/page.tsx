"use client";

import { useState } from "react";
import { Discover } from "@/components/Discover";

type Tab = "home" | "discover";

export default function App() {
  const [tab, setTab] = useState<Tab>("discover");

  return (
    <div className="mx-auto flex h-dvh max-w-[440px] flex-col overflow-hidden bg-white">
      <header className="flex items-center justify-center px-5 pb-1 pt-4">
        <h1 className="text-[30px] leading-none">
          coy<span className="text-pink">.</span>
        </h1>
      </header>

      <main className="min-h-0 flex-1">{tab === "discover" && <Discover />}</main>

      <nav className="grid grid-cols-2 border-t-2 border-line bg-white pb-[env(safe-area-inset-bottom)]">
        {(["home", "discover"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-current={tab === t}
            className={`py-3.5 text-[15px] font-extrabold capitalize ${tab === t ? "text-ink" : "text-muted"}`}
          >
            <span className={`border-b-[3px] pb-0.5 ${tab === t ? "border-pink" : "border-transparent"}`}>{t}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
