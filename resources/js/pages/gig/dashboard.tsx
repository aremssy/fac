import { usePage } from '@inertiajs/react';
import { PageTemplate } from '@/components/page-template';

export default function GigDashboard() {
  const { dashboard } = usePage().props as any;
  const stats = dashboard || {};
  return (
    <PageTemplate title="Gig-Workforce Dashboard" description="" url={route('gig-workforce.dashboard')}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-gray-900 rounded shadow">
          <div className="text-sm text-muted-foreground">Assigned Companies</div>
          <div className="text-2xl font-semibold">{stats.assigned_companies || 0}</div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-900 rounded shadow">
          <div className="text-sm text-muted-foreground">Leads Total</div>
          <div className="text-2xl font-semibold">{stats.leads_total || 0}</div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-900 rounded shadow">
          <div className="text-sm text-muted-foreground">Leads Converted</div>
          <div className="text-2xl font-semibold">{stats.leads_converted || 0}</div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-900 rounded shadow">
          <div className="text-sm text-muted-foreground">Leads In Progress</div>
          <div className="text-2xl font-semibold">{stats.leads_in_progress || 0}</div>
        </div>
      </div>
    </PageTemplate>
  );
}
