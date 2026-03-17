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
  const { assignments, filters: pageFilters = {}, gigUsers = [], unassignedCompanies = [] } = usePage().props as any;
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [deleteRow, setDeleteRow] = useState<any>(null);
  const [newAssignment, setNewAssignment] = useState<{ gig_user_id: string; company_id: string }>({ gig_user_id: '', company_id: '' });

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
      <div className="mb-4 bg-white dark:bg-gray-900 rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold mb-2">{t('Manual Company Assignment')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs">{t('Gig User')}</label>
            <select
              className="w-full border rounded p-2 text-sm"
              value={newAssignment.gig_user_id}
              onChange={(e) => setNewAssignment({ ...newAssignment, gig_user_id: e.target.value })}
            >
              <option value="">{t('Select')}</option>
              {gigUsers.map((u: any) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs">{t('Unassigned Company')}</label>
            <select
              className="w-full border rounded p-2 text-sm"
              value={newAssignment.company_id}
              onChange={(e) => setNewAssignment({ ...newAssignment, company_id: e.target.value })}
            >
              <option value="">{t('Select')}</option>
              {unassignedCompanies.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              className="px-3 py-2 bg-primary text-white rounded text-sm"
              onClick={() => {
                if (!newAssignment.gig_user_id || !newAssignment.company_id) return;
                router.post(route('gig-workforce.assignments.store'), newAssignment, {
                  onSuccess: () => {
                    setNewAssignment({ gig_user_id: '', company_id: '' });
                  }
                });
              }}
            >
              {t('Assign')}
            </button>
          </div>
        </div>
      </div>
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
