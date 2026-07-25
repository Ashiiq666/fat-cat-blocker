// Plays an opaque MP4 with a green-screen background, removes the green in
// real time on the GPU, and renders the result with a transparent background.
//
// Works with any plain MP4/H.264 input — no special encoding needed.

import { useEffect, useRef } from "react";

const VERTEX_SHADER = `
attribute vec2 a_pos;
attribute vec2 a_uv;
varying vec2 v_uv;
void main() {
  v_uv = a_uv;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

// Vlahos green-screen key.
//
//   greenness = G - max(R, B)        — how green-dominant a pixel is
//   alpha     = 1 − smoothstep(lo, hi, greenness)
//
// Greenness (rather than a distance to some fixed key colour) is what makes
// this robust to the lighting gradient on a real green screen: a studio
// backdrop lit from 60,133,74 in the shadows up to 105,169,116 in the hot
// spots still measures 0.20–0.28 greenness throughout, because the metric
// only cares about how far green leads the other two channels, not about
// overall brightness.
//
// Two clean-up passes run on top of the raw matte:
//
//   1. Erosion. H.264 stores chroma at half resolution (yuv420p), so at any
//      subject edge the green of the backdrop bleeds ~1px into the subject
//      and survives the threshold as a thin olive rim. Taking the minimum
//      alpha over the 3x3 neighbourhood pulls the matte in by exactly that
//      one pixel, which is where the rim lives.
//   2. Despill. Green light bouncing off the backdrop tints the subject.
//      Clamping G to MIN(R, B) at the edges (where spill is worst) and to
//      MAX(R, B) in the interior (where clamping harder would visibly drain
//      colour) removes it without flattening the subject.
const FRAGMENT_SHADER = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_video;
uniform float u_lowThresh;
uniform float u_highThresh;
uniform vec2 u_texel;

float matte(vec2 uv) {
  vec3 c = texture2D(u_video, uv).rgb;
  float greenness = c.g - max(c.r, c.b);
  return 1.0 - smoothstep(u_lowThresh, u_highThresh, greenness);
}

void main() {
  vec4 c = texture2D(u_video, v_uv);

  // Erode by one texel: a pixel stays fully opaque only if its neighbours are.
  float alpha = matte(v_uv);
  alpha = min(alpha, matte(v_uv + vec2(-u_texel.x, -u_texel.y)));
  alpha = min(alpha, matte(v_uv + vec2(       0.0, -u_texel.y)));
  alpha = min(alpha, matte(v_uv + vec2( u_texel.x, -u_texel.y)));
  alpha = min(alpha, matte(v_uv + vec2(-u_texel.x,        0.0)));
  alpha = min(alpha, matte(v_uv + vec2( u_texel.x,        0.0)));
  alpha = min(alpha, matte(v_uv + vec2(-u_texel.x,  u_texel.y)));
  alpha = min(alpha, matte(v_uv + vec2(       0.0,  u_texel.y)));
  alpha = min(alpha, matte(v_uv + vec2( u_texel.x,  u_texel.y)));

  c.g = min(c.g, mix(min(c.r, c.b), max(c.r, c.b), alpha));

  gl_FragColor = vec4(c.rgb, alpha);
}
`;

type Props = {
  src: string;
  /**
   * "Greenness" (G - max(R, B)) at or below which the pixel is fully opaque.
   * Anything below this counts as "not green" and stays.
   */
  lowThresh?: number;
  /**
   * "Greenness" at or above which the pixel is fully transparent.
   */
  highThresh?: number;
  /** Whether to loop the whole video from the start. Default false. */
  loop?: boolean;
  /**
   * If set, the full clip plays once, then only the trailing N seconds loop
   * forever. Useful when the start is a one-shot intro (e.g. cat walks in)
   * and the tail is a calm idle pose worth repeating. Takes precedence over
   * `loop`.
   */
  tailLoopSeconds?: number;
  className?: string;
  style?: React.CSSProperties;
  onError?: () => void;
};

