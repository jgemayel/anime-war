// ===== ANIME WAR: POKEMON-STYLE BATTLE ENGINE + COLLECTION SYSTEM =====

// ---- CONFIGURATION ----
const TIER_MULT = {'S+':1.5,'S':1.3,'A':1.15,'B':1.0,'C':0.85};
const TIER_COSTS = {'S+':5000,'S':3000,'A':1500,'B':800,'C':400};
const DIFF_REWARDS = {easy:100,medium:250,hard:500};
const DIFF_BONUS_WIN = {easy:50,medium:125,hard:250};
const SAVE_KEY = 'animewar_save';
const DEFAULT_STARTERS_OP = ['op1','op2','op3','op4','op10','op46','op65','op9','op8','op31'];
const DEFAULT_STARTERS_NR = ['nr1','nr2','nr3','nr4','nr15','nr16','nr20','nr28','nr29','nr36'];
const DEFAULT_STARTERS = [...DEFAULT_STARTERS_OP,...DEFAULT_STARTERS_NR];

// ---- COLLECTION / SAVE SYSTEM ----
let saveData = loadSave();

function loadSave(){
  try{
    const s=localStorage.getItem(SAVE_KEY);
    if(s){const d=JSON.parse(s); if(d.unlocked&&d.coins!==undefined) return d;}
  }catch(e){}
  return {unlocked:[...DEFAULT_STARTERS],coins:0,wins:0,losses:0};
}
function saveSave(){localStorage.setItem(SAVE_KEY,JSON.stringify(saveData));}
function isUnlocked(id){return saveData.unlocked.includes(id);}
function unlockChar(id){
  const ch=ALL_CHARS.find(c=>c.id===id);
  if(!ch||isUnlocked(id)) return false;
  const cost=TIER_COSTS[ch.tier]||800;
  if(saveData.coins<cost) return false;
  saveData.coins-=cost;
  saveData.unlocked.push(id);
  saveSave();
  return true;
}
function addCoins(n){saveData.coins+=n;saveSave();}

// ---- HP & DAMAGE CALCULATIONS ----
function calcMaxHP(ch){
  return Math.floor((ch.def*2.5+150)*(TIER_MULT[ch.tier]||1));
}
function calcDamage(atk,def,move){
  const isPhys=['physical','taijutsu','sword','kenjutsu'].includes(move.type);
  const atkStat=isPhys? atk.atk : Math.max(atk.atk, atk.df||0, atk.haki||0);
  const defStat=def.def;
  const base=((move.power*(atkStat/50))*(50/(50+defStat)))+2;
  const variance=0.85+Math.random()*0.15;
  const spdBonus=atk.spd>def.spd?1.05:1.0;
  let dmg=Math.floor(base*variance*spdBonus);
  // Crit: 6.25% chance, 1.5x
  const crit=Math.random()<0.0625;
  if(crit) dmg=Math.floor(dmg*1.5);
  return {dmg:Math.max(1,dmg),crit};
}

// ---- BATTLE STATE ----
let currentBattle=null;

class BattleChar{
  constructor(ch){
    Object.assign(this,ch);
    this.maxHP=calcMaxHP(ch);
    this.hp=this.maxHP;
    this.moves=(BATTLE_MOVES[ch.id]||[
      {name:'Strike',type:'physical',power:50,acc:100,pp:30,effect:null},
      {name:'Power Hit',type:'physical',power:75,acc:90,pp:15,effect:null},
      {name:'Special',type:'special',power:90,acc:85,pp:8,effect:null},
      {name:'Ultimate',type:'special',power:110,acc:78,pp:4,effect:null}
    ]).map(m=>({...m,curPP:m.pp}));
    this.status=[];
    this.statMod={atk:0,def:0,spd:0};
    this.fainted=false;
  }
}

