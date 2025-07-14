import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  TouchableNativeFeedback,
  TouchableWithoutFeedback,
  Image,
  Text,
} from "react-native";
import HomeIconActive from "../../assets/images/homeHighlight.png";
import HomeIconInactive from "../../assets/images/homeUnHighlight.png";
import AssetsIconActive from "../../assets/images/assetsHighlight.png";
import AssetsIconInactive from "../../assets/images/assetsUnHighlight.png";
import CurvedBackground from "../../assets/images/bottomNavigator.png"; // Use the curved background image
import SearchIconActive from "../../assets/images/assetSearch.png";
import LocationIconActive from "../../assets/images/locationHighlight.png";
import LocationIconInactive from "../../assets/images/locationUnHighlight.png";
import ProfileIconActive from "../../assets/images/profileHighlight.png";
import ProfileIconInactive from "../../assets/images/profileUnHighlight.png";

// Import your screens here
// import LogoScreen from "../screens/LogoScreen";
import LoginScreen from "../screens/LoginScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import OtpVerificationScreen from "../screens/OtpVerificationScreen";
import CreatePasswordScreen from "../screens/CreatePasswordScreen";
import DepartmentListScreen from "../screens/DepartmentListScreen";
import AddAssetScreen from "../screens/AddAssetScreen";
import HomeScreen from "../screens/HomeScreen";
import AssetsScreen from "../screens/AssetsScreen";
import SearchScreen from "../screens/SearchScreen";
import LocationScreen from "../screens/LocationScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SplashScreen from "../screens/SplashScreen";
// import ChangePasswordScreen from "../screens/ChangePasswordScreen";
import AssetDetailsScreen from "../screens/AssetDetailsScreen";
import ChangePasswordScreen from "../screens/ChangePasswordScreen";
import SearchResultsScreen from "../screens/SearchResultsScreen";
import GlobalSearchResultsScreen from "../screens/GlobalSearchResultsScreen";
import UserProfileScreen from "../screens/UserProfileScreen";
import TermsCondition from "../screens/TermsCondition";
import DepartmentAssetDetailsScreen from "../screens/DepartmentAssetDetailsScreen";
import BleScanner from "../screens/BleScanner";
import { Dimensions } from "react-native";
import Toast from "react-native-toast-message";
import { useDevicesContext } from "../context/DeviceContext";
import { syncDevicesWithAssets } from "../utils/syncDevicesWithAssets";

const { width, height } = Dimensions.get("window");

// Get device dimensions
const isTablet = () => width >= 768 && height / width < 1.6;
const tablet = isTablet();

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const smallDeviceWidth = 360;
const mediumDeviceWidth = 414;

const ButtonComponent =
  Platform.OS === "android" ? TouchableWithoutFeedback : TouchableOpacity;

// Create dynamic styles based on the screen size
const getTabBarBackgroundStyle = () => {
  const { width, height } = Dimensions.get("window");
  const isLandscape = width > height;
  if (width <= smallDeviceWidth) {
    // Styles for small devices
    return {
      width: width * 1.5,
      height: height * 0.175,
      position: "absolute",
      left: -(width * 0.25),
      bottom: -(height * 0.045),
    };
  } else if (width > smallDeviceWidth && width <= mediumDeviceWidth) {
    // Styles for medium devices
    return {
      width: width * 1.5,
      height: Platform.OS === "ios" ? height * 0.2 : height * 0.18,
      position: "absolute",
      left: -(width * 0.25),
      bottom: -(height * 0.05),
    };
  } else {
    // Styles for large devices (tablet)
    return {
      width: tablet && isLandscape ? width * 1.5 : width * 1.5,
      height: isLandscape ? height * 0.195 : height * 0.16,
      position: "absolute",
      left: -(width * 0.25),
      bottom: -(height * 0.06),
    };
  }
};

const getSearchTabButtonContainerStyle = () => {
  if (width <= smallDeviceWidth) {
    // Styles for small devices
    return {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginTop: Platform.OS === "ios" ? -80 : -65, // Adjusted for small devices
    };
  } else if (width > smallDeviceWidth && width <= mediumDeviceWidth) {
    // Styles for medium devices
    return {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginTop: Platform.OS === "ios" ? -10 : -65, // Adjusted for medium devices
    };
  } else {
    // Styles for large devices
    return {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginTop: Platform.OS === "ios" ? -50 : -65, // Adjusted for large devices
    };
  }
};

