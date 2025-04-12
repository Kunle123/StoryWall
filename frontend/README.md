# StoryWall Frontend

This is the frontend for the StoryWall application, built with React, TypeScript, and styled-components.

## Features

- Interactive timeline visualizations (circular and horizontal)
- Dark mode with system preference detection
- Responsive design for mobile and desktop
- Timeline filtering by category and date range
- Social sharing capabilities

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

1. Install dependencies
```bash
npm install
```

2. Start the development server
```bash
npm start
```

3. Build for production
```bash
npm run build
```

## Directory Structure

```
src/
├── api/          # API client setup and interceptors
├── components/   # Reusable UI components
│   ├── timeline/ # Timeline-specific components
│   └── ...
├── contexts/     # React context providers
├── pages/        # Page components
├── stores/       # Zustand state stores
└── styles/       # Global styles and themes
```

## Theme Support

The application supports light and dark themes:

- System preference detection
- Manual theme selection
- Persistent preferences via localStorage
- CSS variables for consistent theming

## Available Scripts

- `npm start` - Starts the development server
- `npm test` - Runs tests
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App 