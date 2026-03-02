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


// ---- TYPE EFFECTIVENESS ----
// physical/taijutsu beats: sword/kenjutsu (brute force overwhelms)
// sword/kenjutsu beats: special/df/ninjutsu (precise cuts)
// haki/genjutsu beats: df/ninjutsu (willpower/illusion disrupts)
// df/ninjutsu beats: physical/taijutsu (powers overwhelm muscle)
// special beats: haki/genjutsu (raw power transcends)
const TYPE_CHART = {
  physical: {sword:1.3,kenjutsu:1.3,df:0.8,ninjutsu:0.8,genjutsu:1.0,haki:1.0,physical:1.0,taijutsu:1.0,special:0.9},
  taijutsu: {sword:1.3,kenjutsu:1.3,df:0.8,ninjutsu:0.8,genjutsu:1.0,haki:1.0,physical:1.0,taijutsu:1.0,special:0.9},
  sword:    {special:1.3,df:1.2,ninjutsu:1.2,physical:0.8,taijutsu:0.8,haki:0.9,sword:1.0,kenjutsu:1.0,genjutsu:1.0},
  kenjutsu: {special:1.3,df:1.2,ninjutsu:1.2,physical:0.8,taijutsu:0.8,haki:0.9,sword:1.0,kenjutsu:1.0,genjutsu:1.0},
  haki:     {df:1.3,ninjutsu:1.2,special:0.8,physical:1.0,taijutsu:1.0,sword:1.1,kenjutsu:1.1,haki:1.0,genjutsu:1.0},
  genjutsu: {df:1.3,ninjutsu:1.3,taijutsu:1.2,physical:1.2,special:0.8,haki:0.8,genjutsu:1.0,sword:1.0,kenjutsu:1.0},
  df:       {physical:1.3,taijutsu:1.3,haki:0.8,genjutsu:0.8,sword:0.9,kenjutsu:0.9,df:1.0,ninjutsu:1.0,special:1.0},
  ninjutsu: {physical:1.3,taijutsu:1.3,haki:0.8,genjutsu:0.8,sword:0.9,kenjutsu:0.9,df:1.0,ninjutsu:1.0,special:1.0},
  special:  {haki:1.2,genjutsu:1.2,sword:0.8,kenjutsu:0.8,physical:1.1,taijutsu:1.1,df:1.0,ninjutsu:1.0,special:1.0}
};

function getTypeMultiplier(moveType, defenderMoves) {
  // Defender's "type" is based on their most-used move type
  if(!defenderMoves||!defenderMoves.length) return 1.0;
  const defType = defenderMoves[0].type; // Primary type
  const chart = TYPE_CHART[moveType];
  return chart ? (chart[defType] || 1.0) : 1.0;
}

// ---- SOUND EFFECTS (Web Audio API) ----
let audioCtx = null;
function initAudio() { if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }

function playSound(type) {
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.value = 0.15;

    if(type === 'hit') {
      osc.type = 'sawtooth'; osc.frequency.value = 200;
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.start(); osc.stop(audioCtx.currentTime + 0.15);
    } else if(type === 'crit') {
      osc.type = 'square'; osc.frequency.value = 400;
      gain.gain.value = 0.2;
      osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.start(); osc.stop(audioCtx.currentTime + 0.25);
    } else if(type === 'faint') {
      osc.type = 'sine'; osc.frequency.value = 500;
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.start(); osc.stop(audioCtx.currentTime + 0.5);
    } else if(type === 'supereffective') {
      osc.type = 'triangle'; osc.frequency.value = 600;
      gain.gain.value = 0.2;
      osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    } else if(type === 'miss') {
      osc.type = 'sine'; osc.frequency.value = 300;
      osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    } else if(type === 'heal') {
      osc.type = 'sine'; osc.frequency.value = 400;
      osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.start(); osc.stop(audioCtx.currentTime + 0.4);
    } else if(type === 'win') {
      osc.type = 'square'; osc.frequency.value = 523;
      gain.gain.value = 0.12;
      setTimeout(() => { try{const o2=audioCtx.createOscillator();const g2=audioCtx.createGain();o2.connect(g2);g2.connect(audioCtx.destination);o2.type='square';o2.frequency.value=659;g2.gain.value=0.12;g2.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+0.3);o2.start();o2.stop(audioCtx.currentTime+0.3);}catch(e){} }, 150);
      setTimeout(() => { try{const o3=audioCtx.createOscillator();const g3=audioCtx.createGain();o3.connect(g3);g3.connect(audioCtx.destination);o3.type='square';o3.frequency.value=784;g3.gain.value=0.15;g3.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+0.5);o3.start();o3.stop(audioCtx.currentTime+0.5);}catch(e){} }, 300);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    }
  } catch(e) {}
}

