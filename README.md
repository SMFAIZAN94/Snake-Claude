# Snake — Retro Brick-Phone Edition

A browser homage to the classic monochrome Snake game that shipped on old
button phones: greenish LCD screen, dot-matrix grid, on-screen d-pad, and a
phone-shaped frame — built from scratch in plain HTML/CSS/JS (Canvas), no
game framework or build step required.

## Project structure

```
nokia-snake/
├── server.js          Tiny Express static server (only needed if you deploy it as a Node app)
├── public/
│   ├── index.html      Phone frame + on-screen controls
│   ├── style.css        Retro phone/LCD styling
│   └── game.js           Game loop, collisions, scoring, sound, controls
├── package.json
└── .gitignore
```

## Play it locally

Since this is a static site, you have two options:

**Option A — just open the file.** Double-click `public/index.html` and it
runs directly in your browser. No install needed.

**Option B — run it through the included server** (useful if you want it
served the same way it'll run in production, e.g. on Cloudways):

```bash
npm install
npm start
# open http://localhost:3000
```

## Controls

- **Arrow keys** or **WASD** to steer
- **Space** to pause/resume
- On touch devices: the on-screen **d-pad**, or swipe on the screen itself
- Tap the center **●** button or **Start** to begin/restart
- High score is saved in your browser (`localStorage`) between visits

## 1. Push this to GitHub

```bash
git init
git add .
git commit -m "Initial commit: retro Snake game"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

Or use GitHub's web UI: create a new empty repository, then "uploading an
existing file" and drag in everything from this unzipped folder.

## 2. Deploy it (two ways)

**As a static site** (GitHub Pages, Netlify, Vercel, Cloudways static
hosting, etc.): just point the host at the `public/` folder — that's the
entire app, no server logic involved.

**As a Cloudways Node.js Velocity app** (same flow as before, if you'd
rather keep everything on one server):

1. Create a Node.js app on a Velocity server.
2. **Deployment via Git** → connect this repo/`main` branch.
3. Build command: `npm install`
4. Start command: `npm start`
5. Node version: 18+
6. Deploy — Cloudways sets `PORT` automatically and `server.js` already
   reads `process.env.PORT`.

## Notes

- The wall behavior matches the original handset game: hitting the edge
  ends the run rather than wrapping around.
- Speed ramps up slightly with every food eaten, same as the original.
- Everything here is an original implementation — no phone-manufacturer
  logos, fonts, or assets are used; the phone "shell" is pure CSS.
