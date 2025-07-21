import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {syncDevicesWithAssets} from '../utils/syncDevicesWithAssets';
import {useDevicesContext} from '../context/DeviceContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {width: screenWidth} = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const scaleSize = size => (isTablet ? size * 1.3 : size);

const styles = StyleSheet.create({
  parentContainer: {
    gap: scaleSize(8),
    flexDirection: 'row',
  },
  container: {
    width: '100%',
    marginTop: scaleSize(6),
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelContainer: {
    padding: 0,
    marginLeft: scaleSize(-7),
    display: 'flex',
  },
  rssiLabel: {
    marginTop: scaleSize(12),
    fontSize: scaleSize(13),
    color: '#202239',
  },
  signalBars: {
    flexDirection: 'row',
    marginBottom: scaleSize(5),
  },
  firstSignalBars: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginLeft: 0,
    marginBottom: scaleSize(5),
  },
  icon: {
    width: scaleSize(22),
    height: scaleSize(22),
    marginLeft: scaleSize(-1),
    marginRight: scaleSize(5),
  },
  infoTitle: {
    fontSize: scaleSize(14),
    color: '#333333',
    padding: 0,
    margin: 0,
  },
  infoChild: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSize(8),
  },
  signalBar: {
    width: scaleSize(25),
    height: scaleSize(7),
    borderRadius: 1,
    marginRight: 1,
  },
  recentSignalBar: {
    width: scaleSize(25),
    height: scaleSize(11),
    borderRadius: 1,
    marginRight: 1,
  },
  activityIndicatorWrapper: {
    height: 0,
    width: 0,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 0,
    padding: 0,
  },
  activityIndicator: {
    marginLeft: scaleSize(3),
    marginTop: scaleSize(-7),
    transform: [{scale: 0.8}],
  },
});

export const SixBarIndicatorSignalmeter = ({rssi}) => {
  const totalBars = 6;
  const [rssiHistory, setRssiHistory] = useState([-100, -100, -100, -100]);
  const [role, setRole] = useState('');
  const [mostRecentStrength, setMostRecentStrength] = useState(0); // To hold the most recent strength
  const [showIndicator, setShowIndicator] = useState(false); // To track whether to show the activity indicator
  const [indicatorTimeoutId, setIndicatorTimeoutId] = useState(null); // To track the timeout for the indicator

  const {devices} = useDevicesContext();
  const proximityValue = syncDevicesWithAssets(devices)?.get(rssi);

  const barColors = Object.freeze({
    0: '#e38201',
    1: '#eaa51b',
    2: '#c6dbce',
    3: '#95b8a3',
    4: '#6f927e',
    5: '#496f58',
  });

  useEffect(() => {
    let isMounted = true;
    const fetchRole = async () => {
      const role = await AsyncStorage.getItem('role');
      if (isMounted) {
        setRole(role);
      }
    };
    fetchRole();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update RSSI history when a new proximity value is received
  useEffect(() => {
    if (proximityValue != null) {
      setRssiHistory(prev => [...prev.slice(-3), proximityValue]); // Keep only the last 4 entries
      setMostRecentStrength(calculateStrength(proximityValue)); // Update most recent strength

      // Hide the activity indicator since new RSSI is received
      setShowIndicator(false);

      // Clear any existing timeout
      if (indicatorTimeoutId) clearTimeout(indicatorTimeoutId);

      // Set a timeout to show the activity indicator if no new RSSI is received in 2 seconds
      const newTimeoutId = setTimeout(() => {
        setShowIndicator(true);
      }, 2000); // 2 seconds

      setIndicatorTimeoutId(newTimeoutId); // Update the timeout ID
    } else {
      // If proximityValue is null (device out of range), hide the indicator
      setShowIndicator(false);
    }
  }, [proximityValue]);

  const calculateStrength = proximityValue => {
    if (proximityValue >= -40) return 6; // Full strength (6 bars)
    if (proximityValue > -50) return 5; // 5 bars for -41 to -50
    if (proximityValue > -60) return 4; // 4 bars for -51 to -60
    if (proximityValue > -70) return 3; // 3 bars for -61 to -70
    if (proximityValue > -80) return 2; // 2 bars for -71 to -80
    if (proximityValue > -90) return 1; // 1 bar for -81 and below
    return 0; // No signal
  };

  const renderSignalBars = (strength, color, ind) => {
    if (ind === 3) {
      return [...Array(totalBars)].map((_, index) => (
        <View
          key={index}
          style={[
            styles.recentSignalBar,

            {
              backgroundColor: index < strength ? barColors[index] : '#E0E0E0',
            },
          ]}
        />
      ));
    }
    return [...Array(totalBars)].map((_, index) => (
      <View
        key={index}
        style={[
          styles.signalBar,
          index === 1 && styles.secondSignalBar,
          index === 2 && styles.thirdSignalBar,
          index === 3 && styles.fourthSignalBar,
          {backgroundColor: index < strength ? barColors[index] : '#E0E0E0'},
        ]}
      />
    ));
  };

  return (
    <View style={styles.parentContainer}>
      <Image
        source={require('../../assets/images/distance.png')}
        style={styles.icon}
      />
      <View
        style={{
          padding: 0,
          marginLeft: -7,
          display: 'flex',
          //   justifyContent: "space-around",
        }}>
        <Text style={styles.infoTitle}>Proximity :</Text>
        {['superAdmin', 'admin'].includes(role) && (
          <Text
            style={{
              marginTop: scaleSize(12),
              fontSize: scaleSize(13),
              color: '#333',
            }}>
            RSSI : {proximityValue}
          </Text>
        )}
      </View>
      <View style={styles.container}>
        <View style={{flexDirection: 'column-reverse', alignItems: 'center'}}>
          {rssiHistory.map((rssiValue, index) => {
            let color;
            if (index === rssiHistory.length - 1)
              color = '#607c3c'; // Most recent: green
            else if (index === rssiHistory.length - 2)
              color = '#819c12'; // 2nd most recent: light green
            else if (index === rssiHistory.length - 3)
              color = '#acc32f'; // 3rd most recent: yellow
            else color = '#b5e550'; // Oldest: red

            const strengthToRender =
              index === rssiHistory.length - 1
                ? mostRecentStrength // Use the most recent strength
                : calculateStrength(rssiValue); // Static for others

            return (
              <View style={styles.infoChild} key={index}>
                <View
                  style={
                    index === rssiHistory.length - 1
                      ? styles.firstSignalBars
                      : styles.signalBars
                  }>
                  {renderSignalBars(strengthToRender, color, index)}
                </View>
                {index === rssiHistory.length - 1 && showIndicator ? (
                  <View style={styles.activityIndicatorWrapper}>
                    <ActivityIndicator
                      size="small"
                      color="#0000ff"
                      style={styles.activityIndicator}
                    />
                  </View>
                ) : (
                  <View style={styles.activityIndicator} />
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};
