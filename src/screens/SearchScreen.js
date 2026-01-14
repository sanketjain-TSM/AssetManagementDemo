import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TouchableNativeFeedback,
  Platform,
  StatusBar,
  ActivityIndicator, // Import ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import SearchResultsScreen from './SearchResultsScreen';

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false); // New loading state
  const navigation = useNavigation();

  // Using useRef to store the debounce timeout reference
  const debounceTimeoutRef = useRef(null);
  const isInitialMount = useRef(true);

  // Component cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Refresh search results when returning to screen
  useFocusEffect(
    React.useCallback(() => {
      if (searchQuery.trim() && !isInitialMount.current) {
        // Clear current results and fetch fresh data
        setSearchResults([]);
        setLoading(true);
        handleSearch(searchQuery);
      }
      // Mark that initial mount is complete
      isInitialMount.current = false;
    }, [searchQuery, handleSearch]),
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setLoading(false);
  }, []);

  const handleSearch = useCallback(async query => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchQuery('');
      AsyncStorage.removeItem(`searchQuery-${userId}`);
      setLoading(false); // Stop loading if query is empty
      return;
    }

    // Prevent multiple simultaneous calls
    if (loading) {
      return;
    }

    try {
      setLoading(true); // Start loading when search begins
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('savedEmail');
      const response = await axios.post(
        `https://api.matorg.com/v1/assets/search`,
        {searchQuery: query},
        {headers: {Authorization: `Bearer ${token}`}},
      );

      setSearchResults(response.data);
    } catch (error) {
      console.error('Failed to fetch search results:', error);
      Alert.alert('Error', 'Failed to fetch search results.');
    } finally {
      setLoading(false); // Stop loading when search is done or error occurs
    }
  }, []); // Removed loading dependency to prevent function recreation

  const debouncedSearch = useCallback(
    query => {
      // Clear the existing timeout to debounce correctly
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set a new debounce timeout
      debounceTimeoutRef.current = setTimeout(() => {
        if (!loading && query.trim()) {
          handleSearch(query);
        }
      }, 500); // Adjust delay if needed
    },
    [handleSearch, loading],
  );

  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery);
    } else {
      setSearchResults([]);
      setLoading(false);
    }

    // Cleanup function to clear the timeout if the component unmounts or updates
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery]); // Removed debouncedSearch dependency to prevent infinite loops

  // Conditional Button Component for Android/iOS
  const ButtonComponent =
    Platform.OS === 'android' ? TouchableNativeFeedback : TouchableOpacity;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ButtonComponent onPress={() => navigation.goBack()} useForeground>
          <View style={styles.backButton}>
            <Image source={require('../../assets/images/backArrow.png')} />
          </View>
        </ButtonComponent>
        <Text style={styles.headerText}>Search</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Image
            source={require('../../assets/images/search_bar.png')}
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
            onPress={handleClearSearch}
            style={styles.closeIcon}>
            <Image source={require('../../assets/images/crossIcon.png')} />
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
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  headerText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#0E0E0E',
    flex: 1,
    paddingLeft: 10,
    marginLeft: 10,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchBar: {
    flex: 1, // Remove fixed width, use flex to stretch the container
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 5,
    paddingHorizontal: 10,
    height: 48,
  },
  searchInput: {
    flex: 1, // Ensure the TextInput stretches to fill available space
    marginLeft: 5,
    fontSize: 14,
  },
  closeIcon: {
    padding: 5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  instruction: {
    fontSize: 13,
    textAlign: 'center',
    color: '#000000',
    paddingHorizontal: 30,
    opacity: 0.7,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchScreen;
