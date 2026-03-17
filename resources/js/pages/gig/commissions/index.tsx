import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { CrudTable } from '@/components/CrudTable';
import { Pagination } from '@/components/ui/pagination';

export default function Commissions() {
  const { t } = useTranslation();
  const { commissions, filters: pageFilters = {} } = usePage().props as any;
  const [statusFilter, setStatusFilter] = useState(pageFilters.status || 'all');

  const applyFilters = () => {
    const params: any = { page: 1 };
    if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    router.get(route('gig-workforce.commissions.index'), params, { preserveState: true, preserveScroll: true });
  };

  const columns: any[] = [
    { key: 'id', label: t('ID'), sortable: true },
    { key: 'lead.title', label: t('Lead Title'), sortable: false },
    { key: 'amount', label: t('Amount'), sortable: true, type: 'currency' },
    { key: 'status', label: t('Status'), sortable: true, type: 'badge' },
    { key: 'paid_at', label: t('Paid At'), sortable: true, type: 'date' },
    { key: 'created_at', label: t('Created At'), sortable: true, type: 'date' },
  ];

  const statusOptions = [
    { label: t('All'), value: 'all' },
    { label: t('Pending'), value: 'pending' },
    { label: t('Approved'), value: 'approved' },
    { label: t('Paid'), value: 'paid' },
  ];

  return (
    <PageTemplate title={t('Commissions')} description="" url={route('gig-workforce.commissions.index')}>
      <div className='mb-4'>
        <SearchAndFilterBar
          searchTerm={''}
          onSearchChange={() => {}}
          onSearch={(e) => { e.preventDefault(); }}
          filters={[
            {
              name: 'status',
              label: t('Status'),
              type: 'select',
              value: statusFilter,
              onChange: setStatusFilter,
              options: statusOptions,
            },
          ]}
          showFilters={true}
          setShowFilters={() => {}}
          hasActiveFilters={() => statusFilter !== 'all'}
          activeFilterCount={() => (statusFilter !== 'all' ? 1 : 0)}
          onResetFilters={() => {
            setStatusFilter('all');
            applyFilters();
          }}
          onApplyFilters={applyFilters}
          currentPerPage={pageFilters.per_page?.toString() || '10'}
          onPerPageChange={(value) => {
            router.get(route('gig-workforce.commissions.index'), {
              page: 1,
              per_page: parseInt(value),
              status: statusFilter !== 'all' ? statusFilter : undefined,
            }, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      <div className='bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden'>
        <CrudTable
          columns={columns}
          actions={[]}
          data={commissions?.data || []}
          from={commissions?.from || 1}
          onAction={() => {}}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction}
          onSort={(field: string) => {
            router.get(route('gig-workforce.commissions.index'), {
              page: commissions?.current_page || 1,
              status: statusFilter !== 'all' ? statusFilter : undefined,
              sort_field: field,
            }, { preserveState: true, preserveScroll: true });
          }}
          permissions={[]}
          entityPermissions={{ view: '', edit: '', delete: '' }}
        />

        <Pagination
          from={commissions?.from || 0}
          to={commissions?.to || 0}
          total={commissions?.total || 0}
          links={commissions?.links}
          entityName={t('commissions')}
          onPageChange={(url) => router.get(url)}
        />
      </div>
    </PageTemplate>
  );
}
