import React, { useState, useEffect } from 'react';
import { Institucion } from '../types';
import { institucionesAPI } from '../services/api';

const GestionInstituciones: React.FC = () => {
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [institucionEditando, setInstitucionEditando] = useState<Institucion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarInstituciones();
  }, []);

  const cargarInstituciones = async () => {
    try {
      setLoading(true);
      const response = await institucionesAPI.obtenerTodas();
      setInstituciones(response.data || []);
    } catch (error) {
      console.error('Error cargando instituciones:', error);
      alert('Error al cargar las instituciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (institucionEditando) {
        await institucionesAPI.actualizar(institucionEditando.id, data);
        alert('Institución actualizada correctamente');
      } else {
        await institucionesAPI.crear(data);
        alert('Institución creada correctamente');
      }
      setMostrarFormulario(false);
      setInstitucionEditando(null);
      cargarInstituciones();
    } catch (error: any) {
      console.error('Error guardando institución:', error);
      alert(`Error al guardar la institución: ${error.message}`);
    }
  };

  const handleEliminar = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar esta institución?\n\nNOTA: Solo se pueden eliminar instituciones que no tengan personal asignado.')) {
      try {
        await institucionesAPI.eliminar(id);
        cargarInstituciones();
        alert('Institución eliminada correctamente');
      } catch (error: any) {
        console.error('Error eliminando institución:', error);
        alert(`Error al eliminar la institución: ${error.message}`);
      }
    }
  };

  // Función para obtener el texto del tipo de institución
  const getTipoTexto = (tipo: string): string => {
    switch (tipo) {
      case 'hospital': return '🏥 Hospital Naval';
      case 'enfermeria': return '💊 Enfermería Naval';
      case 'destino_enn': return '🎯 Destino sin EE.NN';
      default: return '🏪 Clínica';
    }
  };

  if (loading) {
    return <div className="loading">Cargando instituciones...</div>;
  }

  return (
    <div className="gestion-instituciones">
      <div className="header-acciones">
        <h3>🏛️ Gestión de Instituciones</h3>
        <button 
          className="btn-primary"
          onClick={() => setMostrarFormulario(true)}
        >
          ➕ Nueva Institución
        </button>
      </div>

      {mostrarFormulario && (
        <FormInstitucion
          institucion={institucionEditando}
          onSubmit={handleSubmit}
          onCancel={() => {
            setMostrarFormulario(false);
            setInstitucionEditando(null);
          }}
        />
      )}

      <div className="tabla-instituciones">
        {instituciones.length === 0 ? (
          <div className="no-data">No hay instituciones registradas</div>
        ) : (
          <table>
  <thead>
    <tr>
      <th>Destino</th>
      <th>Nombre</th>
      <th>Tipo</th>
      <th>Categoría</th>
      <th>Teléfono</th>
      <th>Ubicación</th>
      <th>Acciones</th>
    </tr>
  </thead>
  <tbody>
    {instituciones.map(inst => (
      <tr key={inst.id}>
        <td>
          <strong style={{ 
            fontFamily: 'monospace', 
            fontSize: '16px',
            color: '#2c3e50',
            backgroundColor: '#f8f9fa',
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #dee2e6'
          }}>
            {inst.destino || 'N/A'}
          </strong>
        </td>
        <td>
          <strong>{inst.nombre}</strong>
        </td>
        <td>
          <span className={`badge ${inst.tipo}`}>
            {getTipoTexto(inst.tipo)}
          </span>
        </td>
        <td>{inst.categoria}</td>
        <td>{inst.telefono || 'N/A'}</td>
        <td>
          <small>
            {typeof inst.latitud === 'number' ? inst.latitud.toFixed(4) : parseFloat(inst.latitud as any).toFixed(4)}, 
            {typeof inst.longitud === 'number' ? inst.longitud.toFixed(4) : parseFloat(inst.longitud as any).toFixed(4)}
          </small>
        </td>
        <td className="acciones">
                    <button 
                      className="btn-editar"
                      onClick={() => {
                        setInstitucionEditando(inst);
                        setMostrarFormulario(true);
                      }}
                    >
                      ✏️ Editar
                    </button>
                    <button 
                      className="btn-eliminar"
                      onClick={() => handleEliminar(inst.id)}
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// Componente de formulario para instituciones
const FormInstitucion: React.FC<{
  institucion?: Institucion | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}> = ({ institucion, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
  destino: institucion?.destino || '',
  nombre: institucion?.nombre || '',
  tipo: institucion?.tipo || 'hospital',
  categoria: institucion?.categoria || '', // CAMBIO: ahora será I, II o III
  telefono: institucion?.telefono || '',
  latitud: institucion?.latitud?.toString() || '-34.6037',
  longitud: institucion?.longitud?.toString() || '-58.3816'
});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar cuatrigrama
    if (!formData.destino || formData.destino.length !== 4) {
      alert('El DESTINO debe ser un cuatrigrama de 4 caracteres');
      return;
    }

    // Validar nombre
    if (!formData.nombre) {
      alert('El nombre es obligatorio');
      return;
    }

    const datosEnviar = {
      ...formData,
      destino: formData.destino.toUpperCase(),
      latitud: parseFloat(formData.latitud),
      longitud: parseFloat(formData.longitud)
    };

    // Validar coordenadas
    if (isNaN(datosEnviar.latitud) || isNaN(datosEnviar.longitud)) {
      alert('Por favor ingrese coordenadas válidas');
      return;
    }

    onSubmit(datosEnviar);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{institucion ? 'Editar Institución' : 'Nueva Institución'}</h3>
        <form onSubmit={handleSubmit}>
          {/* Campo DESTINO */}
          <div className="form-group">
            <label>DESTINO (Cuatrigrama): *</label>
            <input
              type="text"
              value={formData.destino}
              onChange={(e) => setFormData({...formData, destino: e.target.value.toUpperCase()})}
              placeholder="Ej: HNPM"
              maxLength={4}
              style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
              required
            />
            <small>4 letras mayúsculas (ej: HNPM, HCPA, ENRS)</small>
          </div>

          <div className="form-group">
            <label>Nombre: *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              required
              placeholder="Ej: Hospital Central"
            />
          </div>

          <div className="form-group">
            <label>Tipo:</label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({...formData, tipo: e.target.value as any})}
            >
              <option value="hospital">🏥 Hospital</option>
              <option value="enfermeria">💊 Enfermería</option>
              <option value="destino_enn">🎯 Destino sin EE.NN</option>
            </select>
          </div>

          <div className="form-group">
            <label>Categoría:</label>
            <select
              value={formData.categoria}
              onChange={(e) => setFormData({...formData, categoria: e.target.value as 'I' | 'II' | 'III' | 'N/A'})}
            >
              <option value="">Seleccionar categoría</option>
              <option value="I">Categoría I</option>
              <option value="II">Categoría II</option>
              <option value="III">Categoría III</option>
              <option value="N/A">N/A</option>
            </select>
            <small>Seleccione la categoría de la institución</small>
          </div>

          <div className="form-group">
            <label>Teléfono:</label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({...formData, telefono: e.target.value})}
              placeholder="Ej: 011-1234-5678"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Latitud: *</label>
              <input
                type="number"
                step="any"
                value={formData.latitud}
                onChange={(e) => setFormData({...formData, latitud: e.target.value})}
                required
                placeholder="-34.6037"
              />
            </div>

            <div className="form-group">
              <label>Longitud: *</label>
              <input
                type="number"
                step="any"
                value={formData.longitud}
                onChange={(e) => setFormData({...formData, longitud: e.target.value})}
                required
                placeholder="-58.3816"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              💾 {institucion ? 'Actualizar' : 'Crear'}
            </button>
            <button type="button" onClick={onCancel} className="btn-secondary">
              ❌ Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GestionInstituciones;