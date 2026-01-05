// src/components/dashboard/Visualizer.js

import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { FontAwesome5, Ionicons, Entypo, Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import styles from '../../styles/AppStyles';
import { PlaybackWaveBar, AnimatedWaveBar } from '../WaveBars';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const Visualizer = ({ 
    isRecording, isPaused, duration, metering, selectedFile, 
    playingId, isPlaying, playSound, trashScale, trashTranslateY, trashOpacity,
    handleBackPress, isEditingName, newFileName, setNewFileName, 
    handleSaveRename, startRenaming, shareFile, 
    flags = [], 
    fontScale = 1
}) => {
    
    const { t } = useTranslation();
    const scrollViewRef = useRef();

    // Trigger animation when flags change
    useEffect(() => {
        if (flags.length > 0) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
    }, [flags]);

    const normalizeWave = (db) => {
        const minDb = -80; const maxHeight = 35; 
        if (db < minDb) return 5; 
        let height = ((db - minDb) / (0 - minDb)) * maxHeight;
        return Math.max(5, height);
    };

    // Helper to check if a bar index corresponds to a flag
    const getFlagForIndex = (index) => {
        // Each bar represents approx 75ms (0.075s)
        const barTime = index * 0.075;
        // Tolerance window
        return flags.find(f => Math.abs(f - barTime) < 0.05);
    };

    const dynamicSize = (size) => ({ fontSize: size * fontScale });

    return (
        <View style={styles.waveContainer}>
            {/* RECORDING ACTIVE */}
            {isRecording || isPaused ? (
                 <Animated.View 
                    style={[
                        styles.activeRecordingContainer,
                        {
                            transform: [{ scale: trashScale }, { translateY: trashTranslateY }],
                            opacity: trashOpacity
                        }
                    ]}
                 >
                     <Text style={[styles.timerText, dynamicSize(18)]}>{duration}</Text>
                     
                     {/* WAVEFORM SCROLLVIEW */}
                     <View style={{ height: 120, width: '100%' }}> 
                         <ScrollView 
                            ref={scrollViewRef} 
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                            // PaddingRight: Keeps active head visible
                            // PaddingBottom: Increased to 30 to give space for the hanging flags
                            // PaddingBottom: Sarkan bayraklara yer açmak için 30'a çıkarıldı
                            contentContainerStyle={{ alignItems: 'flex-end', paddingHorizontal: 10, paddingBottom: 30, paddingRight: 60 }}
                         >
                            {metering.map((db, index) => {
                                const hasFlag = getFlagForIndex(index);
                                return (
                                    <View key={index} style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', width: 6, marginHorizontal: 1, position: 'relative' }}>
                                        {/* Wave Bar */}
                                        <PlaybackWaveBar height={normalizeWave(db)} isPlaying={!isPaused} />
                                        
                                        {/* --- ABSOLUTE FLAG CONTAINER --- */}
                                        {/* Using absolute position to prevent squeezing the icon inside the 6px width */}
                                        {/* 6px genişliğin içinde ikonun sıkışmasını önlemek için absolute pozisyon kullanılıyor */}
                                        {hasFlag && (
                                            <View style={{ 
                                                position: 'absolute', 
                                                bottom: -22, // Push below the bar / Çubuğun altına it
                                                width: 20,   // Give it full width needed / İhtiyaç duyulan tam genişliği ver
                                                left: -7,    // Center relative to the 6px bar ((6 - 20) / 2 = -7) / 6px çubuğa göre ortala
                                                alignItems: 'center',
                                                zIndex: 10
                                            }}>
                                                <Ionicons name="flag" size={18} color="#F5A623" />
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                         </ScrollView>
                     </View>
                 </Animated.View>
            ) 
            /* FILE PREVIEW */
            : selectedFile ? (
                <View style={styles.filePreviewCard}>
                    <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#A0A0A0" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleBackPress} style={styles.closeButton}>
                        <Ionicons name="close" size={20} color="#FF4B4B" />
                    </TouchableOpacity>
                    
                    <View style={styles.previewContent}>
                        <TouchableOpacity style={styles.iconContainer} onPress={() => playSound(selectedFile.uri, 'preview')}>
                             <FontAwesome5 name={(playingId === 'preview' && isPlaying) ? "pause" : "play"} size={24} color="#FF4B4B" />
                        </TouchableOpacity>
    
                        <View style={styles.fileInfo}>
                            <View style={styles.fileNameContainer}>
                                {isEditingName ? (
                                    <TextInput 
                                        style={[styles.renameInput, dynamicSize(16)]} value={newFileName} onChangeText={setNewFileName}
                                        autoFocus={true} onBlur={handleSaveRename} onSubmitEditing={handleSaveRename} returnKeyType="done"
                                    />
                                ) : (
                                    <TouchableOpacity onPress={startRenaming} style={{flexDirection:'row', alignItems:'center'}}>
                                        <Text style={[styles.fileName, dynamicSize(16)]} numberOfLines={1}>{selectedFile.name}</Text>
                                        <Feather name="edit-2" size={14} color="#777" style={styles.editIcon} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <Text style={[styles.fileStatus, dynamicSize(12)]}>{(playingId === 'preview' && isPlaying) ? t('processing') : t('alert_ready')}</Text>
                            
                            {/* PREVIEW WAVEFORM */}
                            {metering.length > 0 && (
                                <View style={styles.miniWaveformContainer}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
                                        {metering.map((db, index) => (
                                            <PlaybackWaveBar key={index} height={normalizeWave(db) * 0.8} isPlaying={playingId === 'preview' && isPlaying} />
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity onPress={shareFile} style={styles.shareBtn}>
                            <Entypo name="share" size={22} color="#A0A0A0" />
                        </TouchableOpacity>
                    </View>
                </View>
            ) 
            /* IDLE STATE */
            : (
                <View style={styles.idleWaveContainer}>
                    {[...Array(5)].map((_, index) => (<AnimatedWaveBar key={index} />))}
                </View>
            )}
        </View>
    );
};