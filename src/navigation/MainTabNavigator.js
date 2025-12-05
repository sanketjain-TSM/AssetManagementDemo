import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen";
import AssetsScreen from "../screens/AssetsScreen";
import SearchScreen from "../screens/SearchScreen";
import LocationScreen from "../screens/LocationScreen";
import ProfileScreen from "../screens/ProfileScreen";
import CustomTabBar from "./CustomTabBar";

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Assets" component={AssetsScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Location" component={LocationScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
