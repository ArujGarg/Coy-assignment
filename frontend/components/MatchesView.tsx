import type { Profile } from "@/lib/types";
import { Chips } from "./Chips";

const FILLS = ["bg-lilac", "bg-mint", "bg-peach", "bg-sky"];

function ResetLink({ onReset }: { onReset: () => void }) {
  return (
    <button onClick={onReset} className="mx-auto mt-2 shrink-0 text-[13px] font-extrabold text-muted underline decoration-2 underline-offset-4">
      ↺ reset demo
    </button>
  );
}

export function MatchesView({ matches, onReset }: { matches: Profile[]; onReset: () => void }) {
  if (matches.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
        <div className="text-5xl">💌</div>
        <h2 className="text-[24px]">no matches yet</h2>
        <p className="text-muted">keep swiping. mutual likes show up here.</p>
        <ResetLink onReset={onReset} />
      </div>
    );
  }
  return (
    <ul className="flex h-full flex-col gap-4 overflow-y-auto px-5 pb-6 pt-2">
      {matches.map((m, i) => (
        <li key={m.id} className={`pop flex gap-3 p-3 ${FILLS[i % FILLS.length]}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.photo} alt={m.name} className="h-20 w-20 shrink-0 rounded-2xl border-2 border-ink object-cover" />
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="text-[20px] leading-none">
              {m.name}, {m.age}
            </h3>
            <p className="text-[13px] font-semibold text-muted">📍 {m.city}</p>
            <Chips items={m.interests.slice(0, 2)} />
          </div>
        </li>
      ))}
      <ResetLink onReset={onReset} />
    </ul>
  );
}
