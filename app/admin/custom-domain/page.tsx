'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DomainConfig {
    customDomain: string | null;
    domainStatus: string;
    domainVerifiedAt: string | null;
    sslEnabled: boolean;
    plan: string;
    slug: string;
    dnsInstructions: {
        type: string;
        name: string;
        value: string;
        alternativeType?: string;
        alternativeValue?: string;
    } | null;
}

interface DNSInstructions {
    type: string;
    name: string;
    value: string;
    steps: string[];
}

export default function CustomDomainPage() {
    const router = useRouter();
    const [config, setConfig] = useState<DomainConfig | null>(null);
    const [customDomain, setCustomDomain] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' }>({
        text: '',
        type: 'info',
    });
    const [dnsInstructions, setDnsInstructions] = useState<DNSInstructions | null>(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    async function fetchConfig() {
        try {
            const res = await fetch('/api/admin/custom-domain');
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
                setCustomDomain(data.customDomain || '');
            }
        } catch (error) {
            console.error('Error fetching config:', error);
        }
    }

    async function handleSave() {
        setSaving(true);
        setMessage({ text: '', type: 'info' });
        setDnsInstructions(null);

        try {
            const res = await fetch('/api/admin/custom-domain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customDomain }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ text: data.message, type: 'success' });
                setDnsInstructions(data.dnsInstructions);
                await fetchConfig();
            } else {
                setMessage({ text: data.error, type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Error al guardar dominio', type: 'error' });
        } finally {
            setSaving(false);
        }
    }

    async function handleVerify() {
        setLoading(true);
        setMessage({ text: 'Verificando DNS...', type: 'info' });

        try {
            const res = await fetch('/api/admin/custom-domain', {
                method: 'PUT',
            });

            const data = await res.json();

            if (data.success) {
                setMessage({ text: data.message, type: 'success' });
                await fetchConfig();
            } else {
                setMessage({ text: data.message, type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Error al verificar DNS', type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    async function handleRemove() {
        if (!confirm('¿Estás seguro de eliminar el dominio personalizado?')) {
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/admin/custom-domain', { method: 'DELETE' });
            const data = await res.json();

            if (res.ok) {
                setMessage({ text: data.message, type: 'success' });
                setCustomDomain('');
                setDnsInstructions(null);
                await fetchConfig();
            } else {
                setMessage({ text: data.error, type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Error al eliminar dominio', type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    // Verificar si el plan permite custom domains
    const planAllowed = config && ['PROFESSIONAL', 'ENTERPRISE'].includes(config.plan);

    if (config && !planAllowed) {
        return (
            <div className="container" style={{ paddingTop: '100px', paddingBottom: '50px' }}>
                <div className="p-6 max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6">Dominio Personalizado</h1>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg
                                    className="h-4 w-4 text-yellow-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-lg font-medium text-yellow-800">
                                    Actualiza tu plan para usar dominios personalizados
                                </h3>
                                <p className="mt-2 text-yellow-700">
                                    Esta funcionalidad requiere un plan <strong>PROFESSIONAL</strong> o{' '}
                                    <strong>ENTERPRISE</strong>.
                                </p>
                                <p className="mt-2 text-sm text-yellow-600">
                                    Tu plan actual: <strong>{config.plan}</strong>
                                </p>
                                <a
                                    href="/admin/settings"
                                    className="mt-4 inline-block px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition"
                                >
                                    Ver planes disponibles →
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '50px' }}>
            <div className="p-6 max-w-4xl mx-auto">
                <div className="mb-3">
                    <button
                        onClick={() => router.push('/admin/settings')}
                        className="text-blue-600 hover:text-blue-800 d-flex align-items-center gap-2 mb-3"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver a Configuración
                    </button>
                </div>
                <h1 className="text-3xl font-bold mb-2">Dominio Personalizado</h1>
                <p className="text-gray-600 mb-6">
                    Configura tu propio dominio para que tus usuarios accedan a tu plataforma con tu marca.
                </p>

                {/* Estado actual */}
                {config?.domainStatus && config.domainStatus !== 'NOT_CONFIGURED' && (
                    <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                        <div>
                            <p className="font-semibold text-blue-900">
                                Estado: {getStatusLabel(config.domainStatus)}
                            </p>
                            {config.customDomain && (
                                <p className="text-sm text-blue-700 mt-1">Dominio: {config.customDomain}</p>
                            )}
                            {config.domainVerifiedAt && (
                                <p className="text-xs text-blue-600 mt-1">
                                    Verificado: {new Date(config.domainVerifiedAt).toLocaleString('es-MX')}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Formulario */}
                <div className="bg-white border rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Configurar Dominio</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tu Dominio o Subdominio Personalizado
                            </label>
                            <input
                                type="text"
                                value={customDomain}
                                onChange={(e) => setCustomDomain(e.target.value)}
                                placeholder="tudominio.com o app.tudominio.com"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={loading}
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Puedes usar un dominio (tudominio.com) o un subdominio (app.tudominio.com). No incluyas http://, https:// ni www.
                            </p>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving || !customDomain}
                            className="btn btn-primary"
                            style={{
                                opacity: (saving || !customDomain) ? 0.6 : 1,
                                cursor: (saving || !customDomain) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>

                {/* Instrucciones DNS */}
                {(config?.domainStatus === 'PENDING_DNS' || dnsInstructions) && (
                    <div className="bg-gray-50 border rounded-lg p-6 mb-6">
                        <h3 className="text-lg font-semibold mb-3">
                            Paso 2: Configura tu DNS
                        </h3>

                        <div className="bg-white border rounded p-4 mb-4">
                            <p className="text-sm font-medium mb-2">Agrega este registro en tu proveedor de DNS:</p>
                            <div className="bg-gray-100 p-3 rounded font-mono text-sm space-y-1">
                                <div>
                                    <span className="text-gray-600">Tipo:</span>{' '}
                                    <strong className="text-blue-600">CNAME</strong>
                                </div>
                                <div>
                                    <span className="text-gray-600">Nombre:</span>{' '}
                                    <strong className="text-blue-600">@</strong> (o tu dominio completo)
                                </div>
                                <div>
                                    <span className="text-gray-600">Valor:</span>{' '}
                                    <strong className="text-blue-600">{config?.slug}.fluxiorsv.com</strong>
                                </div>
                            </div>
                        </div>

                        {dnsInstructions?.steps && (
                            <div className="mb-4">
                                <p className="text-sm font-medium mb-2">Pasos detallados:</p>
                                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                                    {dnsInstructions.steps.map((step, index) => (
                                        <li key={index}>{step}</li>
                                    ))}
                                </ol>
                            </div>
                        )}

                        <p className="text-xs text-gray-600 mb-4">
                            ⏱️ La propagación DNS puede tardar de 10 minutos a 48 horas, pero usualmente es más
                            rápido (10-30 minutos).
                        </p>

                        <button
                            onClick={handleVerify}
                            disabled={loading}
                            className="btn btn-success"
                        >
                            {loading ? 'Verificando...' : 'Verificar DNS'}
                        </button>
                    </div>
                )}

                {/* Mensaje */}
                {message.text && (
                    <div
                        className={`p-4 rounded-lg mb-6 ${message.type === 'success'
                            ? 'bg-green-50 border-l-4 border-green-400 text-green-800'
                            : message.type === 'error'
                                ? 'bg-red-50 border-l-4 border-red-400 text-red-800'
                                : 'bg-blue-50 border-l-4 border-blue-400 text-blue-800'
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                {/* Dominio activo */}
                {config?.domainStatus === 'ACTIVE' && config.customDomain && (
                    <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded mb-6">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg
                                    className="h-4 w-4 text-green-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-lg font-medium text-green-800">¡Dominio activo!</h3>
                                <p className="mt-2 text-green-700">
                                    Tu plataforma está disponible en:{' '}
                                    <a
                                        href={`https://${config.customDomain}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold underline"
                                    >
                                        {config.customDomain}
                                    </a>
                                </p>
                                {config.sslEnabled && (
                                    <p className="mt-1 text-sm text-green-600">🔒 SSL habilitado (HTTPS)</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Eliminar dominio */}
                {config?.customDomain && (
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-2 text-gray-700">Zona de peligro</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Eliminar el dominio personalizado desactivará el acceso a través de este dominio.
                        </p>
                        <button
                            onClick={handleRemove}
                            disabled={loading}
                            className="btn btn-danger"
                        >
                            Eliminar dominio personalizado
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        NOT_CONFIGURED: 'No configurado',
        PENDING_DNS: 'Esperando configuración DNS',
        DNS_VERIFIED: 'DNS verificado',
        SSL_PENDING: 'Generando certificado SSL',
        ACTIVE: '✅ Activo',
        FAILED: '❌ Error',
    };
    return labels[status] || status;
}

function StatusIcon({ status }: { status: string }) {
    if (status === 'ACTIVE') {
        return (
            <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
        );
    }

    if (status === 'FAILED') {
        return (
            <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
        );
    }

    return (
        <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
    );
}
