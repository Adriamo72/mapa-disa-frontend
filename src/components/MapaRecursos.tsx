import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

  // Función para crear el icono pulsante (DivIcon)
  const createPulsingIcon = (count: number) => {
    // Calcular tamaño en píxeles basado en la cantidad
    // Ajustar estos valores según se necesite para que se vea bien en el mapa
    const baseSize = 20;
    const size = Math.min(Math.max(Math.sqrt(count) * 8, baseSize), 100); // Min 20px, Max 100px

    return L.divIcon({
      className: 'pulsing-div-icon',
      html: '', // El contenido se maneja con CSS (background y border)
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2], // Centrar el icono
      popupAnchor: [0, -size / 2] // Popup arriba del circulo
    });
  };

  // Manejadores de eventos para hover
  const handleMouseOver = (institucion: InstitucionConDestino) => {
    setHoveredInstitucion(institucion);
  };

  const handleMouseOut = () => {
    setHoveredInstitucion(null);
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
      <div className="map-info-panel">
        <h4 className="map-info-header">
          <span style={{ fontSize: '18px' }}>🗺️</span>
          Mapa de Recursos
        </h4>
        <div className="map-info-content">
          <div className="map-info-item">
            <span style={{ fontSize: '14px' }}>🏥</span>
            <span>Hospitales Navales: <strong style={{ color: '#e74c3c' }}>{conteoTipos.hospitales}</strong></span>
          </div>
          <div className="map-info-item">
            <span style={{ fontSize: '14px' }}>💊</span>
            <span>Enfermerías Navales: <strong style={{ color: '#3498db' }}>{conteoTipos.enfermerias}</strong></span>
          </div>
          <div className="map-info-item">
            <span style={{ fontSize: '14px' }}>🎯</span>
            <span>Destinos sin EE.NN: <strong style={{ color: '#9b59b6' }}>{conteoTipos.destinosEnn}</strong></span>
          </div>
          <div className="map-info-footer">
            Total: {institucionesFiltradas.length} instituciones
          </div>
          <div className="map-info-subfooter">
            Personal total: {institucionesFiltradas.reduce((total, inst) => total + inst.personal.length, 0)}
          </div>
        </div>
      </div>

      {/* Tooltip global para el destino (cuatrigrama) */}
      {hoveredInstitucion && (
        <div className="map-tooltip">
          <span style={{ fontSize: '16px' }}>{getIconoPorTipo(hoveredInstitucion.tipo)}</span>
          <div>
            <div style={{ fontSize: '16px', marginBottom: '2px' }}>
              {hoveredInstitucion.destino}
            </div>
            <div className="map-tooltip-sub">
              {getTipoTexto(hoveredInstitucion.tipo)}
            </div>
          </div>
        </div>
      )}

      <MapContainer
        center={[-38.4161, -63.6167]}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        preferCanvas={false}
      >
        {/* Capa base */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
        />

        {/* Etiqueta personalizada para Islas Malvinas */}
        <Marker
          position={[-51.95, -59.5236]}
          icon={L.divIcon({
            html: `
              <div class="map-label">Islas Malvinas</div>
            `,
            className: 'malvinas-label',
            iconSize: [120, 30]
          })}
        >
          <Popup>
            <div className="popup-container">
              <strong>Islas Malvinas</strong><br />
              Territorio Argentino
            </div>
          </Popup>
        </Marker>

        {/* Etiqueta personalizada para Puerto Argentino */}
        <Marker
          position={[-51.6936, -57.8198]}
          icon={L.divIcon({
            html: `
              <div class="map-label">Puerto Argentino</div>
            `,
            className: 'malvinas2-label',
            iconSize: [110, 30]
          })}
        >
          <Popup>
            <div className="popup-container">
              <strong>Puerto Argentino</strong><br />
              Territorio Argentino
            </div>
          </Popup>
        </Marker>

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
                  <div className="popup-container">
                    <h3 className="popup-header">
                      <span style={{ fontSize: '18px' }}>{getIconoPorTipo(institucion.tipo)}</span>
                      <span>
                        {institucion.destino} - {institucion.nombre}
                      </span>
                    </h3>
                    <div className="popup-info-box">
                      <p><strong>Tipo:</strong> {getTipoTexto(institucion.tipo)}</p>
                      <p><strong>Categoría:</strong> {institucion.categoria || 'N/A'}</p>
                      <p><strong>Teléfono:</strong> {institucion.telefono || 'N/A'}</p>
                    </div>

                    <div className="popup-stats-section">
                      <h4 className="popup-stats-header">
                        Distribución del Personal:
                      </h4>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        <div className="popup-stat-item">
                          <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>Oficiales:</span>
                          <span style={{ fontWeight: 'bold' }}>{conteoPersonal.oficiales}</span>
                        </div>
                        <div className="popup-stat-item">
                          <span style={{ color: '#f39c12', fontWeight: 'bold' }}>Suboficiales:</span>
                          <span style={{ fontWeight: 'bold' }}>{conteoPersonal.suboficiales}</span>
                        </div>
                        <div className="popup-stat-item">
                          <span style={{ color: '#3498db', fontWeight: 'bold' }}>Civiles:</span>
                          <span style={{ fontWeight: 'bold' }}>{conteoPersonal.civiles}</span>
                        </div>
                        <div className="popup-stat-total">
                          <span>Total:</span>
                          <span>{conteoPersonal.total}</span>
                        </div>
                      </div>
                    </div>

                    {institucion.personal.length === 0 ? (
                      <p className="popup-empty">
                        No hay personal asignado
                      </p>
                    ) : (
                      <div className="popup-personal-list">
                        {institucion.personal.map((p, index) => (
                          <div key={index} className="popup-personal-item" style={{
                            borderLeft: `4px solid ${p.tipo === 'militar' ? '#f39c12' : '#3498db'}`
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                              <strong className="popup-personal-name">
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
                            <div className="popup-personal-detail">
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
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
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

              {/* Círculo de cantidad total de personal (Ahora usando Marker + DivIcon para animación garantizada) */}
              {conteoPersonal.total > 0 && (
                <Marker
                  key={`${institucion.id}-total-pulse`}
                  position={[institucion.latitud, institucion.longitud]}
                  icon={createPulsingIcon(conteoPersonal.total)}
                  zIndexOffset={-100} // Para que quede detrás del marcador principal
                >
                  <Popup>
                    <div className="popup-container" style={{ minWidth: '180px' }}>
                      <h4 className="popup-header" style={{ fontSize: '14px' }}>
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
                        <div className="popup-stat-total">
                          Total: {conteoPersonal.total}
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapaRecursos;