// src/screens/ResultScreen.js

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Dimensions } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';

import { deleteAnalysis } from '../utils/resultStorage';

export default function ResultScreen({ route, navigation }) {
  const { data } = route.params || {};

  // --- AUDIO REFS & STATES ---
  const soundRef = useRef(null); 
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  
  // --- FILE STATES ---
  const [localUri, setLocalUri] = useState(null);
  const [isFileMissing, setIsFileMissing] = useState(false);

  // 1. GÜVENLİK KONTROLÜ
  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>Veri bulunamadı.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.button}>
          <Text style={styles.buttonText}>Geri Dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- 2. VERİ HAZIRLIĞI ---
  const processedSegments = useMemo(() => {
    let rawSegments = [];
    
    let source = 
        data.segments || 
        data.segments_json || 
        data.transcript_segments ||
        (data.result ? data.result.segments : null);

    try {
        if (!source) return []; 

        if (typeof source === 'string') {
            rawSegments = JSON.parse(source);
            if (typeof rawSegments === 'string') rawSegments = JSON.parse(rawSegments);
        } 
        else {
            rawSegments = source;
        }

        if (!Array.isArray(rawSegments)) return [];

        return rawSegments.map(seg => ({
            ...seg,
            start: parseFloat(seg.start || seg.start_time || 0), 
            end: parseFloat(seg.end || seg.end_time || 0)
        }));

    } catch (e) {
        console.log("Segment parse hatası:", e);
        return [];
    }
  }, [data]);

  const keypoints = useMemo(() => {
    try {
        if (!data.keypoints && !data.keypoints_json) return [];
        let src = data.keypoints_json || data.keypoints;
        let points = typeof src === 'string' ? JSON.parse(src) : src;
        if (typeof points === 'string') points = JSON.parse(points);
        return Array.isArray(points) ? points : [];
    } catch (e) { return []; }
  }, [data]);

  // --- EXTRACT FLAGS ---
  const flags = useMemo(() => {
      const f = data.flags || (data.result ? data.result.flags : []) || [];
      return Array.isArray(f) ? f : [];
  }, [data]);

  // --- 3. LIFECYCLE ---
  useEffect(() => {
      checkLocalFile();
      return () => {
        if (soundRef.current) {
          soundRef.current.stopAsync();
          soundRef.current.unloadAsync();
        }
      };
  }, []);

  // --- DOSYA İŞLEMLERİ ---
  const checkLocalFile = async () => {
      let targetPath = null;

      if (data.originalName) {
          targetPath = FileSystem.documentDirectory + data.originalName;
      } else if (data.audio_path) {
          const fileName = data.audio_path.split(/[/\\]/).pop(); 
          targetPath = FileSystem.documentDirectory + fileName;
      }

      if (!targetPath) {
          setLocalUri(null);
          setIsFileMissing(true);
          return;
      }

      const info = await FileSystem.getInfoAsync(targetPath);
      if (info.exists) {
          setLocalUri(targetPath);
          setIsFileMissing(false);
          await loadSound(targetPath);
      } else {
          setLocalUri(null);
          setIsFileMissing(true);
      }
  };

  const loadSound = async (uri) => {
    try {
      if (soundRef.current) {
          await soundRef.current.unloadAsync();
      }

      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false }
      );

      soundRef.current = newSound; 
      setDuration(status.durationMillis);

      await newSound.setProgressUpdateIntervalAsync(50);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (!isSeeking) {
              setPosition(status.positionMillis);
          }
          setIsPlaying(status.isPlaying);
          
          if (status.didJustFinish) {
            setIsPlaying(false);
            newSound.setPositionAsync(0);
          }
        }
      });

    } catch (error) {
      console.log("Ses yükleme hatası:", error);
    }
  };

  // --- PLAYBACK CONTROLS ---
  const handlePlayPause = async () => {
    const sound = soundRef.current;
    if (!sound) return;

    if (isPlaying) await sound.pauseAsync();
    else await sound.playAsync();
  };

  const handleSlidingStart = () => setIsSeeking(true);
  
  const handleSlidingComplete = async (value) => {
      const sound = soundRef.current;
      if (sound) {
          await sound.setPositionAsync(value);
          setPosition(value); 
      }
      setIsSeeking(false);
  };

  const handleSegmentPress = async (startTimeSeconds) => {
    const sound = soundRef.current;
    if (sound && !isFileMissing) {
      try {
          const seekMillis = startTimeSeconds * 1000;
          await sound.setPositionAsync(seekMillis);
          setPosition(seekMillis); 
          if (!isPlaying) await sound.playAsync();
      } catch (error) {
          console.log("Segment atlama hatası:", error);
      }
    }
  };

  const handleRelinkFile = async () => {
      try {
          const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
          if (result.canceled || !result.assets) return;
          const pickedFile = result.assets[0];
          
          const { sound: tempSound, status } = await Audio.Sound.createAsync({ uri: pickedFile.uri });
          const pickedDuration = status.durationMillis / 1000; 
          await tempSound.unloadAsync();

          const lastSegment = processedSegments.length > 0 ? processedSegments[processedSegments.length - 1] : null;
          const expectedDuration = lastSegment ? lastSegment.end : 0;

          if (expectedDuration > 0 && Math.abs(pickedDuration - expectedDuration) > 10) {
              Alert.alert("Uyarı", "Süre biraz farklı görünüyor ama yine de yüklüyorum.");
          }
          await performRelink(pickedFile);
      } catch (error) {
          Alert.alert("Hata", error.message);
      }
  };

  const performRelink = async (pickedFile) => {
      try {
          let fileName = data.originalName;
          if (!fileName && data.audio_path) fileName = data.audio_path.split(/[/\\]/).pop();
          if (!fileName) return;

          const targetPath = FileSystem.documentDirectory + fileName;
          await FileSystem.copyAsync({ from: pickedFile.uri, to: targetPath });
          Alert.alert("Başarılı", "Dosya geri yüklendi!");
          checkLocalFile(); 
      } catch (e) {
          Alert.alert("Hata", e.message);
      }
  };

  const handleDeleteAnalysis = async () => {
      Alert.alert("Sil", "Analizi silmek istediğine emin misin?", [
          { text: "İptal", style: "cancel" },
          { text: "Sil", style: "destructive", onPress: async () => {
              if (data.localId) await deleteAnalysis(data.localId);
              navigation.goBack();
          }}
      ]);
  };

  const formatTime = (millis) => {
    if (!millis || millis < 0) return "00:00";
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Analiz & Karaoke</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* PLAYER */}
        {!isFileMissing && localUri ? (
            <View style={styles.playerCard}>
                <View style={styles.playerTopRow}>
                    <TouchableOpacity onPress={handlePlayPause} style={styles.playBtn}>
                        <FontAwesome5 name={isPlaying ? "pause" : "play"} size={22} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.timeText}>{formatTime(position)}</Text>
                    
                    <Slider
                        style={{flex: 1, marginHorizontal: 10, height: 40}}
                        minimumValue={0}
                        maximumValue={duration}
                        value={isSeeking ? undefined : position}
                        minimumTrackTintColor="#4A90E2"
                        maximumTrackTintColor="#555"
                        thumbTintColor="#4A90E2"
                        onSlidingStart={handleSlidingStart}
                        onSlidingComplete={handleSlidingComplete}
                    />
                    
                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
            </View>
        ) : (
            <View style={styles.errorCard}>
                <Ionicons name="alert-circle" size={40} color="#FF5252" />
                <Text style={styles.errorTitle}>Ses Dosyası Bulunamadı</Text>
                <View style={styles.errorActions}>
                    <TouchableOpacity style={styles.relinkButton} onPress={handleRelinkFile}>
                        <Text style={styles.btnText}>Dosyayı Tekrar Yükle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAnalysis}>
                        <Ionicons name="trash" size={18} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        )}

        {/* ÖZET */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text-outline" size={24} color="#4A90E2" />
            <Text style={styles.cardTitle}>Özet</Text>
          </View>
          <Text style={styles.cardText}>{data.summary || "Özet bulunamadı."}</Text>
        </View>

        {/* BİLGİLER */}
        <View style={styles.row}>
          <View style={[styles.card, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>Tür</Text>
            <Text style={styles.value}>{data.conversation_type || "Bilinmiyor"}</Text>
          </View>
          <View style={[styles.card, { flex: 1, marginLeft: 10 }]}>
            <Text style={styles.label}>Dil</Text>
            <Text style={styles.value}>{data.language || "Bilinmiyor"}</Text>
          </View>
        </View>

        {/* ANAHTAR NOKTALAR */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="list-outline" size={24} color="#F5A623" />
            <Text style={styles.cardTitle}>Anahtar Noktalar</Text>
          </View>
          {keypoints.map((point, index) => (
              <View key={index} style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.cardText}>{point}</Text>
              </View>
          ))}
        </View>

        {/* --- KARAOKE TRANSKRİPT --- */}
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Ionicons name="chatbubbles-outline" size={24} color="#50E3C2" />
                <Text style={styles.cardTitle}>Canlı Transkript</Text>
            </View>

            {processedSegments.length > 0 ? (
                processedSegments.map((seg, index) => {
                    const currentSec = position / 1000;
                    const isActive = currentSec >= seg.start && currentSec <= seg.end;
                    
                    // Check flags
                    // Bayrakları kontrol et
                    const hasFlag = flags.some(flagTime => flagTime >= seg.start && flagTime <= seg.end);
                    
                    return (
                        <TouchableOpacity 
                            key={index} 
                            style={[
                                styles.segmentBox, 
                                isActive && styles.activeSegment,
                                // Border for flag removed, now using Badge
                                // Bayrak için kenarlık kaldırıldı, artık Rozet kullanılıyor
                            ]}
                            onPress={() => handleSegmentPress(seg.start)}
                            activeOpacity={0.7}
                        >
                            {/* --- ABSOLUTE FLAG BADGE --- */}
                            {/* --- MUTLAK KONUMLU BAYRAK ROZETİ --- */}
                            {hasFlag && (
                                <View style={styles.flagBadge}>
                                    <FontAwesome5 name="flag" size={12} color="#F5A623" solid />
                                </View>
                            )}

                            <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom: 5}}>
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <Text style={[styles.speakerName, isActive && { color: '#000' }]}>
                                        {seg.speaker || "Konuşmacı"}:
                                    </Text>
                                </View>
                                <Text style={[styles.timeStamp, isActive && { color: '#333' }]}>
                                    {formatTime(seg.start * 1000)}
                                </Text>
                            </View>
                            <Text style={[styles.segmentText, isActive && { color: '#000', fontWeight: '600' }]}>
                                {seg.text}
                            </Text>
                        </TouchableOpacity>
                    );
                })
            ) : (
                <Text style={styles.transcriptText}>{data.clean_transcript || "Metin yok."}</Text>
            )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  backButton: { marginRight: 15, padding: 5 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  
  // PLAYER STYLES
  playerCard: {
      backgroundColor: '#252525',
      padding: 15,
      borderRadius: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: '#333',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 5
  },
  playerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
  },
  playBtn: {
      width: 45, height: 45,
      borderRadius: 25,
      backgroundColor: '#4A90E2',
      alignItems: 'center', justifyContent: 'center',
      marginRight: 10
  },
  timeText: {
      color: '#CCC',
      fontSize: 12,
      fontVariant: ['tabular-nums'],
      width: 40,
      textAlign: 'center'
  },

  // CARD STYLES
  card: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 15, marginBottom: 15 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: { color: '#FFF', fontSize: 18, fontWeight: '600', marginLeft: 10 },
  cardText: { color: '#CCC', fontSize: 15, lineHeight: 22 },
  transcriptText: { color: '#AAA', fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  
  row: { flexDirection: 'row', marginBottom: 15 },
  label: { color: '#888', fontSize: 12, marginBottom: 5 },
  value: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  bulletPoint: { flexDirection: 'row', marginBottom: 8 },
  bullet: { color: '#F5A623', fontSize: 20, marginRight: 10, lineHeight: 22 },

  // SEGMENT STYLES - KARAOKE
  segmentBox: {
      marginBottom: 15, // Increased margin for badge space / Rozet alanı için artırılmış boşluk
      padding: 12,
      borderRadius: 10,
      backgroundColor: '#2A2A2A', 
      borderLeftWidth: 4,
      borderLeftColor: '#4A90E2',
      opacity: 0.8,
      position: 'relative', // Necessary for absolute badge / Mutlak rozet için gerekli
      overflow: 'visible'   // Allow badge to hang out / Rozetin dışarı taşmasına izin ver
  },
  activeSegment: {
      backgroundColor: '#50E3C2', 
      borderLeftColor: '#FFF',
      transform: [{ scale: 1.02 }], 
      opacity: 1,
      shadowColor: "#50E3C2",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 5
  },
  
  // --- NEW BADGE STYLE ---
  // --- YENİ ROZET STİLİ ---
  flagBadge: {
      position: 'absolute',
      top: -10, // Hangs off top / Üstten sarkar
      left: -10, // Hangs off left / Soldan sarkar
      backgroundColor: '#1E1E1E', // Dark bg to pop / Öne çıkması için koyu arkaplan
      width: 26,
      height: 26,
      borderRadius: 13,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
      borderWidth: 1,
      borderColor: '#F5A623',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 2,
      elevation: 5
  },

  speakerName: {
      color: '#4A90E2',
      fontWeight: 'bold',
      fontSize: 14,
      marginLeft: 5 // Slight push for aesthetics / Estetik için hafif itme
  },
  segmentText: {
      color: '#FFF',
      fontSize: 15,
      lineHeight: 22
  },
  timeStamp: {
      fontSize: 11,
      color: '#666',
  },

  // ERROR STYLES
  errorCard: {
      backgroundColor: '#2A1515', borderRadius: 12, padding: 20, marginBottom: 20,
      alignItems: 'center', borderColor: '#FF5252', borderWidth: 1
  },
  errorTitle: { color: '#FF5252', fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  errorActions: { flexDirection: 'row', gap: 10 },
  relinkButton: { backgroundColor: '#4A90E2', padding: 10, borderRadius: 8 },
  deleteButton: { backgroundColor: '#FF5252', padding: 10, borderRadius: 8 },
  btnText: { color: 'white', fontWeight: 'bold' }
});