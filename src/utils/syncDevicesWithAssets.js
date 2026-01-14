import { Platform } from "react-native";

function processBase64ManufacturerData(manufacturerData) {
  // Decode Base64 string into a Uint8Array
  const decodedBytes = Uint8Array.from(atob(manufacturerData), (char) =>
    char.charCodeAt(0)
  );

  // Extract the last 6 bytes for the MAC address
  const macAddressData = decodedBytes.slice(-6);

  // Convert the MAC address bytes to a string
  const macAddressString = Array.from(macAddressData)
    .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
    .join(":");

  // Convert the entire manufacturer data to a hex string
  const payloadString = Array.from(decodedBytes)
    .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
    .join("");

  return { macAddressString, payloadString };
}

function formatDeviceId(deviceId) {
  return deviceId.replace(/:/g, "").toLowerCase();
}

export const syncDevicesWithAssets = (devices) => {
  if (devices?.length === 0) return;

  // Create a Map for fast lookups
  const deviceMap = new Map(
    devices.map((device) => {
      const deviceId =
        Platform.OS === "ios"
          ? formatDeviceId(
              processBase64ManufacturerData(device.manufacturerData)
                .macAddressString
            )
          : formatDeviceId(device.id);

      return [deviceId, device.rssi];
    })
  );
  return deviceMap;
};
