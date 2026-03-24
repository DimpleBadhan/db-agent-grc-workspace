# DB agent

Static cyberpunk UI for the DB agent compliance workspace.

This is the public-safe GitHub upload version.
Local compliance source files are intentionally excluded.

If you need real client-specific workspaces with company-named folders and
structured records on disk, use the local app in the `db-agent-local-app` folder.

## Run locally

Open `index.html` directly in a browser, or run a small local server:

```powershell
cd db-agent-github-safe
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

If Python is not installed, the launcher opens `index.html` directly in your default browser.

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

## Safe upload folder

If you are uploading manually to GitHub, upload the contents of the `db-agent-github-safe` folder only.

Do not upload `compliance_inputs` from the parent project if you want to keep local source materials private.

## Files

- `index.html`: app entry point
- `styles.css`: cyberpunk styling
- `app.js`: phase and dashboard logic
- `run-local.bat`: one-click local server for Windows
- `run-local.ps1`: PowerShell local server launcher
- `docs/`: public-safe notes for template and framework status
