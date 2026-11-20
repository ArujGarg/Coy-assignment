const TINTS = ["bg-lilac", "bg-mint", "bg-peach", "bg-sky", "bg-yellow"];

export function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it, i) => (
        <span key={it} className={`${TINTS[i % TINTS.length]} rounded-full border-[1.5px] border-ink px-2.5 py-0.5 text-[12px] font-bold`}>
          {it}
        </span>
      ))}
    </div>
  );
}
