# StoryWall Architecture Documentation

## System Overview

StoryWall is built on a microservices architecture, allowing for independent deployment, scaling, and development of each component. The application consists of the following primary services:

![Architecture Diagram](./images/architecture-diagram.png)

## Core Services

### 1. User Service

**Purpose**: Handles user authentication, registration, and profile management.

**Key Responsibilities**:
- User registration and authentication
- Profile management
- Social login integration
- Permission management
- User preferences storage

**Technologies**:
- Node.js/Express
- MongoDB (User data storage)
- JSON Web Tokens (JWT) for authentication

### 2. Timeline Service

**Purpose**: Manages timeline data and event information.

**Key Responsibilities**:
- Timeline CRUD operations
- Event management within timelines
- Timeline categorization and tagging
- Timeline sharing permissions
- Timeline content validation

**Technologies**:
- Node.js/Express
- MongoDB (Timeline data storage)
- Communication with User Service for authorization

### 3. API Gateway

**Purpose**: Acts as the entry point for client requests, routing them to appropriate services.

**Key Responsibilities**:
- Request routing
- Authentication verification
- Rate limiting
- Response caching
- API documentation (Swagger)
- Request logging and monitoring

**Technologies**:
- Node.js/Express
- Redis (for caching)
- Swagger UI (for API documentation)

### 4. Frontend Application

**Purpose**: Provides the user interface for interacting with the StoryWall system.

**Key Responsibilities**:
- User interface rendering
- Timeline visualization
- User authentication flows
- Timeline and event management interfaces

**Technologies**:
- React
- TypeScript
- D3.js (for visualizations)
- Styled Components
- Zustand (state management)

## Data Flow

1. **Authentication Flow**:
   - Client sends authentication request to API Gateway
   - Gateway forwards request to User Service
   - User Service validates credentials and returns JWT
   - Gateway returns JWT to client
   - Client includes JWT in subsequent requests

2. **Timeline Creation Flow**:
   - Authenticated client sends timeline creation request to API Gateway
   - Gateway validates JWT with User Service
   - Gateway forwards request to Timeline Service
   - Timeline Service creates timeline and returns data
   - Gateway returns timeline data to client

## Database Design

### User Database

Primary collections:
- **Users**: Stores user information
  - Basic profile information
  - Authentication details
  - Preferences
  - Account metadata

### Timeline Database

Primary collections:
- **Timelines**: Stores timeline metadata
  - Title, description
  - Creation/modification timestamps
  - Owner and shared users
  - Visibility settings
  - Categories and tags

- **Events**: Stores timeline events
  - Title, description
  - Date/time information
  - Media attachments
  - Custom properties
  - Timeline references

## Security Considerations

1. **Authentication**:
   - JWT-based authentication
   - Secure token storage
   - Token expiration and refresh mechanisms

2. **Authorization**:
   - Role-based access control
   - Resource ownership verification
   - Granular permission system

3. **Data Protection**:
   - HTTPS throughout the application
   - Sensitive data encryption
   - Rate limiting to prevent abuse

## Scalability Considerations

1. **Horizontal Scaling**:
   - Each microservice can be independently scaled
   - Stateless service design enables easy replication
   - Docker container orchestration (future Kubernetes support)

2. **Performance Optimization**:
   - Response caching at API Gateway
   - Database indexing strategies
   - Pagination for large data sets

## Development & Deployment

1. **Local Development**:
   - Docker Compose for local environment setup
   - Environment configuration via .env files
   - Hot-reloading for development

2. **Deployment**:
   - CI/CD pipeline (planned)
   - Railway deployment configuration
   - Production environment configuration

## Future Architecture Extensions

1. **AI Service**:
   - Timeline content generation
   - Event enhancement
   - Content validation and fact-checking

2. **Analytics Service**:
   - User activity tracking
   - Timeline engagement metrics
   - Content popularity analytics

3. **Notification Service**:
   - User notifications
   - Timeline updates
   - Collaboration invitations 