/** Pure browser/Node ES module. No network, paid service, eval or dynamic code. */
const fmt = x => Number(x.toFixed(6)).toString();
export function combinations(t) {
  return Object.entries(t.variable_definitions).reduce((out,[key,def]) =>
    out.flatMap(p => def.allowed_values.map(v=>({...p,[key]:v}))),[{}]);
}
function check(t,p) {
  const defs=t.variable_definitions;
  if (Object.keys(p).length!==Object.keys(defs).length) throw Error('Missing or extra parameter');
  for (const [k,d] of Object.entries(defs)) if (!d.allowed_values.includes(p[k])) throw Error(`Invalid ${k}`);
}
function base(t,p) {
  return {id:`${t.template_id}:${Object.keys(t.variable_definitions).map(k=>`${k}=${p[k]}`).join(',')}`,
    schema_version:'1.0.0',template_id:t.template_id,parameters:{...p},subject:t.subject,year_level:t.year_level,unit:t.unit,
    topic:t.topic,subtopic:t.subtopic,difficulty:t.difficulty,cognitive_skill:t.cognitive_skill,scenario_family:t.scenario_family,
    source_reference:t.source_reference,source_alignment_status:t.source_alignment_status,authorship:'Original generated practice',
    rubric_status:'proposed_practice',supporting_data:null,options:null,acceptable_alternative_answers:[],important_terminology:[],common_mistakes:[],marks:t.marks,
    strong_answer_features:'Show the relationship, use the stated conditions and include units where relevant.'};
}
const registry = {
  kinetic_energy:p=>[.5*p.m*p.v**2,`E_k = ½ × ${p.m} × ${p.v}²`],
  gpe:p=>[p.m*9.8*p.h,`E_g = ${p.m} × 9.8 × ${p.h}`],
  ohm_current:p=>[p.V/p.R,`I = V/R = ${p.V}/${p.R}`],
  ohm_voltage:p=>[p.I*p.R,`V = IR = ${p.I} × ${p.R}`],
  ohm_resistance:p=>[p.V/p.I,`R = V/I = ${p.V}/${p.I}`],
  efficiency:p=>[100*p.useful/p.input,`Efficiency = ${fmt(p.useful)}/${p.input} × 100`],
  rebound:p=>[100*p.rebound/p.drop,`Rebound percentage = ${fmt(p.rebound)}/${p.drop} × 100`],
  waste:p=>[p.input-p.useful,`Other energy = ${p.input} − ${fmt(p.useful)}`],
  kj_to_j:p=>[p.kJ*1000,`${p.kJ} × 1000`],
  series_drop:p=>[p.V-p.known,`Other voltage drop = ${p.V} − ${p.known}`],
  branch_sum:p=>[p.a+p.b,`Supply current = ${p.a} + ${p.b}`],
  ke_factor:p=>[p.mf*p.vf**2,`Energy multiplier = ${p.mf} × ${p.vf}²`]
};
export function generate(t,p) {
  check(t,p);const q=base(t,p);
  if(t.template_kind==='numerical') {
    const fn=t.answer_generation_rules.function_id;
    if(!Object.hasOwn(registry,fn)) throw Error('Unknown calculation ID');
    const d={...p};
    if(fn==='efficiency'||fn==='waste') d.useful=p.input*p.percent/100;
    if(fn==='rebound') d.rebound=p.drop*p.percent/100;
    const [raw,working]=registry[fn](d), rule=t.answer_generation_rules;
    if(!Number.isFinite(raw)||raw<0)throw Error('Invalid generated answer');
    q.format='short_answer';
    q.question_text=t.question_template.replace(/\{(\w+)\}/g,(_,k)=>{if(!Object.hasOwn(d,k))throw Error('Unknown placeholder');return fmt(d[k]);})+` Give your answer to ${rule.decimal_places} decimal places if necessary.`;
    const rounded=Math.round((raw+Number.EPSILON)*10**rule.decimal_places)/10**rule.decimal_places;
    q.correct_answer={value:raw,rounded_value:rounded,unit:rule.unit,absolute_tolerance:rule.absolute_tolerance,
      model_response:`${working} = ${fmt(raw)} ${rule.unit}. Report ${rounded} ${rule.unit}${rounded!==raw?' after rounding':''}.`};
    q.explanation=q.correct_answer.model_response;
    q.marking_rubric=[{marks:1,criterion:'Correct relationship and substitution or equivalent valid method.'},{marks:1,criterion:`Correct result ${fmt(raw)} ${rule.unit}, allowing stated rounding.`}];
    q.calculation_structure=fn;
  } else if(t.template_kind==='conceptual') {
    const c=t.cases.find(c=>c.id===p.case_id);if(!c)throw Error('Unknown case');
    q.format='short_answer';q.question_text=c.question_text;q.correct_answer={model_response:c.model_response};
    q.explanation=c.model_response;q.marking_rubric=c.criteria.map(criterion=>({marks:1,criterion}));
    q.cognitive_skill=c.cognitive_skill;q.common_mistakes=c.common_mistakes;q.calculation_structure=null;
  } else if(t.template_kind==='extended_response') {
    q.format='extended_response';q.calculation_structure=t.answer_generation_rules.function_id;
    let parts,answers,criteria;
    if(q.calculation_structure==='extended_rebound') {
      const h=p.drop*p.percent/100;
      q.question_text=`A passive ball is released from rest at ${p.drop} cm and first rebounds to ${fmt(h)} cm. Both centre-of-mass heights use the same contact reference. No energy is added during the bounce.`;
      parts=['Calculate rebound percentage, showing working.','Explain the energy changes and why the rebound is lower.','Evaluate repeating this trial by throwing the ball down instead; propose a fair release method.'];
      answers=[`${fmt(h)}/${p.drop} × 100 = ${p.percent}%.`,'GPE becomes kinetic, then temporarily elastic during compression, then kinetic and GPE again. Some energy spreads as thermal energy and sound, leaving less recovered GPE.','Throwing adds initial kinetic energy. Use a repeatable release from rest without a push, keeping ball, surface and height consistent.'];
      criteria=['Correct rebound/drop ratio',`${p.percent}%`,'Accurate compression and rebound energy sequence','Explains energy to surroundings without destruction','Identifies extra input from throwing','Proposes release from rest with consistent controls'];
      q.important_terminology=['GPE','elastic','rebound percentage'];q.common_mistakes=['Reversing ratio','Treating a thrown ball as a release from rest'];
    } else if(q.calculation_structure==='extended_spring') {
      const useful=p.input*p.percent/100,waste=p.input-useful;
      q.question_text=`A spring stores ${p.input} J before launch. After launch it is relaxed and the car has ${fmt(useful)} J of kinetic energy. The remaining energy is thermal within the system. No energy crosses the boundary.`;
      parts=['Calculate the thermal energy increase and useful-output efficiency.','Describe final energy bars and explain conservation.','Predict what happens to useful output if friction is reduced with the same initial energy, and justify.'];
      answers=[`Thermal increase = ${p.input} − ${fmt(useful)} = ${fmt(waste)} J. Efficiency = ${fmt(useful)}/${p.input} × 100 = ${p.percent}%.`,`Elastic 0 J; kinetic ${fmt(useful)} J; thermal increase ${fmt(waste)} J. Total ${p.input} J equals the initial total.`,'Less energy is transferred into thermal energy by friction, so more can remain as useful kinetic energy, assuming other changes are negligible. Total energy still cannot exceed the input.'];
      criteria=[`${fmt(waste)} J thermal increase`,`${p.percent}% efficiency`,'Correct final bar values',`Conserved total ${p.input} J`,'Predicts greater useful kinetic energy','Explains reduced thermal transfer under stated conditions'];
      q.important_terminology=['system','conservation','efficiency'];q.common_mistakes=['Omitting thermal energy from the total'];
    } else if(q.calculation_structure==='extended_parallel') {
      q.question_text=`Two independently switched parallel lamp branches connect across an ideal ${p.V} V source. Branch A carries ${p.a} A and B carries ${p.b} A when both switches are closed.`;
      parts=['Determine branch voltages and total current when both switches are closed.','Predict the state of A and total current when only B is switched off.','Give one explained advantage and one trade-off of parallel wiring for independent lighting.'];
      answers=[`Each branch has ${p.V} V. Total current = ${p.a} + ${p.b} = ${fmt(p.a+p.b)} A.`,`A still has ${p.V} V and ${p.a} A; B has zero current. Total current is ${p.a} A.`,'A branch can operate independently because it has its own complete path. Extra branches require more wiring and can increase total supply current.'];
      criteria=[`${p.V} V each`,`${fmt(p.a+p.b)} A total`,'A remains operating under the ideal-source assumption',`${p.a} A total after B opens`,'Explained independent-operation advantage','Relevant wiring/current trade-off'];
      q.important_terminology=['branch','current','voltage'];q.common_mistakes=['Sharing voltage between parallel branches'];
    } else throw Error('Unknown extended generator');
    q.parts=parts.map((text,i)=>({id:String.fromCharCode(97+i),text,marks:2}));
    q.correct_answer={model_response:answers.map((s,i)=>`${String.fromCharCode(97+i)}) ${s}`).join('\n')};q.explanation=q.correct_answer.model_response;
    q.marking_rubric=criteria.map((criterion,i)=>({part:String.fromCharCode(97+Math.floor(i/2)),marks:1,criterion}));
    q.acceptable_alternative_answers=['Equivalent scientifically valid wording meeting the stated criteria.'];
  } else throw Error('Unknown template kind');
  const commandText=q.parts?.[0]?.text||q.question_text; const command=commandText.match(/\b(Select|Identify|Calculate|Explain|Describe|Compare|Predict|Determine|Evaluate|Propose|Draw|Write|Convert|Distinguish|Justify|Use)\b/i); q.command_word=command ? command[0][0].toUpperCase()+command[0].slice(1).toLowerCase() : 'Analyse'; return q;
}
/** Numeric value check only. Does not award method marks or validate written units. */
export function checkNumeric(q, value, unit) {
  const s=String(value).trim();if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s))return false;
  if(unit!==q.correct_answer.unit)return false;
  return Math.abs(Number(s)-q.correct_answer.value)<=q.correct_answer.absolute_tolerance;
}
export function checkOptions(q, ids) {
  if(!Array.isArray(ids)||new Set(ids).size!==ids.length)return false;
  const a=[...ids].sort(),b=[...q.correct_answer.option_ids].sort();return JSON.stringify(a)===JSON.stringify(b);
}
