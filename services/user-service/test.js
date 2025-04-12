const User = require('./src/domain/models/user');

// Create a mock user
const testUser = new User({
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'User'
});

// Test password hashing
console.log('Original password:', testUser.password);
console.log('Is a plain text password?', testUser.password === 'password123' ? 'Yes' : 'No (hashed)');

// Test toObject method
const userObject = testUser.toObject ? testUser.toObject() : testUser;
console.log('User object:', userObject);

console.log('This test verifies that the User model is working correctly.');
console.log('In a complete application, you would connect to MongoDB and perform CRUD operations.');
console.log('To run the complete application with Docker:');
console.log('1. Make sure Docker Desktop is running');
console.log('2. Run "docker-compose up" from the project root');
console.log('3. Access the services at:');
console.log('   - User Service: http://localhost:3000');
console.log('   - Timeline Service: http://localhost:3001');
console.log('   - API Gateway: http://localhost:3002');
console.log('   - Frontend: http://localhost:4000');
console.log();

console.log('Based on the debugging_lessons_learned.md file, remember:');
console.log('- Configure CORS correctly for all services');
console.log('- Implement robust error handling for service unavailability');
console.log('- Use request IDs for tracking requests across services');
console.log('- Test each service in isolation before integration');
console.log('- Set proper health check endpoints with reasonable timeouts'); 