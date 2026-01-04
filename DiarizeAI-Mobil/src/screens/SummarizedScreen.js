// src/screens/SummarizedScreen.js

import React, { useState, useCallback, useMemo } from 'react';
import { 
    View, Text, FlatList, TouchableOpacity, StyleSheet, 
    SafeAreaView, Alert, TextInput, Switch, ScrollView, 
    Platform, Modal 
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getSavedAnalyses, deleteAnalysis } from '../utils/resultStorage';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker'; 
import styles from '../styles/AppStyles'; // Import global styles

// Supported Languages List
// Desteklenen Diller Listesi
const LANGUAGES = ['all', 'tr', 'en', 'de', 'es', 'fr', 'it', 'ru', 'pt', 'zh', 'ja', 'ko', 'ar'];

export default function SummarizedScreen({ navigation }) {
    const { t } = useTranslation();
    
    // Data States
    const [originalData, setOriginalData] = useState([]); 
    const [loading, setLoading] = useState(true);

    // Search & Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [isAdvancedMode, setIsAdvancedMode] = useState(false);
    
    // Advanced Options
    const [selectedLang, setSelectedLang] = useState('all');
    const [sortOrder, setSortOrder] = useState('newest'); 
    
    // Date Picker States
    const [selectedDate, setSelectedDate] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [tempDate, setTempDate] = useState(new Date()); // Temporary date for iOS Modal

    // Load data on focus
    // Odaklanıldığında veriyi yükle
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        setLoading(true);
        const results = await getSavedAnalyses();
        setOriginalData(results);
        setLoading(false);
    };

    const handleDelete = (localId) => {
        Alert.alert(
            t('alert_delete_title'), 
            t('alert_delete_msg'),
            [
                { text: t('btn_cancel'), style: 'cancel' },
                { 
                    text: t('btn_delete'), 
                    style: 'destructive',
                    onPress: async () => {
                        await deleteAnalysis(localId);
                        loadData(); 
                    }
                }
            ]
        );
    };

    // --- DATE PICKER HANDLER (PLATFORM SPECIFIC) ---
    const onDateChange = (event, date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
        } else {
            // iOS: Update temp date only, don't close yet
            // iOS: Sadece geçici tarihi güncelle, henüz kapatma
            if (date) setTempDate(date);
        }
    };

    const confirmIOSDate = () => {
        setSelectedDate(tempDate);
        setShowDatePicker(false);
    };

    // --- CORE LOGIC: FILTERING & SEARCHING ---
    const filteredData = useMemo(() => {
        let result = [...originalData];

        // 1. TEXT SEARCH
        if (searchQuery.trim().length > 0) {
            const lowerQuery = searchQuery.toLowerCase();
            
            result = result.map(item => {
                const matches = [];
                const title = item.originalName || (item.audio_path ? item.audio_path.split('/').pop() : "");
                if (title.toLowerCase().includes(lowerQuery)) matches.push('title');
                if (item.summary && item.summary.toLowerCase().includes(lowerQuery)) matches.push('summary');

                let transcriptText = item.clean_transcript || "";
                if (item.segments && Array.isArray(item.segments)) {
                    transcriptText += " " + item.segments.map(s => s.text).join(" ");
                }
                
                if (transcriptText.toLowerCase().includes(lowerQuery)) matches.push('transcript');

                if (matches.length > 0) {
                    return { ...item, matchTypes: matches };
                }
                return null; 
            }).filter(item => item !== null); 
        }

        // 2. ADVANCED FILTERS
        if (isAdvancedMode) {
            if (selectedLang !== 'all') {
                result = result.filter(item => (item.language || 'unknown').toLowerCase() === selectedLang.toLowerCase());
            }

            if (selectedDate) {
                result = result.filter(item => {
                    const itemDate = new Date(item.savedAt);
                    return (
                        itemDate.getDate() === selectedDate.getDate() &&
                        itemDate.getMonth() === selectedDate.getMonth() &&
                        itemDate.getFullYear() === selectedDate.getFullYear()
                    );
                });
            }

            result.sort((a, b) => {
                const dateA = new Date(a.savedAt).getTime();
                const dateB = new Date(b.savedAt).getTime();
                return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
            });
        } else {
            result.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
        }

        return result;
    }, [originalData, searchQuery, isAdvancedMode, selectedLang, sortOrder, selectedDate]);


    // --- RENDER HELPERS ---
    const renderBadge = (type) => {
        let badgeStyle, textStyle, label;
        switch (type) {
            case 'title':
                badgeStyle = styles.badgeTitle; textStyle = styles.badgeTextTitle; label = t('title') || "BAŞLIK"; break;
            case 'summary':
                badgeStyle = styles.badgeSummary; textStyle = styles.badgeTextSummary; label = t('summary') || "ÖZET"; break;
            case 'transcript':
                badgeStyle = styles.badgeTranscript; textStyle = styles.badgeTextTranscript; label = "TRANSCRIPT"; break;
            default: return null;
        }
        return (
            <View key={type} style={[styles.matchBadge, badgeStyle]}>
                <Text style={[styles.badgeText, textStyle]}>{label}</Text>
            </View>
        );
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={localStyles.card} 
            onPress={() => navigation.navigate('ResultScreen', { data: item })}
        >
            <View style={localStyles.cardHeader}>
                <View style={localStyles.iconBox}>
                    <MaterialIcons name="analytics" size={24} color="#4A90E2" />
                </View>
                <View style={localStyles.headerText}>
                    <Text style={localStyles.title} numberOfLines={1}>
                        {item.originalName || "Audio File"}
                    </Text>
                    <Text style={localStyles.date}>
                        {new Date(item.savedAt).toLocaleString()}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.localId)} style={localStyles.deleteBtn}>
                    <Ionicons name="trash-outline" size={20} color="#FF5252" />
                </TouchableOpacity>
            </View>

            {item.matchTypes && item.matchTypes.length > 0 && (
                <View style={styles.badgeContainer}>
                    {item.matchTypes.map(type => renderBadge(type))}
                </View>
            )}

            <View style={localStyles.content}>
                <Text style={localStyles.summary} numberOfLines={2}>
                    {item.summary || "Özet yok."}
                </Text>
                <View style={localStyles.footerTags}>
                    <View style={localStyles.tag}>
                        <FontAwesome5 name="language" size={10} color="#888" style={{marginRight:4}} />
                        <Text style={localStyles.tagText}>{(item.language || "??").toUpperCase()}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* 1. HEADER (FIXED OVERLAP) */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('Summaries') || "Özetler"}</Text>
                {/* Dummy view to balance center title / Başlığı ortalamak için boş view */}
                <View style={styles.headerBtn} /> 
            </View>

            {/* SEARCH & FILTER AREA */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#888" />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder={t('search_placeholder') !== 'search_placeholder' ? t('search_placeholder') : "Aramak istediğiniz kelime..."}
                        placeholderTextColor="#666"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                            <Ionicons name="close-circle" size={20} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.advancedToggleContainer}>
                    <Text style={styles.advancedLabel}>Advanced Filters</Text>
                    <Switch 
                        value={isAdvancedMode}
                        onValueChange={setIsAdvancedMode}
                        trackColor={{ false: "#333", true: "#4A90E2" }}
                        thumbColor={isAdvancedMode ? "#FFF" : "#f4f3f4"}
                    />
                </View>

                {isAdvancedMode && (
                    <View style={styles.filtersWrapper}>
                        <Text style={styles.filterLabel}>Language</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                            {LANGUAGES.map(lang => (
                                <TouchableOpacity 
                                    key={lang} 
                                    style={[styles.filterChip, selectedLang === lang && styles.filterChipActive]}
                                    onPress={() => setSelectedLang(lang)}
                                >
                                    <Text style={[styles.filterText, selectedLang === lang && styles.filterTextActive]}>
                                        {lang.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop: 15}}>
                            <View>
                                <Text style={styles.filterLabel}>Sort By</Text>
                                <View style={{flexDirection:'row'}}>
                                    <TouchableOpacity 
                                        style={[styles.filterChip, sortOrder === 'newest' && styles.filterChipActive]}
                                        onPress={() => setSortOrder('newest')}
                                    >
                                        <Text style={[styles.filterText, sortOrder === 'newest' && styles.filterTextActive]}>Newest</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.filterChip, sortOrder === 'oldest' && styles.filterChipActive]}
                                        onPress={() => setSortOrder('oldest')}
                                    >
                                        <Text style={[styles.filterText, sortOrder === 'oldest' && styles.filterTextActive]}>Oldest</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View>
                                <Text style={styles.filterLabel}>Specific Date</Text>
                                <View style={{flexDirection:'row', alignItems:'center'}}>
                                    <TouchableOpacity 
                                        style={[styles.filterChip, selectedDate && styles.filterChipActive, {marginRight: 0}]}
                                        onPress={() => {
                                            setTempDate(selectedDate || new Date());
                                            setShowDatePicker(true);
                                        }}
                                    >
                                        <View style={{flexDirection:'row', alignItems:'center'}}>
                                            <Ionicons name="calendar" size={14} color={selectedDate ? "#FFF" : "#888"} style={{marginRight:5}} />
                                            <Text style={[styles.filterText, selectedDate && styles.filterTextActive]}>
                                                {selectedDate ? selectedDate.toLocaleDateString() : "Select Date"}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                    
                                    {selectedDate && (
                                        <TouchableOpacity onPress={() => setSelectedDate(null)} style={{marginLeft: 10}}>
                                            <Ionicons name="close-circle" size={20} color="#FF5252" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>
                )}
            </View>

            {/* iOS DATE PICKER MODAL (FIX FOR OVERLAY ISSUE) */}
            {/* iOS TARİH SEÇİCİ MODALI (ÇAKIŞMA SORUNU DÜZELTMESİ) */}
            {Platform.OS === 'ios' && (
                <Modal
                    transparent={true}
                    visible={showDatePicker}
                    animationType="slide"
                >
                    <View style={styles.datePickerModalOverlay}>
                        <View style={styles.datePickerContainer}>
                            <View style={styles.datePickerToolbar}>
                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                    <Text style={styles.datePickerCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <Text style={styles.datePickerTitle}>Select Date</Text>
                                <TouchableOpacity onPress={confirmIOSDate}>
                                    <Text style={styles.datePickerDoneText}>Done</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={tempDate}
                                mode="date"
                                display="spinner"
                                onChange={onDateChange}
                                maximumDate={new Date()}
                                themeVariant="dark" 
                                style={{ height: 120 }} // iOS Spinner height fix
                            />
                        </View>
                    </View>
                </Modal>
            )}

            {/* ANDROID DATE PICKER (Invisible logic) */}
            {Platform.OS === 'android' && showDatePicker && (
                 <DateTimePicker
                    value={selectedDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    maximumDate={new Date()}
                />
            )}

            <FlatList
                data={filteredData}
                keyExtractor={(item) => item.localId}
                renderItem={renderItem}
                contentContainerStyle={localStyles.listContent}
                ListEmptyComponent={
                    !loading && (
                        <View style={localStyles.emptyContainer}>
                            <MaterialIcons name="search-off" size={64} color="#333" />
                            <Text style={localStyles.emptyText}>
                                {searchQuery ? "Sonuç bulunamadı." : "Henüz kayıtlı analiz yok."}
                            </Text>
                        </View>
                    )
                }
            />
        </SafeAreaView>
    );
}

const localStyles = StyleSheet.create({
    listContent: { padding: 15, paddingBottom: 50 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
    emptyText: { color: '#666', marginTop: 15, fontSize: 16 },
    card: { 
        backgroundColor: '#1E1E1E', 
        borderRadius: 16, 
        padding: 16, 
        marginBottom: 16, 
        borderWidth: 1, 
        borderColor: '#333',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    iconBox: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
        justifyContent: 'center', alignItems: 'center', marginRight: 12
    },
    headerText: { flex: 1 },
    title: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 2 },
    date: { color: '#666', fontSize: 12 },
    deleteBtn: { padding: 8 },
    content: { marginTop: 8 },
    summary: { color: '#CCC', fontSize: 14, lineHeight: 20, marginBottom: 12 },
    footerTags: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    tag: { 
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#252525', borderRadius: 6, 
        paddingHorizontal: 8, paddingVertical: 4,
        borderWidth: 1, borderColor: '#333'
    },
    tagText: { color: '#AAA', fontSize: 11, fontWeight: '600' },
});