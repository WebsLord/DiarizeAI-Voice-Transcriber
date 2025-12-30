import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useTheme = () => {
    // Default scale is 1.0 (Normal)
    // Varsayılan ölçek 1.0 (Normal)
    const [fontScale, setFontScale] = useState(1.0);

    useEffect(() => {
        loadTheme();
    }, []);

    // Load saved font scale from storage
    // Kayıtlı yazı ölçeğini hafızadan yükle
    const loadTheme = async () => {
        try {
            const savedScale = await AsyncStorage.getItem('user-font-scale');
            if (savedScale) {
                setFontScale(parseFloat(savedScale));
            }
        } catch (e) {
            console.error("Theme load error:", e);
        }
    };

    // Change and save font scale
    // Yazı ölçeğini değiştir ve kaydet
    const changeFontScale = async (scale) => {
        setFontScale(scale);
        try {
            await AsyncStorage.setItem('user-font-scale', scale.toString());
        } catch (e) {
            console.error("Theme save error:", e);
        }
    };

    return { fontScale, changeFontScale };
};