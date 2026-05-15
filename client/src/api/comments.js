import api from './axios';

export const getComments = (postId) =>
  api.get(`/comments/${postId}`);

export const createComment = (data) =>
  api.post('/comments/', data);
