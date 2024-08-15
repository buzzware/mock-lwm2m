const coap = require('coap');
const url = require('url');
const server = coap.createServer();

// Simple in-memory storage for device registrations
const devices = new Map();

server.on('request', (req, res) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Payload:', req.payload.toString());

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  switch(req.method) {
    case 'POST':
      if (pathname === '/rd') {
        handleRegister(req, res, query);
      } else {
        handleCreate(req, res);
      }
      break;
    // ... other cases remain the same ...
  }
});

function handleRegister(req, res, query) {
  console.log('Handling Register request');
  const endpoint = query.ep; // Extract device ID from query parameters
  if (!endpoint) {
    res.code = '4.00';
    res.end('Bad Request: Missing endpoint name');
    return;
  }

  console.log('Registering device with ID:', endpoint);

  const location = `/rd/${endpoint}`;
  devices.set(endpoint, {
    address: req.rsinfo.address,
    port: req.rsinfo.port,
    lifetime: parseInt(query.lt || '86400'),
    location: location
  });

  res.code = '2.01';
  res.setOption('Location-Path', location.split('/').filter(Boolean));
  console.log('Setting Location-Path:', location);
  console.log('Response options:', res.options);
  res.end();
}

// ... rest of the server code ...

server.listen(() => {
  console.log('LWM2M Server is listening');
});
