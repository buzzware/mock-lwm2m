const lwm2mServer = require('lwm2m-node-lib').server;

// Server Configuration
const config = {
  port: 5683,
  lifetimeCheckInterval: 1000,
  udpWindow: 100,
  defaultType: 'Device',
  logLevel: 'INFO',
  ipProtocol: 'udp4',
  serverProtocol: 'udp4',
  formats: [
    { name: 'application-vnd-oma-lwm2m/text', value: 1541 },
    { name: 'application-vnd-oma-lwm2m/tlv', value: 1542 },
    { name: 'application-vnd-oma-lwm2m/json', value: 1543 },
    { name: 'application-vnd-oma-lwm2m/opaque', value: 1544 }
  ],
  writeFormat: 'application-vnd-oma-lwm2m/text',
  defaultAcceptFormat: 'text/plain'
};

let globalServerInfo;

function handleResult(message) {
  return function(error) {
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Success:', message);
    }
  };
}

function setupObservation(endpoint) {
  let id2 = lwm2mServer.getDevice(endpoint,(e,device) => {
    lwm2mServer.observe(
      device.id,
      '3424',
      '0',
      '1',
      function (value) {
        console.log(`Received cumulative water value from ${endpoint}: ${value}`);
      },
      function (error) {
        if (error) {
          console.error('Failed to set up observation:', error);
        } else {
          console.log('Observation set up for cumulative water resource');
        }
      }
    );
  });
}

function registrationHandler(endpoint, lifetime, version, binding, payload, callback) {
  console.log('Device registration:');
  console.log('Endpoint name:', endpoint);
  console.log('Lifetime:', lifetime);
  console.log('Version:', version);
  console.log('Binding:', binding);
  console.log('Payload:', payload);

  // Call the callback to complete the registration process
  callback(null);

  // Set up observation after registration is complete
  setTimeout(() => {
    setupObservation(endpoint);
  }, 1000); // Wait for 1 second to ensure registration is fully processed
}

function unregistrationHandler(device, callback) {
  console.log('Device unregistration:');
  console.log('Device:', device);
  callback();
}

function setHandlers(serverInfo, callback) {
  globalServerInfo = serverInfo;
  lwm2mServer.setHandler(serverInfo, 'registration', registrationHandler);
  lwm2mServer.setHandler(serverInfo, 'unregistration', unregistrationHandler);
  callback();
}

function start() {
  lwm2mServer.start(config, function(error, serverInfo) {
    if (error) {
      console.error('Failed to start LWM2M server:', error);
      return;
    }
    setHandlers(serverInfo, handleResult('LWM2M Server started on port ' + config.port));
  });
}

function stop() {
  if (globalServerInfo) {
    lwm2mServer.stop(globalServerInfo, handleResult('LWM2M Server stopped'));
  } else {
    console.log('No server was listening');
  }
}

// Function to list all registered devices
function listDevices() {
  lwm2mServer.listDevices(function(error, deviceList) {
    if (error) {
      console.error('Error listing devices:', error);
    } else {
      console.log('Registered devices:');
      deviceList.forEach(device => {
        console.log(`- Endpoint: ${device.name}, Lifetime: ${device.lifetime}, Address: ${device.address}`);
      });
    }
  });
}

// Start the server
start();

// Handle graceful shutdown
process.on('SIGINT', function() {
  console.log('Shutting down server...');
  stop();
  process.exit();
});
