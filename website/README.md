# Website Starter

A simple, modern, responsive static website scaffold.

## Develop

- Open `index.html` directly in a browser, or run a simple server:

```bash
# Python 3
python3 -m http.server 8000 --directory /workspace/website

# Or using Node (if installed)
npx serve /workspace/website -l 8000 --yes
```

Then visit `http://localhost:8000`.

## Customize

- Update branding in `index.html` (`<title>`, `.logo`, hero text)
- Replace icons in `assets/`
- Adjust colors and spacing in `styles.css`
- Add sections or pages and link them in the nav

## Deploy

Host the static files on any static host (GitHub Pages, Netlify, Vercel, S3, etc.). Upload the contents of `/workspace/website`.