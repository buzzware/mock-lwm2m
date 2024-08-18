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


// Function to get current timestamp divided by 1000.0
function getCurrentTimestampValue() {
  return (Date.now() / 1000.0).toFixed(3);
}


function registryCreate(path) {
  return new Promise((resolve, reject) => {
    lwm2mClient.registry.create(path, function (error) {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}


function registrySetResource(path, resourceId, value) {
  return new Promise((resolve, reject) => {
    lwm2mClient.registry.setResource(path, resourceId, value, function (error) {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}


function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//write a function called register that wraps lwm2mClient.register with a promise


function register(host, port, endpointName) {
  return new Promise((resolve, reject) => {
    lwm2mClient.register(host, port, null, endpointName, function (error, result) {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}



function handleRead(objectName, instanceId, resourceId, value, callback) {
  console.log('\nValue read:\n--------------------------------\n');
  console.log('-> objectName: %s', objectName);
  console.log('-> instanceId: %s', instanceId);
  console.log('-> resourceId: %s', resourceId);
  console.log('-> Read Value: %s', value);
  //clUtils.prompt();

  callback(null,value);
}

// write a function called update that wraps lwm2mClient.update with a promise


function update(deviceInfo) {
  return new Promise((resolve, reject) => {
    lwm2mClient.update(deviceInfo, function (error) {
      if (error) {
        reject(error);
      } else {
        resolve("Update successful");
      }
    });
  });
}



// lwm2mClient.registry.setResource('/3424/0', 1, newValue, function (error) {
//   if (error) {
//     console.error('Failed to update local cumulative water:', error);
//   } else {
//     //console.log('Local timestamp updated to:', newValue);
//     // Update the server
//     if (deviceInfo) {
//       lwm2mClient.update(deviceInfo, function (error) {
//         if (error) {
//           console.error('Failed to update server:', error);
//         } else {
//           console.log('Server updated with new value:', newValue);
//         }
//       });
//     } else {
//       console.error('Device info not available, cannot update server');
//     }
//   }
// });




(async function() {
  try {

    let deviceInfo;

    // Initialize the client
    lwm2mClient.init(config);

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


    await registryCreate('/3424/0');
    console.log('cumulative water object created');
    await registrySetResource('/3424/0', 1, getCurrentTimestampValue());
    console.log('Initial cumulative water value set');

    console.log('BEGIN Setup Object 3');
    await registryCreate('/3/0');
    await registrySetResource('/3/0', 0, "Huey");
    console.log('END Setup Object 3');

    deviceInfo = await register(config.server.host, config.server.port, null, config.client.endpointName);
    console.log('Device registered:', deviceInfo);

    lwm2mClient.setHandler(deviceInfo.serverInfo, 'read', handleRead);

    for (let i=0;i<10;i++) {
      await delay(5000);

      const newValue = getCurrentTimestampValue();
      await registrySetResource('/3424/0', 1, newValue);
      await update(deviceInfo);
    }

    //setInterval(updateValue, 5000);   // Start periodic updates

    // // Create the object and set initial value
    // lwm2mClient.registry.create('/3424/0', function(error) {
    //   if (error) {
    //     console.error('Error creating water object:', error);
    //     return;
    //   }
    //   console.log('cumulative water object created');
    //
    //   lwm2mClient.registry.setResource('/3424/0', 1, getCurrentTimestampValue(), function(error) {
    //     if (error) {
    //       console.error('Error setting initial cumulative water value:', error);
    //       return;
    //     }
    //     console.log('Initial cumulative water value set');
    //
    //     // Register the client
    //     lwm2mClient.register(config.server.host, config.server.port, null, config.client.endpointName,
    //       function (error, result) {
    //         if (error) {
    //           console.error('Registration failed:', error);
    //           return;
    //         }
    //         console.log('Device registered:', result);
    //         deviceInfo = result;
    //
    //         lwm2mClient.setHandler(deviceInfo.serverInfo, 'read', handleRead);
    //
    //         // Start periodic updates
    //         setInterval(updateValue, 5000);
    //       });
    //   });
    // });

    console.log('finished');
  } catch(e) {
    console.log(e);
    console.log(e.response.data.error);
  } finally {
    process.exit();
  }
})();




