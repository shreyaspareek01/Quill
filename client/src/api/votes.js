import api from './axios';

// dir: 1 = upvote, 0 = remove vote
export const castVote = (post_id, dir) =>
  api.post('/vote/', { post_id, dir });
