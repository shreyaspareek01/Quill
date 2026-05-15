import api from './axios';

export const bookmarkPost = (postId) =>
  api.post(`/bookmarks/${postId}`);

export const removeBookmark = (postId) =>
  api.delete(`/bookmarks/${postId}`);

export const getBookmarkStatus = (postId) =>
  api.get(`/bookmarks/${postId}/status`);

export const getBookmarks = () =>
  api.get('/bookmarks/');
