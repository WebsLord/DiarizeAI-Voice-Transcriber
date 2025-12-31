// src/components/dashboard/SideMenu.js

import React, { useEffect, useState } from 'react';
import { 
    View, Text, TouchableOpacity, StyleSheet, 
    Animated, Dimensions, Pressable 
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.75; 

export default function SideMenu({ menuAnim, onClose, onNavigate, onLogout }) {
    const { t } = useTranslation();
    const [username, setUsername] = useState("User");

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const storedName = await AsyncStorage.getItem('username');
            if(storedName) setUsername(storedName);
        } catch (e) {
            console.log("Error loading user", e);
        }
    };

    const backdropOpacity = menuAnim.interpolate({
        inputRange: [width - MENU_WIDTH, width],
        outputRange: [0.6, 0],
        extrapolate: 'clamp'
    });

    const backdropTranslateX = menuAnim.interpolate({
        inputRange: [width - 1, width], 
        outputRange: [0, width], 
        extrapolate: 'clamp'
    });

    return (
        <Animated.View style={[styles.overlay, { transform: [{ translateX: backdropTranslateX }] }]}>
            
            <Pressable style={styles.backdropContainer} onPress={onClose}>
                <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
            </Pressable>

            <Animated.View 
                style={[
                    styles.menuContainer, 
                    { transform: [{ translateX: menuAnim }] }
                ]}
            >
                {/* 1. PROFILE SECTION */}
                <View style={styles.profileSection}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {username ? username.charAt(0).toUpperCase() : "U"}
                        </Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.usernameText}>{username}</Text>
                        <Text style={styles.statusText}>Pro Member</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeIconBtn}>
                        <Ionicons name="close" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                {/* 2. MENU ITEMS */}
                <View style={styles.menuItemsContainer}>
                    <MenuButton 
                        icon="library-music" 
                        label={t('saved_recordings')} 
                        onPress={() => onNavigate('Records')} 
                    />
                    
                    {/* YENİ BUTON: Özetlenenler */}
                    <MenuButton 
                        icon="assignment" 
                        label="Özetlenenler" // i18n'e eklenirse t('summarized')
                        onPress={() => onNavigate('Summarized')} 
                    />

                    <MenuButton 
                        icon="settings" 
                        iconType="ionicons"
                        label={t('settings')} 
                        onPress={() => onNavigate('Settings')} 
                    />
                </View>

                {/* 3. FOOTER (LOGOUT) */}
                <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
                    <MaterialIcons name="logout" size={20} color="#FF5252" />
                    <Text style={styles.logoutText}>{t('logout')}</Text>
                </TouchableOpacity>

            </Animated.View>
        </Animated.View>
    );
}

const MenuButton = ({ icon, label, onPress, iconType = "material" }) => (
    <TouchableOpacity style={styles.menuBtn} onPress={onPress}>
        <View style={styles.iconContainer}>
            {iconType === "material" ? (
                <MaterialIcons name={icon} size={22} color="#FFF" />
            ) : (
                <Ionicons name={`${icon}-outline`} size={22} color="#FFF" />
            )}
        </View>
        <Text style={styles.menuBtnText}>{label}</Text>
        <Ionicons name="chevron-forward" size={16} color="#555" style={{marginLeft: 'auto'}} />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0, 
        zIndex: 1000,
    },
    backdropContainer: { ...StyleSheet.absoluteFillObject },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
    menuContainer: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, 
        width: MENU_WIDTH,
        backgroundColor: '#1E1E1E', 
        borderTopLeftRadius: 20, borderBottomLeftRadius: 20,
        padding: 20, paddingTop: 60,
        shadowColor: "#000", shadowOffset: { width: -10, height: 0 },
        shadowOpacity: 0.5, shadowRadius: 15, elevation: 10,
        justifyContent: 'space-between'
    },
    profileSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#4A90E2', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    avatarText: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
    userInfo: { flex: 1 },
    usernameText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    statusText: { color: '#888', fontSize: 12, marginTop: 2 },
    closeIconBtn: { padding: 5, backgroundColor: '#333', borderRadius: 15 },
    divider: { height: 1, backgroundColor: '#333', marginBottom: 10 },
    menuItemsContainer: { flex: 1, marginTop: 10 },
    menuBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderRadius: 12, marginBottom: 5 },
    iconContainer: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    menuBtnText: { color: '#EEE', fontSize: 16, fontWeight: '500' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 82, 82, 0.1)', padding: 15, borderRadius: 12, marginBottom: 20 },
    logoutText: { color: '#FF5252', fontWeight: 'bold', fontSize: 16, marginLeft: 10 }
});