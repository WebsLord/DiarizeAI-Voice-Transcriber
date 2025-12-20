import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
// Import the language list we created
// Oluşturduğumuz dil listesini içe aktar
import { LANGUAGES } from '../services/i18n'; 

export const SettingsModal = ({ visible, onClose }) => {
    // Hook for translation functions
    // Çeviri fonksiyonları için kanca
    const { t, i18n } = useTranslation();
    
    // State to track current view: 'main' or 'language'
    // Mevcut görünümü takip eden durum: 'main' (ana) veya 'language' (dil)
    const [currentView, setCurrentView] = useState('main');

    // Function to change language and go back
    // Dili değiştirme ve geri dönme fonksiyonu
    const changeLanguage = (langCode) => {
        i18n.changeLanguage(langCode); 
        setCurrentView('main'); 
    };

    // Handle back button logic inside modal
    // Modal içindeki geri butonu mantığını yönet
    const handleBack = () => {
        if (currentView === 'language') {
            setCurrentView('main');
        } else {
            onClose();
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={styles.container}>
                
                {/* HEADER SECTION */}
                {/* BAŞLIK BÖLÜMÜ */}
                <View style={styles.header}>
                    {/* Show back button if in sub-menu, otherwise empty spacer */}
                    {/* Alt menüdeyse geri butonunu göster, aksi takdirde boşluk bırak */}
                    {currentView === 'language' ? (
                        <TouchableOpacity onPress={() => setCurrentView('main')} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                    ) : (
                         <View style={{width: 24}} /> 
                    )}
                    
                    <Text style={styles.headerTitle}>
                        {currentView === 'language' ? t('language') : t('settings')}
                    </Text>

                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* CONTENT AREA */}
                {/* İÇERİK ALANI */}
                <View style={styles.content}>
                    
                    {/* VIEW 1: MAIN SETTINGS MENU */}
                    {/* GÖRÜNÜM 1: ANA AYARLAR MENÜSÜ */}
                    {currentView === 'main' && (
                        <View>
                            {/* Language Button */}
                            {/* Dil Butonu */}
                            <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('language')}>
                                <View style={styles.menuIconBox}>
                                    <Ionicons name="language" size={22} color="#4A90E2" />
                                </View>
                                <View style={styles.menuTexts}>
                                    <Text style={styles.menuTitle}>{t('language')}</Text>
                                    <Text style={styles.menuSubtitle}>
                                        {LANGUAGES.find(l => l.code === i18n.language)?.label || 'English'}
                                    </Text>
                                </View>
                                <Feather name="chevron-right" size={20} color="#666" />
                            </TouchableOpacity>

                            {/* Storage (Placeholder) */}
                            {/* Depolama (Yer Tutucu) */}
                            <TouchableOpacity style={styles.menuItem}>
                                <View style={[styles.menuIconBox, {backgroundColor: 'rgba(46, 204, 113, 0.1)'}]}>
                                    <MaterialIcons name="storage" size={22} color="#2ecc71" />
                                </View>
                                <View style={styles.menuTexts}>
                                    <Text style={styles.menuTitle}>{t('storage')}</Text>
                                    <Text style={styles.menuSubtitle}>{t('manage_recordings')}</Text>
                                </View>
                                <Feather name="chevron-right" size={20} color="#666" />
                            </TouchableOpacity>

                             {/* About (Placeholder) */}
                             {/* Hakkında (Yer Tutucu) */}
                             <TouchableOpacity style={styles.menuItem}>
                                <View style={[styles.menuIconBox, {backgroundColor: 'rgba(255, 75, 75, 0.1)'}]}>
                                    <Ionicons name="information-circle-outline" size={24} color="#FF4B4B" />
                                </View>
                                <View style={styles.menuTexts}>
                                    <Text style={styles.menuTitle}>{t('about')}</Text>
                                    <Text style={styles.menuSubtitle}>{t('version')}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* VIEW 2: LANGUAGE SELECTION LIST */}
                    {/* GÖRÜNÜM 2: DİL SEÇİM LİSTESİ */}
                    {currentView === 'language' && (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {LANGUAGES.map((lang) => (
                                <TouchableOpacity 
                                    key={lang.code} 
                                    style={[
                                        styles.langItem, 
                                        i18n.language === lang.code && styles.activeLangItem
                                    ]}
                                    onPress={() => changeLanguage(lang.code)}
                                >
                                    <Text style={styles.flag}>{lang.flag}</Text>
                                    <Text style={[
                                        styles.langName,
                                        i18n.language === lang.code && styles.activeLangText
                                    ]}>
                                        {lang.label}
                                    </Text>
                                    
                                    {/* Show checkmark if active */}
                                    {/* Aktifse onay işaretini göster */}
                                    {i18n.language === lang.code && (
                                        <Ionicons name="checkmark-circle" size={24} color="#4A90E2" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
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

    // Menu Item Styles
    // Menü Öğesi Stilleri
    menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', padding: 15, borderRadius: 12, marginBottom: 12 },
    menuIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(74, 144, 226, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    menuTexts: { flex: 1 },
    menuTitle: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    menuSubtitle: { color: '#888', fontSize: 13, marginTop: 2 },

    // Language List Styles
    // Dil Listesi Stilleri
    langItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#222' },
    activeLangItem: { backgroundColor: '#1E1E1E', borderRadius: 10, borderBottomWidth: 0 },
    flag: { fontSize: 24, marginRight: 15 },
    langName: { color: '#CCC', fontSize: 16, flex: 1 },
    activeLangText: { color: '#FFF', fontWeight: 'bold' }
});