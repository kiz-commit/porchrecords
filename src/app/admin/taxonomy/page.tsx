"use client";

import AdminLayout from '@/components/AdminLayout';
import TaxonomyManager from '@/components/admin/TaxonomyManager';

export default function TaxonomyPage() {
  return (
    <AdminLayout>
      <TaxonomyManager />
    </AdminLayout>
  );
}