class Battle{
  constructor(pTeam,eTeam,diff){
    this.pTeam=pTeam.map(c=>new BattleChar(c));
    this.eTeam=eTeam.map(c=>new BattleChar(c));
    this.diff=diff;
    this.pIdx=0; this.eIdx=0;
    this.turn=0; this.log=[];
    this.phase='action'; // action|animating|switching|won|lost
    this.pendingLog=[];
  }
  get pActive(){return this.pTeam[this.pIdx];}
  get eActive(){return this.eTeam[this.eIdx];}

  doTurn(pMoveIdx){
    if(this.phase!=='action') return;
    this.phase='animating';
    this.pendingLog=[];
    const p=this.pActive, e=this.eActive;
    const pMove=p.moves[pMoveIdx];
    const eMoveIdx=this.aiPickMove(e,p);
    const eMove=e.moves[eMoveIdx];

    // Speed determines order
    const pSpd=p.spd*(1+p.statMod.spd*0.25);
    const eSpd=e.spd*(1+e.statMod.spd*0.25);
    const playerFirst=pSpd>=eSpd;

    const first=playerFirst?p:e, second=playerFirst?e:p;
    const fMove=playerFirst?pMove:eMove, sMove=playerFirst?eMove:pMove;
    const fTarget=playerFirst?e:p, sTarget=playerFirst?p:e;

    this.execAttack(first,fTarget,fMove);
    if(!sTarget.fainted&&!second.fainted) this.execAttack(second,sTarget,sMove);

    // Status ticks
    this.tickStatus(p); this.tickStatus(e);

    // Check fainting
    this.checkFaint();
    this.turn++;
    return this.pendingLog;
  }

  execAttack(atk,def,move){
    if(atk.fainted) return;
    // Stun check
    if(atk.status.some(s=>s.type==='stun')&&Math.random()<0.3){
      this.addLog(`${atk.name} is paralyzed and can't move!`); return;
    }
    if(move.curPP<=0){this.addLog(`${atk.name} has no PP for ${move.name}!`);return;}
    move.curPP--;
    // Accuracy
    if(Math.random()*100>move.acc){
      this.addLog(`${atk.name} used ${move.name}... Miss!`);return;
    }
    const {dmg,crit}=calcDamage(atk,def,move);
    def.hp=Math.max(0,def.hp-dmg);
    let msg=`${atk.name} used ${move.name}! ${dmg} dmg!`;
    if(crit) msg+=` Critical hit!`;
    this.addLog(msg);
    if(def.hp<=0){def.fainted=true;this.addLog(`${def.name} fainted!`);}
    // Effect
    if(move.effect&&!def.fainted) this.applyEffect(atk,def,move.effect);
  }

  applyEffect(atk,def,eff){
    if(eff==='burn'&&!def.status.some(s=>s.type==='burn')){
      def.status.push({type:'burn',turns:3});this.addLog(`${def.name} was burned!`);
    }else if(eff==='poison'&&!def.status.some(s=>s.type==='poison')){
      def.status.push({type:'poison',turns:3});this.addLog(`${def.name} was poisoned!`);
    }else if(eff==='stun'&&!def.status.some(s=>s.type==='stun')){
      def.status.push({type:'stun',turns:2});this.addLog(`${def.name} was paralyzed!`);
    }else if(eff.startsWith('heal:')){
      const pct=parseInt(eff.split(':')[1]);
      const heal=Math.floor(atk.maxHP*pct/100);
      atk.hp=Math.min(atk.maxHP,atk.hp+heal);
      this.addLog(`${atk.name} recovered ${heal} HP!`);
    }else if(eff.startsWith('buff_')){
      const st=eff.replace('buff_','');
      atk.statMod[st]=Math.min(3,(atk.statMod[st]||0)+1);
      this.addLog(`${atk.name}'s ${st} rose!`);
    }else if(eff.startsWith('debuff_')){
      const st=eff.replace('debuff_','');
      def.statMod[st]=Math.max(-3,(def.statMod[st]||0)-1);
      this.addLog(`${def.name}'s ${st} fell!`);
    }
  }

