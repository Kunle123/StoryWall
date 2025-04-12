# User Service

The User Service is responsible for user authentication, registration, and profile management in the StoryWall application.

## Features

- User registration and authentication
- JWT token generation and validation
- User profile management
- Password reset functionality
- User preferences storage
- Role-based access control

## API Endpoints

### Authentication

#### `POST /api/auth/register`

Registers a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username",
  "name": "User Name"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "email": "user@example.com",
    "username": "username",
    "name": "User Name"
  }
}
```

#### `POST /api/auth/login`

Authenticates a user and returns a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "email": "user@example.com",
    "username": "username",
    "name": "User Name"
  }
}
```

#### `POST /api/auth/logout`

Logs out a user by invalidating their token.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### User Management

#### `GET /api/users/me`

Retrieves the profile of the currently authenticated user.

**Response:**
```json
{
  "id": "60d21b4667d0d8992e610c85",
  "email": "user@example.com",
  "username": "username",
  "name": "User Name",
  "bio": "User bio",
  "avatarUrl": "https://example.com/avatar.jpg",
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}
```

#### `PUT /api/users/me`

Updates the profile of the currently authenticated user.

**Request Body:**
```json
{
  "name": "Updated Name",
  "bio": "Updated bio",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

**Response:**
```json
{
  "id": "60d21b4667d0d8992e610c85",
  "email": "user@example.com",
  "username": "username",
  "name": "Updated Name",
  "bio": "Updated bio",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

#### `PUT /api/users/me/password`

Updates the password of the currently authenticated user.

**Request Body:**
```json
{
  "currentPassword": "password123",
  "newPassword": "newPassword123"
}
```

**Response:**
```json
{
  "message": "Password updated successfully"
}
```

#### `POST /api/auth/password-reset/request`

Requests a password reset for a user.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Password reset email sent"
}
```

#### `POST /api/auth/password-reset/verify`

Verifies a password reset token and sets a new password.

**Request Body:**
```json
{
  "token": "reset-token",
  "newPassword": "newPassword123"
}
```

**Response:**
```json
{
  "message": "Password reset successful"
}
```

## Configuration

The User Service can be configured using environment variables:

```
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/storywall-users

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=1d
JWT_REFRESH_EXPIRATION=7d

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:8080,http://localhost:4000

# Email Configuration (for password reset)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=user@example.com
EMAIL_PASSWORD=email_password
EMAIL_FROM=noreply@storywall.com

# Logging
LOG_LEVEL=info
```

## Development

### Installation

```bash
cd services/user-service
npm install
```

### Running in Development Mode

```bash
npm run dev
```

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

## API Documentation

The API documentation is available via Swagger UI at `/api-docs` when the service is running. 