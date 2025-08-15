import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import withAdminAuth from '../../components/AdminGuard';

interface SubItem { _id:string; email:string; firstName:string; lastName:string; subscription:{ plan:string; status:string; currentPeriodEnd?:string } }

function AdminSubscriptions(){
  const [subs,setSubs]=useState<SubItem[]>([]);
  const [loading,setLoading]=useState(true);

  const fetchSubs = async ()=>{
    const token=localStorage.getItem('token');
    const res= await fetch(`${process.env.NEXT_PUBLIC_API_URL||''}/api/admin/subscriptions`,{ headers:{ Authorization:`Bearer ${token}` }});
    const json= await res.json();
    setSubs(json.data);
    setLoading(false);
  };
  useEffect(()=>{ fetchSubs(); },[]);

  const cancel = async(id:string)=>{
    const token=localStorage.getItem('token');
    await fetch(`${process.env.NEXT_PUBLIC_API_URL||''}/api/admin/subscriptions/${id}/cancel`,{ method:'PATCH', headers:{ Authorization:`Bearer ${token}` }});
    fetchSubs();
  };

  return (
    <AdminLayout title="Admin – Subscriptions">
      <h1 className="text-2xl font-bold mb-6">Subscriptions</h1>
      {loading && <p>Loading...</p>}
      {!loading && (
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3" />
            </tr></thead>
            <tbody className="divide-y divide-gray-200">
              {subs.map(s=> (
                <tr key={s._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{s.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{s.subscription.plan}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{s.subscription.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {s.subscription.status==='active' && <button onClick={()=>cancel(s._id)} className="text-red-600 hover:text-red-800">Cancel</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

export default withAdminAuth(AdminSubscriptions);
