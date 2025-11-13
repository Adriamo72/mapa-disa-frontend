import React, { useState } from 'react';
import GestionInstituciones from './GestionInstituciones';
import GestionPersonal from './GestionPersonal';
import './AdminPanel.css';

const AdminPanel: React.FC = () => {
  const [pestañaActiva, setPestañaActiva] = useState<'instituciones' | 'personal'>('instituciones');

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>🏥 Panel de Administración-DISA</h2>
        <div className="admin-tabs">
          <button 
            className={pestañaActiva === 'instituciones' ? 'active' : ''}
            onClick={() => setPestañaActiva('instituciones')}
          >
            🏛️ Instituciones
          </button>
          <button 
            className={pestañaActiva === 'personal' ? 'active' : ''}
            onClick={() => setPestañaActiva('personal')}
          >
            👥 Personal
          </button>
          {/* ELIMINADA la pestaña de Asignación */}
        </div>
      </div>

      <div className="admin-content">
        {pestañaActiva === 'instituciones' && <GestionInstituciones />}
        {pestañaActiva === 'personal' && <GestionPersonal />}
        {/* ELIMINADA la renderización del componente AsignacionPersonal */}
      </div>
    </div>
  );
};

export default AdminPanel;