  tickStatus(ch){
    if(ch.fainted) return;
    ch.status=ch.status.filter(s=>{
      if(s.type==='burn'){
        const d=Math.floor(ch.maxHP*0.06);ch.hp=Math.max(0,ch.hp-d);
        this.addLog(`${ch.name} took ${d} burn dmg!`);
      }else if(s.type==='poison'){
        const d=Math.floor(ch.maxHP*0.08);ch.hp=Math.max(0,ch.hp-d);
        this.addLog(`${ch.name} took ${d} poison dmg!`);
      }
      if(ch.hp<=0){ch.fainted=true;this.addLog(`${ch.name} fainted!`);}
      s.turns--;return s.turns>0;
    });
  }

  checkFaint(){
    // Enemy auto-switch
    if(this.eActive.fainted){
      const nx=this.eTeam.findIndex((c,i)=>i>this.eIdx&&!c.fainted);
      if(nx>=0){this.eIdx=nx;this.addLog(`Opponent sends out ${this.eActive.name}!`);}
    }
    // Win/lose check
    if(this.eTeam.every(c=>c.fainted)){this.phase='won';return;}
    if(this.pTeam.every(c=>c.fainted)){this.phase='lost';return;}
    // Player needs to switch
    if(this.pActive.fainted){
      const alive=this.pTeam.filter(c=>!c.fainted);
      if(alive.length===1){
        this.pIdx=this.pTeam.indexOf(alive[0]);
        this.addLog(`Go, ${this.pActive.name}!`);
        this.phase='action';
      }else{
        this.phase='switching';
      }
    }else{
      this.phase='action';
    }
  }

  switchPlayer(idx){
    if(this.pTeam[idx].fainted) return false;
    this.pIdx=idx;
    this.addLog(`Go, ${this.pActive.name}!`);
    this.phase='action';
    return true;
  }

  aiPickMove(ai,target){
    const avail=ai.moves.map((m,i)=>({m,i})).filter(x=>x.m.curPP>0);
    if(!avail.length) return 0;
    if(this.diff==='easy') return avail[Math.floor(Math.random()*avail.length)].i;
    // Medium/Hard: pick best expected damage (hard always, medium 70%)
    if(this.diff==='hard'||Math.random()<0.7){
      let best=avail[0];
      avail.forEach(x=>{if(x.m.power*x.m.acc>best.m.power*best.m.acc) best=x;});
      return best.i;
    }
    return avail[Math.floor(Math.random()*avail.length)].i;
  }

  addLog(m){this.pendingLog.push(m);this.log.push(m);}
}

// ---- AI TEAM SELECTION ----
function aiSelectTeam(diff){
  let pool=[...ALL_CHARS];
  if(diff==='easy') pool=pool.filter(c=>c.tier==='B'||c.tier==='C');
  else if(diff==='medium') pool=pool.filter(c=>c.tier==='A'||c.tier==='B'||c.tier==='S');
  else pool=pool.filter(c=>c.tier==='S+'||c.tier==='S'||c.tier==='A');
  // Shuffle
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  return pool.slice(0,3);
}

// ---- UI RENDERING ----
let selectedBattleTeam=[];
let selectedDifficulty='medium';

function showBattleSetup(){
  document.getElementById('title-screen').style.display='none';
  document.getElementById('battleSetup').style.display='block';
  selectedBattleTeam=[];
  selectedDifficulty='medium';
  renderBattleSetup();
}

