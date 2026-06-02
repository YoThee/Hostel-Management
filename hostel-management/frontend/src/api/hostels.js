import api from './axios';

export const getHostels = () => api.get('/hostels');
export const getHostel = (id) => api.get(`/hostels/${id}`);
export const createHostel = (data) => api.post('/hostels', data);
export const updateHostel = (id, data) => api.put(`/hostels/${id}`, data);
export const deleteHostel = (id) => api.delete(`/hostels/${id}`);