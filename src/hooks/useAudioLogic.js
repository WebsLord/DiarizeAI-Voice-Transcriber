import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
// Import Encryption Library
// Şifreleme Kütüphanesini İçe Aktar
import CryptoJS from 'crypto-js';

// SECRET KEY (Should be in .env in production)
// GİZLİ ANAHTAR (Üretim aşamasında .env dosyasında olmalı)
const SECRET_KEY = "DiarizeAI-Secure-Key-v1-ChangeThisInProduction";

export const useAudioLogic = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState("00:00");
    const [metering, setMetering] = useState([]); 
    const [permissionResponse, requestPermission] = Audio.usePermissions();
    
    const [sound, setSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playingId, setPlayingId] = useState(null);
    const [savedRecordings, setSavedRecordings] = useState([]);

    useEffect(() => {
        loadRecordings();
        return () => { if (sound) sound.unloadAsync(); };
    }, []);

    // --- HELPER FUNCTIONS ---
    // --- YARDIMCI FONKSİYONLAR ---

    const saveSecurely = async (data) => {
        try {
            const jsonString = JSON.stringify(data);
            const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
            await AsyncStorage.setItem('@my_recordings', encrypted);
        } catch (e) {
            console.error("Encryption save error:", e);
        }
    };

    // --- RECORDING FUNCTIONS ---
    // --- KAYIT FONKSİYONLARI ---

    const startRecording = async () => {
        try {
            if (permissionResponse.status !== 'granted') await requestPermission();
            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
            const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            await recording.setProgressUpdateInterval(75);
            
            recording.setOnRecordingStatusUpdate((status) => {
                if (status.canRecord && status.isRecording) {
                    const millis = status.durationMillis;
                    const minutes = Math.floor(millis / 60000);
                    const seconds = ((millis % 60000) / 1000).toFixed(0);
                    setDuration(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
                    
                    const currentLevel = status.metering || -160;
                    setMetering((prev) => [...prev, currentLevel]);
                }
            });

            setRecording(recording);
            setIsRecording(true);
            setIsPaused(false);
            setMetering([]); 
            setSelectedFile(null);
        } catch (err) { Alert.alert("Error", "Failed to access microphone."); }
    };

    const pauseRecording = async () => {
        if (recording) { await recording.pauseAsync(); setIsPaused(true); }
    };

    const resumeRecording = async () => {
        if (recording) { await recording.startAsync(); setIsPaused(false); }
    };

    const stopRecording = async () => {
        setIsRecording(false);
        setIsPaused(false);
        if (!recording) return;
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        if (uri) {
            setSelectedFile({ name: `Rec_${new Date().toLocaleTimeString().replace(/:/g, '-')}.m4a`, uri: uri, size: 0, mimeType: 'audio/m4a' });
        }
    };

    const discardRecording = async () => {
        setIsRecording(false);
        setIsPaused(false);
        if (!recording) return;
        try { await recording.stopAndUnloadAsync(); } catch (error) {}
        setRecording(null);
        setMetering([]);
        setDuration("00:00");
    };

    // --- FILE OPERATIONS ---
    // --- DOSYA İŞLEMLERİ ---

    const loadRecordings = async () => {
        try {
            const storedValue = await AsyncStorage.getItem('@my_recordings');
            if (storedValue != null) {
                try {
                    const bytes = CryptoJS.AES.decrypt(storedValue, SECRET_KEY);
                    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                    setSavedRecordings(decryptedData);
                } catch (cryptoError) {
                    console.log("Migrating unencrypted data...");
                    const plainData = JSON.parse(storedValue);
                    setSavedRecordings(plainData);
                    saveSecurely(plainData);
                }
            }
        } catch (e) { console.error("Load error:", e); }
    };

    const renameRecording = async (newName) => {
        if (!selectedFile) return;
        let cleanName = newName.replace(/[^a-zA-Z0-9 \-_]/g, '').trim();
        if (cleanName.length === 0) {
            Alert.alert("Invalid Name", "Please use letters and numbers only.");
            return;
        }
        if (!cleanName.endsWith('.m4a')) cleanName += '.m4a';
        
        try {
            const oldUri = selectedFile.uri;
            const folder = oldUri.substring(0, oldUri.lastIndexOf('/') + 1);
            const newUri = folder + cleanName;
            
            await FileSystem.moveAsync({ from: oldUri, to: newUri });
            setSelectedFile(prev => ({ ...prev, name: cleanName, uri: newUri }));
            
            const updatedList = savedRecordings.map(r => 
                r.uri === oldUri ? { ...r, name: cleanName, uri: newUri } : r
            );
            setSavedRecordings(updatedList);
            await saveSecurely(updatedList);
            Alert.alert("Success", "File renamed securely.");
        } catch (error) { Alert.alert("Error", "Could not rename."); }
    };

    const saveRecordingToDevice = async () => {
        if (!selectedFile) return;
        try {
            const baseFolder = FileSystem.documentDirectory || FileSystem.cacheDirectory;
            if (!baseFolder) { Alert.alert("Error", "No folder found."); return; }
            const fileName = selectedFile.name; 
            const newPath = baseFolder + fileName;
            
            if (selectedFile.uri !== newPath) { await FileSystem.moveAsync({ from: selectedFile.uri, to: newPath }); }
            
            const newRecord = {
                id: Date.now().toString(),
                name: fileName,
                uri: newPath,
                date: new Date().toLocaleDateString(),
                duration: duration,
                metering: metering 
            };
            
            const updatedList = [newRecord, ...savedRecordings];
            setSavedRecordings(updatedList);
            await saveSecurely(updatedList);
            
            Alert.alert("Success", "Saved (Encrypted) to library!");
            setMetering([]);
            setSelectedFile(null);
        } catch (error) { Alert.alert("Error", "Save failed."); }
    };

    const deleteRecording = async (id) => {
        try {
            if (playingId === id) stopSound();
            const recordingToDelete = savedRecordings.find(r => r.id === id);
            if (recordingToDelete) { await FileSystem.deleteAsync(recordingToDelete.uri, { idempotent: true }); }
            
            const updatedList = savedRecordings.filter(r => r.id !== id);
            setSavedRecordings(updatedList);
            await saveSecurely(updatedList);
        } catch (error) { console.error("Delete error:", error); }
    };

    // --- NEW: DELETE ALL RECORDINGS ---
    // --- YENİ: TÜM KAYITLARI SİL ---
    const clearAllRecordings = async () => {
        try {
            // 1. Delete actual files
            // 1. Gerçek dosyaları sil
            for (const record of savedRecordings) {
                await FileSystem.deleteAsync(record.uri, { idempotent: true });
            }
            // 2. Clear list
            // 2. Listeyi temizle
            setSavedRecordings([]);
            // 3. Clear storage
            // 3. Hafızayı temizle
            await saveSecurely([]);
            
            return true; 
        } catch (error) {
            console.error("Clear all error:", error);
            return false;
        }
    };

    const playSound = async (uri, id) => {
        try {
            if (sound) { await sound.stopAsync(); await sound.unloadAsync(); }
            if (playingId === id && isPlaying) { setIsPlaying(false); setPlayingId(null); return; }
            const { sound: newSound } = await Audio.Sound.createAsync({ uri: uri });
            setSound(newSound);
            setPlayingId(id);
            setIsPlaying(true);
            await newSound.playAsync();
            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) { setIsPlaying(false); setPlayingId(null); }
            });
        } catch (error) { Alert.alert("Error", "Playback failed."); }
    };

    const stopSound = async () => {
        if (sound) { await sound.stopAsync(); setIsPlaying(false); setPlayingId(null); }
    };

    const pickFile = async () => {
        try {
            if (selectedFile) setSelectedFile(null);
            const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
            if (result.canceled) return;
            if (result.assets && result.assets.length > 0) {
                setMetering([]);
                setSelectedFile(result.assets[0]);
            }
        } catch (error) { console.error("Pick error:", error); }
    };

    const loadFromLibrary = (item) => {
        stopSound();
        setSelectedFile({ name: item.name, uri: item.uri, size: 0, mimeType: 'audio/m4a' });
        setMetering(item.metering || []);
    };

    const clearSelection = () => { stopSound(); setSelectedFile(null); setMetering([]); };
    
    const shareFile = async () => {
        if (selectedFile?.uri && await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(selectedFile.uri);
        }
    };

    const shareFileUri = async (uri) => {
        if (uri && await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri);
        }
    };

    return {
        selectedFile, isRecording, isPaused, duration, metering, isPlaying, playingId, savedRecordings,
        startRecording, stopRecording, pauseRecording, resumeRecording, discardRecording,
        playSound, stopSound, saveRecordingToDevice, deleteRecording, 
        clearAllRecordings, // EXPORTED NOW / ŞİMDİ DIŞA AKTARILDI
        pickFile, loadFromLibrary, clearSelection, shareFile, 
        shareFileUri, 
        renameRecording
    };
};