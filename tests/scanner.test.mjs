import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRepositories,detectIndicators,buildReport,MAX_REPOS} from '../src/lib/scanner.mjs';

test('parse targets deduplicates and supports owner/repo',()=>{
  assert.deepEqual(parseRepositories('PhiOS MichaelWave369/PhiOS\nsomebody/project'),['MichaelWave369/PhiOS','somebody/project']);
});
test('rejects URLs, empty input and excessive scopes',()=>{
  assert.throws(()=>parseRepositories('https://github.com/x/y'));
  assert.throws(()=>parseRepositories(' '));
  assert.throws(()=>parseRepositories(Array(MAX_REPOS+1).fill(0).map((_,i)=>'repo'+i).join(' ')));
});
test('recognizes documented probe without double-counting its title and branch',()=>{
  const findings=detectIndicators('demo/repo',{pulls:[{number:8,title:'docs: dependency audit notes',head:{ref:'wfx-docs'},html_url:'https://github.com/demo/repo/pull/8'}]});
  assert.equal(findings.length,1);
  assert.equal(findings[0].url,'https://github.com/demo/repo/pull/8');
});
test('recognizes malicious commit title but not ordinary restore messages',()=>{
  const findings=detectIndicators('demo/repo',{commits:[{sha:'123abc',commit:{message:'chore: add ci helper'}},{sha:'789def',commit:{message:'ci: restore original tests'}}]});
  assert.equal(findings.length,1);
  assert.equal(findings[0].kind,'commit');
});
test('recognizes wfx-docs branch, not generic chore branches',()=>{
  const findings=detectIndicators('demo/repo',{branches:[{name:'wfx-docs'},{name:'chore/abcdef12'}]});
  assert.equal(findings.length,1);
  assert.equal(findings[0].kind,'branch');
});
test('report explicitly includes no-certification limitation',()=>{
  const report=buildReport([{repo:'demo/repo',status:'sampled',findings:[]}]);
  assert.match(report.limitations[0],/does not mean clean/);
});
