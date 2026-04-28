import { motion } from "framer-motion";
import type { CatColor } from "../lib/types";

const palette: Record<
  CatColor,
  { body: string; belly: string; stripe: string; ear: string; nose: string }
> = {
  ginger: {
    body: "#F2A65A",
    belly: "#FFE3C2",
    stripe: "#C97A3F",
    ear: "#FFB1C8",
    nose: "#FF8FB1",
  },
  tuxedo: {
    body: "#2B2730",
    belly: "#FFFFFF",
    stripe: "#1A1820",
    ear: "#FFB1C8",
    nose: "#FF8FB1",
  },
  calico: {
    body: "#FFD9B7",
    belly: "#FFF7EC",
    stripe: "#C97A3F",
    ear: "#FFB1C8",
    nose: "#FF8FB1",
  },
  siamese: {
    body: "#F4E1C9",
    belly: "#FFF7EC",
    stripe: "#3B2A20",
    ear: "#FFB1C8",
    nose: "#FF8FB1",
  },
};

type Props = {
  color?: CatColor;
  expression?: "smug" | "sleepy" | "happy" | "angry";
  size?: number;
  className?: string;
  /** 0..1 — increases jiggle/breath intensity (used during break to feel alive) */
  intensity?: number;
  /** Drives "fed" tummy bulge when feeding interaction triggers */
  fed?: number;
  pets?: number;
};

export function Cat({
  color = "ginger",
  expression = "smug",
  size = 360,
  className,
  intensity = 0.6,
  fed = 0,
  pets = 0,
}: Props) {
  const c = palette[color];
  const tummyScale = 1 + Math.min(0.08, fed * 0.012);
  const blush = pets > 0 ? Math.min(0.7, pets * 0.05) : 0;

  return (
    <motion.svg
      viewBox="0 0 400 360"
      width={size}
      height={(size * 360) / 400}
      className={className}
      animate={{ y: [0, -6 * intensity, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      role="img"
      aria-label="Fat cat"
    >
      <defs>
        <radialGradient id="bellyGrad" cx="50%" cy="55%" r="60%">
          <stop offset="0%" stopColor={c.belly} stopOpacity="1" />
          <stop offset="100%" stopColor={c.belly} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bodyShade" cx="65%" cy="35%" r="80%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Tail */}
      <motion.path
        d="M 60 240 Q 20 220 30 170 Q 40 130 80 130"
        stroke={c.body}
        strokeWidth="22"
        strokeLinecap="round"
        fill="none"
        style={{ originX: "60px", originY: "240px" }}
        animate={{ rotate: [-8, 12, -8] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Body — chubby blob */}
      <motion.ellipse
        cx="200"
        cy="230"
        rx="160"
        ry="115"
        fill={c.body}
        animate={{ scaleX: [1, 1.02, 1], scaleY: [1, 0.985, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "200px 230px" }}
      />
      {/* Belly */}
      <ellipse
        cx="200"
        cy={245}
        rx={120 * tummyScale}
        ry={80 * tummyScale}
        fill="url(#bellyGrad)"
      />
      {/* Stripes */}
      {color !== "tuxedo" && color !== "siamese" && (
        <g opacity="0.55" stroke={c.stripe} strokeLinecap="round" strokeWidth="6" fill="none">
          <path d="M 90 200 Q 110 190 130 200" />
          <path d="M 270 200 Q 290 190 310 200" />
          <path d="M 80 235 Q 105 225 130 235" />
          <path d="M 270 235 Q 295 225 320 235" />
        </g>
      )}
      {color === "siamese" && (
        <g fill={c.stripe} opacity="0.85">
          <ellipse cx="200" cy="320" rx="60" ry="20" />
        </g>
      )}
      {color === "tuxedo" && (
        <path
          d="M 150 165 Q 200 230 250 165 L 250 320 Q 200 340 150 320 Z"
          fill={c.belly}
        />
      )}

      {/* Body highlight */}
      <ellipse cx="200" cy="230" rx="160" ry="115" fill="url(#bodyShade)" />

      {/* Feet */}
      <ellipse cx="140" cy="335" rx="36" ry="14" fill={c.body} />
      <ellipse cx="260" cy="335" rx="36" ry="14" fill={c.body} />
      <ellipse cx="140" cy="335" rx="20" ry="6" fill={c.belly} opacity="0.7" />
      <ellipse cx="260" cy="335" rx="20" ry="6" fill={c.belly} opacity="0.7" />

      {/* Head */}
      <motion.g
        animate={{ rotate: [-1.5, 1.5, -1.5] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "200px 130px" }}
      >
        <ellipse cx="200" cy="130" rx="95" ry="80" fill={c.body} />
        {/* Ears */}
        <path d="M 130 75 L 110 35 L 165 70 Z" fill={c.body} />
        <path d="M 270 75 L 290 35 L 235 70 Z" fill={c.body} />
        <path d="M 130 75 L 122 50 L 152 70 Z" fill={c.ear} />
        <path d="M 270 75 L 278 50 L 248 70 Z" fill={c.ear} />

        {/* Cheeks/blush */}
        <circle cx="148" cy="148" r="14" fill="#FF8FB1" opacity={0.25 + blush} />
        <circle cx="252" cy="148" r="14" fill="#FF8FB1" opacity={0.25 + blush} />

        {/* Eyes */}
        {expression === "sleepy" ? (
          <g stroke="#1F1A2E" strokeWidth="4" strokeLinecap="round" fill="none">
            <path d="M 158 130 q 12 8 24 0" />
            <path d="M 218 130 q 12 8 24 0" />
          </g>
        ) : expression === "angry" ? (
          <g fill="#1F1A2E">
            <path d="M 150 118 L 188 128 L 188 138 L 150 134 Z" />
            <path d="M 250 118 L 212 128 L 212 138 L 250 134 Z" />
            <ellipse cx="170" cy="135" rx="5" ry="6" fill="#fff" />
            <ellipse cx="230" cy="135" rx="5" ry="6" fill="#fff" />
          </g>
        ) : (
          <motion.g
            animate={{ scaleY: [1, 1, 0.1, 1] }}
            transition={{ duration: 5, times: [0, 0.92, 0.96, 1], repeat: Infinity }}
            style={{ transformOrigin: "200px 132px" }}
          >
            <ellipse cx="170" cy="132" rx="9" ry="12" fill="#1F1A2E" />
            <ellipse cx="230" cy="132" rx="9" ry="12" fill="#1F1A2E" />
            <circle cx="173" cy="128" r="3" fill="#fff" />
            <circle cx="233" cy="128" r="3" fill="#fff" />
          </motion.g>
        )}

        {/* Nose */}
        <path
          d="M 195 158 q 5 6 10 0 q -5 8 -10 0"
          fill={c.nose}
          stroke="#1F1A2E"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Mouth */}
        {expression === "happy" ? (
          <path
            d="M 178 168 q 22 18 44 0"
            stroke="#1F1A2E"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M 200 165 q -8 10 -18 4 M 200 165 q 8 10 18 4"
            stroke="#1F1A2E"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Whiskers */}
        <g stroke="#1F1A2E" strokeWidth="1.5" strokeLinecap="round" opacity="0.7">
          <line x1="120" y1="160" x2="155" y2="160" />
          <line x1="120" y1="170" x2="155" y2="168" />
          <line x1="245" y1="160" x2="280" y2="160" />
          <line x1="245" y1="168" x2="280" y2="170" />
        </g>
      </motion.g>
    </motion.svg>
  );
}
