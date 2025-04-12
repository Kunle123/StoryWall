# Contributing to StoryWall

Thank you for your interest in contributing to StoryWall! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to uphold our Code of Conduct, which expects all contributors to maintain a respectful and inclusive environment.

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm v7 or higher
- Docker and Docker Compose (for local development)
- MongoDB (automatically set up with Docker)

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/storywall.git
   cd storywall
   ```

3. Set up environment variables:
   ```bash
   cp services/user-service/.env.example services/user-service/.env
   cp services/timeline-service/.env.example services/timeline-service/.env
   cp services/api-gateway/.env.example services/api-gateway/.env
   ```

4. Install dependencies for all services:
   ```bash
   cd services/user-service && npm install
   cd ../timeline-service && npm install
   cd ../api-gateway && npm install
   cd ../../frontend && npm install
   ```

5. Start the application with Docker:
   ```bash
   docker-compose up -d
   ```

   Alternatively, for individual service development:
   ```bash
   # Start MongoDB
   docker-compose up -d mongodb
   
   # Start services individually in development mode
   cd services/user-service && npm run dev
   cd services/timeline-service && npm run dev
   cd services/api-gateway && npm run dev
   cd frontend && npm start
   ```

## Development Workflow

### Branching Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: For new features
- `bugfix/*`: For bug fixes
- `release/*`: For release preparation

### Creating a New Feature

1. Create a new branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. Implement your changes with appropriate tests
3. Commit your changes following our commit message conventions
4. Push your branch and create a pull request to the `develop` branch

### Pull Request Process

1. Update the README.md or documentation with details of your changes if needed
2. Ensure all tests pass and your code follows our style guidelines
3. Get at least one code review approval
4. Once approved, a maintainer will merge your PR

## Code Style and Quality

- Follow the existing code style in each service
- Write meaningful commit messages (see Commit Message Guidelines)
- Include appropriate tests for your changes
- Document your code where necessary

### TypeScript Style Guide

- Use interfaces for object shapes
- Use type annotations for function parameters and return types
- Avoid using `any` type when possible
- Use meaningful variable and function names

### Testing Guidelines

- Write unit tests for utility functions and components
- Write integration tests for API endpoints
- Aim for reasonable test coverage (at least 70%)

## Commit Message Guidelines

We follow conventional commits format:

```
<type>(<scope>): <short summary>
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding or fixing tests
- `chore`: Changes to build process or auxiliary tools

Example:
```
feat(user-service): add social login capabilities
```

## Additional Resources

- [Project Roadmap](ROADMAP.md)
- [Architecture Documentation](docs/ARCHITECTURE.md)
- [API Documentation](services/api-gateway/README.md)

## Questions?

If you have any questions, please create an issue or contact the project maintainers. 