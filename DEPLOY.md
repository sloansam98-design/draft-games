# Deploy Draft Games (GitHub → Netlify)

## One-time setup

### 1. Install Git (if needed)

If `git` doesn't work in Terminal, run:

```bash
xcode-select --install
```

Click **Install** in the popup and wait for it to finish.

### 2. Create a GitHub repo

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `draft-games` (or `duck-draft-race`)
3. **Public** repo
4. Do **not** add README, .gitignore, or license (we already have files)
5. Click **Create repository**

### 3. Push your project to GitHub

In Terminal:

```bash
cd ~/Projects/duck-draft-race

git init
git add .
git commit -m "Initial commit — Draft Games hub and games"

git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/draft-games.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

GitHub will ask you to sign in the first time you push.

### 4. Connect Netlify to GitHub

1. Go to [app.netlify.com](https://app.netlify.com)
2. **Add new site** → **Import an existing project**
3. Choose **GitHub** and authorize Netlify
4. Select your `draft-games` repo
5. Build settings (important for static sites):
   - **Branch:** `main`
   - **Build command:** leave empty
   - **Publish directory:** `.` (or `/`)
6. Click **Deploy site**

Netlify will give you a live URL. Future pushes to `main` auto-deploy.

### 5. Custom domain (optional)

Netlify → **Domain management** → add `draft-games.com` (or your domain) and follow DNS instructions.

---

## Updating the live site (after setup)

Whenever you change files locally:

```bash
cd ~/Projects/duck-draft-race
git add .
git commit -m "Describe what you changed"
git push
```

Netlify rebuilds automatically in ~30 seconds.
