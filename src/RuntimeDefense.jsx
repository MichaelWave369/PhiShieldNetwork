import React,{useEffect,useState} from 'react';
import {createLab,transition,simulatedActive,exportLab} from './lib/runtimeDefense.mjs';

export default function RuntimeDefense(){
 const [lab,setLab]=useState(()=>createLab());
 const [now,setNow]=useState(Date.now);
 const [error,setError]=useState('');
 useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id)},[]);
 useEffect(()=>{if(['approved','simulated-active'].includes(lab.stage)&&now>=lab.expiresAt){
   setLab(s=>['approved','simulated-active'].includes(s.stage)&&now>=s.expiresAt?transition(s,'expire',now):s);
 }},[now,lab.stage,lab.expiresAt]);
 function act(action){try{const at=Date.now();setLab(transition(lab,action,at));setNow(at);setError('')}catch(e){setError(e.message)}}
 function reset(scenario){setLab(createLab(scenario));setError('');setNow(Date.now())}
 function download(){const url=URL.createObjectURL(new Blob([JSON.stringify(exportLab(lab),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='phishield-runtime-simulation.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 const active=simulatedActive(lab,now);
 return <>
 <div className="page-title"><div className="eyebrow">RUNTIME DEFENSE / SYNTHETIC LAB</div><h1>Rehearse the <em>shield.</em></h1><p>Explore the 3-6-9 defensive lifecycle without touching a host. No Shirudo connection, credentials or real enforcement.</p></div>
 <section className="panel">
 <div className="panel-head"><div><div className="micro">01 / AWARENESS</div><h2>Choose a synthetic scenario</h2></div><span className="alert-pill">SIMULATION ONLY</span></div>
 <div className="links"><button className="secondary" onClick={()=>reset('targeted')}>RESET / TARGETED</button><button className="secondary" onClick={()=>reset('collateral')}>RESET / COLLATERAL</button></div>
 <p>Scenario: <b>{lab.scenario}</b>. The collateral case intentionally misclassifies a legitimate event.</p>
 <div className="panel-head"><div><div className="micro">02 / ADAPTATION</div><h2>Monitor and review</h2></div></div>
 <div className="links"><button className="primary" disabled={lab.stage!=='proposed'} onClick={()=>act('monitor')}>RUN SYNTHETIC MONITOR</button><button className="secondary" disabled={lab.stage!=='monitored'||!lab.report?.pass} onClick={()=>act('approve')}>APPROVE SIMULATION</button></div>
 {lab.report&&<p role="status">Synthetic threats matched: {lab.report.blocked}/{lab.report.threats} · Legitimate events wrongly matched: {lab.report.falseBlocks}/{lab.report.legitimate} · <b>{lab.report.pass?'PASS (synthetic only)':'REJECT — collateral damage'}</b></p>}
 <div className="panel-head"><div><div className="micro">03 / PROTECTION</div><h2>Simulate enforcement</h2></div></div>
 <p role="status">Stage: <b>{lab.stage}</b> · {active?'SIMULATED ACTIVE':'NO ACTIVE SIMULATION'}{lab.expiresAt&&['approved','simulated-active'].includes(lab.stage)?' · '+Math.max(0,Math.ceil((lab.expiresAt-now)/1000))+' seconds remaining':''}</p>
 <div className="links"><button className="primary" disabled={lab.stage!=='approved'||now>=lab.expiresAt} onClick={()=>act('activate')}>SIMULATE ACTIVATION</button><button className="secondary" disabled={!['approved','simulated-active'].includes(lab.stage)} onClick={()=>act('rollback')}>ROLL BACK</button><button className="secondary" disabled={!['simulated-active','rolled-back','expired'].includes(lab.stage)} onClick={()=>act('retire')}>RETIRE</button></div>
 {error&&<p role="alert" className="scan-error">{error}</p>}
 <p className="disclaimer">This exercise is not a security boundary or evidence of real exploit mitigation. Approval is a local click, not verified identity. No signing or TPM attestation.</p>
 </section>
 <section className="panel"><div className="panel-head"><div><div className="micro">LOCAL / UNSIGNED</div><h2>Simulation event history</h2></div><button className="secondary" onClick={download}>EXPORT JSON</button></div>
 {lab.events.length?<ol>{lab.events.map(e=><li key={e.sequence}>{e.action} → {e.stage} · {new Date(e.at).toLocaleTimeString()}</li>)}</ol>:<p>No events yet.</p>}
 <p className="subtle">Session-only, mutable history. Reset clears it. Not a tamper-evident audit log.</p></section>
 </>;
}
