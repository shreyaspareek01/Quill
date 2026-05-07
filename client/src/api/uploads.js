import api from './axios';

export const uploadPostImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post('/uploads/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
