import React, { useEffect } from "react";
import { View, Image, StyleSheet, StatusBar } from "react-native";
import { useNavigation } from "@react-navigation/native";

const LogoScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    setTimeout(() => {
      navigation.navigate("Login");
    }, 4000); // Wait 2 seconds before navigating
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Image
        source={require("../../assets/images/logo_bg_removed.png")}
        style={styles.logo}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1F2137", // Updated to match the dark blue shade
  },
  logo: {
    // width: 150, // Adjusted size, increase if you want it bigger
    // height: 150, // Ensure the aspect ratio remains consistent
  },
});

export default LogoScreen;
