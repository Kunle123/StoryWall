# StoryWall

StoryWall is a microservices-based application that enables users to create, customize, and share visually appealing timelines using AI-powered content generation. The application features a 300-degree circular timeline visualization with a complementary horizontal zoomed view, robust social sharing capabilities, and sophisticated AI integration.

## Microservice Architecture

StoryWall is built using a modern microservices architecture:

- **User Service**: Handles user authentication, registration, and profile management
- **Timeline Service**: Manages timeline and event data storage and retrieval
- **API Gateway**: Routes requests to appropriate services and handles cross-cutting concerns
- **Frontend**: React-based web application for user interaction

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js v16+ and npm (for local development)
- MongoDB (automatic with Docker setup)

### Installation with Docker

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/storywall.git
   cd storywall
   ```

2. Copy environment variable files
   ```bash
   cp services/user-service/.env.example services/user-service/.env
   cp services/timeline-service/.env.example services/timeline-service/.env
   cp services/api-gateway/.env.example services/api-gateway/.env
   ```

3. Start the application with Docker Compose
   ```bash
   docker-compose up -d
   ```

4. Access the application
   - Frontend: http://localhost:4000
   - API Gateway: http://localhost:3002
   - Swagger UI: http://localhost:3002/api-docs

### Local Development Setup

1. Install dependencies for each service
   ```bash
   cd services/user-service && npm install
   cd ../timeline-service && npm install
   cd ../api-gateway && npm install
   cd ../../frontend && npm install
   ```

2. Start MongoDB (via Docker or local installation)
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:5.0
   ```

3. Start each service in development mode
   ```bash
   # In separate terminals
   cd services/user-service && npm run dev
   cd services/timeline-service && npm run dev
   cd services/api-gateway && npm run dev
   cd frontend && npm run dev
   ```

## API Documentation

The API documentation is available via Swagger UI:
- API Gateway Swagger: http://localhost:3002/api-docs
- User Service Swagger: http://localhost:3000/api-docs
- Timeline Service Swagger: http://localhost:3001/api-docs

## Features

- **User Management**
  - Registration and authentication
  - Profile management
  - Social login integration

- **Timeline Creation and Management**
  - Create and edit timelines
  - Add/edit/delete timeline events
  - Categorize and tag timelines

- **Visualization**
  - 300-degree circular timeline view
  - 30-degree zoomed horizontal timeline view
  - Card-based event summary view
  - Detailed event view

- **Social Sharing**
  - Share timelines on social media
  - Embed timelines in websites
  - Generate shareable links

- **AI Integration**
  - AI-powered timeline content generation
  - Event enhancement with AI-generated details
  - Content validation and fact-checking

## Deployment

StoryWall can be deployed using various cloud platforms:

- **Railway**
  - Follow the debugging lessons for Railway deployments
  - Use the DOCKERFILE builder explicitly in railway.json

- **Vercel**
  - Frontend can be deployed directly to Vercel
  - Make sure to set the VERCEL environment variable for conditional logic

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Based on the TimelineAI prototype design
- Built with lessons learned from debugging microservices architectures 