function renderBattleSetup(){
  const grid=document.getElementById('battleTeamGrid');
  const unlocked=ALL_CHARS.filter(c=>isUnlocked(c.id));
  grid.innerHTML=unlocked.map(c=>{
    const sel=selectedBattleTeam.includes(c.id);
    return `<div class="bt-char ${sel?'bt-selected':''}" onclick="toggleBattleChar('${c.id}')">
      <img src="${CHAR_IMGS[c.id]||'images/'+c.id+'.jpg'}" alt="${c.name}">
      <div class="bt-char-name">${c.name}</div>
      <div class="bt-char-tier tier-${c.tier.replace('+','p')}">${c.tier}</div>
    </div>`;
  }).join('');
  document.getElementById('battleTeamCount').textContent=`${selectedBattleTeam.length}/3`;
  document.getElementById('btnBattleStart').disabled=selectedBattleTeam.length!==3;

  // Difficulty buttons
  document.querySelectorAll('.diff-btn').forEach(b=>{
    b.classList.toggle('diff-active',b.dataset.diff===selectedDifficulty);
  });
}

function toggleBattleChar(id){
  const idx=selectedBattleTeam.indexOf(id);
  if(idx>=0) selectedBattleTeam.splice(idx,1);
  else if(selectedBattleTeam.length<3) selectedBattleTeam.push(id);
  renderBattleSetup();
}

function setDifficulty(d){selectedDifficulty=d;renderBattleSetup();}

function startBattleFight(){
  if(selectedBattleTeam.length!==3) return;
  const pTeam=selectedBattleTeam.map(id=>ALL_CHARS.find(c=>c.id===id));
  const eTeam=aiSelectTeam(selectedDifficulty);
  currentBattle=new Battle(pTeam,eTeam,selectedDifficulty);
  document.getElementById('battleSetup').style.display='none';
  document.getElementById('battleArena').style.display='block';
  renderBattle();
}

function renderBattle(){
  if(!currentBattle) return;
  const b=currentBattle, p=b.pActive, e=b.eActive;

  // Player side
  document.getElementById('pName').textContent=p.name;
  document.getElementById('pImg').src=CHAR_IMGS[p.id]||'images/'+p.id+'.jpg';
  const pPct=Math.max(0,p.hp/p.maxHP*100);
  document.getElementById('pHPBar').style.width=pPct+'%';
  document.getElementById('pHPBar').className='hp-fill '+(pPct>50?'hp-green':pPct>20?'hp-yellow':'hp-red');
  document.getElementById('pHPText').textContent=`${p.hp}/${p.maxHP}`;
  // Status icons
  document.getElementById('pStatus').innerHTML=p.status.map(s=>
    s.type==='burn'?'🔥':s.type==='poison'?'☠️':s.type==='stun'?'⚡':''
  ).join(' ');

  // Enemy side
  document.getElementById('eName').textContent=e.name;
  document.getElementById('eImg').src=CHAR_IMGS[e.id]||'images/'+e.id+'.jpg';
  const ePct=Math.max(0,e.hp/e.maxHP*100);
  document.getElementById('eHPBar').style.width=ePct+'%';
  document.getElementById('eHPBar').className='hp-fill '+(ePct>50?'hp-green':ePct>20?'hp-yellow':'hp-red');
  document.getElementById('eHPText').textContent=`${e.hp}/${e.maxHP}`;
  document.getElementById('eStatus').innerHTML=e.status.map(s=>
    s.type==='burn'?'🔥':s.type==='poison'?'☠️':s.type==='stun'?'⚡':''
  ).join(' ');

  // Team indicators
  document.getElementById('pTeamDots').innerHTML=b.pTeam.map(c=>
    `<span class="team-dot ${c.fainted?'dot-dead':'dot-alive'}"></span>`
  ).join('');
  document.getElementById('eTeamDots').innerHTML=b.eTeam.map(c=>
    `<span class="team-dot ${c.fainted?'dot-dead':'dot-alive'}"></span>`
  ).join('');

  // Action area
  const actDiv=document.getElementById('battleActions');
  if(b.phase==='action'){
    actDiv.innerHTML=`<div class="move-grid">${p.moves.map((m,i)=>
      `<button class="move-btn move-${m.type}" onclick="doPlayerMove(${i})" ${m.curPP<=0?'disabled':''}>
        <span class="move-name">${m.name}</span>
        <span class="move-info">${m.type} | Pwr:${m.power} | PP:${m.curPP}/${m.pp}</span>
      </button>`
    ).join('')}</div>
    <div class="battle-bottom-btns">
      <button class="switch-btn" onclick="showSwitchMenu()">Switch</button>
      <button class="forfeit-btn" onclick="forfeitBattle()">Run</button>
    </div>`;
  }else if(b.phase==='switching'){
    const alive=b.pTeam.filter((c,i)=>!c.fainted&&i!==b.pIdx);
    actDiv.innerHTML=`<div class="switch-prompt">Choose next fighter!</div>
    <div class="switch-grid">${alive.map(c=>{
      const idx=b.pTeam.indexOf(c);
      return `<button class="switch-char-btn" onclick="doSwitch(${idx})">
        <img src="${CHAR_IMGS[c.id]||'images/'+c.id+'.jpg'}">
        <span>${c.name}</span><span class="switch-hp">${c.hp}/${c.maxHP}</span>
      </button>`;
    }).join('')}</div>`;
  }else if(b.phase==='won'||b.phase==='lost'){
    const reward=b.phase==='won'?DIFF_REWARDS[b.diff]:0;
    const bonus=b.phase==='won'?DIFF_BONUS_WIN[b.diff]:0;
    if(b.phase==='won'){saveData.wins++;addCoins(reward+bonus);}
    else{saveData.losses++;saveSave();}
    actDiv.innerHTML=`<div class="battle-result ${b.phase}">
      <h2>${b.phase==='won'?'VICTORY!':'DEFEAT'}</h2>
      ${b.phase==='won'?`<div class="reward-text">+${reward+bonus} coins earned!</div>`:''}
      <div class="result-btns">
        <button onclick="showBattleSetup()">Play Again</button>
        <button onclick="closeBattle()">Main Menu</button>
      </div>
    </div>`;
  }

  // Battle log
  const logDiv=document.getElementById('battleLog');
  logDiv.innerHTML=b.log.slice(-6).map(m=>`<div class="log-line">${m}</div>`).join('');
  logDiv.scrollTop=logDiv.scrollHeight;
}

