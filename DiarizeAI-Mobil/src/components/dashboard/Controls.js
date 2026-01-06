// src/components/dashboard/Controls.js

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import styles from '../../styles/AppStyles';
import { PulsingGlowButton } from '../PulsingButton';

// Added fontScale, onSettingsPress, isFileSaved and handleAddFlag props
// fontScale, onSettingsPress, isFileSaved ve handleAddFlag özellikleri eklendi
export const Controls = ({ 
    selectedFile, isRecording, isPaused, isProcessing,
    pickFile, saveRecordingToDevice, handleProcessPress,
    handleTrashPress, resumeRecording, pauseRecording, stopRecording, handleRecordPress,
    onSettingsPress, 
    isFileSaved,     
    handleAddFlag,   
    fontScale = 1
}) => {
    
    const { t } = useTranslation();

    // Helper for dynamic font size
    // Dinamik yazı boyutu için yardımcı
    const dynamicSize = (size) => ({ fontSize: size * fontScale });

    // --- ANIMATION REFS ---
    const saveOpacity = useRef(new Animated.Value(1)).current;
    const flagScale = useRef(new Animated.Value(1)).current; // For Flag Button Animation

    // --- SAVE BUTTON PULSE LOGIC ---
    useEffect(() => {
        if (selectedFile && !isFileSaved && !isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(saveOpacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
                    Animated.timing(saveOpacity, { toValue: 1, duration: 800, useNativeDriver: true })
                ])
            ).start();
        } else {
            saveOpacity.setValue(1); 
        }
    }, [selectedFile, isFileSaved, isRecording]);

    // --- FLAG BUTTON HANDLER WITH ANIMATION ---
    // --- ANİMASYONLU BAYRAK BUTONU İŞLEYİCİSİ ---
    const onFlagPress = () => {
        // 1. Play Animation (Snappy Bounce)
        // 1. Animasyonu Oynat (Hızlı Sıçrama)
        flagScale.setValue(0.8); // Start smaller / Daha küçük başla
        Animated.spring(flagScale, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true
        }).start();

        // 2. Call original function (Logic handles debounce)
        // 2. Orijinal fonksiyonu çağır (Mantık debounce işlemini halleder)
        if (handleAddFlag) handleAddFlag();
    };

    return (
        <View style={styles.controlsContainer}>
            {/* UPLOAD BUTTON */}
            {!selectedFile && !isRecording && !isPaused ? (
                <TouchableOpacity style={styles.uploadButton} onPress={pickFile}>
                    <FontAwesome5 name="cloud-upload-alt" size={24} color="#A0A0A0" />
                    <Text style={[styles.uploadText, dynamicSize(16)]}>{t('select_audio')}</Text>
                </TouchableOpacity>
            ) : null}
            
            {/* ACTION BUTTONS */}
            {selectedFile && !isRecording && (
                <View style={{flexDirection: 'row', gap: 10, alignItems: 'center'}}>
                    
                    {/* SAVE LOCAL BUTTON */}
                    <Animated.View style={{ opacity: isFileSaved ? 1 : saveOpacity }}>
                        <TouchableOpacity 
                            style={[
                                styles.actionButton, 
                                { 
                                    backgroundColor: isFileSaved ? '#333' : '#1E3A2F', 
                                    borderColor: isFileSaved ? 'transparent' : '#50E3C2',
                                    borderWidth: isFileSaved ? 0 : 2,
                                    paddingHorizontal: 15 
                                }
                            ]} 
                            onPress={saveRecordingToDevice}
                        >
                            <FontAwesome5 
                                name="save" 
                                size={20} 
                                color={isFileSaved ? "#A0A0A0" : "#50E3C2"} 
                            />
                        </TouchableOpacity>
                    </Animated.View>

                    {/* SETTINGS BUTTON */}
                    <TouchableOpacity 
                        style={[styles.actionButton, {backgroundColor: '#333', paddingHorizontal: 15}]} 
                        onPress={onSettingsPress}
                    >
                        <Ionicons name="options" size={24} color="#4A90E2" />
                    </TouchableOpacity>
    
                    {/* PROCESS BUTTON */}
                    <TouchableOpacity 
                        style={[
                            styles.actionButton, 
                            styles.sendButton, 
                            (isProcessing || !isFileSaved) && {
                                opacity: 0.6,
                                backgroundColor: !isFileSaved ? '#552222' : '#4A90E2' 
                            }, 
                            { flex: 1, justifyContent: 'center' }
                        ]} 
                        onPress={handleProcessPress}
                        disabled={isProcessing || !isFileSaved} 
                    >
                        {isProcessing ? (
                            <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                            <FontAwesome5 name={!isFileSaved ? "lock" : "paper-plane"} size={20} color="white" />
                        )}
                        <Text style={[styles.uploadText, {color: 'white', marginLeft: 8}, dynamicSize(16)]}>
                            {!isFileSaved ? t('save_first') : (isProcessing ? t('processing') : t('process'))}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
    
            {/* RECORDING / PLAYBACK CONTROLS */}
            {(isRecording || isPaused) ? (
                <View style={styles.recordingControls}>
                    {/* Trash Button */}
                    <TouchableOpacity style={styles.smallControlBtn} onPress={handleTrashPress}>
                        <Ionicons name="trash-outline" size={24} color="#FF4B4B" />
                    </TouchableOpacity>
    
                    {/* --- FLAG BUTTON (ANIMATED) --- */}
                    {/* --- BAYRAK BUTONU (ANİMASYONLU) --- */}
                    <Animated.View style={{ transform: [{ scale: flagScale }] }}>
                        <TouchableOpacity 
                            style={[styles.smallControlBtn, { borderColor: '#F5A623', borderWidth: 2 }]} 
                            onPress={onFlagPress}
                            activeOpacity={0.7}
                        >
                            <FontAwesome5 name="flag" size={20} color="#F5A623" solid />
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Play/Pause Button */}
                    <TouchableOpacity style={[styles.smallControlBtn, {width: 60, height: 60, borderRadius: 30, backgroundColor: '#4A90E2', borderColor: '#4A90E2'}]} 
                        onPress={isPaused ? resumeRecording : pauseRecording}>
                        <FontAwesome5 name={isPaused ? "play" : "pause"} size={24} color="white" />
                    </TouchableOpacity>
    
                    {/* Stop Button */}
                    <TouchableOpacity onPress={stopRecording}>
                        <PulsingGlowButton onPress={stopRecording} isRecording={true} />
                    </TouchableOpacity>
                </View>
            ) : !selectedFile ? (
                <>
                    <PulsingGlowButton onPress={handleRecordPress} isRecording={false} />
                    <Text style={[styles.recordLabel, dynamicSize(14)]}>{t('tap_to_record')}</Text>
                </>
            ) : null}
        </View>
    );
};