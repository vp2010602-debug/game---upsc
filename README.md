# Today Paper Crorepati Quiz

A ready-to-upload Crorepati/KBC-style quiz game made from **The Hindu International, 17 June 2026** paper.

## Files

```text
index.html
style.css
app.js
data/questions.js
data/questions.json
data/questions.csv
.nojekyll
README.md
```

## How to upload to a new GitHub repository

1. Create a new GitHub repository.
2. Upload all files and folders exactly as they are.
3. The `data` folder must stay named `data`.
4. Go to **Settings → Pages**.
5. Under **Build and deployment**, select:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
6. Open the GitHub Pages link after 1–2 minutes.

## Important

Do not upload only `index.html`. Upload all files, especially:

```text
data/questions.js
app.js
style.css
```

## Features

- 80 newspaper-based questions
- 15-question Crorepati round
- 45-second timer
- Prize ladder up to ₹1 crore
- 50:50 lifeline
- Audience Poll lifeline
- Flip Question lifeline
- Hint lifeline
- Explanation after every answer
- Question memory using browser localStorage

## Local testing

Open `index.html` in Chrome/Edge. It should work directly.
