// src/components/SmartPlayer.js

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';

export default function SmartPlayer({ audioUri, initialPosition = 0, onPlaybackStatusUpdate }) {
    const [sound, setSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [position, setPosition] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Format time (00:00)
    const formatTime = (millis) => {
        if (!millis) return "0:00";
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    useEffect(() => {
        loadAudio();
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [audioUri]);

    const loadAudio = async () => {
        try {
            setIsLoading(true);
            const { sound: newSound, status } = await Audio.Sound.createAsync(
                { uri: audioUri },
                { shouldPlay: false },
                onPlaybackStatusUpdateInternal
            );
            setSound(newSound);
            setDuration(status.durationMillis);
            setIsLoading(false);
        } catch (error) {
            console.error("Audio Load Error:", error);
            setIsLoading(false);
        }
    };

    const onPlaybackStatusUpdateInternal = (status) => {
        if (status.isLoaded) {
            setPosition(status.positionMillis);
            setDuration(status.durationMillis);
            setIsPlaying(status.isPlaying);
            if (status.didJustFinish) {
                setIsPlaying(false);
                // Reset to start if needed
                // status.positionMillis = 0; 
            }
            // Parent component'e bilgi ver (Karaoke vurgusu için)
            if (onPlaybackStatusUpdate) {
                onPlaybackStatusUpdate(status.positionMillis);
            }
        }
    };

    const handlePlayPause = async () => {
        if (!sound) return;
        if (isPlaying) {
            await sound.pauseAsync();
        } else {
            await sound.playAsync();
        }
    };

    const handleSeek = async (value) => {
        if (sound) {
            await sound.setPositionAsync(value);
        }
    };

    // Dışarıdan kontrol için (Metne tıklayınca buraya zıpla)
    useEffect(() => {
        if (sound && initialPosition > 0) {
            sound.setPositionAsync(initialPosition);
            sound.playAsync(); // Tıklayınca direkt oynatsın
        }
    }, [initialPosition]);

    return (
        <View style={styles.container}>
            {isLoading ? (
                <ActivityIndicator color="#4A90E2" />
            ) : (
                <>
                    <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
                        <Ionicons 
                            name={isPlaying ? "pause-circle" : "play-circle"} 
                            size={50} 
                            color="#4A90E2" 
                        />
                    </TouchableOpacity>

                    <View style={styles.sliderContainer}>
                        <Slider
                            style={{ width: '100%', height: 40 }}
                            minimumValue={0}
                            maximumValue={duration}
                            value={position}
                            onSlidingComplete={handleSeek}
                            minimumTrackTintColor="#4A90E2"
                            maximumTrackTintColor="#555"
                            thumbTintColor="#FFF"
                        />
                        <View style={styles.timeContainer}>
                            <Text style={styles.timeText}>{formatTime(position)}</Text>
                            <Text style={styles.timeText}>{formatTime(duration)}</Text>
                        </View>
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333'
    },
    playButton: {
        marginRight: 15
    },
    sliderContainer: {
        flex: 1,
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 5,
        marginTop: -5
    },
    timeText: {
        color: '#888',
        fontSize: 12
    }
});