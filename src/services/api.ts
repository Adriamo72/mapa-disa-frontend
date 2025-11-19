import axios from 'axios';

const API_BASE_URL = 'https://mapa-disa-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // Aumentar timeout
});

// Función auxiliar SIMPLIFICADA - sin datos mock
const handleApiCall = async (apiCall: () => Promise<any>, endpoint: string) => {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    console.error(`Error en ${endpoint}:`, error);
    
    let errorMessage = 'Error desconocido';
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message || 'Error de conexión';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

// API para Instituciones - SIN DATOS MOCK
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

// API para Recursos Humanos - SIN DATOS MOCK
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

// API para Tipos y Especialidades - SIN DATOS MOCK
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