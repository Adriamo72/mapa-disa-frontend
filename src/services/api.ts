// src/services/api.ts (mejorado)
import axios from 'axios';

const API_BASE_URL = 'https://mapa-disa-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Aumentar timeout a 15 segundos
});

// Función auxiliar mejorada con manejo de errores
const handleApiCall = async (apiCall: () => Promise<any>, endpoint: string) => {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    console.error(`Error en ${endpoint}:`, error);

    let errorMessage = 'Error de conexión con el servidor';

    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Timeout: El servidor tardó demasiado en responder';
      } else if (error.response) {
        // El servidor respondió con un código de error
        errorMessage = error.response.data?.message || `Error ${error.response.status}`;
      } else if (error.request) {
        // La petición fue hecha pero no se recibió respuesta
        errorMessage = 'No se pudo conectar con el servidor';
      }
    }

    // Retornar estructura por defecto en caso de error
    return {
      success: false,
      error: errorMessage,
      data: []
    };
  }
};

// API para Instituciones
export const institucionesAPI = {
  obtenerTodas: () =>
    handleApiCall(
      () => api.get('/instituciones'),
      'instituciones'
    ),

  crear: (data: any) =>
    handleApiCall(
      () => api.post('/instituciones', data),
      'crear institución'
    ),

  actualizar: (id: number, data: any) =>
    handleApiCall(
      () => api.put(`/instituciones/${id}`, data),
      'actualizar institución'
    ),

  eliminar: (id: number) =>
    handleApiCall(
      () => api.delete(`/instituciones/${id}`),
      'eliminar institución'
    ),
};

// API para Recursos Humanos
export const recursosHumanosAPI = {
  obtenerTodos: () =>
    handleApiCall(
      () => api.get('/recursos-humanos'),
      'recursos-humanos'
    ),

  crear: (data: any) =>
    handleApiCall(
      () => api.post('/recursos-humanos', data),
      'crear recurso humano'
    ),

  actualizar: (id: number, data: any) =>
    handleApiCall(
      () => api.put(`/recursos-humanos/${id}`, data),
      'actualizar recurso humano'
    ),

  eliminar: (id: number) =>
    handleApiCall(
      () => api.delete(`/recursos-humanos/${id}`),
      'eliminar recurso humano'
    ),
};

// API para Tipos y Especialidades
export const tiposAPI = {
  obtenerTiposPersonal: () =>
    handleApiCall(
      () => api.get('/tipos/personal'),
      'tipos personal'
    ),

  obtenerEspecialidades: () =>
    handleApiCall(
      () => api.get('/tipos/especialidades'),
      'especialidades'
    ),
};

export default api;