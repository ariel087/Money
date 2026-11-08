import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { supabase } from './supabase'
import { Card, Btn, Field, Modal, Bar, peso, EXP_CATS, TxModal } from './ui'
import { balances } from './calc'

const run=async(p,reload)=>{const {error}=await p;if(error)alert(error.message);else reload()}

export function Accounts({d,reload}){
  const [f,setF]=useState({name:'',type:'cash',opening:''}),bal=balances(d)
  const add=()=>f.name&&run(supabase.from('accounts').insert({name:f.name,type:f.type,opening:+f.opening||0}),reload).then(()=>setF({name:'',type:'cash',opening:''}))
  return <div className="grid gap-5 lg:grid-cols-[2fr_1fr]"><Card><h3 className="text-xl font-bold mb-3">Accounts</h3>
    {d.accounts.map(a=><div key={a.id} className="flex justify-between items-center border-t py-3"><div><b>{a.name}</b><div className="text-xs text-gray-500 capitalize">{a.type}</div></div><div className="flex items-center gap-4"><b>{peso(bal[a.id])}</b><button onClick={()=>confirm('Delete account and its transactions?')&&run(supabase.from('accounts').delete().eq('id',a.id),reload)}><Trash2 size={16} className="text-gray-400"/></button></div></div>)}</Card>
    <Card><h3 className="font-bold mb-3">Add account</h3><Field label="Name"><input className="inp" placeholder="GCash, BDO, Cash on Hand" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></Field>
    <Field label="Type"><select className="inp" value={f.type} onChange={e=>setF({...f,type:e.target.value})}>{['cash','bank','e-wallet','savings'].map(t=><option key={t}>{t}</option>)}</select></Field>
    <Field label="Opening balance (₱)"><input className="inp" type="number" value={f.opening} onChange={e=>setF({...f,opening:e.target.value})}/></Field><Btn className="w-full" onClick={add}>Add account</Btn></Card></div>
}

export function Transactions({d,reload,q,month}){
  const [type,setType]=useState('all'),[cat,setCat]=useState('all'),[sort,setSort]=useState('date'),[edit,setEdit]=useState(null),[all,setAll]=useState(true)
  let rows=d.transactions.filter(t=>(type==='all'||t.type===type)&&(cat==='all'||t.category===cat)&&(all||t.date.startsWith(month))&&(!q||`${t.merchant} ${t.note} ${t.category}`.toLowerCase().includes(q.toLowerCase())))
  if(sort==='high')rows=[...rows].sort((a,b)=>b.amount-a.amount); if(sort==='low')rows=[...rows].sort((a,b)=>a.amount-b.amount)
  const acc=id=>d.accounts.find(a=>a.id===id)?.name||'—'
  const csv=()=>{const l=['date,type,category,account,merchant,amount',...rows.map(t=>[t.date,t.type,t.category,acc(t.account_id),t.merchant||'',t.amount].join(','))].join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([l],{type:'text/csv'}));a.download='transactions.csv';a.click()}
  return <Card><div className="flex flex-wrap gap-2 mb-4 items-center"><h3 className="text-xl font-bold mr-auto">Transactions</h3>
    <select className="inp w-auto" value={type} onChange={e=>setType(e.target.value)}>{['all','income','expense','transfer'].map(t=><option key={t}>{t}</option>)}</select>
    <select className="inp w-auto" value={cat} onChange={e=>setCat(e.target.value)}><option value="all">all categories</option>{EXP_CATS.map(c=><option key={c}>{c}</option>)}</select>
    <select className="inp w-auto" value={sort} onChange={e=>setSort(e.target.value)}><option value="date">Newest</option><option value="high">Highest</option><option value="low">Lowest</option></select>
    <label className="text-xs flex gap-1"><input type="checkbox" checked={!all} onChange={e=>setAll(!e.target.checked)}/>This month</label><Btn onClick={csv}>Export CSV</Btn></div>
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-[10px] tracking-widest text-gray-500 text-left"><tr><th className="py-2">DATE</th><th>DETAILS</th><th>ACCOUNT</th><th>TYPE</th><th className="text-right">AMOUNT</th><th/></tr></thead><tbody>{rows.map(t=><tr key={t.id} className="border-t"><td className="py-2.5">{t.date}</td><td><b>{t.merchant||t.category}</b><div className="text-xs text-gray-500">{t.category}{t.note&&` · ${t.note}`}</div></td><td>{acc(t.account_id)}{t.to_account_id&&` → ${acc(t.to_account_id)}`}</td><td className="capitalize">{t.type}</td><td className={`text-right font-bold ${t.type==='income'?'text-brand':''}`}>{t.type==='income'?'+':t.type==='expense'?'-':''}{peso(t.amount)}</td>
      <td className="text-right whitespace-nowrap"><button onClick={()=>setEdit(t)} className="mr-2"><Pencil size={15} className="text-gray-400"/></button><button onClick={()=>confirm('Delete?')&&run(supabase.from('transactions').delete().eq('id',t.id),reload)}><Trash2 size={15} className="text-gray-400"/></button></td></tr>)}</tbody></table></div>
    {!rows.length&&<p className="text-sm text-gray-400 py-6 text-center">No transactions found.</p>}
    {edit&&<TxModal d={d} tx={edit} onClose={()=>setEdit(null)} reload={reload}/>}</Card>
}

