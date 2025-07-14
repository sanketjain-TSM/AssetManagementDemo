import React, {useState, useRef, useEffect} from 'react';
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
} from 'react-native';
import axios from 'axios'; // Ensure axios is installed
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';

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
});

const LocationScreen = () => {
  const [selectedFloor, setSelectedFloor] = useState('');
  const [departments, setDepartments] = useState([]);
  const [floors, setFloors] = useState([]);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false); // New loading state

  const searchBarWidth = useRef(new Animated.Value(0)).current;

  const navigation = useNavigation();

  useEffect(() => {
    fetchFloors();
  }, []);

  useEffect(() => {
    if (selectedFloor) {
      // setSearchTerm("");
      fetchFloorData(selectedFloor);
    }
  }, [selectedFloor]);

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
        setSelectedFloor(fetchedFloors[0]?.floor); // Set the first floor as the default selected floor
      }
    } catch (error) {
      console.error('Failed to fetch floors:', error);
    }
  };

  const fetchFloorData = async floor => {
    setLoading(true); // Set loading to true when fetching starts
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await axios.get(
        `https://api.matorg.com/v1/assets/floor/${floor}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const departmentsData = response.data.map(item => ({
        zoneId: item.zoneId,
        department: item.department, // Handle null department
        assets: item.assetCount,
      }));
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Failed to fetch department data:', error);
    } finally {
      setLoading(false); // Set loading to false when fetching is done
    }
  };

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
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#EF652B" />
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