// ---- SCREEN SHAKE ----
function shakeScreen(intensity) {
  const arena = document.getElementById('battleArena');
  if(!arena) return;
  arena.style.animation = 'none';
  arena.offsetHeight; // reflow
  arena.style.animation = intensity === 'big'
    ? 'bigShake 0.4s ease' : 'smallShake 0.2s ease';
  setTimeout(() => arena.style.animation = 'none', 500);
}


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
  // Type effectiveness
  const typeMult=getTypeMultiplier(move.type, def._moves||[]);
  let dmg=Math.floor(base*variance*spdBonus*typeMult);
  // Crit: 6.25% chance, 1.5x
  const crit=Math.random()<0.0625;
  if(crit) dmg=Math.floor(dmg*1.5);
  return {dmg:Math.max(1,dmg),crit,typeMult};
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
    this._moves=this.moves; // ref for type chart
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
      this.addLog(`${atk.name} used ${move.name}... Miss!`);playSound('miss');return;
    }
    const {dmg,crit,typeMult}=calcDamage(atk,def,move);
    def.hp=Math.max(0,def.hp-dmg);
    let msg=`${atk.name} used ${move.name}! ${dmg} dmg!`;
    if(typeMult>1.1){msg+=` Super effective!`;playSound('supereffective');}
    else if(typeMult<0.9){msg+=` Not very effective...`;}
    if(crit){msg+=` Critical hit!`;playSound('crit');shakeScreen('big');}
    else{playSound('hit');shakeScreen('small');}
    this.addLog(msg);
    if(def.hp<=0){def.fainted=true;this.addLog(`${def.name} fainted!`);playSound('faint');shakeScreen('big');}
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
      this.addLog(`${atk.name} recovered ${heal} HP!`);playSound('heal');
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
  let pool=typeof globalAnimeFilter!=='undefined'&&globalAnimeFilter!=='both'?ALL_CHARS.filter(c=>c.anime===globalAnimeFilter):[...ALL_CHARS];
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
  currentBet=0;
  renderBattleSetup();
}

