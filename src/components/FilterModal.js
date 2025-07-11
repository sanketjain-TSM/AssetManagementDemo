// src/components/FilterModal.js
import React, { useRef, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated, SafeAreaView, Image } from 'react-native';
import { Checkbox } from 'react-native-paper';
import { useFilter } from '../context/FilterContext';  // Adjust path as needed

const FilterModal = () => {
    const {
        isVisible,
        hideFilter,
        isAssetSelected,
        toggleAssetSelection,
        isLocationSelected,
        toggleLocationSelection
    } = useFilter();

    const translateX = useRef(new Animated.Value(300)).current;  // Initialize off-screen

    useEffect(() => {
        Animated.timing(translateX, {
            toValue: isVisible ? 0 : 300,
            duration: 250,
            useNativeDriver: true
        }).start();
    }, [isVisible]);

    return (
        <Modal transparent={true} visible={isVisible} onRequestClose={hideFilter}>
            <SafeAreaView style={styles.modalOverlay}>
                <Animated.View style={[styles.modalContainer, { transform: [{ translateX }] }]}>
                    <View style={styles.header}>
                        <Text style={styles.modalTitle}>Filter</Text>
                        <TouchableOpacity onPress={hideFilter} style={styles.closeButton}>
                            <Image
                                source={require("../../assets/images/filter_close_button.png")}  // Make sure path is correct
                                style={styles.closeImage}
                            />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.content}>
                        <Checkbox.Item
                            label="Asset Category"
                            status={isAssetSelected ? 'checked' : 'unchecked'}
                            onPress={toggleAssetSelection}
                            color="#EF652B"
                            uncheckedColor="#000"
                        />
                        <Checkbox.Item
                            label="Location"
                            status={isLocationSelected ? 'checked' : 'unchecked'}
                            onPress={toggleLocationSelection}
                            color="#EF652B"
                            uncheckedColor="#000"
                        />
                    </View>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity onPress={toggleAssetSelection} style={[styles.button, styles.resetButton]}>
                            <Text style={styles.buttonText_reset}>Reset</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={hideFilter} style={[styles.button, styles.applyButton]}>
                            <Text style={styles.buttonText}>Apply Filter</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
    },
    modalContainer: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '80%',
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: "#fff",
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0'
    },
    modalTitle: {
        marginLeft: 15,
        fontSize: 22,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 10,
    },
    closeImage: {
        width: 24,
        height: 24
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        padding: 20,
    },
    button: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginHorizontal: 5,
    },
    applyButton: {
        backgroundColor: '#EF652B',
    },
    resetButton: {
        borderColor: "#000",
        borderWidth: 2,
        backgroundColor: '#fff',
    },
    buttonText: {
        fontSize: 16,
        color: 'white',
        fontWeight: 'bold'
    },
    buttonText_reset: {
        fontSize: 16,
        color: 'black',
        fontWeight: 'bold'
    }
});

export default FilterModal;
