import api from './axios';

export const logPostView = (postId, readPct) =>
  api.post(`/analytics/posts/${postId}/view`, { read_pct: readPct });

export const logPassageHighlight = (postId, text) =>
  api.post(`/analytics/posts/${postId}/highlights`, { text });

export const getAuthorAnalytics = () =>
  api.get('/analytics/');
