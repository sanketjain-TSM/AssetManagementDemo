import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import SearchResultsScreen from "./SearchResultsScreen";
import bleIcon from "../../assets/images/bluetooth_searching.png";
import { useNavigation } from "@react-navigation/native";
import { useDevicesContext } from "../context/DeviceContext";
import { syncDevicesWithAssets } from "../utils/syncDevicesWithAssets";
import { Keyboard } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const widthPercentageToDP = (widthPercent) =>
  (screenWidth * parseFloat(widthPercent)) / 100;
const heightPercentageToDP = (heightPercent) =>
  (screenHeight * parseFloat(heightPercent)) / 100;
const isTablet = () => screenWidth >= 768 && screenHeight / screenWidth < 1.6;
const tablet = isTablet();

const HomeScreen = () => {
  const { devices } = useDevicesContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceTimeoutRef = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        const userId = await AsyncStorage.getItem("savedEmail");
        const storedQuery = await AsyncStorage.getItem(`searchQuery-${userId}`);
        if (storedQuery) {
          setSearchQuery(storedQuery);
          const storedResults = await AsyncStorage.getItem(
            `searchResults-${userId}`
          );
          if (storedResults) setSearchResults(JSON.parse(storedResults));
        }
      } catch (error) {
        console.error("Failed to retrieve search data:", error);
      }
    };

    fetchSearchData();
  }, []);

  const fetchSearchResults = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("savedEmail");
      const response = await axios.post(
        `http://35.223.244.137:8000/v1/assets/search`,
        { searchQuery: query },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await AsyncStorage.setItem(`searchQuery-${userId}`, query);
      await AsyncStorage.setItem(
        `searchResults-${userId}`,
        JSON.stringify(response.data)
      );
    } catch (error) {
      console.error("Failed to fetch search results:", error);
      Alert.alert("Error", "Failed to fetch search results.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (devices.length === 0) return;
    const deviceMap = syncDevicesWithAssets(devices);
    setSearchResults((prevAssetsList) =>
      prevAssetsList?.map((asset) => {
        if (deviceMap.has(asset.deviceId)) {
          return {
            ...asset,
            rssi: deviceMap.get(asset.deviceId),
          };
        }
        return asset;
      })
    );
  }, [JSON.stringify(devices)]);

  const debouncedSearch = useCallback((query) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      fetchSearchResults(query);
    }, 500);
  }, []);


  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery, debouncedSearch]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fff",
      paddingTop: Platform.OS === "ios" ? 40 : 0,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: tablet ? heightPercentageToDP(2) : 15,
      paddingHorizontal: tablet ? widthPercentageToDP(2) : 15,
    },
    logo: {
      width: tablet ? 180 : 113,
      height: tablet ? 60 : 37,
      marginTop: 16,
    },
    searchBarContainer: {
      marginBottom: tablet ? heightPercentageToDP(2) : 20,
      paddingHorizontal: tablet ? widthPercentageToDP(2) : 15,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F9F9F9",
      borderRadius: 5,
      paddingHorizontal: 10,
      height: tablet ? 60 : 48,
    },
    searchInput: {
      flex: 1,
      marginLeft: 5,
      fontSize: tablet ? 18 : 14,
    },
    closeIcon: {
      padding: 5,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#F9F9F9",
    },
    foldericon: {
      width: tablet ? 130 : 103,
      height: tablet ? 150 : 116,
      marginBottom: 15,
    },
    instruction: {
      fontSize: tablet ? 16 : 13,
      textAlign: "center",
      color: "#000000",
      paddingHorizontal: 30,
      opacity: 0.7,
    },
    loaderContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    bleButtonContainer: {
      height: 60,
    },
    bleButton: {
      marginTop: 30,
      alignSelf: "flex-end",
      width: 30,
      height: 30,
      tintColor: "#EF652B",
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/chorus.png")}
          style={styles.logo}
        />
         {Platform.OS === "ios" && (
          <TouchableOpacity
            style={styles.bleButtonContainer}
            onPress={() => navigation.navigate("BleScanner")}
          >
            <Image source={bleIcon} style={styles.bleButton} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Image
            source={require("../../assets/images/search_bar.png")}
            style={styles.filterIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Asset Type, Chorus ID, Asset ID, Location."
            value={searchQuery}
            onChangeText={setSearchQuery}
            selectionColor="#EF652B"
          />
          <TouchableOpacity
            onPress={() => {
              setSearchQuery("");
              Keyboard.dismiss();
            }}
            style={styles.closeIcon}
          >
            <Image source={require("../../assets/images/crossIcon.png")} />
          </TouchableOpacity>
        </View>
      </View>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#EF652B" />
        </View>
      ) : searchResults?.length ? (
        <SearchResultsScreen searchResults={searchResults} />
      ) : (
        <View style={styles.content}>
          <Image
            source={require("../../assets/images/folder.png")}
            style={styles.foldericon}
          />
          <Text style={styles.instruction}>
            Use the search bar to find specific assets by
          </Text>
          <Text style={styles.instruction}>
            Asset Type, Chorus ID, Asset ID, Location.
          </Text>
        </View>
      )}
    </View>
  );
};

export default HomeScreen;