function doPlayerMove(idx){
  if(!currentBattle||currentBattle.phase!=='action') return;
  const logs=currentBattle.doTurn(idx);
  // Animate with delays
  animateLogs(logs,()=>renderBattle());
}

function animateLogs(logs,cb){
  const logDiv=document.getElementById('battleLog');
  let i=0;
  function next(){
    if(i>=logs.length){cb();return;}
    const line=document.createElement('div');
    line.className='log-line log-new';
    line.textContent=logs[i];
    logDiv.appendChild(line);
    logDiv.scrollTop=logDiv.scrollHeight;
    i++;
    setTimeout(next,400);
  }
  logDiv.innerHTML='';
  next();
}

function showSwitchMenu(){
  if(!currentBattle) return;
  const b=currentBattle;
  const alive=b.pTeam.filter((c,i)=>!c.fainted&&i!==b.pIdx);
  if(!alive.length) return;
  const actDiv=document.getElementById('battleActions');
  actDiv.innerHTML=`<div class="switch-prompt">Switch to who?</div>
  <div class="switch-grid">${alive.map(c=>{
    const idx=b.pTeam.indexOf(c);
    return `<button class="switch-char-btn" onclick="doVoluntarySwitch(${idx})">
      <img src="${CHAR_IMGS[c.id]||'images/'+c.id+'.jpg'}">
      <span>${c.name}</span><span class="switch-hp">${c.hp}/${c.maxHP}</span>
    </button>`;
  }).join('')}</div>
  <button class="back-btn" onclick="renderBattle()">Back</button>`;
}

