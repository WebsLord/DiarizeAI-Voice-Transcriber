// src/screens/ResultScreen.js

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, 
    Alert, Dimensions, LayoutAnimation, Platform, UIManager, BackHandler, 
    Modal, StatusBar, TextInput, KeyboardAvoidingView, Switch, ActivityIndicator 
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av'; 
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next'; 
import { Proximity } from 'expo-sensors'; 
import * as Print from 'expo-print'; 
import * as Sharing from 'expo-sharing'; 

import { deleteAnalysis, updateAnalysis } from '../utils/resultStorage';
import { generateWord } from '../utils/wordGenerator'; // NEW IMPORT

// Enable LayoutAnimation
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ResultScreen({ route, navigation }) {
  const { data } = route.params || {};
  const { t } = useTranslation(); 

  // --- LOCAL DATA STATE ---
  const [analysisData, setAnalysisData] = useState(data);

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
  
  // --- AUDIO MODE STATE ---
  const [isEarpieceMode, setIsEarpieceMode] = useState(false);
  
  // --- PROXIMITY STATE ---
  const [isNearEar, setIsNearEar] = useState(false);

  // --- RENAME SPEAKER STATES ---
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [targetSpeaker, setTargetSpeaker] = useState("");
  const [newSpeakerName, setNewSpeakerName] = useState("");

  // --- EXPORT MODAL STATES ---
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportTheme, setExportTheme] = useState('light'); // 'light' or 'dark'
  const [isExporting, setIsExporting] = useState(false); 

  // 1. SECURITY CHECK
  if (!analysisData) {
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
      const k = (analysisData.usedSettings && analysisData.usedSettings.keywords) || analysisData.input_keywords || "";
      return k && k.trim().length > 0;
  }, [analysisData]);

  const processedSegments = useMemo(() => {
    let rawSegments = [];
    let source = analysisData.segments || 
                 analysisData.segments_json || 
                 analysisData.transcript_segments ||
                 (analysisData.result ? analysisData.result.segments : null);

    try {
        if (!source) return []; 
        if (Array.isArray(source)) {
            rawSegments = source;
        } else if (typeof source === 'string') {
            rawSegments = JSON.parse(source);
            if (typeof rawSegments === 'string') rawSegments = JSON.parse(rawSegments);
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
  }, [analysisData]); 

  const keypoints = useMemo(() => {
    try {
        if (!analysisData.keypoints && !analysisData.keypoints_json) return [];
        let src = analysisData.keypoints_json || analysisData.keypoints;
        let points = typeof src === 'string' ? JSON.parse(src) : src;
        if (typeof points === 'string') points = JSON.parse(points);
        return Array.isArray(points) ? points : [];
    } catch (e) { return []; }
  }, [analysisData]);

  const flags = useMemo(() => {
      const f = analysisData.flags || (analysisData.result ? analysisData.result.flags : []) || [];
      return Array.isArray(f) ? f : [];
  }, [analysisData]);

  // --- TOGGLE HANDLER ---
  const toggleHighlights = () => {
      if (!hasKeywords) return; 
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setShowHighlights(!showHighlights);
  };

  // --- SPEAKER RENAME HANDLERS ---
  const handleSpeakerPress = (speakerName) => {
      setTargetSpeaker(speakerName);
      setNewSpeakerName(speakerName); 
      setRenameModalVisible(true);
  };

  const confirmRename = async () => {
      if (!newSpeakerName.trim()) {
          Alert.alert(t('alert_error'), t('error_empty_name'));
          return;
      }
      const updatedSegments = processedSegments.map(seg => {
          if (seg.speaker === targetSpeaker) {
              return { ...seg, speaker: newSpeakerName };
          }
          return seg;
      });
      const updatedData = {
          ...analysisData,
          segments: updatedSegments, 
          segments_json: undefined 
      };
      setAnalysisData(updatedData); 
      setRenameModalVisible(false);
      try {
          if (updatedData.localId) {
              await updateAnalysis(updatedData.localId, { segments: updatedSegments });
          }
      } catch (error) {
          Alert.alert(t('alert_error'), t('error_save_failed'));
      }
  };

  // --- EXPORT LOGIC ---
  const performExport = async (format) => {
      if (format !== 'pdf' && format !== 'word') {
          Alert.alert(t('alert_info'), t('feature_coming_soon')); 
          return;
      }

      setIsExporting(true); 

      try {
          // --- WORD EXPORT ---
          if (format === 'word') {
              // 1. Generate base64 content using our new utility
              const base64 = await generateWord(analysisData, t, exportTheme);
              
              // 2. Save to file
              const fileName = `Analysis_${Date.now()}.docx`;
              const fileUri = `${FileSystem.documentDirectory}${fileName}`;
              await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
              
              // 3. Share
              await Sharing.shareAsync(fileUri, { 
                  UTIType: 'com.microsoft.word.doc', 
                  mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                  dialogTitle: t('export_title') 
              });
              
              setExportModalVisible(false);
              return;
          }

          // --- PDF EXPORT (Existing Logic) ---
          const isDark = exportTheme === 'dark';
          const bgColor = isDark ? '#000000' : '#ffffff'; 
          const textColor = isDark ? '#ffffff' : '#000000';
          const containerBg = isDark ? '#121212' : '#ffffff';
          const containerBorder = isDark ? '1px solid #333' : 'none';
          const h1Color = '#4A90E2';
          const h2Bg = isDark ? '#333333' : '#f0f0f0';
          const h2Color = isDark ? '#ffffff' : '#333333';
          const borderColor = isDark ? '#444' : '#ddd';

          let htmlContent = `
              <html>
              <head>
                  <meta charset="utf-8">
                  <style>
                      @page { margin: 0; }
                      body { 
                          margin: 0; padding: 0;
                          font-family: 'Helvetica', sans-serif; 
                          color: ${textColor}; 
                          background-color: ${bgColor}; 
                          -webkit-print-color-adjust: exact; 
                          print-color-adjust: exact;
                      }
                      .full-page-wrapper {
                          background-color: ${bgColor};
                          color: ${textColor};
                          width: 100%;
                          min-height: 100vh;
                          padding: 40px;
                          box-sizing: border-box;
                      }
                      .container {
                          background-color: ${containerBg};
                          padding: 20px;
                          border-radius: 8px;
                          border: ${containerBorder};
                      }
                      h1 { color: ${h1Color}; border-bottom: 2px solid ${h1Color}; padding-bottom: 10px; margin-top: 0; }
                      h2 { color: ${h2Color}; margin-top: 25px; background-color: ${h2Bg}; padding: 8px; border-radius: 4px; font-size: 18px; }
                      p { line-height: 1.6; font-size: 14px; margin-bottom: 10px; }
                      .bullet { margin-bottom: 6px; padding-left: 10px; }
                      .speaker-row { margin-top: 20px; border-bottom: 1px solid ${borderColor}; padding-bottom: 5px; margin-bottom: 8px; display: flex; align-items: center; }
                      .speaker { font-weight: bold; color: ${h1Color}; font-size: 15px; margin-right: 10px; }
                      .time { font-size: 11px; color: #888; }
                      .footer { margin-top: 60px; font-size: 10px; color: #888; text-align: center; border-top: 1px solid ${borderColor}; padding-top: 15px;}
                  </style>
              </head>
              <body>
                  <div class="full-page-wrapper">
                      <div class="container">
                          <h1>${analysisData.originalName || "Audio Analysis"}</h1>
                          <p><strong>${t('label_language')}:</strong> ${analysisData.language || "-"}</p>
                          <p><strong>${t('label_type')}:</strong> ${analysisData.conversation_type || "-"}</p>

                          <h2>${t('label_summary')}</h2>
                          <p>${(analysisData.summary || "").replace(/\n/g, "<br/>")}</p>

                          <h2>${t('label_keypoints')}</h2>
                          ${keypoints.map(k => `<div class="bullet">• ${k}</div>`).join('')}

                          <h2>${t('label_transcript')}</h2>
                          ${processedSegments.map(seg => `
                              <div class="speaker-row">
                                  <span class="speaker">${seg.speaker || t('speaker_default')}</span> 
                                  <span class="time">[${formatTime(seg.start * 1000)}]</span>
                              </div>
                              <p>${seg.text}</p>
                          `).join('')}

                          <div class="footer">
                              Generated by DiarizeAI - ${new Date().toLocaleString()}
                          </div>
                      </div>
                  </div>
              </body>
              </html>
          `;

          const { uri } = await Print.printToFileAsync({ 
              html: htmlContent,
              margins: { top: 0, bottom: 0, left: 0, right: 0 } 
          });
          
          await Sharing.shareAsync(uri, { UTIType: 'public.item', mimeType: 'application/pdf', dialogTitle: t('export_pdf_title') });
          setExportModalVisible(false); 

      } catch (error) {
          Alert.alert(t('alert_error'), t('error_export_failed'));
          console.error(error);
      } finally {
          setIsExporting(false); 
      }
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
      setAudioMode(false); 
      
      let proximitySubscription;
      if (Platform.OS === 'android') {
          const startProximity = async () => {
              try {
                Proximity.setUpdateInterval(500);
                proximitySubscription = Proximity.addListener((result) => {
                    const isNear = result.proximity; 
                    setIsNearEar(!!isNear);
                    if (isNear) {
                        setAudioMode(true); 
                    } else {
                        setAudioMode(false); 
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

  useEffect(() => {
      const backAction = () => isNearEar; 
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

  const toggleSpeaker = () => {
      const newMode = !isEarpieceMode;
      setAudioMode(newMode);
  };

  // --- FILE OPERATIONS ---
  const checkLocalFile = async () => {
      let targetPath = null;
      if (analysisData.originalName) {
          targetPath = FileSystem.documentDirectory + analysisData.originalName;
      } else if (analysisData.audio_path) {
          const fileName = analysisData.audio_path.split(/[/\\]/).pop(); 
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
          let fileName = analysisData.originalName;
          if (!fileName && analysisData.audio_path) fileName = analysisData.audio_path.split(/[/\\]/).pop();
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
              if (analysisData.localId) await deleteAnalysis(analysisData.localId);
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
          <Text style={[styles.title, {flex:1}]} numberOfLines={1}>{t('analysis_karaoke_title')}</Text>
          
          {/* EXPORT ICONS TRIGGER - ALIGNED RIGHT */}
          <TouchableOpacity 
            onPress={() => setExportModalVisible(true)} 
            style={styles.exportTrigger}
          >
              <MaterialCommunityIcons name="file-pdf-box" size={20} color="#FF5252" />
              <Text style={styles.slash}>/</Text>
              <MaterialCommunityIcons name="file-word-box" size={20} color="#4A90E2" />
              <Text style={styles.slash}>/</Text>
              <MaterialCommunityIcons name="file-powerpoint-box" size={20} color="#F5A623" />
          </TouchableOpacity>
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

                {/* AUDIO TOGGLE */}
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

        {/* SUMMARY */}
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
          
          {highlightText(analysisData.summary || t('no_summary_available'), styles.cardText)}
        </View>

        {/* INFO */}
        <View style={styles.row}>
          <View style={[styles.card, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>{t('label_type')}</Text>
            <Text style={styles.value}>{analysisData.conversation_type || t('unknown')}</Text>
          </View>
          <View style={[styles.card, { flex: 1, marginLeft: 10 }]}>
            <Text style={styles.label}>{t('label_language')}</Text>
            <Text style={styles.value}>{analysisData.language || t('unknown')}</Text>
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

        {/* TRANSCRIPT WITH EDITABLE SPEAKER */}
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
                                {/* SPEAKER NAME - CLICKABLE */}
                                <TouchableOpacity onPress={() => handleSpeakerPress(seg.speaker)} style={{flexDirection:'row', alignItems:'center'}}>
                                    <Text style={[styles.speakerName, isActive && { color: '#000' }]}>
                                        {seg.speaker || t('speaker_default')}:
                                    </Text>
                                    <MaterialIcons name="edit" size={12} color="#666" style={{marginLeft: 5, opacity: 0.7}} />
                                </TouchableOpacity>

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
                <Text style={styles.transcriptText}>{analysisData.clean_transcript || t('no_text_available')}</Text>
            )}
        </View>

      </ScrollView>

      {/* RENAME MODAL */}
      <Modal
        visible={renameModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>{t('rename_speaker_title')}</Text>
                  <Text style={styles.modalSubtitle}>{t('rename_speaker_subtitle')}: "{targetSpeaker}"</Text>
                  
                  <TextInput 
                      style={styles.input}
                      value={newSpeakerName}
                      onChangeText={setNewSpeakerName}
                      placeholder={t('placeholder_new_name')}
                      placeholderTextColor="#888"
                      autoFocus={true}
                  />

                  <View style={styles.modalButtons}>
                      <TouchableOpacity style={[styles.modalBtn, styles.btnCancel]} onPress={() => setRenameModalVisible(false)}>
                          <Text style={styles.btnText}>{t('btn_cancel')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.modalBtn, styles.btnSave]} onPress={confirmRename}>
                          <Text style={styles.btnText}>{t('btn_save')}</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </KeyboardAvoidingView>
      </Modal>

      {/* EXPORT OPTIONS MODAL */}
      <Modal
        visible={exportModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => { if (!isExporting) setExportModalVisible(false); }}
      >
          <View style={styles.bottomSheetOverlay}>
              <View style={styles.bottomSheetContent}>
                  
                  {/* LOADING OVERLAY INSIDE MODAL */}
                  {isExporting && (
                      <View style={styles.loadingOverlay}>
                          <ActivityIndicator size="large" color="#4A90E2" />
                          <Text style={{color: '#FFF', marginTop: 15, fontWeight: 'bold'}}>{t('processing')}</Text>
                      </View>
                  )}

                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>{t('export_title')}</Text>
                      <TouchableOpacity onPress={() => !isExporting && setExportModalVisible(false)}>
                          <Ionicons name="close" size={24} color={isExporting ? "#555" : "#FFF"} />
                      </TouchableOpacity>
                  </View>

                  <View style={styles.exportOptionsContainer}>
                      <TouchableOpacity 
                        style={[styles.exportOption, isExporting && {opacity: 0.5}]} 
                        onPress={() => !isExporting && performExport('pdf')}
                        disabled={isExporting}
                      >
                          <MaterialCommunityIcons name="file-pdf-box" size={32} color="#FF5252" />
                          <Text style={styles.exportOptionText}>{t('format_pdf')}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.exportOption, isExporting && {opacity: 0.5}]} 
                        onPress={() => !isExporting && performExport('word')}
                        disabled={isExporting}
                      >
                          <MaterialCommunityIcons name="file-word-box" size={32} color="#4A90E2" />
                          <Text style={styles.exportOptionText}>{t('format_word')}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.exportOption, isExporting && {opacity: 0.5}]} 
                        onPress={() => !isExporting && performExport('pptx')}
                        disabled={isExporting}
                      >
                          <MaterialCommunityIcons name="file-powerpoint-box" size={32} color="#F5A623" />
                          <Text style={styles.exportOptionText}>{t('format_pptx')}</Text>
                      </TouchableOpacity>
                  </View>

                  <View style={styles.divider} />

                  <Text style={styles.settingsTitle}>{t('label_settings')}</Text>
                  
                  <View style={styles.settingRow}>
                      <Text style={styles.settingLabel}>{t('label_theme')}</Text>
                      <View style={styles.themeSelector}>
                          <TouchableOpacity 
                             style={[styles.themeBtn, exportTheme === 'light' && styles.themeBtnActive]}
                             onPress={() => !isExporting && setExportTheme('light')}
                             disabled={isExporting}
                          >
                             <Ionicons name="sunny" size={16} color={exportTheme === 'light' ? '#333' : '#888'} />
                             <Text style={[
                                 styles.themeText, 
                                 exportTheme === 'light' && {color:'#333'} // Light mode active = Dark Text
                             ]}>{t('theme_light')}</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                             style={[styles.themeBtn, exportTheme === 'dark' && styles.themeBtnActive]}
                             onPress={() => !isExporting && setExportTheme('dark')}
                             disabled={isExporting}
                          >
                             <Ionicons name="moon" size={16} color={exportTheme === 'dark' ? '#000' : '#888'} />
                             <Text style={[
                                 styles.themeText, 
                                 exportTheme === 'dark' && {color:'#000'} // Dark mode active (White BG) = Dark Text
                             ]}>{t('theme_dark')}</Text>
                          </TouchableOpacity>
                      </View>
                  </View>

                  <TouchableOpacity style={styles.cancelButtonFull} onPress={() => setExportModalVisible(false)} disabled={isExporting}>
                      <Text style={[styles.btnText, isExporting && {color: '#888'}]}>{t('btn_cancel')}</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

      {/* PROXIMITY BLACK SCREEN (Android) */}
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
  
  // EXPORT TRIGGER BUTTON IN HEADER
  exportTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#252525',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#333',
      marginRight: 20 
  },
  slash: { color: '#666', fontSize: 16, marginHorizontal: 4, fontWeight: '300' },

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
  
  // AUDIO MODE
  audioModeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  audioModeText: { color: '#CCC', fontSize: 12, marginLeft: 6 },

  // CARDS
  card: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 15, marginBottom: 15 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: { color: '#FFF', fontSize: 18, fontWeight: '600', marginLeft: 10 },
  cardText: { color: '#CCC', fontSize: 15, lineHeight: 22 },
  transcriptText: { color: '#AAA', fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  
  // TOGGLE
  toggleButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  toggleText: { fontSize: 12, fontWeight: '600', marginLeft: 6 },

  row: { flexDirection: 'row', marginBottom: 15 },
  label: { color: '#888', fontSize: 12, marginBottom: 5 },
  value: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  bulletPoint: { flexDirection: 'row', marginBottom: 8 },
  bullet: { color: '#F5A623', fontSize: 20, marginRight: 10, lineHeight: 22 },

  // KARAOKE SEGMENTS
  segmentBox: { marginBottom: 15, padding: 12, borderRadius: 10, backgroundColor: '#2A2A2A', borderLeftWidth: 4, borderLeftColor: '#4A90E2', opacity: 0.8, position: 'relative', overflow: 'visible' },
  activeSegment: { backgroundColor: '#50E3C2', borderLeftColor: '#FFF', transform: [{ scale: 1.02 }], opacity: 1, shadowColor: "#50E3C2", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 },
  flagBadge: { position: 'absolute', top: -10, left: -10, backgroundColor: '#1E1E1E', width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', zIndex: 10, borderWidth: 1, borderColor: '#F5A623', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 2, elevation: 5 },
  speakerName: { color: '#4A90E2', fontWeight: 'bold', fontSize: 14, marginLeft: 5 },
  segmentText: { color: '#FFF', fontSize: 15, lineHeight: 22 },
  timeStamp: { fontSize: 11, color: '#666' },

  // ERROR
  errorCard: { backgroundColor: '#2A1515', borderRadius: 12, padding: 20, marginBottom: 20, alignItems: 'center', borderColor: '#FF5252', borderWidth: 1 },
  errorTitle: { color: '#FF5252', fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  errorActions: { flexDirection: 'row', gap: 10 },
  relinkButton: { backgroundColor: '#4A90E2', padding: 10, borderRadius: 8 },
  deleteButton: { backgroundColor: '#FF5252', padding: 10, borderRadius: 8 },
  btnText: { color: 'white', fontWeight: 'bold' },

  // BLACK OVERLAY
  blackOverlay: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },

  // MODAL STYLES (RENAME)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#252525', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#444' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 5, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#AAA', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#333', color: '#FFF', padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 16 },
  modalButtons: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  btnCancel: { backgroundColor: '#444' },
  btnSave: { backgroundColor: '#4A90E2' },

  // EXPORT MODAL STYLES (BOTTOM SHEET STYLE)
  bottomSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  bottomSheetContent: { backgroundColor: '#252525', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, minHeight: 300 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  exportOptionsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  exportOption: { alignItems: 'center', padding: 10 },
  exportOptionText: { color: '#FFF', marginTop: 8, fontSize: 14, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#444', marginVertical: 15 },
  settingsTitle: { color: '#888', fontSize: 14, marginBottom: 15, fontWeight: '600' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  settingLabel: { color: '#FFF', fontSize: 16 },
  themeSelector: { flexDirection: 'row', backgroundColor: '#333', borderRadius: 20, padding: 2 },
  themeBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18 },
  themeBtnActive: { backgroundColor: '#FFF' },
  themeText: { marginLeft: 5, fontSize: 12, fontWeight: '600', color: '#888' },
  cancelButtonFull: { backgroundColor: '#444', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
});