export function ChromaKeyVideo({
  src,
  // Measured off catvideo.mp4: the cat (including green spill on its white
  // paws and chest) never exceeds 0.05 greenness, and the backdrop never
  // drops below 0.20. These sit in that gap, so the whole cat stays fully
  // opaque and the whole backdrop goes fully transparent, with the soft
  // transition band landing only on genuine fur edges.
  lowThresh = 0.08,
  highThresh = 0.15,
  loop = false,
  tailLoopSeconds,
  className,
  style,
  onError,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn("[ChromaKey] no canvas ref");
      return;
    }
    console.log("[ChromaKey] mounting with src=", src);

    const video = document.createElement("video");
    video.src = src;
    video.muted = true;
    // tailLoopSeconds overrides loop: we manage looping manually on `ended`.
    video.loop = tailLoopSeconds == null ? loop : false;
    video.playsInline = true;
    // NOTE: do NOT set crossOrigin for same-origin — it can taint the canvas
    // and make gl.texImage2D throw silently on some Vite/Electron setups.
    video.preload = "auto";

    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: true,
    });
    if (!gl) {
      console.error("[ChromaKey] WebGL context creation failed");
      onError?.();
      return;
    }

    function compile(type: number, source: string): WebGLShader | null {
      const sh = gl!.createShader(type);
      if (!sh) return null;
      gl!.shaderSource(sh, source);
      gl!.compileShader(sh);
      if (!gl!.getShaderParameter(sh, gl!.COMPILE_STATUS)) {
        const log = gl!.getShaderInfoLog(sh);
        console.error("[ChromaKey] shader compile failed:", log);
        return null;
      }
      return sh;
    }

    const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) {
      onError?.();
      return;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("[ChromaKey] program link failed:", gl.getProgramInfoLog(program));
      onError?.();
      return;
    }
    gl.useProgram(program);
    console.log("[ChromaKey] WebGL + shaders ready");

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const posLoc = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    // Flip texture vertically (videos are top-down, OpenGL is bottom-up).
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]),
      gl.STATIC_DRAW
    );
    const uvLoc = gl.getAttribLocation(program, "a_uv");
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.uniform1f(gl.getUniformLocation(program, "u_lowThresh"), lowThresh);
    gl.uniform1f(gl.getUniformLocation(program, "u_highThresh"), highThresh);

    const texelLoc = gl.getUniformLocation(program, "u_texel");
    // Set once the video reports its real dimensions; until then a zero texel
    // makes the erosion taps collapse onto the centre sample, which is a
    // harmless no-op rather than a wrong-sized erosion.
    gl.uniform2f(texelLoc, 0, 0);
    const syncTexel = () => {
      if (video.videoWidth > 0) {
        gl.uniform2f(texelLoc, 1 / video.videoWidth, 1 / video.videoHeight);
      }
    };

    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    let raf = 0;
    let cancelled = false;
    let firstFrameLogged = false;
    let texErrorLogged = false;

    const draw = () => {
      if (cancelled) return;
      if (video.readyState >= 2 && video.videoWidth > 0) {
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          gl.viewport(0, 0, canvas.width, canvas.height);
          syncTexel();
          console.log(`[ChromaKey] canvas sized to ${canvas.width}x${canvas.height}`);
        }
        gl.bindTexture(gl.TEXTURE_2D, tex);
        try {
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            video
          );
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
          if (!firstFrameLogged) {
            firstFrameLogged = true;
            console.log("[ChromaKey] first frame painted ✓");
          }
        } catch (e) {
          if (!texErrorLogged) {
            texErrorLogged = true;
            console.error("[ChromaKey] texImage2D threw:", e);
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };

    video.addEventListener("loadedmetadata", () => {
      console.log(
        `[ChromaKey] loadedmetadata: ${video.videoWidth}x${video.videoHeight}, duration=${video.duration}s`
      );
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      syncTexel();
    });

    video.addEventListener("canplay", () => {
      console.log("[ChromaKey] canplay → starting playback");
      void video.play().then(
        () => console.log("[ChromaKey] video.play() resolved"),
        (err) => console.warn("[ChromaKey] autoplay blocked:", err?.name, err?.message)
      );
    });

    video.addEventListener("error", () => {
      // Teardown clears video.src, which itself fires `error`. Reporting that
      // as a decode failure would make callers permanently fall back to their
      // no-video path after any remount (React StrictMode does one on mount).
      if (cancelled) return;
      console.error("[ChromaKey] video element error:", video.error);
      onError?.();
    });

    // Tail-loop: full clip plays once, then only the trailing N seconds loop.
    if (tailLoopSeconds != null && tailLoopSeconds > 0) {
      video.addEventListener("ended", () => {
        const start = Math.max(0, video.duration - tailLoopSeconds);
        video.currentTime = start;
        void video.play().catch(() => {
          /* no-op */
        });
      });
    }

    raf = requestAnimationFrame(draw);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      try {
        video.pause();
        video.src = "";
        video.load();
      } catch {
        /* no-op */
      }
      try {
        gl.deleteTexture(tex);
        gl.deleteBuffer(posBuf);
        gl.deleteBuffer(uvBuf);
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
      } catch {
        /* no-op */
      }
    };
  }, [src, lowThresh, highThresh, loop, tailLoopSeconds, onError]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        ...style,
        background: "transparent",
      }}
    />
  );
}
