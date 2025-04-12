# StoryWall

StoryWall is a web application for creating, viewing, and sharing interactive timelines that tell stories about historical events, personal journeys, or any chronological narrative.

## Features

- **Interactive Timelines**: Visualize events in both circular and horizontal formats
- **Responsive Design**: Fully responsive interface that works on mobile and desktop
- **Dark Mode Support**: Switch between light, dark, and system theme preferences
- **Timeline Filtering**: Filter timelines by category and date range
- **Social Sharing**: Share timelines via social media or direct links
- **User Authentication**: Register, login, and manage your own timelines

## Technology Stack

- **Frontend**: React, TypeScript, Styled-Components, Zustand
- **Backend**: Node.js, Express (API)
- **Styling**: CSS variables with theme support
- **State Management**: Zustand for global state, React Context for themes

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/storywall.git
cd storywall
```

2. Install dependencies for frontend
```bash
cd frontend
npm install
```

3. Run the frontend development server
```bash
npm start
```

4. Access the application at http://localhost:3000

## Project Structure

```
storywall/
├── frontend/             # React frontend
│   ├── public/           # Static files
│   ├── src/              # Source code
│       ├── api/          # API client setup
│       ├── components/   # React components
│       ├── contexts/     # React contexts (Auth, Theme)
│       ├── pages/        # Page components
│       ├── stores/       # Zustand stores
│       └── styles/       # Global styles and themes
```

## Dark Mode Features

StoryWall includes a comprehensive dark mode implementation:

- System theme detection (follows OS preference)
- Manual theme selection (light, dark, system)
- Theme persistence using localStorage
- Smooth transitions between themes
- Accessibility-friendly contrast ratios

## License

This project is licensed under the MIT License - see the LICENSE file for details. 