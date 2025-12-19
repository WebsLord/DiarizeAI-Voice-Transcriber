import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  // --- Genel Kapsayıcı ---
  container: {
    flex: 1,
    backgroundColor: '#121212', // Koyu tema arka planı
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },

  // --- Kayıt Ekranı ve Timer ---
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
  },
  timerText: {
    fontSize: 60,
    fontWeight: '300',
    color: '#ffffff',
    letterSpacing: 2,
  },
  recordingStatusText: {
    color: '#ff4d4d', // Kayıt sırasında kırmızı "REC" yazısı için
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
    letterSpacing: 1,
  },
  pausedStatusText: {
    color: '#ffd700', // Duraklatıldığında sarı renk
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
    letterSpacing: 1,
  },

  // --- Ses Dalgası (Visualizer) ---
  visualizerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    width: '100%',
    marginBottom: 40,
    // Bar'ların taşmasını engellemek için:
    overflow: 'hidden', 
  },
  visualizerBar: {
    width: 4,
    backgroundColor: '#ff4d4d',
    marginHorizontal: 1,
    borderRadius: 2,
  },

  // --- Ana Kontroller (Kayıt Butonları) ---
  controlsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  // Büyük Kırmızı Kayıt Butonu (Başlangıç)
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ff4d4d',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#ff4d4d',
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  
  // Kayıt Sırasındaki Alt Kontroller (Durdur, Pause, İptal)
  activeRecordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  // Küçük Yuvarlak Butonlar (Pause, Çöp Kutusu vb.)
  secondaryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Ortadaki Kare Stop Butonu
  stopButton: {
    width: 70,
    height: 70,
    borderRadius: 10, // Karemsi görünüm
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
  },

  // --- Önizleme / Seçilen Dosya Alanı ---
  previewContainer: {
    backgroundColor: '#1e1e1e',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  fileName: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF', // Mavi Kaydet butonu
  },
  
  // --- Liste (Kayıtlı Dosyalar) ---
  listContainer: {
    flex: 1,
    width: '100%',
    marginTop: 10,
  },
  listHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#aaa',
    marginBottom: 10,
    paddingLeft: 10,
  },
  card: {
    backgroundColor: '#1e1e1e',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  cardDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 5,
  },

  // --- Yardımcı ---
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 20,
  }
});