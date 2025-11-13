import React from 'react';
import { Filtros, TipoPersonal, Especialidad } from '../types';

interface PanelControlProps {
  filtros: Filtros;
  onFiltrosChange: (nuevosFiltros: Partial<Filtros>) => void;
  tiposPersonal: TipoPersonal[];
  especialidades: Especialidad[];
}

const PanelControl: React.FC<PanelControlProps> = ({
  filtros,
  onFiltrosChange,
  tiposPersonal,
  especialidades
}) => {
  const handleTipoPersonalChange = (tipoId: number, checked: boolean) => {
    const nuevosTipos = checked
      ? [...filtros.tiposPersonal, tipoId]
      : filtros.tiposPersonal.filter(id => id !== tipoId);
    
    onFiltrosChange({ tiposPersonal: nuevosTipos });
  };

  const handleEspecialidadChange = (especialidadId: number, checked: boolean) => {
    const nuevasEspecialidades = checked
      ? [...filtros.especialidades, especialidadId]
      : filtros.especialidades.filter(id => id !== especialidadId);
    
    onFiltrosChange({ especialidades: nuevasEspecialidades });
  };

  const handleTipoInstitucionChange = (tipo: 'hospital' | 'enfermeria' | 'destino_enn', checked: boolean) => {
    const nuevosTipos = checked
      ? [...filtros.tipoInstitucion, tipo]
      : filtros.tipoInstitucion.filter(t => t !== tipo);
    
    onFiltrosChange({ tipoInstitucion: nuevosTipos });
  };

  const limpiarFiltros = () => {
    onFiltrosChange({
      tiposPersonal: [],
      especialidades: [],
      tipoInstitucion: []
    });
  };

  // Función para obtener el texto del tipo de institución
  const getTipoTexto = (tipo: string): string => {
    switch (tipo) {
      case 'hospital': return '🏥 Hospital Naval';
      case 'enfermeria': return '💊 Enfermería Naval';
      case 'destino_enn': return '🎯 Destino sin EE.NN';
      default: return tipo;
    }
  };

  return (
    <div className="panel-control">
      <h3>🧭 Filtros</h3>
      
      {/* Filtro por Tipo de Institución */}
      <div className="filtro-grupo">
        <h4>🏥 Tipo de Institución</h4>
        {['hospital', 'enfermeria', 'destino_enn'].map(tipo => (
          <label key={tipo} className="filtro-opcion">
            <input
              type="checkbox"
              checked={filtros.tipoInstitucion.includes(tipo as any)}
              onChange={(e) => handleTipoInstitucionChange(tipo as any, e.target.checked)}
            />
            <span>
              {getTipoTexto(tipo)}
            </span>
          </label>
        ))}
      </div>

      {/* Filtro por Tipo de Personal */}
      <div className="filtro-grupo">
        <h4>👥 Tipo de Personal</h4>
        {tiposPersonal.map(tipo => (
          <label key={tipo.id} className="filtro-opcion">
            <input
              type="checkbox"
              checked={filtros.tiposPersonal.includes(tipo.id)}
              onChange={(e) => handleTipoPersonalChange(tipo.id, e.target.checked)}
            />
            <span style={{ color: tipo.color }}>{tipo.nombre}</span>
          </label>
        ))}
      </div>

      {/* Filtro por Especialidad */}
      <div className="filtro-grupo">
        <h4>🎯 Especialidades</h4>
        {especialidades.map(especialidad => (
          <label key={especialidad.id} className="filtro-opcion">
            <input
              type="checkbox"
              checked={filtros.especialidades.includes(especialidad.id)}
              onChange={(e) => handleEspecialidadChange(especialidad.id, e.target.checked)}
            />
            <span style={{ color: especialidad.color }}>{especialidad.nombre}</span>
          </label>
        ))}
      </div>

      <button className="btn-limpiar" onClick={limpiarFiltros}>
        🗑️ Limpiar Filtros
      </button>
    </div>
  );
};

export default PanelControl;