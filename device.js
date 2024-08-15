const lwm2mClient = require('lwm2m-node-lib').client;
const coap = require('coap');

// Enable CoAP debugging
coap.debug = true;

const config = {
  server: {
    host: 'localhost',
    port: 5683
  },
  client: {
    lifetime: 60,
    endpointName: 'WaterMeter123',
    version: '1.0'
  }
};

// Initialize the client
lwm2mClient.init(config);

console.log('Client initialized with config:', JSON.stringify(config, null, 2));

// Function to log the current state of the registry
function logRegistryState() {
  console.log('Current registry state:');
  lwm2mClient.registry.list(function(error, objects) {
    if (error) {
      console.error('Error listing registry:', error);
    } else {
      console.log(JSON.stringify(objects, null, 2));
    }
  });
}

// Add standard LWM2M objects
function addStandardObjects(callback) {
  const standardObjects = [
    { objectUri: '/0/0', objectName: 'LWM2M Security' },
    { objectUri: '/1/0', objectName: 'LWM2M Server' },
    { objectUri: '/3/0', objectName: 'Device' }
  ];

  function createNextObject(index) {
    if (index >= standardObjects.length) {
      callback();
      return;
    }

    const obj = standardObjects[index];
    lwm2mClient.registry.create(obj.objectUri, function(error) {
      if (error) {
        console.error(`Error creating ${obj.objectName} object:`, error);
      } else {
        console.log(`${obj.objectName} object created`);
      }
      createNextObject(index + 1);
    });
  }

  createNextObject(0);
}

// Add standard objects and then register
addStandardObjects(function() {
  logRegistryState();

  // Register the client
  console.log('Attempting to register client...');
  lwm2mClient.register(config.server.host, config.server.port, null, config.client.endpointName,
    function (error, deviceInfo) {
      if (error) {
        console.error('Registration failed:', error);
        console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        return;
      }
      console.log('Device registered successfully:', deviceInfo);

      // Rest of the code remains the same...
    }
  );
});

// The rest of your code (updateWaterValue, generateWaterValue, etc.) remains the same...
