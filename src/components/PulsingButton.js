import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Animated, Easing, StyleSheet } from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// --- Pulsing Glow Button Component ---
// --- Nefes Alan Parlayan Buton Bileşeni ---
export const PulsingGlowButton = ({ onPress, isRecording }) => {
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Continuous loop animation
        // Sürekli döngü animasyonu
        Animated.loop(
            Animated.sequence([
                Animated.timing(animValue, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(animValue, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
            ])
        ).start();
    }, []);

    const scale = animValue.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
    const opacity = animValue.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 0.6, 0] });
    
    // Green if recording, Blue if idle
    // Kayıt varsa yeşil, yoksa mavi
    const glowColor = isRecording ? '#2ecc71' : '#4A90E2';

    return (
        <View style={styles.container}>
            {/* The animated ring behind the button */}
            {/* Butonun arkasındaki animasyonlu halka */}
            <Animated.View style={[styles.pulseRing, { transform: [{ scale }], opacity: opacity, backgroundColor: glowColor }]} />
            
            <TouchableOpacity style={styles.recordButton} onPress={onPress} activeOpacity={0.8}>
                <LinearGradient colors={isRecording ? ['#FF0000', '#800000'] : ['#FF4B4B', '#FF0000']} style={styles.recordGradient}>
                    {isRecording ? <FontAwesome5 name="stop" size={24} color="white" /> : <MaterialIcons name="mic" size={40} color="white" />}
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center', width: 100, height: 100 },
    pulseRing: { position: 'absolute', width: 80, height: 80, borderRadius: 40, zIndex: 1 },
    recordButton: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
    recordGradient: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#2A2A2A' },
});