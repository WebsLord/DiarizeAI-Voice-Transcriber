// src/screens/SummarizedScreen.js

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getSavedAnalyses, deleteAnalysis } from '../utils/resultStorage';
import { useTranslation } from 'react-i18next';

export default function SummarizedScreen({ navigation }) {
    const { t } = useTranslation();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Reload data every time screen opens
    // Ekran her açıldığında verileri yeniden yükle
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        setLoading(true);
        const results = await getSavedAnalyses();
        setData(results);
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
                        loadData(); // Refresh list / Listeyi yenile
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('ResultScreen', { data: item })}
        >
            <View style={styles.cardHeader}>
                <MaterialIcons name="analytics" size={24} color="#4A90E2" />
                <View style={styles.headerText}>
                    
                    {/* Display original name if available, otherwise fallback to path */}
                    {/* Varsa orijinal ismi göster, yoksa dosya yoluna geri dön */}
                    <Text style={styles.title} numberOfLines={1}>
                        {item.originalName || (item.audio_path ? item.audio_path.split('/').pop() : "Analiz Sonucu")}
                    </Text>
                    
                    <Text style={styles.date}>
                        {new Date(item.savedAt).toLocaleString()}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.localId)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={20} color="#FF5252" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.summary} numberOfLines={2}>
                    {item.summary || "Özet bulunamadı."}
                </Text>
                <View style={styles.tags}>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>{item.language || "Unknown"}</Text>
                    </View>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>{item.conversation_type || "Audio"}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Özetlenenler</Text>
            </View>

            {data.length === 0 && !loading ? (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="content-paste-off" size={64} color="#444" />
                    <Text style={styles.emptyText}>Henüz kayıtlı analiz yok.</Text>
                </View>
            ) : (
                <FlatList
                    data={data}
                    keyExtractor={(item) => item.localId}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222', marginTop: 30 },
    backButton: { marginRight: 15 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
    listContent: { padding: 15 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#666', marginTop: 10, fontSize: 16 },
    card: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    headerText: { flex: 1, marginLeft: 10 },
    title: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    date: { color: '#888', fontSize: 12, marginTop: 2 },
    deleteBtn: { padding: 5 },
    content: { marginTop: 5 },
    summary: { color: '#CCC', fontSize: 14, lineHeight: 20, marginBottom: 10 },
    tags: { flexDirection: 'row' },
    tag: { backgroundColor: '#333', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3, marginRight: 8 },
    tagText: { color: '#AAA', fontSize: 11 },
});