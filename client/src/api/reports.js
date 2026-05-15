import api from './axios';

export const reportPost = (postId, reason) =>
  api.post('/reports/', { post_id: postId, reason });
