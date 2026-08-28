"use client";
import { useEffect, useMemo, useState } from "react";
import { Mail, Phone, Plus, Search, Users } from "lucide-react";
import { api } from "@/lib/api";
import type { Customer } from "@/types/billing";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { LoadingState } from "@/components/data-state";
import { initials } from "@/lib/utils";

const empty: Customer = { name:"", email:"", phone:"", address:"" };
export default function CustomersPage(){
  const [customers,setCustomers]=useState<Customer[]>([]);const [form,setForm]=useState(empty);const [search,setSearch]=useState("");const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);const [error,setError]=useState("");
  useEffect(()=>{api.customers.list().then(setCustomers).catch(e=>setError(e instanceof Error?e.message:"Could not load customers")).finally(()=>setLoading(false))},[]);
  const filtered=useMemo(()=>customers.filter(c=>`${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(search.toLowerCase())),[customers,search]);
  async function create(e:React.FormEvent){e.preventDefault();setSaving(true);try{const c=await api.customers.create(form);setCustomers(v=>[c,...v]);setForm(empty);setError("")}catch(e){setError(e instanceof Error?e.message:"Could not create customer")}finally{setSaving(false)}}
  if(loading)return <LoadingState label="Loading customer directory…"/>;
  return <div className="fade-in"><PageHeader eyebrow="Directory" title="Customers" description="Maintain contacts that can be attached to invoices."/>{error&&<div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}
    <div className="grid gap-5 xl:grid-cols-[1fr_350px] items-start"><section className="card overflow-hidden"><div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row"><div className="relative flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="input pl-10" placeholder="Search customers" value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="flex items-center text-sm font-bold text-slate-500">{filtered.length} customers</div></div><div className="divide-y divide-slate-100">{filtered.map(c=><div key={c.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center"><div className="grid size-11 shrink-0 place-items-center rounded-full bg-slate-100 font-black text-slate-700">{initials(c.name)}</div><div className="min-w-0 flex-1"><div className="font-black">{c.name}</div><div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><Mail size={13}/>{c.email||"No email"}</span><span className="inline-flex items-center gap-1"><Phone size={13}/>{c.phone||"No phone"}</span></div>{c.address&&<div className="mt-1 truncate text-xs text-slate-400">{c.address}</div>}</div></div>)}{!filtered.length&&<div className="p-12 text-center text-sm text-slate-400">No customers found.</div>}</div></section>
      <section className="card p-5"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Users size={19}/></div><div><h2 className="font-black">Add customer</h2><p className="text-xs text-slate-500">Create a new billing contact.</p></div></div><form onSubmit={create} className="mt-5 space-y-4"><label className="block text-sm font-bold">Full name<input className="input mt-1.5" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label className="block text-sm font-bold">Email<input className="input mt-1.5" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label className="block text-sm font-bold">Phone<input className="input mt-1.5" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label className="block text-sm font-bold">Address<textarea className="input mt-1.5 min-h-24 resize-y" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label><Button type="submit" className="w-full" disabled={saving}><Plus size={17}/>{saving?"Saving…":"Save customer"}</Button></form></section>
    </div>
  </div>
}