// Bottom Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          let icon;
          if (route.name === "Home") {
            icon = focused ? HomeIconActive : HomeIconInactive;
          } else if (route.name === "Assets") {
            icon = focused ? AssetsIconActive : AssetsIconInactive;
          } else if (route.name === "Search") {
            icon = SearchIconActive;
          } else if (route.name === "Location") {
            icon = focused ? LocationIconActive : LocationIconInactive;
          } else if (route.name === "Profile") {
            icon = focused ? ProfileIconActive : ProfileIconInactive;
          }
          return (
            <Image
              source={icon}
              style={{
                width: tablet ? 40 : 30,
                height: tablet ? 40 : 30,
                resizeMode: "contain",
              }}
            />
          );
        },
        tabBarActiveTintColor: "#EF652B",
        tabBarInactiveTintColor: "#5f6368",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: Platform.OS === "ios" ? -10 : 0,
          marginLeft: Platform.OS === "ios" && tablet ? 1 : 0,
        },
        tabBarStyle: styles.tabBarStyle,
        tabBarBackground: () => {
          const dynamicStyle = getTabBarBackgroundStyle();
          return (
            <Image
              source={CurvedBackground}
              style={[styles.tabBarBackground, dynamicStyle]}
              resizeMode="stretch"
            />
          );
        },
        tabBarButton: (props) => {
          if (route.name === "Search") {
            return (
              <View style={styles.searchTabButtonContainer}>
                <ButtonComponent
                  {...props}
                  // background={TouchableNativeFeedback.Ripple("#fff", true)}
                >
                  <View style={styles.searchTab}>
                    <View style={styles.customSearchIconContainer}>
                      <Image
                        source={SearchIconActive}
                        style={styles.customSearchIcon}
                      />
                    </View>
                  </View>
                </ButtonComponent>
              </View>
            );
          }
          return (
            <ButtonComponent {...props}>
              <View style={styles.tabButton}>{props.children}</View>
            </ButtonComponent>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Assets"
        component={AssetsScreen}
        options={{ unmountOnBlur: true }}
      />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen
        name="Location"
        component={LocationScreen}
        options={{ unmountOnBlur: true }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ unmountOnBlur: true }}
      />
    </Tab.Navigator>
  );
};
function processBase64ManufacturerData(manufacturerData) {
  if (!manufacturerData) return;
  // Decode Base64 string into a Uint8Array
  const decodedBytes = Uint8Array.from(atob(manufacturerData), (char) =>
    char.charCodeAt(0)
  );

  // Extract the last 6 bytes for the MAC address
  const macAddressData = decodedBytes.slice(-6);

  // Convert the MAC address bytes to a string
  const macAddressString = Array.from(macAddressData)
    .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
    .join(":");

  // Convert the entire manufacturer data to a hex string
  const payloadString = Array.from(decodedBytes)
    .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
    .join("");

  return { macAddressString, payloadString };
}

function formatDeviceId(deviceId) {
  return deviceId?.replace(/:/g, "")?.toLowerCase();
}

// Stack Navigator
const AppNavigator = () => {
  const { devices } = useDevicesContext();
  return (
    <SafeAreaProvider>
      {/* <Text style={{ marginTop: 60 }}>
        Device:{" "}
        {formatDeviceId(
          processBase64ManufacturerData(devices?.[0]?.manufacturerData)
            ?.macAddressString
        )}{" "}
        : {devices?.[0]?.rssi}
      </Text>
      <Text>
        Device:{" "}
        {formatDeviceId(
          processBase64ManufacturerData(devices?.[1]?.manufacturerData)
            ?.macAddressString
        )}{" "}
        : {devices?.[1]?.rssi}
      </Text>
      <Text>
        Device:{" "}
        {formatDeviceId(
          processBase64ManufacturerData(devices?.[2]?.manufacturerData)
            ?.macAddressString
        )}{" "}
        : {devices?.[2]?.rssi}
      </Text> */}
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* <Stack.Screen name="LogoScreen" component={LogoScreen} /> */}
          <Stack.Screen name="SplashScreen" component={SplashScreen} />

          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
          />
          <Stack.Screen name="OtpScreen" component={OtpVerificationScreen} />
          <Stack.Screen
            name="CreatePassword"
            component={CreatePasswordScreen}
          />
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="AssetDetails" component={AssetDetailsScreen} />
          <Stack.Screen name="BleScanner" component={BleScanner} />

          <Stack.Screen
            name="DepartmentAssetDetailsScreen"
            component={DepartmentAssetDetailsScreen}
          />
          {/* <Stack.Screen
          name="ChangePasswordScreen"
          component={ChangePasswordScreen}
        /> */}
          <Stack.Screen
            name="DepartmentListScreen"
            component={DepartmentListScreen}
          />

          <Stack.Screen
            name="ChangePasswordScreen"
            component={ChangePasswordScreen}
          />
          <Stack.Screen
            name="UserProfileScreen"
            component={UserProfileScreen}
            options={{ unmountOnBlur: true }}
          />
          <Stack.Screen
            name="AddAssetScreen"
            component={AddAssetScreen}
            options={{ unmountOnBlur: true }}
          />
          <Stack.Screen
            name="SearchResultsScreen"
            component={SearchResultsScreen}
          />
          <Stack.Screen
            name="GlobalSearchResultsScreen"
            component={GlobalSearchResultsScreen}
          />
          <Stack.Screen name="TermsCondition" component={TermsCondition} />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  tabBarStyle: {
    height: Platform.OS === "ios" ? 80 : 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent", // Ensure transparency to show the background image
  },
  tabBarBackground: {
    ...getTabBarBackgroundStyle(),
    position: "absolute",
  },
  tabButton: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    height: Platform.OS === "ios" ? 60 : 55,
  },
  searchTabButtonContainer: {
    position: "relative", // Allow custom positioning of elements within

    ...getSearchTabButtonContainerStyle(),
  },
  searchTab: {
    backgroundColor: "#EF652B",
    width: 65,
    height: 65,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  customSearchIconContainer: {
    position: "absolute",
    top: 15, // Adjust the position relative to the tab bar
    justifyContent: "center",
    alignItems: "center",
  },
  customSearchIcon: {
    width: 35, // Adjust as needed
    height: 35, // Adjust as needed
  },
});

export default AppNavigator;
