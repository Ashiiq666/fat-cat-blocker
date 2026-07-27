// Smart cat renderer.
// Looks for an asset in /public in priority order:
//   1. /cat.lottie or /cat-animation.json   →  Lottie player
//   2. /cat.webm                            →  plain video element
//   3. /cat.mp4 or /catvideo.mp4            →  ChromaKeyVideo (real-time green removal on GPU)
//   4. /cat.apng / /cat.png / /cat.gif      →  animated image
//   5. (none)                               →  built-in SVG cat (Cat.tsx)

import { useEffect, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Cat } from "./Cat";
import { ChromaKeyVideo } from "./ChromaKeyVideo";
import type { CatColor } from "../lib/types";

type Source =
  | { kind: "lottie"; src: string }
  | { kind: "webm"; src: string }
  | { kind: "mp4"; src: string }
  | { kind: "image"; src: string }
  | { kind: "svg" };

// Paths are base-relative, never "/cat.mp4". Packaged builds load over file://,
// where a root-absolute path resolves against the filesystem root instead of the
// app bundle, so every candidate would miss and we'd always fall back to the SVG.
const B = import.meta.env.BASE_URL;

const CANDIDATES: { kind: Source["kind"]; path: string }[] = [
  { kind: "lottie", path: `${B}cat.lottie` },
  { kind: "lottie", path: `${B}cat-animation.json` },
  { kind: "webm", path: `${B}cat.webm` },
  { kind: "mp4", path: `${B}cat.mp4` },
  { kind: "mp4", path: `${B}catvideo.mp4` },
  { kind: "image", path: `${B}cat.apng` },
  { kind: "image", path: `${B}cat.png` },
  { kind: "image", path: `${B}cat.gif` },
];

let resolvedSource: Source | null = null;
let resolvingPromise: Promise<Source> | null = null;

async function resolveSource(): Promise<Source> {
  if (resolvedSource) return resolvedSource;
  if (resolvingPromise) return resolvingPromise;

  // Expected Content-Type prefixes per kind. Vite's dev server returns
  // text/html (the SPA fallback) for missing static assets with status 200,
  // so we MUST validate Content-Type — checking res.ok alone gives false
  // positives that make us pick a non-existent asset over a real one.
  const TYPE_PREFIXES: Record<Source["kind"], string[]> = {
    lottie: ["application/json", "application/zip", "application/octet-stream"],
    webm: ["video/"],
    mp4: ["video/"],
    image: ["image/"],
    svg: [],
  };

  resolvingPromise = (async () => {
    console.log(`[CatVisual] starting asset detection (base=${window.location.href})`);
    for (const c of CANDIDATES) {
      try {
        const url = new URL(c.path, window.location.href).toString();
        const res = await fetch(url, {
          method: "GET",
          headers: { Range: "bytes=0-0" },
        });
        const ct = (res.headers.get("Content-Type") || "").toLowerCase();
        if (!(res.ok || res.status === 206)) {
          console.log(`[CatVisual] ${c.path}: status=${res.status} → skip`);
          continue;
        }
        const allowed = TYPE_PREFIXES[c.kind] ?? [];
        const typeOk = allowed.some((p) => ct.startsWith(p));
        if (!typeOk) {
          console.log(
            `[CatVisual] ${c.path}: status=${res.status} ct="${ct}" → skip (wrong type)`
          );
          continue;
        }
        console.log(
          `[CatVisual] USING ${c.path} (status=${res.status} ct="${ct}")`
        );
        if (c.kind === "webm") resolvedSource = { kind: "webm", src: c.path };
        else if (c.kind === "mp4") resolvedSource = { kind: "mp4", src: c.path };
        else if (c.kind === "lottie") resolvedSource = { kind: "lottie", src: c.path };
        else resolvedSource = { kind: "image", src: c.path };
        return resolvedSource;
      } catch (err) {
        console.warn(`[CatVisual] ${c.path}: fetch threw`, err);
      }
    }
    console.warn("[CatVisual] no candidate matched → using SVG fallback");
    resolvedSource = { kind: "svg" };
    return resolvedSource;
  })();

  return resolvingPromise;
}

type Props = {
  color?: CatColor;
  expression?: "smug" | "sleepy" | "happy" | "angry";
  size?: number;
  className?: string;
  intensity?: number;
  fed?: number;
  pets?: number;
  fullScreen?: boolean;
};

export function CatVisual(props: Props) {
  const [source, setSource] = useState<Source | null>(resolvedSource);

  useEffect(() => {
    if (source) return;
    let alive = true;
    resolveSource().then((s) => {
      if (alive) setSource(s);
    });
    return () => {
      alive = false;
    };
  }, [source]);

  if (!source) {
    // Source still resolving — render SVG centered/scaled if fullScreen requested.
    if (props.fullScreen) {
      return (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
          }}
        >
          <Cat {...props} size={Math.min(720, window.innerWidth * 0.5)} />
        </div>
      );
    }
    return <Cat {...props} />;
  }
  // (removed spammy per-render log — would push asset-detection logs out of the on-screen buffer)

  const size = props.size ?? 360;
  const mediaStyle: React.CSSProperties = props.fullScreen
    ? {
        width: "100%",
        height: "100%",
        display: "block",
        pointerEvents: "none",
        objectFit: "cover",
        objectPosition: "50% 100%",
      }
    : {
        width: size,
        height: "auto",
        maxHeight: size,
        display: "block",
        pointerEvents: "none",
        objectFit: "contain",
      };

  const onMediaError = () => {
    console.warn("[CatVisual] media failed → fallback to SVG");
    resolvedSource = { kind: "svg" };
    setSource({ kind: "svg" });
  };

  if (source.kind === "lottie") {
    const lottieWrapStyle: React.CSSProperties = props.fullScreen
      ? { width: "100%", height: "100%" }
      : { width: size, height: size };
    return (
      <div className={props.className} style={lottieWrapStyle}>
        <DotLottieReact
          src={source.src}
          loop
          autoplay
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    );
  }

  if (source.kind === "webm") {
    return (
      <video
        className={props.className}
        style={mediaStyle}
        src={source.src}
        autoPlay
        loop
        muted
        playsInline
        onError={onMediaError}
      />
    );
  }

  if (source.kind === "mp4") {
    return (
      <ChromaKeyVideo
        className={props.className}
        style={mediaStyle}
        src={source.src}
        onError={onMediaError}
      />
    );
  }

  if (source.kind === "image") {
    return (
      <img
        className={props.className}
        style={mediaStyle}
        src={source.src}
        alt="Cat"
        onError={onMediaError}
      />
    );
  }

  if (props.fullScreen) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
        }}
      >
        <Cat {...props} size={Math.min(720, window.innerWidth * 0.5)} />
      </div>
    );
  }
  return <Cat {...props} />;
}
