"use client";

import { useEffect, useRef, useState } from "react";

const FULL_TEXT = "Cristin's Luscious";
const TYPING_SPEED = 70;
const PAUSE_AFTER_TYPING = 500;
const FADE_DURATION = 500;

export default function Preloader() {
  const [displayed, setDisplayed] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [hidden, setHidden] = useState(false);
  const cursorRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    let index = 0;
    const typingInterval = setInterval(() => {
      if (index < FULL_TEXT.length) {
        setDisplayed(FULL_TEXT.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typingInterval);
        if (cursorRef.current) clearInterval(cursorRef.current);
        setShowCursor(false);

        setTimeout(() => setIsFading(true), PAUSE_AFTER_TYPING);
        setTimeout(() => {
          setHidden(true);
          document.body.style.overflow = "";
        }, PAUSE_AFTER_TYPING + FADE_DURATION);
      }
    }, TYPING_SPEED);

    cursorRef.current = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);

    return () => {
      clearInterval(typingInterval);
      if (cursorRef.current) clearInterval(cursorRef.current);
      document.body.style.overflow = "";
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-bg"
      style={{
        transition: `opacity ${FADE_DURATION}ms ease-out`,
        opacity: isFading ? 0 : 1,
      }}
    >
      <h1
        className="font-script text-4xl md:text-6xl lg:text-7xl font-bold text-brand-dark tracking-wider select-none"
        aria-label={FULL_TEXT}
      >
        {displayed}
        {showCursor && (
          <span className="inline-block ml-1 w-0.75 h-[1em] bg-brand-dark align-middle animate-pulse" />
        )}
      </h1>
    </div>
  );
}