function doVoluntarySwitch(idx){
  if(!currentBattle) return;
  // Voluntary switch costs a turn - enemy gets a free hit
  currentBattle.switchPlayer(idx);
  const e=currentBattle.eActive, p=currentBattle.pActive;
  const eMoveIdx=currentBattle.aiPickMove(e,p);
  const eMove=e.moves[eMoveIdx];
  currentBattle.pendingLog=[];
  currentBattle.execAttack(e,p,eMove);
  currentBattle.tickStatus(p);currentBattle.tickStatus(e);
  currentBattle.checkFaint();
  currentBattle.turn++;
  animateLogs(currentBattle.pendingLog,()=>renderBattle());
}

function doSwitch(idx){
  if(!currentBattle) return;
  currentBattle.switchPlayer(idx);
  renderBattle();
}

function forfeitBattle(){
  currentBattle=null;
  closeBattle();
}

function closeBattle(){
  document.getElementById('battleArena').style.display='none';
  document.getElementById('battleSetup').style.display='none';
  document.getElementById('title-screen').style.display='flex';
  currentBattle=null;
}

// ---- COLLECTION UI ----
let collectionFilter='all';

function showCollection(){
  document.getElementById('title-screen').style.display='none';
  document.getElementById('collectionScreen').style.display='block';
  collectionFilter='all';
  renderCollection();
}

function setCollFilter(f){collectionFilter=f;renderCollection();}

function renderCollection(){
  document.getElementById('collCoins').textContent=saveData.coins.toLocaleString();
  document.getElementById('collUnlocked').textContent=saveData.unlocked.length;
  document.getElementById('collTotal').textContent=ALL_CHARS.length;
  document.getElementById('collWins').textContent=saveData.wins;

  let chars=[...ALL_CHARS];
  if(collectionFilter==='onepiece') chars=chars.filter(c=>c.anime==='onepiece');
  else if(collectionFilter==='naruto') chars=chars.filter(c=>c.anime==='naruto');
  else if(collectionFilter==='locked') chars=chars.filter(c=>!isUnlocked(c.id));

  // Sort: unlocked first, then by tier
  const tierOrder={'S+':0,'S':1,'A':2,'B':3,'C':4};
  chars.sort((a,b)=>{
    const ua=isUnlocked(a.id)?0:1, ub=isUnlocked(b.id)?0:1;
    if(ua!==ub) return ua-ub;
    return (tierOrder[a.tier]||9)-(tierOrder[b.tier]||9);
  });

  const grid=document.getElementById('collGrid');
  grid.innerHTML=chars.map(c=>{
    const unlocked=isUnlocked(c.id);
    const cost=TIER_COSTS[c.tier]||800;
    const canAfford=saveData.coins>=cost;
    return `<div class="coll-card ${unlocked?'coll-unlocked':'coll-locked'}" ${!unlocked&&canAfford?`onclick="tryUnlock('${c.id}')"`:''}>
      <div class="coll-img-wrap">
        <img src="${CHAR_IMGS[c.id]||'images/'+c.id+'.jpg'}" class="${unlocked?'':'coll-silhouette'}">
        ${!unlocked?`<div class="coll-cost ${canAfford?'can-afford':''}">${cost} coins</div>`:''}
      </div>
      <div class="coll-name">${unlocked?c.name:'???'}</div>
      <div class="coll-tier tier-${c.tier.replace('+','p')}">${c.tier}</div>
    </div>`;
  }).join('');

  // Update filter buttons
  document.querySelectorAll('.coll-filter-btn').forEach(b=>{
    b.classList.toggle('filter-active',b.dataset.filter===collectionFilter);
  });
}

function tryUnlock(id){
  if(unlockChar(id)){
    renderCollection();
    // Flash effect
    const el=document.querySelector(`.coll-card[onclick*="${id}"]`);
    if(el){el.classList.add('coll-just-unlocked');setTimeout(()=>el.classList.remove('coll-just-unlocked'),1000);}
  }
}

function closeCollection(){
  document.getElementById('collectionScreen').style.display='none';
  document.getElementById('title-screen').style.display='flex';
}
