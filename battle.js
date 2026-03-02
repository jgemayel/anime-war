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
  // Attack stat depends on move type
  const mt=move.type;
  let atkStat;
  if(mt==='physical'||mt==='taijutsu') atkStat=atk.atk;
  else if(mt==='sword'||mt==='kenjutsu') atkStat=atk.haki>0?Math.round((atk.atk+atk.haki)/2):atk.atk;
  else if(mt==='haki'||mt==='genjutsu') atkStat=atk.haki||atk.atk;
  else if(mt==='df'||mt==='ninjutsu') atkStat=(atk.df||0)||atk.atk;
  else atkStat=Math.max(atk.atk, atk.df||0, atk.haki||0); // special
  // Defense stat varies by incoming type
  let defStat=def.def;
  if(mt==='sword'||mt==='kenjutsu') defStat=Math.round((def.def+(def.spd||0))/2);
  else if(mt==='haki'||mt==='genjutsu') defStat=Math.round((def.def+(def.haki||0))/2);
  else if(mt==='df'||mt==='ninjutsu') defStat=Math.round((def.def+(def.df||0))/2);
  const base=((move.power*(atkStat/50))*(50/(50+defStat)))+2;
  const variance=0.85+Math.random()*0.15;
  // Speed bonus scales with gap (max 12% at +40 spd diff)
  const spdDiff=atk.spd-def.spd;
  const spdBonus=spdDiff>0?1+Math.min(0.12,spdDiff*0.003):1.0;
  const typeMult=getTypeMultiplier(move.type, def._moves||[]);
  let dmg=Math.floor(base*variance*spdBonus*typeMult);
  // Crit: base 6.25%, +0.1% per speed point above opponent
  const critRate=Math.min(0.15,0.0625+(spdDiff>0?spdDiff*0.001:0));
  const crit=Math.random()<critRate;
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
    // Get defender's primary type for effectiveness display
    const defMoves = e._moves || BATTLE_MOVES[e.id] || [];
    const defType = defMoves.length > 0 ? defMoves[0].type : null;
    actDiv.innerHTML=`<div class="move-grid">${p.moves.map((m,i)=>{
      const missRate = 100 - m.acc;
      const typeMult = defType && TYPE_CHART[m.type] ? (TYPE_CHART[m.type][defType]||1.0) : 1.0;
      const effClass = typeMult > 1.1 ? 'eff-super' : (typeMult < 0.9 ? 'eff-weak' : 'eff-neutral');
      const effLabel = typeMult > 1.1 ? 'Super Effective' : (typeMult < 0.9 ? 'Not Effective' : '');
      return `<button class="move-btn move-${m.type} ${effClass}" onclick="doPlayerMove(${i})" ${m.curPP<=0?'disabled':''}>
        <span class="move-name">${m.name}</span>
        <span class="move-info">Pwr:${m.power} | PP:${m.curPP}/${m.pp}</span>
        <span class="move-meta"><span class="move-acc">Miss:${missRate}%</span>${effLabel?`<span class="move-eff ${effClass}">${effLabel}</span>`:''}</span>
      </button>`;
    }).join('')}</div>
    <div class="battle-bottom-btns">
      <button class="switch-btn" onclick="showSwitchMenu()">Switch</button>
      <button class="forfeit-btn" onclick="quitBattle()">Quit</button>
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
    if(!b._resultHandled) {
      b._resultHandled = true;
      if(b.phase==='won'){saveData.wins++;addCoins(reward+bonus+betWin);playSound('win');}
      else{saveData.losses++;saveSave();}
    }

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
  // Bet is already deducted at start, so just lose it
  if(currentBattle && currentBattle.bet > 0) {
    saveData.losses++;
    saveSave();
  }
  currentBattle=null;
  closeBattle();
}

function closeBattle(){
  document.getElementById('battleArena').style.display='none';
  document.getElementById('battleSetup').style.display='none';
  document.getElementById('title-screen').style.display='flex';
  currentBattle=null;
  currentBet=0;
  // Update menu stats
  if(typeof updateMenuStats === 'function') updateMenuStats();
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
  if(typeof updateMenuStats === 'function') updateMenuStats();
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
        <div class="dqs"><span class="dqs-val">${(ch.haki||0)}${boosts.haki?`<small>+${boosts.haki}</small>`:''}</span><span class="dqs-lbl">HAKI</span></div>
      </div>
      <div class="detail-stats">
        <div class="stat-row"><span class="stat-label">ATK</span><span class="stat-val">${ch.atk}${boosts.atk?`<span class="stat-boost">+${boosts.atk}</span>`:''}</span>${statBar(ch.atk,boosts.atk,120,'#f44336')}</div>
        <div class="stat-row"><span class="stat-label">DEF</span><span class="stat-val">${ch.def}${boosts.def?`<span class="stat-boost">+${boosts.def}</span>`:''}</span>${statBar(ch.def,boosts.def,120,'#2196F3')}</div>
        <div class="stat-row"><span class="stat-label">SPD</span><span class="stat-val">${ch.spd}${boosts.spd?`<span class="stat-boost">+${boosts.spd}</span>`:''}</span>${statBar(ch.spd,boosts.spd,120,'#4CAF50')}</div>
        <div class="stat-row"><span class="stat-label">HAKI</span><span class="stat-val">${ch.haki||0}${boosts.haki?`<span class="stat-boost">+${boosts.haki}</span>`:''}</span>${statBar(ch.haki||0,boosts.haki,120,'#9C27B0')}</div>
        <div class="stat-row"><span class="stat-label">${ch.anime==='onepiece'?'DF':'JUTSU'}</span><span class="stat-val">${ch.df||0}${boosts.df?`<span class="stat-boost">+${boosts.df}</span>`:''}</span>${statBar(ch.df||0,boosts.df,120,'#FF9800')}</div>
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
  // Click outside to close
  modal.onclick = function(e) {
    if(e.target === modal) closeCharDetail();
  };
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

const PER_CHAR_BOOSTS = {
  'nr1':[{c:2500,atk:4,def:1,spd:1,haki:1,df:5},{c:5000,atk:9,def:1,spd:1,haki:3,df:12},{c:10000,atk:14,def:1,spd:3,haki:5,df:19}],
  'nr10':[{c:1200,atk:4,def:1,spd:1,haki:2,df:1},{c:2500,atk:10,def:1,spd:1,haki:5,df:2},{c:5000,atk:15,def:2,spd:1,haki:8,df:4}],
  'nr100':[{c:2000,atk:3,def:1,spd:1,haki:1,df:4},{c:4000,atk:6,def:3,spd:1,haki:4,df:8},{c:8000,atk:10,def:4,spd:2,haki:7,df:13}],
  'nr11':[{c:1200,atk:2,def:4,spd:1,haki:1,df:1},{c:2500,atk:6,def:9,spd:1,haki:1,df:2},{c:5000,atk:10,def:13,spd:1,haki:2,df:4}],
  'nr12':[{c:1200,atk:3,def:1,spd:1,haki:1,df:3},{c:2500,atk:5,def:2,spd:1,haki:4,df:7},{c:5000,atk:8,def:4,spd:2,haki:6,df:10}],
  'nr13':[{c:2000,atk:3,def:1,spd:4,haki:1,df:1},{c:4000,atk:7,def:1,spd:10,haki:3,df:1},{c:8000,atk:12,def:1,spd:16,haki:4,df:3}],
  'nr14':[{c:2000,atk:5,def:1,spd:3,haki:1},{c:4000,atk:10,def:2,spd:7,haki:3},{c:8000,atk:17,def:3,spd:12,haki:4}],
  'nr15':[{c:700,atk:2,def:1,spd:4,haki:1},{c:1500,atk:5,def:2,spd:7,haki:2},{c:3000,atk:9,def:3,spd:12,haki:1}],
  'nr16':[{c:1200,atk:1,def:4,spd:1,haki:1,df:2},{c:2500,atk:2,def:10,spd:1,haki:1,df:5},{c:5000,atk:4,def:15,spd:1,haki:2,df:8}],
  'nr17':[{c:1200,atk:2,def:1,spd:1,haki:1,df:4},{c:2500,atk:6,def:2,spd:1,haki:1,df:9},{c:5000,atk:10,def:4,spd:2,haki:1,df:13}],
  'nr18':[{c:700,atk:1,def:1,spd:4,haki:2},{c:1500,atk:2,def:2,spd:8,haki:4},{c:3000,atk:1,def:4,spd:13,haki:7}],
  'nr19':[{c:400,atk:1,def:1,spd:1,haki:4},{c:800,atk:1,def:2,spd:4,haki:7},{c:1800,atk:2,def:3,spd:6,haki:11}],
  'nr2':[{c:2500,atk:3,def:1,spd:1,haki:6,df:1},{c:5000,atk:7,def:1,spd:1,haki:13,df:4},{c:10000,atk:11,def:1,spd:3,haki:21,df:6}],
  'nr20':[{c:700,atk:1,def:1,spd:1,haki:4,df:1},{c:1500,atk:1,def:1,spd:2,haki:7,df:5},{c:3000,atk:1,def:2,spd:3,haki:11,df:8}],
  'nr21':[{c:1200,atk:3,def:1,spd:1,haki:1,df:3},{c:2500,atk:5,def:1,spd:2,haki:4,df:7},{c:5000,atk:8,def:2,spd:4,haki:6,df:10}],
  'nr22':[{c:700,atk:1,def:1,spd:1,haki:1,df:4},{c:1500,atk:5,def:1,spd:2,haki:1,df:7},{c:3000,atk:8,def:1,spd:3,haki:2,df:11}],
  'nr23':[{c:700,atk:2,def:1,spd:1,haki:1,df:3},{c:1500,atk:4,def:2,spd:1,haki:3,df:6},{c:3000,atk:7,def:3,spd:1,haki:5,df:9}],
  'nr24':[{c:1200,atk:3,def:1,spd:1,haki:1,df:3},{c:2500,atk:7,def:4,spd:2,haki:1,df:5},{c:5000,atk:10,def:6,spd:4,haki:2,df:8}],
  'nr25':[{c:700,atk:1,def:1,spd:1,haki:1,df:4},{c:1500,atk:5,def:1,spd:2,haki:1,df:7},{c:3000,atk:8,def:2,spd:3,haki:1,df:11}],
  'nr26':[{c:700,atk:1,def:4,spd:1,haki:1,df:1},{c:1500,atk:5,def:7,spd:1,haki:1,df:2},{c:3000,atk:8,def:11,spd:1,haki:2,df:3}],
  'nr27':[{c:700,atk:1,def:1,spd:1,haki:2,df:3},{c:1500,atk:3,def:1,spd:2,haki:4,df:6},{c:3000,atk:5,def:1,spd:3,haki:7,df:9}],
  'nr28':[{c:700,atk:4,def:1,spd:1,haki:1,df:1},{c:1500,atk:8,def:2,spd:4,haki:1,df:1},{c:3000,atk:12,def:4,spd:6,haki:2,df:1}],
  'nr29':[{c:400,atk:1,def:1,spd:3,haki:1,df:1},{c:800,atk:1,def:1,spd:6,haki:1,df:5},{c:1800,atk:3,def:1,spd:10,haki:1,df:7}],
  'nr3':[{c:700,atk:3,def:2,spd:1,haki:1,df:1},{c:1500,atk:6,def:4,spd:2,haki:1,df:3},{c:3000,atk:9,def:7,spd:3,haki:1,df:5}],
  'nr30':[{c:2000,atk:3,def:1,spd:1,haki:4,df:1},{c:4000,atk:7,def:1,spd:1,haki:10,df:3},{c:8000,atk:12,def:1,spd:3,haki:16,df:4}],
  'nr31':[{c:1200,atk:3,def:1,spd:1,haki:3,df:1},{c:2500,atk:5,def:2,spd:1,haki:7,df:4},{c:5000,atk:8,def:4,spd:2,haki:10,df:6}],
  'nr32':[{c:700,atk:1,def:1,spd:1,haki:1,df:4},{c:1500,atk:2,def:1,spd:1,haki:4,df:8},{c:3000,atk:4,def:2,spd:1,haki:6,df:12}],
  'nr33':[{c:2500,atk:6,def:1,spd:1,haki:1,df:3},{c:5000,atk:13,def:4,spd:1,haki:1,df:7},{c:10000,atk:21,def:6,spd:1,haki:3,df:11}],
  'nr34':[{c:400,atk:1,def:1,spd:1,haki:1,df:3},{c:800,atk:1,def:1,spd:4,haki:1,df:7},{c:1800,atk:3,def:1,spd:6,haki:1,df:11}],
  'nr35':[{c:400,atk:1,def:1,spd:1,haki:2,df:2},{c:800,atk:1,def:1,spd:3,haki:5,df:4},{c:1800,atk:3,def:1,spd:4,haki:8,df:6}],
  'nr36':[{c:400,atk:1,def:1,spd:3,haki:1,df:1},{c:800,atk:5,def:1,spd:6,haki:1,df:1},{c:1800,atk:7,def:3,spd:10,haki:1,df:1}],
  'nr37':[{c:700,atk:4,def:1,spd:1,haki:1,df:1},{c:1500,atk:8,def:1,spd:4,haki:2,df:1},{c:3000,atk:12,def:2,spd:6,haki:4,df:1}],
  'nr38':[{c:700,atk:1,def:2,spd:1,haki:1,df:3},{c:1500,atk:3,def:4,spd:1,haki:2,df:6},{c:3000,atk:5,def:7,spd:1,haki:3,df:9}],
  'nr39':[{c:400,atk:1,def:1,spd:1,haki:1,df:3},{c:800,atk:1,def:1,spd:1,haki:4,df:7},{c:1800,atk:1,def:3,spd:1,haki:6,df:11}],
  'nr4':[{c:1200,atk:2,def:1,spd:4,haki:1,df:1},{c:2500,atk:5,def:1,spd:10,haki:2,df:1},{c:5000,atk:8,def:2,spd:15,haki:4,df:1}],
  'nr40':[{c:700,atk:4,def:1,spd:1,haki:1,df:1},{c:1500,atk:8,def:4,spd:1,haki:1,df:2},{c:3000,atk:12,def:6,spd:2,haki:1,df:4}],
  'nr41':[{c:1200,atk:1,def:1,spd:4,haki:2,df:1},{c:2500,atk:1,def:1,spd:9,haki:6,df:2},{c:5000,atk:2,def:1,spd:13,haki:10,df:4}],
  'nr42':[{c:1200,atk:3,def:2,spd:3,haki:1},{c:2500,atk:6,def:4,spd:7,haki:2},{c:5000,atk:9,def:6,spd:11,haki:4}],
  'nr43':[{c:1200,atk:1,def:1,spd:1,haki:2,df:4},{c:2500,atk:2,def:1,spd:1,haki:5,df:10},{c:5000,atk:4,def:2,spd:1,haki:8,df:15}],
  'nr44':[{c:700,atk:4,def:1,spd:1,haki:1,df:1},{c:1500,atk:8,def:1,spd:4,haki:1,df:2},{c:3000,atk:12,def:2,spd:6,haki:1,df:4}],
  'nr45':[{c:2500,atk:4,def:1,spd:1,haki:5,df:1},{c:5000,atk:9,def:1,spd:1,haki:12,df:3},{c:10000,atk:14,def:3,spd:1,haki:19,df:5}],
  'nr46':[{c:700,atk:1,def:1,spd:1,haki:1,df:4},{c:1500,atk:4,def:1,spd:1,haki:2,df:8},{c:3000,atk:6,def:2,spd:1,haki:4,df:12}],
  'nr47':[{c:2000,atk:3,def:1,spd:1,haki:1,df:4},{c:4000,atk:7,def:1,spd:1,haki:3,df:10},{c:8000,atk:12,def:1,spd:3,haki:4,df:16}],
  'nr48':[{c:2000,atk:3,def:5,spd:1,haki:1},{c:4000,atk:7,def:10,spd:3,haki:2},{c:8000,atk:12,def:17,spd:4,haki:3}],
  'nr49':[{c:1200,atk:3,def:1,spd:1,haki:1,df:3},{c:2500,atk:5,def:1,spd:2,haki:4,df:7},{c:5000,atk:8,def:2,spd:4,haki:6,df:10}],
  'nr5':[{c:2000,atk:3,def:1,spd:1,haki:4,df:1},{c:4000,atk:6,def:1,spd:3,haki:8,df:4},{c:8000,atk:10,def:2,spd:4,haki:13,df:7}],
  'nr50':[{c:1200,atk:3,def:1,spd:1,haki:1,df:3},{c:2500,atk:5,def:1,spd:2,haki:4,df:7},{c:5000,atk:8,def:2,spd:4,haki:6,df:10}],
  'nr51':[{c:1200,atk:3,def:1,spd:1,haki:1,df:3},{c:2500,atk:5,def:4,spd:2,haki:1,df:7},{c:5000,atk:8,def:6,spd:4,haki:2,df:10}],
  'nr52':[{c:700,atk:2,def:1,spd:1,haki:1,df:3},{c:1500,atk:4,def:3,spd:1,haki:2,df:6},{c:3000,atk:7,def:5,spd:1,haki:3,df:9}],
  'nr53':[{c:700,atk:1,def:1,spd:4,haki:1,df:1},{c:1500,atk:2,def:1,spd:8,haki:1,df:4},{c:3000,atk:4,def:2,spd:12,haki:1,df:6}],
  'nr54':[{c:700,atk:1,def:1,spd:1,haki:1,df:4},{c:1500,atk:5,def:2,spd:1,haki:1,df:7},{c:3000,atk:8,def:3,spd:1,haki:2,df:11}],
  'nr55':[{c:700,atk:3,def:2,spd:1,haki:1,df:1},{c:1500,atk:6,def:4,spd:2,haki:1,df:3},{c:3000,atk:9,def:7,spd:3,haki:1,df:5}],
  'nr56':[{c:700,atk:2,def:1,spd:1,haki:1,df:3},{c:1500,atk:4,def:2,spd:3,haki:1,df:6},{c:3000,atk:7,def:3,spd:5,haki:1,df:9}],
  'nr57':[{c:700,atk:1,def:1,spd:1,haki:1,df:4},{c:1500,atk:2,def:1,spd:5,haki:1,df:7},{c:3000,atk:3,def:2,spd:8,haki:1,df:11}],
  'nr58':[{c:400,atk:1,def:1,spd:1,haki:3,df:1},{c:800,atk:1,def:1,spd:1,haki:7,df:4},{c:1800,atk:1,def:1,spd:3,haki:11,df:6}],
  'nr59':[{c:400,atk:1,def:1,spd:1,haki:1,df:3},{c:800,atk:1,def:1,spd:5,haki:1,df:6},{c:1800,atk:1,def:3,spd:7,haki:1,df:10}],
  'nr6':[{c:2500,atk:5,def:1,spd:1,haki:1,df:4},{c:5000,atk:12,def:1,spd:1,haki:3,df:9},{c:10000,atk:19,def:3,spd:1,haki:5,df:14}],
  'nr60':[{c:1200,atk:3,def:1,spd:1,haki:3,df:1},{c:2500,atk:7,def:2,spd:1,haki:5,df:4},{c:5000,atk:10,def:4,spd:2,haki:8,df:6}],
  'nr61':[{c:400,atk:1,def:1,spd:1,haki:2,df:2},{c:800,atk:3,def:1,spd:1,haki:4,df:5},{c:1800,atk:4,def:1,spd:3,haki:6,df:8}],
  'nr62':[{c:400,atk:2,def:1,spd:2,haki:1,df:1},{c:800,atk:5,def:1,spd:4,haki:1,df:3},{c:1800,atk:8,def:1,spd:6,haki:3,df:4}],
  'nr63':[{c:400,atk:1,def:2,spd:1,haki:1,df:2},{c:800,atk:3,def:5,spd:1,haki:1,df:4},{c:1800,atk:4,def:8,spd:3,haki:1,df:6}],
  'nr64':[{c:400,atk:1,def:3,spd:1,haki:1,df:1},{c:800,atk:4,def:7,spd:1,haki:1,df:1},{c:1800,atk:6,def:11,spd:1,haki:1,df:3}],
  'nr65':[{c:700,atk:1,def:1,spd:1,haki:1,df:4},{c:1500,atk:4,def:1,spd:1,haki:2,df:8},{c:3000,atk:6,def:2,spd:1,haki:4,df:12}],
  'nr66':[{c:700,atk:1,def:1,spd:1,haki:4,df:1},{c:1500,atk:2,def:1,spd:1,haki:8,df:4},{c:3000,atk:4,def:2,spd:1,haki:12,df:6}],
  'nr67':[{c:700,atk:1,def:1,spd:4,haki:1,df:1},{c:1500,atk:2,def:1,spd:7,haki:1,df:5},{c:3000,atk:3,def:2,spd:11,haki:1,df:8}],
  'nr68':[{c:700,atk:4,def:1,spd:1,haki:1,df:1},{c:1500,atk:8,def:2,spd:1,haki:1,df:4},{c:3000,atk:12,def:4,spd:2,haki:1,df:6}],
  'nr69':[{c:400,atk:1,def:1,spd:1,haki:3,df:1},{c:800,atk:1,def:1,spd:1,haki:6,df:5},{c:1800,atk:1,def:1,spd:3,haki:10,df:7}],
  'nr7':[{c:2500,atk:4,def:1,spd:1,haki:1,df:5},{c:5000,atk:9,def:3,spd:1,haki:1,df:12},{c:10000,atk:14,def:5,spd:1,haki:3,df:19}],
  'nr70':[{c:1200,atk:4,def:1,spd:1,haki:1,df:2},{c:2500,atk:9,def:1,spd:2,haki:1,df:6},{c:5000,atk:13,def:1,spd:4,haki:2,df:10}],
  'nr71':[{c:400,atk:1,def:1,spd:3,haki:1,df:1},{c:800,atk:4,def:1,spd:7,haki:1,df:1},{c:1800,atk:6,def:1,spd:11,haki:3,df:1}],
  'nr72':[{c:700,atk:3,def:1,spd:2,haki:2},{c:1500,atk:6,def:2,spd:5,haki:3},{c:3000,atk:9,def:4,spd:7,haki:5}],
  'nr73':[{c:700,atk:1,def:1,spd:3,haki:1,df:2},{c:1500,atk:3,def:1,spd:6,haki:2,df:4},{c:3000,atk:5,def:1,spd:9,haki:3,df:7}],
  'nr74':[{c:400,atk:2,def:1,spd:2,haki:1,df:1},{c:800,atk:4,def:1,spd:5,haki:1,df:3},{c:1800,atk:6,def:1,spd:8,haki:3,df:4}],
  'nr75':[{c:400,atk:1,def:1,spd:1,haki:3,df:1},{c:800,atk:1,def:1,spd:1,haki:7,df:4},{c:1800,atk:1,def:1,spd:3,haki:11,df:6}],
  'nr76':[{c:400,atk:1,def:1,spd:3,haki:1,df:1},{c:800,atk:1,def:1,spd:6,haki:1,df:5},{c:1800,atk:3,def:1,spd:10,haki:1,df:7}],
  'nr77':[{c:400,atk:1,def:1,spd:2,haki:2,df:1},{c:800,atk:1,def:3,spd:4,haki:5,df:1},{c:1800,atk:1,def:4,spd:6,haki:8,df:3}],
  'nr78':[{c:700,atk:4,def:1,spd:2,haki:1},{c:1500,atk:7,def:2,spd:5,haki:2},{c:3000,atk:12,def:1,spd:9,haki:3}],
  'nr79':[{c:700,atk:1,def:2,spd:1,haki:4},{c:1500,atk:2,def:5,spd:2,haki:7},{c:3000,atk:3,def:9,spd:1,haki:12}],
  'nr8':[{c:2000,atk:3,def:1,spd:1,haki:1,df:4},{c:4000,atk:7,def:1,spd:3,haki:1,df:10},{c:8000,atk:12,def:3,spd:4,haki:1,df:16}],
  'nr80':[{c:700,atk:1,def:1,spd:1,haki:4,df:1},{c:1500,atk:2,def:1,spd:1,haki:8,df:4},{c:3000,atk:4,def:2,spd:1,haki:12,df:6}],
  'nr81':[{c:700,atk:1,def:1,spd:1,haki:1,df:4},{c:1500,atk:2,def:1,spd:5,haki:1,df:7},{c:3000,atk:3,def:1,spd:8,haki:2,df:11}],
  'nr82':[{c:400,atk:1,def:1,spd:2,haki:1,df:2},{c:800,atk:3,def:1,spd:5,haki:1,df:4},{c:1800,atk:4,def:1,spd:8,haki:3,df:6}],
  'nr83':[{c:700,atk:4,def:1,spd:2,haki:1},{c:1500,atk:8,def:2,spd:4,haki:2},{c:3000,atk:13,def:4,spd:7,haki:1}],
  'nr84':[{c:700,atk:1,def:1,spd:1,haki:1,df:4},{c:1500,atk:4,def:1,spd:2,haki:1,df:8},{c:3000,atk:6,def:1,spd:4,haki:2,df:12}],
  'nr85':[{c:700,atk:3,def:1,spd:1,haki:1,df:2},{c:1500,atk:6,def:3,spd:2,haki:1,df:4},{c:3000,atk:9,def:5,spd:3,haki:1,df:7}],
  'nr86':[{c:1200,atk:3,def:1,spd:1,haki:1,df:3},{c:2500,atk:7,def:4,spd:2,haki:1,df:5},{c:5000,atk:10,def:6,spd:4,haki:2,df:8}],
  'nr87':[{c:700,atk:4,def:1,spd:1,haki:1,df:1},{c:1500,atk:7,def:1,spd:5,haki:1,df:2},{c:3000,atk:11,def:2,spd:8,haki:1,df:3}],
  'nr88':[{c:400,atk:1,def:1,spd:1,haki:1,df:3},{c:800,atk:1,def:1,spd:5,haki:1,df:6},{c:1800,atk:1,def:1,spd:7,haki:3,df:10}],
  'nr89':[{c:400,atk:1,def:1,spd:2,haki:3},{c:800,atk:2,def:1,spd:5,haki:6},{c:1800,atk:3,def:2,spd:7,haki:10}],
  'nr9':[{c:2000,atk:3,def:1,spd:1,haki:1,df:4},{c:4000,atk:7,def:1,spd:1,haki:3,df:10},{c:8000,atk:12,def:3,spd:1,haki:4,df:16}],
  'nr90':[{c:700,atk:4,def:1,spd:1,haki:1,df:1},{c:1500,atk:7,def:1,spd:1,haki:2,df:5},{c:3000,atk:11,def:2,spd:1,haki:3,df:8}],
  'nr91':[{c:400,atk:1,def:1,spd:2,haki:1,df:2},{c:800,atk:3,def:1,spd:5,haki:1,df:4},{c:1800,atk:4,def:1,spd:8,haki:3,df:6}],
  'nr92':[{c:400,atk:2,def:1,spd:3,haki:1},{c:800,atk:5,def:1,spd:6,haki:2},{c:1800,atk:7,def:2,spd:10,haki:3}],
  'nr93':[{c:400,atk:1,def:1,spd:1,haki:4},{c:800,atk:2,def:4,spd:1,haki:7},{c:1800,atk:3,def:6,spd:2,haki:11}],
  'nr94':[{c:700,atk:1,def:1,spd:1,haki:1,df:4},{c:1500,atk:2,def:1,spd:1,haki:4,df:8},{c:3000,atk:4,def:1,spd:2,haki:6,df:12}],
  'nr95':[{c:1200,atk:4,def:1,spd:1,haki:1,df:2},{c:2500,atk:9,def:1,spd:2,haki:1,df:6},{c:5000,atk:13,def:1,spd:4,haki:2,df:10}],
  'nr96':[{c:700,atk:1,def:1,spd:4,haki:1,df:1},{c:1500,atk:1,def:1,spd:8,haki:4,df:2},{c:3000,atk:2,def:1,spd:12,haki:6,df:4}],
  'nr97':[{c:2000,atk:5,def:1,spd:3,haki:1},{c:4000,atk:10,def:2,spd:7,haki:3},{c:8000,atk:17,def:3,spd:12,haki:4}],
  'nr98':[{c:400,atk:1,def:1,spd:3,haki:1,df:1},{c:800,atk:1,def:1,spd:7,haki:4,df:1},{c:1800,atk:3,def:1,spd:11,haki:6,df:1}],
  'nr99':[{c:700,atk:1,def:1,spd:1,haki:1,df:4},{c:1500,atk:2,def:1,spd:4,haki:1,df:8},{c:3000,atk:4,def:1,spd:6,haki:2,df:12}],
  'op1':[{c:2000,atk:3,def:1,spd:1,haki:4,df:1},{c:4000,atk:6,def:1,spd:3,haki:8,df:4},{c:8000,atk:10,def:2,spd:4,haki:13,df:7}],
  'op10':[{c:400,atk:1,def:1,spd:4,haki:1},{c:800,atk:4,def:1,spd:7,haki:2},{c:1800,atk:6,def:2,spd:11,haki:3}],
  'op100':[{c:1200,atk:1,def:1,spd:2,haki:5},{c:2500,atk:3,def:1,spd:5,haki:10},{c:5000,atk:4,def:3,spd:8,haki:15}],
  'op101':[{c:2500,atk:4,def:2,spd:2,haki:3,df:1},{c:5000,atk:9,def:5,spd:2,haki:7,df:3},{c:10000,atk:15,def:8,spd:2,haki:12,df:5}],
  'op102':[{c:400,atk:1,def:1,spd:3,haki:1,df:1},{c:800,atk:1,def:1,spd:6,haki:1,df:5},{c:1800,atk:3,def:1,spd:10,haki:1,df:7}],
  'op11':[{c:1200,atk:2,def:1,spd:1,haki:1,df:4},{c:2500,atk:6,def:1,spd:2,haki:1,df:9},{c:5000,atk:10,def:1,spd:4,haki:2,df:13}],
  'op12':[{c:1200,atk:4,def:1,spd:1,haki:1,df:2},{c:2500,atk:10,def:2,spd:1,haki:1,df:5},{c:5000,atk:15,def:4,spd:1,haki:2,df:8}],
  'op13':[{c:2500,atk:5,def:4,spd:1,haki:1,df:1},{c:5000,atk:12,def:9,spd:1,haki:1,df:3},{c:10000,atk:19,def:14,spd:1,haki:3,df:5}],
  'op14':[{c:2500,atk:4,def:3,spd:2,haki:1,df:2},{c:5000,atk:9,def:7,spd:2,haki:3,df:5},{c:10000,atk:15,def:12,spd:2,haki:5,df:8}],
  'op15':[{c:1200,atk:2,def:1,spd:1,haki:1,df:4},{c:2500,atk:6,def:1,spd:2,haki:1,df:9},{c:5000,atk:10,def:1,spd:4,haki:2,df:13}],
  'op16':[{c:1200,atk:2,def:1,spd:1,haki:1,df:4},{c:2500,atk:5,def:2,spd:1,haki:1,df:10},{c:5000,atk:8,def:4,spd:2,haki:1,df:15}],
  'op17':[{c:1200,atk:2,def:1,spd:4,haki:1,df:1},{c:2500,atk:6,def:2,spd:9,haki:1,df:1},{c:5000,atk:10,def:4,spd:13,haki:1,df:2}],
  'op18':[{c:2000,atk:5,def:1,spd:1,haki:3},{c:4000,atk:10,def:2,spd:3,haki:7},{c:8000,atk:17,def:3,spd:4,haki:12}],
  'op19':[{c:2000,atk:3,def:1,spd:1,haki:1,df:4},{c:4000,atk:7,def:1,spd:1,haki:3,df:10},{c:8000,atk:12,def:3,spd:1,haki:4,df:16}],
  'op2':[{c:2000,atk:4,def:2,spd:1,haki:3},{c:4000,atk:8,def:5,spd:3,haki:6},{c:8000,atk:13,def:8,spd:4,haki:11}],
  'op20':[{c:2500,atk:4,def:1,spd:3,haki:4},{c:5000,atk:8,def:3,spd:5,haki:10},{c:10000,atk:12,def:6,spd:9,haki:15}],
  'op21':[{c:2500,atk:5,def:1,spd:1,haki:1,df:4},{c:5000,atk:12,def:1,spd:1,haki:3,df:9},{c:10000,atk:19,def:3,spd:1,haki:5,df:14}],
  'op22':[{c:2000,atk:3,def:1,spd:1,haki:1,df:4},{c:4000,atk:6,def:4,spd:1,haki:3,df:8},{c:8000,atk:10,def:7,spd:2,haki:4,df:13}],
  'op23':[{c:1200,atk:2,def:1,spd:1,haki:1,df:4},{c:2500,atk:5,def:1,spd:2,haki:1,df:10},{c:5000,atk:8,def:2,spd:4,haki:1,df:15}],
  'op24':[{c:2000,atk:3,def:1,spd:1,haki:4,df:1},{c:4000,atk:7,def:3,spd:1,haki:10,df:1},{c:8000,atk:12,def:4,spd:3,haki:16,df:1}],
  'op25':[{c:1200,atk:3,def:3,spd:1,haki:1,df:1},{c:2500,atk:5,def:7,spd:2,haki:1,df:4},{c:5000,atk:8,def:10,spd:4,haki:2,df:6}],
  'op26':[{c:1200,atk:2,def:4,spd:1,haki:1,df:1},{c:2500,atk:6,def:9,spd:1,haki:1,df:2},{c:5000,atk:10,def:13,spd:1,haki:2,df:4}],
  'op27':[{c:700,atk:1,def:2,spd:3,haki:1,df:1},{c:1500,atk:3,def:4,spd:6,haki:1,df:2},{c:3000,atk:5,def:7,spd:9,haki:1,df:3}],
  'op28':[{c:700,atk:1,def:1,spd:1,haki:1,df:4},{c:1500,atk:2,def:4,spd:1,haki:1,df:8},{c:3000,atk:4,def:6,spd:2,haki:1,df:12}],
  'op29':[{c:700,atk:2,def:3,spd:1,haki:1,df:1},{c:1500,atk:4,def:6,spd:2,haki:1,df:3},{c:3000,atk:7,def:9,spd:3,haki:1,df:5}],
  'op3':[{c:1200,atk:3,def:1,spd:4,haki:1},{c:2500,atk:6,def:2,spd:9,haki:2},{c:5000,atk:10,def:4,spd:14,haki:2}],
  'op30':[{c:700,atk:1,def:1,spd:4,haki:1,df:1},{c:1500,atk:5,def:1,spd:7,haki:1,df:2},{c:3000,atk:8,def:2,spd:11,haki:1,df:3}],
  'op31':[{c:400,atk:1,def:1,spd:2,df:3},{c:800,atk:2,def:3,spd:4,df:5},{c:1800,atk:3,def:5,spd:6,df:8}],
  'op32':[{c:400,atk:2,def:1,spd:1,df:3},{c:800,atk:4,def:2,spd:3,df:5},{c:1800,atk:6,def:3,spd:5,df:8}],
  'op33':[{c:2500,atk:3,def:2,spd:1,haki:6},{c:5000,atk:7,def:4,spd:2,haki:13},{c:10000,atk:11,def:6,spd:3,haki:22}],
  'op34':[{c:2500,atk:4,def:3,spd:1,haki:4},{c:5000,atk:8,def:5,spd:3,haki:10},{c:10000,atk:12,def:9,spd:6,haki:15}],
  'op35':[{c:2000,atk:3,def:1,spd:1,haki:1,df:4},{c:4000,atk:6,def:4,spd:1,haki:3,df:8},{c:8000,atk:10,def:7,spd:2,haki:4,df:13}],
  'op36':[{c:2000,atk:1,def:1,spd:4,haki:1,df:3},{c:4000,atk:4,def:1,spd:8,haki:3,df:6},{c:8000,atk:7,def:2,spd:13,haki:4,df:10}],
  'op37':[{c:2000,atk:3,def:1,spd:1,haki:5},{c:4000,atk:7,def:2,spd:3,haki:10},{c:8000,atk:12,def:3,spd:4,haki:17}],
  'op38':[{c:700,atk:1,def:1,spd:2,haki:1,df:3},{c:1500,atk:3,def:1,spd:4,haki:2,df:6},{c:3000,atk:5,def:1,spd:7,haki:3,df:9}],
  'op39':[{c:1200,atk:3,def:1,spd:1,haki:1,df:3},{c:2500,atk:7,def:4,spd:1,haki:2,df:5},{c:5000,atk:10,def:6,spd:2,haki:4,df:8}],
  'op4':[{c:400,atk:3,def:1,spd:3},{c:800,atk:5,def:2,spd:7},{c:1800,atk:8,def:3,spd:11}],
  'op40':[{c:2000,atk:3,def:4,spd:1,haki:1,df:1},{c:4000,atk:7,def:10,spd:1,haki:1,df:3},{c:8000,atk:12,def:16,spd:1,haki:3,df:4}],
  'op41':[{c:1200,atk:1,def:1,spd:4,haki:1,df:2},{c:2500,atk:2,def:1,spd:9,haki:1,df:6},{c:5000,atk:4,def:1,spd:13,haki:2,df:10}],
  'op42':[{c:2500,atk:5,def:1,spd:1,haki:4,df:1},{c:5000,atk:12,def:1,spd:1,haki:9,df:3},{c:10000,atk:19,def:3,spd:1,haki:14,df:5}],
  'op43':[{c:1200,atk:1,def:1,spd:3,haki:1,df:3},{c:2500,atk:2,def:1,spd:5,haki:4,df:7},{c:5000,atk:4,def:2,spd:8,haki:6,df:10}],
  'op44':[{c:1200,atk:1,def:4,spd:1,haki:1,df:2},{c:2500,atk:2,def:10,spd:1,haki:1,df:5},{c:5000,atk:4,def:15,spd:2,haki:1,df:8}],
  'op45':[{c:700,atk:1,def:1,spd:1,haki:1,df:4},{c:1500,atk:2,def:5,spd:1,haki:1,df:7},{c:3000,atk:3,def:8,spd:2,haki:1,df:11}],
  'op46':[{c:400,atk:1,def:1,spd:2,haki:1,df:2},{c:800,atk:3,def:1,spd:4,haki:1,df:5},{c:1800,atk:4,def:3,spd:6,haki:1,df:8}],
  'op47':[{c:2000,atk:5,def:1,spd:1,haki:3},{c:4000,atk:10,def:3,spd:2,haki:7},{c:8000,atk:17,def:4,spd:3,haki:12}],
  'op48':[{c:1200,atk:4,def:2,spd:1,haki:1,df:1},{c:2500,atk:10,def:5,spd:2,haki:1,df:1},{c:5000,atk:15,def:8,spd:4,haki:1,df:2}],
  'op49':[{c:2000,atk:1,def:2,spd:1,haki:1,df:5},{c:4000,atk:3,def:6,spd:1,haki:1,df:11},{c:8000,atk:5,def:9,spd:3,haki:1,df:18}],
  'op5':[{c:700,atk:2,def:1,spd:1,haki:1,df:3},{c:1500,atk:4,def:3,spd:2,haki:1,df:6},{c:3000,atk:7,def:5,spd:3,haki:1,df:9}],
  'op50':[{c:1200,atk:1,def:4,spd:1,haki:1,df:2},{c:2500,atk:2,def:10,spd:1,haki:1,df:5},{c:5000,atk:4,def:15,spd:1,haki:2,df:8}],
  'op51':[{c:1200,atk:4,def:1,spd:1,haki:3},{c:2500,atk:9,def:2,spd:2,haki:6},{c:5000,atk:14,def:2,spd:4,haki:10}],
  'op52':[{c:1200,atk:4,def:1,spd:2,haki:1,df:1},{c:2500,atk:10,def:1,spd:5,haki:2,df:1},{c:5000,atk:15,def:1,spd:8,haki:4,df:2}],
  'op53':[{c:2500,atk:5,def:1,spd:1,haki:1,df:4},{c:5000,atk:12,def:3,spd:1,haki:1,df:9},{c:10000,atk:19,def:5,spd:1,haki:3,df:14}],
  'op54':[{c:2000,atk:3,def:1,spd:1,haki:1,df:4},{c:4000,atk:6,def:4,spd:1,haki:3,df:8},{c:8000,atk:10,def:7,spd:2,haki:4,df:13}],
  'op55':[{c:2000,atk:1,def:3,spd:1,haki:1,df:4},{c:4000,atk:3,def:7,spd:1,haki:1,df:10},{c:8000,atk:4,def:12,spd:1,haki:3,df:16}],
  'op56':[{c:2000,atk:2,def:1,spd:1,haki:1,df:5},{c:4000,atk:6,def:3,spd:1,haki:1,df:11},{c:8000,atk:9,def:5,spd:1,haki:3,df:18}],
  'op57':[{c:2000,atk:3,def:1,spd:2,haki:4},{c:4000,atk:6,def:3,spd:5,haki:8},{c:8000,atk:11,def:4,spd:8,haki:13}],
  'op58':[{c:700,atk:2,def:2,spd:3,haki:1},{c:1500,atk:5,def:3,spd:6,haki:2},{c:3000,atk:7,def:5,spd:9,haki:4}],
  'op59':[{c:700,atk:4,def:1,spd:1,haki:1,df:1},{c:1500,atk:7,def:2,spd:1,haki:1,df:5},{c:3000,atk:11,def:3,spd:2,haki:1,df:8}],
  'op6':[{c:700,atk:3,def:4,spd:1},{c:1500,atk:6,def:8,spd:2},{c:3000,atk:9,def:12,spd:4}],
  'op60':[{c:700,atk:2,def:1,spd:1,haki:1,df:3},{c:1500,atk:4,def:3,spd:2,haki:1,df:6},{c:3000,atk:7,def:5,spd:3,haki:1,df:9}],
  'op61':[{c:700,atk:1,def:1,spd:1,haki:1,df:4},{c:1500,atk:5,def:1,spd:2,haki:1,df:7},{c:3000,atk:8,def:2,spd:3,haki:1,df:11}],
  'op62':[{c:700,atk:1,def:1,spd:1,haki:1,df:4},{c:1500,atk:2,def:4,spd:1,haki:1,df:8},{c:3000,atk:4,def:6,spd:1,haki:2,df:12}],
  'op63':[{c:700,atk:3,def:2,spd:1,haki:1,df:1},{c:1500,atk:6,def:4,spd:2,haki:1,df:3},{c:3000,atk:9,def:7,spd:3,haki:1,df:5}],
  'op64':[{c:700,atk:1,def:1,spd:1,haki:1,df:4},{c:1500,atk:2,def:1,spd:4,haki:1,df:8},{c:3000,atk:4,def:2,spd:6,haki:1,df:12}],
  'op65':[{c:700,atk:1,def:1,spd:4,haki:2},{c:1500,atk:2,def:2,spd:7,haki:5},{c:3000,atk:3,def:1,spd:12,haki:9}],
  'op66':[{c:700,atk:2,def:1,spd:1,haki:1,df:3},{c:1500,atk:4,def:3,spd:1,haki:2,df:6},{c:3000,atk:7,def:5,spd:1,haki:3,df:9}],
  'op67':[{c:700,atk:2,def:3,spd:1,haki:2},{c:1500,atk:5,def:6,spd:2,haki:3},{c:3000,atk:7,def:9,spd:4,haki:5}],
  'op68':[{c:1200,atk:2,def:1,spd:1,haki:1,df:4},{c:2500,atk:5,def:2,spd:1,haki:1,df:10},{c:5000,atk:8,def:4,spd:1,haki:2,df:15}],
  'op69':[{c:700,atk:1,def:2,spd:1,haki:3,df:1},{c:1500,atk:2,def:4,spd:1,haki:6,df:3},{c:3000,atk:3,def:7,spd:1,haki:9,df:5}],
  'op7':[{c:1200,atk:3,def:4,spd:1,haki:1},{c:2500,atk:6,def:9,spd:2,haki:2},{c:5000,atk:10,def:14,spd:2,haki:4}],
  'op70':[{c:1200,atk:5,def:1,spd:1,haki:2},{c:2500,atk:10,def:3,spd:1,haki:5},{c:5000,atk:15,def:4,spd:3,haki:8}],
  'op71':[{c:700,atk:1,def:1,spd:3,haki:1,df:2},{c:1500,atk:3,def:1,spd:6,haki:2,df:4},{c:3000,atk:5,def:1,spd:9,haki:3,df:7}],
  'op72':[{c:700,atk:1,def:3,spd:1,haki:1,df:2},{c:1500,atk:3,def:6,spd:1,haki:2,df:4},{c:3000,atk:5,def:9,spd:1,haki:3,df:7}],
  'op73':[{c:1200,atk:1,def:4,spd:1,haki:1,df:2},{c:2500,atk:2,def:10,spd:1,haki:1,df:5},{c:5000,atk:4,def:15,spd:1,haki:2,df:8}],
  'op74':[{c:1200,atk:4,def:1,spd:1,haki:1,df:2},{c:2500,atk:10,def:2,spd:1,haki:1,df:5},{c:5000,atk:15,def:4,spd:1,haki:2,df:8}],
  'op75':[{c:700,atk:1,def:1,spd:1,haki:1,df:4},{c:1500,atk:4,def:2,spd:1,haki:1,df:8},{c:3000,atk:6,def:4,spd:1,haki:2,df:12}],
  'op76':[{c:700,atk:4,def:1,spd:1,haki:1,df:1},{c:1500,atk:7,def:5,spd:1,haki:1,df:2},{c:3000,atk:11,def:8,spd:1,haki:2,df:3}],
  'op77':[{c:1200,atk:2,def:4,spd:1,haki:1,df:1},{c:2500,atk:5,def:10,spd:1,haki:1,df:2},{c:5000,atk:8,def:15,spd:1,haki:2,df:4}],
  'op78':[{c:700,atk:2,def:3,spd:1,haki:1,df:1},{c:1500,atk:4,def:6,spd:2,haki:1,df:3},{c:3000,atk:7,def:9,spd:3,haki:1,df:5}],
  'op79':[{c:700,atk:4,def:1,spd:1,haki:1,df:1},{c:1500,atk:7,def:2,spd:1,haki:5,df:1},{c:3000,atk:11,def:3,spd:2,haki:8,df:1}],
  'op8':[{c:400,atk:1,def:1,spd:1,df:4},{c:800,atk:1,def:2,spd:4,df:7},{c:1800,atk:2,def:3,spd:6,df:11}],
  'op80':[{c:700,atk:4,def:2,spd:1,haki:1},{c:1500,atk:8,def:4,spd:2,haki:2},{c:3000,atk:13,def:7,spd:4,haki:1}],
  'op81':[{c:700,atk:4,def:1,spd:2,haki:1},{c:1500,atk:7,def:2,spd:5,haki:2},{c:3000,atk:12,def:3,spd:9,haki:1}],
  'op82':[{c:700,atk:4,def:2,spd:1,haki:1},{c:1500,atk:7,def:5,spd:2,haki:2},{c:3000,atk:12,def:9,spd:3,haki:1}],
  'op83':[{c:700,atk:4,def:2,spd:1,haki:1},{c:1500,atk:7,def:5,spd:2,haki:2},{c:3000,atk:12,def:9,spd:1,haki:3}],
  'op84':[{c:700,atk:2,def:4,spd:1,haki:1},{c:1500,atk:4,def:8,spd:2,haki:2},{c:3000,atk:7,def:13,spd:4,haki:1}],
  'op85':[{c:700,atk:3,def:1,spd:2,haki:2},{c:1500,atk:6,def:2,spd:5,haki:3},{c:3000,atk:9,def:4,spd:7,haki:5}],
  'op86':[{c:700,atk:1,def:1,spd:2,haki:1,df:3},{c:1500,atk:3,def:2,spd:4,haki:1,df:6},{c:3000,atk:5,def:3,spd:7,haki:1,df:9}],
  'op87':[{c:700,atk:1,def:4,spd:1,haki:1,df:1},{c:1500,atk:2,def:7,spd:1,haki:1,df:5},{c:3000,atk:3,def:11,spd:2,haki:1,df:8}],
  'op88':[{c:700,atk:2,def:1,spd:4,haki:1},{c:1500,atk:5,def:2,spd:7,haki:2},{c:3000,atk:9,def:3,spd:12,haki:1}],
  'op89':[{c:1200,atk:4,def:3,spd:1,haki:1},{c:2500,atk:9,def:6,spd:2,haki:2},{c:5000,atk:14,def:10,spd:2,haki:4}],
  'op9':[{c:700,atk:1,def:1,spd:4,haki:1,df:1},{c:1500,atk:2,def:1,spd:7,haki:1,df:5},{c:3000,atk:3,def:2,spd:11,haki:1,df:8}],
  'op90':[{c:700,atk:1,def:1,spd:4,haki:1,df:1},{c:1500,atk:4,def:2,spd:8,haki:1,df:1},{c:3000,atk:6,def:4,spd:12,haki:1,df:2}],
  'op91':[{c:700,atk:1,def:4,spd:1,haki:1,df:1},{c:1500,atk:4,def:8,spd:2,haki:1,df:1},{c:3000,atk:6,def:12,spd:4,haki:1,df:2}],
  'op92':[{c:400,atk:3,def:3,spd:1},{c:800,atk:5,def:7,spd:2},{c:1800,atk:8,def:11,spd:3}],
  'op93':[{c:400,atk:1,def:1,spd:2,haki:1,df:2},{c:800,atk:3,def:1,spd:4,haki:1,df:5},{c:1800,atk:4,def:3,spd:6,haki:1,df:8}],
  'op94':[{c:700,atk:2,def:3,spd:1,haki:2},{c:1500,atk:3,def:6,spd:2,haki:5},{c:3000,atk:5,def:9,spd:4,haki:7}],
  'op95':[{c:700,atk:4,def:1,spd:1,haki:1,df:1},{c:1500,atk:7,def:5,spd:2,haki:1,df:1},{c:3000,atk:11,def:8,spd:3,haki:1,df:2}],
  'op96':[{c:700,atk:1,def:3,spd:1,haki:1,df:2},{c:1500,atk:3,def:6,spd:1,haki:2,df:4},{c:3000,atk:5,def:9,spd:1,haki:3,df:7}],
  'op97':[{c:700,atk:2,def:1,spd:4,haki:1},{c:1500,atk:4,def:2,spd:8,haki:2},{c:3000,atk:7,def:1,spd:13,haki:4}],
  'op98':[{c:400,atk:1,def:1,spd:1,haki:1,df:3},{c:800,atk:1,def:4,spd:1,haki:1,df:7},{c:1800,atk:3,def:6,spd:1,haki:1,df:11}],
  'op99':[{c:1200,atk:3,def:2,spd:1,haki:3},{c:2500,atk:7,def:4,spd:2,haki:6},{c:5000,atk:11,def:6,spd:4,haki:9}],
};

const GENERIC_LABELS = {
  'S+': ['Awakened','Transcended','Ultimate Form'],
  'S':  ['Awakened','Ascended','Final Form'],
  'A':  ['Enhanced','Awakened','Peak Form'],
  'B':  ['Trained','Enhanced','Awakened'],
  'C':  ['Trained','Enhanced','Peak Form']
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
  const ch = ALL_CHARS.find(c=>c.id===id);
  const tier = ch?.tier||'B';
  const boostData = PER_CHAR_BOOSTS[id] || [{c:500,atk:3,def:2,spd:2},{c:1200,atk:7,def:5,spd:4},{c:2500,atk:11,def:8,spd:7}];
  const labels = CHAR_UPGRADES[id] ? CHAR_UPGRADES[id].map(u=>u.label) : (GENERIC_LABELS[tier]||GENERIC_LABELS['B']);
  return boostData.map((b,i) => ({
    cost: b.c,
    label: labels[i] || ('Level '+(i+1)),
    boosts: {atk:b.atk||0, def:b.def||0, spd:b.spd||0, haki:b.haki||0, df:b.df||0}
  }));
}

function getUpgradeBoosts(id) {
  const level = getUpgradeLevel(id);
  if(level === 0) return {atk:0,def:0,spd:0,haki:0,df:0};
  const upgrades = getCharUpgrades(id);
  const u = upgrades[level-1];
  return u.boosts || {atk:0,def:0,spd:0,haki:0,df:0};
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
  const boostParts = [];
  if(boosts.atk) boostParts.push('+'+boosts.atk+' ATK');
  if(boosts.def) boostParts.push('+'+boosts.def+' DEF');
  if(boosts.spd) boostParts.push('+'+boosts.spd+' SPD');
  if(boosts.haki) boostParts.push('+'+boosts.haki+' HAKI');
  if(boosts.df) boostParts.push('+'+boosts.df+' DF');
  const totalBoostStr = currentLevel > 0 ? `<div class="upg-current-boost">${boostParts.join(', ')}</div>` : '';

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
          ${u.boosts.atk?`<span class="upg-stat upg-atk">+${u.boosts.atk} ATK</span>`:''}
          ${u.boosts.def?`<span class="upg-stat upg-def">+${u.boosts.def} DEF</span>`:''}
          ${u.boosts.spd?`<span class="upg-stat upg-spd">+${u.boosts.spd} SPD</span>`:''}
          ${u.boosts.haki?`<span class="upg-stat upg-haki">+${u.boosts.haki} HAKI</span>`:''}
          ${u.boosts.df?`<span class="upg-stat upg-df">+${u.boosts.df} DF</span>`:''}
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
    const boosts = getUpgradeBoosts(ch.id);
    const boosted = {...ch, def: ch.def + boosts.def, haki: (ch.haki||0) + boosts.haki};
    return origCalcMaxHP(boosted);
  };

  const origCalcDamage = calcDamage;
  window.calcDamage = function(atk, def, move) {
    const atkBoosts = getUpgradeBoosts(atk.id);
    const defBoosts = getUpgradeBoosts(def.id);
    const boostedAtk = {...atk,
      atk: atk.atk + atkBoosts.atk,
      def: atk.def + atkBoosts.def,
      spd: atk.spd + atkBoosts.spd,
      haki: (atk.haki||0) + atkBoosts.haki,
      df: (atk.df||0) + atkBoosts.df
    };
    const boostedDef = {...def,
      atk: def.atk + defBoosts.atk,
      def: def.def + defBoosts.def,
      spd: def.spd + defBoosts.spd,
      haki: (def.haki||0) + defBoosts.haki,
      df: (def.df||0) + defBoosts.df
    };
    return origCalcDamage(boostedAtk, boostedDef, move);
  };
})();
