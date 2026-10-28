const fs=require('fs'),ref=require('./independent.cjs');
const rows=[
[.02,.05,.16,.03,.11,.30,.07,.21,.48],[.03,.11,.30,.07,.21,.48,.14,.36,.67],[.04,.13,.36,.09,.25,.55,.17,.42,.73],[.09,.25,.55,.17,.43,.73,.31,.62,.85],
[.06,.17,.43,.11,.31,.62,.22,.50,.78],[.11,.31,.62,.22,.50,.78,.38,.69,.89],[.14,.37,.68,.26,.56,.82,.44,.74,.91],[.27,.56,.82,.44,.74,.91,.63,.86,.96],
[.03,.11,.30,.07,.21,.48,.14,.37,.67],[.07,.21,.49,.14,.37,.67,.26,.56,.82],[.09,.25,.55,.17,.43,.73,.31,.62,.85],[.17,.43,.73,.31,.62,.85,.50,.78,.93],
[.11,.31,.62,.22,.50,.78,.38,.69,.89],[.22,.50,.78,.38,.69,.89,.57,.83,.95],[.27,.57,.82,.44,.74,.91,.63,.86,.96],[.44,.74,.91,.64,.86,.96,.79,.93,.98]];
let results=[];for(let b=0;b<16;b++)for(let a=0;a<3;a++)for(let d=0;d<3;d++){const i={age:[35,55,75][a],diameter:[10,20,30][d],smoker:!!(b&8),cancer:!!(b&4),spiculation:!!(b&2),upper:!!(b&1)},actual=ref.mayo(i),published=rows[b][a*3+d];results.push({input:i,published,actual,ok:Math.abs(actual-published)<=.005})}
const graph=[5,10,20,40,80].map(cigarettes=>({cigarettes,probability:ref.plco({age:62,race:'white',education:4,bmi:27,copd:0,cancer:0,family:0,current:0,cigarettes,duration:27,quit:10})}));
const nomogram=['absent','faint','moderate','intense'].map(fdg=>({mayo:.5,fdg,herder:ref.herder(.5,fdg)}));
fs.writeFileSync(__dirname+'/published.json',JSON.stringify({results,graph,nomogram},null,2));console.log(JSON.stringify({count:results.length,failures:results.filter(r=>!r.ok),graph,nomogram},null,2));
