'use client';

import React from 'react';
import Link from 'next/link';
import { useTenant } from '@/context/TenantContext';
import { ShieldCheck, FileText, Download, ArrowLeft, ExternalLink, Mail, Phone, Building2 } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const tenant = useTenant();
  const rawContent = tenant?.config?.privacyPolicy || '';
  const isUniva = tenant?.slug === 'tuceproa' || rawContent.includes('UNIVA') || rawContent.includes('Instituto Superior Autónomo de Occidente');
  const pdfUrl = 'https://www.univa.mx/wp-content/uploads/2023/09/Aviso-de-Privacidad-2023-WEB.pdf';

  // Format paragraphs and list items cleanly
  const renderFormattedContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentBullets: string[] = [];

    const flushBullets = (keyPrefix: string) => {
      if (currentBullets.length > 0) {
        elements.push(
          <ul key={`${keyPrefix}-list`} className="list-group list-group-flush mb-3 rounded-3 border">
            {currentBullets.map((bullet, idx) => (
              <li key={idx} className="list-group-item bg-light text-secondary d-flex align-items-start gap-2 py-2 px-3">
                <span className="text-primary fw-bold mt-1">•</span>
                <span>{linkifyText(bullet)}</span>
              </li>
            ))}
          </ul>
        );
        currentBullets = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (!trimmed) {
        flushBullets(`empty-${index}`);
        return;
      }

      // Check bullet point
      if (trimmed.startsWith('•') || trimmed.startsWith('- ')) {
        const bulletText = trimmed.replace(/^[•\-]\s*/, '');
        currentBullets.push(bulletText);
        return;
      }

      // If we had bullet points, flush them before starting normal paragraph or heading
      flushBullets(`flush-${index}`);

      // Check if line is a numbered header (e.g., "1. PROTECCIÓN") or uppercase heading
      const isNumberedHeader = /^\d+\.\s+[A-ZÁÉÍÓÚÑ\s,()]+$/.test(trimmed);
      const isMainHeader = /^[A-ZÁÉÍÓÚÑ\s,()]{4,}$/.test(trimmed) && trimmed.length < 60;

      if (isNumberedHeader || isMainHeader) {
        elements.push(
          <h5 key={`head-${index}`} className="fw-bold text-dark mt-4 mb-2 d-flex align-items-center gap-2">
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle me-1" style={{ fontSize: '0.75rem' }}>
              SECCIÓN
            </span>
            {trimmed}
          </h5>
        );
      } else {
        elements.push(
          <p key={`p-${index}`} className="text-secondary mb-3" style={{ lineHeight: '1.7', fontSize: '0.975rem' }}>
            {linkifyText(trimmed)}
          </p>
        );
      }
    });

    flushBullets('final');
    return elements;
  };

  // Helper to convert URLs and emails in text into clickable anchors
  const linkifyText = (text: string) => {
    const parts = text.split(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|https?:\/\/[^\s)]+)/g);
    return parts.map((part, i) => {
      if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(part)) {
        return (
          <a key={i} href={`mailto:${part}`} className="text-primary text-decoration-underline fw-medium">
            {part}
          </a>
        );
      } else if (/^https?:\/\//.test(part)) {
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-underline fw-medium d-inline-inline-flex align-items-center gap-1">
            {part} <ExternalLink size={12} className="d-inline" />
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="bg-light min-vh-100" style={{ paddingTop: '95px', paddingBottom: '70px' }}>
      <div className="container" style={{ maxWidth: '920px' }}>
        
        {/* Navigation Breadcrumb */}
        <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <Link href="/" className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2 rounded-pill px-3 shadow-sm bg-white">
            <ArrowLeft size={16} /> Volver al Inicio
          </Link>
          <span className="badge bg-white text-secondary border shadow-sm px-3 py-2 rounded-pill d-inline-flex align-items-center gap-2">
            <ShieldCheck size={16} className="text-success" />
            <span>Documento Legal Oficial</span>
          </span>
        </div>

        {/* Header Card */}
        <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden" style={{ background: 'linear-gradient(135deg, #145775 0%, #0d3b50 100%)' }}>
          <div className="card-body p-4 p-md-5 text-white">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-warning text-dark fw-bold px-3 py-1 rounded-pill">
                LFPDPPP
              </span>
              <span className="text-white-50" style={{ fontSize: '0.875rem' }}>
                Actualizado: 8 de septiembre de 2023
              </span>
            </div>
            <h1 className="h2 fw-bold text-white mb-2">Aviso de Privacidad Integral</h1>
            <p className="lead text-white-50 mb-4" style={{ fontSize: '1.05rem', maxWidth: '720px' }}>
              {isUniva
                ? 'Instituto Superior Autónomo de Occidente, A.C. — Universidad del Valle de Atemajac (UNIVA)'
                : tenant?.config?.siteName || tenant?.name || 'Fluxio RSV'}
            </p>

            <div className="d-flex flex-wrap gap-3 align-items-center pt-2 border-top border-white-50 border-opacity-25">
              {isUniva && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-warning fw-bold text-dark d-inline-flex align-items-center gap-2 rounded-pill px-4 py-2 shadow-sm"
                >
                  <Download size={18} />
                  Descargar Aviso en PDF (Oficial)
                  <ExternalLink size={14} />
                </a>
              )}
              <div className="text-white-50 small d-flex align-items-center gap-2">
                <Building2 size={16} />
                <span>Av. Tepeyac No 4800, Fracc. Prados Tepeyac, Zapopan, Jal. C.P. 45050</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="card border-0 shadow-sm rounded-4 bg-white p-4 p-md-5 mb-4">
          <div className="mb-4 pb-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2 text-dark">
              <FileText size={20} className="text-primary" />
              <h4 className="mb-0 fw-bold">Términos y Tratamiento de Datos</h4>
            </div>
            {isUniva && (
              <span className="badge bg-light text-secondary border px-3 py-2 rounded-pill">
                Vigencia Institucional UNIVA
              </span>
            )}
          </div>

          <div className="privacy-body">
            {rawContent ? (
              renderFormattedContent(rawContent)
            ) : (
              <div className="text-secondary">
                <p>Cargando aviso de privacidad institucional...</p>
              </div>
            )}
          </div>

          {/* ARCO Rights Box Callout */}
          {isUniva && (
            <div className="card border-primary border-opacity-25 bg-primary-subtle rounded-4 p-4 mt-5">
              <h5 className="fw-bold text-primary mb-3 d-flex align-items-center gap-2">
                <ShieldCheck size={20} />
                Contacto para Ejercicio de Derechos ARCO
              </h5>
              <p className="text-dark mb-3" style={{ fontSize: '0.95rem' }}>
                Para solicitar el Acceso, Rectificación, Cancelación u Oposición de sus datos personales, o revocar su consentimiento, comuníquese con el Departamento de Protección de Datos de UNIVA:
              </p>
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="bg-white rounded-3 p-3 border shadow-sm d-flex align-items-center gap-3">
                    <Mail className="text-primary" size={24} />
                    <div>
                      <div className="text-muted small">Correo Oficial</div>
                      <a href="mailto:datos.personales@univa.mx" className="text-primary fw-bold text-decoration-none">
                        datos.personales@univa.mx
                      </a>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="bg-white rounded-3 p-3 border shadow-sm d-flex align-items-center gap-3">
                    <Phone className="text-primary" size={24} />
                    <div>
                      <div className="text-muted small">Atención Telefónica</div>
                      <div className="text-dark fw-bold">(0133) 31 34 08 00, ext. 1401</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-muted small">
                Titular del Área: <strong>Mtra. Delia Villarruel Villarruel</strong> | Plazo legal de respuesta: <strong>15 días naturales</strong>.
              </div>
            </div>
          )}

          {/* INAI / Legal footer */}
          <div className="mt-4 pt-3 border-top text-muted small d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
            <span>
              Para mayor información sobre la protección de datos personales, consulte el sitio del{' '}
              <a href="https://home.inai.org.mx/" target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-underline">
                INAI (Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales)
              </a>.
            </span>
            <span className="text-nowrap">Última revisión: Septiembre 2023</span>
          </div>
        </div>

      </div>
    </div>
  );
}
