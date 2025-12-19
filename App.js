import { StatusBar } from 'expo-status-bar';
import { Text, View, TouchableOpacity, SafeAreaView, Alert, ScrollView, Modal, TextInput, Animated, Easing } from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons, Entypo, Feather } from '@expo/vector-icons';
import { useState, useRef } from 'react';

// --- CUSTOM MODULES ---
import { styles } from './src/styles/AppStyles';       
import { useAudioLogic } from './src/hooks/useAudioLogic'; 

// --- COMPONENTS ---
import { PulsingGlowButton } from './src/components/PulsingButton';
import { PlaybackWaveBar, AnimatedWaveBar } from './src/components/WaveBars'; // AnimatedWaveBar eklendi
import { RecordsModal } from './src/components/RecordsModal';

export default function App() {
  
  const {
      selectedFile, isRecording, isPaused, duration, metering,
      isPlaying, playingId, savedRecordings,
      startRecording, stopRecording, pauseRecording, resumeRecording, discardRecording,
      playSound, stopSound, saveRecordingToDevice, deleteRecording, 
      pickFile, loadFromLibrary, clearSelection, shareFile, shareFileUri, renameRecording
  } = useAudioLogic();

  // UI States
  const [isMenuVisible, setIsMenuVisible] = useState(false); 
  const [isRecordsVisible, setIsRecordsVisible] = useState(false); 
  const [isEditingName, setIsEditingName] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  const scrollViewRef = useRef();
  
  // TRASH ANIMATION VALUES
  // ÇÖP ANİMASYONU DEĞERLERİ
  const trashScale = useRef(new Animated.Value(1)).current;
  const trashTranslateY = useRef(new Animated.Value(0)).current;
  const trashOpacity = useRef(new Animated.Value(1)).current;

  // --- UI HANDLERS ---
  
  const handleRecordPress = () => { startRecording(); }; // Only start here / Sadece başlat
  
  const handleTrashPress = () => {
      // 1. Start Animation (Shrink & Fall)
      // 1. Animasyonu Başlat (Küçül & Düş)
      Animated.parallel([
          Animated.timing(trashScale, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(trashTranslateY, { toValue: 200, duration: 400, useNativeDriver: true }),
          Animated.timing(trashOpacity, { toValue: 0, duration: 400, useNativeDriver: true })
      ]).start(() => {
          // 2. Logic after animation
          // 2. Animasyon sonrası mantık
          discardRecording();
          
          // 3. Reset Animation (Quickly)
          // 3. Animasyonu Sıfırla (Hızlıca)
          setTimeout(() => {
              trashScale.setValue(1);
              trashTranslateY.setValue(0);
              trashOpacity.setValue(1);
          }, 500);
      });
  };

  const handleBackPress = () => {
      Alert.alert("Delete Recording", "Recording will be deleted. Are you sure?",
          [{ text: "Cancel", style: "cancel" }, { text: "Yes, Delete", style: "destructive", onPress: clearSelection }]
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

  const normalizeWave = (db) => {
      const minDb = -80; const maxHeight = 40; 
      if (db < minDb) return 3; 
      let height = ((db - minDb) / (0 - minDb)) * maxHeight;
      return Math.max(3, height);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* 1. HEADER */}
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

      {/* 2. MENUS */}
      <Modal visible={isMenuVisible} transparent={true} animationType="fade" onRequestClose={() => setIsMenuVisible(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsMenuVisible(false)}>
              <View style={styles.menuContainer}>
                  <Text style={styles.menuTitle}>Menu</Text>
                  <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuVisible(false); setTimeout(() => setIsRecordsVisible(true), 300); }}>
                      <MaterialIcons name="library-music" size={24} color="#4A90E2" />
                      <Text style={styles.menuItemText}>Records</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.menuItem, {opacity: 0.5}]} disabled={true}>
                      <Ionicons name="settings-outline" size={24} color="#777" />
                      <Text style={styles.menuItemText}>Settings (Soon)</Text>
                  </TouchableOpacity>
              </View>
          </TouchableOpacity>
      </Modal>

      <RecordsModal 
        visible={isRecordsVisible}
        onClose={() => { stopSound(); setIsRecordsVisible(false); }}
        recordings={savedRecordings}
        onLoad={loadFromLibrary}
        onDelete={deleteRecording}
        onPlay={playSound}
        onShare={shareFileUri} // Pass share function / Paylaşma fonksiyonunu geçir
        playingId={playingId}
        isPlaying={isPlaying}
      />

      {/* 3. VISUALIZER AREA */}
      <View style={styles.waveContainer}>
        {/* CASE A: RECORDING */}
        {isRecording || isPaused ? (
             <Animated.View 
                style={[
                    styles.activeRecordingContainer,
                    // Apply Animation Styles / Animasyon Stillerini Uygula
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
                            <View key={index} style={[styles.waveBarRecord, { height: normalizeWave(db), backgroundColor: isPaused ? '#555' : '#FF4B4B' }]} />
                        ))}
                     </ScrollView>
                 </View>
             </Animated.View>
        ) 
        /* CASE B: PREVIEW */
        : selectedFile ? (
            <View style={styles.filePreviewCard}>
                <TouchableOpacity onPress={handleBackPress} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="#A0A0A0" /></TouchableOpacity>
                <TouchableOpacity onPress={handleBackPress} style={styles.closeButton}><Ionicons name="close" size={20} color="#FF4B4B" /></TouchableOpacity>
                
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
                        <Text style={styles.fileStatus}>{(playingId === 'preview' && isPlaying) ? "Playing..." : "Ready to Process"}</Text>
                        
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
                    <TouchableOpacity onPress={shareFile} style={styles.shareBtn}><Entypo name="share" size={22} color="#A0A0A0" /></TouchableOpacity>
                </View>
            </View>
        ) 
        /* CASE C: IDLE */
        : (
            <View style={styles.idleWaveContainer}>
                {[...Array(5)].map((_, index) => (<AnimatedWaveBar key={index} />))}
            </View>
        )}
      </View>

      {/* 4. CONTROLS */}
      <View style={styles.controlsContainer}>
        {!selectedFile && !isRecording && !isPaused ? (
            <TouchableOpacity style={styles.uploadButton} onPress={pickFile}>
                <FontAwesome5 name="cloud-upload-alt" size={24} color="#A0A0A0" />
                <Text style={styles.uploadText}>Select Audio File</Text>
            </TouchableOpacity>
        ) : null}
        
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

        {/* RECORDING STATE CONTROLS */}
        {(isRecording || isPaused) ? (
            <View style={styles.recordingControls}>
                {/* TRASH BUTTON (Left) */}
                <TouchableOpacity style={styles.smallControlBtn} onPress={handleTrashPress}>
                    <Ionicons name="trash-outline" size={24} color="#FF4B4B" />
                </TouchableOpacity>

                {/* PAUSE/RESUME BUTTON (Center/Right) */}
                <TouchableOpacity style={[styles.smallControlBtn, {width: 60, height: 60, borderRadius: 30, backgroundColor: '#4A90E2', borderColor: '#4A90E2'}]} 
                    onPress={isPaused ? resumeRecording : pauseRecording}>
                    <FontAwesome5 name={isPaused ? "play" : "pause"} size={24} color="white" />
                </TouchableOpacity>

                {/* STOP BUTTON (Main) */}
                <TouchableOpacity onPress={stopRecording}>
                    <PulsingGlowButton onPress={stopRecording} isRecording={true} />
                </TouchableOpacity>
            </View>
        ) : !selectedFile ? (
            // IDLE RECORD BUTTON
            <>
                <PulsingGlowButton onPress={handleRecordPress} isRecording={false} />
                <Text style={styles.recordLabel}>Tap to Record</Text>
            </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}