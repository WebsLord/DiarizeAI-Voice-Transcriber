// api/auth.js
import { api } from './client';

export const registerUser = (userInfo) => {
  // Ozan'ın backend'i: username, email, password istiyor
  return api.post('/auth/register', userInfo);
};

export const loginUser = (credentials) => {
  // Ozan'ın backend'i: email, password istiyor
  return api.post('/auth/login', credentials);
};