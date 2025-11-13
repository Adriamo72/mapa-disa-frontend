import React, { useState, useEffect, useCallback } from 'react';
import { recursosHumanosAPI, institucionesAPI, tiposAPI } from '../services/api';
import * as XLSX from 'xlsx';

const GestionPersonal: React.FC = () => {
  const [personal, setPersonal] = useState<any[]>([]);
  const [instituciones, setInstituciones] = useState<any[]>([]);
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarImportarExcel, setMostrarImportarExcel] = useState(false);
  const [personalEditando, setPersonalEditando] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [importando, setImportando] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Grados militares predefinidos - Separados por categorías
  const gradosOficiales = ['CN', 'CF', 'CC', 'TN', 'TF', 'TC', 'GU'];
  const gradosSuboficiales = ['SM', 'SP', 'SI', 'SS', 'CP', 'CI', 'CS'];
  const gradosMilitares = [...gradosOficiales, ...gradosSuboficiales];

  // Escalafones válidos para personal militar
  const escalafonesValidos = ['EN', 'ES', 'FB', 'ME', 'OD'];

  // Función para determinar si es oficial o suboficial
  const esOficial = (grado: string) => gradosOficiales.includes(grado);
  const esSuboficial = (grado: string) => gradosSuboficiales.includes(grado);

  // Usar useCallback para memoizar la función y evitar recreaciones innecesarias
  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [personalRes, institucionesRes, especialidadesRes] = await Promise.all([
        recursosHumanosAPI.obtenerTodos(),
        institucionesAPI.obtenerTodas(),
        tiposAPI.obtenerEspecialidades()
      ]);
      
      const personalData = personalRes.data || [];
      
      // Ordenar personal según el orden de importación guardado en la base de datos
      const personalOrdenado = [...personalData].sort((a, b) => {
        // Si ambos tienen orden_importacion, ordenar por ese campo
        if (a.orden_importacion !== null && b.orden_importacion !== null) {
          return a.orden_importacion - b.orden_importacion;
        }
        // Si solo A tiene orden_importacion, A va primero
        if (a.orden_importacion !== null && b.orden_importacion === null) {
          return -1;
        }
        // Si solo B tiene orden_importacion, B va primero
        if (a.orden_importacion === null && b.orden_importacion !== null) {
          return 1;
        }
        // Si ninguno tiene orden_importacion, mantener orden alfabético como fallback
        return a.apellido.localeCompare(b.apellido);
      });
      
      setPersonal(personalOrdenado);
      setInstituciones(institucionesRes.data || []);
      setEspecialidades(especialidadesRes.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Contadores para los filtros
  const contarPersonal = () => {
    const total = personal.length;
    const militares = personal.filter(p => p.tipo === 'militar');
    const oficiales = militares.filter(p => esOficial(p.grado));
    const suboficiales = militares.filter(p => esSuboficial(p.grado));
    const civiles = personal.filter(p => p.tipo === 'civil');

    return { total, oficiales: oficiales.length, suboficiales: suboficiales.length, civiles: civiles.length };
  };

  const contadores = contarPersonal();

  // Función de búsqueda CON ORDENAMIENTO CORREGIDO
  const personalFiltrado = personal
    .filter(p => {
      // Filtro por tipo
      if (filtroTipo === 'oficial' && (!esOficial(p.grado) || p.tipo !== 'militar')) {
        return false;
      }
      if (filtroTipo === 'suboficial' && (!esSuboficial(p.grado) || p.tipo !== 'militar')) {
        return false;
      }
      if (filtroTipo === 'civil' && p.tipo !== 'civil') {
        return false;
      }
      
      // Filtro por búsqueda
      if (busqueda) {
        const termino = busqueda.toLowerCase();
        return (
          (p.destino && p.destino.toLowerCase().includes(termino)) ||
          (p.tipo && p.tipo.toLowerCase().includes(termino)) ||
          (p.grado && p.grado.toLowerCase().includes(termino)) ||
          (p.profesion && p.profesion.toLowerCase().includes(termino)) ||
          (p.apellido && p.apellido.toLowerCase().includes(termino)) ||
          (p.nombre && p.nombre.toLowerCase().includes(termino)) ||
          (p.dni && p.dni.toLowerCase().includes(termino)) ||
          (p.especialidad_nombre && p.especialidad_nombre.toLowerCase().includes(termino)) ||
          (p.escalafon && p.escalafon.toLowerCase().includes(termino)) ||
          (p.orientacion && p.orientacion.toLowerCase().includes(termino)) ||
          (p.matricula && p.matricula.toLowerCase().includes(termino))
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      // Si estamos en el filtro "Todos", ordenar primero oficiales luego suboficiales
      if (filtroTipo === '') {
        const esAOficial = esOficial(a.grado) && a.tipo === 'militar';
        const esBOficial = esOficial(b.grado) && b.tipo === 'militar';
        const esASuboficial = esSuboficial(a.grado) && a.tipo === 'militar';
        const esBSuboficial = esSuboficial(b.grado) && b.tipo === 'militar';
        
        // Primero oficiales, luego suboficiales, luego civiles
        if (esAOficial && !esBOficial) return -1;
        if (!esAOficial && esBOficial) return 1;
        if (esASuboficial && !esBSuboficial && !esBOficial) return -1;
        if (!esASuboficial && esBSuboficial && !esAOficial) return 1;
        
        // Dentro de cada categoría, mantener el orden de importación de la base de datos
        if (a.orden_importacion !== null && b.orden_importacion !== null) {
          return a.orden_importacion - b.orden_importacion;
        }
        if (a.orden_importacion !== null && b.orden_importacion === null) {
          return -1;
        }
        if (a.orden_importacion === null && b.orden_importacion !== null) {
          return 1;
        }
        // Fallback: orden alfabético
        return a.apellido.localeCompare(b.apellido);
      }
      
      // Para otros filtros, mantener el orden de importación de la base de datos
      if (a.orden_importacion !== null && b.orden_importacion !== null) {
        return a.orden_importacion - b.orden_importacion;
      }
      if (a.orden_importacion !== null && b.orden_importacion === null) {
        return -1;
      }
      if (a.orden_importacion === null && b.orden_importacion !== null) {
        return 1;
      }
      // Fallback: orden alfabético
      return a.apellido.localeCompare(b.apellido);
    });

  const handleSubmit = async (data: any) => {
    try {
      if (personalEditando) {
        await recursosHumanosAPI.actualizar(personalEditando.id, data);
        alert('Personal actualizado correctamente');
      } else {
        // Para nuevo personal, no asignamos orden_importacion (será null)
        await recursosHumanosAPI.crear(data);
        alert('Personal creado correctamente');
      }
      setMostrarFormulario(false);
      setPersonalEditando(null);
      cargarDatos();
    } catch (error: any) {
      console.error('Error guardando personal:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleEliminar = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este personal?')) {
      try {
        await recursosHumanosAPI.eliminar(id);
        cargarDatos();
        alert('Personal eliminado correctamente');
      } catch (error: any) {
        console.error('Error eliminando personal:', error);
        alert(`Error: ${error.message}`);
      }
    }
  };

  // Función para manejar la importación desde Excel
  const handleImportarExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportando(true);
    
    try {
      const data = await readExcelFile(file);
      const personalImportado = await procesarDatosExcel(data);
      
      if (personalImportado.length === 0) {
        alert('No se encontraron datos válidos para importar');
        return;
      }

      // Confirmar importación
      const confirmar = window.confirm(
        `Se encontraron ${personalImportado.length} registros válidos para importar. ¿Desea continuar?`
      );

      if (!confirmar) return;

      // Obtener el máximo orden actual de la base de datos
      const maxOrdenActual = Math.max(...personal.map(p => p.orden_importacion || 0), 0);

      // Crear personal en lote MANTENIENDO EL ORDEN
      let creados = 0;
      let errores = 0;

      for (let i = 0; i < personalImportado.length; i++) {
        try {
          // Remover _originalOrder antes de enviar a la API
          const { _originalOrder, ...personalData } = personalImportado[i];
          
          // Agregar el orden de importación al dato
          const dataConOrden = {
            ...personalData,
            orden_importacion: maxOrdenActual + i + 1
          };
          
          await recursosHumanosAPI.crear(dataConOrden);
          creados++;
        } catch (error) {
          console.error('Error creando personal:', error);
          errores++;
        }
      }

      alert(`Importación completada:\n- Creados: ${creados}\n- Errores: ${errores}`);
      
      // Recargar datos y limpiar
      cargarDatos();
      setMostrarImportarExcel(false);
      event.target.value = ''; // Reset input file

    } catch (error) {
      console.error('Error importando Excel:', error);
      alert('Error al importar el archivo Excel');
    } finally {
      setImportando(false);
    }
  };

  // Leer archivo Excel
  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Obtener los datos manteniendo el orden exacto
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '',
            raw: false
          });
          
          // Convertir a array de objetos manteniendo el orden
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];
          
          const orderedData = rows.map((row, index) => {
            const obj: any = { _originalOrder: index };
            headers.forEach((header, colIndex) => {
              if (header && row[colIndex] !== undefined && row[colIndex] !== null) {
                obj[header] = row[colIndex];
              }
            });
            return obj;
          }).filter(row => {
            // Filtrar filas completamente vacías
            return Object.keys(row).some(key => key !== '_originalOrder' && row[key] !== '');
          });
          
          resolve(orderedData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  // Procesar datos del Excel
  const procesarDatosExcel = async (data: any[]): Promise<any[]> => {
    const personalImportado: any[] = [];

    for (const row of data) {
      try {
        // Buscar campos por diferentes nombres posibles
        const destino = row.Dest_act || row.DESTINO || row.Dest_actual || row.destino || '';
        const grado = row.Grado || row.GRADO || row.grado || '';
        const escalafon = row.Escalafon || row.ESC || row.Escalafón || row.escalafon || '';
        const orientacion = row.Orientacion || row.ORIENT || row.Orientación || row.orientacion || '';
        
        // Procesar apellido y nombre
        let apellido = '';
        let nombre = '';
        
        if (row.Apellido && row.Nombre) {
          apellido = String(row.Apellido).trim();
          nombre = String(row.Nombre).trim();
        } else if (row['Apellido y Nombre'] || row['APELLIDO Y NOMBRES'] || row['Apellido y nombre']) {
          const nombreCompleto = String(row['Apellido y Nombre'] || row['APELLIDO Y NOMBRES'] || row['Apellido y nombre']).split(',');
          if (nombreCompleto.length >= 2) {
            apellido = nombreCompleto[0].trim();
            nombre = nombreCompleto[1].trim();
          } else {
            const partes = String(row['Apellido y Nombre'] || row['APELLIDO Y NOMBRES'] || row['Apellido y nombre']).split(' ');
            if (partes.length >= 2) {
              apellido = partes[0].trim();
              nombre = partes.slice(1).join(' ').trim();
            }
          }
        }
        
        const matricula = row.MR || row.Matrícula || row.Matricula || row.matricula || '';
        const dni = row.DNI || row['Nro. Doc.'] || row.Documento || row.dni || '';

        // Validaciones básicas
        if (!destino || !grado || !apellido || !nombre || !dni) {
          console.log('Fila omitida por datos incompletos:', { destino, grado, apellido, nombre, dni });
          continue;
        }

        // Validar escalafón (solo importar los válidos)
        if (!escalafonesValidos.includes(escalafon)) {
          console.log('Fila omitida por escalafón no válido:', escalafon);
          continue;
        }

        // NUEVA VALIDACIÓN: Si el escalafón es "ES", la orientación debe ser "SA"
        if (escalafon === 'ES' && orientacion !== 'SA') {
          console.log('Fila omitida - ES sin SA:', { escalafon, orientacion });
          continue;
        }

        // Crear objeto de personal militar
        const personalMilitar = {
          tipo: 'militar',
          grado: String(grado).trim(),
          escalafon: String(escalafon).trim(),
          orientacion: String(orientacion).trim(),
          profesion: '',
          apellido: String(apellido).trim(),
          nombre: String(nombre).trim(),
          destino: String(destino).trim(),
          matricula: String(matricula).trim(),
          dni: String(dni).trim(),
          especialidad_id: null,
          _originalOrder: row._originalOrder
        };

        personalImportado.push(personalMilitar);

      } catch (error) {
        console.error('Error procesando fila:', row, error);
      }
    }

    console.log('Personal a importar:', personalImportado);
    return personalImportado;
  };

  if (loading) return <div className="loading">Cargando personal...</div>;

  return (
    <div className="gestion-personal">
      <div className="header-acciones">
        <div className="header-titulo">
          <h3>👥 Gestión de Personal</h3>
          
          {/* Caja de búsqueda */}
          <div className="busqueda-container">
            <input
              type="text"
              placeholder="🔍 Buscar en DESTINO, Tipo, Grado, Profesión, Apellido, Nombre, DNI, Especialidad..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="busqueda-input"
            />
            {busqueda && (
              <span className="contador-busqueda">
                {personalFiltrado.length} de {personal.length} registros
              </span>
            )}
          </div>

          {/* Filtros rápidos con mejor espaciado */}
          <div className="filtros-rapidos">
            <div className="filtros-grupo">
              <button 
                className={filtroTipo === '' ? 'btn-filtro-rapido active' : 'btn-filtro-rapido'}
                onClick={() => setFiltroTipo('')}
              >
                Todos ({contadores.total})
              </button>
            </div>
            
            <div className="filtros-grupo" style={{ marginLeft: '20px' }}>
              <button 
                className={filtroTipo === 'oficial' ? 'btn-filtro-rapido active' : 'btn-filtro-rapido'}
                onClick={() => setFiltroTipo('oficial')}
              >
                ⭐ Oficiales ({contadores.oficiales})
              </button>
            </div>
            
            <div className="filtros-grupo" style={{ marginLeft: '20px' }}>
              <button 
                className={filtroTipo === 'suboficial' ? 'btn-filtro-rapido active' : 'btn-filtro-rapido'}
                onClick={() => setFiltroTipo('suboficial')}
              >
                🔧 Suboficiales ({contadores.suboficiales})
              </button>
            </div>
            
            <div className="filtros-grupo" style={{ marginLeft: '20px' }}>
              <button 
                className={filtroTipo === 'civil' ? 'btn-filtro-rapido active' : 'btn-filtro-rapido'}
                onClick={() => setFiltroTipo('civil')}
              >
                👨‍💼 Civiles ({contadores.civiles})
              </button>
            </div>
          </div>
        </div>
        
        <div className="botones-accion">
          <button 
            className="btn-primary"
            onClick={() => setMostrarFormulario(true)}
          >
            ➕ Nuevo Personal
          </button>
          <div style={{ margin: '0 10px' }}></div>
          <button 
            className="btn-secondary"
            onClick={() => setMostrarImportarExcel(true)}
          >
            📊 Importar desde Excel
          </button>
        </div>
      </div>

      {mostrarImportarExcel && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>📊 Importar Personal desde Excel</h3>
            <div className="importar-instructions">
              <p><strong>Instrucciones:</strong></p>
              <ul>
                <li>El archivo Excel debe contener las siguientes columnas con nombre en fila 1:</li>
                <li><strong>Destino:</strong> "Dest_act" o "DESTINO" o "destino"</li>
                <li><strong>Grado:</strong> "GRADO" o "grado"</li>
                <li><strong>Escalafón:</strong> "Escalafon" o "ESC" o "escalafon" (solo EN, ES, FB, ME, OD)</li>
                <li><strong>Orientación:</strong> "Orientacion" o "ORIENT" o "orientacion"</li>
                <li><strong>IMPORTANTE:</strong> Si Escalafón es "ES", Orientación debe ser "SA"</li>
                <li><strong>Nombre completo:</strong> "Apellido" y "Nombre" separados o "APELLIDO Y NOMBRES"</li>
                <li><strong>Matrícula:</strong> "MR" o "matricula"</li>
                <li><strong>DNI:</strong> "DNI" o "Nro. Doc." o "dni"</li>
                <li><strong>NOTA:</strong> El orden se mantendrá exactamente igual que en el archivo Excel</li>
              </ul>
            </div>
            <div className="form-actions">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleImportarExcel}
                disabled={importando}
              />
              {importando && <div className="loading">Importando...</div>}
              <button 
                type="button" 
                onClick={() => setMostrarImportarExcel(false)} 
                className="btn-secondary"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarFormulario && (
        <FormPersonal
          personal={personalEditando}
          instituciones={instituciones}
          especialidades={especialidades}
          gradosMilitares={gradosMilitares}
          onSubmit={handleSubmit}
          onCancel={() => {
            setMostrarFormulario(false);
            setPersonalEditando(null);
          }}
        />
      )}

      <div className="tabla-personal">
        {/* Contador de resultados */}
        <div className="contador-resultados">
          Mostrando {personalFiltrado.length} de {personal.length} registros
          {filtroTipo === 'oficial' && ` (Filtrado por: Oficiales)`}
          {filtroTipo === 'suboficial' && ` (Filtrado por: Suboficiales)`}
          {filtroTipo === 'civil' && ` (Filtrado por: Civiles)`}
          {busqueda && ` (Búsqueda: "${busqueda}")`}
        </div>

        {personalFiltrado.length === 0 ? (
          <div className="no-data">
            {busqueda || filtroTipo 
              ? 'No se encontraron registros que coincidan con los filtros aplicados' 
              : 'No hay personal registrado'
            }
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Destino</th>
                <th>Tipo</th>
                <th>Grado/Profesión</th>
                <th>Apellido y Nombre</th>
                <th>DNI</th>
                <th>Especialidad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {personalFiltrado.map((p, index) => (
                <tr key={p.id}>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#666' }}>
                    {index + 1}
                  </td>
                  <td>
                    <strong style={{ 
                      fontFamily: 'monospace', 
                      fontSize: '14px',
                      color: '#2c3e50',
                      backgroundColor: '#f8f9fa',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #dee2e6'
                    }}>
                      {p.destino}
                    </strong>
                  </td>
                  <td>
                    <span className={`badge ${p.tipo}`}>
                      {p.tipo === 'militar' 
                        ? (esOficial(p.grado) ? '⭐ Oficial' : '🔧 Suboficial')
                        : '👨‍💼 Civil'
                      }
                    </span>
                  </td>
                  <td>
                    {p.tipo === 'militar' ? (
                      <>
                        <strong>{p.grado}</strong>
                        {p.escalafon && (
                          <div><small style={{color: '#666'}}>Esc: {p.escalafon}</small></div>
                        )}
                        {p.orientacion && (
                          <div><small style={{color: '#666'}}>Ori: {p.orientacion}</small></div>
                        )}
                      </>
                    ) : (
                      <strong>{p.profesion}</strong>
                    )}
                  </td>
                  <td>
                    <strong>{p.apellido}, {p.nombre}</strong>
                    {p.matricula && (
                      <div>
                        <small style={{color: '#666'}}>Mat: {p.matricula}</small>
                      </div>
                    )}
                  </td>
                  <td>
                    <code style={{ fontFamily: 'monospace' }}>{p.dni}</code>
                  </td>
                  <td>
                    {p.especialidad_nombre ? (
                      <span style={{ 
                        color: p.especialidad_color,
                        backgroundColor: `${p.especialidad_color}20`,
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '12px'
                      }}>
                        {p.especialidad_nombre}
                      </span>
                    ) : (
                      <span style={{ color: '#999', fontStyle: 'italic' }}>N/A</span>
                    )}
                  </td>
                  <td className="acciones">
                    <button 
                      className="btn-editar"
                      onClick={() => {
                        setPersonalEditando(p);
                        setMostrarFormulario(true);
                      }}
                    >
                      ✏️ Editar
                    </button>
                    <button 
                      className="btn-eliminar"
                      onClick={() => handleEliminar(p.id)}
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

// Componente de formulario
const FormPersonal: React.FC<{
  personal?: any;
  instituciones: any[];
  especialidades: any[];
  gradosMilitares: string[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}> = ({ personal, instituciones, especialidades, gradosMilitares, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    tipo: personal?.tipo || 'militar',
    grado: personal?.grado || '',
    escalafon: personal?.escalafon || '',
    orientacion: personal?.orientacion || '',
    profesion: personal?.profesion || '',
    apellido: personal?.apellido || '',
    nombre: personal?.nombre || '',
    destino: personal?.destino || '',
    matricula: personal?.matricula || '',
    dni: personal?.dni || '',
    especialidad_id: personal?.especialidad_id || ''
  });

  useEffect(() => {
    if (personal) {
      setFormData({
        tipo: personal.tipo || 'militar',
        grado: personal.grado || '',
        escalafon: personal.escalafon || '',
        orientacion: personal.orientacion || '',
        profesion: personal.profesion || '',
        apellido: personal.apellido || '',
        nombre: personal.nombre || '',
        destino: personal.destino || '',
        matricula: personal.matricula || '',
        dni: personal.dni || '',
        especialidad_id: personal.especialidad_id || ''
      });
    } else {
      setFormData({
        tipo: 'militar',
        grado: '',
        escalafon: '',
        orientacion: '',
        profesion: '',
        apellido: '',
        nombre: '',
        destino: '',
        matricula: '',
        dni: '',
        especialidad_id: ''
      });
    }
  }, [personal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.apellido || !formData.nombre || !formData.destino || !formData.dni) {
      alert('Por complete los campos obligatorios: Apellido, Nombre, Destino y DNI');
      return;
    }

    if (formData.tipo === 'militar' && !formData.grado) {
      alert('Para personal militar debe seleccionar un grado');
      return;
    }

    if (formData.tipo === 'civil' && !formData.profesion) {
      alert('Para personal civil debe ingresar la profesión');
      return;
    }

    const datosEnviar = {
      ...formData,
      especialidad_id: formData.especialidad_id === '' ? null : parseInt(formData.especialidad_id) || null
    };

    onSubmit(datosEnviar);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{personal ? 'Editar Personal' : 'Nuevo Personal'}</h3>
        <form onSubmit={handleSubmit}>
          {/* Tipo de personal */}
          <div className="form-group">
            <label>Tipo: *</label>
            <select 
              value={formData.tipo} 
              onChange={(e) => setFormData({...formData, tipo: e.target.value})}
            >
              <option value="militar">🎖️ Militar</option>
              <option value="civil">👨‍💼 Civil</option>
            </select>
          </div>

          {/* Campos para MILITAR */}
          {formData.tipo === 'militar' && (
            <>
              <div className="form-group">
                <label>GRADO: *</label>
                <select 
                  value={formData.grado} 
                  onChange={(e) => setFormData({...formData, grado: e.target.value})}
                  required
                >
                  <option value="">Seleccione grado</option>
                  <optgroup label="Oficiales">
                    {gradosMilitares.filter(g => ['CN', 'CF', 'CC', 'TN', 'TF', 'TC', 'GU'].includes(g)).map(grado => (
                      <option key={grado} value={grado}>
                        {grado}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Suboficiales">
                    {gradosMilitares.filter(g => ['SM', 'SP', 'SI', 'SS', 'CP', 'CI', 'CS'].includes(g)).map(grado => (
                      <option key={grado} value={grado}>
                        {grado}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="form-group">
                <label>ESCALAFÓN:</label>
                <input
                  type="text"
                  value={formData.escalafon}
                  onChange={(e) => setFormData({...formData, escalafon: e.target.value})}
                  placeholder="Ej: ES, FB, ME, OD, EN"
                />
              </div>

              <div className="form-group">
                <label>ORIENTACIÓN:</label>
                <input
                  type="text"
                  value={formData.orientacion}
                  onChange={(e) => setFormData({...formData, orientacion: e.target.value})}
                  placeholder="Ej: BQ, CM, OG"
                />
              </div>
            </>
          )}

          {/* Campos para CIVIL */}
          {formData.tipo === 'civil' && (
            <div className="form-group">
              <label>PROFESIÓN: *</label>
              <input
                type="text"
                value={formData.profesion}
                onChange={(e) => setFormData({...formData, profesion: e.target.value})}
                placeholder="Ej: Médico, Licenciado en Enfermería"
                required
              />
            </div>
          )}

          {/* Campos comunes */}
          <div className="form-row">
            <div className="form-group">
              <label>APELLIDO: *</label>
              <input
                type="text"
                value={formData.apellido}
                onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>NOMBRE: *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>DESTINO: *</label>
            <select 
              value={formData.destino} 
              onChange={(e) => setFormData({...formData, destino: e.target.value})}
              required
            >
              <option value="">Seleccione destino</option>
              {instituciones.map(inst => (
                <option key={inst.id} value={inst.destino}>
                  {inst.destino} - {inst.nombre} ({inst.tipo})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>MATRÍCULA:</label>
              <input
                type="text"
                value={formData.matricula}
                onChange={(e) => setFormData({...formData, matricula: e.target.value})}
                placeholder="Opcional"
              />
            </div>
            <div className="form-group">
              <label>DNI: *</label>
              <input
                type="text"
                value={formData.dni}
                onChange={(e) => setFormData({...formData, dni: e.target.value})}
                required
                placeholder="Solo números"
              />
            </div>
          </div>

          <div className="form-group">
            <label>ESPECIALIDAD:</label>
            <select 
              value={formData.especialidad_id} 
              onChange={(e) => setFormData({...formData, especialidad_id: e.target.value})}
            >
              <option value="">Sin especialidad</option>
              {especialidades.map(esp => (
                <option key={esp.id} value={esp.id}>
                  {esp.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              💾 {personal ? 'Actualizar' : 'Crear'}
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

export default GestionPersonal;