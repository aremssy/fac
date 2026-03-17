import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { CrudTable } from '@/components/CrudTable';
import { Pagination } from '@/components/ui/pagination';
import { CrudFormModal } from '@/components/CrudFormModal';
import { toast } from '@/components/custom-toast';

export default function Leads() {
  const { t } = useTranslation();
  const { leads, filters: pageFilters = {}, auth } = usePage().props as any;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(pageFilters.status || 'all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [convertLead, setConvertLead] = useState<any>(null);
  const isSuperAdmin = auth?.user?.type === 'superadmin' || auth?.user?.type === 'super admin';

  const applyFilters = () => {
    const params: any = { page: 1 };
    if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    router.get(route('crm.leads.index'), params, { preserveState: true, preserveScroll: true });
  };

  const columns = [
    { key: 'id', label: t('ID'), sortable: true },
    { key: 'title', label: t('Title'), sortable: true },
    { key: 'contact_name', label: t('Contact'), sortable: false },
    { key: 'contact_email', label: t('Email'), sortable: false },
    { key: 'phone', label: t('Phone'), sortable: false },
    { key: 'company_name', label: t('Company'), sortable: false },
    { key: 'source', label: t('Source'), sortable: false },
    { key: 'status', label: t('Status'), sortable: true },
    { key: 'assigned_to', label: t('Assignee'), sortable: true, render: (row: any) => row.assigned_to },
  ];

  const actions = [
    { label: t('Edit'), icon: null, variant: 'outline', onClick: (row: any) => handleEdit(row) },
    { label: t('Convert'), icon: null, variant: 'default', onClick: (row: any) => setConvertLead(row) },
    ...(isSuperAdmin ? [{ label: t('Reassign'), icon: null, variant: 'secondary', onClick: (row: any) => handleReassign(row) }] : []),
  ];

  const handleEdit = (row: any) => {
    setIsFormOpen(true);
    setTimeout(() => {
      // no-op; modal controlled below
    });
  };

  const handleReassign = async (row: any) => {
    const assigned_to = prompt(t('Enter new assignee user ID'), row.assigned_to || '');
    if (!assigned_to) return;
    try {
      await router.put(route('crm.leads.reassign', row.id), { assigned_to }, { preserveState: true, preserveScroll: true });
      toast.success(t('Lead reassigned'));
    } catch (e: any) {
      toast.error(e?.message || t('Failed to reassign'));
    }
  };

  const statusOptions = [
    { label: t('All'), value: 'all' },
    { label: t('New'), value: 'new' },
    { label: t('In Progress'), value: 'in_progress' },
    { label: t('Won'), value: 'won' },
    { label: t('Lost'), value: 'lost' },
    { label: t('Converted'), value: 'converted' },
  ];

  return (
    <PageTemplate
      title={t('Leads')}
      url={route('crm.leads.index')}
      description=""
      actions={[
        {
          label: t('Add Lead'),
          variant: 'default',
          onClick: () => router.get(route('crm.leads.create')),
        },
      ]}
    >
      <div className='mb-4'>
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={(e) => { e.preventDefault(); applyFilters(); }}
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
            router.get(route('crm.leads.index'), {
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
          actions={[
            { label: t('Edit'), icon: 'Edit', action: 'edit' },
            { label: t('Convert'), icon: 'CheckSquare', action: 'convert' },
            ...(isSuperAdmin ? [{ label: t('Reassign'), icon: 'Users', action: 'reassign' }] : []),
          ]}
          data={leads?.data || []}
          from={leads?.from || 1}
          onAction={(action, row) => {
            if (action === 'edit') handleEdit(row);
            if (action === 'convert') setConvertLead(row);
            if (action === 'reassign') handleReassign(row);
          }}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction}
          onSort={(field: string) => {
            router.get(route('crm.leads.index'), {
              page: leads?.current_page || 1,
              status: statusFilter !== 'all' ? statusFilter : undefined,
              sort_field: field,
            }, { preserveState: true, preserveScroll: true });
          }}
          permissions={[]}
          entityPermissions={{ view: '', edit: '', delete: '' }}
        />

        <Pagination
          from={leads?.from || 0}
          to={leads?.to || 0}
          total={leads?.total || 0}
          links={leads?.links}
          entityName={t('leads')}
          onPageChange={(url) => router.get(url)}
        />
      </div>

      

      {convertLead && (
        <CrudFormModal
          isOpen={!!convertLead}
          onClose={() => setConvertLead(null)}
          onSubmit={async (values) => {
            try {
              await router.post(route('crm.leads.convert', convertLead.id), values, { preserveState: true, preserveScroll: true });
              setConvertLead(null);
              toast.success(t('Lead converted'));
            } catch (e: any) {
              toast.error(e?.message || t('Failed to convert lead'));
            }
          }}
          formConfig={{
            fields: [
              { name: 'company_name', label: t('Company Name'), type: 'text', required: true },
              { name: 'commission_amount', label: t('Commission Amount'), type: 'number', required: true },
            ],
            modalSize: 'sm',
          }}
          initialData={{
            company_name: convertLead?.company_name || '',
          }}
          title={t('Convert Lead')}
          mode="create"
        />
      )}
    </PageTemplate>
  );
}
