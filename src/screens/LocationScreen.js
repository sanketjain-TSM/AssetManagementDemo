import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  TextInput,
  Image,
  Platform,
  StatusBar,
  ActivityIndicator,
  Dimensions, // Import ActivityIndicator for the loader
  Alert,
} from 'react-native';
import axios from 'axios'; // Ensure axios is installed
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useLocationRefresh} from '../utils/useAssetRefresh';

const {width: screenWidth} = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const scaleSize = size => (isTablet ? size * 1.3 : size);

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'ios' ? 0 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainerMain: {
    backgroundColor: '#ffffff',
    padding: scaleSize(20),
    borderBottomLeftRadius: scaleSize(8),
    borderBottomRightRadius: scaleSize(8),
    paddingBottom: 0,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: {
    fontSize: scaleSize(24),
    fontWeight: '600',
    color: '#0E0E0E',
    flex: 1,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: scaleSize(5),
    paddingLeft: scaleSize(10),
  },
  searchInput: {
    fontSize: scaleSize(16),
    color: '#000',
    flex: 1,
    height: scaleSize(43),
  },
  closeIcon: {
    height: scaleSize(43),
    width: scaleSize(43),
  },
  floorScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floorButton: {
    paddingVertical: scaleSize(8),
    paddingHorizontal: scaleSize(10),
    borderRadius: scaleSize(20),
    alignItems: 'center',
  },
  selectedFloorButton: {},
  floorText: {
    fontSize: scaleSize(14),
    color: '#0E0E0E',
    opacity: 0.4,
    fontWeight: '400',
  },
  selectedFloorText: {
    color: '#EF652B',
    fontWeight: '500',
    fontSize: scaleSize(14),
    opacity: 1.0,
  },
  floorBar: {
    width: scaleSize(12),
    height: scaleSize(2),
    marginVertical: scaleSize(5),
    backgroundColor: '#ffffff',
  },
  floorSelectedBar: {
    width: scaleSize(12),
    height: scaleSize(2),
    backgroundColor: '#EF652B',
  },
  departmentList: {
    paddingHorizontal: scaleSize(20),
    paddingTop: scaleSize(20),
  },
  departmentContainer: {
    backgroundColor: '#FFF',
    borderRadius: scaleSize(5),
    paddingVertical: scaleSize(15),
    paddingHorizontal: scaleSize(20),
    marginBottom: scaleSize(5),
    elevation: 3,
  },
  departmentName: {
    fontSize: scaleSize(16),
    fontWeight: '600',
    color: '#0E0E0E',
    marginBottom: scaleSize(10),
  },
  departmentInfo: {
    fontSize: scaleSize(14),
    color: '#A0A0A0',
    fontWeight: '500',
  },
  searchNormalIcon: {
    opacity: 0.5,
    marginRight: scaleSize(10),
    marginLeft: scaleSize(20),
    width: scaleSize(20),
    height: scaleSize(20),
  },
  textData: {
    fontWeight: '600',
    color: '#0E0E0E',
    opacity: 1.0,
    fontSize: scaleSize(14),
  },
  seperator: {
    opacity: 0.1,
    fontSize: scaleSize(18),
  },
  noDataText: {
    fontSize: scaleSize(18),
    color: '#888',
    fontStyle: 'italic',
  },
});

