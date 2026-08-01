import api from './axios';

export const getNotifications = (limit = 20) =>
  api.get('/notifications', { params: { limit } });

export const markAllRead = () =>
  api.put('/notifications/read');

export const getUnreadCount = () =>
  api.get('/notifications/unread-count');
