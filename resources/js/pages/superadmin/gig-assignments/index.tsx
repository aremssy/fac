import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { CrudTable } from '@/components/CrudTable';
import { Pagination } from '@/components/ui/pagination';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';

export default function GigAssignments() {
  const { t } = useTranslation();
  const { assignments, filters: pageFilters = {} } = usePage().props as any;
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [deleteRow, setDeleteRow] = useState<any>(null);

  const applyFilters = () => {
    const params: any = { page: 1 };
    if (searchTerm) params.search = searchTerm;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    router.get(route('gig-workforce.assignments.index'), params, { preserveState: true, preserveScroll: true });
  };

  const columns = [
    { key: 'id', label: t('ID'), sortable: true },
    { key: 'user.name', label: t('Gig User'), sortable: false },
    { key: 'company.name', label: t('Company'), sortable: false },
    { key: 'assigner.name', label: t('Assigned By'), sortable: false },
    { key: 'created_at', label: t('Created At'), sortable: true },
  ];

  const actions = [
    { label: t('Remove'), icon: 'Trash2', action: 'delete' },
  ];

  return (
    <PageTemplate title={t('Gig Assignments')} description="" url={route('gig-workforce.assignments.index')}>
      <div className="mb-4">
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={(e) => { e.preventDefault(); applyFilters(); }}
          filters={[]}
          showFilters={true}
          setShowFilters={() => {}}
          hasActiveFilters={() => !!searchTerm}
          activeFilterCount={() => (searchTerm ? 1 : 0)}
          onResetFilters={() => {
            setSearchTerm('');
            applyFilters();
          }}
          onApplyFilters={applyFilters}
          currentPerPage={pageFilters.per_page?.toString() || '10'}
          onPerPageChange={(value) => {
            router.get(route('gig-workforce.assignments.index'), {
              page: 1,
              per_page: parseInt(value),
              search: searchTerm || undefined,
            }, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <CrudTable
          columns={columns}
          actions={actions}
          data={assignments?.data || []}
          from={assignments?.from || 1}
          onAction={(action, row) => {
            if (action === 'delete') setDeleteRow(row);
          }}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction}
          onSort={(field: string) => {
            router.get(route('gig-workforce.assignments.index'), {
              page: assignments?.current_page || 1,
              sort_field: field,
              search: searchTerm || undefined,
            }, { preserveState: true, preserveScroll: true });
          }}
          permissions={[]}
          entityPermissions={{ view: '', edit: '', delete: '' }}
        />

        <Pagination
          from={assignments?.from || 0}
          to={assignments?.to || 0}
          total={assignments?.total || 0}
          links={assignments?.links}
          entityName={t('assignments')}
          onPageChange={(url) => router.get(url)}
        />
      </div>

      <CrudDeleteModal
        isOpen={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={async () => {
          try {
            await router.delete(route('gig-workforce.assignments.destroy', deleteRow.id), { preserveState: true, preserveScroll: true });
            setDeleteRow(null);
            toast.success(t('Assignment removed'));
          } catch (e: any) {
            toast.error(e?.message || t('Failed to remove assignment'));
          }
        }}
        itemName={deleteRow?.user?.name || `${deleteRow?.id}`}
        entityName={t('assignment')}
      />
    </PageTemplate>
  );
}
