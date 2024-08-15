const lwm2mServer = require('lwm2m-node-lib').server;

// Server Configuration
const config = {
  port: 5683,
  lifetimeCheckInterval: 1000,
  udpWindow: 100,
  defaultType: 'Device',
  types: [
    {
      name: 'OtherType',
      url: '/OtherType'
    }
  ],
  logLevel: 'FATAL',
  ipProtocol: 'udp4',
  serverProtocol: 'udp4',
  formats: [
    {
      name: 'application-vnd-oma-lwm2m/text',
      value: 1541
    },
    {
      name: 'application-vnd-oma-lwm2m/tlv',
      value: 1542
    },
    {
      name: 'application-vnd-oma-lwm2m/json',
      value: 1543
    },
    {
      name: 'application-vnd-oma-lwm2m/opaque',
      value: 1544
    }
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

function registrationHandler(endpoint, lifetime, version, binding, payload, callback) {
  console.log('Device registration:');
  console.log('Endpoint name:', endpoint);
  console.log('Lifetime:', lifetime);
  console.log('Version:', version);
  console.log('Binding:', binding);
  console.log('Payload:', payload);
  callback();
}

function unregistrationHandler(device, callback) {
  console.log('Device unregistration:');
  console.log('Device location:', device);
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

// Basic read operation
function read(deviceId, objectType, objectId, resourceId) {
  lwm2mServer.read(deviceId, objectType, objectId, resourceId, function(error, result) {
    if (error) {
      console.error('Read error:', error);
    } else {
      console.log('Resource read:');
      console.log('Id:', objectType + '/' + objectId + '/' + resourceId);
      console.log('Value:', result);
    }
  });
}

// Basic write operation
function write(deviceId, objectType, objectId, resourceId, value) {
  lwm2mServer.write(deviceId, objectType, objectId, resourceId, value, handleResult('Value written successfully'));
}

// Start the server
start();

// Example usage (you would call these functions as needed)
// read('device123', '3', '0', '0');
// write('device123', '3', '0', '13', 'New Value');

// Handle graceful shutdown
process.on('SIGINT', function() {
  console.log('Shutting down server...');
  stop();
  process.exit();
});
