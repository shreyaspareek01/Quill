import api from './axios';

export const repostPost = (postId) =>
  api.post(`/reposts/${postId}`);

export const undoRepost = (postId) =>
  api.delete(`/reposts/${postId}`);

export const getUserReposts = (userId) =>
  api.get(`/reposts/${userId}`);
