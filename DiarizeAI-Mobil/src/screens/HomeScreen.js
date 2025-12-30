// src/screens/HomeScreen.js

import 'react-native-get-random-values';
import '../services/i18n'; 

import React, { useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, TouchableOpacity, SafeAreaView, Alert, Modal, Text, Animated, ActivityIndicator } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next'; 

// --- API SERVICE ---
import { apiService } from '../services/api'; 
import { removeToken } from '../../api/storage';

import styles from '../styles/AppStyles';       
import { useAudioLogic } from '../hooks/useAudioLogic'; 
import { useTheme } from '../hooks/useTheme'; 

import { Header } from '../components/dashboard/Header';
import { Visualizer } from '../components/dashboard/Visualizer';
import { Controls } from '../components/dashboard/Controls';

import { RecordsModal } from '../components/RecordsModal';
import { AnalysisModal } from '../components/AnalysisModal';
import { SettingsModal } from '../components/SettingsModal';

export default function HomeScreen({ navigation }) {
  
  const { t } = useTranslation();
  const { fontScale, changeFontScale } = useTheme();

  const {
      selectedFile, isRecording, isPaused, duration, metering,
      isPlaying, playingId, savedRecordings,
      startRecording, stopRecording, pauseRecording, resumeRecording, discardRecording,
      playSound, stopSound, saveRecordingToDevice, deleteRecording, clearAllRecordings,
      // DÜZELTME BURADA: 'shareFileUri' Geri Eklendi!
      pickFile, loadFromLibrary, clearSelection, shareFile, shareFileUri, renameRecording
  } = useAudioLogic();

  // UI States
  const [isMenuVisible, setIsMenuVisible] = useState(false); 
  const [isRecordsVisible, setIsRecordsVisible] = useState(false); 
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isAnalysisVisible, setIsAnalysisVisible] = useState(false);
  
  // Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Rename States
  const [isEditingName, setIsEditingName] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  // Animation Values
  const trashScale = useRef(new Animated.Value(1)).current;
  const trashTranslateY = useRef(new Animated.Value(0)).current;
  const trashOpacity = useRef(new Animated.Value(1)).current;

  // --- HANDLERS ---
  
  const handleRecordPress = () => { startRecording(); }; 
  
  // --- PROCESS FONKSİYONU ---
  const handleProcessPress = async () => {
    if (!selectedFile || !selectedFile.uri) {
        Alert.alert("Eksik Dosya", "Lütfen önce ses kaydedin veya seçin.");
        return;
    }

    try {
        setIsProcessing(true);
        setStatusMessage("Dosya sunucuya yükleniyor...");

        console.log("1. Yükleme başladı:", selectedFile.uri);
        
        // ADIM 1: YÜKLE
        const uploadResult = await apiService.uploadAudio(selectedFile.uri);
        const jobId = uploadResult.id; 
        console.log("✅ Dosya yüklendi. Job ID:", jobId);

        // ADIM 2: ANALİZİ BAŞLAT
        setStatusMessage("Analiz başlatılıyor...");
        await apiService.startProcessing(jobId);

        // ADIM 3: SONUCU BEKLE
        setStatusMessage("Yapay Zeka düşünüyor...");
        const finalResult = await apiService.pollUntilComplete(jobId);
        
        console.log("🎉 İŞLEM TAMAM:", finalResult);
        setStatusMessage("Tamamlandı!");
        
        Alert.alert("Başarılı", "Analiz tamamlandı!");
        
        navigation.navigate('ResultScreen', { data: finalResult });

    } catch (error) {
        console.error("Süreç Hatası:", error);
        setStatusMessage("Hata oluştu.");
        Alert.alert("Hata", "İşlem başarısız: " + (error.message || "Bilinmeyen hata"));
    } finally {
        setIsProcessing(false);
        setTimeout(() => setStatusMessage(""), 3000);
    }
  };

  const handleLogout = async () => {
      await removeToken();
      setIsMenuVisible(false);
      navigation.replace('Login');
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
          selectedFile={selectedFile} 
          isRecording={isRecording} 
          isPaused={isPaused} 
          isProcessing={isProcessing} 
          pickFile={pickFile} 
          saveRecordingToDevice={saveRecordingToDevice} 
          handleProcessPress={handleProcessPress}
          handleTrashPress={handleTrashPress} 
          resumeRecording={resumeRecording} 
          pauseRecording={pauseRecording}
          stopRecording={stopRecording} 
          handleRecordPress={handleRecordPress}
          fontScale={fontScale}
      />

      {/* DURUM ÇUBUĞU */}
      {isProcessing && (
        <View style={{ position: 'absolute', bottom: 100, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.8)', padding: 15, borderRadius: 10, flexDirection: 'row', alignItems: 'center', zIndex: 999 }}>
            <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 10 }} />
            <Text style={{ color: 'white', fontWeight: 'bold' }}>{statusMessage}</Text>
        </View>
      )}

      {/* 4. MENUS & MODALS */}
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

                  <TouchableOpacity style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: '#333', marginTop: 10 }]} onPress={handleLogout}>
                      <MaterialIcons name="logout" size={24} color="#E14D4D" />
                      <Text style={[styles.menuItemText, { color: '#E14D4D' }]}>{t('logout')}</Text>
                  </TouchableOpacity>
              </View>
          </TouchableOpacity>
      </Modal>

      <RecordsModal 
        visible={isRecordsVisible} 
        onClose={() => { stopSound(); setIsRecordsVisible(false); }}
        recordings={savedRecordings} 
        onLoad={(item) => {
            loadFromLibrary(item);
            setIsRecordsVisible(false);
        }}
        onDelete={deleteRecording}
        onPlay={playSound} 
        onShare={shareFileUri} // Artık hata vermeyecek
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