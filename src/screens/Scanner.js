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
        console.log("Requesting Android BLE permissions...");
        const requiredPermissions = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ].filter(Boolean);

        const granted = await PermissionsAndroid.requestMultiple(requiredPermissions);
        console.log("Permission results:", granted);

        // Check if all required permissions are granted
        const allGranted = requiredPermissions.every(
          (perm) => granted[perm] === PermissionsAndroid.RESULTS.GRANTED
        );

        if (allGranted) {
          console.log("All required BLE permissions granted!");
          return true;
        } else {
          // Check for never_ask_again
          const neverAskAgain = requiredPermissions.some(
            (perm) => granted[perm] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
          );
          if (neverAskAgain) {
            alert(
              "Some permissions are permanently denied. Please enable them in Settings > Apps > ChorusAssetManagementDemo > Permissions."
            );
          } else {
            alert(
              "Some required permissions were denied. BLE scanning will not work without them."
            );
          }
          console.log("Some BLE permissions denied:", granted);
          return false;
        }
      } catch (err) {
        console.warn("Android permission request error:", err);
        return false;
      }
    } else if (Platform.OS === "ios") {
      try {
        const locationWhileInUse = await request(
          PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        );
        
        if (locationWhileInUse === RESULTS.GRANTED) {
          // Request always permission after a delay
          setTimeout(async () => {
            try {
              await request(PERMISSIONS.IOS.LOCATION_ALWAYS);
            } catch (err) {
              console.warn("Always permission request failed:", err);
            }
          }, 2000);
          return true;
        } else {
          console.warn("Location permission denied");
          return false;
        }
      } catch (err) {
        console.warn("Permission request error:", err);
        return false;
      }
    }
    return true; // Default fallback
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
      
      if (!hasPermissions) {
        console.error("Required permissions not granted. Cannot start BLE scan.");
        observer.onError(new Error("Required permissions not granted"));
        return;
      }
      
      console.log("Permissions granted, starting device scan...");
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
