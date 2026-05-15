import api from './axios';

function uploadFile(file, endpoint) {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export const uploadPostImage = (file) => uploadFile(file, '/uploads/image');
export const uploadAvatar = (file) => uploadFile(file, '/uploads/avatar');
export const uploadCover = (file) => uploadFile(file, '/uploads/cover');
