const assert=require('assert');const c=require('./load-app.cjs'),a=c.API;let pass=0,fail=0;function test(n,f){try{f();console.log('PASS',n);pass++}catch(e){console.log('FAIL',n,':',e.message);fail++}}
const base={weight:80,target:75,height:180,age:35,sex:'m',goal:'lose',days:[1,3,5],places:['gym']};function reset(d={}){a.S.days={};a.S.config={custom:[],hidden:[],onboarded:true,profile:{...a.calcProfile({...base,...d}),accepted:true,weights:[]}};a.UI.date=a.todayKey()}
reset();test('catalog IDs unique',()=>{const ids=a.allEx().map(e=>e.id);assert.equal(new Set(ids).size,ids.length)});
test('profile finite values',()=>{for(const goal of ['gain','lose','area'])for(const sex of ['m','f'])for(const weeks of [2,10,52,104]){const p=a.calcProfile({...base,goal,sex,weeks,target:goal==='gain'?85:75});for(const k of ['kcal','p','f','c','rate','weeks'])assert(Number.isFinite(p[k]))}});
test('all programs produce plans across 14 days',()=>{for(const program of Object.keys(a.PROGRAMS)){reset({program,goal:'gain',target:85});let n=0;for(let i=0;i<14;i++){const p=a.dayPlan(a.addDays(a.todayKey(),i));n+=p.length;for(const x of p){assert(a.getEx(x.ex));assert(x.goal>0)}}assert(n>0,program)}});
reset();test('set logging and removal',()=>{a.logSet('pushups');assert.equal(a.daySets(a.todayKey()).length,1);const s=a.daySets(a.todayKey())[0];a.removeSet(a.todayKey(),s.id);assert.equal(a.daySets(a.todayKey()).length,0)});
test('save and reload data',()=>{a.logSet('pushups');a.saveLocal();const n=Object.keys(a.S.days).length;a.S.days={};a.loadLocal();assert.equal(Object.keys(a.S.days).length,n)});
reset();test('coach food add and undo',()=>{const r=a.applyCoachActions([{type:'meal',name:'Обед',kcal:500,p:30,f:20,c:50}]);assert.equal(a.sumMeals(a.S.days[a.todayKey()].meals).kcal,500);a.COACH.msgs=[{undo:r.undo}];a.undoCoach(0);assert.equal((a.S.days[a.todayKey()]?.meals||[]).length,0)});
test('coach weight accepts comma',()=>{const r=a.applyCoachActions([{type:'weight',kg:'80,4'}]);assert(r.acts.length);assert.equal(a.weightOn(a.todayKey()),80.4)});
test('weight overwrites same day',()=>{a.logWeight(81);assert.equal(a.S.config.profile.weights.length,1);assert.equal(a.weightOn(a.todayKey()),81)});
test('weight rejects out of range',()=>{assert.equal(a.logWeight(400),false)});
test('weight rejects future date through coach',()=>{assert.equal(a.applyCoachActions([{type:'weight',kg:81,date:a.addDays(a.todayKey(),1)}]).acts.length,0)});
test('weight add and undo restores previous value',()=>{const r=a.applyCoachActions([{type:'weight',kg:82}]);a.COACH.msgs=[{undo:r.undo}];a.undoCoach(0);assert.equal(a.weightOn(a.todayKey()),81)});
reset({goal:'gain',target:81,weeks:104});test('long gain deadline does not overshoot target',()=>{const p=a.S.config.profile;assert(p.weight+p.rate*p.weeks<=p.target+0.1,JSON.stringify({rate:p.rate,projected:p.weight+p.rate*p.weeks,target:p.target}))});
reset();test('incomplete reps session must not increase reps',()=>{const k=a.addDays(a.todayKey(),-1);a.S.days[k]={sets:[{ex:'pushups',k:'reps',r:10,at:Date.now()}]};const r=a.suggestFor(a.getEx('pushups'),{goal:3,r:10});assert.notEqual(r.kind,'up',JSON.stringify(r))});
reset();test('weight rejects nonexistent calendar day',()=>{const y=a.todayKey().slice(0,4);const k=y+'-10-32';assert.equal(a.applyCoachActions([{type:'weight',date:k,kg:81}]).acts.length,0)});
reset();test('bodyweight goal updates to manually edited current weight',()=>{a.S.config.profile.weights=[{d:a.todayKey(),kg:80}];a.acceptProfile(a.calcProfile({...base,weight:82}));assert.equal(a.curWeight(a.S.config.profile),82)});
for(const fn of ['dayView','foodView','coachView','settingsView','goalCard','wkView'])test('render HTML '+fn,()=>assert.equal(typeof a[fn](),'string'));
test('water persists on day without food and sets',()=>{a.S.days={};a.UI.date=a.todayKey();a.addWater(250);assert.equal(a.S.days[a.UI.date]?.water,250)});
test('chosen deadline date preserved',()=>{a.SETUP.d={...base};a.SETUP.pr=a.calcProfile(base);const target=a.addDays(a.todayKey(),17);a.setDeadline(target);assert.equal(a.SETUP.pr.end,target)});


test('deadline buttons move exact date by seven days',()=>{const old=a.SETUP.pr.end;a.goalClick({swk:'1'});assert.equal(a.SETUP.pr.end,a.addDays(old,7))});
test('deadline auto reset clears exact date',()=>{a.setDeadline('auto');assert.equal(a.SETUP.d.deadline,'');assert.equal(a.SETUP.pr.end,a.addDays(a.todayKey(),a.SETUP.pr.autoWeeks*7))});
test('invalid and future weight dates rejected directly',()=>{assert.equal(a.logWeight(80,'2026-02-30'),false);assert.equal(a.logWeight(80,a.addDays(a.todayKey(),1)),false)});
test('complete reps session increases reps',()=>{reset();const k=a.addDays(a.todayKey(),-1);a.S.days[k]={sets:Array.from({length:3},()=>({ex:'pushups',k:'reps',r:10}))};assert.equal(a.suggestFor(a.getEx('pushups'),{goal:3,r:10}).kind,'up')});
test('water survives storage roundtrip',()=>{reset();a.addWater(250);a.S.days={};a.loadLocal();assert.equal(a.S.days[a.todayKey()].water,250)});
test('weight edits preserve older weigh-ins',()=>{reset();const old=a.addDays(a.todayKey(),-1);a.S.config.profile.weights=[{d:old,kg:80},{d:a.todayKey(),kg:81}];a.acceptProfile(a.calcProfile({...base,weight:82}));assert.equal(a.weightOn(old),80);assert.equal(a.weightOn(a.todayKey()),82);assert.equal(a.S.config.profile.weights.length,2)});
test('exact deadline survives setup reopening',()=>{reset();a.SETUP.d={...base};a.SETUP.pr=a.calcProfile(base);const end=a.addDays(a.todayKey(),17);a.setDeadline(end);const pr=a.SETUP.pr;a.S.config.profile={...pr,accepted:true,weights:[{d:a.todayKey(),kg:80}]};assert.equal(a.calcProfile({...base,weeks:pr.weeksSet,deadline:pr.deadlineSet}).end,end)});
console.log(JSON.stringify({pass,fail}));if(fail)process.exitCode=1;

