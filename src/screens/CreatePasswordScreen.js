import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  StatusBar,
} from "react-native";
import axios from "axios";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const widthPercentageToDP = (widthPercent) =>
  (screenWidth * parseFloat(widthPercent)) / 100;

const heightPercentageToDP = (heightPercent) =>
  (screenHeight * parseFloat(heightPercent)) / 100;

const isTablet = () => {
  const aspectRatio = screenHeight / screenWidth;
  return screenWidth >= 768 && aspectRatio < 1.6;
};

const isLandscape = () => screenWidth > screenHeight;

const CreatePasswordScreen = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params;

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.post(
        "http://35.223.244.137:8000/v1/auth/initPassword",
        {
          password: password,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        Alert.alert("Success", "Password has been created successfully.", [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login"),
          },
        ]);
      } else {
        Alert.alert("Error", "Failed to create password. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const tablet = isTablet();
  const landscape = isLandscape();

  const styles = StyleSheet.create({
    container: {
      padding: tablet ? widthPercentageToDP(5) : 20,
      paddingTop: Platform.OS === "ios" ? 0 : StatusBar.currentHeight,
      backgroundColor: "#FFF",
      justifyContent: tablet && landscape ? "flex-start" : "center",
      paddingBottom: tablet ? heightPercentageToDP(8) : 75,
      minHeight: tablet && landscape ? "100%" : "100%",
    },
    contentWrapper: {
      maxWidth: tablet
        ? landscape
          ? widthPercentageToDP(50)
          : widthPercentageToDP(70)
        : "100%",
      alignSelf: "center",
      width: "100%",
    },
    logo: {
      marginBottom: tablet
        ? landscape
          ? heightPercentageToDP(15)
          : heightPercentageToDP(8)
        : 180,
      marginBottom: tablet ? heightPercentageToDP(20) : 50,
      transform: tablet ? [{ scale: landscape ? 1.2 : 1.5 }] : [{ scale: 1 }],
      alignSelf: "flex-start",
    },
    title: {
      fontSize: tablet ? (landscape ? 36 : 48) : 42,
      fontWeight: "600",
      textAlign: "left",
    },
    subtitle: {
      fontSize: tablet ? 18 : 15,
      textAlign: "left",
      marginBottom: tablet ? heightPercentageToDP(2) : 30,
      marginTop: tablet ? heightPercentageToDP(2) : 30,
      fontFamily: "Roboto",
      opacity: 0.5,
      color: "#000000",
    },
    email: {
      height: tablet ? heightPercentageToDP(5) : 50,
      borderRadius: tablet ? 8 : 5,
      paddingHorizontal: 20,
      marginBottom: tablet ? heightPercentageToDP(2) : 20,
      backgroundColor: "#F9F9F9",
      fontSize: tablet ? 18 : 16,
    },
    signInButton: {
      height: tablet ? heightPercentageToDP(5) : 50,
      backgroundColor: "#EF652B",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: tablet ? 8 : 5,
      marginBottom: tablet ? heightPercentageToDP(2) : 10,
      marginTop: tablet ? heightPercentageToDP(2) : 0,
    },
    signInButtonText: {
      color: "#FFF",
      fontSize: tablet ? 20 : 18,
      fontFamily: "Roboto",
      fontWeight: "400",
    },
    backButton: {
      height: tablet ? heightPercentageToDP(5) : 50,
      backgroundColor: "#fff",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: tablet ? 8 : 5,
      marginBottom: 20,
      borderWidth: 1.5,
      borderColor: "#202239",
    },
    backButtonText: {
      color: "#202239",
      fontSize: tablet ? 20 : 18,
      fontFamily: "Roboto",
    },
  });

  return (
    <KeyboardAwareScrollView
      enableOnAndroid={true}
      extraScrollHeight={isTablet() ? 40 : 20}
      extraHeight={isTablet() ? 150 : 100}
      showsVerticalScrollIndicator={false}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <View style={styles.contentWrapper}>
            <Image
              source={require("../../assets/images/chorus.png")}
              style={styles.logo}
            />

            <Text style={styles.title}>Create</Text>
            <Text style={styles.title}>Password!</Text>

            <Text style={styles.subtitle}>
              Please create a strong and unique password for your account.
            </Text>

            <TextInput
              style={styles.email}
              placeholder="Create New Password"
              placeholderTextColor="#C7C7CD"
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}
              selectionColor="#EF652B"
            />

            <TextInput
              style={styles.email}
              placeholder="Confirm Password"
              placeholderTextColor="#C7C7CD"
              secureTextEntry={true}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              selectionColor="#EF652B"
            />

            <TouchableOpacity
              style={styles.signInButton}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator
                  size={tablet ? "large" : "small"}
                  color="#FFF"
                />
              ) : (
                <Text style={styles.signInButtonText}>Create Password</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              activeOpacity={0.8}
            >
              <View style={styles.backButton}>
                <Text style={styles.backButtonText}>Back to Login</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAwareScrollView>
  );
};

export default CreatePasswordScreen;
