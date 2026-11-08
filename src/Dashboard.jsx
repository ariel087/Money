import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LineChart } from 'recharts'
import { ArrowDownRight, ArrowUpRight, Target, CalendarDays } from 'lucide-react'
import { format, subMonths, parseISO } from 'date-fns'
import { Card, Bar as PBar, peso, COLORS } from './ui'
import { balances, monthSums } from './calc'

export default function Dashboard({d,month,go}){
  const bal=balances(d), total=Object.values(bal).reduce((a,b)=>a+b,0)
  const {inc,exp}=monthSums(d.transactions,month), net=inc-exp, rate=inc?net/inc*100:0
  const base=parseISO(month+'-01')
  const series=[5,4,3,2,1,0].map(i=>{const m=format(subMonths(base,i),'yyyy-MM');const s=monthSums(d.transactions,m);return {m:format(subMonths(base,i),'MMM'),Income:s.inc,Spending:s.exp,Net:s.inc-s.exp}})
  const avgI=series.reduce((a,s)=>a+s.Income,0)/6, avgE=series.reduce((a,s)=>a+s.Spending,0)/6
  const spendBy=c=>d.transactions.filter(t=>t.type==='expense'&&t.category===c&&t.date.startsWith(month)).reduce((a,t)=>a+ +t.amount,0)
  const totalBudget=d.budgets.reduce((a,b)=>a+ +b.amount,0)
  const spark=(k,c)=><div className="h-12"><ResponsiveContainer><LineChart data={series}><Line dataKey={k} stroke={c} strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div>
  const stat=(label,val,sub,Icon,k,c)=><Card><div className="flex items-center gap-2 text-gray-500"><span className="p-1.5 rounded-lg bg-gray-50"><Icon size={14} color={c}/></span>{label}</div><div className="text-3xl font-bold mt-2">{peso(val)}</div>{spark(k,c)}<div className="text-xs text-gray-500">{sub}</div></Card>
  const upcoming=d.bills.filter(b=>!b.paid).slice(0,3)
  const recent=d.transactions.slice(0,4), acc=id=>d.accounts.find(a=>a.id===id)?.name||'—'
  return <div className="space-y-5">
    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
      <div className="rounded-2xl bg-brand-dark text-white p-5"><div className="text-lg opacity-90">Available balance</div><div className="text-4xl font-bold mt-2">{peso(total)}</div>
        <div className="border-t border-white/15 mt-4 pt-3 space-y-1 text-sm">{d.accounts.slice(0,3).map(a=><div key={a.id} className="flex justify-between"><span className="opacity-80">● {a.name}</span><b>{peso(bal[a.id])}</b></div>)}</div></div>
      {stat('Income',inc,'Salary and other inflows',ArrowDownRight,'Income','#0f6b57')}
      {stat('Spending',exp,totalBudget?`${(exp/totalBudget*100).toFixed(0)}% of ${peso(totalBudget)} plan`:'No budget set',ArrowUpRight,'Spending','#e07b5f')}
      {stat('Net saved',net,`${rate.toFixed(1)}% of monthly income`,Target,'Net','#5b8db8')}
    </div>
    <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr_1fr]">
      <Card><h3 className="text-xl font-bold">Cash flow</h3><p className="text-sm text-gray-500 mb-3">Monthly inflow, outflow and net saved</p>
        <div className="h-64"><ResponsiveContainer><ComposedChart data={series}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="m"/><YAxis/><Tooltip formatter={v=>peso(v)}/><Bar dataKey="Income" fill="#0f6b57" radius={[3,3,0,0]}/><Bar dataKey="Spending" fill="#e07b5f" radius={[3,3,0,0]}/><Line dataKey="Net" stroke="#17423b" strokeWidth={2}/></ComposedChart></ResponsiveContainer></div>
        <div className="grid grid-cols-3 gap-3 border-t mt-3 pt-3 text-xs text-gray-500"><div>Average income<div className="text-lg font-bold text-gray-900">{peso(avgI)}</div></div><div>Average spending<div className="text-lg font-bold text-gray-900">{peso(avgE)}</div></div><div>Savings rate<div className="text-lg font-bold text-gray-900">{rate.toFixed(1)}%</div></div></div></Card>
      <Card><div className="flex justify-between"><h3 className="text-xl font-bold">Spending plan</h3><span className="text-xs bg-brand-soft text-brand rounded-full px-3 py-1 h-fit font-semibold">{totalBudget?(exp/totalBudget*100).toFixed(0):0}% used</span></div><p className="text-sm text-gray-500 mb-3">Monthly allocation</p>
        <div className="space-y-4">{d.budgets.slice(0,5).map((b,i)=>{const s=spendBy(b.category);return <div key={b.id}><div className="flex justify-between text-sm"><b>{b.category}</b><span>{s.toFixed(0)} / {b.amount}</span></div><PBar v={s} max={+b.amount} color={COLORS[i%7]}/><div className="text-[11px] text-gray-500 text-right">{peso(b.amount-s)} left</div></div>})}{!d.budgets.length&&<p className="text-sm text-gray-400">Set budgets to see your plan.</p>}</div></Card>
      <Card><h3 className="text-xl font-bold">Savings goals</h3><p className="text-sm text-gray-500 mb-3">Small steps. Clear progress.</p>
        <div className="space-y-4">{d.goals.slice(0,3).map((g,i)=>{const p=g.target?g.current/g.target*100:0;return <div key={g.id}><div className="flex justify-between"><b>{g.name}</b><span className="text-brand font-bold text-sm">{p.toFixed(0)}%</span></div><div className="text-xs text-gray-500 mb-1">{peso(g.current)} of {peso(g.target)}</div><PBar v={+g.current} max={+g.target} color={COLORS[i]}/></div>})}{!d.goals.length&&<p className="text-sm text-gray-400">No goals yet.</p>}</div>
        <div className="border-t mt-4 pt-3 flex justify-between text-sm"><span className="text-gray-500">Total saved</span><b>{peso(d.goals.reduce((a,g)=>a+ +g.current,0))}</b></div></Card>
    </div>
    <div className="grid gap-5 xl:grid-cols-[1.6fr_1.4fr]">
      <Card><div className="flex justify-between"><div><h3 className="text-xl font-bold">Recent transactions</h3><p className="text-sm text-gray-500">Latest entries from your accounts</p></div><button onClick={()=>go('transactions')} className="text-brand font-semibold text-sm">View all</button></div>
        <table className="w-full text-sm mt-3"><thead className="text-[10px] tracking-widest text-gray-500 text-left"><tr><th className="py-2">TRANSACTION</th><th>ACCOUNT</th><th className="text-right">AMOUNT</th></tr></thead><tbody>{recent.map(t=><tr key={t.id} className="border-t"><td className="py-2"><b>{t.merchant||t.category}</b><div className="text-xs text-gray-500">{t.date} / {t.category}</div></td><td>{acc(t.account_id)}</td><td className={`text-right font-bold ${t.type==='income'?'text-brand':t.type==='expense'?'text-gray-900':'text-gray-500'}`}>{t.type==='income'?'+ ':t.type==='expense'?'- ':''}{(+t.amount).toFixed(2)}</td></tr>)}</tbody></table></Card>
      <Card><div className="flex justify-between"><div><h3 className="text-xl font-bold">Upcoming payments</h3><p className="text-sm text-gray-500">Plan ahead</p></div><button onClick={()=>go('bills')} className="text-brand font-semibold text-sm">Manage bills</button></div>
        <div className="grid sm:grid-cols-3 gap-3 mt-3">{upcoming.map(b=><div key={b.id} className="rounded-xl border p-3"><div className="text-xs font-bold border rounded px-2 py-1 w-fit mb-2">{format(parseISO(b.due_date),'dd MMM').toUpperCase()}</div><b>{b.name}</b><div className="text-lg font-bold">{peso(b.amount)}</div></div>)}{!upcoming.length&&<p className="text-sm text-gray-400">No upcoming bills.</p>}</div>
        <div className="border-t mt-4 pt-3 flex justify-between text-sm"><span className="flex gap-2 text-gray-500"><CalendarDays size={16}/>{upcoming.length} payments due</span><b>Total due: {peso(upcoming.reduce((a,b)=>a+ +b.amount,0))}</b></div></Card>
    </div></div>
}
