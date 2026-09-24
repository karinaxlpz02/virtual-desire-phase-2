# VIRTUAL DESIRE: PHASE 2

A white page with centered #FF8DC8 text. One term appears at a time, changing every second. Every term uses the same font size at a given screen width.

## Edit the words

Open `assets/words.txt` in a plain text editor. Write one word or phrase per line, and save. Blank lines and duplicates are ignored. The page checks for changes every two seconds and randomly chooses a term every second, avoiding consecutive repeats when there is more than one unique term. The initial words are placeholders you can replace.

## Add your font

The website currently uses `assets/AFMathis-Regular.otf` as its first-choice font. To switch fonts, update the first filename in `refreshFont()` in `script.js`, or remove the AF font and use one of the generic filenames below.

Put your font in `assets` and name it `font.woff2`, `font.woff`, `font.ttf`, or `font.otf`, keeping its original extension. The page detects it automatically. Use only one custom font file. Until then, it uses Inter from Google Fonts, with a sans-serif fallback. Refresh the page after replacing or removing a previously loaded font.

You can also put a font with any filename in the folder and ask Codex to connect that file.

## Local preview

In a terminal inside this folder, run:

```sh
python3 -m http.server 8000
```

Visit http://localhost:8000. Keep the server running while editing. Opening `index.html` directly does not allow the browser to fetch the text file reliably.

## Publish on GitHub Pages

Upload this folder's contents to a GitHub repository. In the repository's Settings → Pages, choose “Deploy from a branch”, select `main` and `/ (root)`, and save.

Local edits are visible in your local preview when saved. For the public website, commit and push the changed files to GitHub (or edit `assets/words.txt` directly on GitHub). GitHub Pages then publishes the update; deployment and caching can add a delay. A public website cannot read unsynced files on your Desktop.
