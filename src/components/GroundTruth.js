import { Image, StyleSheet, Text, View, Dimensions } from "react-native";
import React, { useEffect, useState } from "react";
import like from "../../assets/images/like.png";
import dislike from "../../assets/images/dislike.png";
import { TouchableOpacity } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const { width: screenWidth } = Dimensions.get("window");
const isTablet = screenWidth >= 768;
const scaleSize = (size) => (isTablet ? size * 1.3 : size);

export default function GroundTruth({ item }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isDisLiked, setIsDisLiked] = useState(false);
  const [role, setRole] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchRole = async () => {
      const role = await AsyncStorage.getItem("role");
      if (isMounted) {
        setRole(role);
      }
    };
    fetchRole();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (
      item.latestFeedback &&
      item.latestFeedback.toLowerCase() == "thumb_up"
    ) {
      setIsLiked(true);
    } else if (
      item.latestFeedback &&
      item.latestFeedback.toLowerCase() == "thumb_down"
    ) {
      setIsDisLiked(true);
    }
  }, []);

  const sendFeedback = async (feedback) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.post(
        "http://35.223.244.137:8000/v1/feedback",
        {
          deviceId: item?.deviceId,
          zone: item?.zoneId,
          feedback: feedback,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 201) {
        console.log("Feedback submitted successfully:", response.data);
      } else {
        console.error(`Failed to send feedback: ${response.status}`);
      }
    } catch (error) {
      console.error("Error submitting feedback:", error.message);
    }
  };

  const handleLike = () => {
    if (isDisLiked) {
      setIsDisLiked(false);
    }
    sendFeedback("thumb_up");
    if (isLiked) return;
    setIsLiked(!isLiked);
  };
  const handleDisLike = () => {
    if (isLiked) {
      setIsLiked(false);
    }
    sendFeedback("thumb_down");
    if (isDisLiked) return;
    setIsDisLiked(!isDisLiked);
  };

  return (
    <View style={styles.feedBackContainer}>
      <View style={styles.availibility}>
        {item?.zoneCategory && (
          <Image
            source={require("../../assets/images/tickcircle.png")}
            style={styles.icon}
          />
        )}
        <Text style={styles.locationText}>
          {item?.zoneCategory &&
            (["p", "productive (p)", "productive", "(p)"].includes(
              item?.zoneCategory?.trim()?.toLowerCase()
            )
              ? " Check Availability"
              : " Available")}
        </Text>
      </View>
      {["superAdmin", "admin"].includes(role) && (
        <View style={styles.thumbsContainer}>
          <TouchableOpacity onPress={() => handleLike()}>
            <View
              style={[
                styles.likeContainer,
                { backgroundColor: isLiked ? "green" : "#E0E0E0" },
              ]}
            >
              <Image
                source={like}
                style={[
                  styles.like,
                  { tintColor: isLiked ? "white" : "#5f6368" },
                ]}
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDisLike()}>
            <View
              style={[
                styles.dislikeContainer,
                { backgroundColor: isDisLiked ? "red" : "#E0E0E0" },
              ]}
            >
              <Image
                source={dislike}
                style={[
                  styles.dislike,
                  { tintColor: isDisLiked ? "white" : "#5f6368" },
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  feedBackContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  icon: {
    width: scaleSize(18),
    height: scaleSize(18),
    marginLeft: scaleSize(1),
    marginRight: scaleSize(3),
  },
  availibility: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  locationText: {
    color: "#202239",
    fontSize: scaleSize(14),
    fontFamily: "Roboto",
  },
  thumbsContainer: {
    paddingRight: scaleSize(1),
    flexDirection: "row",
    alignItems: "center",
    gap: scaleSize(10),
    width: "30%",
    justifyContent: "center",
  },
  like: {
    width: scaleSize(12),
    height: scaleSize(12),
    zIndex: 99,
    marginBottom: scaleSize(2),
  },
  likeContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: scaleSize(22),
    height: scaleSize(22),
    zIndex: 99,
    borderRadius: scaleSize(50),
  },
  dislike: {
    width: scaleSize(12),
    height: scaleSize(12),
    zIndex: 99,
    marginTop: scaleSize(2),
  },
  dislikeContainer: {
    width: scaleSize(22),
    height: scaleSize(22),
    zIndex: 99,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: scaleSize(50),
  },
});
