import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, Image } from "react-native";
import { syncDevicesWithAssets } from "../utils/syncDevicesWithAssets";
import { useDevicesContext } from "../context/DeviceContext";

export const HzSignalStrengthMeter = ({ rssi }) => {
  const totalBars = 30;
  const [rssiHistory, setRssiHistory] = useState([-100, -100, -100, -100]);
  const [mostRecentStrength, setMostRecentStrength] = useState(0); // For the most recent ping-pong effect
  const [direction, setDirection] = useState(1); // Direction for ping-pong (1 = forward, -1 = backward)

  const { devices } = useDevicesContext();
  const proximityValue = syncDevicesWithAssets(devices)?.get(rssi);

  // Update RSSI history when a new proximity value is received
  useEffect(() => {
    if (proximityValue != null) {
      setRssiHistory((prev) => [...prev.slice(-3), proximityValue]); // Keep only the last 4 entries
    }
  }, [proximityValue]);

  // Ping-pong effect for the most recent RSSI
  useEffect(() => {
    const interval = setInterval(() => {
      const targetStrength = calculateStrength(
        rssiHistory[rssiHistory.length - 1] || -100
      );

      setMostRecentStrength((prev) => {
        const newStrength = prev + direction;

        // Reverse direction if limits are reached
        if (newStrength >= targetStrength || newStrength <= 0) {
          setDirection((prevDirection) => -prevDirection); // Flip direction
        }

        return Math.max(0, Math.min(targetStrength, newStrength)); // Clamp to [0, targetStrength]
      });
    }, 0); // Very fast update interval (0ms)

    return () => clearInterval(interval); // Cleanup interval
  }, [rssiHistory, direction]);

  const calculateStrength = (proximityValue) => {
    if (proximityValue >= -40) return 30; // Full strength
    if (proximityValue > -50) return 24; // 24 bars for -41 to -50
    if (proximityValue > -60) return 18; // 18 bars for -51 to -60
    if (proximityValue > -70) return 12; // 12 bars for -61 to -70
    if (proximityValue > -80) return 6; // 6 bars for -71 to -80
    if (proximityValue > -90) return 3; // 3 bars for -81 to -90
    return 0;
  };

  const renderSignalBars = (strength, color) =>
    [...Array(totalBars)].map((_, index) => (
      <View
        key={index}
        style={[
          styles.signalBar,
          { backgroundColor: index < strength ? color : "#E0E0E0" },
        ]}
      />
    ));

  return (
    <View style={styles.parentContainer}>
      <Image
        source={require("../../assets/images/distance.png")}
        style={styles.icon}
      />
      <View>
        <Text style={styles.infoTitle}>Proximity :</Text>
        <Text>RSSI : {proximityValue}</Text>
      </View>
      <View style={styles.container}>
        <View style={{ flexDirection: "column-reverse", alignItems: "center" }}>
          {rssiHistory.map((rssiValue, index) => {
            let color;
            if (index === rssiHistory.length - 1)
              color = "#607c3c"; // Most recent: green
            else if (index === rssiHistory.length - 2)
              color = "#819c12"; // 2nd most recent: light green
            else if (index === rssiHistory.length - 3)
              color = "#acc32f"; // 3rd most recent: yellow
            else color = "#b5e550"; // Oldest: red

            const strengthToRender =
              index === rssiHistory.length - 1
                ? mostRecentStrength // Apply ping-pong effect to the most recent
                : calculateStrength(rssiValue); // Static for others

            return (
              <View style={styles.infoChild} key={index}>
                <View style={styles.signalBars}>
                  {renderSignalBars(strengthToRender, color)}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  parentContainer: {
    gap: 8,
    flexDirection: "row",
  },
  container: {
    width: "100%",
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  signalBars: {
    flexDirection: "row",
    alignItems: "baseline",
    marginLeft: 4,
    marginBottom: 5,
    verticalAlign: "middle",
    textAlign: "left",
  },
  icon: {
    width: 22,
    height: 22,
    marginLeft: -1,
    marginRight: -3,
  },
  infoTitle: {
    fontSize: 14,
    color: "#333333",
  },
  infoChild: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  signalBar: {
    width: 4.5,
    height: 7,
    borderRadius: 1,
    marginRight: 1,
  },
});
