import React from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import ImagesEnum from "../shared/ImagesEnum";
import { formatDateTime } from "../utils/formatDateTime";

const GlobalSearchResultsScreen = ({ searchResults, navigation }) => {
  function ordinalSuffixOf(i) {
    if (i?.toLowerCase() === "notinzone") {
      return i;
    }
    i = Number(i);
    let j = i % 10,
      k = i % 100;
    if (j == 1 && k != 11) {
      return i + "st Floor";
    }
    if (j == 2 && k != 12) {
      return i + "nd Floor";
    }
    if (j == 3 && k != 13) {
      return i + "rd Floor";
    }
    return i + "th Floor";
  }

  const renderResultItem = ({ item }) => {
    const { formattedDate, formattedTime } = formatDateTime(item.lastSeenTime);
    return (
      <View style={styles.resultItem}>
        {/* Top Section with Image and Text */}
        <View style={styles.topSection}>
          <Image
            source={ImagesEnum?.[item?.description]}
            style={styles.deviceImage}
          />
          <View style={styles.resultInfo}>
            <View style={styles.chorusDiv}>
              <View style={styles.chorusBox}>
                <Text style={styles.chorusIdText}>{item.tagNumber}</Text>
              </View>
            </View>
            <Text style={styles.resultTitle}>{item.description}</Text>
            <View style={styles.chorusIdTitle}>
              <Text style={styles.chorusId}>CHORUS ID:</Text>
              <Text style={styles.chorusData}> {item.deviceId}</Text>
            </View>
            <View style={styles.chorusIdTitle}>
              <Text style={styles.chorusId}>ZONE:</Text>
              <Text style={styles.chorusData}>
                {" "}
                {item?.department} {item.zoneId ? item.zoneId : null}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.lastKnownLocation}>
          <Text style={styles.locationTitle}>LAST KNOWN LOCATION</Text>
          <View style={styles.locationInfo}>
            <View style={styles.dateTimeContainer}>
              <Image
                source={require("../../assets/images/calendar.png")}
                style={styles.icon}
              />
              <Text style={styles.dateTimeText}>{formattedDate}</Text>
            </View>
            <View style={styles.dateTimeContainer}>
              <Image
                source={require("../../assets/images/clock.png")}
                style={styles.icon}
              />
              <Text style={styles.dateTimeText}>{formattedTime}</Text>
            </View>
          </View>
          <View style={styles.locationContainer}>
            <Image
              source={require("../../assets/images/location.png")}
              style={styles.icon}
            />
            <Text style={styles.locationText}>
              {item?.floor ? `${ordinalSuffixOf(item?.floor)}` : null}
              {item?.department?.toLowerCase() == "unknown"
                ? ""
                : `, ${item?.department}`}
            </Text>
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
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    padding: 16,
  },
  resultItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 5,
    marginBottom: 10,
    padding: 16,
    //shadowColor: "#000",
    //shadowOpacity: 0.1,
    //shadowOffset: { width: 0, height: 2 },
    //shadowRadius: 8,
    //elevation: 5,
  },
  topSection: {
    flexDirection: "row",
    marginBottom: 16,
  },
  resultImage: {
    width: 50,
    height: 50,
    marginRight: 16,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0E0E0E",
    marginBottom: 4,
  },
  chorusId: {
    fontSize: 12,
    color: "#202239",
    marginBottom: 2,
    opacity: 0.5,
    marginTop: 1,
    // fontFamily: "Aeonik",
  },
  chorusData: {
    fontSize: 12,
  },
  zoneText: {
    fontSize: 12,
    color: "#0E0E0E",
    opacity: 0.5,
  },
  bottomSection: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: "#333333",
    marginLeft: 8,
  },
  icon: {
    width: 16,
    height: 16,
  },
  deviceImage: {
    width: 50,
    height: 50,
    marginRight: 15,
    marginTop: 10,
  },
  lastKnownLocation: {
    backgroundColor: "#F2F9FF",
    paddingHorizontal: 15,
    height: 90,
    justifyContent: "center",
    borderRadius: 5,
    width: "97%",
  },
  locationTitle: {
    color: "#202239",
    fontSize: 12,
    // fontFamily: "Aeonik",
    marginBottom: 8,
    opacity: 0.5,
    fontWeight: "600",
  },
  locationInfo: {
    flexDirection: "row",
    marginBottom: 6,
    gap: 20,
  },
  dateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 16,
    height: 16,
    marginRight: 5,
  },
  dateTimeText: {
    color: "#202239",
    fontSize: 12,
    // fontFamily: "Aeonik",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    color: "#202239",
    fontSize: 12,
    // fontFamily: "Aeonik",
  },
  chorusBox: {
    width: 50,
    height: 20,
    backgroundColor: "#FEE8E4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
    borderRadius: 13,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  chorusIdText: {
    color: "#EF652B",
    fontSize: 10,
    // fontFamily: "Aeonik",
  },
  chorusIdTitle: {
    flexDirection: "row",
    marginBottom: 5,
  },
  iIcon: {
    width: 22,
    height: 22,
  },
  chorusDiv: {
    flexDirection: "row",
    gap: 200,
  },
});

export default GlobalSearchResultsScreen;
