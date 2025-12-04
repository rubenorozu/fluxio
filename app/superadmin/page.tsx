import { redirect } from 'next/navigation';

export default function SuperAdminDashboard() {
    // Redirect to the internal home page (Tenant Main View)
    // The user wants to see the "Main Page" (Hero + Resources) not the Admin Dashboard.
    redirect('/home');
}
