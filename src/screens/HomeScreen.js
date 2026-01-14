import React, {useEffect, useState, useCallback, useRef, useMemo} from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import SearchResultsScreen from './SearchResultsScreen';
import bleIcon from '../../assets/images/bluetooth_searching.png';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useDevicesContext} from '../context/DeviceContext';
import {syncDevicesWithAssets} from '../utils/syncDevicesWithAssets';
import {Keyboard} from 'react-native';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const widthPercentageToDP = widthPercent =>
  (screenWidth * parseFloat(widthPercent)) / 100;
const heightPercentageToDP = heightPercent =>
  (screenHeight * parseFloat(heightPercent)) / 100;
const isTablet = () => screenWidth >= 768 && screenHeight / screenWidth < 1.6;
const tablet = isTablet();

const HomeScreen = () => {
  const {devices} = useDevicesContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceTimeoutRef = useRef(null);
  const deviceUpdateTimeoutRef = useRef(null);
  const isInitialMount = useRef(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        const userId = await AsyncStorage.getItem('savedEmail');
        const storedQuery = await AsyncStorage.getItem(`searchQuery-${userId}`);
        if (storedQuery || searchQuery) {
          setSearchQuery(storedQuery);
          fetchSearchResults(storedQuery);
        }
      } catch (error) {
        console.error('Failed to retrieve search data:', error);
      }
    };

    fetchSearchData();
  }, []);

  // Refresh search results when returning to screen
  useFocusEffect(
    React.useCallback(() => {
      // Skip on initial mount
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }

      // Only refresh if there's a search query and we're not already loading
      if (searchQuery.trim() && !loading) {
        console.log('Refreshing search results on focus');
        fetchSearchResults(searchQuery);
      }
    }, []), // Empty dependency array to prevent continuous refreshes
  );

  const fetchSearchResults = useCallback(async query => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchQuery('');
      AsyncStorage.removeItem(`searchQuery-${userId}`);
      setLoading(false);
      return;
    }

    // Prevent multiple simultaneous calls
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('savedEmail');
      const response = await axios.post(
        `https://api.matorg.com/v1/assets/search`,
        {searchQuery: query},
        {headers: {Authorization: `Bearer ${token}`}},
      );

      setSearchResults(response.data);
      await AsyncStorage.setItem(`searchQuery-${userId}`, query);
    } catch (error) {
      console.error('Failed to fetch search results:', error);
      Alert.alert('Error', 'Failed to fetch search results.');
    } finally {
      setLoading(false);
    }
  }, []); // Removed loading dependency to prevent function recreation

  useEffect(() => {
    if (devices.length === 0 || searchResults.length === 0 || loading) return;

    // Debounce device updates to prevent rapid state changes
    if (deviceUpdateTimeoutRef.current) {
      clearTimeout(deviceUpdateTimeoutRef.current);
    }

    deviceUpdateTimeoutRef.current = setTimeout(() => {
      const deviceMap = syncDevicesWithAssets(devices);
      if (!deviceMap) return;

      // Check if any device data actually changed to prevent unnecessary updates
      const hasDeviceChanges = searchResults.some(
        asset =>
          deviceMap.has(asset.deviceId) &&
          asset.rssi !== deviceMap.get(asset.deviceId),
      );

      if (hasDeviceChanges) {
        setSearchResults(prevAssetsList =>
          prevAssetsList?.map(asset => {
            if (deviceMap.has(asset.deviceId)) {
              return {
                ...asset,
                rssi: deviceMap.get(asset.deviceId),
              };
            }
            return asset;
          }),
        );
      }
    }, 200); // Increased debounce to 200ms for device updates

    return () => {
      if (deviceUpdateTimeoutRef.current) {
        clearTimeout(deviceUpdateTimeoutRef.current);
      }
    };
  }, [devices, loading]); // Added loading dependency to prevent device updates during search

  const debouncedSearch = useCallback(
    query => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        if (!loading && query.trim()) {
          fetchSearchResults(query);
        }
      }, 500);
    },
    [fetchSearchResults, loading],
  );

  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery);
    } else {
      setSearchResults(p => []);
      setLoading(false);

      // Clear stored search data when search query is empty
      const clearStoredData = async () => {
        try {
          const userId = await AsyncStorage.getItem('savedEmail');
          if (userId) {
            await AsyncStorage.removeItem(`searchQuery-${userId}`);
          }
        } catch (error) {
          console.error('Failed to clear stored search data:', error);
        }
      };
      clearStoredData();
    }
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery]); // Removed debouncedSearch dependency to prevent infinite loops

  // Memoize search results to prevent unnecessary re-renders
  const memoizedSearchResults = useMemo(() => searchResults, [searchResults]);

  // Memoize search input handlers
  const handleSearchQueryChange = useCallback(async text => {
    setSearchQuery(text);

    // If the search query is cleared, also clear stored data
    if (!text.trim()) {
      try {
        const userId = await AsyncStorage.getItem('savedEmail');
        if (userId) {
          await AsyncStorage.removeItem(`searchQuery-${userId}`);
        }
      } catch (error) {
        console.error('Failed to clear stored search data:', error);
      }
    }
  }, []);

  const handleClearSearch = useCallback(async () => {
    setSearchQuery('');
    setSearchResults([]);
    setLoading(false);
    Keyboard.dismiss();

    // Clear stored search data from AsyncStorage
    try {
      const userId = await AsyncStorage.getItem('savedEmail');
      if (userId) {
        await AsyncStorage.removeItem(`searchQuery-${userId}`);
      }
    } catch (error) {
      console.error('Failed to clear stored search data:', error);
    }
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      paddingTop: Platform.OS === 'ios' ? 40 : 0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
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
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F9F9F9',
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
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F9F9F9',
    },
    foldericon: {
      width: tablet ? 130 : 103,
      height: tablet ? 150 : 116,
      marginBottom: 15,
    },
    instruction: {
      fontSize: tablet ? 16 : 13,
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/chorus.png')}
          style={styles.logo}
        />
      </View>
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
            onChangeText={handleSearchQueryChange}
            selectionColor="#EF652B"
          />
          <TouchableOpacity
            onPress={handleClearSearch}
            style={styles.closeIcon}>
            <Image source={require('../../assets/images/crossIcon.png')} />
          </TouchableOpacity>
        </View>
      </View>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#EF652B" />
        </View>
      ) : memoizedSearchResults?.length ? (
        <SearchResultsScreen searchResults={memoizedSearchResults} />
      ) : (
        <View style={styles.content}>
          <Image
            source={require('../../assets/images/folder.png')}
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
