// First, install the required package:
// npm install coap

const coap = require('coap');
const server = coap.createServer();

// Simple in-memory storage for device registrations
const devices = new Map();

server.on('request', (req, res) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Payload:', req.payload.toString());

  const urlParts = req.url.split('/');
  const endpoint = urlParts[2]; // Assuming URL format: /rd/<endpoint>

  switch(req.method) {
    case 'POST':
      if (req.url.startsWith('/rd')) {
        handleRegister(req, res, endpoint);
      } else {
        handleCreate(req, res);
      }
      break;
    case 'PUT':
      if (devices.has(endpoint)) {
        handleUpdate(req, res, endpoint);
      } else {
        handleWrite(req, res);
      }
      break;
    case 'DELETE':
      handleDeregister(req, res, endpoint);
      break;
    case 'GET':
      handleRead(req, res);
      break;
    default:
      console.log('Unsupported method:', req.method);
      res.code = '4.05';
      res.end('Method Not Allowed');
  }
});

function handleRegister(req, res, endpoint) {
  console.log('Handling Register request');
  devices.set(endpoint, {
    address: req.rsinfo.address,
    port: req.rsinfo.port,
    lifetime: parseInt(req.headers['lwm2m-lifetime'] || '86400')
  });
  res.code = '2.01';
  res.end();
}

function handleUpdate(req, res, endpoint) {
  console.log('Handling Update request');
  const device = devices.get(endpoint);
  if (device) {
    device.lifetime = parseInt(req.headers['lwm2m-lifetime'] || device.lifetime);
    res.code = '2.04';
    res.end();
  } else {
    res.code = '4.04';
    res.end('Not Found');
  }
}

function handleDeregister(req, res, endpoint) {
  console.log('Handling Deregister request');
  if (devices.delete(endpoint)) {
    res.code = '2.02';
    res.end();
  } else {
    res.code = '4.04';
    res.end('Not Found');
  }
}

function handleRead(req, res) {
  console.log('Handling Read request');
  // Respond with a mock value
  res.code = '2.05';
  res.end('MockValue123');
}

function handleWrite(req, res) {
  console.log('Handling Write request');
  // Acknowledge the write operation
  res.code = '2.04';
  res.end();
}

function handleCreate(req, res) {
  console.log('Handling Create request');
  // Acknowledge the create operation
  res.code = '2.01';
  res.end();
}

server.listen(() => {
  console.log('LWM2M Server is listening');
});
