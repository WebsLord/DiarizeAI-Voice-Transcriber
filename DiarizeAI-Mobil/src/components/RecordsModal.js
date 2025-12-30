import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList } from 'react-native';
import { FontAwesome5, Ionicons, Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
// Use common styles
// Ortak stilleri kullan
import styles from '../styles/AppStyles'; 

// Added fontScale prop
// fontScale özelliği eklendi
export const RecordsModal = ({ 
    visible, onClose, recordings, onLoad, onDelete, onPlay, onShare, onRename, playingId, isPlaying, fontScale = 1
}) => {
    
    const { t } = useTranslation();

    if (!styles) return null;

    // Helper for dynamic font size
    // Dinamik yazı boyutu için yardımcı
    const dynamicSize = (size) => ({ fontSize: size * fontScale });

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.recordsContainer}>
                
                {/* HEADER */}
                <View style={styles.recordsHeader}>
                    <Text style={[styles.recordsTitle, dynamicSize(20)]}>{t('saved_recordings')}</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={[styles.closeText, dynamicSize(16)]}>{t('close')}</Text>
                    </TouchableOpacity>
                </View>

                {/* LIST */}
                {recordings.length === 0 ? (
                    <View style={styles.emptyState}>
                        <FontAwesome5 name="ghost" size={50} color="#333" />
                        <Text style={{ color: '#555', marginTop: 10, fontSize: 14 * fontScale }}>{t('no_recordings')}</Text>
                    </View>
                ) : (
                    <FlatList
                        data={recordings}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => {
                            const isThisPlaying = playingId === item.id && isPlaying;
                            return (
                                <View style={styles.recordItem}>
                                    <TouchableOpacity style={styles.recordPlayBtn} onPress={() => onPlay(item.uri, item.id)}>
                                        <FontAwesome5 name={isThisPlaying ? "pause" : "play"} size={18} color="white" />
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity style={{ flex: 1, marginLeft: 10 }} onPress={() => onLoad(item)}>
                                        <Text style={[styles.recordName, dynamicSize(16)]} numberOfLines={1}>{item.name}</Text>
                                        <Text style={[styles.recordDate, dynamicSize(12)]}>{item.date} • {item.duration || 'Unknown'}</Text>
                                    </TouchableOpacity>
                                    
                                    <View style={{flexDirection: 'row'}}>
                                        <TouchableOpacity onPress={() => onRename(item)} style={{ padding: 10 }}>
                                            <Feather name="edit-2" size={20} color="#4A90E2" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => onShare(item.uri)} style={{ padding: 10 }}>
                                            <Feather name="download" size={20} color="#4A90E2" />
                                        </TouchableOpacity>
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