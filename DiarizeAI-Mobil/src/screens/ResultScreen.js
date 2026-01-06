// src/screens/ResultScreen.js

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Dimensions, LayoutAnimation, Platform, UIManager, BackHandler, Modal, StatusBar } from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av'; 
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next'; 
import { Proximity } from 'expo-sensors'; 

import { deleteAnalysis } from '../utils/resultStorage';

// Enable LayoutAnimation for smooth toggle
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ResultScreen({ route, navigation }) {
  const { data } = route.params || {};
  const { t } = useTranslation(); 

  // --- AUDIO REFS & STATES ---
  const soundRef = useRef(null); 
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  
  // --- FILE STATES ---
  const [localUri, setLocalUri] = useState(null);
  const [isFileMissing, setIsFileMissing] = useState(false);

  // --- UI STATES ---
  const [showHighlights, setShowHighlights] = useState(true);
  
  // --- AUDIO MODE STATE (Speaker vs Earpiece) ---
  const [isEarpieceMode, setIsEarpieceMode] = useState(false);
  
  // --- PROXIMITY STATE (Android Only) ---
  const [isNearEar, setIsNearEar] = useState(false);

  // 1. SECURITY CHECK
  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>{t('data_not_found')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.button}>
          <Text style={styles.buttonText}>{t('go_back')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- 2. DATA PREPARATION ---
  const hasKeywords = useMemo(() => {
      const k = (data.usedSettings && data.usedSettings.keywords) || data.input_keywords || "";
      return k && k.trim().length > 0;
  }, [data]);

  const processedSegments = useMemo(() => {
    let rawSegments = [];
    let source = data.segments || data.segments_json || data.transcript_segments || (data.result ? data.result.segments : null);

    try {
        if (!source) return []; 
        if (typeof source === 'string') {
            rawSegments = JSON.parse(source);
            if (typeof rawSegments === 'string') rawSegments = JSON.parse(rawSegments);
        } else {
            rawSegments = source;
        }
        if (!Array.isArray(rawSegments)) return [];

        return rawSegments.map(seg => ({
            ...seg,
            start: parseFloat(seg.start || seg.start_time || 0), 
            end: parseFloat(seg.end || seg.end_time || 0)
        }));
    } catch (e) {
        console.log("Segment parse error:", e);
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

  const flags = useMemo(() => {
      const f = data.flags || (data.result ? data.result.flags : []) || [];
      return Array.isArray(f) ? f : [];
  }, [data]);

  // --- TOGGLE HANDLER ---
  const toggleHighlights = () => {
      if (!hasKeywords) return; 
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setShowHighlights(!showHighlights);
  };

  // --- MARKDOWN PARSER ---
  const highlightText = (text, baseStyle) => {
      if (!text) return null;
      if (!hasKeywords) {
          return <Text style={baseStyle}>{text.replace(/\*\*/g, '')}</Text>;
      }
      const parts = text.split(/\*\*(.*?)\*\*/g);
      return (
          <Text style={baseStyle}>
              {parts.map((part, index) => {
                  if (index % 2 === 1) {
                      return showHighlights ? (
                          <Text key={index} style={{ 
                              backgroundColor: 'rgba(255, 193, 7, 0.25)', 
                              color: '#FFC107', 
                              fontWeight: 'bold',
                          }}>{part}</Text>
                      ) : (
                          <Text key={index}>{part}</Text>
                      );
                  } else {
                      return <Text key={index}>{part}</Text>;
                  }
              })}
          </Text>
      );
  };

  // --- 3. LIFECYCLE & SENSORS ---
  useEffect(() => {
      checkLocalFile();
      setAudioMode(false); // Default to speaker
      
      let proximitySubscription;
      
      // --- ANDROID AUTOMATION ---
      if (Platform.OS === 'android') {
          const startProximity = async () => {
              try {
                Proximity.setUpdateInterval(500);
                proximitySubscription = Proximity.addListener((result) => {
                    const isNear = result.proximity; 
                    setIsNearEar(!!isNear);
                    
                    if (isNear) {
                        setAudioMode(true); // Ear
                    } else {
                        setAudioMode(false); // Speaker
                        pauseIfPlaying(); 
                    }
                });
              } catch (err) {
                  console.log("Sensor error:", err);
              }
          };
          startProximity();
      }

      return () => {
        if (soundRef.current) {
          soundRef.current.stopAsync();
          soundRef.current.unloadAsync();
        }
        if (proximitySubscription) proximitySubscription.remove();
      };
  }, []); 

  // --- 4. BACK BUTTON LOCK (ANDROID) ---
  useEffect(() => {
      const backAction = () => {
          return isNearEar; 
      };
      const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
      return () => backHandler.remove();
  }, [isNearEar]);

  // --- AUDIO ROUTING HELPER ---
  const setAudioMode = async (earpieceOn) => {
      setIsEarpieceMode(earpieceOn);
      try {
          await Audio.setAudioModeAsync({
              allowsRecordingIOS: earpieceOn, 
              playsInSilentModeIOS: true,
              staysActiveInBackground: true,
              playThroughEarpieceAndroid: earpieceOn, 
              interruptionModeIOS: InterruptionModeIOS.DoNotMix,
              interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          });
      } catch (e) {
          console.log("Audio Switch Error:", e);
      }
  };

  const pauseIfPlaying = async () => {
      if (soundRef.current) {
          const status = await soundRef.current.getStatusAsync();
          if (status.isPlaying) {
              await soundRef.current.pauseAsync();
              setIsPlaying(false);
          }
      }
  };

  // --- MANUAL TOGGLE (For iOS mainly) ---
  const toggleSpeaker = () => {
      const newMode = !isEarpieceMode;
      setAudioMode(newMode);
  };

  // --- FILE OPERATIONS ---
  const checkLocalFile = async () => {
      let targetPath = null;
      if (data.originalName) {
          targetPath = FileSystem.documentDirectory + data.originalName;
      } else if (data.audio_path) {
          const fileName = data.audio_path.split(/[/\\]/).pop(); 
          targetPath = FileSystem.documentDirectory + fileName;
      }

      if (!targetPath) { setLocalUri(null); setIsFileMissing(true); return; }

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
      if (soundRef.current) await soundRef.current.unloadAsync();
      const { sound: newSound, status } = await Audio.Sound.createAsync(
          { uri }, 
          { shouldPlay: false }
      );
      soundRef.current = newSound; 
      setDuration(status.durationMillis);
      await newSound.setProgressUpdateIntervalAsync(50);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (!isSeeking) setPosition(status.positionMillis);
          setIsPlaying(status.isPlaying);
          if (status.didJustFinish) { setIsPlaying(false); newSound.setPositionAsync(0); }
        }
      });
    } catch (error) { console.log("Sound load error:", error); }
  };

  // --- CONTROLS ---
  const handlePlayPause = async () => {
    const sound = soundRef.current;
    if (!sound) return;
    if (isPlaying) await sound.pauseAsync();
    else await sound.playAsync();
  };

  const handleSlidingStart = () => setIsSeeking(true);
  const handleSlidingComplete = async (value) => {
      const sound = soundRef.current;
      if (sound) { await sound.setPositionAsync(value); setPosition(value); }
      setIsSeeking(false);
  };

  const handleSegmentPress = async (startTimeSeconds) => {
    const sound = soundRef.current;
    if (sound && !isFileMissing) {
      try {
          await sound.setPositionAsync(startTimeSeconds * 1000);
          setPosition(startTimeSeconds * 1000); 
          if (!isPlaying) await sound.playAsync();
      } catch (error) { console.log("Seek error:", error); }
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
              Alert.alert(t('alert_warning'), t('alert_duration_mismatch'));
          }
          await performRelink(pickedFile);
      } catch (error) { Alert.alert(t('alert_error'), error.message); }
  };

  const performRelink = async (pickedFile) => {
      try {
          let fileName = data.originalName;
          if (!fileName && data.audio_path) fileName = data.audio_path.split(/[/\\]/).pop();
          if (!fileName) return;
          const targetPath = FileSystem.documentDirectory + fileName;
          await FileSystem.copyAsync({ from: pickedFile.uri, to: targetPath });
          Alert.alert(t('alert_success'), t('alert_file_relinked'));
          checkLocalFile(); 
      } catch (e) { Alert.alert(t('alert_error'), e.message); }
  };

  const handleDeleteAnalysis = async () => {
      Alert.alert(t('alert_delete_title'), t('alert_delete_confirm'), [
          { text: t('cancel'), style: "cancel" },
          { text: t('delete'), style: "destructive", onPress: async () => {
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

  const getToggleColor = () => {
      if (!hasKeywords) return "#555"; 
      return showHighlights ? "#FFC107" : "#888";
  };

  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('analysis_karaoke_title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* PLAYER CARD */}
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

                {/* --- AUDIO OUTPUT TOGGLE --- */}
                <View style={{flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10}}>
                    <TouchableOpacity onPress={toggleSpeaker} style={styles.audioModeBtn}>
                        <Ionicons 
                            name={isEarpieceMode ? "ear" : "volume-high"} 
                            size={18} 
                            color="#CCC" 
                        />
                        <Text style={styles.audioModeText}>
                            {isEarpieceMode ? t('audio_mode_earpiece') : t('audio_mode_speaker')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        ) : (
            <View style={styles.errorCard}>
                <Ionicons name="alert-circle" size={40} color="#FF5252" />
                <Text style={styles.errorTitle}>{t('error_audio_missing')}</Text>
                <View style={styles.errorActions}>
                    <TouchableOpacity style={styles.relinkButton} onPress={handleRelinkFile}>
                        <Text style={styles.btnText}>{t('btn_relink_file')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAnalysis}>
                        <Ionicons name="trash" size={18} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        )}

        {/* --- SUMMARY CARD WITH TOGGLE --- */}
        <View style={styles.card}>
          <View style={[styles.cardHeader, { justifyContent: 'space-between' }]}> 
            <View style={{flexDirection:'row', alignItems:'center'}}>
                <Ionicons name="document-text-outline" size={24} color="#4A90E2" />
                <Text style={styles.cardTitle}>{t('label_summary')}</Text>
            </View>
            
            <TouchableOpacity 
                onPress={toggleHighlights} 
                disabled={!hasKeywords}
                style={[
                    styles.toggleButton,
                    !hasKeywords && { opacity: 0.4, borderColor: '#333' }
                ]}
            >
                <Ionicons 
                    name={showHighlights ? "eye" : "eye-off"} 
                    size={16} 
                    color={getToggleColor()} 
                />
                <Text style={[styles.toggleText, { color: getToggleColor() }]}>
                    {showHighlights ? t('hide_highlights') : t('show_highlights')}
                </Text>
            </TouchableOpacity>
          </View>
          
          {highlightText(data.summary || t('no_summary_available'), styles.cardText)}
        </View>

        {/* INFO */}
        <View style={styles.row}>
          <View style={[styles.card, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>{t('label_type')}</Text>
            <Text style={styles.value}>{data.conversation_type || t('unknown')}</Text>
          </View>
          <View style={[styles.card, { flex: 1, marginLeft: 10 }]}>
            <Text style={styles.label}>{t('label_language')}</Text>
            <Text style={styles.value}>{data.language || t('unknown')}</Text>
          </View>
        </View>

        {/* KEY POINTS */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="list-outline" size={24} color="#F5A623" />
            <Text style={styles.cardTitle}>{t('label_keypoints')}</Text>
          </View>
          {keypoints.map((point, index) => (
              <View key={index} style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                {highlightText(point, styles.cardText)}
              </View>
          ))}
        </View>

        {/* TRANSCRIPT */}
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Ionicons name="chatbubbles-outline" size={24} color="#50E3C2" />
                <Text style={styles.cardTitle}>{t('label_transcript')}</Text>
            </View>

            {processedSegments.length > 0 ? (
                processedSegments.map((seg, index) => {
                    const currentSec = position / 1000;
                    const isActive = currentSec >= seg.start && currentSec <= seg.end;
                    const hasFlag = flags.some(flagTime => flagTime >= seg.start && flagTime <= seg.end);
                    
                    return (
                        <TouchableOpacity 
                            key={index} 
                            style={[styles.segmentBox, isActive && styles.activeSegment]}
                            onPress={() => handleSegmentPress(seg.start)}
                            activeOpacity={0.7}
                        >
                            {hasFlag && (
                                <View style={styles.flagBadge}>
                                    <Ionicons name="flag" size={14} color="#F5A623" />
                                </View>
                            )}

                            <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom: 5}}>
                                <Text style={[styles.speakerName, isActive && { color: '#000' }]}>
                                    {seg.speaker || t('speaker_default')}:
                                </Text>
                                <Text style={[styles.timeStamp, isActive && { color: '#333' }]}>
                                    {formatTime(seg.start * 1000)}
                                </Text>
                            </View>
                            
                            {highlightText(
                                seg.text, 
                                [styles.segmentText, isActive && { color: '#000', fontWeight: '600' }]
                            )}
                        </TouchableOpacity>
                    );
                })
            ) : (
                <Text style={styles.transcriptText}>{data.clean_transcript || t('no_text_available')}</Text>
            )}
        </View>

      </ScrollView>

      {/* --- PROXIMITY MODAL --- */}
      {Platform.OS === 'android' && (
          <Modal 
            visible={isNearEar} 
            transparent={false} 
            animationType="fade"
            statusBarTranslucent={true} 
          >
              <StatusBar hidden={true} />
              <View style={styles.blackOverlay}>
                  <Ionicons name="ear" size={64} color="#333" />
              </View>
          </Modal>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  backButton: { marginRight: 15, padding: 5 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  
  // PLAYER
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
  playerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playBtn: {
      width: 45, height: 45, borderRadius: 25, backgroundColor: '#4A90E2',
      alignItems: 'center', justifyContent: 'center', marginRight: 10
  },
  timeText: { color: '#CCC', fontSize: 12, fontVariant: ['tabular-nums'], width: 40, textAlign: 'center' },
  
  // AUDIO MODE BUTTON
  audioModeBtn: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', 
      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15
  },
  audioModeText: { color: '#CCC', fontSize: 12, marginLeft: 6 },

  // CARDS
  card: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 15, marginBottom: 15 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: { color: '#FFF', fontSize: 18, fontWeight: '600', marginLeft: 10 },
  cardText: { color: '#CCC', fontSize: 15, lineHeight: 22 },
  transcriptText: { color: '#AAA', fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  
  // TOGGLE BUTTON STYLE
  toggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.05)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#333'
  },
  toggleText: {
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 6
  },

  row: { flexDirection: 'row', marginBottom: 15 },
  label: { color: '#888', fontSize: 12, marginBottom: 5 },
  value: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  bulletPoint: { flexDirection: 'row', marginBottom: 8 },
  bullet: { color: '#F5A623', fontSize: 20, marginRight: 10, lineHeight: 22 },

  // KARAOKE SEGMENTS
  segmentBox: {
      marginBottom: 15, padding: 12, borderRadius: 10,
      backgroundColor: '#2A2A2A', borderLeftWidth: 4, borderLeftColor: '#4A90E2',
      opacity: 0.8, position: 'relative', overflow: 'visible'   
  },
  activeSegment: {
      backgroundColor: '#50E3C2', borderLeftColor: '#FFF',
      transform: [{ scale: 1.02 }], opacity: 1,
      shadowColor: "#50E3C2", shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5, shadowRadius: 10, elevation: 5
  },
  flagBadge: {
      position: 'absolute', top: -10, left: -10, backgroundColor: '#1E1E1E', 
      width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center',
      zIndex: 10, borderWidth: 1, borderColor: '#F5A623',
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 2, elevation: 5
  },
  speakerName: { color: '#4A90E2', fontWeight: 'bold', fontSize: 14, marginLeft: 5 },
  segmentText: { color: '#FFF', fontSize: 15, lineHeight: 22 },
  timeStamp: { fontSize: 11, color: '#666' },

  // ERROR
  errorCard: {
      backgroundColor: '#2A1515', borderRadius: 12, padding: 20, marginBottom: 20,
      alignItems: 'center', borderColor: '#FF5252', borderWidth: 1
  },
  errorTitle: { color: '#FF5252', fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  errorActions: { flexDirection: 'row', gap: 10 },
  relinkButton: { backgroundColor: '#4A90E2', padding: 10, borderRadius: 8 },
  deleteButton: { backgroundColor: '#FF5252', padding: 10, borderRadius: 8 },
  btnText: { color: 'white', fontWeight: 'bold' },

  // BLACK OVERLAY STYLE
  blackOverlay: {
      flex: 1,
      backgroundColor: '#000',
      justifyContent: 'center',
      alignItems: 'center',
  }
});