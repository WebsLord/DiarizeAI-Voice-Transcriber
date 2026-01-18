// App.js
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen'; 
import ResultScreen from './src/screens/ResultScreen';
import SummarizedScreen from './src/screens/SummarizedScreen';
// NEW IMPORT
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#121212' }
        }}
      >
        {/* Auth Screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        
        {/* Main App Screens */}
        <Stack.Screen name="Home" component={HomeScreen} />
        
        {/* Result & Summary Screens */}
        <Stack.Screen name="ResultScreen" component={ResultScreen} />
        <Stack.Screen name="Summarized" component={SummarizedScreen} />
        
        {/* NEW: Profile Screen */}
        <Stack.Screen name="Profile" component={ProfileScreen} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}