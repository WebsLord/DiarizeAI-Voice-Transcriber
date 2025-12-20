import React, { useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Animated } from 'react-native';
import { FontAwesome5, Ionicons, Entypo, Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import styles from '../../styles/AppStyles';
import { PlaybackWaveBar, AnimatedWaveBar } from '../WaveBars';

export const Visualizer = ({ 
    isRecording, isPaused, duration, metering, selectedFile, 
    playingId, isPlaying, playSound, trashScale, trashTranslateY, trashOpacity,
    handleBackPress, isEditingName, newFileName, setNewFileName, 
    handleSaveRename, startRenaming, shareFile 
}) => {
    
    const { t } = useTranslation();
    const scrollViewRef = useRef();

    // Helper for wave height calculation
    // Dalga yüksekliği hesaplaması için yardımcı
    const normalizeWave = (db) => {
        const minDb = -80; const maxHeight = 35; 
        if (db < minDb) return 5; 
        let height = ((db - minDb) / (0 - minDb)) * maxHeight;
        return Math.max(5, height);
    };

    return (
        <View style={styles.waveContainer}>
            {/* CASE A: RECORDING ACTIVE */}
            {/* DURUM A: KAYIT AKTİF */}
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
                     <Text style={styles.timerText}>{duration}</Text>
                     <View style={{ height: 60, width: '100%' }}>
                         <ScrollView 
                            ref={scrollViewRef} 
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                            contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 10 }}
                         >
                            {metering.map((db, index) => (
                                <PlaybackWaveBar key={index} height={normalizeWave(db)} isPlaying={!isPaused} />
                            ))}
                         </ScrollView>
                     </View>
                 </Animated.View>
            ) 
            /* CASE B: FILE PREVIEW */
            /* DURUM B: DOSYA ÖNİZLEME */
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
                                        style={styles.renameInput} value={newFileName} onChangeText={setNewFileName}
                                        autoFocus={true} onBlur={handleSaveRename} onSubmitEditing={handleSaveRename} returnKeyType="done"
                                    />
                                ) : (
                                    <TouchableOpacity onPress={startRenaming} style={{flexDirection:'row', alignItems:'center'}}>
                                        <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                                        <Feather name="edit-2" size={14} color="#777" style={styles.editIcon} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            {/* STATUS TEXT TRANSLATED */}
                            {/* DURUM METNİ ÇEVRİLDİ */}
                            <Text style={styles.fileStatus}>{(playingId === 'preview' && isPlaying) ? t('processing') : t('alert_ready')}</Text>
                            
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
            /* CASE C: IDLE STATE */
            /* DURUM C: BOŞTA DURUMU */
            : (
                <View style={styles.idleWaveContainer}>
                    {[...Array(5)].map((_, index) => (<AnimatedWaveBar key={index} />))}
                </View>
            )}
        </View>
    );
};