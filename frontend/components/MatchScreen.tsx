"use client";

import { motion, type Variants } from "framer-motion";
import type { Profile } from "@/lib/types";

const ME_PHOTO = "/avatars/me.jpg"; // the single hardcoded user

const fade: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } },
};

function Circle({ src, alt, from }: { src: string; alt: string; from: number }) {
  return (
    <motion.div
      initial={{ x: from, opacity: 0, scale: 0.6 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 180, damping: 16, delay: 0.1 }}
      className="h-[92px] w-[92px] overflow-hidden rounded-full border-2 border-ink bg-lilac"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-cover" />
    </motion.div>
  );
}

// little hearts drifting up behind the content
const FLOATERS = [
  { left: "12%", delay: 0.2, size: 22 },
  { left: "28%", delay: 0.7, size: 16 },
  { left: "70%", delay: 0.4, size: 24 },
  { left: "86%", delay: 0.9, size: 18 },
  { left: "50%", delay: 1.2, size: 14 },
];

export function MatchScreen({ match, onClose, onViewMatches }: { match: Profile; onClose: () => void; onViewMatches: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-pink px-6 text-center"
      role="dialog"
      aria-label="It's a match"
    >
      {FLOATERS.map((f, i) => (
        <motion.span
          key={i}
          aria-hidden
          initial={{ y: "60vh", opacity: 0 }}
          animate={{ y: "-60vh", opacity: [0, 0.7, 0] }}
          transition={{ duration: 3.4, delay: f.delay, repeat: Infinity, ease: "easeOut" }}
          style={{ left: f.left, fontSize: f.size }}
          className="absolute"
        >
          💗
        </motion.span>
      ))}

      <motion.div
        variants={{ show: { transition: { staggerChildren: 0.1, delayChildren: 0.35 } } }}
        initial="hidden"
        animate="show"
        className="relative flex flex-col items-center"
      >
        <div className="relative mb-6 flex items-center">
          <Circle src={ME_PHOTO} alt="you" from={-60} />
          <motion.div
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: [0, 1.3, 1], rotate: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="absolute left-1/2 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border-2 border-ink bg-pink text-[15px]"
          >
            <motion.span animate={{ scale: [1, 1.25, 1] }} transition={{ delay: 1, duration: 0.9, repeat: Infinity }}>
              💘
            </motion.span>
          </motion.div>
          <div className="-ml-3">
            <Circle src={match.photo} alt={match.name} from={60} />
          </div>
        </div>

        <motion.h1 variants={fade} className="text-[44px] leading-none text-ink">
          It&apos;s a match!
        </motion.h1>
        <motion.p variants={fade} className="mt-4 text-[17px] font-medium text-ink">
          you and {match.name} liked each other.
        </motion.p>
        <motion.p variants={fade} className="mt-1 text-[14px] text-ink/70">
          nobody else knows 🤫
        </motion.p>

        <motion.button
          variants={fade}
          whileTap={{ x: 3, y: 3, boxShadow: "0 0 0 var(--text)" }}
          onClick={onClose}
          autoFocus
          className="mt-8 w-[min(320px,80vw)] rounded-full border-2 border-ink bg-white py-3.5 text-[16px] font-extrabold shadow-[3px_3px_0_var(--text)]"
        >
          keep swiping
        </motion.button>
        <motion.button variants={fade} onClick={onViewMatches} className="mt-4 text-[14px] font-extrabold underline decoration-2 underline-offset-4">
          view matches
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
