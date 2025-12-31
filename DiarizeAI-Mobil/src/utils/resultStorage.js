// src/utils/resultStorage.js

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@analysis_results';

/**
 * Save a new analysis result locally.
 * Yeni bir analiz sonucunu yerel olarak kaydet.
 */
export const saveAnalysisResult = async (result) => {
    try {
        // 1. Mevcut veriyi çek
        const existingData = await AsyncStorage.getItem(STORAGE_KEY);
        let results = existingData ? JSON.parse(existingData) : [];

        // 2. Yeni veriyi hazırla (Benzersiz ID ve tarih ekle)
        const newEntry = {
            ...result,
            savedAt: new Date().toISOString(),
            localId: Date.now().toString(), // Silme işlemi için benzersiz ID
        };
        
        // 3. Listenin başına ekle
        results.unshift(newEntry);

        // 4. Kaydet
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(results));
        console.log("✅ Analiz kaydedildi:", newEntry.localId);
        return newEntry;

    } catch (error) {
        console.error("Analiz kaydedilemedi:", error);
        throw error;
    }
};

/**
 * Get all saved analysis results.
 * Kaydedilmiş tüm analiz sonuçlarını getir.
 */
export const getSavedAnalyses = async () => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Veri okunurken hata:", error);
        return [];
    }
};

/**
 * Delete a specific analysis.
 * Belirli bir analizi sil.
 */
export const deleteAnalysis = async (localId) => {
    try {
        const existingData = await AsyncStorage.getItem(STORAGE_KEY);
        if (!existingData) return;

        let results = JSON.parse(existingData);
        // ID'si eşleşmeyeni tut, eşleşeni at
        results = results.filter(item => item.localId !== localId);

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    } catch (error) {
        console.error("Silme hatası:", error);
    }
};

/**
 * Clear all saved analyses.
 * Tüm kayıtlı analizleri temizle.
 */
export const clearAllAnalyses = async () => {
    try {
        await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error("Temizleme hatası:", error);
    }
};