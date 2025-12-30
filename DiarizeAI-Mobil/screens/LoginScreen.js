// screens/LoginScreen.js
import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { loginUser } from '../api/auth';
import { storeToken } from '../api/storage';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Hata", "Alanları doldurunuz.");

    setLoading(true);
    try {
      const response = await loginUser({ email, password });
      
      if(response.data && response.data.access_token){
         await storeToken(response.data.access_token);
         Alert.alert("Başarılı", "Giriş yapıldı!");
         
         // BU SATIRIN BAŞINDAKİ // İŞARETLERİNİ SİL:
         navigation.replace('Home');
      } else {
         Alert.alert("Hata", "Token alınamadı.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Giriş Başarısız", "Email veya şifre hatalı olabilir.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Diarize AI Giriş</Text>
      
      {}
      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        placeholderTextColor="#aaa"
        autoCapitalize="none" 
        value={email} 
        onChangeText={setEmail} 
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Şifre" 
        placeholderTextColor="#aaa"
        secureTextEntry={true} // Burası önemli: Sadece true veya false
        value={password} 
        onChangeText={setPassword} 
      />
      
      <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" size="small" /> 
        ) : (
          <Text style={styles.btnText}>Giriş Yap</Text>
        )}
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Register')} style={{marginTop: 20}}>
        <Text style={{color: '#007AFF', textAlign: 'center'}}>Hesabın yok mu? Kayıt Ol</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#121212' },
  title: { fontSize: 28, color: 'white', marginBottom: 30, textAlign: 'center', fontWeight: 'bold' },
  input: { backgroundColor: '#333', color: 'white', padding: 15, borderRadius: 8, marginBottom: 15 },
  button: { backgroundColor: '#E14D4D', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});