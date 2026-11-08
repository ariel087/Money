import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from './supabase'
export const peso = n => new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(n||0)
export const EXP_CATS=['Food','Transportation','Bills','Housing','Shopping','Health','Entertainment','Family','Education','Subscriptions','Debt','Personal','Emergency','Others']
export const INC_CATS=['Salary','Freelance','Business Income','Online Selling','Commission','Allowance','Bonus','Investment Returns','Gifts','Other Income']
export const COLORS=['#0f6b57','#e07b5f','#d4b35a','#5b8db8','#17423b','#8a7bb5','#6bb39a']
export const Card=({className='',children})=><div className={`bg-white rounded-2xl border border-emerald-900/5 shadow-sm p-5 ${className}`}>{children}</div>
export const Btn=({className='',...p})=><button {...p} className={`rounded-lg bg-brand text-white px-4 py-2 text-sm font-semibold hover:bg-brand-dark ${className}`}/>
export const Bar=({v,max,color='#0f6b57'})=><div className="h-2 rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full" style={{width:`${Math.min(100,max?v/max*100:0)}%`,background:v>max?'#dc2626':color}}/></div>
export const Modal=({title,onClose,children})=><div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4"><div className="bg-white rounded-2xl w-full max-w-md p-6"><div className="flex justify-between mb-4"><h3 className="text-lg font-bold">{title}</h3><button onClick={onClose}><X size={18}/></button></div>{children}</div></div>
export const Field=({label,children})=><label className="block mb-3 text-xs font-semibold text-gray-500">{label}<div className="mt-1">{children}</div></label>

export function TxModal({d,tx,onClose,reload}){
  const [f,setF]=useState(tx||{type:'expense',amount:'',category:'Food',account_id:d.accounts[0]?.id||'',to_account_id:'',date:new Date().toISOString().slice(0,10),merchant:'',note:''})
  const set=(k,v)=>setF(s=>({...s,[k]:v}))
  const save=async()=>{
    if(!f.amount||!f.account_id) return alert('Amount and account are required')
    const row={type:f.type,amount:+f.amount,category:f.type==='transfer'?'Transfer':f.category,account_id:f.account_id,to_account_id:f.type==='transfer'?f.to_account_id||null:null,date:f.date,merchant:f.merchant,note:f.note}
    const {error}=tx?await supabase.from('transactions').update(row).eq('id',tx.id):await supabase.from('transactions').insert(row)
    if(error) return alert(error.message); await reload(); onClose()
  }
  return <Modal title={tx?'Edit transaction':'Add transaction'} onClose={onClose}>
    <div className="flex gap-2 mb-3">{['income','expense','transfer'].map(t=><button key={t} onClick={()=>set('type',t)} className={`flex-1 rounded-lg py-2 text-sm capitalize border ${f.type===t?'bg-brand text-white border-brand':'border-gray-200'}`}>{t}</button>)}</div>
    <Field label="Amount (₱)"><input className="inp" type="number" value={f.amount} onChange={e=>set('amount',e.target.value)}/></Field>
    {f.type!=='transfer'&&<Field label="Category"><select className="inp" value={f.category} onChange={e=>set('category',e.target.value)}>{(f.type==='income'?INC_CATS:EXP_CATS).map(c=><option key={c}>{c}</option>)}</select></Field>}
    <Field label={f.type==='transfer'?'From account':'Account'}><select className="inp" value={f.account_id} onChange={e=>set('account_id',e.target.value)}>{d.accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
    {f.type==='transfer'&&<Field label="To account"><select className="inp" value={f.to_account_id||''} onChange={e=>set('to_account_id',e.target.value)}><option value="">Select…</option>{d.accounts.filter(a=>a.id!==f.account_id).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>}
    <Field label="Date"><input className="inp" type="date" value={f.date} onChange={e=>set('date',e.target.value)}/></Field>
    <Field label="Merchant / source"><input className="inp" value={f.merchant||''} onChange={e=>set('merchant',e.target.value)}/></Field>
    <Field label="Notes"><input className="inp" value={f.note||''} onChange={e=>set('note',e.target.value)}/></Field>
    <Btn className="w-full" onClick={save}>Save</Btn>
  </Modal>
}
