import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList } from 'react-native';
import { FontAwesome5, Ionicons, Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next'; // ADDED: Translation hook / EKLENDİ: Çeviri kancası

// --- CUSTOM MODULES ---
// --- ÖZEL MODÜLLER ---

// Import styles directly to avoid undefined errors
// Tanımsız hatasını önlemek için stilleri doğrudan içe aktar
import styles from '../styles/AppStyles'; 

// --- RECORDS LIST MODAL COMPONENT ---
// --- KAYIT LİSTESİ MODAL BİLEŞENİ ---
export const RecordsModal = ({ 
    visible, 
    onClose, 
    recordings, 
    onLoad, 
    onDelete, 
    onPlay, 
    onShare, 
    onRename, // New: Rename function prop / Yeni: Yeniden adlandırma fonksiyonu prop'u
    playingId, 
    isPlaying 
}) => {
    
    // Initialize Translation Hook
    // Çeviri Kancasını Başlat
    const { t } = useTranslation();

    // Ensure styles object is loaded to prevent crashes
    // Çökme yaşanmaması için styles nesnesinin yüklendiğinden emin olun
    if (!styles) return null;

    return (
        <Modal 
            visible={visible} 
            animationType="slide" 
            presentationStyle="pageSheet" 
            onRequestClose={onClose}
        >
            <View style={styles.recordsContainer}>
                
                {/* 1. HEADER SECTION */}
                {/* 1. BAŞLIK BÖLÜMÜ */}
                <View style={styles.recordsHeader}>
                    {/* TRANSLATED TITLE */}
                    {/* ÇEVRİLMİŞ BAŞLIK */}
                    <Text style={styles.recordsTitle}>{t('saved_recordings')}</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.closeText}>{t('close')}</Text>
                    </TouchableOpacity>
                </View>

                {/* 2. LIST CONTENT */}
                {/* 2. LİSTE İÇERİĞİ */}
                {recordings.length === 0 ? (
                    // --- EMPTY STATE ---
                    // --- BOŞ DURUM ---
                    <View style={styles.emptyState}>
                        <FontAwesome5 name="ghost" size={50} color="#333" />
                        {/* TRANSLATED TEXT */}
                        {/* ÇEVRİLMİŞ METİN */}
                        <Text style={{ color: '#555', marginTop: 10 }}>{t('no_recordings')}</Text>
                    </View>
                ) : (
                    // --- RECORDINGS LIST ---
                    // --- KAYIT LİSTESİ ---
                    <FlatList
                        data={recordings}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => {
                            // Check if this specific item is currently playing
                            // Bu öğenin şu anda çalıp çalmadığını kontrol et
                            const isThisPlaying = playingId === item.id && isPlaying;
                            
                            return (
                                <View style={styles.recordItem}>
                                    
                                    {/* A. PLAY/PAUSE BUTTON */}
                                    {/* A. OYNAT/DURAKLAT BUTONU */}
                                    <TouchableOpacity style={styles.recordPlayBtn} onPress={() => onPlay(item.uri, item.id)}>
                                        <FontAwesome5 name={isThisPlaying ? "pause" : "play"} size={18} color="white" />
                                    </TouchableOpacity>
                                    
                                    {/* B. FILE INFO (Click to load/select) */}
                                    {/* B. DOSYA BİLGİSİ (Seçmek için tıkla) */}
                                    <TouchableOpacity style={{ flex: 1, marginLeft: 10 }} onPress={() => onLoad(item)}>
                                        <Text style={styles.recordName} numberOfLines={1}>{item.name}</Text>
                                        <Text style={styles.recordDate}>{item.date} • {item.duration || 'Unknown'}</Text>
                                    </TouchableOpacity>
                                    
                                    {/* C. ACTIONS GROUP */}
                                    {/* C. İŞLEMLER GRUBU */}
                                    <View style={{flexDirection: 'row'}}>
                                        
                                        {/* 1. Rename Button */}
                                        {/* 1. Yeniden Adlandır Butonu */}
                                        <TouchableOpacity onPress={() => onRename(item)} style={{ padding: 10 }}>
                                            <Feather name="edit-2" size={20} color="#4A90E2" />
                                        </TouchableOpacity>

                                        {/* 2. Download/Save Button (Updated Icon: Download) */}
                                        {/* 2. İndir/Kaydet Butonu (Güncellenmiş İkon: İndir) */}
                                        <TouchableOpacity onPress={() => onShare(item.uri)} style={{ padding: 10 }}>
                                            <Feather name="download" size={20} color="#4A90E2" />
                                        </TouchableOpacity>

                                        {/* 3. Delete Button */}
                                        {/* 3. Sil Butonu */}
                                        <TouchableOpacity onPress={() => onDelete(item.id)} style={{ padding: 10 }}>
                                            <Ionicons name="trash-outline" size={20} color="#555" />
                                        </TouchableOpacity>
                                    </View>

                                </View>
                            );
                        }}
                    />
                )}
            </View>
        </Modal>
    );
};