import { StatusBar } from 'expo-status-bar';
import { Text, View, TouchableOpacity, SafeAreaView, Alert, ScrollView, Modal } from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons, Entypo, Feather } from '@expo/vector-icons';
import { useState, useRef } from 'react';

// --- CUSTOM MODULES ---
// --- ÖZEL MODÜLLER ---
import { styles } from './src/styles/AppStyles';       // CSS File / CSS Dosyası
import { useAudioLogic } from './src/hooks/useAudioLogic'; // Logic File / Mantık Dosyası

// --- COMPONENTS ---
// --- BİLEŞENLER ---
import { PulsingGlowButton } from './src/components/PulsingButton';
import { AnimatedWaveBar, PlaybackWaveBar } from './src/components/WaveBars';
import { RecordsModal } from './src/components/RecordsModal';

export default function App() {
  
  // Initialize logic hook
  // Mantık kancasını başlat
  const {
      selectedFile, isRecording, duration, metering,
      isPlaying, playingId, savedRecordings,
      startRecording, stopRecording, playSound, stopSound,
      saveRecordingToDevice, deleteRecording, pickFile,
      loadFromLibrary, clearSelection, shareFile
  } = useAudioLogic();

  // UI States (Menu visibility, etc.)
  // Arayüz Durumları (Menü görünürlüğü vb.)
  const [isMenuVisible, setIsMenuVisible] = useState(false); 
  const [isRecordsVisible, setIsRecordsVisible] = useState(false); 
  const scrollViewRef = useRef();

  // --- UI HANDLERS / ARAYÜZ İŞLEYİCİLERİ ---
  
  // Toggle recording state
  // Kayıt durumunu değiştir
  const handleRecordPress = () => { isRecording ? stopRecording() : startRecording(); };
  
  // Confirmation dialog before deleting/clearing
  // Silme/temizleme öncesi onay diyaloğu
  const handleBackPress = () => {
      Alert.alert("Delete Recording", "Recording will be deleted. Are you sure?",
          [{ text: "Cancel", style: "cancel" }, { text: "Yes, Delete", style: "destructive", onPress: clearSelection }]
      );
  };

  // Helper to normalize decibels for visualization
  // Görselleştirme için desibelleri normalize eden yardımcı
  const normalizeWave = (db) => {
      const minDb = -80; const maxHeight = 40; 
      if (db < minDb) return 3; 
      let height = ((db - minDb) / (0 - minDb)) * maxHeight;
      return Math.max(3, height);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* 1. HEADER / BAŞLIK */}
      <View style={styles.header}>
        <View style={{width: 40}} /> 
        <View style={{alignItems: 'center'}}>
            <Text style={styles.title}>Diarize AI</Text>
            <Text style={styles.subtitle}>Live audio now converts to text</Text>
        </View>
        <TouchableOpacity style={styles.menuButton} onPress={() => setIsMenuVisible(true)}>
            <Feather name="menu" size={28} color="#E0E0E0" />
        </TouchableOpacity>
      </View>

      {/* 2. MENU MODAL / MENÜ MODALI */}
      <Modal visible={isMenuVisible} transparent={true} animationType="fade" onRequestClose={() => setIsMenuVisible(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsMenuVisible(false)}>
              <View style={styles.menuContainer}>
                  <Text style={styles.menuTitle}>Menu</Text>
                  
                  {/* Records Option / Kayıtlar Seçeneği */}
                  <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuVisible(false); setTimeout(() => setIsRecordsVisible(true), 300); }}>
                      <MaterialIcons name="library-music" size={24} color="#4A90E2" />
                      <Text style={styles.menuItemText}>Records</Text>
                  </TouchableOpacity>
                  
                  {/* Settings Option (Disabled) / Ayarlar Seçeneği (Devre Dışı) */}
                  <TouchableOpacity style={[styles.menuItem, {opacity: 0.5}]} disabled={true}>
                      <Ionicons name="settings-outline" size={24} color="#777" />
                      <Text style={styles.menuItemText}>Settings (Soon)</Text>
                  </TouchableOpacity>
              </View>
          </TouchableOpacity>
      </Modal>

      {/* 3. RECORDS LIST MODAL / KAYIT LİSTESİ MODALI */}
      <RecordsModal 
        visible={isRecordsVisible}
        onClose={() => { stopSound(); setIsRecordsVisible(false); }}
        recordings={savedRecordings}
        onLoad={loadFromLibrary}
        onDelete={deleteRecording}
        onPlay={playSound}
        playingId={playingId}
        isPlaying={isPlaying}
      />

      {/* 4. VISUALIZER AREA / GÖRSELLEŞTİRİCİ ALANI */}
      <View style={styles.waveContainer}>
        {/* CASE A: RECORDING / DURUM A: KAYIT */}
        {isRecording ? (
             <View style={styles.activeRecordingContainer}>
                 <Text style={styles.timerText}>{duration}</Text>
                 <View style={{ height: 60, width: '100%' }}>
                     <ScrollView ref={scrollViewRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingRight: 20 }} onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}>
                        {metering.map((db, index) => (<View key={index} style={[styles.waveBarRecord, { height: normalizeWave(db) }]} />))}
                     </ScrollView>
                 </View>
             </View>
        ) 
        /* CASE B: PREVIEW / DURUM B: ÖNİZLEME */
        : selectedFile ? (
            <View style={styles.filePreviewCard}>
                <TouchableOpacity onPress={handleBackPress} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="#A0A0A0" /></TouchableOpacity>
                <TouchableOpacity onPress={handleBackPress} style={styles.closeButton}><Ionicons name="close" size={20} color="#FF4B4B" /></TouchableOpacity>
                
                <View style={styles.previewContent}>
                    {/* Play Button in Preview / Önizlemede Oynat Butonu */}
                    <TouchableOpacity style={styles.iconContainer} onPress={() => playSound(selectedFile.uri, 'preview')}>
                         <FontAwesome5 name={(playingId === 'preview' && isPlaying) ? "pause" : "play"} size={24} color="#FF4B4B" />
                    </TouchableOpacity>

                    <View style={styles.fileInfo}>
                        <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                        <Text style={styles.fileStatus}>{(playingId === 'preview' && isPlaying) ? "Playing..." : "Ready to Process"}</Text>
                        
                        {/* Mini Visualizer / Mini Görselleştirici */}
                        {metering.length > 0 && (
                            <View style={styles.miniWaveformContainer}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
                                    {metering.map((db, index) => (
                                        <PlaybackWaveBar 
                                            key={index} 
                                            height={normalizeWave(db) * 0.8}
                                            isPlaying={playingId === 'preview' && isPlaying}
                                        />
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity onPress={shareFile} style={styles.shareBtn}><Entypo name="share" size={22} color="#A0A0A0" /></TouchableOpacity>
                </View>
            </View>
        ) 
        /* CASE C: IDLE / DURUM C: BOŞTA */
        : (
            <View style={styles.idleWaveContainer}>
                {[...Array(5)].map((_, index) => (<AnimatedWaveBar key={index} />))}
            </View>
        )}
      </View>

      {/* 5. CONTROLS / KONTROLLER */}
      <View style={styles.controlsContainer}>
        {!selectedFile && !isRecording && (
            <TouchableOpacity style={styles.uploadButton} onPress={pickFile}>
                <FontAwesome5 name="cloud-upload-alt" size={24} color="#A0A0A0" />
                <Text style={styles.uploadText}>Select Audio File</Text>
            </TouchableOpacity>
        )}
        
        {selectedFile && !isRecording && (
            <View style={{flexDirection: 'row', gap: 10}}>
                <TouchableOpacity style={[styles.actionButton, {backgroundColor: '#333'}]} onPress={saveRecordingToDevice}>
                    <FontAwesome5 name="save" size={20} color="#A0A0A0" />
                    <Text style={[styles.uploadText, {marginLeft: 8}]}>Save</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, styles.sendButton]} onPress={() => Alert.alert("Ready", "Sending to API...")}>
                    <FontAwesome5 name="paper-plane" size={20} color="white" />
                    <Text style={[styles.uploadText, {color: 'white', marginLeft: 8}]}>Process</Text>
                </TouchableOpacity>
            </View>
        )}

        {!selectedFile && (
            <>
                <PulsingGlowButton onPress={handleRecordPress} isRecording={isRecording} />
                <Text style={styles.recordLabel}>{isRecording ? "Tap to Stop" : "Tap to Record"}</Text>
            </>
        )}
      </View>
    </SafeAreaView>
  );
}