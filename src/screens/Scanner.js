import {PermissionsAndroid, Platform, Alert, Linking} from 'react-native';
import {BleManager, State} from 'react-native-ble-plx';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import Geolocation from 'react-native-geolocation-service';
import BluetoothStateManager from 'react-native-bluetooth-state-manager';
import {promptForEnableLocationIfNeeded} from 'react-native-android-location-enabler';

const scanner = () => {
  const bleManager = new BleManager();
  let subscription = null;
  let retryCount = 0;
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 3000;

  // Observer object for external listeners
  let observer = {
    onStarted: () => {},
    onStateChanged: () => {},
    onDeviceDetected: () => {},
    onError: () => {},
  };

  const observe = newObserver => {
    observer = newObserver;
  };

  const scanOptions = {
    allowDuplicates: true, // Let you detect the same device multiple times
  };

  /**
   * Conditionally request BLE or location permissions depending on Android version.
   * For iOS, we request location "When In Use" and optionally "Always."
   */

  async function requestBlePermissionsAndroid() {
    // 1. Early return if not Android
    if (Platform.OS !== 'android') return true;

    // 2. Determine if we're running on Android 12 (API 31) or higher
    const isAndroid12OrAbove = Platform.Version >= 31;

    // 3. Build the list of permissions needed
    const permissionsToRequest = isAndroid12OrAbove
      ? [
          // PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]
      : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];

    try {
      // 4. Request all permissions at once
      const granted = await PermissionsAndroid.requestMultiple(
        permissionsToRequest,
      );

      // 5. Find any permissions that are denied or "never ask again"
      const deniedPermissions = permissionsToRequest.filter(
        perm =>
          granted[perm] === PermissionsAndroid.RESULTS.DENIED ||
          granted[perm] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
      );

      if (deniedPermissions.length > 0) {
        console.warn("❌ Denied or 'never ask again' for:", deniedPermissions);

        // If user selected "Never Ask Again," prompt to open Settings
        const neverAskAgain = deniedPermissions.some(
          perm => granted[perm] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
        );
        if (neverAskAgain) {
          Alert.alert(
            'Permissions Required',
            'We need additional permissions for BLE scanning. Please enable them in Settings.',
            [
              {
                text: 'Open Settings',
                onPress: () => Linking.openSettings(),
              },
              {text: 'Cancel', style: 'cancel'},
            ],
          );
        }
        return false;
      }

      // 6. All permissions are granted
      console.log('✅ All BLE permissions granted on Android!');
      return true;
    } catch (err) {
      console.warn('Error requesting BLE permissions on Android:', err);
      return false;
    }
  }

  async function ensureBluetoothIsOn() {
    const currentState = await bleManager.state();

    if (currentState !== State.PoweredOn) {
      console.warn('Bluetooth is OFF. Requesting user to enable it...');

      // This displays a system dialog on Android allowing the user
      // to grant permission to turn Bluetooth on immediately.
      await requestBlePermissionsAndroid();
      await BluetoothStateManager.requestToEnable();
    }
  }

  // Location function started here...
  async function ensureLocationIsOn() {
    try {
      // Priority can be HIGH_ACCURACY or BALANCED_POWER_ACCURACY, etc.
      const enableResult = await promptForEnableLocationIfNeeded();

      // If we reach here without an error, the user has enabled location
      console.log('✅ Location is now ON (GPS enabled).');
      return true;
    } catch (error) {
      // The user may have pressed 'No, thanks' or an error occurred
      console.error('❌ Failed to enable location:', error);
      Alert.alert(
        'Location Required',
        "We couldn't enable your device's GPS. Some app features may not work.",
      );
      return false;
    }
  }

  const start = () => {
    if (subscription) {
      stop(); // Stop any existing subscription or scan
    }
    retryCount = 0;

    try {
      subscription = bleManager.onStateChange(async state => {
        observer.onStateChanged(state);
        console.log('Bluetooth Adapter State:', state);

        if (state === State.PoweredOff) {
          await ensureBluetoothIsOn();
        }
        if (state === State.PoweredOn) {
          await ensureLocationIsOn();
          await requestBlePermissionsAndroid();
          initiateScan();
        }
      }, true);
    } catch (error) {
      observer.onError(error);
    }
  };

  const initiateScan = async () => {
    try {
      console.log('Starting BLE scan...');
      bleManager.startDeviceScan(
        // ["8EC90001-F315-4F60-9FB8-838830DAEA50"],
        null,
        scanOptions,
        (error, device) => {
          if (error) {
            console.log('Scan Error:', error);
            observer.onError(error);
            handleRetry();
            return;
          }

          const base64Data = device?.manufacturerData;
          if (!base64Data) return;

          const manufacturerBytes = Buffer.from(base64Data, 'base64'); // Convert base64 to byte buffer
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
        },
      );
      observer.onStarted(true);
    } catch (error) {
      console.log('Initiate Scan Error:', error);
      observer.onError(error);
      handleRetry();
    }
  };

  /**
   * Handle retry logic if scanning fails or times out
   */
  const handleRetry = () => {
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`Retrying scan... Attempt ${retryCount}/${MAX_RETRIES}`);
      stop();
      setTimeout(() => {
        initiateScan();
      }, RETRY_DELAY_MS);
    } else {
      console.error('Max retries reached. Stopping scan.');
      stop();
      observer.onError(new Error('Maximum scan retries reached.'));
    }
  };

  /**
   * Stop scanning and remove the subscription
   */
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
