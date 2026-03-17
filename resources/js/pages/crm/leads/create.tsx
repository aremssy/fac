import { PageTemplate } from '@/components/page-template';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from '@/components/custom-toast';

export default function LeadCreate() {
  const { t } = useTranslation();
  const { defaults } = usePage().props as any;
  const [form, setForm] = useState<any>({
    title: '',
    contact_name: '',
    contact_email: '',
    phone: '',
    company_name: '',
    source: '',
    status: defaults?.status || 'new'
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.loading(t('Creating lead...'));
    router.post(route('crm.leads.store'), form, {
      onSuccess: (page) => {
        toast.dismiss();
        if (page.props.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else {
          toast.success(t('Lead created'));
        }
        router.get(route('crm.leads.index'));
      },
      onError: (errors) => {
        toast.dismiss();
        const msg = typeof errors === 'string' ? errors : Object.values(errors).join(', ');
        toast.error(t('Failed to create lead: {{msg}}', { msg }));
      }
    });
  };
  return (
    <PageTemplate title={t('Create Lead')} url={route('crm.leads.create')} description="">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">{t('Title')}</Label>
          <Input id="title" name="title" value={form.title} onChange={handleChange} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contact_name">{t('Contact Name')}</Label>
            <Input id="contact_name" name="contact_name" value={form.contact_name} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="contact_email">{t('Contact Email')}</Label>
            <Input id="contact_email" name="contact_email" type="email" value={form.contact_email} onChange={handleChange} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">{t('Phone')}</Label>
            <Input id="phone" name="phone" value={form.phone} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="company_name">{t('Company Name')}</Label>
            <Input id="company_name" name="company_name" value={form.company_name} onChange={handleChange} />
          </div>
        </div>
        <div>
          <Label htmlFor="source">{t('Source')}</Label>
          <Input id="source" name="source" value={form.source} onChange={handleChange} />
        </div>
        <div className="flex gap-2">
          <Button type="submit">{t('Save')}</Button>
          <Button type="button" variant="outline" onClick={() => router.get(route('crm.leads.index'))}>{t('Cancel')}</Button>
        </div>
      </form>
    </PageTemplate>
  );
}
