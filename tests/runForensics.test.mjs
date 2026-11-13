import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectRunSequence} from '../src/lib/runForensics.mjs';
function entry(id,num,date='2026-11-12T08:00:00Z'){
  return {workflow_id:id,run_number:num,name:'test-workflow',created_at:date,html_url:'https://github.com/demo/repo/actions/runs/'+num};
}
test('continuous numbering yields no anomalies',()=>{
  const r=inspectRunSequence('demo/repo',[entry(7,19),entry(7,18),entry(7,17)]);
  assert.equal(r.anomalies.length,0);
  assert.equal(r.status,'sampled');
});
test('missing number is an investigative signal, not a verdict',()=>{
  const r=inspectRunSequence('demo/repo',[entry(7,21),entry(7,19)]);
  assert.equal(r.anomalies.length,1);
  assert.equal(r.anomalies[0].missing,1);
  assert.equal(r.anomalies[0].higher,21);
  assert.match(r.anomalies[0].explanation,/other benign causes/i);
});
test('different workflows cannot be compared against one another',()=>{
  const r=inspectRunSequence('demo/repo',[entry(7,21),entry(8,19)]);
  assert.equal(r.anomalies.length,0);
  assert.equal(r.workflows,2);
});
test('repeat attempts with the same run number do not create fake gaps',()=>{
  const r=inspectRunSequence('demo/repo',[entry(7,14),entry(7,14),entry(7,13)]);
  assert.equal(r.anomalies.length,0);
});
test('older-only sequence gaps excluded from this campaign window',()=>{
  const r=inspectRunSequence('demo/repo',[entry(7,14,'2025-01-12T00:00:00Z'),entry(7,12,'2025-01-11T00:00:00Z')]);
  assert.equal(r.anomalies.length,0);
});
test('reports truncation and retains scope metadata',()=>{
  const r=inspectRunSequence('demo/repo',[entry(7,1)],{total_count:500});
  assert.equal(r.possible_truncation,true);
  assert.equal(r.api_total_count,500);
});
test('malformed data is ignored rather than crashing',()=>{
  const r=inspectRunSequence('demo/repo',[null,{},entry(7,2),{workflow_id:7,run_number:0}]);
  assert.equal(r.anomalies.length,0);
});
