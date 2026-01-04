// src/components/SettingsModal.js

import React, { useState, useEffect, useMemo } from 'react';
import { 
    Modal, View, Text, TouchableOpacity, StyleSheet, 
    ScrollView, SafeAreaView, Alert, FlatList, ActivityIndicator 
} from 'react-native';
import { Ionicons, MaterialIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../services/i18n'; 
import { getSavedAnalyses, deleteMultipleAnalyses, clearAllAnalyses } from '../utils/resultStorage';

// Props updated: Added 'onDeleteRecording' for audio deletion
// Güncellenen özellikler: Ses silme işlemi için 'onDeleteRecording' eklendi
export const SettingsModal = ({ 
    visible, onClose, recordings, recordCount, onClearAll, 
    fontScale, onChangeFontScale, onDeleteRecording 
}) => {
    const { t, i18n } = useTranslation();
    
    // View States
    const [currentView, setCurrentView] = useState('main');
    
    // Storage Management States
    const [summaries, setSummaries] = useState([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]); // Array of IDs
    const [loadingStorage, setLoadingStorage] = useState(false);

    // --- EFFECT: Load summaries when entering storage view ---
    // --- EFFECT: Depolama görünümüne girildiğinde özetleri yükle ---
    useEffect(() => {
        if (currentView === 'storage') {
            loadSummaries();
        } else {
            // Reset selection mode when leaving storage
            setIsSelectionMode(false);
            setSelectedItems([]);
        }
    }, [currentView]);

    const loadSummaries = async () => {
        setLoadingStorage(true);
        const data = await getSavedAnalyses();
        setSummaries(data);
        setLoadingStorage(false);
    };

    // --- MERGE DATA: Combine Recordings (Audio) + Summaries (Text) ---
    // --- VERİ BİRLEŞTİRME: Kayıtlar (Ses) + Özetler (Metin) ---
    const combinedData = useMemo(() => {
        // Format Audios
        const audioList = recordings.map(rec => ({
            id: rec.id, // Ensure Audio objects have 'id'
            type: 'audio',
            name: rec.name || "Audio Recording",
            date: rec.date || new Date().toISOString(), // Fallback date
            duration: rec.duration,
            original: rec
        }));

        // Format Summaries
        const summaryList = summaries.map(sum => ({
            id: sum.localId, // Ensure Summary objects have 'localId'
            type: 'summary',
            name: sum.originalName || "Analysis Result",
            date: sum.savedAt,
            duration: (sum.language || "??").toUpperCase(), // Show lang instead of duration
            original: sum
        }));

        // Merge and Sort by Date (Newest first)
        return [...audioList, ...summaryList].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [recordings, summaries]);


    // --- SELECTION LOGIC ---
    
    const toggleSelection = (id) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(prev => prev.filter(item => item !== id));
        } else {
            setSelectedItems(prev => [...prev, id]);
        }
    };

    const handleLongPress = (id) => {
        if (!isSelectionMode) {
            setIsSelectionMode(true);
            setSelectedItems([id]);
        }
    };

    const handlePress = (id) => {
        if (isSelectionMode) {
            toggleSelection(id);
        } else {
            // Normal tap logic (Maybe preview? Currently does nothing as requested)
            // Normal dokunma mantığı (Belki önizleme? Şu an istendiği gibi hiçbir şey yapmıyor)
        }
    };

    // --- BULK DELETE ---
    const handleBulkDelete = () => {
        Alert.alert(
            t('delete_selected') || "Delete Selected", 
            `${selectedItems.length} items will be deleted. Are you sure?`,
            [
                { text: t('btn_cancel'), style: 'cancel' },
                { 
                    text: t('btn_delete'), 
                    style: 'destructive',
                    onPress: performBulkDelete 
                }
            ]
        );
    };

    const performBulkDelete = async () => {
        // Split IDs by type
        const audioIdsToDelete = [];
        const summaryIdsToDelete = [];

        combinedData.forEach(item => {
            if (selectedItems.includes(item.id)) {
                if (item.type === 'audio') audioIdsToDelete.push(item.id);
                else summaryIdsToDelete.push(item.id);
            }
        });

        // 1. Delete Summaries
        if (summaryIdsToDelete.length > 0) {
            await deleteMultipleAnalyses(summaryIdsToDelete);
            await loadSummaries(); // Refresh list
        }

        // 2. Delete Audios
        // Note: We need to find the full recording object or uri to delete properly
        if (audioIdsToDelete.length > 0 && onDeleteRecording) {
            // Loop through and delete (assuming parent handles state update)
            audioIdsToDelete.forEach(id => {
                const rec = recordings.find(r => r.id === id);
                if (rec) onDeleteRecording(rec.uri || rec.fileUri); // Pass URI usually
            });
        }

        setIsSelectionMode(false);
        setSelectedItems([]);
    };

    const handleClearAllStorage = async () => {
        Alert.alert(
            t('clear_all'), 
            t('clear_all_confirm'),
            [
                { text: t('btn_cancel'), style: 'cancel' },
                { 
                    text: t('btn_yes'), 
                    style: 'destructive', 
                    onPress: async () => {
                        // Clear Audio
                        onClearAll(); 
                        // Clear Summaries
                        await clearAllAnalyses();
                        await loadSummaries();
                    } 
                }
            ]
        );
    };

    // --- UTILS ---
    const changeLanguage = (langCode) => {
        i18n.changeLanguage(langCode); 
        setCurrentView('main'); 
    };

    const goBack = () => { 
        if (isSelectionMode) {
            setIsSelectionMode(false);
            setSelectedItems([]);
        } else {
            setCurrentView('main'); 
        }
    };

    const dynamicSize = (size) => ({ fontSize: size * fontScale });

    // --- RENDER ITEM ---
    const renderStorageItem = ({ item }) => {
        const isSelected = selectedItems.includes(item.id);
        const isAudio = item.type === 'audio';

        return (
            <TouchableOpacity 
                style={[
                    styles.fileRow, 
                    isSelected && styles.selectedRow
                ]}
                onLongPress={() => handleLongPress(item.id)}
                onPress={() => handlePress(item.id)}
                delayLongPress={300}
            >
                {/* Selection Checkbox */}
                {isSelectionMode && (
                    <View style={styles.selectionBox}>
                        {isSelected ? (
                            <Ionicons name="checkbox" size={24} color="#4A90E2" />
                        ) : (
                            <Ionicons name="square-outline" size={24} color="#555" />
                        )}
                    </View>
                )}

                {/* Icon */}
                <View style={[
                    styles.iconBox, 
                    isAudio ? styles.iconAudio : styles.iconSummary
                ]}>
                    <FontAwesome5 
                        name={isAudio ? "file-audio" : "file-alt"} 
                        size={16} 
                        color={isAudio ? "#4A90E2" : "#F5A623"} 
                    />
                </View>

                {/* Info */}
                <View style={styles.fileInfo}>
                    <Text style={[styles.fileName, dynamicSize(15)]} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text style={styles.fileDate}>
                        {new Date(item.date).toLocaleDateString()} • {item.duration}
                    </Text>
                </View>

                {/* Type Label (Optional) */}
                <View style={styles.typeTag}>
                    <Text style={[styles.typeText, {color: isAudio ? '#4A90E2' : '#F5A623'}]}>
                        {isAudio ? "AUDIO" : "TEXT"}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={styles.container}>
                
                {/* HEADER */}
                <View style={styles.header}>
                    {currentView !== 'main' ? (
                        <TouchableOpacity onPress={goBack} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                    ) : <View style={{width: 24}} />}
                    
                    <Text style={[styles.headerTitle, dynamicSize(20)]}>
                        {isSelectionMode ? `${selectedItems.length} Selected` :
                         currentView === 'language' ? t('language') : 
                         currentView === 'text_size' ? t('text_size') :
                         currentView === 'storage' ? t('storage') :
                         currentView === 'about' ? t('about') : t('settings')}
                    </Text>

                    {isSelectionMode ? (
                        <TouchableOpacity onPress={handleBulkDelete} style={styles.bulkDeleteButton}>
                             <Ionicons name="trash" size={24} color="#FF4B4B" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#FFF" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* CONTENT */}
                <View style={styles.content}>
                    
                    {/* 1. MAIN MENU */}
                    {currentView === 'main' && (
                        <ScrollView>
                            {/* ... (Existing Menu Items - No Changes) ... */}
                            <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('text_size')}>
                                <View style={[styles.menuIconBox, {backgroundColor: 'rgba(230, 126, 34, 0.1)'}]}><Ionicons name="text" size={22} color="#e67e22" /></View>
                                <View style={styles.menuTexts}>
                                    <Text style={[styles.menuTitle, dynamicSize(16)]}>{t('text_size')}</Text>
                                    <Text style={[styles.menuSubtitle, dynamicSize(13)]}>
                                        {fontScale === 1 ? t('size_normal') : fontScale === 1.2 ? t('size_large') : t('size_huge')}
                                    </Text>
                                </View>
                                <Feather name="chevron-right" size={20} color="#666" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('language')}>
                                <View style={styles.menuIconBox}><Ionicons name="language" size={22} color="#4A90E2" /></View>
                                <View style={styles.menuTexts}>
                                    <Text style={[styles.menuTitle, dynamicSize(16)]}>{t('language')}</Text>
                                    <Text style={[styles.menuSubtitle, dynamicSize(13)]}>{LANGUAGES.find(l => l.code === i18n.language)?.label || 'English'}</Text>
                                </View>
                                <Feather name="chevron-right" size={20} color="#666" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('storage')}>
                                <View style={[styles.menuIconBox, {backgroundColor: 'rgba(46, 204, 113, 0.1)'}]}><MaterialIcons name="storage" size={22} color="#2ecc71" /></View>
                                <View style={styles.menuTexts}>
                                    <Text style={[styles.menuTitle, dynamicSize(16)]}>{t('storage')}</Text>
                                    <Text style={[styles.menuSubtitle, dynamicSize(13)]}>{t('manage_recordings')}</Text>
                                </View>
                                <Feather name="chevron-right" size={20} color="#666" />
                            </TouchableOpacity>

                             <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('about')}>
                                <View style={[styles.menuIconBox, {backgroundColor: 'rgba(255, 75, 75, 0.1)'}]}><Ionicons name="information-circle-outline" size={24} color="#FF4B4B" /></View>
                                <View style={styles.menuTexts}>
                                    <Text style={[styles.menuTitle, dynamicSize(16)]}>{t('about')}</Text>
                                    <Text style={[styles.menuSubtitle, dynamicSize(13)]}>{t('version')}</Text>
                                </View>
                                <Feather name="chevron-right" size={20} color="#666" />
                            </TouchableOpacity>
                        </ScrollView>
                    )}

                    {/* 2. TEXT SIZE SELECTION (No Changes) */}
                    {currentView === 'text_size' && (
                        <View style={styles.centerView}>
                            {[1.0, 1.2, 1.4].map(scale => (
                                <TouchableOpacity key={scale} style={[styles.sizeOption, fontScale === scale && styles.activeSizeOption]} onPress={() => onChangeFontScale(scale)}>
                                    <Text style={{color: '#FFF', fontSize: 16 * scale}}>Aa</Text>
                                    <Text style={{color: '#AAA', fontSize: 12, marginTop: 5}}>
                                        {scale === 1 ? t('size_normal') : scale === 1.2 ? t('size_large') : t('size_huge')}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* 3. LANGUAGE LIST (No Changes) */}
                    {currentView === 'language' && (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {LANGUAGES.map((lang) => (
                                <TouchableOpacity key={lang.code} style={[styles.langItem, i18n.language === lang.code && styles.activeLangItem]} onPress={() => changeLanguage(lang.code)}>
                                    <Text style={styles.flag}>{lang.flag}</Text>
                                    <Text style={[styles.langName, dynamicSize(16), i18n.language === lang.code && styles.activeLangText]}>{lang.label}</Text>
                                    {i18n.language === lang.code && <Ionicons name="checkmark-circle" size={24} color="#4A90E2" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    {/* 4. STORAGE SCREEN (OVERHAULED) */}
                    {currentView === 'storage' && (
                        <View style={{flex: 1}}>
                            <View style={styles.statBox}>
                                <Text style={[styles.statNumber, dynamicSize(48)]}>{combinedData.length}</Text>
                                <Text style={[styles.statLabel, dynamicSize(14)]}>{t('total_files')}</Text>
                                <Text style={{color:'#666', fontSize:12, marginTop:4}}>
                                    (Audio: {recordings.length} | Text: {summaries.length})
                                </Text>
                            </View>

                            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
                                <Text style={styles.sectionHeader}>{t('file_list')}</Text>
                                {!isSelectionMode && combinedData.length > 0 && (
                                    <Text style={{color:'#666', fontSize:11}}>Long press to select</Text>
                                )}
                            </View>
                            
                            {loadingStorage ? (
                                <ActivityIndicator size="large" color="#4A90E2" style={{marginTop: 50}} />
                            ) : (
                                <FlatList 
                                    data={combinedData}
                                    keyExtractor={item => item.id}
                                    style={{flex: 1, marginBottom: 20}}
                                    renderItem={renderStorageItem}
                                    ListEmptyComponent={<Text style={{color: '#555', textAlign: 'center', marginTop: 20}}>{t('no_recordings')}</Text>}
                                />
                            )}
                            
                            {!isSelectionMode && (
                                <TouchableOpacity style={styles.dangerButton} onPress={handleClearAllStorage}>
                                    <Ionicons name="trash-bin" size={20} color="#FFF" />
                                    <Text style={[styles.dangerButtonText, dynamicSize(16)]}>{t('clear_all')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* 5. ABOUT SCREEN (No Changes) */}
                    {currentView === 'about' && (
                         <View style={styles.centerView}>
                            <View style={styles.logoBox}><FontAwesome5 name="microphone-alt" size={40} color="#4A90E2" /></View>
                            <Text style={[styles.aboutTitle, dynamicSize(24)]}>{t('app_title')}</Text>
                            <Text style={[styles.aboutVersion, dynamicSize(16)]}>{t('version')}</Text>
                            <View style={styles.devBox}>
                                <Text style={[styles.devLabel, dynamicSize(14)]}>{t('developer')}</Text>
                                <Text style={[styles.devName, dynamicSize(18)]}>{t('developer_name')}</Text>
                            </View>
                        </View>
                    )}

                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
    headerTitle: { fontWeight: 'bold', color: '#fff' },
    backButton: { padding: 5 },
    closeButton: { padding: 5, backgroundColor: '#333', borderRadius: 20 },
    bulkDeleteButton: { padding: 5, backgroundColor: 'rgba(255, 75, 75, 0.1)', borderRadius: 20 },
    content: { padding: 20, flex: 1 },

    menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', padding: 15, borderRadius: 12, marginBottom: 12 },
    menuIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(74, 144, 226, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    menuTexts: { flex: 1 },
    menuTitle: { color: '#FFF', fontWeight: '600' },
    menuSubtitle: { color: '#888', marginTop: 2 },

    langItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#222' },
    activeLangItem: { backgroundColor: '#1E1E1E', borderRadius: 10, borderBottomWidth: 0 },
    flag: { fontSize: 24, marginRight: 15 },
    langName: { color: '#CCC', flex: 1 },
    activeLangText: { color: '#FFF', fontWeight: 'bold' },

    sizeOption: { width: '100%', padding: 20, backgroundColor: '#1E1E1E', marginBottom: 10, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    activeSizeOption: { borderColor: '#e67e22', borderWidth: 2 },

    // Storage Styles (Updated)
    statBox: { alignItems: 'center', marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
    statNumber: { fontWeight: 'bold', color: '#4A90E2' },
    statLabel: { color: '#888', marginTop: 5 },
    sectionHeader: { color: '#888', fontSize: 14, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
    
    fileRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
    selectedRow: { backgroundColor: 'rgba(74, 144, 226, 0.1)', borderRadius: 8, paddingHorizontal: 5 },
    
    selectionBox: { marginRight: 10 },
    iconBox: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    iconAudio: { backgroundColor: 'rgba(74, 144, 226, 0.1)' },
    iconSummary: { backgroundColor: 'rgba(245, 166, 35, 0.1)' },

    fileInfo: { flex: 1 },
    fileName: { color: '#DDD', fontWeight: '500' },
    fileDate: { color: '#666', fontSize: 12, marginTop: 2 },
    
    typeTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: '#222' },
    typeText: { fontSize: 10, fontWeight: 'bold' },

    dangerButton: { flexDirection: 'row', backgroundColor: '#FF4B4B', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 },
    dangerButtonText: { color: '#FFF', fontWeight: 'bold' },

    centerView: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    logoBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    aboutTitle: { fontWeight: 'bold', color: '#FFF', marginBottom: 5 },
    aboutVersion: { color: '#888', marginBottom: 40 },
    devBox: { alignItems: 'center' },
    devLabel: { color: '#666' },
    devName: { color: '#CCC', fontWeight: '600', marginTop: 5 }
});