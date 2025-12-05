import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const widthPercentageToDP = widthPercent =>
  (screenWidth * parseFloat(widthPercent)) / 100;
const heightPercentageToDP = heightPercent =>
  (screenHeight * parseFloat(heightPercent)) / 100;
const isTablet = () => screenWidth >= 768 && screenHeight / screenWidth < 1.6;

const AssetFormHeader = ({title, onBackPress}) => {
  const tablet = isTablet();

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: tablet ? heightPercentageToDP(2) : 15,
    },
    headerText: {
      fontSize: tablet ? 26 : 20,
      fontWeight: '600',
      flex: 1,
      textAlign: 'left',
    },
    backButton: {marginLeft: tablet ? 20 : 15},
    backArrow: {
      width: tablet ? 44 : 36,
      height: tablet ? 44 : 36,
      marginRight: tablet ? 15 : 10,
      marginLeft: -10,
    },
  });

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
        <Image
          source={require('../../assets/images/backArrow.png')}
          style={styles.backArrow}
        />
      </TouchableOpacity>
      <Text style={styles.headerText}>{title}</Text>
    </View>
  );
};

export default AssetFormHeader;
