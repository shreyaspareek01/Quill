import api from './axios';

export const getReactions = (post_id) =>
  api.get(`/reactions/${post_id}`).then(res => res.data);

export const addReaction = (post_id, reaction_type) =>
  api.post('/reactions/', { post_id, reaction_type }).then(res => res.data);

export const removeReaction = (post_id) =>
  api.delete(`/reactions/${post_id}`).then(res => res.data);
