"use client";

import { motion } from "framer-motion";
import type { Profile } from "@/lib/types";

const MY_PHOTO = "/avatars/me.jpg";

function Photo({ src, alt, tilt }: { src: string; alt: string; tilt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={`pop h-36 w-36 bg-white object-cover ${tilt}`} />
  );
}

export function MatchScreen({ match, onClose }: { match: Profile; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-pink px-6 text-center"
      role="dialog"
      aria-label="It's a match"
    >
      <div className="absolute inset-x-0 top-0 h-1/3 bg-yellow [clip-path:polygon(0_0,100%_0,100%_60%,0_100%)]" />
      <motion.h1
        initial={{ scale: 0.6, rotate: -6 }}
        animate={{ scale: 1, rotate: -3 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        className="relative text-[52px] leading-[0.95] text-ink"
      >
        it&apos;s a<br />match! 🎉
      </motion.h1>
      <div className="relative flex items-center">
        <Photo src={MY_PHOTO} alt="you" tilt="-rotate-6" />
        <Photo src={match.photo} alt={match.name} tilt="-ml-6 rotate-6" />
      </div>
      <p className="relative max-w-[280px] text-[17px] font-semibold text-ink">
        you and {match.name} liked each other. nobody else knows 🤫
      </p>
      <button onClick={onClose} autoFocus className="pop-btn relative rounded-full bg-yellow px-8 py-3.5 text-[17px] font-extrabold">
        keep swiping
      </button>
    </motion.div>
  );
}
