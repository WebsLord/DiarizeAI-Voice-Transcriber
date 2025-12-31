// screens/LoginScreen.js
import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator, Modal, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next'; // Translation hook
import { loginUser } from '../api/auth';
import { storeToken } from '../api/storage';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { LANGUAGES } from '../src/services/i18n'; // Correct import path

export default function LoginScreen({ navigation }) {
  const { t, i18n } = useTranslation(); // Use translation
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);

  // Change Language Function
  // Dil Değiştirme Fonksiyonu
  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    setLangModalVisible(false);
  };

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert(t('alert_error'), t('error_empty'));

    setLoading(true);
    try {
      const response = await loginUser({ email, password });
      
      if(response.data && response.data.access_token){
         await storeToken(response.data.access_token);
         
         // --- CRITICAL FIX: SAVE USERNAME ---
         // --- KRİTİK DÜZELTME: KULLANICI ADINI KAYDET ---
         // Backend returns: { user: { username: "Efe#1234", email: "..." } }
         if (response.data.user && response.data.user.username) {
             await AsyncStorage.setItem('username', response.data.user.username);
         }
         
         const username = response.data.user?.username || "";
         Alert.alert(t('success_login'), `${t('alert_ready')} ${username}`);
         
         navigation.replace('Home');
      } else {
         Alert.alert(t('alert_error'), "Token hatası.");
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || t('error_login_fail');
      Alert.alert(t('alert_error'), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* LANGUAGE SELECTOR BUTTON */}
      <TouchableOpacity style={styles.langButton} onPress={() => setLangModalVisible(true)}>
         <Text style={styles.langButtonText}>
            {LANGUAGES.find(l => l.code === i18n.language)?.flag || '🌐'}
         </Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>{t('login_title')}</Text>
        
        <TextInput 
          style={styles.input} 
          placeholder={t('email_placeholder')} 
          placeholderTextColor="#aaa"
          autoCapitalize="none" 
          keyboardType="email-address"
          value={email} 
          onChangeText={setEmail} 
        />
        
        <TextInput 
          style={styles.input} 
          placeholder={t('password_placeholder')} 
          placeholderTextColor="#aaa"
          secureTextEntry={true} 
          value={password} 
          onChangeText={setPassword} 
        />
        
        <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" /> 
          ) : (
            <Text style={styles.btnText}>{t('btn_login')}</Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Register')} style={{marginTop: 20}}>
          <Text style={styles.linkText}>{t('no_account')}</Text>
        </Pressable>
      </View>

      {/* LANGUAGE SELECTION MODAL */}
      <Modal visible={langModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{t('language')}</Text>
                <FlatList
                    data={LANGUAGES}
                    keyExtractor={(item) => item.code}
                    renderItem={({item}) => (
                        <TouchableOpacity 
                            style={styles.langItem} 
                            onPress={() => changeLanguage(item.code)}
                        >
                            <Text style={{fontSize: 24, marginRight: 10}}>{item.flag}</Text>
                            <Text style={styles.langText}>{item.label}</Text>
                            {i18n.language === item.code && <Text style={{color: '#4A90E2', marginLeft: 'auto'}}>✓</Text>}
                        </TouchableOpacity>
                    )}
                />
                <Pressable style={styles.closeButton} onPress={() => setLangModalVisible(false)}>
                    <Text style={styles.closeText}>{t('close')}</Text>
                </Pressable>
            </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { flex: 1, justifyContent: 'center', padding: 20 },
  langButton: { position: 'absolute', top: 50, right: 20, padding: 10, backgroundColor: '#333', borderRadius: 20, zIndex: 10 },
  langButtonText: { fontSize: 20 },
  title: { fontSize: 28, color: 'white', marginBottom: 30, textAlign: 'center', fontWeight: 'bold' },
  input: { backgroundColor: '#333', color: 'white', padding: 15, borderRadius: 8, marginBottom: 15 },
  button: { backgroundColor: '#E14D4D', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  linkText: { color: '#4A90E2', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#222', borderRadius: 10, padding: 20, maxHeight: '60%' },
  modalTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  langItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#333' },
  langText: { color: 'white', fontSize: 16 },
  closeButton: { marginTop: 20, alignItems: 'center', padding: 10 },
  closeText: { color: '#E14D4D', fontSize: 16 }
});