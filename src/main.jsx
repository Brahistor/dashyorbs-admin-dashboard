import React, {useEffect, useMemo, useState} from 'react'
import { createRoot } from 'react-dom/client'

const API_BASE = localStorage.getItem('API_BASE') || 'https://your-worker.yourdomain.workers.dev'

function useToken(){
  const [token,setToken] = useState(localStorage.getItem('ADMIN_TOKEN')||'')
  useEffect(()=>{
    const hash = location.hash.slice(1)
    const p = new URLSearchParams(hash)
    const t = p.get('token')
    if (t){ localStorage.setItem('ADMIN_TOKEN', t); setToken(t); location.hash='' }
  },[])
  return [token,(t)=>{localStorage.setItem('ADMIN_TOKEN',t); setToken(t)}]
}

function Login({token,setToken}){
  const start = ()=>{
    const url = API_BASE + '/auth/github/start?redirect=' + encodeURIComponent(location.href.split('#')[0])
    location.href = url
  }
  return <div className="card">
    <h2>Login</h2>
    <p>Use your GitHub account (allow-listed) to manage leaderboard.</p>
    <button className="btn" onClick={start}>Sign in with GitHub</button>
  </div>
}

async function api(path, {method='GET', body, token}={}){
  const res = await fetch(API_BASE+path, {
    method, headers: {'Authorization': 'Bearer '+token, ...(body?{'Content-Type':'application/json'}:{})}, body: body?JSON.stringify(body):undefined
  })
  const j = await res.json().catch(()=>({}))
  if (!res.ok) throw new Error(j.error||res.statusText)
  return j
}

function Top({token}){
  const [board,setBoard] = useState('all')
  const [page,setPage] = useState(0)
  const [rows,setRows] = useState([])
  const [limit,setLimit] = useState(20)
  const load = async()=>{
    const j = await fetch(`${API_BASE}/v1/top?board=${board}&limit=${limit}&page=${page}`, {headers:{'Accept':'application/json','Accept-Encoding':'gzip'}}).then(r=>r.json())
    setRows(j.top||[])
  }
  useEffect(()=>{load()},[board,page,limit])
  const del = async(id)=>{ if(!confirm('Delete #'+id+'?')) return; await api('/admin/score/'+id, {method:'DELETE', token}); load() }
  return <div className="card">
    <h2>Top Scores</h2>
    <div className="tabs">
      {['all','weekly','daily'].map(b=><div key={b} className={'tab'+(b===board?' active':'')} onClick={()=>{setBoard(b); setPage(0)}}>{b}</div>)}
    </div>
    <div className="row">
      <label>Limit <input type="number" value={limit} onChange={e=>setLimit(Number(e.target.value))} style={{width:80}}/></label>
      <button className="btn ghost" onClick={()=>setPage(Math.max(0,page-1))}>Prev</button>
      <span>Page {page+1}</span>
      <button className="btn ghost" onClick={()=>setPage(page+1)}>Next</button>
    </div>
    <table><thead><tr><th>ID</th><th>Name</th><th>Score</th><th>TS</th><th></th></tr></thead>
      <tbody>{rows.map(r=><tr key={r.id}><td>{r.id}</td><td>{r.name}</td><td>{r.score}</td><td>{new Date(r.ts).toLocaleString()}</td>
        <td><button className="btn ghost" onClick={()=>del(r.id)}>Delete</button></td></tr>)}</tbody></table>
  </div>
}

function Bans({token}){
  const [list,setList] = useState([])
  const [form,setForm] = useState({name:'', iphash:'', device:'', reason:''})
  const load = async()=>{ const j = await api('/admin/bans',{token}); setList(j.bans||[]) }
  useEffect(()=>{load()},[])
  const ban = async()=>{ await api('/admin/ban',{method:'POST', token, body:form}); setForm({name:'',iphash:'',device:'',reason:''}); load() }
  return <div className="card">
    <h2>Bans</h2>
    <div className="row">
      <input placeholder="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
      <input placeholder="iphash" value={form.iphash} onChange={e=>setForm({...form,iphash:e.target.value})}/>
      <input placeholder="device" value={form.device} onChange={e=>setForm({...form,device:e.target.value})}/>
      <input placeholder="reason" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}/>
      <button className="btn" onClick={ban}>Ban</button>
    </div>
    <table><thead><tr><th>ID</th><th>Name</th><th>IP hash</th><th>Device</th><th>Reason</th><th>When</th></tr></thead>
    <tbody>{list.map(b=><tr key={b.id}><td>{b.id}</td><td>{b.name||'-'}</td><td>{b.iphash||'-'}</td><td>{b.device||'-'}</td><td>{b.reason}</td><td>{new Date(b.created_at).toLocaleString()}</td></tr>)}</tbody></table>
  </div>
}

function Settings({token}){
  const [apiBase,setApi] = useState(localStorage.getItem('API_BASE')||'https://your-worker.yourdomain.workers.dev')
  return <div className="card">
    <h2>Settings</h2>
    <div className="row">
      <input style={{minWidth:380}} value={apiBase} onChange={e=>setApi(e.target.value)} placeholder="API base (Workers URL)"/>
      <button className="btn" onClick={()=>{localStorage.setItem('API_BASE', apiBase); alert('Saved!')}}>Save</button>
      <button className="btn ghost" onClick={()=>{localStorage.removeItem('ADMIN_TOKEN'); location.reload()}}>Logout</button>
    </div>
  </div>
}

function App(){
  const [token,setToken] = useToken()
  return <div className="wrap">
    <div className="card"><h1 style={{margin:0}}>DashyOrbs Admin</h1></div>
    {!token ? <Login token={token} setToken={setToken}/> : <>
      <Settings token={token}/>
      <Top token={token}/>
      <Bans token={token}/>
    </>}
  </div>
}

createRoot(document.getElementById('root')).render(<App/>)