function renderBattleSetup(){
  const grid=document.getElementById('battleTeamGrid');
  let unlocked=ALL_CHARS.filter(c=>isUnlocked(c.id));
  if(typeof globalAnimeFilter!=='undefined'&&globalAnimeFilter!=='both') unlocked=unlocked.filter(c=>c.anime===globalAnimeFilter);

  // Show coin balance at top
  const coinEl = document.getElementById('setupCoins');
  if(coinEl) coinEl.textContent = saveData.coins.toLocaleString();

  grid.innerHTML=unlocked.map(c=>{
    const sel=selectedBattleTeam.includes(c.id);
    const lvl = getUpgradeLevel(c.id);
    const lvlTag = lvl > 0 ? `<div class="bt-char-lvl">Lv.${lvl}</div>` : '';
    return `<div class="bt-char ${sel?'bt-selected':''}" onclick="toggleBattleChar('${c.id}')">
      <img src="${CHAR_IMGS[c.id]||'images/'+c.id+'.jpg'}" alt="${c.name}">
      <div class="bt-char-name">${c.name}</div>
      <div class="bt-char-tier tier-${c.tier.replace('+','p')}">${c.tier}</div>
      ${lvlTag}
    </div>`;
  }).join('');
  document.getElementById('battleTeamCount').textContent=`${selectedBattleTeam.length}/3`;
  document.getElementById('btnBattleStart').disabled=selectedBattleTeam.length!==3;

  // Difficulty buttons
  document.querySelectorAll('.diff-btn').forEach(b=>{
    b.classList.toggle('diff-active',b.dataset.diff===selectedDifficulty);
  });

  // Bet buttons
  const betRow = document.getElementById('betRow');
  if(betRow) {
    betRow.innerHTML = BET_OPTIONS.map(amt => {
      const canAfford = amt <= saveData.coins;
      const selected = currentBet === amt;
      return `<button class="bet-btn ${selected?'bet-active':''} ${!canAfford&&amt>0?'bet-disabled':''}"
        onclick="${canAfford?`setBet(${amt})`:''}" ${!canAfford&&amt>0?'disabled':''}>
        ${amt === 0 ? 'NONE' : amt.toLocaleString()}
      </button>`;
    }).join('');
  }

  // Show potential winnings
  const potentialEl = document.getElementById('betPotential');
  if(potentialEl) {
    const baseReward = DIFF_REWARDS[selectedDifficulty] + DIFF_BONUS_WIN[selectedDifficulty];
    const betWin = currentBet > 0 ? Math.floor(currentBet * (selectedDifficulty==='easy'?1.5:selectedDifficulty==='medium'?2:3)) : 0;
    potentialEl.textContent = currentBet > 0
      ? `Win: +${baseReward} base + ${betWin} bet payout = ${baseReward+betWin} total`
      : `Win: +${baseReward} coins`;
  }
}

function toggleBattleChar(id){
  const idx=selectedBattleTeam.indexOf(id);
  if(idx>=0) selectedBattleTeam.splice(idx,1);
  else if(selectedBattleTeam.length<3) selectedBattleTeam.push(id);
  renderBattleSetup();
}

function setDifficulty(d){selectedDifficulty=d;renderBattleSetup();}

let currentBet = 0;
const BET_OPTIONS = [0, 100, 250, 500, 1000, 2500];

function setBet(amount) {
  if(amount > saveData.coins) return;
  currentBet = amount;
  renderBattleSetup();
}

