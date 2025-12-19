import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList } from 'react-native';
import { FontAwesome5, Ionicons, Feather } from '@expo/vector-icons';

// --- HATA BURADAYDI, DÜZELTİLDİ ---
// { styles } değil, direkt styles olarak çekiyoruz.
// Dosya yolu '../styles/AppStyles' çünkü components klasöründen bir geri çıkıp styles'a giriyoruz.
import styles from '../styles/AppStyles'; 

export const RecordsModal = ({ visible, onClose, recordings, onLoad, onDelete, onPlay, onShare, playingId, isPlaying }) => {
    // styles nesnesinin yüklendiğinden emin olalım (Hata önleyici)
    if (!styles) return null;

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.recordsContainer}>
                <View style={styles.recordsHeader}>
                    <Text style={styles.recordsTitle}>Saved Recordings</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.closeText}>Close</Text>
                    </TouchableOpacity>
                </View>

                {recordings.length === 0 ? (
                    <View style={styles.emptyState}>
                        <FontAwesome5 name="ghost" size={50} color="#333" />
                        <Text style={{ color: '#555', marginTop: 10 }}>No recordings found.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={recordings}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => {
                            const isThisPlaying = playingId === item.id && isPlaying;
                            return (
                                <View style={styles.recordItem}>
                                    {/* Oynat Butonu */}
                                    <TouchableOpacity style={styles.recordPlayBtn} onPress={() => onPlay(item.uri, item.id)}>
                                        <FontAwesome5 name={isThisPlaying ? "pause" : "play"} size={18} color="white" />
                                    </TouchableOpacity>
                                    
                                    {/* Dosya Bilgisi */}
                                    <TouchableOpacity style={{ flex: 1, marginLeft: 10 }} onPress={() => onLoad(item)}>
                                        <Text style={styles.recordName} numberOfLines={1}>{item.name}</Text>
                                        <Text style={styles.recordDate}>{item.date} • {item.duration || 'Unknown'}</Text>
                                    </TouchableOpacity>
                                    
                                    {/* Paylaş Butonu */}
                                    <TouchableOpacity onPress={() => onShare(item.uri)} style={{ padding: 10 }}>
                                        <Feather name="folder" size={20} color="#4A90E2" />
                                    </TouchableOpacity>

                                    {/* Sil Butonu */}
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