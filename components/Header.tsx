'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Spinner } from 'react-bootstrap';
import { useCart } from '@/context/CartContext';
import { useSession } from '@/context/SessionContext';
import { useTenant } from '@/context/TenantContext';
import styles from './Header.module.css';

const Header = () => {
  const router = useRouter();
  const { cart } = useCart();
  const { user, loading: sessionLoading, logout, unreadCount } = useSession();
  const tenant = useTenant();
  const navbarRef = useRef<HTMLDivElement>(null);

  const isPlatformAdmin = tenant?.slug === 'platform';

  // Always redirect to / - the home page will show carousel if logged in, landing if not
  const homeUrl = '/';

  useEffect(() => {
    // Logic to close Bootstrap navbar on link click
    const navbarCollapse = document.getElementById('main-nav');
    if (navbarCollapse) {
      const navbarCollapse = document.getElementById('main-nav');
      if (navbarCollapse) {
        navbarCollapse.addEventListener('click', (event) => {
          const target = event.target as HTMLElement;
          // Check if the clicked element or its parent is a nav-link or dropdown-item
          if (
            (target.matches('.nav-link') && !target.hasAttribute('data-bs-toggle')) || // Regular nav-links (not dropdown toggles)
            target.matches('.dropdown-item') || // Dropdown items
            (target.closest('.nav-link') && !target.closest('.nav-link')?.hasAttribute('data-bs-toggle')) || // Child of regular nav-link
            target.closest('.dropdown-item') || // Child of dropdown item
            target.matches('.btn') || // Check if the clicked element is a button
            target.closest('.btn') // Check if the clicked element is inside a button
          ) {
            const navbarToggler = document.querySelector('.navbar-toggler');
            if (navbarToggler) {
              (navbarToggler as HTMLElement).click(); // Simulate a click on the toggler button
            }
          }
        });
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target as Node)) {
        const navbarToggler = document.querySelector('.navbar-toggler');
        if (navbarToggler && navbarToggler.getAttribute('aria-expanded') === 'true') {
          (navbarToggler as HTMLElement).click();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    // Use window.location.href instead of router.push to force a full page reload
    // This ensures the layout correctly detects we're on the landing page
    window.location.href = '/';
  };

  return (
    <header className="fixed-top bg-white shadow-sm">
      <nav className="navbar navbar-expand-lg navbar-light py-0 px-0">
        <div className="container-fluid px-0 pe-3 px-md-3">
          <Link href={homeUrl} className="d-flex align-items-center text-decoration-none">
            {tenant?.config?.topLogoUrl ? (
              <div style={{ position: 'relative', width: 'auto', height: `${tenant.config.topLogoHeight || 50}px`, marginRight: '10px' }}>
                <img
                  src={tenant.config.topLogoUrl}
                  alt={tenant.config.siteName || tenant.name}
                  style={{ height: '100%', width: 'auto', objectFit: 'contain' }}
                />
              </div>
            ) : (
              <span className="fs-4 fw-bold text-primary me-2">{tenant?.config?.siteName || tenant?.name || 'Fluxio RSV'}</span>
            )}
          </Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#main-nav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse w-100 w-md-auto" id="main-nav" ref={navbarRef}> {/* Added w-100 w-md-auto for stability */}
            <ul className="navbar-nav ms-auto align-items-center" style={{ minWidth: '150px' }}> {/* Added minWidth for stability */}
              <li className="nav-item"><Link href={homeUrl} className="nav-link">Inicio</Link></li>
              <li className="nav-item"><Link href="/recursos" className="nav-link">Recursos</Link></li>

              {sessionLoading ? (
                <li className="nav-item" key="loading-state"><span className="nav-link"><Spinner animation="border" size="sm" /></span></li>
              ) : user ? (
                <React.Fragment key="logged-in-state">
                  <li className="nav-item">
                    <Link href="/cart" className="nav-link">
                      Carrito <span className="badge rounded-pill bg-warning text-dark">{cart.length}</span>
                    </Link>
                  </li>
                  <li className="nav-item dropdown">
                    <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                      {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                      {unreadCount > 0 && <span className="badge rounded-pill bg-danger ms-2">{unreadCount}</span>}
                    </a>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li><Link href="/profile" className="dropdown-item">Mi espacio</Link></li>
                      <li><Link href="/reservations" className="dropdown-item">Mis Reservas</Link></li>
                      <li><Link href="/my-workshops" className="dropdown-item">Mis Talleres</Link></li>
                      <li><Link href="/notifications" className="dropdown-item">Notificaciones {unreadCount > 0 && <span className="badge rounded-pill bg-danger">{unreadCount}</span>}</Link></li>
                      <li><hr className="dropdown-divider" /></li>
                      {(user.role === 'SUPERUSER' || user.role === 'ADMIN_RESERVATION' || user.role === 'ADMIN_RESOURCE') && (
                        <li><Link href="/admin" className="dropdown-item">Admin Dashboard</Link></li>
                      )}
                      {user.role === 'SUPERUSER' && isPlatformAdmin && (
                        <>
                          <li><Link href="/admin/tenants" className="dropdown-item">Gestión de Organizaciones</Link></li>
                          <li><Link href="/admin/landing-config" className="dropdown-item">Configuración de Landing</Link></li>
                        </>
                      )}
                      {(user.role === 'SUPERUSER' || user.role === 'VIGILANCIA') && (
                        <li><Link href="/vigilancia/dashboard" className="dropdown-item">Dashboard Vigilancia</Link></li>
                      )}
                      {user.role === 'CALENDAR_VIEWER' && (
                        <li><Link href="/admin/calendars" className="dropdown-item">Ver Calendario</Link></li>
                      )}
                      {user.role === 'SUPERUSER' && (
                        <li><hr className="dropdown-divider" /></li>
                      )}
                      <li><a href="#" className="dropdown-item" onClick={handleLogout}>Logout</a></li>
                    </ul>
                  </li>
                </React.Fragment>
              ) : (
                <>
                  <li className="nav-item"><Link href="/login" className="nav-link">Login</Link></li>
                  {/* Hide registration for platform tenant (main tenant) */}
                  {tenant?.slug !== 'platform' && (
                    <li className="nav-item">
                      <Link href="/register" className="btn btn-primary text-white">Registro</Link>
                    </li>
                  )}
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
