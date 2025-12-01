import React, { useState, useEffect, useCallback } from 'react';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { recursosHumanosAPI } from '../services/api';
import './DistribucionPanel.css';

// Colores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];
const MILITAR_COLOR = '#f39c12';
const CIVIL_COLOR = '#3498db';
const OFICIAL_COLOR = '#e74c3c';
const SUBOFICIAL_COLOR = '#f39c12';

// Grados militares predefinidos (mismos que en GestionPersonal)
const GRADOS_OFICIALES = ['CN', 'CF', 'CC', 'TN', 'TF', 'TC', 'GU'];
const GRADOS_SUBOFICIALES = ['SM', 'SP', 'SI', 'SS', 'CP', 'CI', 'CS'];

interface DistribucionPanelProps { }

interface ChartData {
    name: string;
    value: number;
    color?: string;
    [key: string]: any;
}

interface Stats {
    totalPersonal: number;
    totalMilitar: number;
    totalCivil: number;
    personalTipoData: ChartData[];
    jerarquiaMilitarData: ChartData[];
    topDestinos: ChartData[];
    gradosData: ChartData[];
    escalafonData: ChartData[];
    orientacionData: ChartData[];
}

const DistribucionPanel: React.FC<DistribucionPanelProps> = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);

    // Definir procesarDatos primero para usarlo en calcularEstadisticas
    const procesarDatos = useCallback((personal: any[]) => {
        let totalPersonal = 0;
        let totalMilitar = 0;
        let totalCivil = 0;
        let totalOficiales = 0;
        let totalSuboficiales = 0;

        const gradosCount: Record<string, number> = {};
        const escalafonCount: Record<string, number> = {};
        const orientacionCount: Record<string, number> = {};
        const destinoCount: Record<string, number> = {};

        personal.forEach(p => {
            totalPersonal++;

            // Destino
            const destinoNombre = p.destino || 'Desconocido';
            destinoCount[destinoNombre] = (destinoCount[destinoNombre] || 0) + 1;

            // Tipo: Militar vs Civil
            if (p.tipo === 'militar') {
                totalMilitar++;

                // Grado
                const grado = p.grado ? p.grado.trim() : 'Sin Grado';
                gradosCount[grado] = (gradosCount[grado] || 0) + 1;

                // Escalafón
                const escalafon = p.escalafon ? p.escalafon.trim() : 'Sin Escalafón';
                escalafonCount[escalafon] = (escalafonCount[escalafon] || 0) + 1;

                // Orientación
                const orientacion = p.orientacion ? p.orientacion.trim() : 'Sin Orientación';
                orientacionCount[orientacion] = (orientacionCount[orientacion] || 0) + 1;

                // Oficial vs Suboficial
                const gradoNormalizado = grado.trim().toUpperCase();

                if (GRADOS_OFICIALES.includes(gradoNormalizado)) {
                    totalOficiales++;
                } else if (GRADOS_SUBOFICIALES.includes(gradoNormalizado)) {
                    totalSuboficiales++;
                } else {
                    const gradoLower = grado.toLowerCase();
                    if (!gradoLower.includes('suboficial') && (
                        gradoLower.includes('oficial') ||
                        gradoLower.includes('teniente') ||
                        gradoLower.includes('capitán') ||
                        gradoLower.includes('coronel') ||
                        gradoLower.includes('almirante') ||
                        gradoLower.includes('jefe') ||
                        gradoLower.includes('mayor') ||
                        gradoLower.includes('brigadier') ||
                        gradoLower.includes('guardiamarina') ||
                        gradoLower.includes('comodoro')
                    )) {
                        totalOficiales++;
                    } else {
                        totalSuboficiales++;
                    }
                }

            } else if (p.tipo === 'civil') {
                totalCivil++;
            }
        });

        // Preparar datos para gráficos
        const personalTipoData: ChartData[] = [
            { name: 'Militar', value: totalMilitar, color: MILITAR_COLOR },
            { name: 'Civil', value: totalCivil, color: CIVIL_COLOR }
        ];

        const jerarquiaMilitarData: ChartData[] = [
            { name: 'Oficiales', value: totalOficiales, color: OFICIAL_COLOR },
            { name: 'Suboficiales', value: totalSuboficiales, color: SUBOFICIAL_COLOR }
        ];

        const topDestinos: ChartData[] = Object.entries(destinoCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        const gradosData: ChartData[] = Object.entries(gradosCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const escalafonData: ChartData[] = Object.entries(escalafonCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const orientacionData: ChartData[] = Object.entries(orientacionCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        setStats({
            totalPersonal,
            totalMilitar,
            totalCivil,
            personalTipoData,
            jerarquiaMilitarData,
            topDestinos,
            gradosData,
            escalafonData,
            orientacionData
        });
    }, []);

    const calcularEstadisticas = useCallback(async () => {
        try {
            setLoading(true);
            const response = await recursosHumanosAPI.obtenerTodos();

            if (response && (response.success || response.data)) {
                const personal = response.data || [];
                procesarDatos(personal);
            } else {
                setError('No se pudieron cargar los datos.');
            }
        } catch (err) {
            console.error('Error al cargar estadísticas:', err);
            setError('Error al cargar estadísticas.');
        } finally {
            setLoading(false);
        }
    }, [procesarDatos]);

    useEffect(() => {
        calcularEstadisticas();
    }, [calcularEstadisticas]);



    if (loading) return <div className="loading">Cargando estadísticas...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!stats) return null;

    return (
        <div className="distribucion-panel">
            <div className="distribucion-header">
                <h2>📊 Distribución de Personal</h2>
                <p>Análisis gráfico de recursos humanos</p>
            </div>

            <div className="stats-summary">
                <div className="stat-card">
                    <span className="stat-value">{stats.totalPersonal}</span>
                    <span className="stat-label">Total Personal</span>
                </div>
                <div className="stat-card">
                    <span className="stat-value" style={{ color: MILITAR_COLOR }}>{stats.totalMilitar}</span>
                    <span className="stat-label">Militar</span>
                </div>
                <div className="stat-card">
                    <span className="stat-value" style={{ color: CIVIL_COLOR }}>{stats.totalCivil}</span>
                    <span className="stat-label">Civil</span>
                </div>
            </div>

            <div className="charts-grid">
                {/* Gráfico 1: Militar vs Civil */}
                <div className="chart-card">
                    <h3>Personal Militar vs Civil</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.personalTipoData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {stats.personalTipoData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfico 2: Oficiales vs Suboficiales */}
                <div className="chart-card">
                    <h3>Oficiales vs Suboficiales</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.jerarquiaMilitarData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {stats.jerarquiaMilitarData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfico 3: Top Destinos */}
                <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
                    <h3>Top 10 Destinos con Más Personal</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={stats.topDestinos}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                                <YAxis stroke="var(--text-secondary)" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                />
                                <Bar dataKey="value" fill="#8884d8" name="Cantidad">
                                    {stats.topDestinos.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfico 4: Por Grado */}
                <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
                    <h3>Distribución por Grado (Militar)</h3>
                    <div className="chart-container" style={{ height: '400px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={stats.gradosData}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis type="number" stroke="var(--text-secondary)" />
                                <YAxis dataKey="name" type="category" width={150} stroke="var(--text-secondary)" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                />
                                <Bar dataKey="value" fill="#82ca9d" name="Cantidad" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfico 5: Por Escalafón */}
                <div className="chart-card">
                    <h3>Distribución por Escalafón</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={stats.escalafonData.slice(0, 10)} // Top 10
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                                <YAxis stroke="var(--text-secondary)" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                />
                                <Bar dataKey="value" fill="#ffc658" name="Cantidad" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfico 6: Por Orientación */}
                <div className="chart-card">
                    <h3>Distribución por Orientación</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={stats.orientacionData.slice(0, 10)} // Top 10
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                                <YAxis stroke="var(--text-secondary)" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                />
                                <Bar dataKey="value" fill="#ff8042" name="Cantidad" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DistribucionPanel;
