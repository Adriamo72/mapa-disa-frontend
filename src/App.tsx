// src/App.tsx (CORREGIDO)
import React, { useState, useEffect } from 'react';
import MapaRecursos from './components/MapaRecursos';
import PanelControl from './components/PanelControl';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import LogoutButton from './components/LogoutButton';
import { Filtros, TipoPersonal, Especialidad } from './types';
import { tiposAPI } from './services/api';
import { AuthProvider, useAuth } from './AuthContext';
import './App.css';

// Datos por defecto para tipos de personal
const DEFAULT_TIPOS_PERSONAL: TipoPersonal[] = [
  {
    id: 1,
    nombre: 'Militar',
    color: '#f39c12',
    descripcion: 'Personal militar de las fuerzas armadas'
  },
  {
    id: 2,
    nombre: 'Civil',
    color: '#3498db',
    descripcion: 'Personal civil contratado'
  }
];

const DEFAULT_ESPECIALIDADES: Especialidad[] = [
  { id: 1, nombre: 'Medicina General', color: '#e74c3c' },
  { id: 2, nombre: 'Enfermería', color: '#3498db' },
  { id: 3, nombre: 'Cirugía', color: '#9b59b6' }
];

// Componente de carga
const LoadingScreen: React.FC = () => (
  <div className="loading-container">
    <div className="loading">Cargando aplicación...</div>
  </div>
);

// Componente principal que usa autenticación
const AppContent: React.FC = () => {
  const [vistaActiva, setVistaActiva] = useState<'mapa' | 'admin'>('mapa');
  const [filtros, setFiltros] = useState<Filtros>({
    tiposPersonal: [],
    tipoInstitucion: [],
    especialidades: []
  });
  const [tiposPersonal, setTiposPersonal] = useState<TipoPersonal[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      cargarDatosFiltros();
    }
  }, [isAuthenticated, authLoading]);

  const cargarDatosFiltros = async () => {
    try {
      setLoading(true);

      const [tiposResponse, especialidadesResponse] = await Promise.allSettled([
        tiposAPI.obtenerTiposPersonal(),
        tiposAPI.obtenerEspecialidades()
      ]);

      // Usar datos del API o datos por defecto
      const tiposData = tiposResponse.status === 'fulfilled' && tiposResponse.value.data
        ? tiposResponse.value.data
        : DEFAULT_TIPOS_PERSONAL;

      const especialidadesData = especialidadesResponse.status === 'fulfilled' && especialidadesResponse.value.data
        ? especialidadesResponse.value.data
        : DEFAULT_ESPECIALIDADES;

      setTiposPersonal(tiposData);
      setEspecialidades(especialidadesData);

    } catch (error) {
      console.error('Error cargando datos para filtros:', error);
      setTiposPersonal(DEFAULT_TIPOS_PERSONAL);
      setEspecialidades(DEFAULT_ESPECIALIDADES);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltrosChange = (nuevosFiltros: Partial<Filtros>) => {
    setFiltros(prev => ({ ...prev, ...nuevosFiltros }));
  };

  // Si está cargando la autenticación
  if (authLoading) {
    return <LoadingScreen />;
  }

  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>🏥 Recursos Humanos-DISA</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <nav className="app-nav">
            <button
              className={vistaActiva === 'mapa' ? 'active' : ''}
              onClick={() => setVistaActiva('mapa')}
            >
              🗺️ Mapa
            </button>
            <button
              className={vistaActiva === 'admin' ? 'active' : ''}
              onClick={() => setVistaActiva('admin')}
            >
              ⚙️ Administración
            </button>
          </nav>
          <LogoutButton />
        </div>
      </header>

      <main className="app-main">
        {vistaActiva === 'mapa' ? (
          <div className="mapa-layout">
            <aside className="panel-lateral">
              <PanelControl
                filtros={filtros}
                onFiltrosChange={handleFiltrosChange}
                tiposPersonal={tiposPersonal}
                especialidades={especialidades}
              />
            </aside>
            <section className="mapa-container">
              <MapaRecursos filtros={filtros} />
            </section>
          </div>
        ) : (
          <AdminPanel />
        )}
      </main>
    </div>
  );
};

// App principal - SIMPLIFICADA para evitar doble render
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;