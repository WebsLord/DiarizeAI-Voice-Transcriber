import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy'; // Legacy support for SDK 54 / SDK 54 için eski sürüm desteği
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';

export const useAudioLogic = () => {
    // --- States / Durum Değişkenleri ---
    
    // Stores the file selected or recorded
    // Seçilen veya kaydedilen dosyayı tutar
    const [selectedFile, setSelectedFile] = useState(null);
    
    // Recording object from Expo AV
    // Expo AV'den gelen kayıt nesnesi
    const [recording, setRecording] = useState(null);
    
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState("00:00");
    
    // Stores decibel levels for waveform visualization
    // Waveform görselleştirmesi için desibel seviyelerini tutar
    const [metering, setMetering] = useState([]);
    
    const [permissionResponse, requestPermission] = Audio.usePermissions();
    
    // Playback States / Oynatma Durumları
    const [sound, setSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    
    // ID of the currently playing file (or 'preview')
    // Şu an çalan dosyanın ID'si (veya 'preview')
    const [playingId, setPlayingId] = useState(null);
    
    // Saved Recordings List
    // Kaydedilmiş Kayıtlar Listesi
    const [savedRecordings, setSavedRecordings] = useState([]);

    // --- Effects / Etkiler ---
    useEffect(() => {
        loadRecordings();
        // Cleanup sound when component unmounts
        // Bileşen kaldırıldığında sesi temizle
        return () => { if (sound) sound.unloadAsync(); };
    }, []);

    // --- Logic Functions / Mantık Fonksiyonları ---

    // Load recordings from phone storage
    // Telefon hafızasından kayıtları yükle
    const loadRecordings = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem('@my_recordings');
            if (jsonValue != null) setSavedRecordings(JSON.parse(jsonValue));
        } catch (e) { console.error(e); }
    };

    // Play an audio file
    // Bir ses dosyasını oynat
    const playSound = async (uri, id) => {
        try {
            // Stop current sound if exists
            // Varsa mevcut sesi durdur
            if (sound) { await sound.stopAsync(); await sound.unloadAsync(); }

            // If toggling same sound, just stop
            // Aynı sese tekrar basıldıysa, sadece durdur
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
            
            // Reset when playback finishes
            // Oynatma bitince sıfırla
            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) {
                    setIsPlaying(false);
                    setPlayingId(null);
                }
            });
        } catch (error) {
            console.error("Playback error", error);
            Alert.alert("Error", "Could not play audio file.");
        }
    };

    // Stop currently playing sound
    // Çalan sesi durdur
    const stopSound = async () => {
        if (sound) {
            await sound.stopAsync();
            setIsPlaying(false);
            setPlayingId(null);
        }
    };

    // Start a new recording
    // Yeni bir kayıt başlat
    const startRecording = async () => {
        try {
            // Check permissions
            // İzinleri kontrol et
            if (permissionResponse.status !== 'granted') await requestPermission();
            
            // Set audio mode for iOS
            // iOS için ses modunu ayarla
            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
            
            const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            
            // Update metering every 100ms
            // Metreyi her 100ms'de bir güncelle
            await recording.setProgressUpdateInterval(100);
            
            recording.setOnRecordingStatusUpdate((status) => {
                if (status.canRecord && status.isRecording) {
                    // Update timer
                    // Zamanlayıcıyı güncelle
                    const millis = status.durationMillis;
                    const minutes = Math.floor(millis / 60000);
                    const seconds = ((millis % 60000) / 1000).toFixed(0);
                    setDuration(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
                    
                    // Update waveform data
                    // Waveform verisini güncelle
                    const currentLevel = status.metering || -160;
                    setMetering((prev) => [...prev, currentLevel]);
                }
            });

            setRecording(recording);
            setIsRecording(true);
            setMetering([]); // Reset metering / Metreyi sıfırla
            setSelectedFile(null);
        } catch (err) { Alert.alert("Error", "Failed to access microphone."); }
    };

    // Stop and save recording to cache
    // Kaydı durdur ve önbelleğe kaydet
    const stopRecording = async () => {
        setIsRecording(false);
        if (!recording) return;
        
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        
        if (uri) {
            setSelectedFile({
                name: `Rec_${new Date().toLocaleTimeString().replace(/:/g, '-')}.m4a`,
                uri: uri, size: 0, mimeType: 'audio/m4a'
            });
        }
    };

    // Save current recording to permanent storage
    // Mevcut kaydı kalıcı hafızaya kaydet
    const saveRecordingToDevice = async () => {
        if (!selectedFile) return;
        try {
            const baseFolder = FileSystem.documentDirectory || FileSystem.cacheDirectory;
            if (!baseFolder) { Alert.alert("Error", "Directory not found."); return; }

            const fileName = selectedFile.name || `Rec_${Date.now()}.m4a`;
            const newPath = baseFolder + fileName;

            // Move file from cache to document directory
            // Dosyayı önbellekten belge dizinine taşı
            await FileSystem.moveAsync({ from: selectedFile.uri, to: newPath });

            const newRecord = {
                id: Date.now().toString(),
                name: fileName,
                uri: newPath,
                date: new Date().toLocaleDateString(),
                duration: duration,
                metering: metering // Save waveform data too / Waveform verisini de kaydet
            };

            const updatedList = [newRecord, ...savedRecordings];
            setSavedRecordings(updatedList);
            await AsyncStorage.setItem('@my_recordings', JSON.stringify(updatedList));

            Alert.alert("Success", "Recording saved to library!");
            setSelectedFile(null);
            setMetering([]);
        } catch (error) { Alert.alert("Error", "Could not save recording."); }
    };

    // Delete a recording
    // Bir kaydı sil
    const deleteRecording = async (id) => {
        try {
            if (playingId === id) stopSound();
            
            const recordingToDelete = savedRecordings.find(r => r.id === id);
            if (recordingToDelete) {
                // Remove file from filesystem
                // Dosyayı dosya sisteminden sil
                await FileSystem.deleteAsync(recordingToDelete.uri, { idempotent: true });
            }
            
            // Remove from list
            // Listeden çıkar
            const updatedList = savedRecordings.filter(r => r.id !== id);
            setSavedRecordings(updatedList);
            await AsyncStorage.setItem('@my_recordings', JSON.stringify(updatedList));
        } catch (error) { console.error("Delete error:", error); }
    };

    // Pick file from device storage
    // Cihaz hafızasından dosya seç
    const pickFile = async () => {
        try {
            if (selectedFile) setSelectedFile(null);
            const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
            if (result.canceled) return;
            if (result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                if (file.size / (1024 * 1024) > 50) { Alert.alert("Error", "File is too large. Max 50MB."); return; }
                setMetering([]);
                setSelectedFile(file);
            }
        } catch (error) { console.error("Error picking file:", error); }
    };

    // Load a saved recording for preview
    // Kaydedilmiş bir kaydı önizleme için yükle
    const loadFromLibrary = (item) => {
        stopSound();
        setSelectedFile({ name: item.name, uri: item.uri, size: 0, mimeType: 'audio/m4a' });
        setMetering(item.metering || []);
    };

    // Clear current selection
    // Mevcut seçimi temizle
    const clearSelection = () => {
        stopSound();
        setSelectedFile(null);
        setMetering([]);
    };

    // Share file via system dialog
    // Dosyayı sistem diyaloğu ile paylaş
    const shareFile = async () => {
        if (selectedFile?.uri && await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(selectedFile.uri);
        }
    };

    return {
        // States
        selectedFile, isRecording, duration, metering, 
        isPlaying, playingId, savedRecordings,
        
        // Actions
        startRecording, stopRecording, playSound, stopSound,
        saveRecordingToDevice, deleteRecording, pickFile,
        loadFromLibrary, clearSelection, shareFile
    };
};