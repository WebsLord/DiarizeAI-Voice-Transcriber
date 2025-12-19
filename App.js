import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker'; // Secure file picker / Güvenli dosya seçici

// Main Application Component
// Ana Uygulama Bileşeni
export default function App() {
  
  // State to hold selected file information
  // Seçilen dosya bilgilerini tutacak durum değişkeni
  const [selectedFile, setSelectedFile] = useState(null);

  // FEATURE 1: Function to pick an audio file from the device
  // ÖZELLİK 1: Cihazdan ses dosyası seçme fonksiyonu
  const handleUploadPress = async () => {
    try {
      console.log("Opening document picker... / Dosya seçici açılıyor...");
      
      // We restrict selection to audio files only for security and UX
      // Güvenlik ve kullanıcı deneyimi için sadece ses dosyalarına izin veriyoruz
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*', 
        copyToCacheDirectory: true, // Cache for performance / Performans için önbelleğe al
      });

      // Check if the user canceled the action
      // Kullanıcının işlemi iptal edip etmediğini kontrol et
      if (result.canceled) {
        console.log("User canceled file selection / Kullanıcı dosya seçimini iptal etti");
        return;
      }

      // If a file is selected successfully
      // Eğer dosya başarıyla seçildiyse
      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Security Check: File Size Limit (e.g., 50MB)
        // Güvenlik Kontrolü: Dosya Boyutu Limiti (örn. 50MB)
        // This prevents users from crashing the app with huge files
        const fileSizeInMB = file.size / (1024 * 1024);
        if (fileSizeInMB > 50) {
            Alert.alert("Error / Hata", "File is too large. Max 50MB allowed. / Dosya çok büyük. Maksimum 50MB izin veriliyor.");
            return;
        }

        setSelectedFile(file);
        console.log("File selected:", file.name);
      }

    } catch (error) {
      console.error("Error picking file: / Dosya seçerken hata:", error);
      Alert.alert("Error", "Could not pick the file. / Dosya seçilemedi.");
    }
  };

  // Function to remove selected file
  // Seçilen dosyayı kaldırma fonksiyonu
  const clearSelection = () => {
    setSelectedFile(null);
  };

  // Placeholder for recording feature
  const handleRecordPress = () => {
    Alert.alert("Coming Soon / Yakında", "Recording feature is next! / Kayıt özelliği sırada!");
  };

  return (
    // SafeAreaView ensures content is not hidden behind the notch on iOS/Android
    // SafeAreaView, içeriğin çentiklerin arkasında kalmamasını sağlar
    <SafeAreaView style={styles.container}>
      
      <StatusBar style="light" />

      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>Diarize AI</Text>
        <Text style={styles.subtitle}>
          Live audio now converts to text
          {'\n'}
          Canlı ses şimdi metne dönüşüyor
        </Text>
      </View>

      {/* Visualization Area */}
      <View style={styles.waveContainer}>
        {/* Dynamic View: Show file info if selected, else show equalizer icon */}
        {/* Dinamik Görünüm: Dosya seçildiyse bilgileri, yoksa ekolayzer ikonunu göster */}
        {selectedFile ? (
            <View style={styles.filePreview}>
                <Ionicons name="musical-note" size={80} color="#FF4B4B" />
                <Text style={styles.fileName}>{selectedFile.name}</Text>
                <Text style={styles.fileSize}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</Text>
                
                <TouchableOpacity onPress={clearSelection} style={styles.removeButton}>
                    <Text style={styles.removeText}>Cancel / İptal</Text>
                </TouchableOpacity>
            </View>
        ) : (
            <MaterialIcons name="graphic-eq" size={120} color="#555" />
        )}
      </View>

      {/* Action Buttons Container */}
      <View style={styles.controlsContainer}>
        
        {/* BUTTON 1: Upload/Select Button */}
        {/* Conditional Rendering: Change functionality based on state */}
        {!selectedFile ? (
            <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPress}>
            <FontAwesome5 name="cloud-upload-alt" size={24} color="#A0A0A0" />
            <Text style={styles.uploadText}>Select Audio File / Ses Dosyası Seç</Text>
            </TouchableOpacity>
        ) : (
            // If file is selected, this button becomes "Process"
            // Dosya seçiliyse bu buton "İşle" butonuna dönüşür
            <TouchableOpacity style={[styles.uploadButton, styles.sendButton]} onPress={() => Alert.alert("Ready", "Ready to send to API / API'ye gönderilmeye hazır")}>
            <FontAwesome5 name="paper-plane" size={24} color="white" />
            <Text style={[styles.uploadText, {color: 'white'}]}>Process File / Dosyayı İşle</Text>
            </TouchableOpacity>
        )}

        {/* BUTTON 2: Recording Button (Visual only for now) */}
        <TouchableOpacity style={styles.recordButton} onPress={handleRecordPress}>
          <LinearGradient
            colors={['#FF4B4B', '#FF0000']}
            style={styles.recordGradient}
          >
            <MaterialIcons name="mic" size={40} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.recordLabel}>Tap to Record / Kayıt için Dokun</Text>
      </View>

    </SafeAreaView>
  );
}

// Styling definitions / Stil tanımlamaları
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark Theme Background
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#E0E0E0', 
    letterSpacing: 1,
  },
  subtitle: {
    color: '#777',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
  waveContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.9,
    width: '80%',
  },
  filePreview: {
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    width: '100%',
  },
  fileName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  fileSize: {
    color: '#777',
    fontSize: 12,
    marginTop: 5,
  },
  removeButton: {
    marginTop: 15,
    padding: 5,
  },
  removeText: {
    color: '#FF4B4B',
    fontSize: 14,
  },
  controlsContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#333',
  },
  sendButton: {
    backgroundColor: '#2ecc71', // Green
    borderColor: '#27ae60',
  },
  uploadText: {
    color: '#A0A0A0',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  recordButton: {
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  recordGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#2A2A2A',
  },
  recordLabel: {
    color: '#555',
    marginTop: 15,
    fontSize: 12,
  },
});