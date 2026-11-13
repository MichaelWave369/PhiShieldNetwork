import React,{useState} from 'react';
import feed from './data/wfx-loot.json';
import {DEFAULT_REPOS,MAX_REPOS,parseRepositories,scanRepository,buildReport} from './lib/scanner.mjs';

const initial=DEFAULT_REPOS.map(name=>({repo:'MichaelWave369/'+name,status:'not-scanned',findings:[],errors:[]}));
const labels={'not-scanned':'NOT SCANNED',scanning:'SCANNING',sampled:'SAMPLED',partial:'PARTIAL',unavailable:'UNAVAILABLE'};
function Dot({status='idle'}){return <span aria-hidden="true" className={'dot '+status}/>;}
function Pill({status}){return <span className={'pill '+status}><Dot status={status}/>{labels[status]||status}</span>;}
function External({href,children}){return <a href={href} target="_blank" rel="noopener noreferrer" className="external">{children} ↗</a>;}
function Stat({name,value,note,tone=''}){return <div className={'stat '+tone}><div className="mono muted">{name}</div><b>{value}</b><small>{note}</small></div>;}

export default function App(){
  const [view,setView]=useState('overview');
  const [input,setInput]=useState(DEFAULT_REPOS.join(', '));
  const [rows,setRows]=useState(initial);
  const [busy,setBusy]=useState(false);
  const [progress,setProgress]=useState('');
  const [error,setError]=useState('');
  const [lastRun,setLastRun]=useState('');
  const findings=rows.flatMap(r=>r.findings||[]);
  const sampled=rows.filter(r=>r.status==='sampled').length;
  const incomplete=rows.filter(r=>r.status==='partial'||r.status==='unavailable').length;
  const ran=rows.some(r=>r.status!=='not-scanned');

  async function run(){
    if(busy)return;
    let list;
    try{list=parseRepositories(input);}catch(e){setError(e.message);return;}
    setError('');setLastRun('');setBusy(true);
    const work=list.map(repo=>({repo,status:'not-scanned',findings:[],errors:[]}));
    setRows([...work]);
    try{
      for(let i=0;i<list.length;i++){
        const repo=list[i];setProgress('Inspecting '+repo+' ('+(i+1)+' / '+list.length+')');
        work[i]={...work[i],status:'scanning'};setRows([...work]);
        try{work[i]=await scanRepository(repo);}
        catch(e){work[i]={repo,status:'unavailable',findings:[],errors:[String(e.message||e)]};}
        setRows([...work]);
      }
      setLastRun(new Date().toISOString());
    }finally{setBusy(false);setProgress('');}
  }

  function download(){
    const report=buildReport(rows);
    const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='phishield-public-scan-'+new Date().toISOString().slice(0,10)+'.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon">Φ</div><div><strong>ΦSHIELD</strong><small>NETWORK / 369</small></div></div>
      <div className="nav-caption">COMMAND CENTER</div>
      <nav aria-label="Application navigation">
        <button className={view==='overview'?'nav-item active':'nav-item'} onClick={()=>setView('overview')}><span>▦</span> Overview</button>
        <button className={view==='intel'?'nav-item active':'nav-item'} onClick={()=>setView('intel')}><span>◎</span> Threat intelligence</button>
        <button className={view==='trust'?'nav-item active':'nav-item'} onClick={()=>setView('trust')}><span>◇</span> Trust & methodology</button>
      </nav>
      <div className="sidebar-footer"><div className="mode"><Dot status="sampled"/> READ-ONLY MODE</div><p>No credentials.<br/>No telemetry.<br/>No automatic changes.</p><External href="https://github.com/MichaelWave369/PhiShieldNetwork">VIEW SOURCE</External></div>
    </aside>
    <div className="main">
      <header className="topbar"><div className="mono">ΦSHIELD <span>/</span> {view==='overview'?'SENTINEL':view.toUpperCase()}</div><div className="right mono"><span className="mode"><Dot status="sampled"/> LOCAL SESSION</span><span>v0.1 · GENESIS</span></div></header>
      <div className="page">
        {view==='overview'&&<>
          <section className="hero">
            <div className="eyebrow">● OPEN DEFENSE / INDEPENDENT TRUST</div>
            <div className="hero-layout"><div><h1>Protect the <em>Field.</em><br/>Protect Each Other.</h1><p>An open security observatory for connected code ecosystems. Observe the signals, inspect the evidence, keep control.</p><div className="hero-tags"><span>PUBLIC GITHUB API</span><span>ZERO CREDENTIALS</span><span>HUMAN REVIEW</span></div></div>
            <div className="radar" aria-hidden="true"><div className="orbit one"/><div className="orbit two"/><div className="radar-core">Φ</div><div className="beacon b1"/><div className="beacon b2"/><div className="beacon b3"/></div></div>
          </section>
          <div className="section-head"><span>01 / OBSERVATORY</span><small>Public API sampling, not a full forensic audit</small></div>
          <section className="stats"><Stat name="WATCHLIST" value={String(rows.length).padStart(2,'0')} note="Public repositories"/><Stat name="SAMPLED" value={String(sampled).padStart(2,'0')} note="Limited inspection" tone="teal"/><Stat name="REVIEW SIGNALS" value={String(findings.length).padStart(2,'0')} note={ran?'Investigative leads':'Not scanned yet'} tone={findings.length?'amber':''}/><Stat name="INCOMPLETE" value={String(incomplete).padStart(2,'0')} note="API coverage gaps" tone={incomplete?'amber':''}/></section>
          <div className="columns">
            <section className="panel scan"><div className="panel-head"><div><div className="micro">SCANNER / PUBLIC API</div><h2>Run a Sentinel scan</h2></div><span className="head-icon">◎</span></div>
              <p className="subtle">Enter up to {MAX_REPOS} public repositories as names or owner/repo, separated by commas or new lines. Bare names use MichaelWave369.</p>
              <label htmlFor="repos">REPOSITORY TARGETS</label><textarea id="repos" value={input} onChange={e=>setInput(e.target.value)} disabled={busy} spellCheck="false" rows={3}/>
              <div className="form-foot"><small>GET only · 3 sampled endpoints / repo</small><button className="primary" disabled={busy} onClick={run}>{busy?'SCANNING…':'RUN READ-ONLY SCAN'} ↗</button></div>
              {progress&&<p role="status" className="scan-status">{progress}</p>}
              {error&&<p role="alert" className="scan-error">{error}</p>}
              <p className="disclaimer"><b>Scope warning.</b> Deleted workflow runs, private repositories and all historical activity are outside this scan. Zero observed matches do not mean safe.</p>
            </section>
            <section className="panel threat"><div className="panel-head"><div><div className="micro">CURRENT THREAT INTELLIGENCE</div><h2>{feed.title}</h2></div><span className="alert-pill">RESEARCH ALERT</span></div>
              <p className="subtle">{feed.summary}</p>
              <div className="timeline"><div><b>01</b><strong>Probe access</strong><small>PR title / branch</small></div><div><b>02</b><strong>Inject payload</strong><small>CI workflow or install hook</small></div><div><b>03</b><strong>Steal and conceal</strong><small>Revert commits, erase runs</small></div></div>
              <div className="links"><External href={feed.sources[0].url}>Aikido research</External><External href={feed.sources[1].url}>StepSecurity research</External></div>
              <div className="footnote">PUBLISHED {feed.published_at} · UNSIGNED SOURCE-ATTRIBUTED FEED</div>
            </section>
          </div>
          <section className="panel repo-panel"><div className="panel-head panel-pad"><div><div className="micro">02 / REPOSITORY EVIDENCE</div><h2>Watched repositories</h2></div>{lastRun&&<button className="secondary" onClick={download}>EXPORT JSON ↓</button>}</div>
            <div className="table-scroller"><table><thead><tr><th>REPOSITORY</th><th>STATUS</th><th>FINDINGS</th><th>EVIDENCE</th></tr></thead><tbody>{rows.map(row=><tr key={row.repo}>
              <td><b>{row.repo}</b><small>{row.errors?.length?row.errors.join(' · '):row.status==='sampled'?'Sampled public responses':'No security conclusion'}</small></td>
              <td><Pill status={row.status}/></td><td className={row.findings?.length?'hit':'count'}>{row.status==='not-scanned'?'—':(row.findings?.length||0)}</td>
              <td><External href={'https://github.com/'+row.repo+'/actions'}>Actions</External></td>
            </tr>)}</tbody></table></div>
            {lastRun&&<div className="table-note">Completed {new Date(lastRun).toLocaleString()} · Results capped at 100 per API endpoint · No historical run-gap checks.</div>}
          </section>
          <section className="panel evidence"><div className="panel-head"><div><div className="micro">03 / EVIDENCE QUEUE</div><h2>Observed indicators</h2></div><span className="micro">{findings.length} ITEMS</span></div>
            {!findings.length?<div className="empty"><span>◇</span><b>{ran?'No known markers observed in sampled responses':'No evidence collected yet'}</b><p>{ran?'This cannot certify a repository as safe. For suspected incidents, investigate audit logs and credentials.':'Run a read-only scan to populate the evidence queue.'}</p></div>:
              <div className="findings">{findings.map(f=><div className="finding" key={f.id}><span className="alert-pill">REVIEW</span><div><b>{f.title}</b><p>{f.repo} · {f.evidence}</p><small>Indicator match only. Verify the source, timing and account activity before drawing conclusions.</small></div><External href={f.url}>Evidence</External></div>)}</div>}
          </section>
        </>}
        {view==='intel'&&<>
          <div className="page-title"><div className="eyebrow">SOURCE-ATTRIBUTED / OPEN INTELLIGENCE</div><h1>Threat intelligence.</h1><p>Published patterns are investigative leads, never a basis for automatic punishment.</p></div>
          <section className="panel"><div className="panel-head"><div><div className="micro">CAMPAIGN / {feed.published_at}</div><h2>{feed.title}</h2></div><span className="alert-pill">UNSIGNED FEED</span></div><p className="subtle">{feed.summary}</p>
            <div className="ioc-list">{feed.indicators.map(i=><div className="ioc" key={i.kind+i.value}><span>{i.kind.toUpperCase()}</span><code>{i.value}</code></div>)}</div>
            <div className="links"><External href={feed.sources[0].url}>Original research</External><External href={feed.sources[1].url}>Independent analysis</External><External href={import.meta.env.BASE_URL+'feeds/wfx-loot.json'}>Machine-readable feed</External></div>
            <p className="disclaimer"><b>Federation caution.</b> This JSON feed is openly readable, but it is not signed or independently attested. No automatic blocking, deletion or credential changes may be driven by these indicators.</p>
          </section>
        </>}
        {view==='trust'&&<>
          <div className="page-title"><div className="eyebrow">TRUST / SECURITY MODEL</div><h1>Evidence above ego.</h1><p>Shared defense works when each participant keeps control over their own infrastructure.</p></div>
          <div className="principles">{[
            ['01','Consent before action','Nothing is scanned until an operator starts it. No repository changes are made.'],
            ['02','Minimum privilege','Public, unauthenticated GET requests only. No secrets or personal tokens.'],
            ['03','Review before judgment','A matching title or branch is not proof that malware ran.'],
            ['04','Transparent evidence','Each matching item links to its public GitHub source; API errors remain visible.'],
            ['05','No hidden collection','No analytics, backend, telemetry, tracking or server-side storage.'],
            ['06','Federate carefully','An unsigned alert never authorizes automatic enforcement.']
          ].map(([n,title,desc])=><section key={n} className="panel principle"><span>{n}</span><h2>{title}</h2><p>{desc}</p></section>)}</div>
          <section className="panel"><h2>What this cannot prove</h2><p className="subtle">The browser cannot reconstruct erased Actions logs, inspect private repositories, prove exfiltration or certify a repository as uncompromised. Serious findings require independent incident response and preserved evidence.</p></section>
        </>}
      </div>
      <footer><span>ΦSHIELD NETWORK · SENTINEL GENESIS</span><span>OPEN SOURCE / LOCAL FIRST / PEOPLE ABOVE PROFIT</span></footer>
    </div>
  </div>;
}
