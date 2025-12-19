import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Easing } from 'react-native';

// --- Playback Wave Bar (Dancing bar during playback) ---
// --- Oynatma Dalga Çubuğu (Oynatma sırasında dans eden çubuk) ---
export const PlaybackWaveBar = ({ height, isPlaying }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isPlaying) {
            // Random vibration effect
            // Rastgele titreşim efekti
            const randomDuration = 100 + Math.random() * 200;
            
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scaleAnim, { 
                        toValue: 1.5, 
                        duration: randomDuration, 
                        useNativeDriver: false 
                    }),
                    Animated.timing(scaleAnim, { 
                        toValue: 0.8, 
                        duration: randomDuration, 
                        useNativeDriver: false 
                    })
                ])
            ).start();
        } else {
            // Return to normal
            // Normale dön
            Animated.timing(scaleAnim, { 
                toValue: 1, 
                duration: 200, 
                useNativeDriver: false 
            }).start();
        }
    }, [isPlaying]);

    return (
        <Animated.View 
            style={[
                styles.miniWaveBar, 
                { 
                    height: height, 
                    transform: [{ scaleY: scaleAnim }],
                    backgroundColor: isPlaying ? '#FF4B4B' : '#A03333'
                }
            ]} 
        />
    );
};

// --- Idle Animated Wave Bar (Waiting screen animation) ---
// --- Bekleme Modu Dalga Çubuğu (Bekleme ekranı animasyonu) ---
export const AnimatedWaveBar = () => {
    const heightAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const randomDuration = 400 + Math.random() * 800; 
        Animated.loop(
            Animated.sequence([
                Animated.timing(heightAnim, { toValue: 1, duration: randomDuration, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
                Animated.timing(heightAnim, { toValue: 0, duration: randomDuration, easing: Easing.inOut(Easing.ease), useNativeDriver: false })
            ])
        ).start();
    }, []);

    const height = heightAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 50] });
    const backgroundColor = heightAnim.interpolate({ inputRange: [0, 1], outputRange: ['#555555', '#4A90E2'] });

    return <Animated.View style={[styles.waveBar, { height, backgroundColor }]} />;
};

const styles = StyleSheet.create({
    waveBar: { width: 8, borderRadius: 4, marginHorizontal: 4 },
    miniWaveBar: { 
        width: 3, 
        backgroundColor: '#A03333', 
        marginHorizontal: 1, 
        borderRadius: 1.5 
    },
});