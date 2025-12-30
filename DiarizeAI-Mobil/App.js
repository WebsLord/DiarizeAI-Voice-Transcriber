// App.js
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

// Screens
// Ekranlar
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
// Note: Paths might vary based on your folder structure, kept as provided
// Not: Dosya yolları klasör yapınıza göre değişebilir, sağladığınız gibi bırakıldı
import HomeScreen from './src/screens/HomeScreen'; 
import ResultScreen from './src/screens/ResultScreen'; // Imported correctly / Doğru şekilde içe aktarıldı

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      {/* Set status bar style to light for dark mode look */}
      {/* Karanlık mod görünümü için durum çubuğu stilini açık yap */}
      <StatusBar style="light" />
      
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false, // Hide default headers / Varsayılan başlıkları gizle
          contentStyle: { backgroundColor: '#121212' } // Dark background / Karanlık arka plan
        }}
      >
        {/* Auth Screens */}
        {/* Kimlik Doğrulama Ekranları */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        
        {/* Main App Screens */}
        {/* Ana Uygulama Ekranları */}
        <Stack.Screen name="Home" component={HomeScreen} />
        
        {/* Result Screen - ADDED HERE */}
        {/* Sonuç Ekranı - BURAYA EKLENDİ */}
        {/* This allows navigation.navigate('ResultScreen') to work */}
        {/* Bu, navigation.navigate('ResultScreen') komutunun çalışmasını sağlar */}
        <Stack.Screen 
            name="ResultScreen" 
            component={ResultScreen} 
        />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}