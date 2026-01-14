import React from "react";
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Switch,
  View,
  Text,
  TouchableOpacity,
  Image,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { Buffer } from "buffer";
import { useDevicesContext } from "../context/DeviceContext";

const BleScanner = () => {
  const { devices } = useDevicesContext();
  const navigation = useNavigation();

  function formatDateTime() {
    const date = new Date();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();

    const formattedDate = [
      month.toString().padStart(2, "0"),
      day.toString().padStart(2, "0"),
      year,
    ].join("/");

    const formattedTime = [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      seconds.toString().padStart(2, "0"),
    ].join(":");

    return `${formattedDate} ${formattedTime} ${ampm}`;
  }
  const renderBleDevice = ({ item }) => (
    <View style={styles.infoCard}>
      <View style={styles.infoContainer}>
        <View style={styles.infoChild}>
          <Text style={styles.infoTitle}>Name</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.infoValue}>{item.name || "Unnamed Device"}</Text>
        </View>
        <View style={styles.infoChild}>
          <Text style={styles.infoTitle}>MAC address</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.infoValue}>{item.macAddressString}</Text>
        </View>
        <View style={styles.infoChild}>
          <Text style={styles.infoTitle}>Payload Data</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.infoValue}>
            {item.manufacturerData
              ? Buffer.from(item.manufacturerData, "base64")
                  .toString("hex")
                  .toUpperCase()
              : null}
          </Text>
        </View>
        <View style={styles.infoChild}>
          <Text style={styles.infoTitle}>Latitude</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.infoValue}>{item.latitude}</Text>
        </View>
        <View style={styles.infoChild}>
          <Text style={styles.infoTitle}>Longitude</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.infoValue}>{item.longitude}</Text>
        </View>
        <View style={styles.infoChild}>
          <Text style={styles.infoTitle}>Timestamp</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.infoRssi}>{formatDateTime()}</Text>
        </View>
        <View style={styles.infoChild}>
          <Text style={styles.infoTitle}>RSSI</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.infoRssi}>{item.rssi} dBm</Text>
        </View>
      </View>
    </View>
  );
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backIconContainer}
          >
            <Image
              style={styles.backIcon}
              source={require("../../assets/images/back.png")}
              alt="logo"
            />
          </TouchableOpacity>

          <Image
            style={styles.img}
            source={require("../../assets/images/chorusWhite.jpeg")}
            alt="logo"
          />
          <Text style={styles.title}>iOS Reader</Text>
        </View>
        <FlatList
          style={styles.list}
          data={devices}
          renderItem={renderBleDevice}
          keyExtractor={(item, i) => i}
        />
        {/* <Button title="Rescan for Devices" onPress={startScan} /> */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1f2137",
  },

  infoCard: {
    flex: 1,
    // height:"auto",
    // borderBottomWidth: 0.9,
    borderColor: "black",
    padding: 9,
  },

  infoContainer: {
    flex: 1,
    width: "100%",
    marginVertical: 0.7,
    padding: 15,
    backgroundColor: "#FFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  infoChild: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  infoTitle: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
    flex: 1,
    textAlign: "left",
  },
  separator: {
    fontSize: 13,
    color: "#333",
    paddingHorizontal: 5,
  },
  infoValue: {
    paddingLeft: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    flex: 2,
    textAlign: "left",
  },
  infoRssi: {
    paddingLeft: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#e5622f",
    flex: 2,
    textAlign: "left",
  },

  backIconContainer: {
    marginRight: 55,
  },
  backIcon: {
    width: 18,
    height: 18,
    tintColor: "white",
  },
  img: {
    width: 120,
    height: 60,
    resizeMode: "cover",
  },
  title: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "left",
    fontWeight: "600",
    // backgroundColor:'red',
    marginTop: 7,
    marginLeft: -9,
  },
  container: {
    flex: 1,
    borderBottomColor: "#000",
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 24,
    width: "100%",
    marginBottom: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "start",
    backgroundColor: "#1f2137",
  },
  noDevices: {
    textAlign: "center",
    marginVertical: 20,
    color: "#999",
  },
  deviceContainer: {
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: "column",
    alignItems: "center",
  },
  deviceName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  deviceId: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  signalStrengthContainer: {
    marginTop: 8,
  },
  signalStrengthText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  signalBars: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  signalBar: {
    width: 15,
    height: 10,
    borderRadius: 3,
    marginRight: 5,
  },
});

export default BleScanner;
