const coap = require('coap');

// Configuration
const SERVER_ADDRESS = 'localhost';
const SERVER_PORT = 5683;
const CLIENT_ENDPOINT = 'WaterMeter123';
const LIFETIME = 60; // Registration lifetime in seconds

// LWM2M Object details
const OBJECT_ID = 3424;
const INSTANCE_ID = 0;
const RESOURCE_ID = 1;

let registrationLocation;

function registerDevice() {
  const req = coap.request({
    host: SERVER_ADDRESS,
    port: SERVER_PORT,
    method: 'POST',
    pathname: `/rd?ep=${CLIENT_ENDPOINT}&lt=${LIFETIME}&lwm2m=1.0`,
    options: {
      'Content-Format': 'application/link-format'
    }
  });

  req.on('response', (res) => {
    console.log('Registration response code:', res.code);
    console.log('Response headers:', res.headers);
    console.log('Response options:', res.options);

    if (res.code === '2.01') {
      console.log('Device registered successfully');
      // Look for Location-Path in options
      const locationPath = res.options.find(option => option.name === 'Location-Path');
      if (locationPath) {
        registrationLocation = '/' + locationPath.value.join('/');
        console.log('Registration location:', registrationLocation);
        // Start sending updates
        setInterval(sendUpdate, LIFETIME * 1000 / 2);
      } else {
        console.log('Error: Location-Path not found in response');
      }
    } else {
      console.log('Registration failed');
    }
  });

  const payload = `</${OBJECT_ID}/${INSTANCE_ID}/${RESOURCE_ID}>`;
  req.end(payload);
}

// ... rest of the client code ...

// Start the client
registerDevice();
