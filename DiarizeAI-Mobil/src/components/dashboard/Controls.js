// src/components/dashboard/Controls.js

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import styles from '../../styles/AppStyles';
import { PulsingGlowButton } from '../PulsingButton';

// Added fontScale and onSettingsPress props
// fontScale ve onSettingsPress özellikleri eklendi
export const Controls = ({ 
    selectedFile, isRecording, isPaused, isProcessing,
    pickFile, saveRecordingToDevice, handleProcessPress,
    handleTrashPress, resumeRecording, pauseRecording, stopRecording, handleRecordPress,
    onSettingsPress, // NEW PROP / YENİ ÖZELLİK
    fontScale = 1
}) => {
    
    const { t } = useTranslation();

    // Helper for dynamic font size
    // Dinamik yazı boyutu için yardımcı
    const dynamicSize = (size) => ({ fontSize: size * fontScale });

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
                    
                    {/* 1. SAVE LOCAL BUTTON */}
                    <TouchableOpacity style={[styles.actionButton, {backgroundColor: '#333', paddingHorizontal: 15}]} onPress={saveRecordingToDevice}>
                        <FontAwesome5 name="save" size={20} color="#A0A0A0" />
                    </TouchableOpacity>

                    {/* 2. SETTINGS BUTTON (NEW) */}
                    {/* AYARLAR BUTONU (YENİ) */}
                    <TouchableOpacity 
                        style={[styles.actionButton, {backgroundColor: '#333', paddingHorizontal: 15}]} 
                        onPress={onSettingsPress}
                    >
                        <Ionicons name="options" size={24} color="#4A90E2" />
                    </TouchableOpacity>
    
                    {/* 3. PROCESS BUTTON (Fixed Alignment) */}
                    {/* DÜZELTME: justifyContent: 'center' eklendi */}
                    <TouchableOpacity 
                        style={[
                            styles.actionButton, 
                            styles.sendButton, 
                            isProcessing && {opacity: 0.7}, 
                            { flex: 1, justifyContent: 'center' } // Center content explicitly / İçeriği ortala
                        ]} 
                        onPress={handleProcessPress}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                            <FontAwesome5 name="paper-plane" size={20} color="white" />
                        )}
                        <Text style={[styles.uploadText, {color: 'white', marginLeft: 8}, dynamicSize(16)]}>
                            {isProcessing ? t('processing') : t('process')}
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