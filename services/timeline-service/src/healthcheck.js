const http = require('http');

const options = {
  host: 'localhost',
  port: process.env.PORT || 3001,
  path: '/health',
  timeout: 2000
};

const request = http.request(options, (res) => {
  // If response code is 200, the service is healthy
  process.exit(res.statusCode === 200 ? 0 : 1);
});

request.on('error', () => {
  process.exit(1);
});

request.end(); 