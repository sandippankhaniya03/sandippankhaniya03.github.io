# Sandip Pankhaniya — portfolio

Personal portfolio for [sandippankhaniya03.github.io](https://sandippankhaniya03.github.io/), built with React, TypeScript, Vite, and Tailwind CSS.

## Local development

Requires Node.js 24 or later.

```bash
npm ci
npm run dev
```

Vite prints the local development URL after the server starts.

## Production build

```bash
npm run build
npm run preview
```

The static production site is generated in `dist/`. `npm run preview` serves that build locally for a final review.

## Deployment

The GitHub Actions workflow in `.github/workflows/deploy.yml` builds the site and deploys `dist/` to GitHub Pages whenever `main` is updated, or when the workflow is started manually.

In the repository’s **Settings → Pages**, select **GitHub Actions** as the build and deployment source. This is a user site at `sandippankhaniya03.github.io`, so Vite is configured with the root base path `/`.

The workflow installs the exact dependency versions recorded in `package-lock.json` before building.

## Content accuracy

The site describes current interests and direction without inventing employment history, credentials, or project results. Add project case studies or work history when you have details you want to publish.
