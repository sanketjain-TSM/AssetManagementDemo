import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  TouchableNativeFeedback,
  Platform,
  Keyboard,
  Animated,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {useNavigation} from '@react-navigation/native';
import SearchResultsScreen from './SearchResultsScreen';
import { apiKeys } from '../config';

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const isTablet = () => screenWidth >= 768 && screenHeight / screenWidth < 1.6;
const tablet = isTablet();

const PLACEHOLDERS = ["Asset Type", "Chorus ID", "Asset ID", "Location"];

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false); // New loading state
  const navigation = useNavigation();

  // Using useRef to store the debounce timeout reference
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

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setLoading(false); // Stop loading if query is empty
      return;
    }

    try {
      setLoading(true); // Start loading when search begins
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("savedEmail");
      const response = await axios.post(
        `${apiKeys.BASE_URL}/assets/search`,
        { searchQuery: query },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSearchResults(response.data);
    } catch (error) {
      console.error("Failed to fetch search results:", error);
      Alert.alert("Error", "Failed to fetch search results.");
    } finally {
      setLoading(false); // Stop loading when search is done or error occurs
    }
  };

  const debouncedSearch = useCallback((query) => {
    // Clear the existing timeout to debounce correctly
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set a new debounce timeout
    debounceTimeoutRef.current = setTimeout(() => {
      handleSearch(query);
    }, 500); // Adjust delay if needed
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery);
    } else {
      setSearchResults([]);
    }

    // Cleanup function to clear the timeout if the component unmounts or updates
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery, debouncedSearch]);

  // Conditional Button Component for Android/iOS
  const ButtonComponent =
    Platform.OS === "android" ? TouchableNativeFeedback : TouchableOpacity;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ButtonComponent onPress={() => navigation.goBack()} useForeground>
          <View style={styles.backButton}>
            <Image source={require("../../assets/images/backArrow.png")} />
          </View>
        </ButtonComponent>
        <Text style={styles.headerText}>Search</Text>
      </View>

      {/* Search Bar */}
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

      {/* Show loading indicator while loading */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#EF652B" />
        </View>
      ) : searchResults?.length ? (
        <SearchResultsScreen searchResults={searchResults} />
      ) : (
        <View style={styles.content}>
          <Text style={styles.instruction}>
            Use the search bar to find specific assets by
          </Text>
          <Text style={styles.instruction}>
            Asset Type, Chorus ID, Asset ID, Location
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "ios" ? 40 : Platform.Version <= 34 ? 20 : 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "500",
    color: "#0E0E0E",
    flex: 1,
    paddingLeft: 10,
    marginLeft: 10,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchBar: {
    flex: 1, // Remove fixed width, use flex to stretch the container
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    borderRadius: 5,
    paddingHorizontal: 10,
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: "#000000",
    marginLeft: 5,
    fontSize: 14,
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
  instruction: {
    fontSize: 13,
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
    left: 5, // same as searchInput marginLeft
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

export default SearchScreen;
