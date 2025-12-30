import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  // --- Genel ---
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 10,
  },
  
  // --- Header ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
  },

  // --- Menu Modal ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#1E1E1E',
    width: 250,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  menuTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  menuItemText: {
    color: '#EEE',
    fontSize: 16,
    marginLeft: 15,
  },

  // --- Records Modal ---
  recordsContainer: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  recordsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  recordsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  recordPlayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  recordDate: {
    color: '#777',
    fontSize: 12,
    marginTop: 2,
  },

  // --- Wave / Visualizer Area ---
  waveContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  idleWaveContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
    justifyContent: 'center',
    gap: 5,
  },
  activeRecordingContainer: {
    alignItems: 'center',
    width: '100%',
  },
  timerText: {
    fontSize: 60,
    fontWeight: '200',
    color: '#fff',
    marginBottom: 20,
    fontVariant: ['tabular-nums'],
  },
  waveBarRecord: {
    width: 4,
    marginHorizontal: 2,
    borderRadius: 2,
  },
  
  // --- Preview Card ---
  filePreviewCard: {
    width: '90%',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 15,
    left: 15,
    zIndex: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
  },
  previewContent: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 75, 75, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  fileInfo: {
    alignItems: 'center',
    width: '100%',
  },
  fileNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  fileName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 200,
  },
  renameInput: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: '#4A90E2',
    textAlign: 'center',
    minWidth: 150,
  },
  editIcon: {
    marginLeft: 8,
  },
  fileStatus: {
    color: '#666',
    fontSize: 13,
    marginBottom: 15,
  },
  miniWaveformContainer: {
    height: 40,
    width: '100%',
    marginBottom: 15,
  },
  shareBtn: {
    padding: 10,
    backgroundColor: '#2A2A2A',
    borderRadius: 50,
  },

  // --- Controls / Buttons ---
  controlsContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 40,
    height: 180, 
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginBottom: 20,
  },
  uploadText: {
    color: '#A0A0A0',
    fontSize: 14,
    marginLeft: 10,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
  },
  sendButton: {
    backgroundColor: '#4A90E2',
  },
  
  // Recording Controls
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
  },
  smallControlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  recordLabel: {
    color: '#666',
    marginTop: 15,
    fontSize: 14,
    letterSpacing: 1,
  }
});