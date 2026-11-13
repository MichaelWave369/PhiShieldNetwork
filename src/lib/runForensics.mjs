// ΦShield Actions Chronology Lab: a *sampled*, unauthenticated, read-only check.
// Gaps in GitHub workflow run numbering are investigative clues, not proof of deletion.
const MAX_RUNS=100;
const LIMIT_FINDINGS=25;
const DATE_START='2026-11-10T00:00:00Z';

export function inspectRunSequence(repo, runs=[], metadata={}){
  const workflows=new Map();
  for(const run of runs){
    const id=run?.workflow_id;
    const number=run?.run_number;
    if(!Number.isSafeInteger(id)||!Number.isSafeInteger(number)||number<1)continue;
    const key=String(id);
    if(!workflows.has(key))workflows.set(key,{id,name:run.name||'Workflow '+id,runs:[]});
    workflows.get(key).runs.push(run);
  }
  const gaps=[];
  for(const workflow of workflows.values()){
    const nums=[...new Set(workflow.runs.map(run=>run.run_number))].sort((a,b)=>b-a);
    for(let i=0;i<nums.length-1;i++){
      const higher=nums[i],lower=nums[i+1],missing=higher-lower-1;
      if(missing<=0)continue;
      const adjacent=workflow.runs.filter(run=>run.run_number===higher||run.run_number===lower);
      const oldest=adjacent.map(run=>run.created_at).filter(Boolean).sort()[0]||null;
      const newest=adjacent.map(run=>run.created_at).filter(Boolean).sort().at(-1)||null;
      // Keep the full sampled evidence, but distinguish pairs entirely before the campaign.
      if(newest&&newest<DATE_START)continue;
      const evidence=adjacent.filter(run=>typeof run.html_url==='string'&&run.html_url.startsWith('https://github.com/')).map(run=>({
        run_number:run.run_number,
        date:run.created_at||null,
        url:run.html_url
      })).sort((a,b)=>b.run_number-a.run_number);
      gaps.push({
        id:repo+':'+id+':'+higher+'-'+lower,
        repo,
        workflow_id:id,
        workflow:workflow.name,
        higher,lower,missing,
        date_range:[oldest,newest],
        evidence,
        explanation:'Run numbers are nonconsecutive within the sampled public workflow history. Retention, manual deletion, API omissions, or other benign causes may explain this. Investigate before attributing an attack.'
      });
    }
  }
  gaps.sort((a,b)=>b.missing-a.missing);
  const truncated=gaps.length>LIMIT_FINDINGS;
  return {
    repo,
    status:'sampled',
    sampled_runs:runs.length,
    api_total_count:metadata.total_count??null,
    possible_truncation:runs.length>=MAX_RUNS||((metadata.total_count??0)>runs.length),
    workflows:workflows.size,
    anomalies:gaps.slice(0,LIMIT_FINDINGS),
    anomaly_limit_reached:truncated,
    timestamp:new Date().toISOString(),
    limitations:[
      'No missing sequence number proves log deletion or compromise.',
      'Only a capped public API sample is inspected; deleted runs cannot be retrieved.',
      'Different workflows have independent numbering, and API history is incomplete.'
    ]
  };
}

export async function scanRunSequence(repo,{signal}={}){
  const path=repo.split('/').map(encodeURIComponent).join('/');
  const response=await fetch('https://api.github.com/repos/'+path+'/actions/runs?per_page='+MAX_RUNS,{
    signal,
    headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}
  });
  if(!response.ok)throw new Error(response.status===403||response.status===429?
    'Rate limit or access restriction (HTTP '+response.status+').':
    'Could not inspect public workflow runs (HTTP '+response.status+').');
  const data=await response.json();
  if(!Array.isArray(data.workflow_runs))throw new Error('Unexpected GitHub Actions API response.');
  return inspectRunSequence(repo,data.workflow_runs,{total_count:data.total_count});
}
