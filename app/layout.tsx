import "bootstrap/dist/css/bootstrap.min.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "../globals.css";
import "react-datepicker/dist/react-datepicker.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ClientWrapper from "@/components/ClientWrapper";
import { TenantProvider } from "@/context/TenantContext";
import { TenantStyles } from "@/components/TenantStyles";
import { headers } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await detectTenant();
  return {
    title: tenant?.config?.siteName || tenant?.name || "Fluxio RSV",
    description: "Aplicación para la gestión y reserva de espacios y equipos.",
    icons: {
      icon: tenant?.config?.faviconUrl || '/assets/FaviconFluxioRSV.svg',
      shortcut: tenant?.config?.faviconUrl || '/assets/FaviconFluxioRSV.svg',
      apple: tenant?.config?.faviconUrl || '/assets/FaviconFluxioRSV.svg',
    },
  };
}

import { detectTenant } from "@/lib/tenant/detection";

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Detectar tenant usando la utilidad de servidor (que consulta la DB)
  const detectedTenant = await detectTenant();
  console.log('[RootLayout] Detected Tenant:', detectedTenant?.slug);

  const tenant = detectedTenant || {
    id: '',
    slug: '',
    name: 'Fluxio RSV',
  };

  // Hide header/footer for landing page (localhost without subdomain)
  const isLandingPage = !detectedTenant || !detectedTenant.slug || detectedTenant.slug === 'default';

  return (
    <html lang="es" className={isLandingPage ? '' : 'h-100'}>
      <body className={isLandingPage ? inter.className : `${inter.className} d-flex flex-column h-100`} style={isLandingPage ? { margin: 0, padding: 0 } : {}}>
        <TenantProvider tenant={tenant}>
          <TenantStyles />
          <ClientWrapper>
            {!isLandingPage && <Header />}
            <main className={isLandingPage ? '' : 'flex-shrink-0 mb-0 mb-md-auto'}>
              {children}
            </main>
            {!isLandingPage && <Footer />}
          </ClientWrapper>
        </TenantProvider>
      </body>
    </html>
  );
}
