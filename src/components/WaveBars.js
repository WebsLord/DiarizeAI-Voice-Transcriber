import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Easing } from 'react-native';

// --- Playback Wave Bar (Müzik çalarken oynayan çubuk) ---
export const PlaybackWaveBar = ({ height, isPlaying }) => {
    // Height yerine Scale animasyonu kullanıyoruz ki ortadan uzasın
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isPlaying) {
            const randomDuration = 100 + Math.random() * 200;
            
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scaleAnim, { 
                        toValue: 1.8, // Biraz daha fazla uzasın
                        duration: randomDuration, 
                        useNativeDriver: true 
                    }),
                    Animated.timing(scaleAnim, { 
                        toValue: 0.5, 
                        duration: randomDuration, 
                        useNativeDriver: true 
                    })
                ])
            ).start();
        } else {
            Animated.timing(scaleAnim, { 
                toValue: 1, 
                duration: 200, 
                useNativeDriver: true 
            }).start();
        }
    }, [isPlaying]);

    return (
        <View style={styles.barContainer}>
            <Animated.View 
                style={[
                    styles.miniWaveBar, 
                    { 
                        height: height, // Baz yükseklik
                        transform: [{ scaleY: scaleAnim }], // Ortadan uzama efekti
                        backgroundColor: isPlaying ? '#FF4B4B' : '#A03333'
                    }
                ]} 
            />
        </View>
    );
};

// --- Idle Animated Wave Bar (Bekleme ekranındaki dalgalanma) ---
export const AnimatedWaveBar = () => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const randomDuration = 400 + Math.random() * 800; 
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 2.5, duration: randomDuration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1, duration: randomDuration, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
            ])
        ).start();
    }, []);

    // Renk animasyonu native driver desteklemez, o yüzden ayrı tutuyoruz ama scale'i native yapıyoruz.
    // Basitlik için burada sabit renk verebiliriz veya opacity ile oynayabiliriz.
    
    return (
        <View style={styles.barContainer}>
            <Animated.View 
                style={[
                    styles.waveBar, 
                    { 
                        transform: [{ scaleY: scaleAnim }],
                        backgroundColor: '#4A90E2'
                    }
                ]} 
            />
        </View>
    );
};

const styles = StyleSheet.create({
    // Çubukları ortalamak için kapsayıcı
    barContainer: {
        height: 60, // Maksimum yükseklik alanı
        justifyContent: 'center', // DİKEY ORTALAMA (Kilit nokta burası)
        alignItems: 'center',
        marginHorizontal: 2,
    },
    waveBar: { 
        width: 6, 
        height: 15, // Başlangıç kısalığı
        borderRadius: 3, 
        backgroundColor: '#4A90E2',
    },
    miniWaveBar: { 
        width: 3, 
        backgroundColor: '#A03333', 
        borderRadius: 1.5,
        // Height prop'tan gelecek
    },
});