// src/components/ProcessSettingsModal.js

import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
// FIX: Import languages directly from your service
import { LANGUAGES } from '../services/i18n'; 

export const ProcessSettingsModal = ({ visible, onClose, settings, onSave }) => {
    const { t } = useTranslation();
    
    // Local state for the form
    const [localSettings, setLocalSettings] = useState(settings);

    const updateSetting = (key, value) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    // Helper for language buttons
    const LangOption = ({ label, value, current, field }) => (
        <TouchableOpacity 
            style={[styles.optionBtn, current === value && styles.optionBtnActive]}
            onPress={() => updateSetting(field, value)}
        >
            <Text style={[styles.optionText, current === value && styles.optionTextActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    
                    {/* HEADER */}
                    <View style={styles.header}>
                        {/* Başlık artık çeviriden gelecek */}
                        <Text style={styles.title}>{t('process_settings')}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        
                        {/* 1. SUMMARY LANGUAGE */}
                        {/* Etiketler çeviriden gelecek */}
                        <Text style={styles.sectionTitle}>{t('summary_language')}</Text>
                        <Text style={styles.hint}>{t('summary_lang_hint')}</Text>
                        <View style={styles.row}>
                            
                            {/* Orijinal Seçeneği */}
                            <LangOption 
                                label={`🗣️ ${t('original')}`} 
                                value="original" 
                                current={localSettings.summaryLang} 
                                field="summaryLang" 
                            />

                            {/* Diğer Diller */}
                            {LANGUAGES.map(lang => (
                                <LangOption 
                                    key={lang.code}
                                    label={`${lang.flag} ${lang.label}`} 
                                    value={lang.code} 
                                    current={localSettings.summaryLang} 
                                    field="summaryLang" 
                                />
                            ))}
                        </View>

                        {/* 2. TRANSCRIPT LANGUAGE */}
                        <Text style={styles.sectionTitle}>{t('transcript_language')}</Text>
                        <Text style={styles.hint}>{t('transcript_lang_hint')}</Text>
                        <View style={styles.row}>
                            {/* Orijinal Seçeneği */}
                            <LangOption 
                                label={`🗣️ ${t('original')}`} 
                                value="original" 
                                current={localSettings.transcriptLang} 
                                field="transcriptLang" 
                            />
                            
                            {/* Diğer Diller */}
                            {LANGUAGES.map(lang => (
                                <LangOption 
                                    key={lang.code}
                                    label={`${lang.flag} ${lang.label}`} 
                                    value={lang.code} 
                                    current={localSettings.transcriptLang} 
                                    field="transcriptLang" 
                                />
                            ))}
                        </View>

                        {/* 3. FOCUS TOPIC */}
                        <Text style={styles.sectionTitle}>{t('topic_sensitive')}</Text>
                        <Text style={styles.hint}>{t('topic_hint')}</Text>
                        <TextInput 
                            style={styles.input}
                            placeholder={t('topic_placeholder')}
                            placeholderTextColor="#666"
                            value={localSettings.keywords}
                            onChangeText={(text) => updateSetting('keywords', text)}
                        />

                    </ScrollView>

                    {/* FOOTER */}
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>{t('save')}</Text>
                    </TouchableOpacity>

                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
    modalContainer: { backgroundColor: '#1E1E1E', borderRadius: 16, maxHeight: '85%', padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    content: { marginBottom: 20 },
    sectionTitle: { color: '#4A90E2', fontSize: 16, fontWeight: 'bold', marginTop: 15, marginBottom: 5 },
    hint: { color: '#888', fontSize: 12, marginBottom: 10 },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    optionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#444', backgroundColor: '#2A2A2A', marginBottom: 5 },
    optionBtnActive: { borderColor: '#4A90E2', backgroundColor: 'rgba(74, 144, 226, 0.2)' },
    optionText: { color: '#AAA', fontSize: 13 },
    optionTextActive: { color: '#4A90E2', fontWeight: 'bold' },
    input: { backgroundColor: '#2A2A2A', color: 'white', padding: 12, borderRadius: 8, marginTop: 5, borderWidth: 1, borderColor: '#444' },
    saveButton: { backgroundColor: '#4A90E2', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});