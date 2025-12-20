import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Use common styles
// Ortak stilleri kullan
import styles from '../../styles/AppStyles';

export const Header = ({ onMenuPress }) => {
    const { t } = useTranslation();

    return (
        <View style={styles.header}>
            <View style={{width: 40}} /> 
            <View style={{alignItems: 'center'}}>
                {/* TRANSLATED TITLE */}
                {/* ÇEVRİLMİŞ BAŞLIK */}
                <Text style={styles.title}>{t('app_title')}</Text>
                <Text style={styles.subtitle}>{t('app_subtitle')}</Text>
            </View>
            <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
                <Feather name="menu" size={28} color="#E0E0E0" />
            </TouchableOpacity>
        </View>
    );
};