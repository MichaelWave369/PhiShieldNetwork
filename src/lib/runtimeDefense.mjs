// Pure synthetic lab; deliberately no network, kernel, process or registry access.
export const SCENARIOS = Object.freeze({
  targeted: Object.freeze([
    Object.freeze({id:'a',kind:'synthetic-threat',signal:true}),
    Object.freeze({id:'b',kind:'legitimate',signal:false}),
    Object.freeze({id:'c',kind:'legitimate',signal:false})
  ]),
  collateral: Object.freeze([
    Object.freeze({id:'a',kind:'synthetic-threat',signal:true}),
    Object.freeze({id:'b',kind:'legitimate',signal:true}),
    Object.freeze({id:'c',kind:'legitimate',signal:false})
  ])
});
const TTL = 5 * 60 * 1000;
export function createLab(scenario='targeted') {
  if (!Object.hasOwn(SCENARIOS,scenario)) throw new Error('Unknown synthetic scenario');
  return {mode:'simulation-only',scenario,stage:'proposed',report:null,expiresAt:null,events:[]};
}
export function evaluate(scenario) {
  if (!Object.hasOwn(SCENARIOS,scenario)) throw new Error('Unknown synthetic scenario');
  const events=SCENARIOS[scenario];
  const threats=events.filter(e=>e.kind==='synthetic-threat');
  const legitimate=events.filter(e=>e.kind==='legitimate');
  const blocked=threats.filter(e=>e.signal).length;
  const falseBlocks=legitimate.filter(e=>e.signal).length;
  return {threats:threats.length,blocked,legitimate:legitimate.length,falseBlocks,
    pass:threats.length>0 && legitimate.length>0 && blocked===threats.length && falseBlocks===0};
}
export function transition(lab, action, now=Date.now()) {
  if (lab.mode!=='simulation-only' || !Number.isSafeInteger(now) || now<0) throw new Error('Invalid lab context');
  if (lab.events.length && now<lab.events.at(-1).at) throw new Error('Clock moved backwards; reset lab');
  const next=(stage,extra={})=>({...lab,...extra,stage,events:[...lab.events,{sequence:lab.events.length+1,action,stage,at:now}]});
  switch(action) {
    case 'monitor':
      if(lab.stage==='proposed') return next('monitored',{report:evaluate(lab.scenario)});
      break;
    case 'approve':
      if(lab.stage==='monitored' && evaluate(lab.scenario).pass) return next('approved',{expiresAt:now+TTL});
      break;
    case 'activate':
      if(lab.stage==='approved' && now<lab.expiresAt && evaluate(lab.scenario).pass) return next('simulated-active');
      break;
    case 'expire':
      if(['approved','simulated-active'].includes(lab.stage) && now>=lab.expiresAt) return next('expired');
      break;
    case 'rollback':
      if(['approved','simulated-active'].includes(lab.stage)) return next('rolled-back');
      break;
    case 'retire':
      if(['simulated-active','rolled-back','expired'].includes(lab.stage)) return next('retired');
      break;
  }
  throw new Error('Action not permitted in current lab state');
}
export function simulatedActive(lab, now=Date.now()) {
  return lab.mode==='simulation-only' && lab.stage==='simulated-active' && now<lab.expiresAt;
}
export function exportLab(lab,now=Date.now()) {
  return {schema:'phishield.runtime-lab.v0',...lab,simulatedActive:simulatedActive(lab,now),
    exportedAt:now,warning:'Synthetic local simulation; unsigned and not tamper-evident. No real shield, approval credential, or attestation.'};
}
