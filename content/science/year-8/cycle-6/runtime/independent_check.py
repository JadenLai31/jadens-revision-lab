"""Independent finite-domain arithmetic and data-contract checks; Python standard library only."""
import json, math, pathlib, collections, re, difflib
R=pathlib.Path(__file__).resolve().parents[1]
def read(name): return json.loads((R/'data'/name).read_text())
def close(a,b): assert math.isclose(a,b,rel_tol=1e-10,abs_tol=1e-10),(a,b)
def contract(obj,schema,path='root'):
 types={'object':dict,'array':list,'string':str,'integer':int,'number':(int,float),'null':type(None),'boolean':bool}
 if 'type' in schema:
  ts=schema['type'] if isinstance(schema['type'],list) else [schema['type']]
  assert any(isinstance(obj,types[t]) for t in ts),(path,'type')
 if 'const' in schema:assert obj==schema['const'],path
 if 'enum' in schema:assert obj in schema['enum'],path
 if isinstance(obj,dict):
  for k in schema.get('required',[]):assert k in obj,(path,k)
  if 'minProperties' in schema:assert len(obj)>=schema['minProperties'],path
  for k,v in obj.items():
   if k in schema.get('properties',{}):contract(v,schema['properties'][k],path+'.'+k)
   elif isinstance(schema.get('additionalProperties'),dict):contract(v,schema['additionalProperties'],path+'.'+k)
 if isinstance(obj,list):
  if 'minItems' in schema:assert len(obj)>=schema['minItems'],path
  if schema.get('uniqueItems'):assert len(set(map(lambda x:json.dumps(x,sort_keys=True),obj)))==len(obj),path
  if 'items' in schema:
   for i,x in enumerate(obj):contract(x,schema['items'],path+f'[{i}]')
 if isinstance(obj,str) and 'minLength' in schema:assert len(obj)>=schema['minLength'],path
 if isinstance(obj,(int,float)) and 'minimum' in schema:assert obj>=schema['minimum'],path

fixed=read('questions.json')+read('extended_responses.json');generated=read('validated_instances.json')
templates=sum([read(x) for x in ['numerical_templates.json','conceptual_templates.json','extended_templates.json']],[])
qs=read('question.schema.json');ts=read('template.schema.json')
for q in fixed+generated:contract(q,qs)
for t in templates:contract(t,ts)
by={q['id']:q for q in fixed}

# Independent arithmetic oracle: does not call the JavaScript registry.
oracle={
 'N01':lambda p:p['m']*p['v']*p['v']/2,
 'N02':lambda p:9.8*p['h']*p['m'],
 'N03':lambda p:p['V']/p['R'],
 'N04':lambda p:p['R']*p['I'],
 'N05':lambda p:p['V']/p['I'],
 'N06':lambda p:p['percent'], 'N07':lambda p:p['percent'],
 'N08':lambda p:p['input']*(100-p['percent'])/100,
 'N09':lambda p:1000*p['kJ'],
 'N10':lambda p:p['V']-p['known'],
 'N11':lambda p:sum([p['a'],p['b']]),
 'N12':lambda p:p['vf']*p['vf']*p['mf']}
numeric=0;extended=0
for q in generated:
 if q['template_id'] in oracle:
  close(q['correct_answer']['value'],oracle[q['template_id']](q['parameters']));numeric+=1
  assert math.isfinite(q['correct_answer']['value'])
  assert abs(q['correct_answer']['rounded_value']-q['correct_answer']['value'])<=q['correct_answer']['absolute_tolerance']
 elif q['template_id'].startswith('X'):
  extended+=1;p=q['parameters'];text=q['correct_answer']['model_response']
  if q['template_id']=='X01':assert f"{p['percent']}%" in text
  if q['template_id']=='X02':
   useful=p['input']*p['percent']/100;other=p['input']-useful;close(useful+other,p['input']);assert f'{other:g} J' in text
  if q['template_id']=='X03':assert f"{p['a']+p['b']:g} A" in text and f"{p['V']} V" in text

# Fixed worked numerical responses: independently recompute and verify rendered result tokens.
checks={
 'SA01':[(3.6*1000,'3600 J')], 'SA04':[(4*2**2/2,'8 J')], 'SA05':[(.5*4**2/2,'4 J')],
 'SA06':[(2*3**2/2,'9 J'),(1*4**2/2,'8 J')], 'SA08':[(2*9.8*1.5,'29.4 J')],
 'SA09':[(.4*9.8*.75,'2.94 J')], 'SA15':[(60-15,'45 J')],
 'SA16':[(500-100,'400 J'),(100/500*100,'20%')], 'SA17':[(84/120*100,'70%')],
 'SA25':[(12/24,'0.5 A')], 'SA26':[(.2*60,'12 V')], 'SA27':[(9/.03,'300 Ω')],
 'SA29':[(6/.3,'20 Ω')], 'SA31':[(10-4,'6 V')], 'SA32':[(.2+.35,'0.55 A')],
 'SA37':[((68+72+70)/3,'70 cm'),(72-68,'4 cm')]}
for id,pairs in checks.items():
 text=by[id]['correct_answer']['model_response']
 for value,token in pairs:
  close(value,float(re.match(r'[0-9.]+',token).group()));assert token in text,(id,token)
mc_key=['A','C',['A','B','D'],'D','B','C','B','B','C','A','B','C','B',['A','B'],'B','B','A','B','B','A','B','B','B','B','B','B','B','B','A','B','A','B']
for i,answer in enumerate(mc_key,1):assert by[f'MC{i:02}']['correct_answer']['option_ids']==(answer if isinstance(answer,list) else [answer])
close(150/200*100,75);close(6/30,.2);close(.15*40,6)
assert '73 cm' in by['ER01']['correct_answer']['model_response'];close(sum([72,74,73])/3,73);close(sum([58,62,60])/3,60)
close(70+30,100);close(200/800*100,25);close(50/800*100,6.25)
close(2*9.8*1.5,29.4);close(29.4-20,9.4);assert round(20/29.4*100,1)==68
close((4500-800)*1000,3700000);close(10/20,.5);close(.2+.3,.5)

for f in read('assessment_blueprints.json')['forms']:
 ids=f['mc']+f['sa']+f['er'];assert len(ids)==len(set(ids));assert sum(by[i]['marks'] for i in ids)==40
 for id in ids:
  # Cross-question references must remain resolvable when assembling a paper.
  for referenced in re.findall(r'\bSA\d{2}\b',by[id]['question_text']):assert referenced in ids,(id,referenced)

# Similarity check is a review aid, not a claim of semantic uniqueness.
pairs=[]
for i,a in enumerate(fixed):
 for b in fixed[i+1:]:
  ratio=difflib.SequenceMatcher(None,a['question_text'].lower(),b['question_text'].lower()).ratio()
  if ratio>=.72:pairs.append({'a':a['id'],'b':b['id'],'similarity':round(ratio,3)})
summary={'status':'passed','fixed_question_contracts':len(fixed),'generated_question_contracts':len(generated),'template_contracts':len(templates),'numerical_instances_independently_checked':numeric,'extended_instances_energy_current_checks':extended,'fixed_numerical_responses_checked':len(checks),'mc_keys_reviewed':len(mc_key),'near_duplicate_review_candidates':pairs,'contract_note':'Checks the keywords used in the bundled schemas; not a general-purpose JSON Schema implementation.'}
(R/'data/independent_validation.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary,indent=2))
