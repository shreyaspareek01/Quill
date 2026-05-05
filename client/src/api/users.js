import api from './axios';

export const getUser = (id) =>
  api.get(`/users/${id}`);

export const getUsers = () =>
  api.get('/users/');
