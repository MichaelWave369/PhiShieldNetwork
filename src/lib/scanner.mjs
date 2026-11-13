// ΦShield Sentinel: only unauthenticated GET requests to the public GitHub API.
export const START_DATE='2026-11-10T00:00:00Z';
export const MAX_REPOS=8;
export const DEFAULT_REPOS=['PhiOS','Agentora','PhiRepoNerve','PhiMadaPrime','FieldConstellation','BTM'];
const SEGMENT=/^[A-Za-z0-9_.-]{1,100}$/;
const MARKERS=new Set(['ci: refresh build cache','chore: add ci helper','chore: add dependency audit workflow']);
export function parseRepositories(input,defaultOwner='MichaelWave369'){
  if(!SEGMENT.test(defaultOwner)) throw new Error('Invalid owner.');
  const result=[],seen=new Set();
  for(const raw of input.split(/[\s,;]+/).filter(Boolean)){
    const bits=raw.split('/');
    if(bits.length>2) throw new Error('Use owner/repo or repo, not a URL.');
    const owner=bits.length===2?bits[0]:defaultOwner;
    const name=bits.length===2?bits[1]:bits[0];
    if(!SEGMENT.test(owner)||!SEGMENT.test(name)||name==='.'||name==='..') throw new Error('Invalid repository: '+raw);
    const repo=owner+'/'+name;
    if(!seen.has(repo.toLowerCase())) {result.push(repo);seen.add(repo.toLowerCase());}
  }
  if(!result.length) throw new Error('Enter at least one repository.');
  if(result.length>MAX_REPOS) throw new Error('Maximum '+MAX_REPOS+' public repositories per scan.');
  return result;
}
function safeUrl(value,fallback){
  return typeof value==='string'&&/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\//.test(value)?value:fallback;
}
export function detectIndicators(repo,{pulls=[],commits=[],branches=[]}={}){
  const findings=[];
  function push(kind,title,evidence,url,date){
    findings.push({id:repo+':'+kind+':'+findings.length,repo,kind,title,evidence,url,date:date||null,severity:'needs-review'});
  }
  for(const p of pulls){
    if((p.title||'').trim().toLowerCase()==='docs: dependency audit notes'||(p.head?.ref||'').toLowerCase()==='wfx-docs')
      push('probe','Known probe pull request', '#'+p.number+' · '+(p.title||'(untitled)')+' · branch '+(p.head?.ref||'?'),
        safeUrl(p.html_url,'https://github.com/'+repo+'/pulls'),p.created_at);
  }
  for(const c of commits){
    const first=(c.commit?.message||'').split('\n')[0].trim().toLowerCase();
    if(MARKERS.has(first)) push('commit','Known payload commit title',first+' · '+(c.sha||'').slice(0,10),
      safeUrl(c.html_url,'https://github.com/'+repo+'/commits'),c.commit?.author?.date);
  }
  for(const b of branches){
    const name=(b.name||'').toLowerCase();
    if(name==='wfx-docs'||/^ci-check-\d{4}$/.test(name))
      push('branch','Suspicious branch pattern',b.name,'https://github.com/'+repo+'/branches',null);
  }
  return findings.sort((a,b)=>(b.date||'').localeCompare(a.date||''));
}
async function requestJson(path,signal){
  const res=await fetch('https://api.github.com'+path,{signal,headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}});
  if(!res.ok) throw new Error(res.status===403||res.status===429?
    'GitHub API restricted or rate-limited this request (HTTP '+res.status+').':
    'GitHub API HTTP '+res.status+'.');
  return res.json();
}
// This is sampled current/public metadata, NOT an incident-response audit.
// No hidden authentication, no POST requests, no access to historical deleted Actions runs.
export async function scanRepository(repo,{signal}={}){
  const base='/repos/'+repo.split('/').map(encodeURIComponent).join('/');
  const resources=[
    ['pulls',base+'/pulls?state=all&sort=created&direction=desc&per_page=100'],
    ['commits',base+'/commits?since='+encodeURIComponent(START_DATE)+'&per_page=100'],
    ['branches',base+'/branches?per_page=100']
  ];
  const requests=await Promise.allSettled(resources.map(([,path])=>requestJson(path,signal)));
  const data={pulls:[],commits:[],branches:[]},errors=[];
  let checked=0;
  requests.forEach((r,i)=>{
    const key=resources[i][0];
    if(r.status==='fulfilled'&&Array.isArray(r.value)){data[key]=r.value;checked++;}
    else errors.push(key+': '+(r.reason?.message||'Unexpected API response'));
  });
  return {
    repo,status:checked===3?'sampled':checked?'partial':'unavailable',
    checked,sampleSizes:Object.fromEntries(Object.entries(data).map(([key,value])=>[key,value.length])),
    possibleTruncation:Object.entries(data).filter(([,value])=>value.length===100).map(([key])=>key),
    findings:detectIndicators(repo,data),errors,timestamp:new Date().toISOString()
  };
}
export function buildReport(rows){
  return {schema:'phishield.scan-report.v0',generated_at:new Date().toISOString(),mode:'read-only-public-api',
    scope:'Up to 100 recent PRs, 100 recent default-branch commits since Nov 10 2026 and 100 current branches per repository.',
    limitations:['No match does not mean clean or uncompromised.','Deleted workflows, branches and runs are not reconstructed.','Only public metadata, not private repositories or credential exposure.','A match must be investigated independently.'],repositories:rows};
}
