const energy=new Set(['foundations','forms','kinetic','potential','transfers','efficiency']);
const electricity=new Set(['circuits','quantities','ohm','networks']);
const investigationParts={ER01:2,ER05:2,ER06:2};
export function report(items) {
 const r={marks:0,format_marks:{},difficulty_marks:{},energy_marks:0,electricity_marks:0,investigation_marks:0,pure_calculation_marks:0,scenario_counts:{},skill_marks:{}};
 for(const q of items){r.marks+=q.marks;for(const [k,v] of [['format_marks',q.format],['difficulty_marks',q.difficulty],['skill_marks',q.cognitive_skill]])r[k][v]=(r[k][v]||0)+q.marks;
 if(energy.has(q.topic))r.energy_marks+=q.marks;if(electricity.has(q.topic))r.electricity_marks+=q.marks;
 r.investigation_marks+=q.topic==='investigations'?q.marks:(investigationParts[q.id]||0);
 if(q.cognitive_skill==='Calculation')r.pure_calculation_marks+=q.marks;
 r.scenario_counts[q.scenario_family]=(r.scenario_counts[q.scenario_family]||0)+1;}
 return r;
}
export function validateAssessment(items, blueprint) {
 const r=report(items),c=blueprint.constraints,errors=[];
 if(new Set(items.map(q=>q.id)).size!==items.length)errors.push('Duplicate question ID');
 if(r.marks!==blueprint.total_marks)errors.push('Wrong total');
 for(const [f,m] of Object.entries(blueprint.format_marks))if(r.format_marks[f]!==m)errors.push(`Wrong ${f} marks`);
 if(r.energy_marks<c.min_energy_marks)errors.push('Insufficient energy');
 if(r.electricity_marks<c.min_electricity_marks)errors.push('Insufficient electricity');
 if(r.investigation_marks<c.min_investigation_marks)errors.push('Insufficient investigation');
 if(r.pure_calculation_marks>c.max_pure_calculation_marks)errors.push('Too many calculation marks');
 if(Object.values(r.scenario_counts).some(n=>n>c.max_same_scenario_family))errors.push('Repeated scenario family');
 return {valid:errors.length===0,errors,report:r};
}
export function seededRandom(seed=1){let s=seed>>>0;return()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};}
function shuffle(a,rng){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
/** Select by hard coverage constraints, then rank valid candidates for soft diversity. */
export function selectAssessment(bank,blueprint,{seed=1,history=[]}={}){
 const rng=seededRandom(seed),pool=f=>bank.filter(q=>q.format===f);let best=null,bestScore=-Infinity;
 for(let n=0;n<1000;n++){
  const items=[...shuffle(pool('multiple_choice'),rng).slice(0,10),...shuffle(pool('short_answer'),rng).slice(0,9),...shuffle(pool('extended_response'),rng).slice(0,2)];
  const v=validateAssessment(items,blueprint);if(!v.valid)continue;
  let score=new Set(items.map(q=>q.cognitive_skill)).size*3+new Set(items.map(q=>q.scenario_family)).size;
  for(const [d,target] of Object.entries(blueprint.difficulty_target_by_marks))score-=Math.abs((v.report.difficulty_marks[d]||0)/40-target)*20;
  score-=items.filter(q=>history.includes(q.id)).length*4;
  for(let i=2;i<items.length;i++)if(items[i].command_word===items[i-1].command_word&&items[i].command_word===items[i-2].command_word)score-=1;
  if(score>bestScore){best={items,...v};bestScore=score;}
 }
 if(!best)throw Error('No valid assessment found; broaden the pool or review constraints.');
 return best;
}
/** Template chooser discourages recent IDs/families/skills/commands/structures. */
export function diversityScore(q,recent=[]) {
 return ['id','scenario_family','command_word','cognitive_skill','calculation_structure'].reduce((score,key)=>score-recent.filter(x=>q[key]!=null&&x[key]===q[key]).length,0);
}
