import AdminLayout from '@/components/AdminLayout';
import TaxonomyManager from '@/components/admin/TaxonomyManager';

export default function TaxonomyPage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <TaxonomyManager />
      </div>
    </AdminLayout>
  );
}
