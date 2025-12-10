import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Dominio Personalizado - Admin',
    description: 'Configura tu dominio personalizado',
};

export default function CustomDomainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
