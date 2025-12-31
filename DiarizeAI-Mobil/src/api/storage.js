// api/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const key = "authToken";

export const storeToken = async (token) => {
  try {
    await AsyncStorage.setItem(key, token);
  } catch (error) {
    console.log("Token could not be stored:", error);
  }
};

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.log("Token could not be read:", error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.log("The token could not be deleted.:", error);
  }
};