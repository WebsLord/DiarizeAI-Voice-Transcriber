import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Alert, FlatList } from 'react-native';
import { Ionicons, MaterialIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../services/i18n'; 

// Props updated: 'recordings' array is now passed, not just count
// Güncellenen özellikler: 'recordings' dizisi artık sadece sayı değil, tam liste olarak geçiliyor
export const SettingsModal = ({ visible, onClose, recordings, onClearAll }) => {
    const { t, i18n } = useTranslation();
    const [currentView, setCurrentView] = useState('main');

    const changeLanguage = (langCode) => {
        i18n.changeLanguage(langCode); 
        setCurrentView('main'); 
    };

    // Handle "Clear All" logic
    // "Tümünü Sil" mantığını yönet
    const handleClearAll = () => {
        Alert.alert(
            t('clear_all'), 
            t('clear_all_confirm'),
            [
                { text: t('btn_cancel'), style: 'cancel' },
                { text: t('btn_yes'), style: 'destructive', onPress: onClearAll }
            ]
        );
    };

    const goBack = () => { setCurrentView('main'); };

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
                    
                    <Text style={styles.headerTitle}>
                        {currentView === 'language' ? t('language') : 
                         currentView === 'storage' ? t('storage') :
                         currentView === 'about' ? t('about') : t('settings')}
                    </Text>

                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* CONTENT */}
                <View style={styles.content}>
                    
                    {/* 1. MAIN MENU */}
                    {currentView === 'main' && (
                        <View>
                            <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('language')}>
                                <View style={styles.menuIconBox}><Ionicons name="language" size={22} color="#4A90E2" /></View>
                                <View style={styles.menuTexts}>
                                    <Text style={styles.menuTitle}>{t('language')}</Text>
                                    <Text style={styles.menuSubtitle}>{LANGUAGES.find(l => l.code === i18n.language)?.label || 'English'}</Text>
                                </View>
                                <Feather name="chevron-right" size={20} color="#666" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('storage')}>
                                <View style={[styles.menuIconBox, {backgroundColor: 'rgba(46, 204, 113, 0.1)'}]}><MaterialIcons name="storage" size={22} color="#2ecc71" /></View>
                                <View style={styles.menuTexts}>
                                    <Text style={styles.menuTitle}>{t('storage')}</Text>
                                    <Text style={styles.menuSubtitle}>{t('manage_recordings')}</Text>
                                </View>
                                <Feather name="chevron-right" size={20} color="#666" />
                            </TouchableOpacity>

                             <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('about')}>
                                <View style={[styles.menuIconBox, {backgroundColor: 'rgba(255, 75, 75, 0.1)'}]}><Ionicons name="information-circle-outline" size={24} color="#FF4B4B" /></View>
                                <View style={styles.menuTexts}>
                                    <Text style={styles.menuTitle}>{t('about')}</Text>
                                    <Text style={styles.menuSubtitle}>{t('version')}</Text>
                                </View>
                                <Feather name="chevron-right" size={20} color="#666" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* 2. LANGUAGE LIST */}
                    {currentView === 'language' && (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {LANGUAGES.map((lang) => (
                                <TouchableOpacity key={lang.code} style={[styles.langItem, i18n.language === lang.code && styles.activeLangItem]} onPress={() => changeLanguage(lang.code)}>
                                    <Text style={styles.flag}>{lang.flag}</Text>
                                    <Text style={[styles.langName, i18n.language === lang.code && styles.activeLangText]}>{lang.label}</Text>
                                    {i18n.language === lang.code && <Ionicons name="checkmark-circle" size={24} color="#4A90E2" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    {/* 3. STORAGE SCREEN (Updated with List) */}
                    {/* 3. DEPOLAMA EKRANI (Liste ile güncellendi) */}
                    {currentView === 'storage' && (
                        <View style={{flex: 1}}>
                            <View style={styles.statBox}>
                                <Text style={styles.statNumber}>{recordings.length}</Text>
                                <Text style={styles.statLabel}>{t('total_files')}</Text>
                            </View>

                            <Text style={styles.sectionHeader}>{t('file_list')}</Text>
                            
                            {/* File List */}
                            {/* Dosya Listesi */}
                            <FlatList 
                                data={recordings}
                                keyExtractor={item => item.id}
                                style={{flex: 1, marginBottom: 20}}
                                renderItem={({item}) => (
                                    <View style={styles.fileRow}>
                                        <FontAwesome5 name="file-audio" size={16} color="#666" />
                                        <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
                                        <Text style={styles.fileSize}>{item.duration}</Text>
                                    </View>
                                )}
                                ListEmptyComponent={<Text style={{color: '#555', textAlign: 'center', marginTop: 20}}>{t('no_recordings')}</Text>}
                            />
                            
                            <TouchableOpacity style={styles.dangerButton} onPress={handleClearAll}>
                                <Ionicons name="trash-bin" size={20} color="#FFF" />
                                <Text style={styles.dangerButtonText}>{t('clear_all')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* 4. ABOUT SCREEN */}
                    {currentView === 'about' && (
                        <View style={styles.centerView}>
                            <View style={styles.logoBox}><FontAwesome5 name="microphone-alt" size={40} color="#4A90E2" /></View>
                            <Text style={styles.aboutTitle}>{t('app_title')}</Text>
                            <Text style={styles.aboutVersion}>{t('version')}</Text>
                            <View style={styles.devBox}>
                                <Text style={styles.devLabel}>{t('developer')}</Text>
                                <Text style={styles.devName}>{t('developer_name')}</Text>
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
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    backButton: { padding: 5 },
    closeButton: { padding: 5, backgroundColor: '#333', borderRadius: 20 },
    content: { padding: 20, flex: 1 },

    menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', padding: 15, borderRadius: 12, marginBottom: 12 },
    menuIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(74, 144, 226, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    menuTexts: { flex: 1 },
    menuTitle: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    menuSubtitle: { color: '#888', fontSize: 13, marginTop: 2 },

    langItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#222' },
    activeLangItem: { backgroundColor: '#1E1E1E', borderRadius: 10, borderBottomWidth: 0 },
    flag: { fontSize: 24, marginRight: 15 },
    langName: { color: '#CCC', fontSize: 16, flex: 1 },
    activeLangText: { color: '#FFF', fontWeight: 'bold' },

    // Storage Styles
    statBox: { alignItems: 'center', marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
    statNumber: { fontSize: 48, fontWeight: 'bold', color: '#4A90E2' },
    statLabel: { fontSize: 14, color: '#888', marginTop: 5 },
    sectionHeader: { color: '#888', fontSize: 14, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
    fileRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
    fileName: { color: '#DDD', flex: 1, marginLeft: 10, fontSize: 15 },
    fileSize: { color: '#666', fontSize: 13 },
    dangerButton: { flexDirection: 'row', backgroundColor: '#FF4B4B', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 },
    dangerButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

    // About Styles
    centerView: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    logoBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    aboutTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 5 },
    aboutVersion: { fontSize: 16, color: '#888', marginBottom: 40 },
    devBox: { alignItems: 'center' },
    devLabel: { fontSize: 14, color: '#666' },
    devName: { fontSize: 18, color: '#CCC', fontWeight: '600', marginTop: 5 }
});