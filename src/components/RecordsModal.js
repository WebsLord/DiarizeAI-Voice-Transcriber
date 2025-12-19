import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
// Import shared styles to keep consistency
// Tutarlılığı korumak için paylaşılan stilleri içe aktar
import { styles } from '../styles/AppStyles';

// --- Records List Modal Component ---
// --- Kayıt Listesi Modal Bileşeni ---
export const RecordsModal = ({ visible, onClose, recordings, onLoad, onDelete, onPlay, playingId, isPlaying }) => {
    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.recordsContainer}>
                {/* Header / Başlık */}
                <View style={styles.recordsHeader}>
                    <Text style={styles.recordsTitle}>Saved Recordings</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.closeText}>Close</Text>
                    </TouchableOpacity>
                </View>

                {/* Empty State / Boş Durum */}
                {recordings.length === 0 ? (
                    <View style={styles.emptyState}>
                        <FontAwesome5 name="ghost" size={50} color="#333" />
                        <Text style={{ color: '#555', marginTop: 10 }}>No recordings found.</Text>
                    </View>
                ) : (
                    /* List of Recordings / Kayıt Listesi */
                    <FlatList
                        data={recordings}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => {
                            // Check if this specific item is playing
                            // Bu öğenin çalıp çalmadığını kontrol et
                            const isThisPlaying = playingId === item.id && isPlaying;
                            return (
                                <View style={styles.recordItem}>
                                    {/* Play/Pause Button / Oynat/Durdur Butonu */}
                                    <TouchableOpacity style={styles.recordPlayBtn} onPress={() => onPlay(item.uri, item.id)}>
                                        <FontAwesome5 name={isThisPlaying ? "pause" : "play"} size={18} color="white" />
                                    </TouchableOpacity>
                                    
                                    {/* Load Logic (Clicking text loads the file) */}
                                    {/* Yükleme Mantığı (Metne tıklamak dosyayı yükler) */}
                                    <TouchableOpacity style={{ flex: 1, marginLeft: 10 }} onPress={() => onLoad(item)}>
                                        <Text style={styles.recordName} numberOfLines={1}>{item.name}</Text>
                                        <Text style={styles.recordDate}>{item.date} • {item.duration || 'Unknown'}</Text>
                                    </TouchableOpacity>
                                    
                                    {/* Delete Logic / Silme Mantığı */}
                                    <TouchableOpacity onPress={() => onDelete(item.id)} style={{ padding: 10 }}>
                                        <Ionicons name="trash-outline" size={20} color="#555" />
                                    </TouchableOpacity>
                                </View>
                            );
                        }}
                    />
                )}
            </View>
        </Modal>
    );
};