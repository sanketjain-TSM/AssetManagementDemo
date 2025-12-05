import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, View, Text, Image, Animated } from "react-native";
import LinearGradient from "react-native-linear-gradient"; // Import LinearGradient
import { useDevicesContext } from "../context/DeviceContext";
import { syncDevicesWithAssets } from "../utils/syncDevicesWithAssets";

export const ProximityProgressBar = ({ deviceId }) => {
  const { devices } = useDevicesContext();
  const [proximityValue, setProximityValue] = useState(-100);
  const animatedWidth = useRef(new Animated.Value(0)).current; // Ref to hold the animated value for width
  const [gradientColors, setGradientColors] = useState(["#F44336", "#E57373"]); // Initial gradient colors

  useEffect(() => {
    const updateProximity = () => {
      const syncedValue = syncDevicesWithAssets(devices)?.get(deviceId);
      if (syncedValue !== undefined) {
        setProximityValue(syncedValue);
      }
    };

    updateProximity();
    const interval = setInterval(updateProximity, 10); // Update every 100ms

    return () => clearInterval(interval);
  }, [deviceId, devices]);

  const calculateStrength = (proximityValue) => {
    return proximityValue >= -40
      ? 6
      : proximityValue > -50
      ? 5
      : proximityValue > -60
      ? 4
      : proximityValue > -70
      ? 3
      : proximityValue > -80
      ? 2
      : proximityValue > -90
      ? 1
      : 0;
  };

  useEffect(() => {
    const strength = calculateStrength(proximityValue);
    const widthPercentage = (strength / 6) * 100; // Convert strength to a percentage

    Animated.timing(animatedWidth, {
      toValue: widthPercentage,
      duration: 500,
      useNativeDriver: false,
    }).start();

    const newGradientColors = getGradientColors(strength);
    setGradientColors(newGradientColors);
  }, [proximityValue]);

  const getGradientColors = (strength) => {
    return strength === 6
      ? ["#4CAF50", "#81C784"] // Green gradient
      : strength >= 4
      ? ["#FFEB3B", "#CDDC39"] // Yellow gradient
      : strength >= 2
      ? ["#FF9800", "#FFB74D"] // Orange gradient
      : ["#F44336", "#E57373"]; // Red gradient
  };

  return (
    <>
      <View style={styles.infoChild}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={require("../../assets/images/distance.png")}
            style={styles.icon}
          />
          <Text style={styles.infoTitle}>Proximity: </Text>
          <View style={styles.container}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: animatedWidth.interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            >
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.upperContainer}>
                <View style={styles.box}></View>
                <View style={styles.box}></View>
                <View style={styles.box}></View>
                <View style={styles.box}></View>
                <View style={styles.box}></View>
                <View style={styles.box}></View>
                <View style={styles.box}></View>
                <View style={styles.box}></View>
                <View style={styles.box}></View>
                <View style={styles.box}></View>
              </View>
            </Animated.View>
          </View>
        </View>
      </View>
      {/* <Text style={styles.rssiText}>{proximityValue} dBm</Text> */}
    </>
  );
};

const styles = StyleSheet.create({
  upperContainer: {
    position: "absolute",
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    top: 0,
    left: 0,
    width: "100%",
    height: 10,
    borderRadius: 10,
    overflow: "hidden",
  },
  box: {
    width: "10%",
    height: "100%",
    overflow: "hidden",
    borderRightWidth: 1,
    borderRightColor: "#A9A9A9",
  },
  container: {
    position: "relative",
    width: "85%",
    height: 10,
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 10,
    marginBottom: 10,
  },
  progressBar: {
    height: "100%",
    borderRadius: 15,
  },
  rssiText: {
    color: "black",
    fontWeight: "bold",
  },
  infoChild: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoTitle: {
    fontSize: 14,
    color: "#333333",
  },
  icon: {
    width: 22,
    height: 22,
    marginLeft: -1,
    marginRight: 5,
  },
});
