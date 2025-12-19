import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Main Application Component
// Ana Uygulama Bileşeni
export default function App() {

  // Function to handle file upload button press
  // Dosya yükleme butonuna basılınca çalışacak fonksiyon
  const handleUploadPress = () => {
    console.log("Upload button pressed / Yükleme butonuna basıldı");
    // We will add file picker logic here later
    // Dosya seçici mantığını buraya sonra ekleyeceğiz
  };

  // Function to handle recording button press
  // Kayıt butonuna basılınca çalışacak fonksiyon
  const handleRecordPress = () => {
    console.log("Record button pressed / Kayıt butonuna basıldı");
    // We will add microphone logic here later
    // Mikrofon mantığını buraya sonra ekleyeceğiz
  };

  return (
    // SafeAreaView ensures content is not hidden behind the notch on iOS
    // SafeAreaView, içeriğin iOS çentiğinin arkasında kalmamasını sağlar
    <SafeAreaView style={styles.container}>
      
      {/* Status Bar Settings for Dark Theme */}
      {/* Koyu Tema için Durum Çubuğu Ayarları */}
      <StatusBar style="light" />

      {/* Header Section */}
      {/* Üst Başlık Bölümü */}
      <View style={styles.header}>
        <Text style={styles.title}>Diarize AI</Text>
        <Text style={styles.subtitle}>
          Live audio now converts to text
          {'\n'}
          Canlı ses şimdi metne dönüşüyor
        </Text>
      </View>

      {/* Visualization Area (Simulated Waveform) */}
      {/* Görselleştirme Alanı (Simüle Edilmiş Ses Dalgası) */}
      <View style={styles.waveContainer}>
        {/* We use an icon specifically to match your design image */}
        {/* Tasarım görseline uyması için ikon kullanıyoruz */}
        <MaterialIcons name="graphic-eq" size={120} color="#555" />
      </View>

      {/* Action Buttons Container */}
      {/* Aksiyon Butonları Taşıyıcısı */}
      <View style={styles.controlsContainer}>
        
        {/* Upload Button */}
        {/* Yükleme Butonu */}
        <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPress}>
          <FontAwesome5 name="cloud-upload-alt" size={24} color="#A0A0A0" />
          <Text style={styles.uploadText}>Upload Audio File</Text>
        </TouchableOpacity>

        {/* Recording Button (The big red one) */}
        {/* Kayıt Butonu (Büyük kırmızı olan) */}
        <TouchableOpacity style={styles.recordButton} onPress={handleRecordPress}>
          <LinearGradient
            // Gradient for a premium look
            // Premium bir görünüm için renk geçişi
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

// Styling definitions
// Stil tanımlamaları
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark background / Koyu arka plan
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
    color: '#E0E0E0', // Off-white for better readability / Okunabilirlik için kırık beyaz
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
    opacity: 0.8,
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
    shadowRadius: 20, // Glow effect / Parlama efekti
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