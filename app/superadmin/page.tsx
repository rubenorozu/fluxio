import { redirect } from 'next/navigation';

export default function SuperAdminDashboard() {
    // Redirect to the main application dashboard (Root Tenant Dashboard)
    // The user prefers to see the resource management view by default.
    redirect('/admin');
}
