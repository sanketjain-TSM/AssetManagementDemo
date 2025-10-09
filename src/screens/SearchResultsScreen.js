import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";  
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatDateTime } from "../utils/formatDateTime";
import { SixBarIndicatorSignalmeter } from "../components/SixBarIndicatorSignalmeter";
import { getImageName } from "../utils/normalizeDescriptionName";

const { width: screenWidth } = Dimensions.get("window");
const isTablet = screenWidth >= 768;
const scaleSize = (size) => (isTablet ? size * 1.3 : size);

const SearchResultsScreen = ({ searchResults }) => {
  const [role, setRole] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchRole = async () => {
      const role = await AsyncStorage.getItem("role");
      if (isMounted) setRole(role);
    };
    fetchRole();
    return () => {
      isMounted = false;
    };
  }, []);

  const ordinalSuffixOf = (i) => {
    if (i?.toString()?.toLowerCase() === "notinzone") return i;
    if (isNaN(Number(i))) return i;
    i = Number(i);
    let j = i % 10,
      k = i % 100;
    if (j == 1 && k != 11) return i + "st Floor";
    if (j == 2 && k != 12) return i + "nd Floor";
    if (j == 3 && k != 13) return i + "rd Floor";
    return i + "th Floor";
  };

  const renderResultItem = ({ item }) => {
    const { formattedDate, formattedTime } = formatDateTime(item.lastSeenTime);

    return (
      <View style={styles.resultItem}>
        <View style={styles.topSection}>
          <Image
            source={{uri: getImageName(item?.description)}}
            style={styles.deviceImage}
          />
          <View style={styles.resultInfo}>
            <View style={styles.chorusBox}>
              <Text style={styles.chorusIdText}>{item.tagNumber}</Text>
            </View>
            <Text style={styles.resultTitle}>{item.description}</Text>
            <Text style={styles.detailLabel}>
              CHORUS ID: <Text style={styles.detailValue}>{item.deviceId}</Text>
            </Text>
            <Text style={styles.detailLabel}>
              ZONE:{" "}
              <Text style={styles.detailValue}>
                {item.department} {item.zoneId ? `(${item.zoneId})` : null}
              </Text>
            </Text>
          </View>
        </View>

        <View style={styles.lastKnownLocation}>
          <Text style={styles.locationTitle}>LAST KNOWN LOCATION</Text>
          <View style={styles.locationRow}>
            <Image
              source={require("../../assets/images/calendar.png")}
              style={styles.icon}
            />
            <Text style={styles.locationText}>{formattedDate}</Text>
          </View>
          <View style={styles.locationRow}>
            <Image
              source={require("../../assets/images/clock.png")}
              style={styles.icon}
            />
            <Text style={styles.locationText}>{formattedTime}</Text>
          </View>
          <View style={styles.locationRow}>
            <Image
              source={require("../../assets/images/location.png")}
              style={styles.icon}
            />
            <Text style={styles.locationText}>
              {item?.floor ? ordinalSuffixOf(item?.floor) : null}
              {item?.department?.toLowerCase() === "unknown"
                ? ""
                : `, ${item?.department}`}
            </Text>
          </View>
          <View style={styles.signalMeter}>
            <SixBarIndicatorSignalmeter rssi={item.deviceId?.trim()} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={searchResults}
        renderItem={renderResultItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        initialNumToRender={10}
        windowSize={5}
        style={{ flex: 1 }} 
        contentContainerStyle={{
          paddingTop: scaleSize(16),
          paddingHorizontal: scaleSize(16),
          paddingBottom: scaleSize(80),
        }}
        showsVerticalScrollIndicator={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
  resultItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 5,
    padding: scaleSize(16),
    marginBottom: scaleSize(12),
  },
  topSection: {
    flexDirection: "row",
    marginBottom: scaleSize(10),
  },
  deviceImage: {
    width: scaleSize(50),
    height: scaleSize(50),
    marginRight: scaleSize(15),
    marginTop: scaleSize(10),
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: scaleSize(16),
    fontWeight: "600",
    color: "#0E0E0E",
    marginBottom: scaleSize(4),
  },
  chorusBox: {
    backgroundColor: "#FEE8E4",
    alignSelf: "flex-start",
    paddingHorizontal: scaleSize(10),
    paddingVertical: scaleSize(2),
    borderRadius: scaleSize(13),
    marginBottom: scaleSize(6),
  },
  chorusIdText: {
    color: "#EF652B",
    fontSize: scaleSize(10),
  },
  detailLabel: {
    fontSize: scaleSize(12),
    color: "#202239",
    opacity: 0.5,
  },
  detailValue: {
    fontSize: scaleSize(12),
    color: "#202239",
    opacity: 1,
  },
  lastKnownLocation: {
    backgroundColor: "#F2F9FF",
    borderRadius: 5,
    padding: scaleSize(10),
    marginTop: scaleSize(10),
  },
  locationTitle: {
    fontSize: scaleSize(12),
    fontWeight: "600",
    color: "#202239",
    opacity: 0.5,
    marginBottom: scaleSize(6),
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scaleSize(6),
  },
  icon: {
    width: scaleSize(16),
    height: scaleSize(16),
    marginRight: scaleSize(6),
  },
  locationText: {
    fontSize: scaleSize(14),
    color: "#202239",
  },
  signalMeter: {
    marginTop: scaleSize(6),
    marginLeft: -scaleSize(2),
  },
});

export default SearchResultsScreen;
