// src/utils/resultStorage.js

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@analysis_results';

/**
 * Save a new analysis result locally.
 * Yeni bir analiz sonucunu yerel olarak kaydet.
 */
export const saveAnalysisResult = async (result) => {
    try {
        const existingData = await AsyncStorage.getItem(STORAGE_KEY);
        let results = existingData ? JSON.parse(existingData) : [];

        const newEntry = {
            ...result,
            savedAt: new Date().toISOString(),
            localId: Date.now().toString(), 
        };
        
        results.unshift(newEntry);

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(results));
        console.log("✅ Analysis saved:", newEntry.localId);
        return newEntry;

    } catch (error) {
        console.error("Failed to save analysis:", error);
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
        console.error("Error reading data:", error);
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
        results = results.filter(item => item.localId !== localId);

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    } catch (error) {
        console.error("Delete error:", error);
    }
};

/**
 * Update a specific analysis. (NEW)
 * Belirli bir analizi güncelle. (YENİ)
 */
export const updateAnalysis = async (localId, updatedFields) => {
    try {
        const existingData = await AsyncStorage.getItem(STORAGE_KEY);
        if (!existingData) return;

        let results = JSON.parse(existingData);
        const index = results.findIndex(item => item.localId === localId);

        if (index !== -1) {
            // Mevcut veri ile yeni alanları birleştir
            results[index] = { ...results[index], ...updatedFields };
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(results));
            console.log("✅ Analysis updated:", localId);
            return results[index];
        }
    } catch (error) {
        console.error("Update error:", error);
        throw error;
    }
};

/**
 * Delete multiple analyses by IDs.
 * Birden fazla analizi ID'lerine göre sil.
 */
export const deleteMultipleAnalyses = async (idsToDelete) => {
    try {
        const existingData = await AsyncStorage.getItem(STORAGE_KEY);
        if (!existingData) return;

        let results = JSON.parse(existingData);
        results = results.filter(item => !idsToDelete.includes(item.localId));

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(results));
        console.log(`✅ Deleted ${idsToDelete.length} analyses.`);
    } catch (error) {
        console.error("Bulk delete error:", error);
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
        console.error("Clear error:", error);
    }
};