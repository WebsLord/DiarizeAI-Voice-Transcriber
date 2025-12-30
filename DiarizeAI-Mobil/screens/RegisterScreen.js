// screens/RegisterScreen.js
import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { registerUser } from '../api/auth';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password) return Alert.alert("Hata", "Tüm alanları doldurunuz.");

    setLoading(true);
    try {
      await registerUser({ username, email, password });
      Alert.alert("Başarılı", "Hesap oluşturuldu. Giriş yapabilirsin.");
      navigation.navigate('Login');
    } catch (error) {
      console.error(error);
      Alert.alert("Hata", "Kayıt olunamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kayıt Ol</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Kullanıcı Adı" 
        placeholderTextColor="#aaa" 
        value={username} 
        onChangeText={setUsername} 
      />
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
        secureTextEntry={true} 
        value={password} 
        onChangeText={setPassword} 
      />
      
      <Pressable style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Kayıt Ol</Text>}
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Login')} style={{marginTop: 20}}>
        <Text style={{color: '#007AFF', textAlign: 'center'}}>Giriş Ekranına Dön</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#121212' },
  title: { fontSize: 28, color: 'white', marginBottom: 30, textAlign: 'center', fontWeight: 'bold' },
  input: { backgroundColor: '#333', color: 'white', padding: 15, borderRadius: 8, marginBottom: 15 },
  button: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});