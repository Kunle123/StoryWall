# StoryWall Development Guide

This guide provides comprehensive information for developers working on the StoryWall project.

## Project Structure

The StoryWall project is organized into the following main directories:

- `services/` - Backend microservices
  - `user-service/` - User authentication and management
  - `timeline-service/` - Timeline and event management
  - `api-gateway/` - API gateway for routing requests
- `frontend/` - React frontend application
- `docs/` - Project documentation
- `Prototype/` - Initial prototype code and designs

## Development Environment Setup

### Prerequisites

- Node.js v16+ and npm v7+
- Docker and Docker Compose
- MongoDB (automatically set up with Docker)
- Git

### Initial Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/storywall.git
   cd storywall
   ```

2. Set up environment variables:
   ```bash
   cp services/user-service/.env.example services/user-service/.env
   cp services/timeline-service/.env.example services/timeline-service/.env
   cp services/api-gateway/.env.example services/api-gateway/.env
   ```

3. Install dependencies for all services:
   ```bash
   cd services/user-service && npm install
   cd ../timeline-service && npm install
   cd ../api-gateway && npm install
   cd ../../frontend && npm install
   ```

### Running the Application

#### Using Docker Compose (Recommended for Full-Stack Testing)

```bash
docker-compose up -d
```

This will start all services, the MongoDB database, and the frontend application.

#### Individual Services (For Active Development)

1. Start MongoDB:
   ```bash
   docker-compose up -d mongodb
   ```

2. Start each service in development mode:
   ```bash
   # In separate terminal windows
   cd services/user-service && npm run dev
   cd services/timeline-service && npm run dev
   cd services/api-gateway && npm run dev
   cd frontend && npm start
   ```

## Development Workflow

### Backend Development

Each microservice follows a similar structure:

```
service-name/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Express middlewares
│   ├── models/           # Data models
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   ├── app.js            # Express application setup
│   └── server.js         # Server entry point
├── tests/                # Test files
├── .env                  # Environment variables
├── package.json          # Dependencies and scripts
└── Dockerfile            # Docker configuration
```

#### Adding a New API Endpoint

1. Define the route in `src/routes/`:
   ```javascript
   router.post('/resource', resourceController.createResource);
   ```

2. Implement the controller in `src/controllers/`:
   ```javascript
   const createResource = async (req, res) => {
     try {
       const newResource = await resourceService.create(req.body);
       res.status(201).json(newResource);
     } catch (error) {
       res.status(400).json({ message: error.message });
     }
   };
   ```

3. Implement the service logic in `src/services/`:
   ```javascript
   const create = async (resourceData) => {
     const resource = new Resource(resourceData);
     await resource.save();
     return resource;
   };
   ```

4. Add tests in `tests/` directory

### Frontend Development

The frontend follows a modern React application structure:

```
frontend/
├── public/               # Static files
├── src/
│   ├── api/              # API client functions
│   ├── components/       # Reusable UI components
│   ├── pages/            # Page components
│   ├── stores/           # Zustand state stores
│   ├── styles/           # Global styles
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main application component
│   └── index.tsx         # Entry point
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

#### Creating a New Component

1. Create the component file:
   ```typescript
   // src/components/MyComponent/MyComponent.tsx
   import React from 'react';
   import { Container } from './styles';
   
   interface MyComponentProps {
     title: string;
   }
   
   const MyComponent: React.FC<MyComponentProps> = ({ title }) => {
     return (
       <Container>
         <h1>{title}</h1>
       </Container>
     );
   };
   
   export default MyComponent;
   ```

2. Create the component styles (if using styled-components):
   ```typescript
   // src/components/MyComponent/styles.ts
   import styled from 'styled-components';
   
   export const Container = styled.div`
     padding: 16px;
     background-color: #f5f5f5;
     border-radius: 4px;
   `;
   ```

3. Create an index file for easier imports:
   ```typescript
   // src/components/MyComponent/index.ts
   export { default } from './MyComponent';
   ```

## Testing

### Backend Testing

Each service includes test suites using Jest:

```bash
cd services/user-service
npm test
```

### Frontend Testing

The frontend uses React Testing Library:

```bash
cd frontend
npm test
```

## Linting and Formatting

The project uses ESLint and Prettier for code quality and formatting:

```bash
# Run linter
npm run lint

# Format code
npm run format
```

## Building for Production

### Backend Services

```bash
cd services/user-service
npm run build
```

### Frontend

```bash
cd frontend
npm run build
```

## Deployment

### Railway Deployment

The project is configured for deployment on Railway platform:

1. Install the Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Link your project:
   ```bash
   railway link
   ```

3. Deploy a service:
   ```bash
   cd services/user-service
   railway up
   ```

## Documentation

### API Documentation

Each service provides Swagger documentation at `/api-docs` endpoint when running.

### Component Documentation

Component documentation can be added using JSDoc comments:

```typescript
/**
 * A timeline visualization component
 * 
 * @component
 * @example
 * ```jsx
 * <TimelineVisualization
 *   events={events}
 *   startDate={new Date('2023-01-01')}
 *   endDate={new Date('2023-12-31')}
 * />
 * ```
 */
```

## Troubleshooting

### Common Issues

#### MongoDB Connection Issues

If you're having trouble connecting to MongoDB:

1. Check that MongoDB is running:
   ```bash
   docker ps | grep mongodb
   ```

2. Verify your connection string in the `.env` file

#### Service Communication Issues

If services can't communicate:

1. Check that all services are running:
   ```bash
   docker-compose ps
   ```

2. Verify service URLs in the API Gateway `.env` file

## Additional Resources

- [Project Roadmap](./ROADMAP.md)
- [Architecture Documentation](./ARCHITECTURE.md)
- [Contributing Guidelines](../CONTRIBUTING.md) 