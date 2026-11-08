import { useEffect, useState, useCallback } from 'react'
import { LayoutGrid, Wallet, ArrowLeftRight, ListChecks, Target, CalendarClock, BarChart3, Settings, LogOut, Search, Plus } from 'lucide-react'
import { supabase } from './supabase'
import { TxModal, Btn, Card, Field } from './ui'
import Dashboard from './Dashboard'
import { Accounts, Transactions, Budgets, Goals, Bills } from './Pages'

const NAV=[['overview','Overview',LayoutGrid],['accounts','Accounts',Wallet],['transactions','Transactions',ArrowLeftRight],['budgets','Budgets',ListChecks],['goals','Savings goals',Target],['bills','Bills & payments',CalendarClock],['reports','Reports',BarChart3]]

function Auth(){
  const [email,setE]=useState(''),[pw,setP]=useState(''),[mode,setM]=useState('in')
  const go=async()=>{const fn=mode==='in'?supabase.auth.signInWithPassword:supabase.auth.signUp;const {error}=await fn.call(supabase.auth,{email,password:pw});if(error)alert(error.message);else if(mode==='up')alert('Account created. Check your email if confirmation is enabled.')}
  return <div className="min-h-screen grid place-items-center p-4"><Card className="w-full max-w-sm">
    <h1 className="text-2xl font-bold mb-1">Money</h1><p className="text-sm text-gray-500 mb-5">Every peso must be accounted for.</p>
    <Field label="Email"><input className="inp" value={email} onChange={e=>setE(e.target.value)}/></Field>
    <Field label="Password"><input className="inp" type="password" value={pw} onChange={e=>setP(e.target.value)}/></Field>
    <Btn className="w-full" onClick={go}>{mode==='in'?'Log in':'Sign up'}</Btn>
    <button className="text-xs text-brand mt-3" onClick={()=>setM(mode==='in'?'up':'in')}>{mode==='in'?'Create an account':'I already have an account'}</button>
  </Card></div>
}

export default function App(){
  const [session,setS]=useState(undefined),[page,setPage]=useState('overview'),[month,setMonth]=useState(new Date().toISOString().slice(0,7))
  const [d,setD]=useState({accounts:[],transactions:[],budgets:[],goals:[],bills:[]}),[modal,setModal]=useState(false),[q,setQ]=useState('')
  useEffect(()=>{supabase.auth.getSession().then(({data})=>setS(data.session));const {data:l}=supabase.auth.onAuthStateChange((_,s)=>setS(s));return()=>l.subscription.unsubscribe()},[])
  const reload=useCallback(async()=>{
    const g=t=>supabase.from(t).select('*')
    const [a,t,b,go,bi]=await Promise.all([g('accounts'),supabase.from('transactions').select('*').order('date',{ascending:false}).order('created_at',{ascending:false}),g('budgets'),g('goals'),supabase.from('bills').select('*').order('due_date')])
    setD({accounts:a.data||[],transactions:t.data||[],budgets:b.data||[],goals:go.data||[],bills:bi.data||[]})
  },[])
  useEffect(()=>{if(session)reload()},[session,reload])
  if(session===undefined) return null
  if(!session) return <Auth/>
  const email=session.user.email, ini=email.slice(0,2).toUpperCase()
  const props={d,reload,month,q}
  const Page={overview:Dashboard,accounts:Accounts,transactions:Transactions,budgets:Budgets,goals:Goals,bills:Bills}[page]
  return <div className="p-3 md:p-10 min-h-screen"><div className="max-w-[1500px] mx-auto bg-[#f3f7f4] rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
    <aside className="md:w-64 shrink-0 p-5 bg-[#eef4f0] border-r border-emerald-900/5 flex flex-col">
      <div className="flex items-center gap-3 mb-6"><div className="h-11 w-11 rounded-xl bg-brand text-white grid place-items-center font-bold text-xl">M</div><div><div className="font-bold text-lg leading-none">Money</div><div className="text-[10px] tracking-widest text-gray-500">PERSONAL WORKSPACE</div></div></div>
      <div className="bg-white rounded-xl border p-3 flex items-center gap-3 mb-6"><div className="h-8 w-8 rounded-full bg-brand-soft grid place-items-center text-xs font-bold text-brand">{ini}</div><div className="min-w-0"><div className="text-sm font-semibold truncate">{email.split('@')[0]}</div><div className="text-xs text-gray-500">Personal account</div></div></div>
      <div className="text-[10px] tracking-widest text-gray-500 mb-2">WORKSPACE</div>
      <nav className="space-y-1">{NAV.map(([k,l,I])=><button key={k} onClick={()=>setPage(k)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${page===k?'bg-brand-soft text-brand font-semibold border-l-4 border-brand':'text-gray-600 hover:bg-white'}`}><I size={18}/>{l}{k==='bills'&&d.bills.filter(b=>!b.paid).length>0&&<span className="ml-auto text-xs bg-white rounded-full px-2">{d.bills.filter(b=>!b.paid).length}</span>}</button>)}</nav>
      <div className="mt-auto pt-6 space-y-1 text-sm text-gray-600"><button className="flex gap-3 px-3 py-2"><Settings size={18}/>Settings</button><button onClick={()=>supabase.auth.signOut()} className="flex gap-3 px-3 py-2"><LogOut size={18}/>Log out</button></div>
    </aside>
    <main className="flex-1 p-5 md:p-8 min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div><div className="text-[11px] tracking-widest text-gray-500 font-semibold">PERSONAL FINANCE / {page.toUpperCase()}</div><h1 className="text-3xl md:text-4xl font-bold mt-2">Your money, in focus.</h1><p className="text-gray-500 mt-1">A clear view of your accounts, plans and next moves.</p></div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative"><Search size={16} className="absolute left-3 top-2.5 text-gray-400"/><input value={q} onChange={e=>{setQ(e.target.value);if(e.target.value)setPage('transactions')}} placeholder="Search transactions" className="inp pl-9 w-56"/></div>
          <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="inp w-44"/>
          <Btn className="flex items-center gap-2" onClick={()=>setModal(true)} disabled={!d.accounts.length}><Plus size={16}/>Add transaction</Btn>
        </div>
      </div>
      {!d.accounts.length&&page!=='accounts'&&<div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm">Create an account first (Cash, GCash, BDO…) in <button className="underline" onClick={()=>setPage('accounts')}>Accounts</button>.</div>}
      {Page?<Page {...props} go={setPage} openAdd={()=>setModal(true)}/>:<Card>Reports & analytics are coming in the next phase.</Card>}
    </main></div>
    {modal&&<TxModal d={d} onClose={()=>setModal(false)} reload={reload}/>}
  </div>
}
