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
// --- ÖZEL MODÜLLER ---
import styles from './src/styles/AppStyles';       
import { useAudioLogic } from './src/hooks/useAudioLogic'; 

// --- SUB-COMPONENTS (Refactored) ---
// --- ALT BİLEŞENLER (Yeniden Düzenlendi) ---
import { Header } from './src/components/dashboard/Header';
import { Visualizer } from './src/components/dashboard/Visualizer';
import { Controls } from './src/components/dashboard/Controls';

// --- MODALS ---
// --- MODALLAR ---
import { RecordsModal } from './src/components/RecordsModal';
import { AnalysisModal } from './src/components/AnalysisModal';
import { SettingsModal } from './src/components/SettingsModal';

export default function App() {
  
  const { t } = useTranslation();

  // Audio Logic Hook
  // Ses Mantığı Kancası
  const {
      selectedFile, isRecording, isPaused, duration, metering,
      isPlaying, playingId, savedRecordings,
      startRecording, stopRecording, pauseRecording, resumeRecording, discardRecording,
      playSound, stopSound, saveRecordingToDevice, deleteRecording, clearAllRecordings, // Added here / Buraya eklendi
      pickFile, loadFromLibrary, clearSelection, shareFile, shareFileUri, renameRecording
  } = useAudioLogic();

  // UI States
  // Arayüz Durumları
  const [isMenuVisible, setIsMenuVisible] = useState(false); 
  const [isRecordsVisible, setIsRecordsVisible] = useState(false); 
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isAnalysisVisible, setIsAnalysisVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Rename States
  // Yeniden Adlandırma Durumları
  const [isEditingName, setIsEditingName] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  // Animation Values
  // Animasyon Değerleri
  const trashScale = useRef(new Animated.Value(1)).current;
  const trashTranslateY = useRef(new Animated.Value(0)).current;
  const trashOpacity = useRef(new Animated.Value(1)).current;

  // --- HANDLERS ---
  // --- İŞLEYİCİLER ---
  
  const handleRecordPress = () => { startRecording(); }; 
  
  const handleProcessPress = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    try {
        console.log("Attempting to upload to backend...");
        // Simulation error for demo
        // Demo için simülasyon hatası
        throw new Error("Backend not ready yet"); 
    } catch (error) {
        console.log("Backend unavailable:", error.message);
        setTimeout(() => {
            setIsProcessing(false);
            setIsAnalysisVisible(true); 
            // Alert translation
            // Uyarı çevirisi
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
      loadFromLibrary(item);
      setIsRecordsVisible(false);
      setNewFileName(item.name.replace('.m4a', ''));
      setIsEditingName(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* 1. HEADER COMPONENT */}
      {/* 1. BAŞLIK BİLEŞENİ */}
      <Header onMenuPress={() => setIsMenuVisible(true)} />

      {/* 2. VISUALIZER COMPONENT */}
      {/* 2. GÖRSELLEŞTİRİCİ BİLEŞENİ */}
      <Visualizer 
          isRecording={isRecording} isPaused={isPaused} duration={duration}
          metering={metering} selectedFile={selectedFile}
          playingId={playingId} isPlaying={isPlaying} playSound={playSound}
          trashScale={trashScale} trashTranslateY={trashTranslateY} trashOpacity={trashOpacity}
          handleBackPress={handleBackPress}
          isEditingName={isEditingName} newFileName={newFileName} setNewFileName={setNewFileName}
          handleSaveRename={handleSaveRename} startRenaming={startRenaming} shareFile={shareFile}
      />

      {/* 3. CONTROLS COMPONENT */}
      {/* 3. KONTROLLER BİLEŞENİ */}
      <Controls 
          selectedFile={selectedFile} isRecording={isRecording} isPaused={isPaused} isProcessing={isProcessing}
          pickFile={pickFile} saveRecordingToDevice={saveRecordingToDevice} handleProcessPress={handleProcessPress}
          handleTrashPress={handleTrashPress} resumeRecording={resumeRecording} pauseRecording={pauseRecording}
          stopRecording={stopRecording} handleRecordPress={handleRecordPress}
      />

      {/* 4. MENUS & MODALS */}
      {/* 4. MENÜLER & MODALLAR */}
      <Modal visible={isMenuVisible} transparent={true} animationType="fade" onRequestClose={() => setIsMenuVisible(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsMenuVisible(false)}>
              <View style={styles.menuContainer}>
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
        visible={isRecordsVisible} onClose={() => { stopSound(); setIsRecordsVisible(false); }}
        recordings={savedRecordings} onLoad={loadFromLibrary} onDelete={deleteRecording}
        onPlay={playSound} onShare={shareFileUri} onRename={handleListRename}
        playingId={playingId} isPlaying={isPlaying}
      />

      <AnalysisModal visible={isAnalysisVisible} onClose={() => setIsAnalysisVisible(false)} />
      
      {/* UPDATED SETTINGS MODAL */}
      {/* GÜNCELLENMİŞ AYARLAR MODALI */}
      <SettingsModal 
        visible={isSettingsVisible} 
        onClose={() => setIsSettingsVisible(false)}
        recordings={savedRecordings} // Pass the list / Listeyi gönder
        recordCount={savedRecordings.length}
        onClearAll={() => {
            clearAllRecordings();
            setIsSettingsVisible(false);
        }}
      />

    </SafeAreaView>
  );
}