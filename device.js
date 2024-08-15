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

let registrationLocation; // Store the registration location

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
    console.log('Registration response:', res.code);
    if (res.code === '2.01') {
      console.log('Device registered successfully');
      registrationLocation = res.headers['Location']; // Store the registration location
      console.log('Registration location:', registrationLocation);
      // Start sending updates
      setInterval(sendUpdate, LIFETIME * 1000 / 2);
    } else {
      console.log('Registration failed');
    }
  });

  const payload = `</${OBJECT_ID}/${INSTANCE_ID}/${RESOURCE_ID}>`;
  req.end(payload);
}

function sendUpdate() {
  if (!registrationLocation) {
    console.log('Registration location not available. Cannot send update.');
    return;
  }

  const waterValue = generateWaterValue();
  const req = coap.request({
    host: SERVER_ADDRESS,
    port: SERVER_PORT,
    method: 'POST',
    pathname: registrationLocation, // Use the stored registration location
    options: {
      'Content-Format': 'application/vnd.oma.lwm2m+tlv'
    }
  });

  req.on('response', (res) => {
    console.log('Update response:', res.code);
  });

  // Simple TLV encoding for a single resource
  const valueBuffer = Buffer.alloc(4);
  valueBuffer.writeFloatBE(waterValue);
  const tlv = Buffer.concat([Buffer.from([0xC1, 0x01]), valueBuffer]);

  req.end(tlv);
}

function generateWaterValue() {
  // Generate water value based on seconds since 1970
  const secondsSince1970 = Math.floor(Date.now() / 1000);
  return (secondsSince1970 % 1000) / 10; // Value between 0 and 100
}

// Start the client
registerDevice();
