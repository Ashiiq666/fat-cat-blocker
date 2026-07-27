# Replacing the cat with a real animation or video

The blocker auto-detects an asset in `public/`. Drop **one** file matching any
of these names and it's used instantly — no code change, no rebuild config,
no setting to flip:

| Filename | Format | Notes |
|---|---|---|
| `public/cat.lottie` | Lottie (compressed dotLottie) | **Recommended**. Tiny, scales perfectly, transparent by default |
| `public/cat-animation.json` | Lottie (raw JSON) | Same, just larger file size |
| `public/cat.webm` | WebM video with alpha (VP9) | Real video with transparent background |
| `public/cat.mp4` / `public/catvideo.mp4` | MP4 video, green screen | Keyed to transparent on the GPU at playback — see below |
| `public/cat.gif` | Animated GIF | Cheap and easy, mediocre quality |

If none of these exist, the built-in SVG cat is used.

---

## Recommended: Lottie

### Where to find free cat Lottie animations

| Source | Notes |
|---|---|
| **[LottieFiles — Cat tag](https://lottiefiles.com/free-animations/cat)** | The biggest library. Filter by Free + License: "Lottie Simple License" (≈ MIT for animations) |
| **[IconScout — Lottie cats](https://iconscout.com/lottie-animations/cat)** | Many free, some paid |
| **[Lordicon — Cat icons](https://lordicon.com/icons?query=cat)** | Animated icons, some free |

### Install steps

1. On LottieFiles, click any cat animation
2. Click **Download** → choose **Lottie JSON** (or **dotLottie** for smaller file)
3. Rename the downloaded file:
   - JSON → `cat-animation.json`
   - dotLottie → `cat.lottie`
4. Move it to `public/` in this project
5. Restart the app (`npm run electron:dev` or rebuild). The next break shows your cat

### Direct download example

A free, friendly cat animation:

```bash
# From the project root
curl -L -o public/cat-animation.json \
  "https://lottie.host/embed/your-cat-animation-id/file.json"
```

Replace the URL with whichever animation you picked on LottieFiles.

---

## Green-screen MP4 (what ships today)

`public/catvideo.mp4` is a plain green-screen MP4 — no alpha channel, no
pre-processing. `ChromaKeyVideo.tsx` removes the green on the GPU every frame,
so you can drop in any green-screen clip and it just works.

The key measures **greenness** = `G - max(R, B)` rather than distance to a
fixed key colour, which is what makes it survive an unevenly lit backdrop. On
the shipped clip the backdrop ranges from `60,133,74` in the shadows to
`105,169,116` in the hot spots, yet greenness stays in 0.20–0.28 throughout,
while the cat — including green spill on its white paws — never exceeds 0.05.
The default thresholds (0.08 / 0.15) sit in that gap.

If you swap in your own clip and see the subject go semi-transparent or green
edges survive, measure your own footage and pass `lowThresh` / `highThresh`:

```bash
# Greenness of the backdrop vs. the subject, sampled from one frame
ffmpeg -i public/catvideo.mp4 -frames:v 1 /tmp/f.png
```

Set `lowThresh` just above the subject's maximum and `highThresh` just below
the backdrop's minimum.

Two clean-up passes run on top of the raw matte, both in the fragment shader:

- **Erosion** — H.264 stores chroma at half resolution (`yuv420p`), so green
  bleeds about a pixel into the subject at every edge and would survive as a
  thin olive rim. Taking the minimum alpha over the 3×3 neighbourhood pulls the
  matte in by exactly that pixel. Thin structures like whiskers still survive.
- **Despill** — green bounced off the backdrop tints the subject. Green is
  clamped to `MIN(R, B)` at the edges, where spill is worst, and to
  `MAX(R, B)` in the interior, where clamping harder would visibly drain colour.

---

## Alternative: real cat video with transparent background (WebM)

WebM with VP9 alpha is the only widely-supported video format that preserves
transparency. Use this if you have a green-screened cat or a CG cat render.

### Where to find / make one

| Source | Notes |
|---|---|
| **[Pexels videos](https://www.pexels.com/search/videos/cat/)** | Free stock video — most won't have alpha. Search "cat green screen" for chroma-key candidates |
| **[Mixkit](https://mixkit.co/free-stock-video/cat/)** | Free, no alpha by default |
| **[Storyblocks](https://www.storyblocks.com/)** | Paid subscription, lots of green-screen cats |

### Convert a green-screen video to WebM with alpha

If you have a green-screen cat clip (`green-cat.mp4`):

```bash
# Install ffmpeg first: brew install ffmpeg
ffmpeg -i green-cat.mp4 \
  -vf "chromakey=green:0.1:0.2,format=yuva420p" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -an \
  public/cat.webm
```

Then drop `cat.webm` into `public/` and you're done.

### Test if your WebM has alpha

```bash
ffprobe -v error -select_streams v:0 -show_entries stream=pix_fmt -of csv=p=0 public/cat.webm
# Should print: yuva420p
```

If it prints `yuv420p` (no `a`), it's not transparent.

---

## Animated GIF (lazy mode)

If you just want something "good enough" fast:

1. Find a transparent-background cat GIF on **[Giphy stickers](https://giphy.com/stickers/cat)** (the "stickers" page filters to transparent ones)
2. Download → save as `public/cat.gif`
3. Restart

The downside: GIFs cap at 256 colors and look pixelated when scaled large. Fine
for tiny windows, ugly when the cat fills half the screen.

---

## Sprite sheets (advanced)

If you have a cat walk-cycle PNG sequence and want frame-by-frame animation,
that requires custom code. Open an issue if you want this — the
infrastructure is there in `CatVisual.tsx`, just needs a sprite-sheet renderer.

---

## How the picker works (for the curious)

`src/components/CatVisual.tsx` fetches each candidate URL in priority order at
runtime and checks the `Content-Type` (Vite's dev server answers `200` with
`text/html` for missing assets, so status alone gives false positives). The
first match wins, cached in module scope so subsequent breaks render instantly.
If everything misses, it falls back to the SVG `<Cat>` component.

Note that the break overlay (`BlockerView.tsx`) does *not* go through this
picker — it renders `/catvideo.mp4` through `ChromaKeyVideo` directly.

If a video errors during decoding (codec mismatch, corrupted file), the
component drops back to SVG silently — the break never gets stuck without a
cat on screen.
