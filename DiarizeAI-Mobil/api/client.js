// api/client.js
import axios from 'axios';

// .env dosyasındaki adresi alıyoruz
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});