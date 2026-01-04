// src/hooks/useAudioLogic.js

import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native'; // Platform added / Platform eklendi
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
// Import Encryption Library
// Şifreleme Kütüphanesini İçe Aktar
import CryptoJS from 'crypto-js';

// SECRET KEY DIRECTLY FROM EXPO ENVIRONMENT
// GİZLİ ANAHTAR DOĞRUDAN EXPO ORTAMINDAN
// We use 'EXPO_PUBLIC_' prefix so Expo reads it automatically (No config needed)
// Expo'nun otomatik okuması için 'EXPO_PUBLIC_' öneki kullanıyoruz (Ayar gerekmez)
const SECRET_KEY = process.env.EXPO_PUBLIC_SECRET_KEY;

export const useAudioLogic = () => {
    // Critical Security Check
    // Kritik Güvenlik Kontrolü
    if (!SECRET_KEY) {
        console.error("CRITICAL ERROR: EXPO_PUBLIC_SECRET_KEY is missing from .env file. Encryption will fail.");
    } else {
        // Debug log to confirm key is loaded (Only first few chars for security)
        // Anahtarın yüklendiğini doğrulamak için hata ayıklama günlüğü (Güvenlik için sadece ilk birkaç karakter)
        console.log("Security Key Loaded: ", SECRET_KEY.substring(0, 4) + "****");
    }

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

    // --- NEW: Check if file is saved ---
    // --- YENİ: Dosyanın kayıtlı olup olmadığını kontrol et ---
    const [isFileSaved, setIsFileSaved] = useState(false);

    useEffect(() => {
        loadRecordings();
        return () => { 
            // Cleanup on unmount
            if (sound) {
                try { sound.unloadAsync(); } catch(e) {}
            }
        };
    }, []);

    // --- NEW: Update isFileSaved Logic ---
    // --- YENİ: isFileSaved Durumunu Güncelleme Mantığı ---
    useEffect(() => {
        if (!selectedFile) {
            setIsFileSaved(false);
            return;
        }
        // Check if selected file URI matches any saved recording URI
        // Seçilen dosya URI'sinin herhangi bir kayıtlı kayıt URI'si ile eşleşip eşleşmediğini kontrol et
        const exists = savedRecordings.some(rec => 
            rec.uri === selectedFile.uri || 
            getActiveUri(rec.uri) === selectedFile.uri
        );
        setIsFileSaved(exists);
    }, [selectedFile, savedRecordings]);

    // --- HELPER FUNCTIONS ---
    // --- YARDIMCI FONKSİYONLAR ---

    // FIX: Get Active URI for iOS (Handles path changes on app updates/restarts)
    // DÜZELTME: iOS için Aktif URI al (Uygulama güncellemelerinde/yeniden başlatmalarında yol değişikliklerini yönetir)
    const getActiveUri = (savedUri) => {
        if (!savedUri) return null;
        // Android doesn't change paths, return as is
        // Android yolları değiştirmez, olduğu gibi döndür
        if (Platform.OS !== 'ios') return savedUri; 

        // If it's a temporary file (e.g. from picker/caches), don't touch it
        // Eğer geçici bir dosyaysa (örn. seçiciden/önbellekten), dokunma
        if (savedUri.includes('/tmp/') || savedUri.includes('/Caches/')) return savedUri;

        // If it looks like a saved document, reconstruct the path with current container
        // Kaydedilmiş bir belge gibi görünüyorsa, yolu mevcut kapsayıcıyla yeniden oluştur
        const fileName = savedUri.split('/').pop();
        return FileSystem.documentDirectory + fileName;
    };

    // Helper to verify file exists before operations
    // İşlemlerden önce dosyanın varlığını doğrulayan yardımcı
    const ensureFileExists = async (uri) => {
        try {
            const info = await FileSystem.getInfoAsync(uri);
            return info.exists;
        } catch (e) {
            return false;
        }
    };

    const saveSecurely = async (data) => {
        try {
            // Validate Key Existence
            // Anahtar Varlığını Doğrula
            if (!SECRET_KEY) {
                Alert.alert("Error", "Security key missing. Cannot save data.");
                return;
            }

            const jsonString = JSON.stringify(data);
            // Use key directly
            // Anahtarı doğrudan kullan
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
            
            await Audio.setAudioModeAsync({ 
                allowsRecordingIOS: true, 
                playsInSilentModeIOS: true 
            });

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
        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);
            if (uri) {
                setSelectedFile({ name: `Rec_${new Date().toLocaleTimeString().replace(/:/g, '-')}.m4a`, uri: uri, size: 0, mimeType: 'audio/m4a' });
            }
        } catch (error) {
            console.error("Stop recording error:", error);
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
                    // Check key before decrypting
                    // Şifre çözmeden önce anahtarı kontrol et
                    if (!SECRET_KEY) {
                        console.error("Encryption Key Missing during load");
                        return;
                    }

                    const bytes = CryptoJS.AES.decrypt(storedValue, SECRET_KEY);
                    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                    setSavedRecordings(decryptedData);
                } catch (cryptoError) {
                    console.error("Decryption failed (Key Mismatch?):", cryptoError);
                    
                    // AUTO-RECOVERY: If decryption fails, clear the corrupted storage
                    // OTOMATİK KURTARMA: Şifre çözme başarısız olursa, bozuk depolamayı temizle
                    console.log("Resetting storage to fix corruption...");
                    await AsyncStorage.removeItem('@my_recordings');
                    setSavedRecordings([]);
                    Alert.alert("Notice", "Security key changed. Old recordings were reset.");
                }
            }
        } catch (e) { console.error("Load error:", e); }
    };

    // REVISED RENAME LOGIC
    // REVİZE EDİLMİŞ YENİDEN ADLANDIRMA MANTIĞI
    const renameRecording = async (newName) => {
        if (!selectedFile) return;
        let cleanName = newName.replace(/[^a-zA-Z0-9 \-_]/g, '').trim();
        if (cleanName.length === 0) {
            Alert.alert("Invalid Name", "Please use letters and numbers only.");
            return;
        }
        if (!cleanName.endsWith('.m4a')) cleanName += '.m4a';
        
        // CHECK: If name is same, do nothing and return
        // KONTROL: İsim aynıysa hiçbir şey yapma ve dön
        if (selectedFile.name === cleanName) {
            console.log("Name unchanged, skipping.");
            return;
        }

        try {
            const oldUri = getActiveUri(selectedFile.uri); 
            
            // CHECK: Does source exist?
            // KONTROL: Kaynak dosya var mı?
            if (!(await ensureFileExists(oldUri))) {
                Alert.alert("Error", "Source file not found on device.");
                return;
            }

            // CRITICAL: Unload sound to release file lock
            // KRİTİK: Dosya kilidini açmak için sesi boşalt
            if (sound) {
                try {
                    await sound.stopAsync();
                    await sound.unloadAsync();
                    setSound(null);
                    setIsPlaying(false);
                    setPlayingId(null);
                } catch (e) { }
            }

            const folder = oldUri.substring(0, oldUri.lastIndexOf('/') + 1);
            const newUri = folder + cleanName;
            
            await FileSystem.moveAsync({ from: oldUri, to: newUri });
            setSelectedFile(prev => ({ ...prev, name: cleanName, uri: newUri }));
            
            const updatedList = savedRecordings.map(r => 
                // Check against both stored URI and active URI logic
                // Hem saklanan URI hem de aktif URI mantığına karşı kontrol edin
                getActiveUri(r.uri) === oldUri 
                ? { ...r, name: cleanName, uri: newUri } 
                : r
            );
            setSavedRecordings(updatedList);
            await saveSecurely(updatedList);
            Alert.alert("Success", "File renamed securely.");
        } catch (error) { 
            console.error(error);
            Alert.alert("Error", "Could not rename."); 
        }
    };

    const saveRecordingToDevice = async () => {
        if (!selectedFile) return;
        try {
            const baseFolder = FileSystem.documentDirectory || FileSystem.cacheDirectory;
            if (!baseFolder) { Alert.alert("Error", "No folder found."); return; }
            
            const fileName = selectedFile.name; 
            const newPath = baseFolder + fileName;
            
            // 1. Check if source exists (Cache)
            // 1. Kaynak dosyanın (Cache) varlığını kontrol et
            const sourceInfo = await FileSystem.getInfoAsync(selectedFile.uri);
            if (!sourceInfo.exists) {
                Alert.alert("Error", "Recording file lost in cache.");
                return;
            }

            // 2. Copy file to Documents
            // 2. Dosyayı Documents'a kopyala
            if (selectedFile.uri !== newPath) { 
                await FileSystem.copyAsync({ from: selectedFile.uri, to: newPath }); 
            }
            
            const newRecord = {
                id: Date.now().toString(),
                name: fileName,
                uri: newPath, // Save permanent path / Kalıcı yolu kaydet
                date: new Date().toLocaleDateString(),
                duration: duration,
                metering: metering 
            };
            
            const updatedList = [newRecord, ...savedRecordings];
            setSavedRecordings(updatedList);
            await saveSecurely(updatedList);
            
            // --- UPDATE SELECTED FILE TO TRIGGER 'SAVED' STATE ---
            // --- 'KAYDEDİLDİ' DURUMUNU TETİKLEMEK İÇİN SEÇİLİ DOSYAYI GÜNCELLE ---
            setSelectedFile({ ...selectedFile, uri: newPath });

            Alert.alert("Success", "Saved (Encrypted) to library!");
            setMetering([]);
            // Do NOT clear selectedFile here, keep it so user can process it immediately
            // Burada selectedFile'ı TEMİZLEME, böylece kullanıcı hemen işleyebilir
        } catch (error) { 
            console.error(error);
            Alert.alert("Error", "Save failed: " + error.message); 
        }
    };

    const deleteRecording = async (id) => {
        try {
            if (playingId === id) stopSound();
            const recordingToDelete = savedRecordings.find(r => r.id === id);
            
            if (recordingToDelete) { 
                // Fix path before deleting
                // Silmeden önce yolu düzelt
                const activeUri = getActiveUri(recordingToDelete.uri);
                if (await ensureFileExists(activeUri)) {
                    await FileSystem.deleteAsync(activeUri, { idempotent: true }); 
                }
            }
            
            const updatedList = savedRecordings.filter(r => r.id !== id);
            setSavedRecordings(updatedList);
            await saveSecurely(updatedList);
        } catch (error) { console.error("Delete error:", error); }
    };

    const clearAllRecordings = async () => {
        try {
            for (const record of savedRecordings) {
                const activeUri = getActiveUri(record.uri);
                if (await ensureFileExists(activeUri)) {
                    await FileSystem.deleteAsync(activeUri, { idempotent: true });
                }
            }
            setSavedRecordings([]);
            await saveSecurely([]);
            return true;
        } catch (error) {
            console.error("Clear all error:", error);
            return false;
        }
    };

    // --- PLAYBACK FIX ---
    // --- OYNATMA DÜZELTMESİ ---
    const playSound = async (uri, id) => {
        try {
            // Fix path before playing
            // Oynatmadan önce yolu düzelt
            const activeUri = getActiveUri(uri);
            
            // Verify file before playing
            // Oynatmadan önce dosyayı doğrula
            if (!(await ensureFileExists(activeUri))) {
                Alert.alert("Error", "File not found. It may have been deleted.");
                return;
            }

            // Set audio mode to Playback (Speakers)
            // Ses modunu Oynatma (Hoparlör) olarak ayarla
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
                staysActiveInBackground: true,
            });

            // SAFE STOP
            // GÜVENLİ DURDURMA
            if (sound) { 
                try {
                    // Check status before stopping
                    const status = await sound.getStatusAsync();
                    if (status.isLoaded) {
                        await sound.stopAsync();
                        await sound.unloadAsync();
                    }
                } catch (unloadError) {
                    // Ignore already unloaded error
                    console.log("Cleanup warning (expected):", unloadError.message);
                }
            }
            
            if (playingId === id && isPlaying) {
                setIsPlaying(false);
                setPlayingId(null);
                return;
            }

            const { sound: newSound, status } = await Audio.Sound.createAsync(
                { uri: activeUri },
                { shouldPlay: true }
            );
            
            if (status.isLoaded) {
                setSound(newSound);
                setPlayingId(id);
                setIsPlaying(true);
                
                newSound.setOnPlaybackStatusUpdate((status) => {
                    if (status.didJustFinish) { setIsPlaying(false); setPlayingId(null); }
                });
            } else {
                console.error("Sound failed to load", status);
            }

        } catch (error) { 
            console.error("Play error:", error);
            Alert.alert("Error", "Playback failed: " + error.message); 
        }
    };

    const stopSound = async () => {
        if (sound) { 
            try {
                // Check loaded state before stopping
                const status = await sound.getStatusAsync();
                if (status.isLoaded) {
                    await sound.stopAsync(); 
                }
                setIsPlaying(false); 
                setPlayingId(null); 
            } catch (e) {
                console.log("Stop warning (ignored):", e.message);
            }
        }
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

    // LOAD FROM LIBRARY FIX
    // KÜTÜPHANEDEN YÜKLEME DÜZELTMESİ
    const loadFromLibrary = (item) => {
        stopSound();
        // Fix path so Main Screen can find the file
        // Ana Ekranın dosyayı bulabilmesi için yolu düzelt
        const activeUri = getActiveUri(item.uri);
        
        setSelectedFile({ 
            ...item,
            name: item.name, 
            uri: activeUri, 
            size: 0, 
            mimeType: 'audio/m4a' 
        });
        setMetering(item.metering || []);
    };

    const clearSelection = () => { stopSound(); setSelectedFile(null); setMetering([]); };
    
    // --- SHARE FIX ---
    // --- PAYLAŞIM DÜZELTMESİ ---
    
    const shareFile = async () => {
        if (selectedFile?.uri) {
            const activeUri = getActiveUri(selectedFile.uri);
            if (await Sharing.isAvailableAsync()) {
                // Check existence before sharing
                // Paylaşmadan önce varlığını kontrol et
                if (await ensureFileExists(activeUri)) {
                    await Sharing.shareAsync(activeUri);
                } else {
                    Alert.alert("Error", "File not found to share.");
                }
            } else {
                Alert.alert("Error", "Sharing is not available.");
            }
        }
    };

    const shareFileUri = async (uri) => {
        if (!uri) {
            Alert.alert("Error", "No file URI found.");
            return;
        }
        
        // Fix path for sharing
        // Paylaşım için yolu düzelt
        const activeUri = getActiveUri(uri);

        if (await Sharing.isAvailableAsync()) {
            try {
                // Check existence before sharing
                // Paylaşmadan önce varlığını kontrol et
                if (await ensureFileExists(activeUri)) {
                    await Sharing.shareAsync(activeUri);
                } else {
                    Alert.alert("Error", "File not found to share.");
                }
            } catch (error) {
                Alert.alert("Error", "Share failed: " + error.message);
            }
        } else {
            Alert.alert("Error", "Sharing is not available.");
        }
    };

    return {
        selectedFile, isRecording, isPaused, duration, metering, isPlaying, playingId, savedRecordings,
        startRecording, stopRecording, pauseRecording, resumeRecording, discardRecording,
        playSound, stopSound, saveRecordingToDevice, deleteRecording, 
        clearAllRecordings,
        pickFile, loadFromLibrary, clearSelection, shareFile, 
        shareFileUri, 
        renameRecording,
        isFileSaved // --- EXPORT NEW STATE --- / --- YENİ DURUMU DIŞA AKTAR ---
    };
};