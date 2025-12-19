import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // Main container holding the app
  // Uygulamayı tutan ana kapsayıcı
  container: { 
      flex: 1, 
      backgroundColor: '#121212', // Dark background / Koyu arka plan
      alignItems: 'center', 
      justifyContent: 'space-between', 
      paddingVertical: 50 
  },

  // Header section with title and menu
  // Başlık ve menünün olduğu üst kısım
  header: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      width: '100%', 
      paddingHorizontal: 20, 
      marginTop: 20, 
      zIndex: 10 // Ensures header stays on top / Başlığın en üstte kalmasını sağlar
  },
  
  title: { 
      fontSize: 28, 
      fontWeight: 'bold', 
      color: '#E0E0E0', 
      letterSpacing: 1 
  },
  
  subtitle: { 
      color: '#777', 
      fontSize: 12 
  },
  
  menuButton: { 
      padding: 10, 
      zIndex: 20 // Clickable area priority / Tıklanabilir alan önceliği
  }, 

  // --- Menu Modal Styles / Menü Modal Stilleri ---
  modalOverlay: { 
      flex: 1, 
      backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background / Yarı saydam arka plan
      justifyContent: 'flex-start', 
      alignItems: 'flex-end' 
  },
  
  menuContainer: { 
      width: 200, 
      backgroundColor: '#1E1E1E', 
      marginTop: 100, 
      marginRight: 20, 
      borderRadius: 15, 
      padding: 15, 
      borderWidth: 1, 
      borderColor: '#333' 
  },
  
  menuTitle: { 
      color: '#555', 
      fontWeight: 'bold', 
      marginBottom: 15, 
      fontSize: 16 
  },
  
  menuItem: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      paddingVertical: 12, 
      borderBottomWidth: 1, 
      borderBottomColor: '#2A2A2A' 
  },
  
  menuItemText: { 
      color: '#E0E0E0', 
      marginLeft: 10, 
      fontSize: 16 
  },
  
  // --- Records List Styles / Kayıt Listesi Stilleri ---
  recordsContainer: { 
      flex: 1, 
      backgroundColor: '#121212', 
      padding: 20 
  },
  
  recordsHeader: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: 20, 
      marginTop: 20 
  },
  
  recordsTitle: { 
      color: 'white', 
      fontSize: 24, 
      fontWeight: 'bold' 
  },
  
  closeText: { 
      color: '#4A90E2', 
      fontSize: 16 
  },
  
  emptyState: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center' 
  },
  
  recordItem: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: '#1E1E1E', 
      padding: 10, 
      borderRadius: 12, 
      marginBottom: 10, 
      borderWidth: 1, 
      borderColor: '#333' 
  },
  
  // Play button inside the list
  // Liste içindeki oynat butonu
  recordPlayBtn: { 
      width: 40, 
      height: 40, 
      borderRadius: 20, 
      backgroundColor: '#333', 
      justifyContent: 'center', 
      alignItems: 'center', 
      borderWidth: 1, 
      borderColor: '#444' 
  },
  
  recordName: { 
      color: 'white', 
      fontWeight: 'bold', 
      fontSize: 16 
  },
  
  recordDate: { 
      color: '#777', 
      fontSize: 12, 
      marginTop: 4 
  },
  
  // --- Waveform Area / Ses Dalgası Alanı ---
  waveContainer: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      width: '90%', 
      minHeight: 200 
  },
  
  idleWaveContainer: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: 100 
  },
  
  activeRecordingContainer: { 
      width: '100%', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#1E1E1E', 
      padding: 20, 
      borderRadius: 20, 
      borderWidth: 1, 
      borderColor: '#333' 
  },
  
  timerText: { 
      color: '#FF4B4B', 
      fontSize: 24, 
      fontWeight: 'bold', 
      marginBottom: 15, 
      fontVariant: ['tabular-nums'] // Prevents numbers from jumping / Sayıların zıplamasını engeller
  },
  
  waveBarRecord: { 
      width: 4, 
      borderRadius: 2, 
      marginHorizontal: 1, 
      backgroundColor: '#FF4B4B' 
  },
  
  // --- File Preview Card / Dosya Önizleme Kartı ---
  filePreviewCard: { 
      width: '100%', 
      backgroundColor: '#1E1E1E', 
      borderRadius: 16, 
      borderWidth: 1, 
      borderColor: '#333', 
      padding: 16, 
      position: 'relative' 
  },
  
  backButton: { 
      position: 'absolute', 
      top: 10, 
      left: 10, 
      zIndex: 10, 
      padding: 5 
  },
  
  closeButton: { 
      position: 'absolute', 
      top: 10, 
      right: 10, 
      zIndex: 10, 
      backgroundColor: '#2A2A2A', 
      borderRadius: 15, 
      padding: 4 
  },
  
  previewContent: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      marginTop: 20 
  },
  
  iconContainer: { 
      width: 50, 
      height: 50, 
      backgroundColor: '#2A2A2A', 
      borderRadius: 10, 
      justifyContent: 'center', 
      alignItems: 'center', 
      marginRight: 15 
  },
  
  fileInfo: { 
      flex: 1, 
      justifyContent: 'center' 
  },
  
  fileName: { 
      color: 'white', 
      fontSize: 16, 
      fontWeight: 'bold', 
      marginBottom: 4 
  },
  
  fileStatus: { 
      color: '#777', 
      fontSize: 12 
  },
  
  miniWaveformContainer: { 
      height: 40, 
      marginTop: 8, 
      width: '100%', 
      opacity: 0.9, 
      justifyContent: 'center' 
  },
  
  shareBtn: { 
      padding: 10 
  },

  // --- Controls / Kontroller ---
  controlsContainer: { 
      width: '100%', 
      alignItems: 'center', 
      marginBottom: 30 
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
      borderColor: '#333' 
  },
  
  actionButton: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      paddingVertical: 12, 
      paddingHorizontal: 20, 
      borderRadius: 20, 
      borderWidth: 1, 
      borderColor: '#333' 
  },
  
  sendButton: { 
      backgroundColor: '#2ecc71', 
      borderColor: '#27ae60' 
  },
  
  uploadText: { 
      color: '#A0A0A0', 
      marginLeft: 10, 
      fontSize: 16, 
      fontWeight: '600' 
  },
  
  recordLabel: { 
      color: '#555', 
      marginTop: 15, 
      fontSize: 12 
  },
});