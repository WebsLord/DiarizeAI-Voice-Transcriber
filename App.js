import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Alert, Animated, Easing, ScrollView, Modal, FlatList } from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons, Entypo, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef } from 'react';
import * as DocumentPicker from 'expo-document-picker'; 
import { Audio } from 'expo-av'; 
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 

// --- COMPONENT: PLAYBACK WAVE BAR (Oynatma Sırasında Dans Eden Çubuk) ---
const PlaybackWaveBar = ({ height, isPlaying }) => {
    // Her çubuk için bağımsız bir animasyon değeri
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isPlaying) {
            // Oynatılıyorsa: Rastgele bir ritimle "titreşim" efekti ver
            // Bu, sesin "canlı" olduğu hissini verir
            const randomDuration = 100 + Math.random() * 200; // Hızlı titreşim
            
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scaleAnim, { 
                        toValue: 1.5, // %50 uzasın
                        duration: randomDuration, 
                        useNativeDriver: false 
                    }),
                    Animated.timing(scaleAnim, { 
                        toValue: 0.8, // Biraz kısalsın
                        duration: randomDuration, 
                        useNativeDriver: false 
                    })
                ])
            ).start();
        } else {
            // Durduysa: Orijinal boyutuna sakince dön
            Animated.timing(scaleAnim, { 
                toValue: 1, 
                duration: 200, 
                useNativeDriver: false 
            }).start();
        }
    }, [isPlaying]);

    return (
        <Animated.View 
            style={[
                styles.miniWaveBar, 
                { 
                    height: height, // Orijinal yükseklik (db verisi)
                    transform: [{ scaleY: scaleAnim }], // Animasyonlu ölçekleme
                    // Oynarken rengi parlak yap, dururken normal kırmızı kalsın
                    backgroundColor: isPlaying ? '#FF4B4B' : '#A03333'
                }
            ]} 
        />
    );
};

// --- COMPONENT: PULSING GLOW BUTTON ---
const PulsingGlowButton = ({ onPress, isRecording }) => {
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animValue, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(animValue, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
            ])
        ).start();
    }, []);

    const scale = animValue.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
    const opacity = animValue.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 0.6, 0] });
    const glowColor = isRecording ? '#2ecc71' : '#4A90E2';

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', width: 100, height: 100 }}>
            <Animated.View style={[styles.pulseRing, { transform: [{ scale }], opacity: opacity, backgroundColor: glowColor }]} />
            <TouchableOpacity style={styles.recordButton} onPress={onPress} activeOpacity={0.8}>
                <LinearGradient colors={isRecording ? ['#FF0000', '#800000'] : ['#FF4B4B', '#FF0000']} style={styles.recordGradient}>
                    {isRecording ? <FontAwesome5 name="stop" size={24} color="white" /> : <MaterialIcons name="mic" size={40} color="white" />}
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
};

// --- ANIMATED WAVE BAR (Idle Mode - Bekleme Ekranı) ---
const AnimatedWaveBar = ({ index }) => {
    const heightAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const randomDuration = 400 + Math.random() * 800; 
        Animated.loop(
            Animated.sequence([
                Animated.timing(heightAnim, { toValue: 1, duration: randomDuration, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
                Animated.timing(heightAnim, { toValue: 0, duration: randomDuration, easing: Easing.inOut(Easing.ease), useNativeDriver: false })
            ])
        ).start();
    }, []);
    const height = heightAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 50] });
    const backgroundColor = heightAnim.interpolate({ inputRange: [0, 1], outputRange: ['#555555', '#4A90E2'] });
    return <Animated.View style={[styles.waveBar, { height, backgroundColor }]} />;
};