const LocationScreen = () => {
  const [selectedFloor, setSelectedFloor] = useState('');
  const [departments, setDepartments] = useState([]);
  const [floors, setFloors] = useState([]);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false); // New loading state
  const [isFetching, setIsFetching] = useState(false); // Prevent multiple simultaneous calls
  const [initialLoading, setInitialLoading] = useState(true); // Initial loading state
  const lastFetchTime = useRef(0); // Track last fetch time for debouncing
  const minLoadingTime = useRef(0); // Track minimum loading time
  const isProcessingRefresh = useRef(false); // Track if we're processing a refresh
  const lastRefreshTime = useRef(0); // Track last refresh time
  const lastFocusRefreshTime = useRef(0); // Track last focus refresh time
  const isInitialMount = useRef(true); // Track if this is the initial mount
  const currentFloorRef = useRef(''); // Track current floor being fetched
  const abortControllerRef = useRef(null); // Track abort controller for current request

  const searchBarWidth = useRef(new Animated.Value(0)).current;

  const navigation = useNavigation();

  useEffect(() => {
    fetchFloors();

    // Cleanup function to cancel any pending requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Refresh floor data when returning to screen - always refresh to prevent stale data
  useFocusEffect(
    React.useCallback(() => {
      // Skip on initial mount
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }

      const now = Date.now();

      // Check if we're returning from a screen that might have modified data
      const routes = navigation.getState()?.routes;
      const previousRoute =
        routes && routes.length > 1 ? routes[routes.length - 2] : null;
      const shouldForceRefresh =
        previousRoute?.name === 'DepartmentAssetDetailsScreen' ||
        previousRoute?.name === 'AddAssetScreen' ||
        previousRoute?.name === 'DepartmentListScreen';

      console.log(
        'Focus effect triggered, previous route:',
        previousRoute?.name,
        'shouldForceRefresh:',
        shouldForceRefresh,
      );

      // Always refresh when returning to screen, but add small debounce to prevent rapid refreshes
      if (now - lastFocusRefreshTime.current < 300) {
        console.log('Focus refresh skipped - too soon since last refresh');
        return;
      }

      console.log('Refreshing all data on focus');
      lastFocusRefreshTime.current = now;

      // Always refresh floors first, then refresh floor data
      fetchFloors().then(() => {
        // Always refresh floor data if a floor is selected
        if (selectedFloor && !isFetching && !loading) {
          console.log('Refreshing floor data on focus for:', selectedFloor);
          fetchFloorData(selectedFloor);
        } else if (!selectedFloor) {
          // Clear departments if no floor is selected
          setDepartments([]);
        }
      });
    }, []), // Empty dependency array to prevent continuous refreshes
  );

  useEffect(() => {
    if (selectedFloor && !isFetching) {
      console.log('Floor changed to:', selectedFloor);
      fetchFloorData(selectedFloor);
    } else if (!selectedFloor) {
      setDepartments([]);
      currentFloorRef.current = '';
    }
  }, [selectedFloor, fetchFloorData, isFetching]);

  // Backup mechanism to ensure refresh when returning from specific screens
  useEffect(() => {
    const unsubscribe = navigation.addListener('state', e => {
      const routes = e.data.state?.routes;
      const currentRoute =
        routes && routes.length > 0 ? routes[routes.length - 1] : null;
      const previousRoute =
        routes && routes.length > 1 ? routes[routes.length - 2] : null;

      // If we're on LocationScreen and coming from a screen that might have modified data
      if (
        currentRoute?.name === 'LocationScreen' &&
        (previousRoute?.name === 'DepartmentAssetDetailsScreen' ||
          previousRoute?.name === 'AddAssetScreen' ||
          previousRoute?.name === 'DepartmentListScreen')
      ) {
        console.log('Navigation state change detected, forcing refresh');
        setTimeout(() => {
          fetchFloors().then(() => {
            if (selectedFloor) {
              fetchFloorData(selectedFloor);
            }
          });
        }, 100);
      }
    });

    return unsubscribe;
  }, [navigation, selectedFloor, fetchFloors, fetchFloorData]);

  // REMOVED useLocationRefresh hook completely to stop continuous loading

  function ordinalSuffixOf(i) {
    if (i?.toLowerCase() === 'notinzone') {
      return i;
    }
    i = Number(i);
    let j = i % 10,
      k = i % 100;
    if (j == 1 && k != 11) {
      return i + 'st';
    }
    if (j == 2 && k != 12) {
      return i + 'nd';
    }
    if (j == 3 && k != 13) {
      return i + 'rd';
    }
    return i + 'th';
  }

  const fetchFloors = async () => {
    setInitialLoading(true);
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await axios.get(
        'https://api.matorg.com/v1/assets/floor/all',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const fetchedFloors = response?.data?.filter(el => el?.floor);

      setFloors(fetchedFloors);
      if (fetchedFloors.length > 0) {
        // Check if current selected floor still exists in the new list
        const floorExists = fetchedFloors.some(
          floor => floor?.floor === selectedFloor,
        );
        if (!floorExists) {
          // If current floor doesn't exist, select the first available floor
          setSelectedFloor(fetchedFloors[0]?.floor);
        }
      } else {
        // If no floors available, clear the selection
        setSelectedFloor('');
      }
    } catch (error) {
      console.error('Failed to fetch floors:', error);
      Alert.alert('Error', 'Failed to load floors.');
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchFloorData = useCallback(
    async floor => {
      if (!floor) {
        console.log('No floor provided to fetchFloorData');
        return;
      }

      // Cancel previous request if it's for a different floor
      if (abortControllerRef.current && currentFloorRef.current !== floor) {
        console.log(
          'Cancelling previous request for floor:',
          currentFloorRef.current,
        );
        abortControllerRef.current.abort();
      }

      // Debounce: prevent calls within 800ms of each other for the same floor
      const now = Date.now();
      if (
        now - lastFetchTime.current < 800 &&
        currentFloorRef.current === floor
      ) {
        console.log(
          'Debouncing fetch request, too soon since last call for same floor',
        );
        return;
      }

      // Prevent multiple simultaneous calls for the same floor
      if (isFetching && currentFloorRef.current === floor) {
        console.log('Already fetching floor data for this floor, skipping...');
        return;
      }

      lastFetchTime.current = now;
      currentFloorRef.current = floor;
      minLoadingTime.current = now + 500; // Minimum 500ms loading time
      setIsFetching(true);
      setLoading(true); // Set loading to true when fetching starts

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      // Add a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('Fetch floor data timeout, stopping loading');
        setLoading(false);
        setIsFetching(false);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 10000); // 10 second timeout

      const token = await AsyncStorage.getItem('token');

      if (!token) {
        console.error('No token found');
        clearTimeout(timeoutId);
        setLoading(false);
        setIsFetching(false);
        return;
      }

      try {
        console.log('Fetching floor data for:', floor);
        const response = await axios.get(
          `https://api.matorg.com/v1/assets/floor/${floor}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 8000, // 8 second timeout for axios
            signal: abortControllerRef.current.signal, // Add abort signal
          },
        );
        const departmentsData = response.data.map(item => ({
          zoneId: item.zoneId,
          department: item.department, // Handle null department
          assets: item.assetCount,
        }));
        setDepartments(departmentsData);
        console.log('Floor data fetched successfully');
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Request was aborted for floor:', floor);
          return;
        }
        console.error('Failed to fetch department data:', error);
        // Set empty array to prevent UI issues
        setDepartments([]);
      } finally {
        clearTimeout(timeoutId);

        // Only update state if this is still the current request
        if (currentFloorRef.current === floor) {
          // Ensure minimum loading time to prevent flickering
          const timeElapsed = Date.now() - lastFetchTime.current;
          const remainingTime = Math.max(0, 500 - timeElapsed);

          setTimeout(() => {
            setLoading(false); // Set loading to false when fetching is done
            setIsFetching(false);
            isProcessingRefresh.current = false; // Reset refresh processing flag
          }, remainingTime);
        } else {
          // If this is not the current request, still reset the processing flag
          isProcessingRefresh.current = false;
        }
      }
    },
    [isFetching],
  );

  const handleDepartmentPress = async department => {
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await axios.get(
        `https://api.matorg.com/v1/assets/floor/${selectedFloor}/${encodeURIComponent(
          department.department,
        )}/${department.zoneId}`,
        {
          headers: {Authorization: `Bearer ${token}`},
        },
      );
      navigation.navigate('DepartmentListScreen', {
        departmentDetails: response.data,
        departmentName: department.department,
        floor: selectedFloor,
        zoneId: department.zoneId,
      });
    } catch (error) {
      console.error('Failed to fetch specific department details:', error);
      Alert.alert('Error', 'Failed to load department details.');
    }
  };

  const toggleSearchBar = () => {
    setSearchTerm('');
    if (isSearchVisible) {
      Animated.timing(searchBarWidth, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setIsSearchVisible(false)); // Hide only after animation
    } else {
      setIsSearchVisible(true); // Show before animation
      Animated.timing(searchBarWidth, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleSearch = text => {
    setSearchTerm(text);
  };

  const searchBarInterpolation = searchBarWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '75%'], // Adjust the final width as needed
  });

  const filteredAssets = searchTerm
    ? departments?.filter(asset =>
        asset?.department?.toLowerCase()?.includes(searchTerm?.toLowerCase()),
      )
    : departments;
  // return <View></View>;
  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.container}>
        <View style={styles.headerContainerMain}>
          <View style={styles.headerContainer}>
            {isSearchVisible ? (
              <Animated.View
                style={[
                  styles.searchBarContainer,
                  {width: searchBarInterpolation},
                ]}>
                <Image
                  source={require('../../assets/images/search-normal.png')}
                  style={styles.searchNormalIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search"
                  placeholderTextColor="#888"
                  autoFocus
                  onChangeText={handleSearch}
                  selectionColor="#EF652B"
                />
              </Animated.View>
            ) : null}
            {!isSearchVisible && <Text style={styles.header}>Location</Text>}
            <View style={styles.iconContainer}>
              {isSearchVisible ? (
                <TouchableOpacity
                  onPress={toggleSearchBar}
                  style={styles.closeIcon}>
                  <Image
                    source={require('../../assets/images/crossIcon.png')}
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={toggleSearchBar}>
                  <Image
                    source={require('../../assets/images/searchIcon.png')}
                    style={styles.searchicon}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-start',
            }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.floorScrollContainer}>
              {floors.map((floor, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedFloor(floor?.floor)}
                  style={[
                    styles.floorButton,
                    selectedFloor === floor?.floor &&
                      styles.selectedFloorButton,
                  ]}>
                  <Text
                    style={[
                      styles.floorButton,
                      selectedFloor === floor?.floor &&
                        styles.selectedFloorButton,
                    ]}>
                    {ordinalSuffixOf(floor?.floor)}
                    {floor?.floor?.toLowerCase() !== 'notinzone'
                      ? ' Floor'
                      : ''}
                  </Text>
                  <View
                    style={[
                      styles.floorBar,
                      selectedFloor === floor?.floor && styles.floorSelectedBar,
                    ]}></View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Show Loader while loading */}
        {initialLoading || loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#EF652B" />
          </View>
        ) : floors.length === 0 ? (
          <View style={styles.loaderContainer}>
            <Text style={styles.noDataText}>No floors available</Text>
          </View>
        ) : (
          <FlatList
            data={filteredAssets}
            renderItem={({item}) => (
              <TouchableOpacity
                onPress={() => handleDepartmentPress(item)}
                style={styles.departmentContainer}>
                <Text style={styles.departmentName}>
                  {item.department || 'Unknown Department'}
                </Text>
                <Text style={styles.departmentInfo}>
                  Assets: <Text style={styles.textData}>{item.assets}</Text>
                  &nbsp;&nbsp;<Text style={styles.seperator}> | </Text>
                  &nbsp;&nbsp;Zone:{' '}
                  <Text style={styles.textData}>{item.zoneId}</Text>
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => `${item.zoneId}-${index}`}
            contentContainerStyle={styles.departmentList}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default LocationScreen;
