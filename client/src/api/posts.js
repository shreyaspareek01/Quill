import api from './axios';

export const getPosts = (params = {}) =>
  api.get('/posts/', { params });

export const getPost = (id) =>
  api.get(`/posts/${id}`);

export const createPost = (data) =>
  api.post('/posts/', data);

export const updatePost = (id, data) =>
  api.put(`/posts/${id}`, data);

export const deletePost = (id) =>
  api.delete(`/posts/${id}`);

export const getFollowingPosts = (params = {}) =>
  api.get('/posts/following', { params });

export const getUserPosts = (userId, params = {}) =>
  api.get(`/posts/user/${userId}`, { params });

export const getLikedPosts = (userId) =>
  api.get(`/posts/liked/${userId}`);

export const summarizePost = (id) =>
  api.post(`/posts/${id}/summarize`);

export const generateContent = (title) =>
  api.post('/posts/generate-content', { title });

export const generateCover = (title) =>
  api.post('/posts/generate-cover', { title });
