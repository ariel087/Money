// Transfers move money between accounts and are NEVER counted as income/expense.
export function balances(d){
  const b={}; d.accounts.forEach(a=>b[a.id]=+a.opening||0)
  d.transactions.forEach(t=>{const n=+t.amount
    if(t.type==='income') b[t.account_id]+=n
    else if(t.type==='expense') b[t.account_id]-=n
    else { b[t.account_id]-=n; if(t.to_account_id) b[t.to_account_id]+=n }})
  return b
}
export function monthSums(txs,month){
  let inc=0,exp=0
  txs.forEach(t=>{if(!t.date.startsWith(month))return; if(t.type==='income')inc+=+t.amount; if(t.type==='expense')exp+=+t.amount})
  return {inc,exp}
}