function startBattleFight(){
  if(selectedBattleTeam.length!==3) return;
  if(currentBet > saveData.coins) { currentBet = 0; }
  const pTeam=selectedBattleTeam.map(id=>ALL_CHARS.find(c=>c.id===id));
  const eTeam=aiSelectTeam(selectedDifficulty);
  currentBattle=new Battle(pTeam,eTeam,selectedDifficulty);
  currentBattle.bet = currentBet;
  // Deduct bet upfront
  if(currentBet > 0) { saveData.coins -= currentBet; saveSave(); }
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
    const bet = b.bet || 0;
    const betMult = b.diff==='easy'?1.5:b.diff==='medium'?2:3;
    const betWin = b.phase==='won' ? Math.floor(bet * betMult) : 0;
    if(b.phase==='won'){saveData.wins++;addCoins(reward+bonus+betWin);playSound('win');}
    else{saveData.losses++;saveSave();}

    let rewardHTML = '';
    if(b.phase==='won') {
      rewardHTML = `<div class="reward-breakdown">
        <div class="reward-line">Base reward: +${reward+bonus}</div>
        ${betWin > 0 ? `<div class="reward-line reward-bet">Bet payout (${betMult}x): +${betWin}</div>` : ''}
        <div class="reward-total">Total: +${reward+bonus+betWin} coins</div>
      </div>`;
    } else if(bet > 0) {
      rewardHTML = `<div class="reward-breakdown loss"><div class="reward-line">Bet lost: -${bet} coins</div></div>`;
    }

    actDiv.innerHTML=`<div class="battle-result ${b.phase}">
      <h2>${b.phase==='won'?'VICTORY!':'DEFEAT'}</h2>
      ${rewardHTML}
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
    return `<div class="coll-card ${unlocked?'coll-unlocked':'coll-locked'}" onclick="${unlocked?`showCharDetail('${c.id}')`:(canAfford?`tryUnlock('${c.id}')`:'')}">
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


// ===== CHARACTER DETAIL PAGE =====
function showCharDetail(id) {
  const ch = ALL_CHARS.find(c => c.id === id);
  if(!ch) return;
  const moves = BATTLE_MOVES[id] || [];
  const unlocked = isUnlocked(id);
  const upgrades = getCharUpgrades(id);
  const currentLevel = getUpgradeLevel(id);
  const boosts = getUpgradeBoosts(id);
  const maxHP = calcMaxHP(ch);
  const upgLabel = currentLevel > 0 ? upgrades[currentLevel-1].label : 'Base Form';

  // Stat bar helper - shows base + boost
  function statBar(val, boost, max, color) {
    const basePct = Math.min(100, val/max*100);
    const boostPct = Math.min(100, (val+boost)/max*100);
    return `<div class="stat-bar-bg">
      <div class="stat-bar-fill" style="width:${boostPct}%;background:${color};opacity:0.4"></div>
      <div class="stat-bar-fill stat-bar-base" style="width:${basePct}%;background:${color}"></div>
    </div>`;
  }

  const modal = document.getElementById('charDetailModal');
  modal.innerHTML = `
    <div class="detail-card">
      <button class="detail-close" onclick="closeCharDetail()">✕</button>
      <div class="detail-hero">
        <img src="${CHAR_IMGS[id]||'images/'+id+'.jpg'}" class="detail-hero-img ${unlocked?'':'coll-silhouette'}">
        <div class="detail-hero-overlay">
          <div class="detail-tier tier-${ch.tier.replace('+','p')}">${ch.tier}</div>
          <div class="detail-hero-info">
            <div class="detail-name">${ch.name}</div>
            <div class="detail-title">${ch.title||''}</div>
            <div class="detail-anime-tag">${ch.anime==='onepiece'?'☠️ One Piece':'🍥 Naruto'}</div>
          </div>
        </div>
      </div>
      ${unlocked && currentLevel > 0 ? `<div class="detail-form-tag">${upgLabel}</div>` : ''}
      <div class="detail-quick-stats">
        <div class="dqs"><span class="dqs-val">${maxHP}</span><span class="dqs-lbl">HP</span></div>
        <div class="dqs"><span class="dqs-val">${ch.atk}${boosts.atk?`<small>+${boosts.atk}</small>`:''}</span><span class="dqs-lbl">ATK</span></div>
        <div class="dqs"><span class="dqs-val">${ch.def}${boosts.def?`<small>+${boosts.def}</small>`:''}</span><span class="dqs-lbl">DEF</span></div>
        <div class="dqs"><span class="dqs-val">${ch.spd}${boosts.spd?`<small>+${boosts.spd}</small>`:''}</span><span class="dqs-lbl">SPD</span></div>
      </div>
      <div class="detail-stats">
        <div class="stat-row"><span class="stat-label">ATK</span><span class="stat-val">${ch.atk}${boosts.atk?`<span class="stat-boost">+${boosts.atk}</span>`:''}</span>${statBar(ch.atk,boosts.atk,100,'#f44336')}</div>
        <div class="stat-row"><span class="stat-label">DEF</span><span class="stat-val">${ch.def}${boosts.def?`<span class="stat-boost">+${boosts.def}</span>`:''}</span>${statBar(ch.def,boosts.def,100,'#2196F3')}</div>
        <div class="stat-row"><span class="stat-label">SPD</span><span class="stat-val">${ch.spd}${boosts.spd?`<span class="stat-boost">+${boosts.spd}</span>`:''}</span>${statBar(ch.spd,boosts.spd,100,'#4CAF50')}</div>
        <div class="stat-row"><span class="stat-label">HAKI</span><span class="stat-val">${ch.haki||0}</span>${statBar(ch.haki||0,0,100,'#9C27B0')}</div>
        <div class="stat-row"><span class="stat-label">${ch.anime==='onepiece'?'DF':'JUTSU'}</span><span class="stat-val">${ch.df||0}</span>${statBar(ch.df||0,0,100,'#FF9800')}</div>
      </div>
      <div class="detail-section-title">MOVES</div>
      <div class="detail-moves">${moves.map(m => `
        <div class="detail-move move-${m.type}">
          <div class="dm-top">
            <span class="dm-name">${m.name}</span>
            <span class="dm-pwr">PWR ${m.power}</span>
          </div>
          <div class="dm-stats">
            <span class="dm-type">${m.type}</span>
            <span>Acc ${m.acc}%</span>
            <span>PP ${m.pp}</span>
            ${m.effect?`<span class="dm-effect">${m.effect}</span>`:''}
          </div>
        </div>
      `).join('')}</div>
      ${unlocked ? renderUpgradeSection(id, ch, currentLevel, upgrades) : `
        <div class="detail-locked-msg">
          <div>🔒 Unlock this character to use in Battle Mode</div>
          <div class="detail-cost">Cost: ${TIER_COSTS[ch.tier]||800} coins</div>
        </div>
      `}
    </div>
  `;
  modal.style.display = 'flex';
}

function closeCharDetail() {
  document.getElementById('charDetailModal').style.display = 'none';
}

// ===== UPGRADE / TRANSFORMATION SYSTEM =====
// Upgrades are per-character. Each has up to 3 tiers with lore-accurate names.
// Stored in localStorage. Only affects battle mode.

const UPGRADE_KEY = 'animewar_upgrades';
let upgradeData = loadUpgrades();

function loadUpgrades(){
  try{const s=localStorage.getItem(UPGRADE_KEY);if(s) return JSON.parse(s);}catch(e){}
  return {};
}
function saveUpgrades(){localStorage.setItem(UPGRADE_KEY,JSON.stringify(upgradeData));}
function getUpgradeLevel(id){return upgradeData[id]||0;}

// Generic upgrade tiers per tier rank
const UPGRADE_TEMPLATES = {
  'S+': [
    {cost:2000,atkBoost:5,defBoost:5,spdBoost:5,label:'Awakened'},
    {cost:4000,atkBoost:10,defBoost:8,spdBoost:8,label:'Transcended'},
    {cost:8000,atkBoost:15,defBoost:12,spdBoost:12,label:'Ultimate Form'}
  ],
  'S': [
    {cost:1500,atkBoost:5,defBoost:4,spdBoost:4,label:'Awakened'},
    {cost:3000,atkBoost:10,defBoost:8,spdBoost:7,label:'Ascended'},
    {cost:6000,atkBoost:14,defBoost:11,spdBoost:10,label:'Final Form'}
  ],
  'A': [
    {cost:1000,atkBoost:5,defBoost:4,spdBoost:4,label:'Enhanced'},
    {cost:2000,atkBoost:9,defBoost:7,spdBoost:6,label:'Awakened'},
    {cost:4000,atkBoost:13,defBoost:10,spdBoost:9,label:'Peak Form'}
  ],
  'B': [
    {cost:600,atkBoost:4,defBoost:3,spdBoost:3,label:'Trained'},
    {cost:1200,atkBoost:8,defBoost:6,spdBoost:5,label:'Enhanced'},
    {cost:2500,atkBoost:12,defBoost:9,spdBoost:8,label:'Awakened'}
  ],
  'C': [
    {cost:300,atkBoost:3,defBoost:2,spdBoost:2,label:'Trained'},
    {cost:700,atkBoost:6,defBoost:5,spdBoost:4,label:'Enhanced'},
    {cost:1500,atkBoost:10,defBoost:8,spdBoost:7,label:'Peak Form'}
  ]
};

// Lore-accurate transformation names for key characters
const CHAR_UPGRADES = {
  op1:[{cost:2000,label:'Gear Second'},{cost:4000,label:'Gear Fourth'},{cost:8000,label:'Gear 5 - Sun God Nika'}],
  op2:[{cost:2000,label:'Ashura Form'},{cost:4000,label:'King of Hell'},{cost:8000,label:'World\'s Greatest Swordsman'}],
  op3:[{cost:2000,label:'Diable Jambe'},{cost:4000,label:'Ifrit Jambe'},{cost:8000,label:'Germa Awakening'}],
  op11:[{cost:1500,label:'Room Mastery'},{cost:3000,label:'K-Room'},{cost:6000,label:'Awakening'}],
  op13:[{cost:2000,label:'Hybrid Form'},{cost:4000,label:'Flame Dragon'},{cost:8000,label:'Flaming Drum Dragon'}],
  op19:[{cost:2000,label:'Yami Yami Mastery'},{cost:4000,label:'Gura Gura Power'},{cost:8000,label:'Double Devil Fruit Awakening'}],
  op20:[{cost:2000,label:'Conqueror\'s Coating'},{cost:4000,label:'Divine Departure'},{cost:8000,label:'Film of Flames'}],
  op33:[{cost:2000,label:'Roger\'s Haki'},{cost:4000,label:'Pirate King\'s Will'},{cost:8000,label:'King of the Pirates'}],
  op47:[{cost:1500,label:'Oden Two-Sword'},{cost:3000,label:'Togen Totsuka'},{cost:6000,label:'Oden\'s Will'}],
  nr1:[{cost:2000,label:'Sage Mode'},{cost:4000,label:'Kurama Chakra Mode'},{cost:8000,label:'Baryon Mode'}],
  nr2:[{cost:2000,label:'Mangekyo Sharingan'},{cost:4000,label:'Eternal Mangekyo'},{cost:8000,label:'Rinnegan Awakening'}],
  nr4:[{cost:1500,label:'Mangekyo Sharingan'},{cost:3000,label:'Kamui Mastery'},{cost:6000,label:'Double Mangekyo Susanoo'}],
  nr5:[{cost:1500,label:'Mangekyo Awakened'},{cost:3000,label:'Susanoo'},{cost:6000,label:'Totsuka Blade + Yata Mirror'}],
  nr6:[{cost:2000,label:'Eternal Mangekyo'},{cost:4000,label:'Rinnegan'},{cost:8000,label:'Six Paths Madara'}],
  nr7:[{cost:2000,label:'Sage Mode'},{cost:4000,label:'Wood Golem'},{cost:8000,label:'Shin Susenju'}],
  nr8:[{cost:2000,label:'Mangekyo Kamui'},{cost:4000,label:'Rinnegan'},{cost:8000,label:'Ten Tails Jinchuriki'}],
  nr9:[{cost:1500,label:'Six Paths of Pain'},{cost:3000,label:'Chibaku Tensei'},{cost:6000,label:'Planetary Devastation'}],
  nr14:[{cost:1500,label:'Six Gates'},{cost:3000,label:'Seventh Gate'},{cost:6000,label:'Eight Gates - Night Guy'}],
  nr33:[{cost:2000,label:'Byakugan Mastery'},{cost:4000,label:'Rinne Sharingan'},{cost:8000,label:'Infinite Tsukuyomi'}],
};

function getCharUpgrades(id) {
  if(CHAR_UPGRADES[id]) {
    const base = UPGRADE_TEMPLATES[ALL_CHARS.find(c=>c.id===id)?.tier||'B'] || UPGRADE_TEMPLATES['B'];
    return CHAR_UPGRADES[id].map((u,i) => ({...base[i], ...u}));
  }
  const ch = ALL_CHARS.find(c=>c.id===id);
  return UPGRADE_TEMPLATES[ch?.tier||'B'] || UPGRADE_TEMPLATES['B'];
}

function getUpgradeBoosts(id) {
  const level = getUpgradeLevel(id);
  if(level === 0) return {atk:0,def:0,spd:0};
  const upgrades = getCharUpgrades(id);
  const u = upgrades[level-1];
  return {atk:u.atkBoost||0, def:u.defBoost||0, spd:u.spdBoost||0};
}

function purchaseUpgrade(id) {
  const level = getUpgradeLevel(id);
  const upgrades = getCharUpgrades(id);
  if(level >= upgrades.length) return false;
  const next = upgrades[level];
  if(saveData.coins < next.cost) return false;
  saveData.coins -= next.cost;
  upgradeData[id] = level + 1;
  saveSave(); saveUpgrades();
  showCharDetail(id); // refresh
  if(typeof renderCollection === 'function') renderCollection();
  return true;
}

function renderUpgradeSection(id, ch, currentLevel, upgrades) {
  const boosts = getUpgradeBoosts(id);
  const totalBoostStr = currentLevel > 0 ? `<div class="upg-current-boost">Current Boost: +${boosts.atk} ATK, +${boosts.def} DEF, +${boosts.spd} SPD</div>` : '';

  let html = `<div class="upgrade-section">
    <div class="upgrade-header">
      <div class="upgrade-title">POWER UP</div>
      <div class="upgrade-subtitle">Boost stats for Battle Mode</div>
    </div>
    ${totalBoostStr}
    <div class="upgrade-track">`;

  upgrades.forEach((u, i) => {
    const owned = currentLevel > i;
    const available = currentLevel === i;
    const canAfford = saveData.coins >= u.cost;
    const statusClass = owned ? 'upg-owned' : available ? 'upg-next' : 'upg-future';
    const statusIcon = owned ? '✓' : available ? (i+1) : (i+1);

    html += `<div class="upg-step ${statusClass}">
      <div class="upg-step-dot">${statusIcon}</div>
      <div class="upg-step-body">
        <div class="upg-step-name">${u.label}</div>
        <div class="upg-step-stats">
          <span class="upg-stat upg-atk">+${u.atkBoost} ATK</span>
          <span class="upg-stat upg-def">+${u.defBoost} DEF</span>
          <span class="upg-stat upg-spd">+${u.spdBoost} SPD</span>
        </div>
        ${owned ? '<div class="upg-step-badge">UNLOCKED</div>' : ''}
        ${available ? `<button class="upg-buy-btn ${canAfford?'upg-can-buy':'upg-no-buy'}" onclick="purchaseUpgrade('${id}')" ${canAfford?'':'disabled'}>${canAfford ? '⬆ UPGRADE' : 'Need'} ${u.cost.toLocaleString()} coins</button>` : ''}
        ${!owned && !available ? `<div class="upg-step-cost">${u.cost.toLocaleString()} coins</div>` : ''}
      </div>
    </div>`;
  });

  html += `</div></div>`;
  return html;
}

// ===== Apply upgrades to BattleChar (battle mode only) =====
const _origBattleCharInit = BattleChar.prototype.constructor;
const _origInitBattleChar = Battle.prototype.pTeam; // just need to override BattleChar
// Override BattleChar to apply upgrades
const OrigBattleChar = BattleChar;

// Patch: apply upgrade boosts in battle mode
(function() {
  const origCalcMaxHP = calcMaxHP;
  window.calcMaxHP = function(ch) {
    // In battle mode, apply upgrade boosts
    const boosts = getUpgradeBoosts(ch.id);
    const boosted = {...ch, def: ch.def + boosts.def};
    return origCalcMaxHP(boosted);
  };

  const origCalcDamage = calcDamage;
  window.calcDamage = function(atk, def, move) {
    const atkBoosts = getUpgradeBoosts(atk.id);
    const defBoosts = getUpgradeBoosts(def.id);
    const boostedAtk = {...atk, atk: atk.atk + atkBoosts.atk, spd: atk.spd + atkBoosts.spd};
    const boostedDef = {...def, def: def.def + defBoosts.def, spd: def.spd + defBoosts.spd};
    return origCalcDamage(boostedAtk, boostedDef, move);
  };
})();
