import api from './axios';

export const followUser = (userId) =>
  api.post(`/follows/${userId}`);

export const unfollowUser = (userId) =>
  api.delete(`/follows/${userId}`);

export const getFollowStatus = (userId) =>
  api.get(`/follows/${userId}/status`);