// --- MAIN APP ---
export default function App() {
  
  const [selectedFile, setSelectedFile] = useState(null);
  
  // KAYIT STATE'LERİ
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState("00:00");
  const [metering, setMetering] = useState([]); 
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const scrollViewRef = useRef();

  // OYNATMA STATE'LERİ
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingId, setPlayingId] = useState(null);

  // MENÜ VE KAYITLAR
  const [isMenuVisible, setIsMenuVisible] = useState(false); 
  const [isRecordsVisible, setIsRecordsVisible] = useState(false); 
  const [savedRecordings, setSavedRecordings] = useState([]); 

  useEffect(() => {
      loadRecordings();
      return () => { if (sound) sound.unloadAsync(); };
  }, []);

  // --- AUDIO LOGIC ---
  async function playSound(uri, id) {
      try {
          if (sound) { await sound.stopAsync(); await sound.unloadAsync(); }

          if (playingId === id && isPlaying) {
              setIsPlaying(false);
              setPlayingId(null);
              return;
          }

          const { sound: newSound } = await Audio.Sound.createAsync({ uri: uri });
          setSound(newSound);
          setPlayingId(id);
          setIsPlaying(true);
          
          await newSound.playAsync();

          newSound.setOnPlaybackStatusUpdate((status) => {
              if (status.didJustFinish) {
                  setIsPlaying(false);
                  setPlayingId(null);
              }
          });
      } catch (error) {
          console.error("Playback error", error);
          Alert.alert("Hata", "Ses dosyası oynatılamadı.");
      }
  }

  async function stopSound() {
      if (sound) {
          await sound.stopAsync();
          setIsPlaying(false);
          setPlayingId(null);
      }
  }

  // --- STORAGE LOGIC ---
  const loadRecordings = async () => {
      try {
          const jsonValue = await AsyncStorage.getItem('@my_recordings');
          if (jsonValue != null) setSavedRecordings(JSON.parse(jsonValue));
      } catch (e) { console.error(e); }
  };

  const saveRecordingToDevice = async () => {
      if (!selectedFile) return;
      try {
          const baseFolder = FileSystem.documentDirectory || FileSystem.cacheDirectory;
          if (!baseFolder) { Alert.alert("Hata", "Klasör bulunamadı."); return; }

          const fileName = selectedFile.name || `Rec_${Date.now()}.m4a`;
          const newPath = baseFolder + fileName;

          await FileSystem.moveAsync({ from: selectedFile.uri, to: newPath });

          const newRecord = {
              id: Date.now().toString(),
              name: fileName,
              uri: newPath,
              date: new Date().toLocaleDateString(),
              duration: duration,
              metering: metering // Waveform verisini de kaydet!
          };

          const updatedList = [newRecord, ...savedRecordings];
          setSavedRecordings(updatedList);
          await AsyncStorage.setItem('@my_recordings', JSON.stringify(updatedList));

          Alert.alert("Başarılı", "Kayıt kütüphaneye eklendi!");
          setSelectedFile(null); 
          setMetering([]);
      } catch (error) { Alert.alert("Hata", "Kayıt saklanamadı."); }
  };

  const deleteRecording = async (id) => {
      try {
          if (playingId === id) stopSound();
          
          const recordingToDelete = savedRecordings.find(r => r.id === id);
          if (recordingToDelete) {
              await FileSystem.deleteAsync(recordingToDelete.uri, { idempotent: true });
          }
          const updatedList = savedRecordings.filter(r => r.id !== id);
          setSavedRecordings(updatedList);
          await AsyncStorage.setItem('@my_recordings', JSON.stringify(updatedList));
      } catch (error) { console.error("Delete error:", error); }
  };

  const loadFromLibrary = (item) => {
      stopSound();
      setSelectedFile({
          name: item.name,
          uri: item.uri,
          size: 0, 
          mimeType: 'audio/m4a'
      });
      // Varsa waveform verisini geri yükle, yoksa boş array
      setMetering(item.metering || []);
      setIsRecordsVisible(false);
      setIsMenuVisible(false);
  };

  // --- FEATURE 1 & 2: FILE PICKER & RECORDING ---
  const handleUploadPress = async () => {
    try {
      if (selectedFile) setSelectedFile(null);
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        if (file.size / (1024 * 1024) > 50) { Alert.alert("Hata", "Dosya çok büyük. Maksimum 50MB."); return; }
        setMetering([]); 
        setSelectedFile(file);
      }
    } catch (error) { console.error("Error picking file:", error); }
  };

  async function startRecording() {
    try {
      if (permissionResponse.status !== 'granted') await requestPermission();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.setProgressUpdateInterval(100); 
      recording.setOnRecordingStatusUpdate(updateRecorderStatus);
      setRecording(recording);
      setIsRecording(true);
      setIsPaused(false);
      setMetering([]); 
      setSelectedFile(null); 
    } catch (err) { Alert.alert("Hata", "Mikrofona erişilemedi."); }
  }

  const updateRecorderStatus = (status) => {
      if (status.canRecord && status.isRecording) {
          const millis = status.durationMillis;
          const minutes = Math.floor(millis / 60000);
          const seconds = ((millis % 60000) / 1000).toFixed(0);
          setDuration(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
          const currentLevel = status.metering || -160;
          setMetering((prev) => [...prev, currentLevel]);
      }
  };

  async function stopRecording() {
    setIsRecording(false);
    setIsPaused(false);
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI(); 
    setRecording(null);
    if (uri) {
        setSelectedFile({
            name: `Rec_${new Date().toLocaleTimeString().replace(/:/g, '-')}.m4a`, 
            uri: uri, size: 1024 * 1024, mimeType: 'audio/m4a'
        });
    }
  }

  const handleRecordPress = () => { if (isRecording) stopRecording(); else startRecording(); };
  const handleShare = async () => { if (selectedFile?.uri && await Sharing.isAvailableAsync()) { await Sharing.shareAsync(selectedFile.uri); } };
  const handleBackPress = () => {
      stopSound();
      Alert.alert("Kaydı Sil", "Ses kaydı silinecektir. Onaylıyor musunuz?",
          [{ text: "Vazgeç", style: "cancel" }, { text: "Evet, Sil", style: "destructive", onPress: () => { setSelectedFile(null); setMetering([]); } }]
      );
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

      {/* MENU MODAL */}
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

      {/* RECORDS LIST MODAL */}
      <Modal visible={isRecordsVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { stopSound(); setIsRecordsVisible(false); }}>
          <View style={styles.recordsContainer}>
              <View style={styles.recordsHeader}>
                  <Text style={styles.recordsTitle}>Saved Recordings</Text>
                  <TouchableOpacity onPress={() => { stopSound(); setIsRecordsVisible(false); }}>
                      <Text style={styles.closeText}>Close</Text>
                  </TouchableOpacity>
              </View>
              {savedRecordings.length === 0 ? (
                  <View style={styles.emptyState}>
                      <FontAwesome5 name="ghost" size={50} color="#333" />
                      <Text style={{color: '#555', marginTop: 10}}>No recordings found.</Text>
                  </View>
              ) : (
                  <FlatList
                      data={savedRecordings}
                      keyExtractor={item => item.id}
                      renderItem={({item}) => {
                          const isThisPlaying = playingId === item.id && isPlaying;
                          return (
                            <View style={styles.recordItem}>
                                <TouchableOpacity style={styles.recordPlayBtn} onPress={() => playSound(item.uri, item.id)}>
                                    <FontAwesome5 name={isThisPlaying ? "pause" : "play"} size={18} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity style={{flex: 1, marginLeft: 10}} onPress={() => loadFromLibrary(item)}>
                                    <Text style={styles.recordName} numberOfLines={1}>{item.name}</Text>
                                    <Text style={styles.recordDate}>{item.date} • {item.duration || 'Unknown'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => deleteRecording(item.id)} style={{padding: 10}}>
                                    <Ionicons name="trash-outline" size={20} color="#555" />
                                </TouchableOpacity>
                            </View>
                          );
                      }}
                  />
              )}
          </View>
      </Modal>

      {/* --- VISUALIZER AREA --- */}
      <View style={styles.waveContainer}>
        {/* CASE 1: RECORDING (Kayan Çubuklar) */}
        {isRecording || isPaused ? (
             <View style={styles.activeRecordingContainer}>
                 <Text style={styles.timerText}>{duration}</Text>
                 <View style={{ height: 60, width: '100%' }}>
                     <ScrollView ref={scrollViewRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingRight: 20 }} onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}>
                        {metering.map((db, index) => (<View key={index} style={[styles.waveBarRecord, { height: normalizeWave(db) }]} />))}
                     </ScrollView>
                 </View>
             </View>
        ) 
        /* CASE 2: PREVIEW / PLAYBACK (DÜZELTİLDİ: Ortalı ve Dans Eden Çubuklar) */
        : selectedFile ? (
            <View style={styles.filePreviewCard}>
                <TouchableOpacity onPress={handleBackPress} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="#A0A0A0" /></TouchableOpacity>
                <TouchableOpacity onPress={handleBackPress} style={styles.closeButton}><Ionicons name="close" size={20} color="#FF4B4B" /></TouchableOpacity>
                
                <View style={styles.previewContent}>
                    <TouchableOpacity style={styles.iconContainer} onPress={() => playSound(selectedFile.uri, 'preview')}>
                         <FontAwesome5 name={(playingId === 'preview' && isPlaying) ? "pause" : "play"} size={24} color="#FF4B4B" />
                    </TouchableOpacity>

                    <View style={styles.fileInfo}>
                        <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                        <Text style={styles.fileStatus}>{(playingId === 'preview' && isPlaying) ? "Playing..." : "Ready to Process"}</Text>
                        
                        {metering.length > 0 && (
                            <View style={styles.miniWaveformContainer}>
                                <ScrollView 
                                    horizontal 
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ alignItems: 'center' }} // DİKEY ORTALAMA İÇİN KRİTİK!
                                >
                                    {metering.map((db, index) => (
                                        // Normal View yerine PlaybackWaveBar kullanıyoruz
                                        <PlaybackWaveBar 
                                            key={index} 
                                            height={normalizeWave(db) * 0.8} // Biraz küçülterek sığdır
                                            isPlaying={playingId === 'preview' && isPlaying}
                                        />
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity onPress={handleShare} style={styles.shareBtn}><Entypo name="share" size={22} color="#A0A0A0" /></TouchableOpacity>
                </View>
            </View>
        ) 
        /* CASE 3: IDLE */
        : (
            <View style={styles.idleWaveContainer}>
                {[...Array(5)].map((_, index) => (<AnimatedWaveBar key={index} index={index} />))}
            </View>
        )}
      </View>

      <View style={styles.controlsContainer}>
        {!selectedFile && !isRecording && (
            <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPress}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 20, marginTop: 20, zIndex: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#E0E0E0', letterSpacing: 1 },
  subtitle: { color: '#777', fontSize: 12 },
  menuButton: { padding: 10, zIndex: 20 }, 

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-start', alignItems: 'flex-end' },
  menuContainer: { width: 200, backgroundColor: '#1E1E1E', marginTop: 100, marginRight: 20, borderRadius: 15, padding: 15, borderWidth: 1, borderColor: '#333' },
  menuTitle: { color: '#555', fontWeight: 'bold', marginBottom: 15, fontSize: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  menuItemText: { color: '#E0E0E0', marginLeft: 10, fontSize: 16 },
  
  recordsContainer: { flex: 1, backgroundColor: '#121212', padding: 20 },
  recordsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 20 },
  recordsTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  closeText: { color: '#4A90E2', fontSize: 16 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  recordItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', padding: 10, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#333' },
  recordPlayBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#444' },
  recordName: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  recordDate: { color: '#777', fontSize: 12, marginTop: 4 },
  
  waveContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '90%', minHeight: 200 },
  idleWaveContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 100 },
  waveBar: { width: 8, borderRadius: 4, marginHorizontal: 4 }, 
  activeRecordingContainer: { width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E1E1E', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  timerText: { color: '#FF4B4B', fontSize: 24, fontWeight: 'bold', marginBottom: 15, fontVariant: ['tabular-nums'] },
  waveBarRecord: { width: 4, borderRadius: 2, marginHorizontal: 1, backgroundColor: '#FF4B4B' },
  
  filePreviewCard: { width: '100%', backgroundColor: '#1E1E1E', borderRadius: 16, borderWidth: 1, borderColor: '#333', padding: 16, position: 'relative' },
  backButton: { position: 'absolute', top: 10, left: 10, zIndex: 10, padding: 5 },
  closeButton: { position: 'absolute', top: 10, right: 10, zIndex: 10, backgroundColor: '#2A2A2A', borderRadius: 15, padding: 4 },
  previewContent: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  iconContainer: { width: 50, height: 50, backgroundColor: '#2A2A2A', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  fileInfo: { flex: 1, justifyContent: 'center' },
  fileName: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  fileStatus: { color: '#777', fontSize: 12 },
  
  miniWaveformContainer: { 
      height: 40, // Yükseklik verildi
      marginTop: 8, 
      width: '100%', 
      opacity: 0.9,
      justifyContent: 'center' // Dikey ortalama
  },
  miniWaveBar: { 
      width: 3, 
      backgroundColor: '#A03333', // Varsayılan renk (koyu kırmızı)
      marginHorizontal: 1, 
      borderRadius: 1.5 
  },
  
  shareBtn: { padding: 10 },
  controlsContainer: { width: '100%', alignItems: 'center', marginBottom: 30 },
  uploadButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 20, marginBottom: 40, borderWidth: 1, borderColor: '#333' },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  sendButton: { backgroundColor: '#2ecc71', borderColor: '#27ae60' },
  uploadText: { color: '#A0A0A0', marginLeft: 10, fontSize: 16, fontWeight: '600' },
  recordButton: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  recordGradient: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#2A2A2A' },
  pulseRing: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: '#4A90E2', zIndex: 1 },
  recordLabel: { color: '#555', marginTop: 15, fontSize: 12 },
});