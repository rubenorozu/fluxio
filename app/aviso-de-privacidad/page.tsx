'use client';

import React from 'react';
import { useTenant } from '@/context/TenantContext';

export default function PrivacyPolicyPage() {
  const tenant = useTenant();

  if (tenant?.config?.privacyPolicy) {
    return (
      <div className="container" style={{ paddingTop: '100px', paddingBottom: '50px' }}>
        <div style={{ whiteSpace: 'pre-wrap' }}>
          {tenant.config.privacyPolicy}
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '50px' }}>
      <h2>AVISO DE PRIVACIDAD INTEGRAL</h2>
      <p><strong>{tenant?.name || 'Fluxio RSV'}</strong></p>
      <p>Última actualización: {new Date().getFullYear()}</p>

      <h4>1. Identidad y domicilio del responsable</h4>
      <p>{tenant?.name || 'Fluxio RSV'} es responsable del tratamiento de los datos personales recabados a través de esta plataforma educativa.</p>

      <h4>2. Datos personales que serán sometidos a tratamiento</h4>
      <p>Para las finalidades descritas en el presente aviso, se podrán recabar los siguientes datos personales:</p>
      <ul>
        <li>Nombre completo</li>
        <li>Correo electrónico</li>
        <li>Número telefónico</li>
        <li>Rol de usuario</li>
        <li>Historial de préstamos y reservaciones</li>
        <li>Inscripciones a talleres</li>
      </ul>
      <p>No se recabarán datos personales sensibles.</p>

      <h4>3. Finalidades del tratamiento</h4>
      <p>Los datos personales se utilizarán para las siguientes finalidades primarias:</p>
      <ul>
        <li>Gestionar el préstamo de recursos y equipos.</li>
        <li>Procesar la inscripción a talleres y actividades académicas.</li>
        <li>Validar la identidad y rol del usuario.</li>
      </ul>

      <h4>4. Derechos ARCO</h4>
      <p>Usted podrá acceder, rectificar, cancelar u oponerse al tratamiento de sus datos personales enviando una solicitud al correo electrónico: {tenant?.config?.contactEmail || 'contacto@fluxiorsv.com.mx'}</p>
    </div>
  );
}
