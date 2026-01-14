import { useNavigation } from "@react-navigation/native";
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
  SafeAreaView,
} from "react-native";

const TermsCondition = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigation = useNavigation();

  const handleChangePassword = () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    // Add your API call here to change the password
    Alert.alert("Success", "Password changed successfully.");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          // style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image
            source={require("../../assets/images/backArrow.png")}
            style={styles.backArrow}
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>Terms & Conditions</Text>
      </View>
      <View style={{ padding: 20 }}>
        <View>
          <Text style={{ fontWeight: '600' }}>Heading 01</Text>
          <Text style={{ marginTop: 20, color: "#0E0E0E", opacity: 0.5 }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi
            mollis justo leo, sit amet porta mauris ultricies ut. Vestibulum
            eget mauris in metus molestie consequat nec et dui. Donec convallis
            porta erat, ac gravida elit semper non. Fusce ultricies, mauris non
            accumsan.
          </Text>
        </View>
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: '600' }}>Heading 02</Text>
          <Text style={{ marginTop: 10, color: "#0E0E0E", opacity: 0.5 }}>
            Phasellus nibh odio, sollicitudin id augue non, commodo eleifend
            turpis. Suspendisse pretium tellus in lacus mollis, quis lobortis
            nisl cursus. Donec est neque, accumsan vitae ligula at, iaculis
            cursus tellus. Maecenas ligula eros, iaculis venenatis magna ut,
            interdum scelerisque risus. Vivamus nunc massa, interdum a felis a,
            lobortis scelerisque sem. Phasellus euismod mattis nisi ut
            sollicitudin. Proin metus turpis, blandit at commodo quis, sodales a
            massa.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 }, // x: 0, y: 4 for a bottom shadow
    shadowOpacity: 0.03, // Lower opacity for a more subtle shadow
    shadowRadius: 3, // Larger radius for a softer shadow
    elevation: 2,
    paddingBottom: 5,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: "center",
    marginVertical: 20,
  },
  backButton: {
    position: "absolute",
    top: 70,
    left: 30,
    width: 44,
    height: 44,
  },
  backArrow: {
    width: 44,
    height: 44,
    marginRight: 15,
  },
  label: {
    fontSize: 16,
    color: "#0E0E0E",
    marginTop: 15,
    marginBottom: 8,
    fontWeight: '400',
  },
  input: {
    height: 50,
    fontSize: 15,
    backgroundColor: "#F9F9F9",
    padding: 10,
    borderRadius: 5,
    fontWeight: '400',
  },
  button: {
    marginTop: 400,
    backgroundColor: "#EF652B",
    padding: 15,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: '400',
  },
});

export default TermsCondition;
