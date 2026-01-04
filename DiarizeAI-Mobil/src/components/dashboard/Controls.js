// src/components/dashboard/Controls.js

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import styles from '../../styles/AppStyles';
import { PulsingGlowButton } from '../PulsingButton';

// Added fontScale, onSettingsPress and isFileSaved props
// fontScale, onSettingsPress ve isFileSaved özellikleri eklendi
export const Controls = ({ 
    selectedFile, isRecording, isPaused, isProcessing,
    pickFile, saveRecordingToDevice, handleProcessPress,
    handleTrashPress, resumeRecording, pauseRecording, stopRecording, handleRecordPress,
    onSettingsPress, // NEW PROP / YENİ ÖZELLİK
    isFileSaved,     // NEW PROP: Check if file is saved locally / YENİ: Dosyanın yerelde kayıtlı olup olmadığını kontrol et
    fontScale = 1
}) => {
    
    const { t } = useTranslation();

    // Helper for dynamic font size
    // Dinamik yazı boyutu için yardımcı
    const dynamicSize = (size) => ({ fontSize: size * fontScale });

    // --- ANIMATION FOR SAVE BUTTON (Pulse Effect) ---
    // --- KAYDET BUTONU İÇİN ANİMASYON (Nabız Efekti) ---
    const saveOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // If file is selected BUT not saved, and not recording -> Pulse animation
        // Dosya seçiliyse AMA kaydedilmediyse ve kayıt yapılmıyorsa -> Nabız animasyonu
        if (selectedFile && !isFileSaved && !isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(saveOpacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
                    Animated.timing(saveOpacity, { toValue: 1, duration: 800, useNativeDriver: true })
                ])
            ).start();
        } else {
            // Stop animation and reset
            // Animasyonu durdur ve sıfırla
            saveOpacity.setValue(1); 
        }
    }, [selectedFile, isFileSaved, isRecording]);

    return (
        <View style={styles.controlsContainer}>
            {/* UPLOAD BUTTON */}
            {/* YÜKLEME BUTONU */}
            {!selectedFile && !isRecording && !isPaused ? (
                <TouchableOpacity style={styles.uploadButton} onPress={pickFile}>
                    <FontAwesome5 name="cloud-upload-alt" size={24} color="#A0A0A0" />
                    <Text style={[styles.uploadText, dynamicSize(16)]}>{t('select_audio')}</Text>
                </TouchableOpacity>
            ) : null}
            
            {/* ACTION BUTTONS */}
            {/* İŞLEM BUTONLARI */}
            {selectedFile && !isRecording && (
                <View style={{flexDirection: 'row', gap: 10, alignItems: 'center'}}>
                    
                    {/* 1. SAVE LOCAL BUTTON (Animated) */}
                    {/* 1. YEREL KAYDET BUTONU (Animasyonlu) */}
                    <Animated.View style={{ opacity: isFileSaved ? 1 : saveOpacity }}>
                        <TouchableOpacity 
                            style={[
                                styles.actionButton, 
                                { 
                                    // If saved: Standard Grey. If NOT saved: Greenish hint to encourage saving.
                                    // Kaydedildiyse: Standart Gri. Kaydedilmediyse: Kaydetmeye teşvik için yeşilimsi.
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

                    {/* 2. SETTINGS BUTTON (NEW) */}
                    {/* AYARLAR BUTONU (YENİ) */}
                    <TouchableOpacity 
                        style={[styles.actionButton, {backgroundColor: '#333', paddingHorizontal: 15}]} 
                        onPress={onSettingsPress}
                    >
                        <Ionicons name="options" size={24} color="#4A90E2" />
                    </TouchableOpacity>
    
                    {/* 3. PROCESS BUTTON (Blocked if not saved) */}
                    {/* 3. İŞLE BUTONU (Kaydedilmediyse engellenir) */}
                    <TouchableOpacity 
                        style={[
                            styles.actionButton, 
                            styles.sendButton, 
                            // Opacity logic: Processing OR Not Saved
                            // Opaklık mantığı: İşleniyor VEYA Kaydedilmedi
                            (isProcessing || !isFileSaved) && {
                                opacity: 0.6,
                                backgroundColor: !isFileSaved ? '#552222' : '#4A90E2' // Red hint if locked / Kilitliyse kırmızı ipucu
                            }, 
                            { flex: 1, justifyContent: 'center' } // Center content explicitly / İçeriği ortala
                        ]} 
                        onPress={handleProcessPress}
                        disabled={isProcessing || !isFileSaved} // DISABLE IF NOT SAVED / KAYDEDİLMEDİYSE DEVRE DIŞI BIRAK
                    >
                        {isProcessing ? (
                            <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                            <FontAwesome5 name={!isFileSaved ? "lock" : "paper-plane"} size={20} color="white" />
                        )}
                        <Text style={[styles.uploadText, {color: 'white', marginLeft: 8}, dynamicSize(16)]}>
                            {!isFileSaved ? "Önce Kaydet" : (isProcessing ? t('processing') : t('process'))}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
    
            {/* RECORDING CONTROLS */}
            {/* KAYIT KONTROLLERİ */}
            {(isRecording || isPaused) ? (
                <View style={styles.recordingControls}>
                    <TouchableOpacity style={styles.smallControlBtn} onPress={handleTrashPress}>
                        <Ionicons name="trash-outline" size={24} color="#FF4B4B" />
                    </TouchableOpacity>
    
                    <TouchableOpacity style={[styles.smallControlBtn, {width: 60, height: 60, borderRadius: 30, backgroundColor: '#4A90E2', borderColor: '#4A90E2'}]} 
                        onPress={isPaused ? resumeRecording : pauseRecording}>
                        <FontAwesome5 name={isPaused ? "play" : "pause"} size={24} color="white" />
                    </TouchableOpacity>
    
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