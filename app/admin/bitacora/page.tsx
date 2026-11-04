'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from '@/context/SessionContext';
import { useTenant } from '@/context/TenantContext';
import { Role } from '@prisma/client';
import {
  FileSpreadsheet,
  Calendar,
  Clock,
  Building2,
  Users,
  Download,
  ArrowLeft,
  CheckSquare,
  Square,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  Radio,
  Layers,
  Sparkles
} from 'lucide-react';
import { BitacoraReportData, SpaceBitacoraMetrics, TIME_SLOTS, DAYS_OF_WEEK_MAP } from '@/lib/reports/bitacora';

interface SpaceOption {
  id: string;
  name: string;
  category: string;
}

export default function BitacoraPage() {
  const { user, loading: sessionLoading } = useSession();
  const tenant = useTenant();

  // Date range defaults: Current year cuatrimestre
  const getDefaultDates = () => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0..11
    const year = now.getFullYear();

    let startM = 0;
    let endM = 3;

    if (currentMonth >= 4 && currentMonth <= 7) {
      startM = 4;
      endM = 7;
    } else if (currentMonth >= 8) {
      startM = 8;
      endM = 11;
    }

    const startDate = new Date(year, startM, 1).toISOString().split('T')[0];
    const endDate = new Date(year, endM + 1, 0).toISOString().split('T')[0];

    return { startDate, endDate };
  };

  const initialDates = getDefaultDates();
  const [startDate, setStartDate] = useState(initialDates.startDate);
  const [endDate, setEndDate] = useState(initialDates.endDate);

  // Spaces list & selection
  const [spaces, setSpaces] = useState<SpaceOption[]>([]);
  const [selectedSpaceIds, setSelectedSpaceIds] = useState<string[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(true);

  // Report data & loading
  const [reportData, setReportData] = useState<BitacoraReportData | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  // Selected space to preview timetable grid
  const [previewSpace, setPreviewSpace] = useState<SpaceBitacoraMetrics | null>(null);

  // Fetch spaces list on mount
  useEffect(() => {
    const fetchSpaces = async () => {
      setLoadingSpaces(true);
      try {
        const res = await fetch('/api/admin/bitacora?spacesOnly=true');
        if (res.ok) {
          const data = await res.json();
          const spList: SpaceOption[] = data.spaces || [];

          // Sort by category then name
          spList.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
          setSpaces(spList);
          // By default, select all spaces
          setSelectedSpaceIds(spList.map(s => s.id));
        }
      } catch (err) {
        console.error('Error fetching spaces:', err);
      } finally {
        setLoadingSpaces(false);
      }
    };

    fetchSpaces();
  }, []);

  // Fetch report data
  const handleFetchReport = async () => {
    if (!startDate || !endDate) return;
    setLoadingReport(true);
    try {
      const spaceParams = selectedSpaceIds.length > 0 ? `&spaceIds=${selectedSpaceIds.join(',')}` : '';
      const res = await fetch(`/api/admin/bitacora?startDate=${startDate}&endDate=${endDate}${spaceParams}`);
      if (res.ok) {
        const data: BitacoraReportData = await res.json();
        setReportData(data);
        if (data.allSpaces.length > 0 && !previewSpace) {
          setPreviewSpace(data.allSpaces[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching bitacora report:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  // Initial report load once spaces are loaded
  useEffect(() => {
    if (spaces.length > 0 && selectedSpaceIds.length > 0 && !reportData && !loadingReport) {
      handleFetchReport();
    }
  }, [spaces]);

  // Download Excel
  const handleDownloadExcel = async () => {
    if (!startDate || !endDate) return;
    setDownloadingExcel(true);
    try {
      const spaceParams = selectedSpaceIds.length > 0 ? `&spaceIds=${selectedSpaceIds.join(',')}` : '';
      const url = `/api/admin/bitacora?startDate=${startDate}&endDate=${endDate}${spaceParams}&format=excel`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al generar archivo Excel');

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `BITACORA_ESPACIOS_${startDate}_al_${endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Error downloading excel:', err);
      alert('Error al descargar el archivo Excel.');
    } finally {
      setDownloadingExcel(false);
    }
  };

  // Quick cuatrimestre selector
  const setQuickPeriod = (startMonth: number, endMonth: number) => {
    const year = new Date().getFullYear();
    const s = new Date(year, startMonth, 1).toISOString().split('T')[0];
    const e = new Date(year, endMonth + 1, 0).toISOString().split('T')[0];
    setStartDate(s);
    setEndDate(e);
  };

  // Group spaces by category for selection UI
  const groupedSpaces = useMemo(() => {
    const map = new Map<string, SpaceOption[]>();
    for (const sp of spaces) {
      if (!map.has(sp.category)) {
        map.set(sp.category, []);
      }
      map.get(sp.category)!.push(sp);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [spaces]);

  // Toggle selection
  const handleToggleSelectAll = () => {
    if (selectedSpaceIds.length === spaces.length) {
      setSelectedSpaceIds([]);
    } else {
      setSelectedSpaceIds(spaces.map(s => s.id));
    }
  };

  const handleToggleCategory = (categorySpaces: SpaceOption[]) => {
    const catIds = categorySpaces.map(s => s.id);
    const allSelected = catIds.every(id => selectedSpaceIds.includes(id));

    if (allSelected) {
      setSelectedSpaceIds(prev => prev.filter(id => !catIds.includes(id)));
    } else {
      setSelectedSpaceIds(prev => Array.from(new Set([...prev, ...catIds])));
    }
  };

  const handleToggleSpace = (spaceId: string) => {
    setSelectedSpaceIds(prev =>
      prev.includes(spaceId) ? prev.filter(id => id !== spaceId) : [...prev, spaceId]
    );
  };

  // Permissions check
  if (sessionLoading) {
    return (
      <div className="container text-center py-5" style={{ paddingTop: '120px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  const allowedRoles: Role[] = [Role.SUPERUSER, Role.ADMIN_RESOURCE, Role.ADMIN_RESERVATION];
  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="container py-5" style={{ paddingTop: '120px' }}>
        <div className="alert alert-danger shadow-sm rounded-4 p-4 text-center">
          <h4 className="fw-bold">Acceso Denegado</h4>
          <p className="mb-0">No tienes permisos para visualizar o generar la bitácora de uso de espacios.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100" style={{ paddingTop: '95px', paddingBottom: '70px' }}>
      <div className="container-fluid px-md-5" style={{ maxWidth: '1600px' }}>
        
        {/* Navigation Breadcrumb */}
        <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <Link href="/admin" className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2 rounded-pill px-3 shadow-sm bg-white">
            <ArrowLeft size={16} /> Volver al Panel de Administración
          </Link>
          <span className="badge bg-white text-secondary border shadow-sm px-3 py-2 rounded-pill d-inline-flex align-items-center gap-2">
            <Building2 size={16} className="text-primary" />
            <span>Módulo de Super Admin</span>
          </span>
        </div>

        {/* Title Header Card */}
        <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden" style={{ background: 'linear-gradient(135deg, #145775 0%, #0c3649 100%)' }}>
          <div className="card-body p-4 p-md-5 text-white">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-warning text-dark fw-bold px-3 py-1 rounded-pill">
                REPORTE CUATRIMESTRAL
              </span>
              <span className="text-white-50 small">
                {tenant?.config?.siteName || 'Universidad del Valle de Atemajac'}
              </span>
            </div>
            <h1 className="h2 fw-bold text-white mb-2">Bitácora y Métricas de Uso de Espacios</h1>
            <p className="lead text-white-50 mb-4" style={{ fontSize: '1.05rem', maxWidth: '850px' }}>
              Consolidación cuatrimestral de <strong>Horas Recurrentes (Clases)</strong>, <strong>Horas NO Recurrentes (Alumnos y Docentes)</strong> y <strong>Horas de Renta de Espacios</strong> sin mezclar tipos de laboratorio.
            </p>

            <div className="d-flex flex-wrap gap-3 align-items-center pt-3 border-top border-white-50 border-opacity-25">
              <button
                onClick={handleDownloadExcel}
                disabled={downloadingExcel || loadingReport}
                className="btn btn-success fw-bold text-white d-inline-flex align-items-center gap-2 rounded-pill px-4 py-2 shadow-sm"
              >
                {downloadingExcel ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    Generando Excel...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Descargar Bitácora Excel (.xlsx)
                  </>
                )}
              </button>

              <button
                onClick={handleFetchReport}
                disabled={loadingReport}
                className="btn btn-outline-light d-inline-flex align-items-center gap-2 rounded-pill px-4 py-2"
              >
                <RefreshCw size={16} className={loadingReport ? 'spin-animation' : ''} />
                Actualizar Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Configuration Filters Card */}
        <div className="card border-0 shadow-sm rounded-4 bg-white p-4 mb-4">
          <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
            <Calendar size={18} className="text-primary" />
            Parámetros del Reporte (Rango de Fechas y Espacios)
          </h5>

          {/* Quick period buttons */}
          <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
            <span className="text-muted small fw-semibold me-2">Accesos directos por cuatrimestre:</span>
            <button type="button" onClick={() => setQuickPeriod(0, 3)} className="btn btn-xs btn-outline-primary rounded-pill py-1 px-3">
              Ene - Abr
            </button>
            <button type="button" onClick={() => setQuickPeriod(4, 7)} className="btn btn-xs btn-outline-primary rounded-pill py-1 px-3">
              May - Ago
            </button>
            <button type="button" onClick={() => setQuickPeriod(8, 11)} className="btn btn-xs btn-outline-primary rounded-pill py-1 px-3">
              Sep - Dic
            </button>
            <button type="button" onClick={() => setQuickPeriod(0, 11)} className="btn btn-xs btn-outline-secondary rounded-pill py-1 px-3">
              Año Completo
            </button>
          </div>

          <div className="row g-3 align-items-end mb-4">
            <div className="col-md-3">
              <label className="form-label fw-semibold text-secondary small mb-1">Fecha Inicio (Fecha A)</label>
              <input
                type="date"
                className="form-control rounded-3"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold text-secondary small mb-1">Fecha Fin (Fecha B)</label>
              <input
                type="date"
                className="form-control rounded-3"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="col-md-6 d-flex align-items-center justify-content-md-end gap-2">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="btn btn-sm btn-outline-secondary rounded-pill px-3 d-inline-flex align-items-center gap-2"
              >
                {selectedSpaceIds.length === spaces.length ? (
                  <>
                    <Square size={16} /> Desmarcar Todos ({selectedSpaceIds.length})
                  </>
                ) : (
                  <>
                    <CheckSquare size={16} /> Seleccionar Todos ({spaces.length})
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Grouped Spaces Selection Checkboxes */}
          <div className="border rounded-3 p-3 bg-light">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="fw-semibold text-dark small">
                Selección de Espacios a Contabilizar ({selectedSpaceIds.length} de {spaces.length} seleccionados):
              </span>
            </div>

            {loadingSpaces ? (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm text-primary" role="status" />
              </div>
            ) : (
              <div className="row g-3">
                {groupedSpaces.map(([category, catSpaces]) => {
                  const catIds = catSpaces.map(s => s.id);
                  const isAllCatSelected = catIds.every(id => selectedSpaceIds.includes(id));
                  const isSomeCatSelected = catIds.some(id => selectedSpaceIds.includes(id)) && !isAllCatSelected;

                  return (
                    <div className="col-12 col-lg-6" key={category}>
                      <div className="card h-100 border bg-white rounded-3 shadow-none p-3">
                        <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
                          <label className="form-check-label fw-bold text-dark d-flex align-items-center gap-2 cursor-pointer mb-0">
                            <input
                              type="checkbox"
                              className="form-check-input mt-0"
                              checked={isAllCatSelected}
                              ref={(el) => {
                                if (el) el.indeterminate = isSomeCatSelected;
                              }}
                              onChange={() => handleToggleCategory(catSpaces)}
                            />
                            <span>{category}</span>
                          </label>
                          <span className="badge bg-secondary-subtle text-secondary rounded-pill small">
                            {catSpaces.filter(s => selectedSpaceIds.includes(s.id)).length} / {catSpaces.length}
                          </span>
                        </div>

                        <div className="d-flex flex-wrap gap-2" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                          {catSpaces.map(sp => {
                            const isChecked = selectedSpaceIds.includes(sp.id);
                            return (
                              <button
                                key={sp.id}
                                type="button"
                                onClick={() => handleToggleSpace(sp.id)}
                                className={`btn btn-sm rounded-pill py-1 px-3 text-start d-inline-flex align-items-center gap-2 border transition-all ${
                                  isChecked
                                    ? 'btn-primary text-white border-primary shadow-xs'
                                    : 'btn-outline-light text-secondary border-secondary-subtle bg-light'
                                }`}
                                style={{ fontSize: '0.825rem' }}
                              >
                                <span>{sp.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Global KPI Cards */}
        {reportData && (
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="text-secondary fw-semibold small">Horas Recurrentes</span>
                  <div className="p-2 rounded-3 bg-primary-subtle text-primary">
                    <Clock size={20} />
                  </div>
                </div>
                <h2 className="display-6 fw-bold text-dark mb-1">{reportData.grandTotal.recurringHours} hrs</h2>
                <div className="text-muted small">
                  Horarios asignados durante el cuatrimestre (Clases y asignaturas)
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="text-secondary fw-semibold small">Horas NO Recurrentes</span>
                  <div className="p-2 rounded-3 bg-success-subtle text-success">
                    <Users size={20} />
                  </div>
                </div>
                <h2 className="display-6 fw-bold text-dark mb-1">{reportData.grandTotal.nonRecurringHours} hrs</h2>
                <div className="text-muted small">
                  Horarios adicionales solicitados por maestros o alumnos
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="text-secondary fw-semibold small">Horas Renta de Espacios</span>
                  <div className="p-2 rounded-3 bg-warning-subtle text-warning">
                    <Sparkles size={20} />
                  </div>
                </div>
                <h2 className="display-6 fw-bold text-dark mb-1">{reportData.grandTotal.rentalHours} hrs</h2>
                <div className="text-muted small">
                  Horas de renta comercial o externa del laboratorio/espacio
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100 text-white" style={{ background: 'linear-gradient(135deg, #145775 0%, #ff9500 100%)' }}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="text-white-50 fw-semibold small">Gran Total General</span>
                  <div className="p-2 rounded-3 bg-white bg-opacity-25 text-white">
                    <Layers size={20} />
                  </div>
                </div>
                <h2 className="display-6 fw-bold text-white mb-1">{reportData.grandTotal.totalHours} hrs</h2>
                <div className="text-white-50 small">
                  Total global acumulado en {reportData.grandTotal.totalSpaces} espacios analizados
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories Breakdown (No mezclar un tipo con otro) */}
        {reportData && (
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4 p-md-5 mb-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4 pb-3 border-bottom">
              <div>
                <h4 className="fw-bold text-dark mb-1">Desglose de Horas por Tipo de Espacio</h4>
                <p className="text-muted small mb-0">
                  Tablas organizadas lógicamente por categoría para evitar mezclar tipos de espacios.
                </p>
              </div>
              <span className="badge bg-light text-primary border px-3 py-2 rounded-pill fw-semibold">
                Período: {reportData.periodLabel}
              </span>
            </div>

            {reportData.categories.map((cat, catIdx) => (
              <div key={cat.category} className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-3 bg-light p-3 rounded-3 border">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary rounded-pill px-3 py-1">
                      {catIdx + 1}
                    </span>
                    <h5 className="mb-0 fw-bold text-dark">{cat.category}</h5>
                    <span className="badge bg-secondary-subtle text-secondary rounded-pill small">
                      {cat.spacesCount} {cat.spacesCount === 1 ? 'espacio' : 'espacios'}
                    </span>
                  </div>
                  <div className="fw-bold text-primary">
                    Subtotal Categoría: {cat.totalHours} hrs
                  </div>
                </div>

                <div className="table-responsive rounded-3 border mb-2">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light text-secondary small">
                      <tr>
                        <th style={{ minWidth: '220px' }}>Espacio</th>
                        <th className="text-center" style={{ minWidth: '140px' }}>Horas Recurrentes</th>
                        <th className="text-center" style={{ minWidth: '140px' }}>Horas NO Recurrentes</th>
                        <th className="text-center" style={{ minWidth: '140px' }}>Horas Renta</th>
                        <th className="text-center fw-bold" style={{ minWidth: '130px' }}>Total Horas</th>
                        <th className="text-center" style={{ width: '120px' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cat.spaces.map(sp => (
                        <tr key={sp.spaceId}>
                          <td className="fw-semibold text-dark">
                            {sp.name}
                          </td>
                          <td className="text-center text-secondary">
                            <span className="badge bg-primary-subtle text-primary px-2 py-1 rounded-pill">
                              {sp.recurringHours} hrs
                            </span>
                            <div className="small text-muted">{sp.recurringCount} bloques</div>
                          </td>
                          <td className="text-center text-secondary">
                            <span className="badge bg-success-subtle text-success px-2 py-1 rounded-pill">
                              {sp.nonRecurringHours} hrs
                            </span>
                            <div className="small text-muted">{sp.reservationCount} reservas</div>
                          </td>
                          <td className="text-center text-secondary">
                            <span className="badge bg-warning-subtle text-warning px-2 py-1 rounded-pill">
                              {sp.rentalHours} hrs
                            </span>
                            <div className="small text-muted">{sp.rentalCount} rentas</div>
                          </td>
                          <td className="text-center fw-bold text-dark fs-6">
                            {sp.totalHours} hrs
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              onClick={() => setPreviewSpace(sp)}
                              className="btn btn-sm btn-outline-primary rounded-pill px-3 d-inline-flex align-items-center gap-1"
                            >
                              <Eye size={14} />
                              <span>Ver Malla</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="table-light fw-bold">
                      <tr>
                        <td>SUBTOTAL {cat.category.toUpperCase()}</td>
                        <td className="text-center text-primary">{cat.recurringHours} hrs</td>
                        <td className="text-center text-success">{cat.nonRecurringHours} hrs</td>
                        <td className="text-center text-warning">{cat.rentalHours} hrs</td>
                        <td className="text-center text-dark">{cat.totalHours} hrs</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal / Section for Previewing Timetable Grid */}
        {previewSpace && (
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4 p-md-5 mb-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pb-3 mb-4 border-bottom">
              <div>
                <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1 mb-2">
                  VISTA PREVIA DE MALLA TIPO BITÁCORA
                </span>
                <h3 className="fw-bold text-dark mb-1">{previewSpace.name}</h3>
                <p className="text-muted small mb-0">
                  Categoría: <strong>{previewSpace.category}</strong> | Horas Recurrentes: <strong>{previewSpace.recurringHours} hrs</strong> | NO Recurrentes: <strong>{previewSpace.nonRecurringHours} hrs</strong> | Renta: <strong>{previewSpace.rentalHours} hrs</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewSpace(null)}
                className="btn btn-sm btn-outline-secondary rounded-pill px-3"
              >
                Cerrar Malla
              </button>
            </div>

            <div className="table-responsive rounded-3 border">
              <table className="table table-bordered table-sm align-middle text-center mb-0" style={{ fontSize: '0.85rem' }}>
                <thead className="table-secondary text-dark fw-bold">
                  <tr>
                    <th style={{ width: '130px' }}>HORA</th>
                    {DAYS_OF_WEEK_MAP.map(d => (
                      <th key={d.index} style={{ minWidth: '150px' }}>{d.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map(slot => (
                    <tr key={slot}>
                      <td className="fw-semibold bg-light text-secondary text-nowrap">{slot}</td>
                      {DAYS_OF_WEEK_MAP.map(day => {
                        const items = previewSpace.grid[day.index]?.[slot] || [];
                        const isRented = items.some(i => i.startsWith('[RENTA]'));
                        const isReservation = items.some(i => i.startsWith('[RESERVA]'));

                        let bgClass = '';
                        if (isRented) bgClass = 'bg-warning-subtle text-warning-emphasis';
                        else if (isReservation) bgClass = 'bg-success-subtle text-success-emphasis';
                        else if (items.length > 0) bgClass = 'bg-primary-subtle text-primary-emphasis';

                        return (
                          <td key={day.index} className={bgClass} style={{ verticalAlign: 'top', padding: '6px' }}>
                            {items.length > 0 ? (
                              <div className="d-flex flex-column gap-1 text-start">
                                {items.map((it, idx) => (
                                  <div key={idx} className="small fw-medium lh-sm p-1 rounded bg-white bg-opacity-75 border">
                                    {it}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted opacity-25">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
