import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {combinations,generate,checkNumeric,checkOptions} from './generator.mjs';
import {validateAssessment,selectAssessment} from './assessment.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=n=>JSON.parse(fs.readFileSync(path.join(root,'data',n),'utf8'));
const bank=[...read('questions.json'),...read('extended_responses.json')];
const templates=['numerical_templates.json','conceptual_templates.json','extended_templates.json'].flatMap(read);
const ids=new Set();
function validate(q){
 assert(q.id&&q.question_text&&q.explanation);assert.equal(q.marking_rubric.reduce((a,r)=>a+r.marks,0),q.marks);
 assert(q.source_reference.length>0);assert(q.correct_answer);
 if(q.parts){assert.equal(q.parts.reduce((s,p)=>s+p.marks,0),q.marks);for(const p of q.parts)assert.equal(q.marking_rubric.filter(r=>r.part===p.id).reduce((s,r)=>s+r.marks,0),p.marks);}
 if(q.format==='multiple_choice'){
  assert.equal(q.options.length,4);assert.equal(new Set(q.options.map(o=>o.text.toLowerCase())).size,4);
  assert(q.correct_answer.option_ids.every(id=>q.options.some(o=>o.id===id)));assert.equal(new Set(q.correct_answer.option_ids).size,q.correct_answer.option_ids.length);
  assert.equal(q.selection_mode==='single',q.correct_answer.option_ids.length===1);
  assert(checkOptions(q,q.correct_answer.option_ids));assert(!checkOptions(q,[]));assert(!checkOptions(q,['Z']));
 }
 if(q.supporting_data?.asset)assert(fs.existsSync(path.join(root,q.supporting_data.asset)));
}
for(const q of bank){assert(!ids.has(q.id));ids.add(q.id);validate(q);}
const prompts=bank.map(q=>q.question_text.toLowerCase().replace(/\W/g,''));assert.equal(new Set(prompts).size,prompts.length);
const instances=[],examples=[];
for(const t of templates){
 const all=combinations(t);for(const [i,p] of all.entries()){
  const q=generate(t,p);validate(q);assert(!ids.has(q.id));ids.add(q.id);instances.push(q);if(i===0)examples.push(q);
  if(t.template_kind==='numerical'){
   assert(checkNumeric(q,q.correct_answer.rounded_value,q.correct_answer.unit));
   assert(!checkNumeric(q,'',q.correct_answer.unit));assert(!checkNumeric(q,'1garbage',q.correct_answer.unit));assert(!checkNumeric(q,q.correct_answer.value,'wrong-unit'));
   assert(!checkNumeric(q,q.correct_answer.value+1,q.correct_answer.unit));
  }
 }
 assert.throws(()=>generate(t,{}));const valid=all[0];assert.throws(()=>generate(t,{...valid,unknown:1}));
 const key=Object.keys(valid)[0];assert.throws(()=>generate(t,{...valid,[key]:'out-of-domain'}));
}
fs.writeFileSync(path.join(root,'data/generated_examples.json'),JSON.stringify(examples,null,2));
fs.writeFileSync(path.join(root,'data/validated_instances.json'),JSON.stringify(instances,null,2));
const blueprint=read('assessment_blueprints.json'),map=new Map(bank.map(q=>[q.id,q]));
const formReports=[];
for(const f of blueprint.forms){const items=[...f.mc,...f.sa,...f.er].map(id=>{assert(map.has(id));return map.get(id);});const r=validateAssessment(items,blueprint);assert(r.valid,`${f.id}: ${r.errors}`);formReports.push({id:f.id,...r});}
const sampled=[];for(let seed=1;seed<=20;seed++){const r=selectAssessment(bank,blueprint,{seed});assert(r.valid);sampled.push({seed,...r.report});}
const summary={fixed_questions:bank.length,multiple_choice:bank.filter(q=>q.format==='multiple_choice').length,short_answer:bank.filter(q=>q.format==='short_answer').length,extended_response:bank.filter(q=>q.format==='extended_response').length,templates:templates.length,all_permitted_instances:instances.length,examples:examples.length,forms:formReports,selection_seeds_tested:20,selection_reports:sampled,status:'passed'};
fs.writeFileSync(path.join(root,'data/runtime_validation.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify({fixed_questions:summary.fixed_questions,templates:summary.templates,all_permitted_instances:summary.all_permitted_instances,forms:formReports.map(x=>({id:x.id,valid:x.valid,report:x.report})),selection_seeds_tested:20,status:'passed'},null,2));
