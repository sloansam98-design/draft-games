# Draft Games

A hub of fun mini-games for deciding your fantasy football draft order.

## Site structure

```
draftgames/
├── index.html              # Main hub — pick a game
├── hub.css                   # Hub page styles (football field theme)
└── games/
    └── duck-draft-race/      # Duck Race game
        ├── index.html
        ├── app.js
        ├── styles.css
        ├── sprites.js
        ├── sleeper.js
        ├── espn.js
        └── yahoo.js
```

## Run locally

```bash
cd ~/Projects/duck-draft-race
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080) for the hub, or go directly to [http://localhost:8080/games/duck-draft-race/](http://localhost:8080/games/duck-draft-race/).

## Deploy

Upload the entire project folder to [Netlify Drop](https://app.netlify.com/drop). The hub page is the site entry point.

## Games

| Game | Status |
|------|--------|
| Duck Race | Live |
| Draft Wheel | Live |
| Coin Flip Showdown | Live |
| Slot Machine Draft | Coming soon |
| Water Gun Race | Coming soon |
| Balloon Pop Race | Coming soon |
| Home Run Derby | Coming soon |
| Free Throw Face-Off | Coming soon |
| Face-Off Showdown | Coming soon |
| Field Goal Frenzy | Coming soon |

No build step required — plain HTML, CSS, and JavaScript.
