import api from './axios';

export const loginUser = (credentials) =>
  api.post('/login', new URLSearchParams({
    username: credentials.email,
    password: credentials.password,
  }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

export const registerUser = (data) =>
  api.post('/users/', data);
