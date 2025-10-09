import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Platform,
  Keyboard,
  Animated,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import SearchResultsScreen from './SearchResultsScreen';
import {useDevicesContext} from '../context/DeviceContext';
import {syncDevicesWithAssets} from '../utils/syncDevicesWithAssets';
import { apiKeys } from '../config';

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const widthPercentageToDP = (widthPercent) =>
  (screenWidth * parseFloat(widthPercent)) / 100;
const heightPercentageToDP = (heightPercent) =>
  (screenHeight * parseFloat(heightPercent)) / 100;
const isTablet = () => screenWidth >= 768 && screenHeight / screenWidth < 1.6;
const tablet = isTablet();

const PLACEHOLDERS = ["Asset Type", "Chorus ID", "Asset ID", "Location"];

const HomeScreen = () => {
  const { devices } = useDevicesContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceTimeoutRef = useRef(null);

  const animatedValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      // animate up & fade out
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: -20, // slide up
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0, // fade out
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // after animation, reset position & text
        setCurrentIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        animatedValue.setValue(20); // start below
        opacityValue.setValue(0);

        // animate back to visible
        Animated.parallel([
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityValue, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

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
        `${apiKeys.BASE_URL}/assets/search`,
        { searchQuery: query },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSearchResults(response.data);
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
      paddingTop:
        Platform.OS === "ios"
          ? 40
          : Platform.Version <= 34 // Android 11+
          ? 0
          : 20,
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
      color: "#000000",
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
    placeholder: {
      position: "absolute",
      left: 5, 
      top: 0,
      bottom: 0,
      textAlignVertical: "center",
      fontSize: tablet ? 18 : 14,
      color: "#999",
      zIndex: -1,
      justifyContent: "center",
      includeFontPadding: false,
    },
    inputContainer: {
      flex: 1,
      justifyContent: "center",
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/chorus.png")}
          style={styles.logo}
        />
      </View>
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Image
            source={require("../../assets/images/search_bar.png")}
            style={styles.filterIcon}
          />
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              selectionColor="#EF652B"
            />
            {searchQuery === "" && (
              <Animated.Text
                style={[
                  styles.placeholder,
                  {
                    transform: [{ translateY: animatedValue }],
                    opacity: opacityValue,
                  },
                ]}
              >
                {` Search via ${PLACEHOLDERS[currentIndex]}`}
              </Animated.Text>
            )}
          </View>
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
