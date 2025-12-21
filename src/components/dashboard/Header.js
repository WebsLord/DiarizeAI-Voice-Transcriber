import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Use common styles
// Ortak stilleri kullan
import styles from '../../styles/AppStyles';

// Added fontScale prop
// fontScale özelliği eklendi
export const Header = ({ onMenuPress, fontScale = 1 }) => {
    const { t } = useTranslation();

    // Helper for dynamic font size
    // Dinamik yazı boyutu için yardımcı
    const dynamicSize = (size) => ({ fontSize: size * fontScale });

    return (
        <View style={styles.header}>
            <View style={{width: 40}} /> 
            <View style={{alignItems: 'center'}}>
                {/* Applied dynamic size */}
                {/* Dinamik boyut uygulandı */}
                <Text style={[styles.title, dynamicSize(20)]}>{t('app_title')}</Text>
                <Text style={[styles.subtitle, dynamicSize(13)]}>{t('app_subtitle')}</Text>
            </View>
            <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
                <Feather name="menu" size={28} color="#E0E0E0" />
            </TouchableOpacity>
        </View>
    );
};