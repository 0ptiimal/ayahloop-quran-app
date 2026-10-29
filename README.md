# AyahLoop — Quran reading, recall, and reflection

AyahLoop is a responsive Quran companion built around a small, repeatable loop:
**read → listen → recall → reflect**.

## Features
- Quran chapters and ayat loaded from the public Quran.com API v4
- Arabic Uthmani text, English Sahih International translation, and verse audio where available
- Search across surah names
- Memorization Lab: hide/reveal an ayah and self-rate recall
- Daily Reflection: a curated selection of ayat and notes stored locally in the current browser
- Responsive layout, Arabic typography, and larger Arabic text toggle

## Run locally
This is a static site. Open `index.html` in a browser, or serve the folder using a local static server. For example, from the project directory:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy on Render (Static Site)
1. Create a Git repository and push these files to GitHub.
2. In Render, choose **New + → Static Site** and connect the repository.
3. Set **Build Command** to blank (or `echo "Static site"` if the dashboard requires a command).
4. Set **Publish Directory** to `.`.
5. Deploy. No environment variables are required for the public read endpoints used here.

## API
The app calls `https://api.quran.com/api/v4` directly from the browser. It uses public endpoints for chapters, verses, translations, and audio. If the API's response shape or availability changes, update the corresponding functions in `app.js`.

## Important notes
- This is a front-end starter, not a production-verified religious reference product.
- Verify Arabic text, translations, recitation attribution, and any future tafsir content against trusted sources before public release.
- Reflection notes are stored in local browser storage only. They are not synced and may be lost if browser data is cleared.
- Memorization ratings are currently session-only; a future version could add spaced repetition and accounts.
- Do not present AI-generated explanations as authoritative tafsir. Keep source and scholar attribution visible if adding tafsir.
