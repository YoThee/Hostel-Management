import api from './axios';

export const getRooms = (hostelId) => api.get(`/hostels/${hostelId}/rooms`);
export const getRoom = (hostelId, roomId) => api.get(`/hostels/${hostelId}/rooms/${roomId}`);
export const createRoom = (hostelId, data) => api.post(`/hostels/${hostelId}/rooms`, data);
export const updateRoom = (hostelId, roomId, data) => api.put(`/hostels/${hostelId}/rooms/${roomId}`, data);
export const deleteRoom = (hostelId, roomId) => api.delete(`/hostels/${hostelId}/rooms/${roomId}`);