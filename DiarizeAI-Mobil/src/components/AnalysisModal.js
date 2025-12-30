import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

// --- MOCK DATA (ENGLISH PLACEHOLDER) ---
// --- SAHTE VERİ (İNGİLİZCE YER TUTUCU) ---
// This data will eventually come from  Backend API
// Bu veri eninde sonunda  Backend API'sinden gelecek
const MOCK_RESULT = {
  summary: "The speaker emphasizes the importance of an effective introduction in a presentation. They suggest that the introduction should act as a 'hook' to engage the audience immediately. It should be sincere, positive, and energetic, setting the tone for the rest of the speech.",
  keypoints: [
    "An effective introduction acts as a 'hook' to grab the audience's attention.",
    "The speaker must be sincere, authentic, and positive.",
    "Energy should be conveyed through voice tone rather than just fast movement.",
    "The introduction should be creative and interesting but relevant to the topic."
  ],
  segments: [
    { speaker: "Speaker 1", start: "00:00", text: "Now I'm going to show you a visual about effective introductions." },
    { speaker: "Speaker 1", start: "00:09", text: "This visual will serve as a reminder of how you should structure your opening, no matter what." },
    { speaker: "Speaker 1", start: "00:27", text: "The effect of the introduction is like a hook. You need to grab the audience immediately." },
    { speaker: "Audience", start: "00:45", text: "So, how should we adjust our voice tone?" }, 
    { speaker: "Speaker 1", start: "00:50", text: "Great question. We radiate energy through our voice. No mumbling allowed." }
  ]
};

export const AnalysisModal = ({ visible, onClose }) => {
    // State to switch between Summary and Transcript tabs
    // Özet ve Transkript sekmeleri arasında geçiş yapmak için durum
    const [activeTab, setActiveTab] = useState('summary'); 

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={styles.container}>
                
                {/* 1. HEADER */}
                {/* 1. BAŞLIK */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Analysis Result</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* 2. TABS */}
                {/* 2. SEKMELER */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity 
                        style={[styles.tabButton, activeTab === 'summary' && styles.activeTab]} 
                        onPress={() => setActiveTab('summary')}
                    >
                        <MaterialIcons name="dashboard" size={20} color={activeTab === 'summary' ? '#FFF' : '#888'} />
                        <Text style={[styles.tabText, activeTab === 'summary' && styles.activeTabText]}>Summary</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.tabButton, activeTab === 'transcript' && styles.activeTab]} 
                        onPress={() => setActiveTab('transcript')}
                    >
                        <Ionicons name="chatbubbles-sharp" size={20} color={activeTab === 'transcript' ? '#FFF' : '#888'} />
                        <Text style={[styles.tabText, activeTab === 'transcript' && styles.activeTabText]}>Transcript</Text>
                    </TouchableOpacity>
                </View>

                {/* 3. CONTENT AREA */}
                {/* 3. İÇERİK ALANI */}
                <ScrollView style={styles.contentContainer} contentContainerStyle={{paddingBottom: 40}}>
                    
                    {activeTab === 'summary' ? (
                        // --- SUMMARY VIEW ---
                        // --- ÖZET GÖRÜNÜMÜ ---
                        <View>
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>📌 Executive Summary</Text>
                                <Text style={styles.summaryText}>{MOCK_RESULT.summary}</Text>
                            </View>

                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>💡 Key Points</Text>
                                {MOCK_RESULT.keypoints.map((point, index) => (
                                    <View key={index} style={styles.bulletPoint}>
                                        <Text style={styles.bulletDot}>•</Text>
                                        <Text style={styles.bulletText}>{point}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ) : (
                        // --- TRANSCRIPT VIEW ---
                        // --- TRANSKRİPT GÖRÜNÜMÜ ---
                        <View>
                            {MOCK_RESULT.segments.map((seg, index) => (
                                <View key={index} style={styles.segmentCard}>
                                    <View style={styles.speakerInfo}>
                                        <View style={styles.avatar}>
                                            <FontAwesome5 name="user" size={12} color="#fff" />
                                        </View>
                                        <Text style={styles.speakerName}>{seg.speaker}</Text>
                                        <Text style={styles.timeStamp}>{seg.start}</Text>
                                    </View>
                                    <Text style={styles.segmentText}>{seg.text}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    closeButton: { padding: 5, backgroundColor: '#333', borderRadius: 20 },
    
    // Tabs
    tabContainer: { flexDirection: 'row', margin: 20, backgroundColor: '#1E1E1E', borderRadius: 12, padding: 4 },
    tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 8 },
    activeTab: { backgroundColor: '#4A90E2' },
    tabText: { color: '#888', fontWeight: '600' },
    activeTabText: { color: '#FFF' },

    contentContainer: { paddingHorizontal: 20 },

    // Summary Styles
    card: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 16, marginBottom: 15 },
    cardTitle: { color: '#4A90E2', fontSize: 16, fontWeight: 'bold', marginBottom: 10, letterSpacing: 0.5 },
    summaryText: { color: '#E0E0E0', fontSize: 15, lineHeight: 24 },
    bulletPoint: { flexDirection: 'row', marginBottom: 8 },
    bulletDot: { color: '#4A90E2', fontSize: 20, marginRight: 10, lineHeight: 22 },
    bulletText: { color: '#CCC', fontSize: 15, lineHeight: 22, flex: 1 },

    // Transcript Styles
    segmentCard: { backgroundColor: '#1E1E1E', padding: 15, borderRadius: 12, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#4A90E2' },
    speakerInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    avatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#4A90E2', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
    speakerName: { color: '#FFF', fontWeight: 'bold', fontSize: 14, marginRight: 10 },
    timeStamp: { color: '#666', fontSize: 12 },
    segmentText: { color: '#DDD', fontSize: 15, lineHeight: 22 },
});