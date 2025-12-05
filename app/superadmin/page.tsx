import { getServerSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function SuperAdminPage() {
    const session = await getServerSession();

    // If no session, redirect to login
    if (!session) {
        redirect('/login');
    }

    // If logged in, redirect to admin dashboard
    redirect('/admin');
}
