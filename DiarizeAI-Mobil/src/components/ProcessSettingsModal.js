// src/components/ProcessSettingsModal.js

import React, { useState, useEffect } from 'react';
import { 
    View, Text, Modal, TouchableOpacity, StyleSheet, 
    TextInput, ScrollView, Switch, KeyboardAvoidingView, Platform, Keyboard, 
    Vibration 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../services/i18n'; 

export const ProcessSettingsModal = ({ visible, onClose, settings, onSave }) => {
    const { t } = useTranslation();
    
    // Form State
    const [localSettings, setLocalSettings] = useState(settings);
    
    // Focus State (Klavye açık mı?)
    const [isTyping, setIsTyping] = useState(false);
    
    // Validation State
    const [isFocusValid, setIsFocusValid] = useState(false);

    // Character Count State
    const [charCount, setCharCount] = useState(0);

    useEffect(() => {
        const text = localSettings.keywords || "";
        const textWithoutSpaces = text.replace(/\s/g, '');
        setCharCount(textWithoutSpaces.length);

        const isValid = text.trim().length > 0 && /[a-zA-Z0-9]/.test(text);
        setIsFocusValid(isValid);

        if (!isValid && localSettings.focusExclusive) {
            updateSetting('focusExclusive', false);
        }
    }, [localSettings.keywords]);

    const updateSetting = (key, value) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleTextChange = (text) => {
        const currentRaw = text.replace(/\s/g, '');
        if (currentRaw.length > 256) {
            if (currentRaw.length > charCount) Vibration.vibrate(50);
            return; 
        }
        updateSetting('keywords', text);
    };

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    const handleInputFocus = () => setIsTyping(true);
    const handleInputBlur = () => { Keyboard.dismiss(); setIsTyping(false); };

    const getCounterStyle = () => {
        if (charCount >= 256) return { color: '#FF5252', icon: 'alert-circle', iconColor: '#FF5252' };
        if (charCount > 230) return { color: '#4A90E2', icon: 'alert-circle-outline', iconColor: '#4A90E2' };
        return { color: '#666', icon: null, iconColor: null };
    };
    const counterInfo = getCounterStyle();

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
        <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
            {/* Overlay: KeyboardAvoidingView'i buraya koyuyoruz.
               Bu sayede klavye açılınca TÜM modal yukarı kayıyor, iç yapısı bozulmuyor.
            */}
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"} 
                style={styles.overlay}
            >
                {/* Arka plan tıklaması klavyeyi kapatır */}
                <TouchableOpacity 
                    style={styles.backdropClickable} 
                    activeOpacity={1} 
                    onPress={() => isTyping ? handleInputBlur() : null}
                />

                {/* MODAL KUTUSU (SABİT) */}
                <View style={styles.modalContainer}>
                    
                    {/* HEADER */}
                    {!isTyping && (
                        <View style={styles.header}>
                            <Text style={styles.title}>{t('process_settings')}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* SCROLLVIEW: FlexGrow ile tüm alanı kaplar, boşluğa basınca kayar */}
                    <ScrollView 
                        style={{ flex: 1 }} 
                        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }} 
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* İçerik */}
                        <View>
                            {/* NORMAL MOD İÇERİĞİ (Diller) */}
                            {!isTyping && (
                                <View> 
                                    <Text style={styles.sectionTitle}>{t('summary_language')}</Text>
                                    <Text style={styles.hint}>{t('summary_lang_hint')}</Text>
                                    <View style={styles.row}>
                                        <LangOption label={`🗣️ ${t('original')}`} value="original" current={localSettings.summaryLang} field="summaryLang" />
                                        {LANGUAGES.map(lang => (
                                            <LangOption key={lang.code} label={`${lang.flag} ${lang.label}`} value={lang.code} current={localSettings.summaryLang} field="summaryLang" />
                                        ))}
                                    </View>

                                    <Text style={styles.sectionTitle}>{t('transcript_language')}</Text>
                                    <Text style={styles.hint}>{t('transcript_lang_hint')}</Text>
                                    <View style={styles.row}>
                                        <LangOption label={`🗣️ ${t('original')}`} value="original" current={localSettings.transcriptLang} field="transcriptLang" />
                                        {LANGUAGES.map(lang => (
                                            <LangOption key={lang.code} label={`${lang.flag} ${lang.label}`} value={lang.code} current={localSettings.transcriptLang} field="transcriptLang" />
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* ODAK KONU ALANI */}
                            <View style={[styles.inputSection, isTyping && { marginTop: 20 }]}>
                                <View style={isTyping ? { alignItems: 'center', marginBottom: 10 } : {}}>
                                    <Text style={[styles.sectionTitle, isTyping && { marginTop: 0, fontSize: 18, color: '#4A90E2' }]}>
                                        {t('topic_sensitive')}
                                    </Text>
                                    <Text style={[styles.hint, isTyping && { textAlign: 'center' }]}>
                                        {isTyping ? "Konuları araya // koyarak ayırın." : t('topic_hint')}
                                    </Text>
                                </View>
                                
                                <View style={styles.counterContainer}>
                                    {counterInfo.icon && (
                                        <Ionicons name={counterInfo.icon} size={14} color={counterInfo.iconColor} style={{marginRight: 4}} />
                                    )}
                                    <Text style={[styles.counterText, { color: counterInfo.color }]}>
                                        {charCount}/256
                                    </Text>
                                </View>

                                <TextInput 
                                    style={[styles.input, isTyping && styles.inputFocused]}
                                    placeholder={t('topic_placeholder')} 
                                    placeholderTextColor="#666"
                                    value={localSettings.keywords}
                                    onChangeText={handleTextChange}
                                    multiline={true}
                                    onFocus={handleInputFocus}
                                />
                            </View>

                            {/* TAMAM BUTONU (Sadece Yazarken) */}
                            {isTyping && (
                                <TouchableOpacity style={styles.doneTypingBtn} onPress={handleInputBlur}>
                                    <Ionicons name="checkmark-circle" size={24} color="white" />
                                    <Text style={styles.doneTypingText}>Tamam</Text>
                                </TouchableOpacity>
                            )}

                            {/* ODAKLANMA SWITCH'İ (Sadece Normal Modda) */}
                            {!isTyping && (
                                <View style={[styles.toggleRow, !isFocusValid && { opacity: 0.5 }]}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.toggleTitle}>Sadece Bu Konulara Odaklan</Text>
                                        <Text style={styles.toggleHint}>Aktifse, diğer konuları yoksayar.</Text>
                                    </View>
                                    <Switch
                                        trackColor={{ false: "#767577", true: "#4A90E2" }}
                                        thumbColor={localSettings.focusExclusive ? "#fff" : "#f4f3f4"}
                                        onValueChange={(val) => updateSetting('focusExclusive', val)}
                                        value={localSettings.focusExclusive}
                                        disabled={!isFocusValid}
                                    />
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    {/* KAYDET BUTONU (Normal Modda En Altta Sabit) */}
                    {!isTyping && (
                        <View style={styles.footerContainer}>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                <Text style={styles.saveButtonText}>{t('save')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    // Overlay tüm ekranı kaplar
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
    
    // Arka plan tıklaması için görünmez katman (Modalın arkası)
    backdropClickable: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },

    modalContainer: { 
        backgroundColor: '#1E1E1E', 
        borderRadius: 20, 
        height: '85%', // SABİT YÜKSEKLİK - Değişmez, bozulmaz.
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        zIndex: 1, // Tıklamaları alabilsin
    },
    
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    title: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    closeBtn: { padding: 5 },
    
    sectionTitle: { color: '#4A90E2', fontSize: 16, fontWeight: 'bold', marginTop: 15, marginBottom: 5 },
    hint: { color: '#888', fontSize: 12, marginBottom: 10 },
    
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    
    optionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#444', backgroundColor: '#2A2A2A', marginBottom: 5 },
    optionBtnActive: { borderColor: '#4A90E2', backgroundColor: 'rgba(74, 144, 226, 0.2)' },
    optionText: { color: '#AAA', fontSize: 13 },
    optionTextActive: { color: '#4A90E2', fontWeight: 'bold' },
    
    counterContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 5
    },
    counterText: {
        fontSize: 12,
        fontWeight: 'bold'
    },

    inputSection: { marginBottom: 5 },

    input: { 
        backgroundColor: '#2A2A2A', 
        color: 'white', 
        padding: 15, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: '#444', 
        height: 120, // Sabit makul yükseklik
        textAlignVertical: 'top',
        fontSize: 14 
    },
    
    inputFocused: {
        height: 200, 
        borderColor: '#4A90E2',
        backgroundColor: '#222',
        fontSize: 16,
    },

    doneTypingBtn: {
        flexDirection: 'row',
        backgroundColor: '#333',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
        borderWidth: 1,
        borderColor: '#555'
    },
    doneTypingText: { color: 'white', marginLeft: 8, fontWeight: 'bold' },

    footerContainer: {
        marginTop: 10,
        marginBottom: 10, // Alt boşluk (Güvenli alan)
    },

    saveButton: { backgroundColor: '#4A90E2', padding: 15, borderRadius: 12, alignItems: 'center' },
    saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    
    toggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15, backgroundColor: '#2A2A2A', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#333' },
    toggleTitle: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    toggleHint: { color: '#888', fontSize: 11, marginTop: 2, marginRight: 10 }
});