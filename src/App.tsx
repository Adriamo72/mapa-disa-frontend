// src/App.tsx (modificado)
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
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      cargarDatosFiltros();
    }
  }, [isAuthenticated]);

  const cargarDatosFiltros = async () => {
    try {
      const [tiposResponse, especialidadesResponse] = await Promise.all([
        tiposAPI.obtenerTiposPersonal(),
        tiposAPI.obtenerEspecialidades()
      ]);

      setTiposPersonal(tiposResponse.data || []);
      setEspecialidades(especialidadesResponse.data || []);
    } catch (error) {
      console.error('Error cargando datos para filtros:', error);
      setTiposPersonal([]);
      setEspecialidades([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltrosChange = (nuevosFiltros: Partial<Filtros>) => {
    setFiltros(prev => ({ ...prev, ...nuevosFiltros }));
  };

  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    return <Login />;
  }

  if (loading && vistaActiva === 'mapa') {
    return (
      <div className="App">
        <header className="app-header">
          <h1>🏥 Recursos Humanos-DISA</h1>
          <LogoutButton />
        </header>
        <main className="app-main">
          <div className="loading">Cargando...</div>
        </main>
      </div>
    );
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

// App principal envuelta en AuthProvider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;