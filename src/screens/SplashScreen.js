import { useNavigation } from "@react-navigation/native";
import React, { useEffect } from "react";
import { View, Image, StyleSheet, Dimensions } from "react-native";

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    setTimeout(() => {
      navigation.navigate("Login");
    }, 3000); // Wait 2 seconds before navigating
  }, [navigation]);
  return (
    <View style={styles.container}>
      <Image source={require("../../assets/images/splash_bg_removed.png")} style={styles.logo} resizeMode="contain" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1F2137",
  },
  logo: {
    width: windowWidth * 0.5, // Logo width as 50% of screen width
    height: windowHeight * 0.5, // Logo height as 50% of screen height
  },
});

export default SplashScreen;
