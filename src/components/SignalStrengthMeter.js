import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, Image } from "react-native";
import { syncDevicesWithAssets } from "../utils/syncDevicesWithAssets";
import { useDevicesContext } from "../context/DeviceContext";

export const SignalStrengthMeter = ({ rssi }) => {
  const [rssiHistory, setRssiHistory] = useState([-100, -100, -100, -100]);
  const [role, setRole] = useState("");

  const { devices } = useDevicesContext();
  // if (rssi == null) return null;
  // console.log(syncDevicesWithAssets(devices)?.get(rssi), rssi);
  const proximityValue = syncDevicesWithAssets(devices)?.get(rssi);

  useEffect(() => {
    let isMounted = true;
    const fetchRole = async () => {
      const role = await AsyncStorage.getItem("role");
      if (isMounted) {
        setRole(role);
      }
    };
    fetchRole();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (proximityValue != null) {
      setRssiHistory((prev) => [...prev.slice(-3), proximityValue]); // Keep only the last 4 entries
    }
  }, [proximityValue]);

  const strength =
    proximityValue >= -40
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
      : 0; // 4 bars for strong, 3 for medium, 2 for weak, 1 for very weak

  const calculateStrength = (proximityValue) =>
    proximityValue >= -40
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

  const renderSignalBars = (strength) =>
    [...Array(6)].map((_, index) => (
      <View
        key={index}
        style={[
          styles.signalBar,
          index === 1 && styles.secondSignalBar,
          index === 2 && styles.thirdSignalBar,
          index === 3 && styles.fourthSignalBar,
          index === 4 && styles.fifthSignalBar,
          index === 5 && styles.sixthSignalBar,
          { backgroundColor: index < strength ? "#4CAF50" : "#E0E0E0" },
        ]}
      />
    ));
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Image
          source={require("../../assets/images/distance.png")}
          style={styles.icon}
        />
        <Text style={styles.infoTitle}>Proximity History:</Text>
        <View style={{ flexDirection: "column", alignItems: "center" }}>
          {rssiHistory.map((rssiValue, index) => (
            <View style={styles.infoChild} key={index}>
              {/* <Text style={styles.infoTitle}>Previous RSSI {index + 1}:</Text> */}
              <View style={styles.signalBars}>
                {renderSignalBars(calculateStrength(rssiValue))}
              </View>
              {/* <Text style={styles.info}>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; RSSI: {rssiValue}
          </Text> */}
            </View>
          ))}
        </View>
      </View>
      <View style={styles.infoChild}>
        {/* //line brake */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={require("../../assets/images/distance.png")}
            style={styles.icon}
          />
          <Text style={styles.infoTitle}>Proximity:</Text>
          <View style={styles.signalBars}>
            {[...Array(6)].map((_, index) => (
              <View
                key={index}
                style={[
                  styles.signalBar,
                  index === 1 && styles.secondSignalBar,
                  index === 2 && styles.thirdSignalBar,
                  index === 3 && styles.fourthSignalBar,
                  index === 4 && styles.fifthSignalBar,
                  index === 5 && styles.sixthSignalBar,
                  {
                    backgroundColor: index < strength ? "#4CAF50" : "#E0E0E0",
                  },
                ]}
              />
            ))}
          </View>
          {["superAdmin", "admin"].includes(role) ? (
            <Text style={styles.info}>
              {" "}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; RSSI: {proximityValue}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  signalBars: {
    flexDirection: "row",
    alignItems: "baseline",
    // marginTop: 4,
    marginLeft: 4,
    marginBottom: 5,
    verticalAlign: "middle",
    textAlign: "left",
  },
  icon: {
    width: 22,
    height: 22,
    marginLeft: -1,
    marginRight: 5,
  },
  infoTitle: {
    fontSize: 14,
    color: "#333333",
  },
  infoTitle2: {
    fontSize: 14,
    color: "#333333",
    marginLeft: 10,
  },
  signalBar: {
    width: 4.5,
    height: 7,
    borderRadius: 2,
    marginRight: 2,
  },
  secondSignalBar: {
    height: 7,
  },
  thirdSignalBar: {
    height: 7,
  },
  fourthSignalBar: {
    height: 7,
  },
  fifthSignalBar: {
    height: 7,
  },
  sixthSignalBar: {
    height: 7,
  },
  infoChild: {
    flexDirection: "row",
    alignItems: "center",
    // justifyContent: "space-between",
    // marginVertical: 4,
    gap: 8,
  },
});
