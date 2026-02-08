# Contributing Guide

Thanks for helping improve Flip Chip Trainer. This guide covers the local workflow and expectations.

## Prerequisites

- Node.js 18+ (recommended)
- npm (or another Node package manager)

## Setup

```bash
npm install
```

## Run the app

```bash
npm run dev
```

Open the local URL printed by Vite (usually http://localhost:5173).

## Build and preview

```bash
npm run build
npm run preview
```

## Tests

```bash
npm test
```

## Project structure

- `src/` React app source
- `docs/` lightweight documentation
- `index.html` Vite entry HTML

## Coding conventions

- TypeScript + React
- 2-space indentation
- `PascalCase` for React components
- `camelCase` for functions and variables
- Keep Tailwind classes grouped logically (layout → spacing → color → typography)

## Pull requests

- Keep changes focused and small when possible
- Include a clear description of what changed and why
- Add screenshots for UI changes
