const lwm2mClient = require('lwm2m-node-lib').client;

const config = {
  server: {
    host: 'localhost',
    port: 5683
  },
  client: {
    lifetime: 60,
    endpointName: 'WaterMeter1',
    version: '1.0'
  }
};

let deviceInfo;

// Initialize the client
lwm2mClient.init(config);

// Function to get current timestamp divided by 1000.0
function getCurrentTimestampValue() {
  return (Date.now() / 1000.0).toFixed(3);
}

// Create the object and set initial value
lwm2mClient.registry.create('/3424/0', function(error) {
  if (error) {
    console.error('Error creating Timestamp object:', error);
    return;
  }
  console.log('Timestamp object created');

  lwm2mClient.registry.setResource('/3424/0', 1, getCurrentTimestampValue(), function(error) {
    if (error) {
      console.error('Error setting initial timestamp:', error);
      return;
    }
    console.log('Initial timestamp set');

    // Register the client
    lwm2mClient.register(config.server.host, config.server.port, null, config.client.endpointName,
      function (error, result) {
        if (error) {
          console.error('Registration failed:', error);
          return;
        }
        console.log('Device registered:', result);
        deviceInfo = result;

        // Start periodic updates
        setInterval(updateValue, 5000);
      });
  });
});

function updateValue() {
  const newValue = getCurrentTimestampValue();
  lwm2mClient.registry.setResource('/3424/0', 1, newValue, function(error) {
    if (error) {
      console.error('Failed to update local timestamp:', error);
    } else {
      //console.log('Local timestamp updated to:', newValue);
      // Update the server
      if (deviceInfo) {
        lwm2mClient.update(deviceInfo, function(error) {
          if (error) {
            console.error('Failed to update server:', error);
          } else {
            console.log('Server updated with new value:', newValue);
          }
        });
      } else {
        console.error('Device info not available, cannot update server');
      }
    }
  });
}

// Handle graceful shutdown
process.on('SIGINT', function() {
  console.log('Unregistering client...');
  if (deviceInfo) {
    lwm2mClient.unregister(deviceInfo, function(error) {
      if (error) {
        console.error('Unregistration failed:', error);
      } else {
        console.log('Client unregistered successfully');
      }
      process.exit();
    });
  } else {
    console.log('Client was not registered, exiting...');
    process.exit();
  }
});
