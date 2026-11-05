# RamTej — OCEAN

A plain HTML, CSS and JavaScript release page for Ramtej's single **OCEAN**. Open `index.html` directly in a modern browser; there is no framework, package installation or build step.

## Add streaming and social links

Replace the empty values in `OCEAN_LINKS` near the top of `script.js`:

```js
platforms: {
  spotify: "https://open.spotify.com/your-song-link",
  appleMusic: "https://music.apple.com/your-song-link",
  youtubeMusic: "https://music.youtube.com/your-song-link",
  amazonMusic: "https://music.amazon.com/your-song-link"
}
```

Add Instagram and YouTube profile URLs under `OCEAN_LINKS.socials`. Valid `https://` destinations open in a new tab; empty values remain safely inactive.

## Replace assets and logos

The current assets are referenced from `index.html`:

- Signature: `assets/ramtej-signature.png`
- Cover art: `assets/ocean-cover.jpeg`
- Falling character: `assets/Floating Character in Forest Green Outfit.png`
- Spotify logo: `assets/spotify.png`
- Apple Music logo: `assets/applemusic.png`
- YouTube Music logo: `assets/ytmusic.png`
- Amazon Music logo: `assets/amazonmusic.png`

`assets/youtubelogo.png` is intentionally unused. To replace a streaming logo, swap the corresponding image `src` inside `.platform-logo` and keep its fixed box dimensions.

## Typography, layout and effects

The OCEAN title uses `assets/ocean-script.png` and scales to the available title column width on desktop and mobile.

Desktop uses one centered three-column grid: cover and title in the first column, with the four streaming links in two aligned columns. Mobile changes to a centered release flow with a two-column link grid. The title is fitted to its column after the web font is ready.

Effect switches are at the top of `script.js`:

```js
ENABLE_TITLE_WAVE
ENABLE_BUBBLE_CURSOR
ENABLE_RIPPLES
ENABLE_CAUSTICS
ENABLE_PARALLAX
ENABLE_RISING_BUBBLES
ENABLE_FALLING_CHARACTER
LITE_MODE_AUTO
```

The page also respects `prefers-reduced-motion`. Automatic lite mode reduces the canvas bubble count, disables cover shimmer and title letter motion when the device or frame time suggests it is needed.

Asset sizes in the current folder: `ocean-cover.jpeg` is about 89 KB. All four logo PNGs are larger than the recommended 256px delivery size: Spotify is 1280x1322, Apple Music is 2048x2048, YouTube Music is 1280x1280, and Amazon Music is 512x512. They should ideally be exported at about 128-256px CSS-independent resolution and compressed as optimized PNG/WebP files. The falling character is about 1.3 MB and the signature is about 351 KB; those can also be compressed for faster first load without changing their displayed dimensions.
