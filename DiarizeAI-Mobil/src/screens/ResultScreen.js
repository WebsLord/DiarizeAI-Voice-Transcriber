// src/screens/ResultScreen.js

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ResultScreen({ route, navigation }) {
  // Gelen veriyi al
  const { data } = route.params || {};

  // Eğer veri yoksa hata vermesin diye boş obje kontrolü
  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>Veri bulunamadı.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.button}>
          <Text style={styles.buttonText}>Geri Dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Keypoints (Anahtar Noktalar) JSON string olarak gelirse parse et
  let keypoints = [];
  try {
    keypoints = typeof data.keypoints_json === 'string' 
      ? JSON.parse(data.keypoints_json) 
      : (data.keypoints || []);
  } catch (e) {
    console.log("Keypoints parse hatası:", e);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Başlık */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Analiz Sonucu</Text>
        </View>

        {/* 1. KART: ÖZET */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text-outline" size={24} color="#4A90E2" />
            <Text style={styles.cardTitle}>Özet</Text>
          </View>
          <Text style={styles.cardText}>{data.summary || "Özet bulunamadı."}</Text>
        </View>

        {/* 2. KART: TÜR VE DİL */}
        <View style={styles.row}>
          <View style={[styles.card, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>Tür</Text>
            <Text style={styles.value}>{data.conversation_type || "Bilinmiyor"}</Text>
          </View>
          <View style={[styles.card, { flex: 1, marginLeft: 10 }]}>
            <Text style={styles.label}>Dil</Text>
            <Text style={styles.value}>{data.language || "Bilinmiyor"}</Text>
          </View>
        </View>

        {/* 3. KART: ANAHTAR NOKTALAR */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="list-outline" size={24} color="#F5A623" />
            <Text style={styles.cardTitle}>Anahtar Noktalar</Text>
          </View>
          {keypoints.length > 0 ? (
            keypoints.map((point, index) => (
              <View key={index} style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.cardText}>{point}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.cardText}>Anahtar nokta bulunamadı.</Text>
          )}
        </View>

        {/* 4. KART: TRANSKRİPT (Tam Metin) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="chatbubbles-outline" size={24} color="#50E3C2" />
            <Text style={styles.cardTitle}>Tam Metin</Text>
          </View>
          <Text style={styles.transcriptText}>{data.clean_transcript || "Metin yok."}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scrollContent: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  backButton: { marginRight: 15, padding: 5 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  card: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 15, marginBottom: 15 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: { color: '#FFF', fontSize: 18, fontWeight: '600', marginLeft: 10 },
  cardText: { color: '#CCC', fontSize: 15, lineHeight: 22 },
  transcriptText: { color: '#AAA', fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  row: { flexDirection: 'row', marginBottom: 15 },
  label: { color: '#888', fontSize: 12, marginBottom: 5 },
  value: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  bulletPoint: { flexDirection: 'row', marginBottom: 8 },
  bullet: { color: '#F5A623', fontSize: 20, marginRight: 10, lineHeight: 22 },
});