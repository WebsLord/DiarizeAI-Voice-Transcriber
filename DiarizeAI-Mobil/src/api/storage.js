// api/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const key = "authToken";

export const storeToken = async (token) => {
  try {
    await AsyncStorage.setItem(key, token);
  } catch (error) {
    console.log(t('token_could_not_be_stored'), error);
  }
};

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.log(t('token_could_not_be_read'), error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.log(t('the_token_could_not_be_deleted.'), error);
  }
};