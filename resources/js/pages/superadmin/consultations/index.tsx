import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { CrudTable } from '@/components/CrudTable';
import { Pagination } from '@/components/ui/pagination';
import { RefreshCw } from 'lucide-react';

interface PageAction {
  label: string;
  icon: React.ReactNode;
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onClick: () => void;
}

export default function Consultations() {
  const { t } = useTranslation();
  const { consultations, filters: pageFilters = {} } = usePage().props as any;
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSearch = () => {
    const params: any = { page: 1 };
    if (searchTerm) params.search = searchTerm;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    router.get(route('consultations.index'), params, { preserveState: true, preserveScroll: true });
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Consultations'), href: route('consultations.index') },
  ];

  const pageActions: PageAction[] = [
    {
      label: t('Refresh'),
      icon: <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />,
      variant: 'outline',
      onClick: () => {
        setIsRefreshing(true);
        router.reload({ only: ['consultations'] });
        setTimeout(() => setIsRefreshing(false), 800);
      }
    }
  ];

  const columns = [
    { key: 'full_name', label: t('Full Name'), sortable: true },
    { key: 'email', label: t('Email'), sortable: true },
    { key: 'phone', label: t('Phone') },
    { key: 'company', label: t('Company') },
    { key: 'service_of_interest', label: t('Service of Interest') },
    { key: 'message', label: t('Message') },
    { key: 'created_at', label: t('Submitted'), render: (value: string) => window.appSettings?.formatDateTimeSimple(value, false) || new Date(value).toLocaleDateString() },
  ];

  return (
    <PageTemplate
      title={t('Consultations')}
      url="/consultations"
      description={t('Consultation submissions')}
      actions={pageActions}
      breadcrumbs={breadcrumbs}
      noPadding
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 p-4">
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          filters={[]}
          showFilters={false}
          setShowFilters={() => {}}
          hasActiveFilters={() => !!searchTerm}
          activeFilterCount={() => (searchTerm ? 1 : 0)}
          onResetFilters={() => {
            setSearchTerm('');
            router.get(route('consultations.index'), { page: 1, per_page: pageFilters.per_page }, { preserveState: true, preserveScroll: true });
          }}
          onApplyFilters={handleSearch}
          currentPerPage={pageFilters.per_page?.toString() || '10'}
          onPerPageChange={(value) => {
            const params: any = { page: 1, per_page: parseInt(value) };
            if (searchTerm) params.search = searchTerm;
            router.get(route('consultations.index'), params, { preserveState: true, preserveScroll: true });
          }}
          showViewToggle={false}
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <CrudTable
          columns={columns}
          actions={[]}
          data={consultations?.data || []}
          from={consultations?.from || 1}
          onAction={() => {}}
          permissions={[]}
        />
        <Pagination
          from={consultations?.from || 0}
          to={consultations?.to || 0}
          total={consultations?.total || 0}
          links={consultations?.links}
          entityName={t('consultations')}
          onPageChange={(url) => router.get(url)}
        />
      </div>
    </PageTemplate>
  );
}
