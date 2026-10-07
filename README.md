# pilieciumokslas.lt

Website of the Lithuanian Citizen Science Association (Piliečių mokslo asociacija), in Lithuanian and English.

- Content lives in `content/` (news, projects, initiatives, resources, services, about). The team edits it through Pages CMS, configured in `.pages.yml`.
- Templates and styles live in `src/`. The site is built with Eleventy.
- Every change pushed to `main` is built and published by GitHub Actions (`.github/workflows/deploy.yml`).

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:8090.
