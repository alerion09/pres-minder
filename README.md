# PresMinder 2

[![Node.js Version](https://img.shields.io/badge/node-22.14.0-brightgreen)](https://nodejs.org/)
[![Astro](https://img.shields.io/badge/Astro-5-orange)](https://astro.build)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## Description

PresMinder is a web application (MVP) designed to simplify the gift-finding process. The main functionality leverages AI to generate personalized gift ideas based on user-provided information about the recipient. Users can also manually create, save, edit, and delete their own gift ideas. The application use Openrouter.ai for AI-powered gift suggestions.

## Tech Stack

- **Astro 5** - Fast and efficient static site generation with minimal JavaScript
- **React 19** - Interactive UI components
- **TypeScript 5** - Static type checking and enhanced IDE support
- **Tailwind CSS 4** - Utility-first CSS framework
- **Shadcn/ui** - Accessible React component library

## Prerequisites

- Node.js 22.14.0 (see `.nvmrc` file)
- npm or yarn package manager

## Installation

1. Clone the repository:

```bash
git clone https://github.com/alerion09/pres-minder.git
cd pres-minder
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables (create a `.env` file based on your configuration):

```bash
# Add required environment variables for Supabase and Openrouter.ai
```

4. Run the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000` (default Astro port).

## Available Scripts

- **`npm run dev`** - Start the development server
- **`npm run build`** - Build the application for production
- **`npm run preview`** - Preview the production build locally
- **`npm run astro`** - Run Astro CLI commands
- **`npm run lint`** - Run ESLint to check code quality
- **`npm run lint:fix`** - Run ESLint and automatically fix issues
- **`npm run format`** - Format code using Prettier

## Testing

### Technologies

- **Vitest 4** - Unit and integration testing framework
- **Testing Library (React)** - React component testing utilities
- **Playwright** - End-to-end testing framework

### Test Structure

```
pres-minder/
├── src/
│   ├── tests/              # Unit and integration tests
│   │   ├── unit/           # Unit tests
│   │   └── integration/    # Integration tests
│   └── components/
│       └── **/*.test.tsx   # Component tests
├── e2e/                    # E2E tests (Playwright)
│   ├── fixtures/           # Test data
│   ├── pages/              # Page Object Models
│   └── *.spec.ts           # E2E test files
```

### Commands

#### Unit & Integration Tests (Vitest)

```bash
npm run test:unit          # Run all unit tests
npm run test:unit:watch    # Watch mode (auto-refresh)
npm run test:unit:ui       # Visual UI mode
npm run test:coverage      # Generate coverage report
```

#### End-to-End Tests (Playwright)

```bash
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui        # Visual UI mode
npm run test:e2e:debug     # Debug mode (step-by-step)
npm run test:e2e:codegen   # Record tests interactively
```

## License

MIT
