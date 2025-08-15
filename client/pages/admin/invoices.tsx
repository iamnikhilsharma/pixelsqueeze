import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import withAdminAuth from '../../components/AdminGuard';

interface Invoice { filename:string; url:string }

function AdminInvoices(){
  const [list,setList]=useState<Invoice[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    const token=localStorage.getItem('token');
    fetch(`${process.env.NEXT_PUBLIC_API_URL||''}/api/admin/invoices`,{ headers:{ Authorization:`Bearer ${token}` }})
      .then(r=>r.json())
      .then(j=>{ setList(j.data); setLoading(false);});
  },[]);
  return (
    <AdminLayout title="Admin – Invoices">
      <h1 className="text-2xl font-bold mb-6">Invoices</h1>
      {loading && <p>Loading...</p>}
      {!loading && (
        <ul className="space-y-2">
          {list.map(inv=> (
            <li key={inv.filename} className="bg-white p-4 shadow rounded flex justify-between">
              <span>{inv.filename}</span>
              <a href={inv.url} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">Download</a>
            </li>
          ))}
        </ul>
      )}
    </AdminLayout>
  );
}
export default withAdminAuth(AdminInvoices);
