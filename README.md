# DashyOrbs Admin Dashboard (GitHub Pages Ready)

- Static React app (Vite). Host on GitHub Pages.
- Click "Sign in with GitHub" → OAuth via Workers → redirected back with `#token=...`.
- Token is a JWT (signed by Workers) and used as `Authorization: Bearer` for admin API calls.

## Build & Deploy
```bash
npm i
npm run build
# push /dist to gh-pages or enable Pages (GitHub Actions with upload-pages-artifact)
```
Set API base in UI Settings after login (ex: your Workers URL).
