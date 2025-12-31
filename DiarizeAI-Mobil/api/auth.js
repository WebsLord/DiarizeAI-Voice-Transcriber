// api/auth.js
import { api } from './client';

// Register now sends: username (base), email, password
// Kayıt artık şunu gönderir: kullanıcı adı (temel), e-posta, şifre
export const registerUser = (userInfo) => {
  return api.post('/auth/register', userInfo);
};

// Login uses email + password
// Giriş e-posta + şifre kullanır
export const loginUser = (credentials) => {
  return api.post('/auth/login', credentials);
};