export function Budgets({d,reload,month}){
  const [f,setF]=useState({category:'Food',amount:''})
  const spent=c=>d.transactions.filter(t=>t.type==='expense'&&t.category===c&&t.date.startsWith(month)).reduce((a,t)=>a+ +t.amount,0)
  const save=()=>f.amount&&run(supabase.from('budgets').upsert({category:f.category,amount:+f.amount},{onConflict:'user_id,category'}),reload)
  return <div className="grid gap-5 lg:grid-cols-[2fr_1fr]"><Card><h3 className="text-xl font-bold mb-3">Monthly budgets</h3>
    {d.budgets.map(b=>{const s=spent(b.category),over=s>b.amount;return <div key={b.id} className="mb-4"><div className="flex justify-between text-sm"><b>{b.category}</b><span>{peso(s)} / {peso(b.amount)} <button onClick={()=>run(supabase.from('budgets').delete().eq('id',b.id),reload)}><Trash2 size={13} className="inline text-gray-400 ml-2"/></button></span></div><Bar v={s} max={+b.amount}/><div className={`text-xs mt-1 ${over?'text-red-600 font-semibold':'text-gray-500'}`}>{over?`Over budget by ${peso(s-b.amount)}`:s>b.amount*.8?`Warning: ${peso(b.amount-s)} left`:`${peso(b.amount-s)} remaining`}</div></div>})}</Card>
    <Card><h3 className="font-bold mb-3">Set budget</h3><Field label="Category"><select className="inp" value={f.category} onChange={e=>setF({...f,category:e.target.value})}>{EXP_CATS.map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Monthly limit (₱)"><input className="inp" type="number" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})}/></Field><Btn className="w-full" onClick={save}>Save budget</Btn></Card></div>
}

export function Goals({d,reload}){
  const [f,setF]=useState({name:'',target:'',target_date:''})
  const add=()=>f.name&&f.target&&run(supabase.from('goals').insert({name:f.name,target:+f.target,target_date:f.target_date||null}),reload).then(()=>setF({name:'',target:'',target_date:''}))
  const adjust=(g,sign)=>{const v=+prompt(sign>0?'Amount to add (₱):':'Amount to withdraw (₱):');if(v>0)run(supabase.from('goals').update({current:Math.max(0,+g.current+sign*v)}).eq('id',g.id),reload)}
  return <div className="grid gap-5 lg:grid-cols-[2fr_1fr]"><Card><h3 className="text-xl font-bold mb-3">Savings goals</h3>
    {d.goals.map(g=>{const p=g.current/g.target*100;return <div key={g.id} className="border-t py-4"><div className="flex justify-between"><b>{g.name}</b><b className="text-brand">{p.toFixed(0)}%{p>=100&&' 🎉 Goal reached!'}</b></div><div className="text-xs text-gray-500 mb-2">{peso(g.current)} of {peso(g.target)}{g.target_date&&` · target ${g.target_date}`}</div><Bar v={+g.current} max={+g.target}/>
      <div className="flex gap-2 mt-3"><Btn onClick={()=>adjust(g,1)}>Add money</Btn><button className="rounded-lg border px-4 py-2 text-sm" onClick={()=>adjust(g,-1)}>Withdraw</button><button className="text-xs text-gray-400 ml-auto" onClick={()=>run(supabase.from('goals').delete().eq('id',g.id),reload)}>Delete</button></div></div>})}</Card>
    <Card><h3 className="font-bold mb-3">New goal</h3><Field label="Name"><input className="inp" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></Field><Field label="Target (₱)"><input className="inp" type="number" value={f.target} onChange={e=>setF({...f,target:e.target.value})}/></Field><Field label="Target date"><input className="inp" type="date" value={f.target_date} onChange={e=>setF({...f,target_date:e.target.value})}/></Field><Btn className="w-full" onClick={add}>Create goal</Btn></Card></div>
}

export function Bills({d,reload}){
  const [f,setF]=useState({name:'',amount:'',due_date:''})
  const add=()=>f.name&&f.amount&&f.due_date&&run(supabase.from('bills').insert({name:f.name,amount:+f.amount,due_date:f.due_date}),reload).then(()=>setF({name:'',amount:'',due_date:''}))
  return <div className="grid gap-5 lg:grid-cols-[2fr_1fr]"><Card><h3 className="text-xl font-bold mb-3">Bills & payments</h3>
    {d.bills.map(b=><div key={b.id} className="flex items-center justify-between border-t py-3"><div className={b.paid?'line-through text-gray-400':''}><b>{b.name}</b><div className="text-xs text-gray-500">Due {b.due_date}</div></div><div className="flex items-center gap-3"><b>{peso(b.amount)}</b><button className="text-xs border rounded px-2 py-1" onClick={()=>run(supabase.from('bills').update({paid:!b.paid}).eq('id',b.id),reload)}>{b.paid?'Undo':'Mark paid'}</button><button onClick={()=>run(supabase.from('bills').delete().eq('id',b.id),reload)}><Trash2 size={15} className="text-gray-400"/></button></div></div>)}</Card>
    <Card><h3 className="font-bold mb-3">Add bill</h3><Field label="Name"><input className="inp" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></Field><Field label="Amount (₱)"><input className="inp" type="number" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})}/></Field><Field label="Due date"><input className="inp" type="date" value={f.due_date} onChange={e=>setF({...f,due_date:e.target.value})}/></Field><Btn className="w-full" onClick={add}>Add bill</Btn></Card></div>
}
