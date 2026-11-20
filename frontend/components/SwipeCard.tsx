"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useImperativeHandle, useRef, type Ref } from "react";
import type { Profile, SwipeDirection } from "@/lib/types";
import { Chips } from "./Chips";

export type CardHandle = { swipe: (dir: SwipeDirection) => void };

const THRESHOLD = 110;
const FLING = 600;

export function CardBody({ profile }: { profile: Profile }) {
  return (
    <>
      <div className="relative min-h-0 flex-1 bg-lilac">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={profile.photo} alt={profile.name} draggable={false} className="absolute inset-0 h-full w-full select-none object-cover" />
      </div>
      <div className="flex flex-col gap-2 border-t-2 border-ink bg-white p-4">
        <div className="flex items-baseline gap-2">
          <h2 className="text-[26px] leading-none">{profile.name}</h2>
          <span className="text-[22px] font-extrabold tracking-tight">{profile.age}</span>
        </div>
        <p className="text-[13px] font-semibold text-muted">📍 {profile.city}</p>
        <p className="text-[15px] leading-snug text-muted">{profile.bio}</p>
        <Chips items={profile.interests} />
      </div>
    </>
  );
}

const stamp = "absolute top-6 rounded-xl border-4 bg-white/80 px-3 py-1 text-[28px] font-extrabold tracking-tight";

export function SwipeCard({ profile, onSwiped, ref }: { profile: Profile; onSwiped: (dir: SwipeDirection) => void; ref?: Ref<CardHandle> }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-14, 14]);
  const likeOpacity = useTransform(x, [20, THRESHOLD], [0, 1]);
  const nopeOpacity = useTransform(x, [-THRESHOLD, -20], [1, 0]);

  const flinging = useRef(false);
  const fling = (dir: SwipeDirection) => {
    if (flinging.current) return;
    flinging.current = true;
    const to = dir === "like" ? FLING : -FLING;
    animate(x, to, { duration: 0.28, ease: "easeIn" }).then(() => onSwiped(dir));
  };
  useImperativeHandle(ref, () => ({ swipe: fling }));

  return (
    <motion.div
      className="pop absolute inset-0 flex cursor-grab touch-pan-y flex-col overflow-hidden bg-white active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragSnapToOrigin
      dragElastic={0.9}
      onDragEnd={(_, info) => {
        if (info.offset.x > THRESHOLD || info.velocity.x > 500) fling("like");
        else if (info.offset.x < -THRESHOLD || info.velocity.x < -500) fling("pass");
      }}
    >
      <CardBody profile={profile} />
      <motion.span style={{ opacity: likeOpacity }} className={`${stamp} left-5 -rotate-12 border-ok text-ok`}>
        LIKE
      </motion.span>
      <motion.span style={{ opacity: nopeOpacity }} className={`${stamp} right-5 rotate-12 border-danger text-danger`}>
        NOPE
      </motion.span>
    </motion.div>
  );
}
