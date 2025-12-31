// src/screens/RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { registerUser } from '../api/auth';

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password) return Alert.alert(t('alert_error'), t('error_empty'));

    setLoading(true);
    try {
      await registerUser({ username, email, password });
      Alert.alert(t('alert_success'), t('success_register'));
      navigation.navigate('Login');
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || "Kayıt hatası";
      Alert.alert(t('alert_error'), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('register_title')}</Text>
        <TextInput 
          style={styles.input} 
          placeholder={t('username_placeholder')} 
          placeholderTextColor="#aaa" 
          value={username} 
          onChangeText={setUsername} 
        />
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
        <Pressable style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>{t('btn_register')}</Text>}
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Login')} style={{marginTop: 20}}>
          <Text style={styles.linkText}>{t('has_account')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, color: 'white', marginBottom: 30, textAlign: 'center', fontWeight: 'bold' },
  input: { backgroundColor: '#333', color: 'white', padding: 15, borderRadius: 8, marginBottom: 15 },
  button: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  linkText: { color: '#007AFF', textAlign: 'center' }
});