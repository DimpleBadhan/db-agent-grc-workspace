# DB agent

Static cyberpunk UI for the DB agent compliance workspace.

## Run locally

Open `index.html` directly in a browser, or run a small local server:

```powershell
cd "C:\Users\Dimple Badhan\Documents\New project 9"
py -m http.server 8080
```

Then open `http://localhost:8080`.

If `py` does not work, try:

```powershell
python -m http.server 8080
```

Windows one-click options:

- Double-click `run-local.bat`
- Or run `.\run-local.ps1` from PowerShell

## Deploy with GitHub Pages

This repository includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.

### First-time setup

1. Create a GitHub repository.
2. Upload or push this whole folder to the `main` branch.
3. In GitHub, open `Settings` -> `Pages`.
4. Under `Build and deployment`, set `Source` to `GitHub Actions`.
5. Push to `main` again if needed.
6. Open the `Actions` tab and wait for `Deploy static site to Pages` to finish.
7. Your site will be published at the GitHub Pages URL shown in the workflow run.

## Files

- `index.html`: app entry point
- `styles.css`: cyberpunk styling
- `app.js`: phase and dashboard logic
- `run-local.bat`: one-click local server for Windows
- `run-local.ps1`: PowerShell local server launcher
- `compliance_inputs/`: stored policy and framework intake materials
