import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, State } from "react-native-ble-plx";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";
import Geolocation from "react-native-geolocation-service";
import { Buffer } from "buffer";

const scanner = () => {
  const bleManager = new BleManager();
  let subscription = null; // acts as 'started' flag
  let retryCount = 0; // Retry attempt counter
  const MAX_RETRIES = 3; // Maximum retry attempts
  const RETRY_DELAY_MS = 3000; // Delay between retries (3 seconds)

  const startBackgroundLocation = async () => {
    // If user only has "When In Use", iOS will see you using location in background
    // and may trigger a second prompt eventually.
    Geolocation.watchPosition(
      (position) => {
        console.log("Background position:", position);
      },
      (error) => {
        console.log("Background position error:", error);
      },
      { enableHighAccuracy: true, distanceFilter: 0 }
    );
  };

  // Default observer with empty functions
  let observer = {
    onStarted: () => {},
    onStateChanged: () => {},
    onDeviceDetected: () => {},
    onError: () => {},
  };

  const observe = (newObserver) => {
    observer = newObserver;
  };

  const scanOptions = {
    allowDuplicates: true, // Avoid duplicate detections
  };
  const requestBlePermissions = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH,
        ]);

        if (
          granted["android.permission.ACCESS_FINE_LOCATION"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.BLUETOOTH_SCAN"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.BLUETOOTH_CONNECT"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.BLUETOOTH_ADVERTISE"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.BLUETOOTH"] ===
            PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log("BLE permissions granted!");
          return true;
        } else {
          console.log("BLE permissions denied.");
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else if (Platform.OS === "ios") {
      try {
        // const whenInUseGranted = await Geolocation.requestAuthorization(
        //   "whenInUse"
        // );
        // if (whenInUseGranted !== "granted") {
        //   startBackgroundLocation();
        //   console.warn("WhenInUse permission denied");
        //   return false; // Stop further processing if "whenInUse" is not granted
        // }
        // console.log(
        //   "When In Use permission granted. Requesting Always Allow..."
        // );

        // const alwaysGranted = await Geolocation.requestAuthorization("always");
        // console.log(alwaysGranted, "alwaysGranted");
        // if (alwaysGranted !== "granted") {
        //   console.warn("Always permission denied");
        //   return false;
        // }
        const alwaysStatus = await check(PERMISSIONS.IOS.LOCATION_ALWAYS);
        const locationWhileInUse = await request(
          PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        );
        // console.log("locationWhileInUse", locationWhileInUse);
        // if (alwaysStatus !== RESULTS.GRANTED) {
        setTimeout(async () => {
          const alwaysRequest = await request(PERMISSIONS.IOS.LOCATION_ALWAYS);
          // console.log("alwaysStatus", alwaysStatus);
        }, 2000);
        // console.log("alwaysStatus out side");
        // if (alwaysRequest !== RESULTS.GRANTED) {
        //   console.warn("Always Allow permission denied.");
        //   return;
        // }
        // console.log("Always Allow permission granted.");
        return true;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS doesn't require explicit runtime permissions
  };
  const start = () => {
    if (subscription) {
      stop(); // Ensure no previous scan is active
    }
    retryCount = 0; // Reset retry count before starting

    try {
      subscription = bleManager.onStateChange((state) => {
        observer.onStateChanged(state);
        console.log("State:", state);

        if (state === State.PoweredOn) {
          initiateScan();
        }
      }, true);
    } catch (error) {
      observer.onError(error);
    }
  };

  const initiateScan = async () => {
    try {
      console.log("Starting BLE scan...");
      const hasPermissions = await requestBlePermissions();
      bleManager.startDeviceScan(
        // ["8EC90001-F315-4F60-9FB8-838830DAEA50"],
        null,
        scanOptions,
        (error, device) => {
          if (error) {
            console.log("Scan Error:", error);
            observer.onError(error);
            handleRetry();
            return;
          }

          const base64Data = device?.manufacturerData;
          if (!base64Data) return;

          const manufacturerBytes = Buffer.from(base64Data, "base64"); // Convert base64 to byte buffer
          const bytes = [...manufacturerBytes]; // Get raw byte array

          if (
            bytes.length > 5 &&
            bytes[0] === 0xe0 &&
            bytes[1] === 0x00 &&
            (bytes[3] === 0x19 || bytes[3] === 0x17 || bytes[3] === 0x1a)
          ) {
            observer.onDeviceDetected(device);
          }

          // const base64Data = device?.manufacturerData?.data;
          // console.log(base64Data, "base64Data", device?.manufacturerData);
          // const manufacturerBytes = Buffer.from(base64Data, "base64");
          // console.log(manufacturerBytes, "manufacturerBytes");
          // const bytes = [...manufacturerBytes].map((char) =>
          //   char.charCodeAt(0)
          // );
          // console.log(bytes, "bytes");
          // if (
          //   bytes.length > 5 &&
          //   bytes[0] === 0xe0 &&
          //   bytes[1] === 0x00 &&
          //   (bytes[3] === 0x19 || bytes[3] === 0x17 || bytes[3] === 0x1a)
          // ) {
          //   observer.onDeviceDetected(device);
          // }
          // Device detected
          // if (device && device?.name?.includes("Google")) {
          // observer.onDeviceDetected(device);
          // }
        }
      );
      observer.onStarted(true);
    } catch (error) {
      console.log("Initiate Scan Error:", error);
      observer.onError(error);
      handleRetry();
    }
  };

  const handleRetry = () => {
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`Retrying scan... Attempt ${retryCount}/${MAX_RETRIES}`);
      stop(); // Stop the previous scan
      setTimeout(() => {
        initiateScan(); // Retry after a delay
      }, RETRY_DELAY_MS);
    } else {
      console.error("Max retries reached. Stopping scan.");
      stop();
      observer.onError(new Error("Maximum scan retries reached."));
    }
  };

  const stop = () => {
    if (subscription) {
      try {
        bleManager.stopDeviceScan();
        subscription.remove();
      } catch (error) {
        observer.onError(error);
      }
      subscription = null;
      observer.onStarted(false);
    }
  };

  return {
    start,
    stop,
    observe,
  };
};

export default scanner;
