import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Alert, FlatList } from 'react-native';
import { Ionicons, MaterialIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../services/i18n'; 

// Props updated: recordings array and fontScale props added
// Güncellenen özellikler: recordings dizisi ve fontScale özellikleri eklendi
export const SettingsModal = ({ 
    visible, onClose, recordings, recordCount, onClearAll, fontScale, onChangeFontScale 
}) => {
    const { t, i18n } = useTranslation();
    
    // States: 'main', 'language', 'storage', 'about', 'text_size'
    const [currentView, setCurrentView] = useState('main');

    const changeLanguage = (langCode) => {
        i18n.changeLanguage(langCode); 
        setCurrentView('main'); 
    };

    const handleClearAll = () => {
        Alert.alert(
            t('clear_all'), 
            t('clear_all_confirm'),
            [{ text: t('btn_cancel'), style: 'cancel' }, { text: t('btn_yes'), style: 'destructive', onPress: onClearAll }]
        );
    };

    const goBack = () => { setCurrentView('main'); };

    // Helper for dynamic font size
    // Dinamik yazı boyutu için yardımcı
    const dynamicSize = (size) => ({ fontSize: size * fontScale });

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
                        {currentView === 'language' ? t('language') : 
                         currentView === 'text_size' ? t('text_size') :
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
                        <ScrollView>
                            {/* Text Size */}
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

                            {/* Language */}
                            <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('language')}>
                                <View style={styles.menuIconBox}><Ionicons name="language" size={22} color="#4A90E2" /></View>
                                <View style={styles.menuTexts}>
                                    <Text style={[styles.menuTitle, dynamicSize(16)]}>{t('language')}</Text>
                                    <Text style={[styles.menuSubtitle, dynamicSize(13)]}>{LANGUAGES.find(l => l.code === i18n.language)?.label || 'English'}</Text>
                                </View>
                                <Feather name="chevron-right" size={20} color="#666" />
                            </TouchableOpacity>

                            {/* Storage */}
                            <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('storage')}>
                                <View style={[styles.menuIconBox, {backgroundColor: 'rgba(46, 204, 113, 0.1)'}]}><MaterialIcons name="storage" size={22} color="#2ecc71" /></View>
                                <View style={styles.menuTexts}>
                                    <Text style={[styles.menuTitle, dynamicSize(16)]}>{t('storage')}</Text>
                                    <Text style={[styles.menuSubtitle, dynamicSize(13)]}>{t('manage_recordings')}</Text>
                                </View>
                                <Feather name="chevron-right" size={20} color="#666" />
                            </TouchableOpacity>

                             {/* About */}
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

                    {/* 2. TEXT SIZE SELECTION */}
                    {currentView === 'text_size' && (
                        <View style={styles.centerView}>
                            <TouchableOpacity style={[styles.sizeOption, fontScale === 1.0 && styles.activeSizeOption]} onPress={() => onChangeFontScale(1.0)}>
                                <Text style={{color: '#FFF', fontSize: 16}}>Aa</Text>
                                <Text style={{color: '#AAA', fontSize: 12, marginTop: 5}}>{t('size_normal')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.sizeOption, fontScale === 1.2 && styles.activeSizeOption]} onPress={() => onChangeFontScale(1.2)}>
                                <Text style={{color: '#FFF', fontSize: 24}}>Aa</Text>
                                <Text style={{color: '#AAA', fontSize: 12, marginTop: 5}}>{t('size_large')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.sizeOption, fontScale === 1.4 && styles.activeSizeOption]} onPress={() => onChangeFontScale(1.4)}>
                                <Text style={{color: '#FFF', fontSize: 32}}>Aa</Text>
                                <Text style={{color: '#AAA', fontSize: 12, marginTop: 5}}>{t('size_huge')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* 3. LANGUAGE LIST */}
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

                    {/* 4. STORAGE SCREEN WITH LIST */}
                    {/* 4. LİSTELİ DEPOLAMA EKRANI */}
                    {currentView === 'storage' && (
                        <View style={{flex: 1}}>
                            <View style={styles.statBox}>
                                <Text style={[styles.statNumber, dynamicSize(48)]}>{recordCount}</Text>
                                <Text style={[styles.statLabel, dynamicSize(14)]}>{t('total_files')}</Text>
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
                                        <Text style={[styles.fileName, dynamicSize(15)]} numberOfLines={1}>{item.name}</Text>
                                        <Text style={styles.fileSize}>{item.duration}</Text>
                                    </View>
                                )}
                                ListEmptyComponent={<Text style={{color: '#555', textAlign: 'center', marginTop: 20}}>{t('no_recordings')}</Text>}
                            />
                            
                            <TouchableOpacity style={styles.dangerButton} onPress={handleClearAll}>
                                <Ionicons name="trash-bin" size={20} color="#FFF" />
                                <Text style={[styles.dangerButtonText, dynamicSize(16)]}>{t('clear_all')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* 5. ABOUT SCREEN */}
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

    // Size Options
    sizeOption: { width: '100%', padding: 20, backgroundColor: '#1E1E1E', marginBottom: 10, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    activeSizeOption: { borderColor: '#e67e22', borderWidth: 2 },

    // Storage Styles
    statBox: { alignItems: 'center', marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
    statNumber: { fontWeight: 'bold', color: '#4A90E2' },
    statLabel: { color: '#888', marginTop: 5 },
    sectionHeader: { color: '#888', fontSize: 14, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
    fileRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
    fileName: { color: '#DDD', flex: 1, marginLeft: 10 },
    fileSize: { color: '#666', fontSize: 13 },
    dangerButton: { flexDirection: 'row', backgroundColor: '#FF4B4B', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 },
    dangerButtonText: { color: '#FFF', fontWeight: 'bold' },

    // About Styles
    centerView: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    logoBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    aboutTitle: { fontWeight: 'bold', color: '#FFF', marginBottom: 5 },
    aboutVersion: { color: '#888', marginBottom: 40 },
    devBox: { alignItems: 'center' },
    devLabel: { color: '#666' },
    devName: { color: '#CCC', fontWeight: '600', marginTop: 5 }
});