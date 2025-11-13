import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Filtros } from '../types';
import { institucionesAPI } from '../services/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para iconos de Leaflet en React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapaRecursosProps {
  filtros: Filtros;
}

// Tipo para institución con destino
interface InstitucionConDestino {
  id: number;
  destino: string;
  nombre: string;
  tipo: 'hospital' | 'enfermeria' | 'destino_enn';
  categoria?: string;
  telefono?: string;
  latitud: number;
  longitud: number;
  created_at?: string;
  personal: Array<{
    tipo: string;
    grado?: string;
    escalafon?: string;
    orientacion?: string;
    profesion?: string;
    apellido: string;
    nombre: string;
    matricula?: string;
    dni: string;
    especialidad?: {
      id: number;
      nombre: string;
      color: string;
    };
  }>;
}

const MapaRecursos: React.FC<MapaRecursosProps> = ({ filtros }) => {
  const [instituciones, setInstituciones] = useState<InstitucionConDestino[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredInstitucion, setHoveredInstitucion] = useState<InstitucionConDestino | null>(null);

  useEffect(() => {
    cargarInstituciones();
  }, []);

  const cargarInstituciones = async () => {
    try {
      setLoading(true);
      const response = await institucionesAPI.obtenerTodas();
      
      // MANEJO SEGURO DE LA RESPUESTA Y CONVERSIÓN DE COORDENADAS
      if (response && (response.success || response.data)) {
        const institucionesData = response.data || response.instituciones || [];
        const institucionesConvertidas = (Array.isArray(institucionesData) ? institucionesData : [])
          .map((inst: any) => ({
            ...inst,
            // Convertir latitud y longitud a números
            latitud: typeof inst.latitud === 'string' ? parseFloat(inst.latitud) : Number(inst.latitud),
            longitud: typeof inst.longitud === 'string' ? parseFloat(inst.longitud) : Number(inst.longitud),
            // Asegurar que destino exista
            destino: inst.destino || 'N/A',
            // Asegurar que personal sea un array
            personal: Array.isArray(inst.personal) ? inst.personal : [],
            // Mantener todos los tipos incluyendo destino_enn
            tipo: inst.tipo
          }))
          .filter((inst: InstitucionConDestino) => 
            !isNaN(inst.latitud) && !isNaN(inst.longitud) && 
            inst.latitud !== 0 && inst.longitud !== 0
          );
        
        setInstituciones(institucionesConvertidas);
      } else {
        setInstituciones([]);
      }
    } catch (err) {
      setError('Error al cargar las instituciones');
      console.error('Error:', err);
      setInstituciones([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener el texto del tipo de institución
  const getTipoTexto = (tipo: string): string => {
    switch (tipo) {
      case 'hospital': return 'Hospital Naval';
      case 'enfermeria': return 'Enfermería Naval';
      case 'destino_enn': return 'Destino sin EE.NN';
      default: return tipo;
    }
  };

  // Función para obtener el emoji del tipo de institución
  const getIconoPorTipo = (tipo: string): string => {
    switch (tipo) {
      case 'hospital': return '🏥';
      case 'enfermeria': return '💊';
      case 'destino_enn': return '🎯';
      default: return '📍';
    }
  };

  const getIconColor = (tipo: string): string => {
    switch (tipo) {
      case 'hospital': return '#e74c3c';
      case 'enfermeria': return '#3498db';
      case 'destino_enn': return '#9b59b6';
      default: return '#95a5a6';
    }
  };

  // Función para crear íconos personalizados MÁS GRANDES y visibles
  const createCustomIcon = (color: string, tipo: string, isHovered: boolean = false) => {
    const sizes = {
      hospital: { base: 24, border: 4 },
      enfermeria: { base: 20, border: 3 },
      destino_enn: { base: 18, border: 3 },
      default: { base: 16, border: 2 }
    };

    const size = sizes[tipo as keyof typeof sizes] || sizes.default;
    const totalSize = size.base + size.border * 2;

    // Estilo para hover (más grande y con sombra más pronunciada)
    const hoverStyle = isHovered ? `
      transform: scale(1.2);
      z-index: 1000;
      box-shadow: 0 0 0 ${size.border + 2}px ${color},
                  0 5px 15px rgba(0,0,0,0.5);
    ` : '';

    return L.divIcon({
      html: `
        <div style="
          position: relative;
          width: ${totalSize}px;
          height: ${totalSize}px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          ${hoverStyle}
        ">
          <!-- Borde exterior -->
          <div style="
            position: absolute;
            width: 100%;
            height: 100%;
            background: rgba(255,255,255,0.9);
            border-radius: 50%;
            box-shadow: 0 0 0 ${size.border}px ${color},
                      0 3px 8px rgba(0,0,0,0.4);
          "></div>
          
          <!-- Centro del ícono -->
          <div style="
            position: relative;
            width: ${size.base}px;
            height: ${size.base}px;
            background: ${color};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: ${size.base * 0.6}px;
            font-weight: bold;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
            box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
          ">${getIconoPorTipo(tipo)}</div>
        </div>
      `,
      iconSize: [totalSize, totalSize],
      className: `custom-marker ${isHovered ? 'marker-hovered' : ''}`
    });
  };

  // Manejadores de eventos para hover
  const handleMouseOver = (institucion: InstitucionConDestino) => {
    setHoveredInstitucion(institucion);
  };

  const handleMouseOut = () => {
    setHoveredInstitucion(null);
  };

  const calcularRadio = (cantidadPersonal: number): number => {
    return Math.sqrt(cantidadPersonal) * 1000;
  };

  // Contar personal por tipo para los círculos
  const contarPersonalPorTipo = (institucion: InstitucionConDestino) => {
  const counts: { [key: string]: number } = {
    oficiales: 0,
    suboficiales: 0,
    civiles: 0,
    total: institucion.personal.length
  };

  institucion.personal.forEach(p => {
    if (p.tipo === 'militar') {
      // Determinar si es oficial o suboficial basado en el grado
      const grado = p.grado?.toLowerCase() || '';
      if (grado.includes('oficial') || grado.includes('teniente') || 
          grado.includes('capitán') || grado.includes('coronel') || 
          grado.includes('almirante') || grado.includes('jefe') ||
          grado.includes('mayor') || grado.includes('brigadier')) {
        counts.oficiales++;
      } else {
        counts.suboficiales++;
      }
    } else if (p.tipo === 'civil') {
      counts.civiles++;
    }
  });

  return counts;
};

  // Función helper para verificar si es número
  const esNumero = (valor: any): valor is number => {
    return typeof valor === 'number' && !isNaN(valor);
  };

  // Filtrar instituciones según todos los filtros
  const institucionesFiltradas = instituciones.filter(inst => {
    // Filtro por tipo de institución
    if (filtros.tipoInstitucion.length > 0 && !filtros.tipoInstitucion.includes(inst.tipo)) {
      return false;
    }

    // Filtro por tipos de personal (si hay personal)
    if (filtros.tiposPersonal.length > 0 && inst.personal.length > 0) {
      const tieneTipoPersonal = inst.personal.some(p => 
        p.tipo && filtros.tiposPersonal.includes(p.tipo === 'militar' ? 1 : 2)
      );
      if (!tieneTipoPersonal) return false;
    }

    // Filtro por especialidades
    if (filtros.especialidades.length > 0 && inst.personal.length > 0) {
      const tieneEspecialidad = inst.personal.some(p => 
        p.especialidad && filtros.especialidades.includes(p.especialidad.id)
      );
      if (!tieneEspecialidad) return false;
    }

    return true;
  });

  // Contar instituciones por tipo para el panel
  const contarInstitucionesPorTipo = () => {
    return {
      hospitales: institucionesFiltradas.filter(i => i.tipo === 'hospital').length,
      enfermerias: institucionesFiltradas.filter(i => i.tipo === 'enfermeria').length,
      destinosEnn: institucionesFiltradas.filter(i => i.tipo === 'destino_enn').length
    };
  };

  const conteoTipos = contarInstitucionesPorTipo();

  if (loading) return <div className="loading">Cargando mapa...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      {/* Panel de información */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 1000,
        background: 'white',
        padding: '15px',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        maxWidth: '320px',
        border: '2px solid #f0f0f0'
      }}>
        <h4 style={{ 
          margin: '0 0 12px 0', 
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#2c3e50',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '18px' }}>🗺️</span>
          Mapa de Recursos
        </h4>
        <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '14px' }}>🏥</span>
            <span>Hospitales Navales: <strong style={{ color: '#e74c3c' }}>{conteoTipos.hospitales}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '14px' }}>💊</span>
            <span>Enfermerías Navales: <strong style={{ color: '#3498db' }}>{conteoTipos.enfermerias}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '14px' }}>🎯</span>
            <span>Destinos sin EE.NN: <strong style={{ color: '#9b59b6' }}>{conteoTipos.destinosEnn}</strong></span>
          </div>
          <div style={{ 
            marginTop: '10px', 
            paddingTop: '10px', 
            borderTop: '1px solid #eee',
            fontWeight: 'bold',
            fontSize: '14px',
            color: '#2c3e50'
          }}>
            Total: {institucionesFiltradas.length} instituciones
          </div>
          <div style={{ 
            marginTop: '6px', 
            fontSize: '12px',
            color: '#7f8c8d'
          }}>
            Personal total: {institucionesFiltradas.reduce((total, inst) => total + inst.personal.length, 0)}
          </div>
        </div>
      </div>

      {/* Tooltip global para el destino (cuatrigrama) */}
      {hoveredInstitucion && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          background: '#2c3e50',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          fontSize: '14px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          maxWidth: '400px'
        }}>
          <span style={{ fontSize: '16px' }}>{getIconoPorTipo(hoveredInstitucion.tipo)}</span>
          <div>
            <div style={{ fontSize: '16px', marginBottom: '2px' }}>
              {hoveredInstitucion.destino}
            </div>
            <div style={{ 
              fontSize: '12px', 
              opacity: 0.8,
              color: '#ecf0f1'
            }}>
              {getTipoTexto(hoveredInstitucion.tipo)}
            </div>
          </div>
        </div>
      )}

      <MapContainer
        center={[-38.4161, -63.6167]}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {institucionesFiltradas.map((institucion) => {
          const conteoPersonal = contarPersonalPorTipo(institucion);
          const isHovered = hoveredInstitucion?.id === institucion.id;
          
          // Verificar que las coordenadas sean números válidos
          if (!esNumero(institucion.latitud) || !esNumero(institucion.longitud)) {
            return null;
          }

          return (
            <React.Fragment key={institucion.id}>
              {/* Marcador principal - CON HOVER PARA MOSTRAR DESTINO */}
              <Marker
                position={[institucion.latitud, institucion.longitud]}
                icon={createCustomIcon(getIconColor(institucion.tipo), institucion.tipo, isHovered)}
                eventHandlers={{
                  mouseover: () => handleMouseOver(institucion),
                  mouseout: handleMouseOut
                }}
              >
                <Popup>
                  <div style={{ minWidth: '280px', maxWidth: '400px' }}>
                    <h3 style={{ 
                      margin: '0 0 10px 0', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontSize: '16px',
                      color: '#2c3e50'
                    }}>
                      <span style={{ fontSize: '18px' }}>{getIconoPorTipo(institucion.tipo)}</span> 
                      <span>
                        {institucion.destino} - {institucion.nombre}
                      </span>
                    </h3>
                    <div style={{ 
                      backgroundColor: '#f8f9fa', 
                      padding: '8px 12px', 
                      borderRadius: '6px',
                      marginBottom: '10px'
                    }}>
                      <p style={{ margin: '4px 0' }}><strong>Tipo:</strong> {getTipoTexto(institucion.tipo)}</p>
                      <p style={{ margin: '4px 0' }}><strong>Categoría:</strong> {institucion.categoria || 'N/A'}</p>
                      <p style={{ margin: '4px 0' }}><strong>Teléfono:</strong> {institucion.telefono || 'N/A'}</p>
                    </div>
                    
                    <div style={{ 
                      margin: '12px 0 6px 0', 
                      borderTop: '1px solid #eee', 
                      paddingTop: '10px'
                    }}>
                      <h4 style={{ 
                        margin: '0 0 8px 0',
                        fontSize: '14px',
                        color: '#34495e'
                      }}>
                        Distribución del Personal:
                      </h4>
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '4px',
                        fontSize: '13px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>Oficiales:</span>
                          <span style={{ fontWeight: 'bold' }}>{conteoPersonal.oficiales}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#f39c12', fontWeight: 'bold' }}>Suboficiales:</span>
                          <span style={{ fontWeight: 'bold' }}>{conteoPersonal.suboficiales}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#3498db', fontWeight: 'bold' }}>Civiles:</span>
                          <span style={{ fontWeight: 'bold' }}>{conteoPersonal.civiles}</span>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          marginTop: '6px',
                          paddingTop: '6px',
                          borderTop: '1px solid #ecf0f1',
                          fontWeight: 'bold'
                        }}>
                          <span>Total:</span>
                          <span>{conteoPersonal.total}</span>
                        </div>
                      </div>
                    </div>
                    
                    {institucion.personal.length === 0 ? (
                      <p style={{ 
                        margin: '8px 0', 
                        color: '#999', 
                        fontStyle: 'italic',
                        textAlign: 'center',
                        padding: '10px'
                      }}>
                        No hay personal asignado
                      </p>
                    ) : (
                      <div style={{ 
                        maxHeight: '250px', 
                        overflowY: 'auto',
                        border: '1px solid #ecf0f1',
                        borderRadius: '6px'
                      }}>
                        {institucion.personal.map((p, index) => (
                          <div key={index} style={{ 
                            margin: '6px 0', 
                            padding: '8px',
                            borderLeft: `4px solid ${p.tipo === 'militar' ? '#f39c12' : '#3498db'}`,
                            backgroundColor: '#f8f9fa',
                            borderRadius: '0 4px 4px 0'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                              <strong style={{ fontSize: '13px' }}>
                                {p.tipo === 'militar' ? '🎖️ ' : '👨‍💼 '}
                                {p.apellido}, {p.nombre}
                              </strong>
                              <span style={{ 
                                fontSize: '10px', 
                                backgroundColor: p.tipo === 'militar' ? '#f39c12' : '#3498db',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontWeight: 'bold'
                              }}>
                                {p.tipo}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                              {p.tipo === 'militar' ? (
                                <>
                                  {p.grado && <span>Grado: {p.grado} </span>}
                                  {p.escalafon && <span>• Esc: {p.escalafon} </span>}
                                  {p.orientacion && <span>• Ori: {p.orientacion}</span>}
                                </>
                              ) : (
                                <span>Profesión: {p.profesion || 'N/A'}</span>
                              )}
                            </div>
                            {p.especialidad && (
                              <div style={{ 
                                fontSize: '11px', 
                                color: p.especialidad.color,
                                fontWeight: 'bold',
                                marginBottom: '2px'
                              }}>
                                Especialidad: {p.especialidad.nombre}
                              </div>
                            )}
                            {p.matricula && (
                              <div style={{ fontSize: '11px', color: '#666' }}>
                                Matrícula: {p.matricula}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>

              {/* Círculo de cantidad total de personal */}
              {conteoPersonal.total > 0 && (
                <Circle
                  key={`${institucion.id}-total`}
                  center={[institucion.latitud, institucion.longitud]}
                  radius={calcularRadio(conteoPersonal.total)}
                  pathOptions={{
                    color: '#2c3e50',
                    fillColor: '#2c3e50',
                    fillOpacity: 0.15,
                    weight: 2,
                    opacity: 0.7
                  }}
                >
                  <Popup>
                  <div style={{ minWidth: '180px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                      {institucion.destino} - {institucion.nombre}
                    </h4>
                    <div style={{ fontSize: '13px' }}>
                      <p style={{ margin: '4px 0', color: '#e74c3c' }}>
                        Oficiales: {conteoPersonal.oficiales}
                      </p>
                      <p style={{ margin: '4px 0', color: '#f39c12' }}>
                        Suboficiales: {conteoPersonal.suboficiales}
                      </p>
                      <p style={{ margin: '4px 0', color: '#3498db' }}>
                        Civiles: {conteoPersonal.civiles}
                      </p>
                      <p style={{ margin: '6px 0 0 0', fontWeight: 'bold', borderTop: '1px solid #eee', paddingTop: '6px' }}>
                        Total: {conteoPersonal.total}
                      </p>
                    </div>
                  </div>
                </Popup>
                </Circle>
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapaRecursos;