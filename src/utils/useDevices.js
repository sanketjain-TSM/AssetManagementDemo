import {useState, useEffect, useMemo} from 'react';
import {AppState, PermissionsAndroid, Platform} from 'react-native';
import scanner from '../screens/Scanner'; // Import your BLE scanner logic
import {State} from 'react-native-ble-plx';
import {Buffer} from 'buffer';
import Geolocation from 'react-native-geolocation-service';
import axios from 'axios';
import {RESULTS} from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

console.log('Scanning started...');

const DEVICE_LIST_LIMIT = 50;

const useDevices = () => {
  const [devices, setDevices] = useState([]);
  const [bleState, setBleState] = useState(State.Unknown);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState(null);

  const connectedDeviceIds = new Set();
  const updatingCharacteristics = new Set(); // Track updates in progress
  const activeSubscriptions = new Map();
  const connectionInProgress = {};

  const {start, stop, observe} = useMemo(() => scanner(), []);

  function hexToBase64(hexString) {
    // Convert hex string to bytes and encode as base64
    const bytes = Buffer.from(hexString, 'hex');
    return bytes.toString('base64');
  }

  // const requestLocationPermission = async () => {
  //   try {
  //     if (Platform.OS === "ios") {
  //       const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
  //       if (result === RESULTS.GRANTED) {
  //         console.log("Location permission granted.");
  //         // Permission granted, proceed with accessing location
  //       } else {
  //         console.log("Location permission denied.");
  //         // Handle permission denied case
  //       }
  //     } else if (Platform.OS === "android") {
  //       const granted = await PermissionsAndroid.request(
  //         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  //         {
  //           title: "Location Permission",
  //           message:
  //             "We need access to your location to provide location-based services.",
  //           buttonNeutral: "Ask Me Later",
  //           buttonNegative: "Cancel",
  //           buttonPositive: "OK",
  //         }
  //       );
  //       if (granted === PermissionsAndroid.RESULTS.GRANTED) {
  //         console.log("Location permission granted.");
  //         // Permission granted, proceed with accessing location
  //       } else {
  //         console.log("Location permission denied.");
  //         // Handle permission denied case
  //       }
  //     }
  //   } catch (err) {
  //     console.warn(err);
  //   }
  // };

  const getCurrentLocation = async () => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          const {latitude, longitude, accuracy} = position.coords;
          // console.log({ latitude, longitude, accuracy });
          resolve({latitude, longitude, accuracy});
        },
        error => reject(error),
        {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
      );
    });
  };

  async function sendDataToDozzel(
    deviceWithCharacteristic,
    LOGGING_API_ENDPOINT,
  ) {
    try {
      // Example static values for orgId, metaType, and metaVersion
      const orgID = 'xc37';
      const metaType = '2';
      const metaVersion = '1.1.12.0';

      // Simulated GPS coordinates, replace with actual location if available
      // const location = await getCurrentLocation();
      const latitudeMicro =
        Platform.OS === 'ios' ? deviceWithCharacteristic?.latitude : ''; // Example: latitude in microdegrees
      const longitudeMicro =
        Platform.OS === 'ios' ? deviceWithCharacteristic?.longitude : ''; // Example: longitude in microdegrees
      const timestamp = deviceWithCharacteristic.timestamp; // Current time in seconds
      // console.log(deviceWithCharacteristic);
      const payloadDictionary = {
        deviceId: deviceWithCharacteristic.id,
        orgId: orgID,
        deviceLocation: {
          point: {
            latitudeMicro: Math.round(latitudeMicro * 1_000_000),
            longitudeMicro: Math.round(longitudeMicro * 1_000_000),
          },
          accuracyCm: 0,
        },
        beaconPayloads: [
          {
            // bleManufacturerData: hexToBase64(deviceWithCharacteristic.manufacturedata || ""),
            bleManufacturerData:
              deviceWithCharacteristic?.manufacturerData || '',
            receiveTime: {
              seconds: Math.floor(Date.now() / 1000),
            },
            rssiDbm: deviceWithCharacteristic.rssi,
          },
        ],
        metaData: {
          type: metaType,
          version: metaVersion,
        },
      };

      // console.log("Payload to send:", payloadDictionary);

      // console.log("Data sent successfully:", response.data);

      // Sending logs to the logging API endpoint if ENABLE_LOGGING is true
      // console.log(JSON.stringify(payloadDictionary));
      const chorusResponse = await axios.post(
        'https://api-dev.chorussystems.net/v1alpha1/payloads',
        payloadDictionary,
      );

      if (ENABLE_LOGGING) {
        const body = {requestPayload: payloadDictionary};
        body['responsePayload'] = chorusResponse?.config.data;

        const logResponse = await axios.post(LOGGING_API_ENDPOINT, body);
        // console.log("Logs sent successfully to Dozzle:", logResponse.data);
      }
    } catch (error) {
      console.error('Error sending data to Dozzel:', error.message);
    }
  }

  function startSendingData(deviceWithCharacteristic) {
    setInterval(() => {
      let count = 0;
      const intervalId = setInterval(() => {
        if (count >= 30) {
          clearInterval(intervalId);
        } else {
          sendDataToDozzel(
            deviceWithCharacteristic,
            'http://34.66.72.114:8000/ble/log',
            (ENABLE_LOGGING = true),
          );
          count++;
        }
      }, 1000);
    }, 170000);
  }

  const monitorConnection = async device => {
    device.onDisconnected(() => {
      // console.log(
      //   `Device ${device.id} disconnected. Attempting reconnection...`
      // );
      connectedDeviceIds.delete(device.id); // Remove from connected devices
      start(); // Restart scanning to rediscover and reconnect
    });
  };

  // Manage subscriptions
  const manageSubscription = (deviceId, characteristicUuid, subscription) => {
    const key = `${deviceId}_${characteristicUuid}`;
    if (activeSubscriptions.has(key)) {
      const existingSubscription = activeSubscriptions.get(key);
      if (existingSubscription) {
        existingSubscription.remove(); // Clean up existing subscription
      }
    }
    activeSubscriptions.set(key, subscription); // Add new subscription
  };
  const clearSubscriptions = () => {
    activeSubscriptions.forEach(subscription => subscription.remove());
    activeSubscriptions.clear();
  };

  // Subscribe to characteristic notifications
  const subscribeToCharacteristic = async (
    device,
    serviceUUID,
    characteristicUUID,
    retries = 3,
  ) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const subscription = await device.monitorCharacteristicForService(
          serviceUUID,
          characteristicUUID,
          (error, characteristic) => {
            if (error) {
              // console.log(
              //   `Notification error on ${characteristicUUID}:`,
              //   error
              // );
              return;
            }
            if (characteristic?.value) {
              const decodedValue = Buffer.from(
                characteristic.value,
                'base64',
              ).toString('utf-8');
              // console.log(
              //   `Notification received for ${characteristicUUID}:`,
              //   decodedValue
              // );
            }
          },
        );
        // console.log(`Successfully subscribed to ${characteristicUUID}`);
        return subscription;
      } catch (error) {
        console.warn(
          `Attempt ${attempt}: Failed to subscribe to ${characteristicUUID}:`,
          error,
        );
        if (attempt === retries) throw error; // Fail after max retries
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }
  };

  function processBase64ManufacturerData(manufacturerData) {
    // Decode Base64 string into a Uint8Array
    const decodedBytes = Uint8Array.from(atob(manufacturerData), char =>
      char.charCodeAt(0),
    );

    // Extract the last 6 bytes for the MAC address
    const macAddressData = decodedBytes.slice(-6);

    // Convert the MAC address bytes to a string
    const macAddressString = Array.from(macAddressData)
      .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
      .join(':');

    // Convert the entire manufacturer data to a hex string
    const payloadString = Array.from(decodedBytes)
      .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
      .join('');

    return {macAddressString, payloadString};
  }
  // Update device characteristics
  const updateCharacteristics = async device => {
    if (updatingCharacteristics.has(device.id)) {
      // console.log(
      //   `Characteristics update already in progress for ${device.id}`
      // );
      return;
    }

    updatingCharacteristics.add(device.id); // Mark as updating
    try {
      // console.log(`Updating characteristics for device: ${device.id}`);

      // Discover services and characteristics
      await device.discoverAllServicesAndCharacteristics();
      const services = await device.services();
      const location = Platform.OS === 'ios' ?? (await getCurrentLocation());

      for (const service of services) {
        try {
          const characteristics = await device.characteristicsForService(
            service.uuid,
          );

          for (const characteristic of characteristics) {
            if (characteristic.isNotifiable || characteristic.isIndicatable) {
              const subscription = await subscribeToCharacteristic(
                device,
                service.uuid,
                characteristic.uuid,
              );
              manageSubscription(device.id, characteristic.uuid, subscription);
            }

            if (characteristic.isReadable) {
              const characteristicValue = await characteristic.read();
              const decodedValue = characteristicValue.value;
              // ? Buffer.from(characteristicValue.value, "base64").toString(
              //     "utf-8"
              //   )
              // : null;
              // const location = await getCurrentLocation();
              setDevices(prevDevices => {
                const deviceIndex = prevDevices.findIndex(
                  d => d.id === device.id,
                );

                const deviceWithCharacteristic = {
                  ...device,
                  latitude: Platform.OS === 'ios' ? location?.latitude : '',
                  longitude: Platform.OS === 'ios' ? location?.longitude : '',
                  characteristicValue: decodedValue,
                  macAddressString: processBase64ManufacturerData(
                    device.manufacturerData,
                  ).macAddressString,
                };

                if (Platform.OS === 'ios') {
                  // Send Data to Dozzle with TimeIntarvals
                  startSendingData(deviceWithCharacteristic);
                }

                if (deviceIndex >= 0) {
                  const updatedDevices = [...prevDevices];
                  updatedDevices[deviceIndex] = {
                    ...updatedDevices[deviceIndex],
                    ...deviceWithCharacteristic,
                  };
                  return updatedDevices;
                }
                return [
                  deviceWithCharacteristic,
                  ...prevDevices.slice(0, DEVICE_LIST_LIMIT - 1),
                ];
              });
            }
          }
        } catch (serviceErr) {
          console.warn(`Error processing service ${service.uuid}:`, serviceErr);
        }
      }
    } catch (err) {
      console.error(
        `Error updating characteristics for device ${device.id}:`,
        err.message,
      );
    } finally {
      updatingCharacteristics.delete(device.id); // Mark as finished updating
    }
  };

  // App state listener for managing foreground/background transitions
  useEffect(() => {
    const handleAppStateChange = nextAppState => {
      if (nextAppState === 'background') {
        console.log(
          'App moved to background. Adjust BLE operations if needed.',
        );
      } else if (nextAppState === 'active') {
        console.log('App moved to foreground. Resume BLE operations.');
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => {
      subscription.remove();
    };
  }, []);

  function formatDateTime() {
    const date = new Date();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();

    const formattedDate = [
      month.toString().padStart(2, '0'),
      day.toString().padStart(2, '0'),
      year,
    ].join('-');

    const formattedTime = [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0'),
    ].join(':');

    return `${formattedDate} ${formattedTime} ${ampm}`;
  }
  const logAssetData = async deviceWithLocation => {
    const token = await AsyncStorage.getItem('token');
    console.log(token);
    console.log({
      assetID: deviceWithLocation?.macAddressString,
      RSSI: deviceWithLocation?.rssi,
      timestamp: new Date().toISOString(),
    });
    axios
      .post(
        `https://api.matorg.com/v1/assets/bluetooth/log`,
        {
          assetID: deviceWithLocation?.macAddressString,
          RSSI: deviceWithLocation?.rssi,
          timestamp: new Date().toISOString(),
        },
        {headers: {Authorization: `Bearer ${token}`}},
      )
      .catch(err => console.log(err));
  };
  // Initialize BLE scanning
  useEffect(() => {
    // requestLocationPermission();
    observe({
      onStarted: startedState => setStarted(startedState),
      onStateChanged: changedBleState => setBleState(changedBleState),
      onDeviceDetected: async device => {
        // console.log(device, "device");
        // if (Platform.OS === "ios") {
        //   try {
        //     if (connectedDeviceIds.has(device.id)) {
        //       await updateCharacteristics(device);
        //       return;
        //     }

        //     if (!device.isConnectable) {
        //       // console.log(`Device ${device.id} is not connectable. Skipping.`);
        //       return;
        //     }

        //     const connectionInProgressKey = `${device.id}_connecting`;
        //     if (connectionInProgress[connectionInProgressKey]) return;

        //     connectionInProgress[connectionInProgressKey] = true;

        //     const connectedDevice = await device.connect();
        //     await monitorConnection(connectedDevice); // Monitor connection state
        //     connectedDeviceIds.add(connectedDevice.id);

        //     await updateCharacteristics(connectedDevice);

        //     delete connectionInProgress[connectionInProgressKey];
        //   } catch (err) {
        //     console.error(`Error handling device ${device.id}:`, err.message);
        //   }
        // } else {
        const location =
          Platform.OS === 'ios' ? await getCurrentLocation() : {};
        setDevices(prevDevices => {
          const deviceIndex = prevDevices.findIndex(d => d.id === device.id);
          let deviceWithLocation = {
            ...device,
            latitude: Platform.OS === 'ios' ? location?.latitude : '',
            longitude: Platform.OS === 'ios' ? location?.longitude : '',
            macAddressString: processBase64ManufacturerData(
              device.manufacturerData,
            ).macAddressString,
          };

          logAssetData(deviceWithLocation);
          if (deviceIndex >= 0) {
            // Update existing device
            const updatedDevices = [...prevDevices];
            updatedDevices[deviceIndex] = {...deviceWithLocation};
            return updatedDevices;
          } else {
            // Add new device
            return [
              deviceWithLocation,
              ...prevDevices.slice(0, DEVICE_LIST_LIMIT - 1),
            ];
          }
        });
        // }
      },
      onError: err => setError(err.toString()),
    });

    start();

    return () => {
      clearSubscriptions();
      stop();
    };
  }, [observe, start, stop]);
  return {devices, bleState, started, error};
};

export default useDevices;
