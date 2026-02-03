# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the React application source (`src/main.tsx`, `src/App.tsx`, `src/index.css`).
- `index.html` is the Vite entry HTML.
- `docs/` holds lightweight documentation (see `docs/quickstart.md`).
- `public/` is not used; assets should live under `src/` and be imported by components.

## Build, Test, and Development Commands
- `npm install` installs dependencies.
- `npm run dev` starts the Vite dev server (local preview).
- `npm run build` produces a production build in `dist/`.
- `npm run preview` serves the production build locally.

## Coding Style & Naming Conventions
- Language: TypeScript + React.
- Indentation: 2 spaces (match existing files).
- Use `PascalCase` for React components and `camelCase` for functions/variables.
- Keep Tailwind classes grouped logically (layout → spacing → color → typography).

## Testing Guidelines
- No automated test framework is configured yet.
- If you add tests, prefer colocating near the component (e.g., `src/App.test.tsx`) and document the new command in this file.

## Commit & Pull Request Guidelines
- Commit history uses short, imperative summaries (e.g., “enable github pages via action”).
- Keep commits scoped to one change when possible.
- Pull requests should include:
  - A clear description of the change and motivation.
  - Link to the relevant issue in `eb` (e.g., “Closes eb#10”).
  - Screenshots for UI changes.

## Issue Tracking
- Use `eb` as the issue tracker (e.g., `eb show 10`, `eb list`).

## Deployment Notes
- GitHub Pages is deployed from `dist/` via GitHub Actions.
- Vite `base` is set to `/flip-chip-trainer/`; update if the repo name changes.
