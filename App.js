// Fix for encryption random number generation (Must be at the top)
// Şifreleme için rastgele sayı üretimi düzeltmesi (En üstte olmalı)
import 'react-native-get-random-values';

// Initialize i18n
// i18n Başlat
import './src/services/i18n'; 

import React, { useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, TouchableOpacity, SafeAreaView, Alert, Modal, Text, Animated } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next'; 

// --- CUSTOM MODULES ---
import styles from './src/styles/AppStyles';       
import { useAudioLogic } from './src/hooks/useAudioLogic'; 
// Import Theme Hook
// Tema Kancasını İçe Aktar
import { useTheme } from './src/hooks/useTheme'; 

// --- SUB-COMPONENTS (Refactored) ---
import { Header } from './src/components/dashboard/Header';
import { Visualizer } from './src/components/dashboard/Visualizer';
import { Controls } from './src/components/dashboard/Controls';

// --- MODALS ---
import { RecordsModal } from './src/components/RecordsModal';
import { AnalysisModal } from './src/components/AnalysisModal';
import { SettingsModal } from './src/components/SettingsModal';

export default function App() {
  
  const { t } = useTranslation();
  
  // Use Theme Hook
  // Tema Kancasını Kullan
  const { fontScale, changeFontScale } = useTheme();

  const {
      selectedFile, isRecording, isPaused, duration, metering,
      isPlaying, playingId, savedRecordings,
      startRecording, stopRecording, pauseRecording, resumeRecording, discardRecording,
      playSound, stopSound, saveRecordingToDevice, deleteRecording, clearAllRecordings,
      pickFile, loadFromLibrary, clearSelection, shareFile, shareFileUri, renameRecording
  } = useAudioLogic();

  // UI States
  const [isMenuVisible, setIsMenuVisible] = useState(false); 
  const [isRecordsVisible, setIsRecordsVisible] = useState(false); 
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isAnalysisVisible, setIsAnalysisVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Rename States
  const [isEditingName, setIsEditingName] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  // Animation Values
  const trashScale = useRef(new Animated.Value(1)).current;
  const trashTranslateY = useRef(new Animated.Value(0)).current;
  const trashOpacity = useRef(new Animated.Value(1)).current;

  // --- HANDLERS ---
  
  const handleRecordPress = () => { startRecording(); }; 
  
  const handleProcessPress = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    try {
        console.log("Attempting to upload to backend...");
        throw new Error("Backend not ready yet"); 
    } catch (error) {
        setTimeout(() => {
            setIsProcessing(false);
            setIsAnalysisVisible(true); 
            Alert.alert(t('alert_simulation'), t('alert_backend_down'));
        }, 2000);
    }
  };

  const handleTrashPress = () => {
      Animated.parallel([
          Animated.timing(trashScale, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(trashTranslateY, { toValue: 200, duration: 400, useNativeDriver: true }),
          Animated.timing(trashOpacity, { toValue: 0, duration: 400, useNativeDriver: true })
      ]).start(() => {
          discardRecording();
          setTimeout(() => {
              trashScale.setValue(1);
              trashTranslateY.setValue(0);
              trashOpacity.setValue(1);
          }, 500);
      });
  };

  const handleBackPress = () => {
      Alert.alert(
          t('alert_delete_title'), 
          t('alert_delete_msg'),
          [
              { text: t('btn_cancel'), style: "cancel" }, 
              { text: t('btn_yes'), style: "destructive", onPress: clearSelection }
          ]
      );
  };

  const handleSaveRename = () => {
      if (newFileName.length > 0) renameRecording(newFileName);
      setIsEditingName(false);
  };

  const startRenaming = () => {
      setNewFileName(selectedFile.name.replace('.m4a', '')); 
      setIsEditingName(true);
  };

  const handleListRename = (item) => {
      // Load file, close modal, and start renaming
      // Dosyayı yükle, modalı kapat ve yeniden adlandırmayı başlat
      loadFromLibrary(item);
      setIsRecordsVisible(false);
      setNewFileName(item.name.replace('.m4a', ''));
      setIsEditingName(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* 1. HEADER */}
      <Header onMenuPress={() => setIsMenuVisible(true)} fontScale={fontScale} />

      {/* 2. VISUALIZER */}
      <Visualizer 
          isRecording={isRecording} isPaused={isPaused} duration={duration}
          metering={metering} selectedFile={selectedFile}
          playingId={playingId} isPlaying={isPlaying} playSound={playSound}
          trashScale={trashScale} trashTranslateY={trashTranslateY} trashOpacity={trashOpacity}
          handleBackPress={handleBackPress}
          isEditingName={isEditingName} newFileName={newFileName} setNewFileName={setNewFileName}
          handleSaveRename={handleSaveRename} startRenaming={startRenaming} shareFile={shareFile}
          fontScale={fontScale}
      />

      {/* 3. CONTROLS */}
      <Controls 
          selectedFile={selectedFile} isRecording={isRecording} isPaused={isPaused} isProcessing={isProcessing}
          pickFile={pickFile} saveRecordingToDevice={saveRecordingToDevice} handleProcessPress={handleProcessPress}
          handleTrashPress={handleTrashPress} resumeRecording={resumeRecording} pauseRecording={pauseRecording}
          stopRecording={stopRecording} handleRecordPress={handleRecordPress}
          fontScale={fontScale}
      />

      {/* 4. MENUS & MODALS */}
      <Modal visible={isMenuVisible} transparent={true} animationType="fade" onRequestClose={() => setIsMenuVisible(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsMenuVisible(false)}>
              <View style={styles.menuContainer}>
                  {/* Dynamic text size helpers used in Header/Visualizer are applied here implicitly by styles or can be added */}
                  <Text style={styles.menuTitle}>{t('menu')}</Text>
                  
                  <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuVisible(false); setTimeout(() => setIsRecordsVisible(true), 300); }}>
                      <MaterialIcons name="library-music" size={24} color="#4A90E2" />
                      <Text style={styles.menuItemText}>{t('saved_recordings')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuVisible(false); setTimeout(() => setIsSettingsVisible(true), 300); }}>
                      <Ionicons name="settings-outline" size={24} color="#FFF" />
                      <Text style={styles.menuItemText}>{t('settings')}</Text>
                  </TouchableOpacity>
              </View>
          </TouchableOpacity>
      </Modal>

      <RecordsModal 
        visible={isRecordsVisible} 
        onClose={() => { stopSound(); setIsRecordsVisible(false); }}
        recordings={savedRecordings} 
        // FIX: Load AND Close Modal
        // DÜZELTME: Yükle VE Modalı Kapat
        onLoad={(item) => {
            loadFromLibrary(item);
            setIsRecordsVisible(false);
        }}
        onDelete={deleteRecording}
        onPlay={playSound} 
        onShare={shareFileUri} 
        onRename={handleListRename}
        playingId={playingId} 
        isPlaying={isPlaying}
        fontScale={fontScale}
      />

      <AnalysisModal visible={isAnalysisVisible} onClose={() => setIsAnalysisVisible(false)} />
      
      <SettingsModal 
        visible={isSettingsVisible} 
        onClose={() => setIsSettingsVisible(false)}
        recordings={savedRecordings}
        recordCount={savedRecordings.length}
        onClearAll={() => {
            clearAllRecordings();
            setIsSettingsVisible(false);
        }}
        fontScale={fontScale}
        onChangeFontScale={changeFontScale}
      />
    </SafeAreaView>
  );
}