import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import Icon from "react-native-vector-icons/Ionicons";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const widthPercentageToDP = (widthPercent) =>
  (screenWidth * parseFloat(widthPercent)) / 100;
const heightPercentageToDP = (heightPercent) =>
  (screenHeight * parseFloat(heightPercent)) / 100;
const isTablet = () => screenWidth >= 768 && screenHeight / screenWidth < 1.6;
const tablet = isTablet();

const TAB_BAR_HEIGHT = tablet ? heightPercentageToDP(11) : 70;
const CURVE_RADIUS = tablet ? 36 : 20;

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const handlePress = (route, isFocused) => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const handleLongPress = (route) => {
    navigation.emit({
      type: "tabLongPress",
      target: route.key,
    });
  };

  const styles = StyleSheet.create({
    container: {
      position: "absolute",
      bottom: 0,
      width: "100%",
      height: TAB_BAR_HEIGHT,
      backgroundColor: "transparent",
    },
    backgroundSvg: {
      position: "absolute",
      top: 0,
      left: 0,
    },
    tabBar: {
      flexDirection: "row",
      height: TAB_BAR_HEIGHT - (tablet ? 26 : 20),
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: tablet ? widthPercentageToDP(6) : 20,
      backgroundColor: "transparent",
    },
    tab: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    searchTabContainer: {
      position: "absolute",
      top: -(CURVE_RADIUS / (tablet ? 10 : 8)),
      left: screenWidth / 2 - CURVE_RADIUS,
      width: CURVE_RADIUS * 2,
      height: CURVE_RADIUS * 2,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
    },
    searchTab: {
      width: CURVE_RADIUS * 2,
      height: CURVE_RADIUS * 2,
      borderRadius: CURVE_RADIUS,
      backgroundColor: "#EF652B",
      justifyContent: "center",
      alignItems: "center",
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    searchTabActive: {
      backgroundColor: "#D04B2D",
    },
  });

  return (
    <View style={styles.container}>
      <Svg
        width={screenWidth}
        height={TAB_BAR_HEIGHT}
        viewBox={`0 0 ${screenWidth} ${TAB_BAR_HEIGHT}`}
        style={styles.backgroundSvg}
      >
        <Path
          d={`M0,0 L${screenWidth / 2 - CURVE_RADIUS},0 Q${screenWidth / 2},${
            CURVE_RADIUS * 2
          } ${
            screenWidth / 2 + CURVE_RADIUS
          },0 L${screenWidth},0 L${screenWidth},${TAB_BAR_HEIGHT} L0,${TAB_BAR_HEIGHT} Z`}
          fill="white"
        />
      </Svg>

      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const iconName =
            route.name === "Home"
              ? "home-outline"
              : route.name === "Assets"
              ? "cube-outline"
              : route.name === "Location"
              ? "location-outline"
              : route.name === "Profile"
              ? "person-outline"
              : "search";

          if (route.name === "Search") {
            return (
              <View key={index} style={styles.searchTabContainer}>
                <TouchableOpacity
                  onPress={() => handlePress(route, isFocused)}
                  onLongPress={() => handleLongPress(route)}
                  style={[
                    styles.searchTab,
                    isFocused && styles.searchTabActive,
                  ]}
                >
                  <Icon name="search" size={tablet ? 34 : 30} color="white" />
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => handlePress(route, isFocused)}
              onLongPress={() => handleLongPress(route)}
              style={styles.tab}
            >
              <Icon
                name={iconName}
                size={tablet ? 30 : 25}
                color={isFocused ? "#EF652B" : "gray"}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default CustomTabBar;
