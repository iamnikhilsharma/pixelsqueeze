import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import withAdminAuth from '../../components/AdminGuard';

interface PlanPrice { monthly:number; annual:number }
interface Plan { id:string; name:string; description:string; price:PlanPrice; }

function AdminPlans() {
  const [plans,setPlans]=useState<Plan[]>([]);
  const [loading,setLoading]=useState(true);

  const fetchPlans= async ()=>{
    const token=localStorage.getItem('token');
    const res= await fetch(`${process.env.NEXT_PUBLIC_API_URL||''}/api/admin/plans`,{
      headers:{ Authorization:`Bearer ${token}` }
    });
    const json= await res.json();
    setPlans(json.data);
    setLoading(false);
  };

  useEffect(()=>{ fetchPlans(); },[]);

  const savePrice = async (id:string, field:'monthly'|'annual', value:number)=>{
    const token=localStorage.getItem('token');
    await fetch(`${process.env.NEXT_PUBLIC_API_URL||''}/api/admin/plans/${id}`,{
      method:'PATCH',
      headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify({ [field]: value })
    });
    fetchPlans();
  };

  return (
    <AdminLayout title="Admin – Plans">
      <h1 className="text-2xl font-bold mb-6">Plans</h1>
      {loading && <p>Loading...</p>}
      {!loading && (
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Annual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {plans.map(p=> (
                <tr key={p.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <input type="number" className="border p-1 w-24" defaultValue={p.price.monthly} onBlur={(e)=>savePrice(p.id,'monthly',Number(e.target.value))} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <input type="number" className="border p-1 w-24" defaultValue={p.price.annual} onBlur={(e)=>savePrice(p.id,'annual',Number(e.target.value))} />
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

export default withAdminAuth(AdminPlans);
