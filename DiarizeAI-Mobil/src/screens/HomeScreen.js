// src/screens/HomeScreen.js

import SideMenu from '../components/dashboard/SideMenu';

import 'react-native-get-random-values';
import '../services/i18n'; 

import React, { useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, TouchableOpacity, SafeAreaView, Alert, Modal, Text, Animated, ActivityIndicator, PanResponder, Dimensions } from 'react-native';
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

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.75; // Menü Genişliği

export default function HomeScreen({ navigation }) {
  
  const { t } = useTranslation();
  const { fontScale, changeFontScale } = useTheme();

  const {
      selectedFile, isRecording, isPaused, duration, metering,
      isPlaying, playingId, savedRecordings,
      startRecording, stopRecording, pauseRecording, resumeRecording, discardRecording,
      playSound, stopSound, saveRecordingToDevice, deleteRecording, clearAllRecordings,
      pickFile, loadFromLibrary, clearSelection, shareFile, shareFileUri, renameRecording
  } = useAudioLogic();

  // UI States
  const [isRecordsVisible, setIsRecordsVisible] = useState(false); 
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isAnalysisVisible, setIsAnalysisVisible] = useState(false);
  
  // Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Rename States
  const [isEditingName, setIsEditingName] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  // Animation Values (Çöp Kutusu için)
  const trashScale = useRef(new Animated.Value(1)).current;
  const trashTranslateY = useRef(new Animated.Value(0)).current;
  const trashOpacity = useRef(new Animated.Value(1)).current;

  // ---------------------------------------------------------
  // MENÜ ANİMASYON MANTIĞI (INTERACTIVE SWIPE)
  // ---------------------------------------------------------
  
  // Menü ekranın sağında (width konumunda) başlar.
  // Açıldıkça (width - MENU_WIDTH) konumuna gelir.
  const menuAnim = useRef(new Animated.Value(width)).current;
  const isMenuOpen = useRef(false);

  // Menüyü kod ile açıp kapatmak için
  const toggleMenu = (shouldOpen) => {
      const toValue = shouldOpen ? width - MENU_WIDTH : width;
      
      Animated.spring(menuAnim, {
          toValue,
          useNativeDriver: false, // Layout değişimi için false
          friction: 8,
          tension: 40
      }).start(() => {
          isMenuOpen.current = shouldOpen;
      });
  };

  const menuPanResponder = useRef(
    PanResponder.create({
        // Dokunma başladığında PanResponder devreye girsin mi?
        onMoveShouldSetPanResponder: (evt, gestureState) => {
            const { dx } = gestureState;
            const { pageX } = evt.nativeEvent;

            // Durum 1: Menü KAPALI iken, ekranın SAĞ kenarından (son 40px) SOLA çekilirse
            if (!isMenuOpen.current) {
                return pageX > width - 40 && dx < -10;
            }
            // Durum 2: Menü AÇIK iken, SAĞA doğru çekilirse (kapatmak için)
            if (isMenuOpen.current) {
                return dx > 10;
            }
            return false;
        },
        // Sürükleme anında animasyonu güncelle (Real-time follow)
        onPanResponderMove: (evt, gestureState) => {
            let newX = width; 
            
            if (!isMenuOpen.current) {
                // Kapalıydı -> Açılıyor (Sola çekiliyor, dx negatif)
                newX = width + gestureState.dx;
            } else {
                // Açıktı -> Kapanıyor (Sağa çekiliyor, dx pozitif)
                newX = (width - MENU_WIDTH) + gestureState.dx;
            }

            // Sınırları belirle (Menü belirlenen alandan fazla çıkamaz)
            if (newX < width - MENU_WIDTH) newX = width - MENU_WIDTH; // En fazla tam açık konuma
            if (newX > width) newX = width; // En fazla tam kapalı konuma

            menuAnim.setValue(newX);
        },
        // Parmağı bıraktığında ne olsun?
        onPanResponderRelease: (evt, gestureState) => {
            const { dx, vx } = gestureState;
            const threshold = MENU_WIDTH / 3; // Menünün 3'te 1'i kadar çekildiyse tamamla

            if (!isMenuOpen.current) {
                // Açmaya çalışıyordu
                if (dx < -threshold || vx < -0.5) {
                    toggleMenu(true); // Aç
                } else {
                    toggleMenu(false); // Geri kapat
                }
            } else {
                // Kapatmaya çalışıyordu
                if (dx > threshold || vx > 0.5) {
                    toggleMenu(false); // Kapat
                } else {
                    toggleMenu(true); // Geri aç
                }
            }
        }
    })
  ).current;

  // --- HANDLERS (Artık hepsi burada) ---
  
  const handleRecordPress = () => { startRecording(); }; 
  
  const handleProcessPress = async () => {
    if (!selectedFile || !selectedFile.uri) {
        Alert.alert(t('alert_error'), "Lütfen önce ses kaydedin veya seçin.");
        return;
    }

    try {
        setIsProcessing(true);
        setStatusMessage(t('processing'));

        const uploadResult = await apiService.uploadAudio(selectedFile.uri);
        const jobId = uploadResult.id; 
        
        setStatusMessage(t('alert_sending'));
        await apiService.startProcessing(jobId);

        setStatusMessage("Yapay Zeka düşünüyor...");
        const finalResult = await apiService.pollUntilComplete(jobId);
        
        setStatusMessage(t('alert_success'));
        Alert.alert(t('alert_success'), "Analiz tamamlandı!");
        
        navigation.navigate('ResultScreen', { data: finalResult });

    } catch (error) {
        console.error("Süreç Hatası:", error);
        setStatusMessage(t('alert_error'));
        Alert.alert(t('alert_error'), "İşlem başarısız: " + (error.message || "Bilinmeyen hata"));
    } finally {
        setIsProcessing(false);
        setTimeout(() => setStatusMessage(""), 3000);
    }
  };

  const handleLogout = async () => {
      await removeToken();
      toggleMenu(false);
      navigation.replace('Login');
  };

  // Çöp kutusu animasyonu ve silme işlemi
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

  // Görselleştiricideki "X" tuşuna basınca
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
    // PanResponder'ı tüm ekrana yayıyoruz ki kenardan çekmeyi algılasın
    <SafeAreaView style={styles.container} {...menuPanResponder.panHandlers}>
      <StatusBar style="light" />
      
      {/* 1. HEADER */}
      {/* Menü butonuna basınca manuel aç */}
      <Header onMenuPress={() => toggleMenu(true)} fontScale={fontScale} />

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
          isRecording={isRecording} isPaused={isPaused} isProcessing={isProcessing} 
          pickFile={pickFile} saveRecordingToDevice={saveRecordingToDevice} 
          handleProcessPress={handleProcessPress} handleTrashPress={handleTrashPress} 
          resumeRecording={resumeRecording} pauseRecording={pauseRecording}
          stopRecording={stopRecording} handleRecordPress={handleRecordPress}
          fontScale={fontScale}
      />

      {/* LOADING BAR */}
      {isProcessing && (
        <View style={{ position: 'absolute', bottom: 100, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.8)', padding: 15, borderRadius: 10, flexDirection: 'row', alignItems: 'center', zIndex: 999 }}>
            <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 10 }} />
            <Text style={{ color: 'white', fontWeight: 'bold' }}>{statusMessage}</Text>
        </View>
      )}

      {/* SIDE DRAWER MENU */}
      {/* Animasyon değerini prop olarak gönderiyoruz */}
      <SideMenu 
        menuAnim={menuAnim} 
        onClose={() => toggleMenu(false)}
        onLogout={handleLogout}
        onNavigate={(screen) => {
            toggleMenu(false);
            if (screen === 'Records') setTimeout(() => setIsRecordsVisible(true), 300);
            if (screen === 'Settings') setTimeout(() => setIsSettingsVisible(true), 300);
        }}
      />

      {/* MODALS */}
      <RecordsModal 
        visible={isRecordsVisible} onClose={() => { stopSound(); setIsRecordsVisible(false); }}
        recordings={savedRecordings} onLoad={(item) => { loadFromLibrary(item); setIsRecordsVisible(false); }}
        onDelete={deleteRecording} onPlay={playSound} onShare={shareFileUri} onRename={handleListRename}
        playingId={playingId} isPlaying={isPlaying} fontScale={fontScale}
      />
      <AnalysisModal visible={isAnalysisVisible} onClose={() => setIsAnalysisVisible(false)} />
      <SettingsModal 
        visible={isSettingsVisible} onClose={() => setIsSettingsVisible(false)}
        recordings={savedRecordings} recordCount={savedRecordings.length}
        onClearAll={() => { clearAllRecordings(); setIsSettingsVisible(false); }}
        fontScale={fontScale} onChangeFontScale={changeFontScale}
      />
    </SafeAreaView>
  );
}