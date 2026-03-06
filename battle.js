// ===== ANIME WAR: POKEMON-STYLE BATTLE ENGINE + COLLECTION SYSTEM =====

// ---- CONFIGURATION ----
const TIER_MULT = {'S+':1.5,'S':1.3,'A':1.15,'B':1.0,'C':0.85};
const TIER_COSTS = {'S+':5000,'S':3000,'A':1500,'B':800,'C':400};
const DIFF_REWARDS = {easy:100,medium:250,hard:500,extreme:1000};
const DIFF_BONUS_WIN = {easy:50,medium:125,hard:250,extreme:500};
const SAVE_KEY = 'animewar_save';
const DEFAULT_STARTERS_OP = ['op1','op2','op3','op4','op10','op46','op65','op9','op8','op31'];
const DEFAULT_STARTERS_NR = ['nr1','nr2','nr3','nr4','nr15','nr16','nr20','nr28','nr29','nr36'];
const DEFAULT_STARTERS = [...DEFAULT_STARTERS_OP,...DEFAULT_STARTERS_NR];

// ---- COLLECTION / SAVE SYSTEM ----
let saveData = loadSave();

// ===== PLAYER DATA SYSTEM =====
const PLAYER_KEY = 'animewar_player';
function loadPlayer(){
  try{
    const s=localStorage.getItem(PLAYER_KEY);
    if(s)return JSON.parse(s);
  }catch(e){}
  return null;
}
function savePlayer(p){
  localStorage.setItem(PLAYER_KEY, JSON.stringify(p));
}
let playerData = loadPlayer();

// === ONE-TIME HARD RESET v29 ===
(function hardResetV29(){
  if(localStorage.getItem('animewar_reset_v29')) return; // already ran
  // Clear all game data
  ['animewar_save','animewar_charlevels','animewar_evolutions','animewar_upgrades',
   'animewar_equipment','animewar_favorites','animewar_daily','animewar_prestige','animewar_player'].forEach(k=>localStorage.removeItem(k));
  // Set new reset flag
  localStorage.setItem('animewar_reset_v29','done');
  // Initialize with empty unlocked - onboarding will handle it
  saveData={unlocked:[], coins:0, wins:0, losses:0};
  saveSave();
  playerData=null;
})();

// ===== ONBOARDING SYSTEM =====
let onboardingStep = 'name'; // 'name' or 'characters'
let onboardingName = '';
let onboardingSelected = [];

function showOnboarding(){
  const screen = document.getElementById('onboarding-screen');
  screen.style.display='flex';
  renderOnboardingStep();
}

function renderOnboardingStep(){
  const screen = document.getElementById('onboarding-screen');
  if(onboardingStep === 'name'){
    screen.innerHTML = `
      <div class="onboard-title">ANIME WAR</div>
      <div class="onboard-sub">Welcome, Fighter!</div>
      <div style="text-align:center;margin-top:20px">
        <div class="onboard-sub" style="font-size:16px;margin-bottom:15px">What's your name?</div>
        <input type="text" class="onboard-input" id="onboardName" placeholder="Enter your name" maxlength="20" style="width:250px">
        <button class="onboard-btn" onclick="onboardingNextStep()" style="margin-top:20px">NEXT</button>
      </div>
    `;
    setTimeout(()=>{document.getElementById('onboardName')?.focus();},100);
  } else if(onboardingStep === 'characters'){
    const allChars = ALL_CHARS;
    screen.innerHTML = `
      <div class="onboard-title">PICK YOUR TEAM</div>
      <div class="onboard-sub">Choose 3 starting characters</div>
      <div class="onboard-counter"><span id="onboardCounter">0</span>/3 selected</div>
      <div class="onboard-grid">
        ${allChars.map(c => `
          <div class="onboard-char ${onboardingSelected.includes(c.id) ? 'selected' : ''}" onclick="toggleOnboardingChar('${c.id}')">
            <img src="${CHAR_IMGS[c.id]||'images/'+c.id+'.jpg'}" alt="${c.name}">
            <div class="onboard-char-name">${c.name}</div>
            <div class="tier-badge tier-${c.tier.replace('+','p')}">${c.tier}</div>
          </div>
        `).join('')}
      </div>
      <button class="onboard-btn" onclick="completeOnboarding()" ${onboardingSelected.length !== 3 ? 'disabled' : ''}>START GAME</button>
    `;
  }
}

function onboardingNextStep(){
  const nameInput = document.getElementById('onboardName');
  onboardingName = (nameInput?.value || '').trim();
  if(!onboardingName){
    alert('Please enter a name');
    return;
  }
  onboardingStep = 'characters';
  onboardingSelected = [];
  renderOnboardingStep();
}

function toggleOnboardingChar(id){
  if(onboardingSelected.includes(id)){
    onboardingSelected = onboardingSelected.filter(c => c !== id);
  } else {
    if(onboardingSelected.length < 3){
      onboardingSelected.push(id);
    } else {
      return; // Can't select more than 3
    }
  }
  renderOnboardingStep();
  document.getElementById('onboardCounter').textContent = onboardingSelected.length;
}

function completeOnboarding(){
  if(onboardingSelected.length !== 3){
    alert('Please select exactly 3 characters');
    return;
  }
  // Save player data
  playerData = {name: onboardingName};
  savePlayer(playerData);
  // Set unlocked characters
  saveData.unlocked = [...onboardingSelected];
  saveData.coins = 0;
  saveData.wins = 0;
  saveData.losses = 0;
  saveSave();
  // Hide onboarding and show title screen
  const screen = document.getElementById('onboarding-screen');
  screen.style.display='none';
  updateMenuStats();
  showScreen('title-screen');
}

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

// ===== GACHA PACK SYSTEM =====
const GACHA_KEY = 'animewar_gacha';
const GACHA_PACKS = {
  bronze: {name:'Bronze Pack',emoji:'🥉',cost:300,pulls:1,color:'#CD7F32',
    rates:{'C':60,'B':30,'A':8,'S':2,'S+':0},desc:'Common characters'},
  silver: {name:'Silver Pack',emoji:'🥈',cost:800,pulls:1,color:'#C0C0C0',
    rates:{'C':20,'B':40,'A':30,'S':9,'S+':1},desc:'Rare chance for S tier'},
  gold: {name:'Gold Pack',emoji:'🥇',cost:2000,pulls:3,color:'#FFD700',
    rates:{'C':0,'B':30,'A':45,'S':20,'S+':5},desc:'3 pulls, best odds'}
};
const DUPE_REFUND = {'S+':2500,'S':1500,'A':750,'B':400,'C':200};
const PITY_THRESHOLD = 50;
// ===== TEAM SYNERGY SYSTEM =====
const TEAM_SYNERGIES = {
  straw_hats: {name:'Straw Hat Pirates',emoji:'☠️',members:['op1','op2','op3','op4','op5','op6','op7','op8','op9','op10'],bonus:{atk:0.08,spd:0.05}},
  yonko: {name:'Yonko',emoji:'👑',members:['op13','op14','op19','op20','op1'],bonus:{atk:0.15,def:0.1}},
  worst_gen: {name:'Worst Generation',emoji:'🔥',members:['op1','op2','op11','op12','op58','op59','op60','op61','op62','op63','op64'],bonus:{spd:0.1,atk:0.05}},
  whitebeard_pirates: {name:'Whitebeard Pirates',emoji:'⚓',members:['op21','op49','op50','op51','op23'],bonus:{def:0.12,atk:0.08}},
  beast_pirates: {name:'Beast Pirates',emoji:'🦖',members:['op13','op25','op26','op77','op27','op28','op29','op30','op78'],bonus:{atk:0.1,def:0.1}},
  warlords: {name:'Warlords',emoji:'⚔️',members:['op18','op43','op15','op16','op44','op45','op7','op46','op11'],bonus:{atk:0.08,def:0.08,spd:0.08}},
  marines: {name:'Marines',emoji:'🎖️',members:['op22','op35','op36','op55','op56','op40','op34','op65','op66'],bonus:{def:0.1,atk:0.08}},
  roger_crew: {name:'Roger Pirates',emoji:'🏴‍☠️',members:['op33','op37','op47','op20'],bonus:{atk:0.15,spd:0.1}},
  scabbards: {name:'Nine Red Scabbards',emoji:'⚔️',members:['op79','op80','op81','op82','op83','op84','op85','op48'],bonus:{atk:0.08,def:0.08}},
  team_7: {name:'Team 7',emoji:'🐸',members:['nr1','nr2','nr3','nr4'],bonus:{atk:0.1,def:0.05,spd:0.05}},
  uchiha: {name:'Uchiha Clan',emoji:'👁️',members:['nr2','nr5','nr6','nr8','nr41','nr94','nr95','nr96'],bonus:{haki:0.15,spd:0.08}},
  akatsuki: {name:'Akatsuki',emoji:'🌙',members:['nr9','nr5','nr24','nr22','nr23','nr25','nr26','nr27','nr8','nr21'],bonus:{atk:0.12,def:-0.05}},
  hokage: {name:'Hokage',emoji:'🏮',members:['nr7','nr30','nr31','nr13','nr4','nr1','nr11'],bonus:{atk:0.1,def:0.1,spd:0.1}},
  sannin: {name:'Legendary Sannin',emoji:'🥋',members:['nr10','nr11','nr12'],bonus:{def:0.12,healing:0.03}},
  konoha_11: {name:'Konoha 11',emoji:'🍃',members:['nr1','nr2','nr3','nr18','nr19','nr20','nr36','nr39','nr40','nr15','nr35','nr82'],bonus:{def:0.08,spd:0.05}},
  jinchuriki: {name:'Jinchuriki',emoji:'💔',members:['nr1','nr17','nr16','nr53','nr54','nr55','nr56','nr57','nr51'],bonus:{df:0.12,atk:0.08}},
  otsutsuki: {name:'Otsutsuki',emoji:'✨',members:['nr33','nr45','nr47','nr6'],bonus:{atk:0.2,def:0.2,spd:0.2}},
  taka: {name:'Taka',emoji:'🦅',members:['nr2','nr67','nr68','nr69'],bonus:{atk:0.1,spd:0.08}},
};


function loadGacha(){
  try{const s=localStorage.getItem(GACHA_KEY);if(s)return JSON.parse(s);}catch(e){}
  return {pity:0,totalPulls:0};
}
function saveGacha(g){localStorage.setItem(GACHA_KEY,JSON.stringify(g));}

function rollGachaPull(packType){
  const pack=GACHA_PACKS[packType];
  const gacha=loadGacha();
  gacha.totalPulls++;
  gacha.pity++;
  // Pity: guarantee S+ every PITY_THRESHOLD pulls
  if(gacha.pity>=PITY_THRESHOLD){
    gacha.pity=0;
    saveGacha(gacha);
    return pickRandomCharOfTier('S+');
  }
  // Weighted random
  const roll=Math.random()*100;
  let cumulative=0;
  const tiers=['S+','S','A','B','C'];
  for(const tier of tiers){
    cumulative+=pack.rates[tier];
    if(roll<cumulative){
      if(tier==='S+') gacha.pity=0; // reset pity on natural S+
      saveGacha(gacha);
      return pickRandomCharOfTier(tier);
    }
  }
  saveGacha(gacha);
  return pickRandomCharOfTier('C');
}

function pickRandomCharOfTier(tier){
  const pool=ALL_CHARS.filter(c=>c.tier===tier);
  if(pool.length===0) return ALL_CHARS[Math.floor(Math.random()*ALL_CHARS.length)];
  return pool[Math.floor(Math.random()*pool.length)];
}

function openPack(packType){
  const pack=GACHA_PACKS[packType];
  if(saveData.coins<pack.cost) return;
  saveData.coins-=pack.cost;
  saveSave();
  const results=[];
  for(let i=0;i<pack.pulls;i++){
    const ch=rollGachaPull(packType);
    const isNew=!isUnlocked(ch.id);
    if(isNew){
      saveData.unlocked.push(ch.id);
    }
    const dupeCoins=isNew?0:DUPE_REFUND[ch.tier]||200;
    if(!isNew){saveData.coins+=dupeCoins;}
    results.push({char:ch,isNew,dupeCoins});
  }
  saveSave();
  showGachaPullResult(results, packType);
}

function showGachaShop(){
  const modal=document.getElementById('gachaModal');
  if(!modal) return;
  const gacha=loadGacha();
  const pityLeft=PITY_THRESHOLD-gacha.pity;
  let packsHTML='';
  for(const [key,pack] of Object.entries(GACHA_PACKS)){
    const canAfford=saveData.coins>=pack.cost;
    const rateStr=Object.entries(pack.rates).filter(([t,r])=>r>0).map(([t,r])=>`<span class="gr-${t.replace('+','p')}">${t}:${r}%</span>`).join(' ');
    packsHTML+=`<div class="gacha-pack" style="--pc:${pack.color}">
      <div class="gp-emoji">${pack.emoji}</div>
      <div class="gp-name">${pack.name}</div>
      <div class="gp-pulls">${pack.pulls} Pull${pack.pulls>1?'s':''}</div>
      <div class="gp-rates">${rateStr}</div>
      <div class="gp-desc">${pack.desc}</div>
      <button class="gp-btn ${canAfford?'':'gp-disabled'}" onclick="${canAfford?`openPack('${key}')`:''}" ${canAfford?'':'disabled'}>
        ${pack.cost.toLocaleString()} COINS
      </button>
    </div>`;
  }
  modal.querySelector('.gacha-content').innerHTML=`
    <div class="gacha-header">
      <div class="gacha-title">🎰 SUMMON</div>
      <div class="gacha-coins">💰 ${saveData.coins.toLocaleString()}</div>
      <div class="gacha-pity">S+ Pity: ${pityLeft} pulls left</div>
    </div>
    <div class="gacha-packs">${packsHTML}</div>
    <div class="gacha-info">Duplicates refund coins · S+ guaranteed every ${PITY_THRESHOLD} pulls</div>
    <button class="gacha-close" onclick="closeGachaShop()">BACK</button>
  `;
  modal.style.display='flex';
}

function closeGachaShop(){
  document.getElementById('gachaModal').style.display='none';
  if(typeof updateMenuStats==='function') updateMenuStats();
}

let gachaPullQueue=[];
let gachaPullIdx=0;
let gachaPackType='';

function showGachaPullResult(results, packType){
  gachaPullQueue=results;
  gachaPullIdx=0;
  gachaPackType=packType;
  showNextGachaPull();
}

function showNextGachaPull(){
  if(gachaPullIdx>=gachaPullQueue.length){
    // All pulls shown, back to shop
    showGachaShop();
    return;
  }
  const r=gachaPullQueue[gachaPullIdx];
  const ch=r.char;
  const tierColors={'S+':'#FFD700','S':'#BE4BDB','A':'#339AF0','B':'#4CAF50','C':'#aaa'};
  const glowColor=tierColors[ch.tier]||'#fff';
  const modal=document.getElementById('gachaModal');
  modal.querySelector('.gacha-content').innerHTML=`
    <div class="pull-result" style="--glow:${glowColor}">
      <div class="pull-card ${r.isNew?'pull-new':'pull-dupe'}">
        <div class="pull-tier tier-${ch.tier.replace('+','p')}">${ch.tier}</div>
        <div class="pull-img-wrap">
          <img src="images/${ch.id}.jpg" class="pull-img" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22><rect fill=%22%23222%22 width=%221%22 height=%221%22/></svg>'">
        </div>
        <div class="pull-name">${ch.name}</div>
        <div class="pull-anime">${ch.anime==='onepiece'?'☠️ ONE PIECE':'🍥 NARUTO'}</div>
        ${r.isNew?'<div class="pull-badge">✨ NEW!</div>':`<div class="pull-dupe-info">Already owned · +${r.dupeCoins} coins</div>`}
      </div>
      <div class="pull-counter">${gachaPullIdx+1}/${gachaPullQueue.length}</div>
      <button class="gp-btn" onclick="gachaPullIdx++;showNextGachaPull()">
        ${gachaPullIdx<gachaPullQueue.length-1?'NEXT':'DONE'}
      </button>
    </div>
  `;
}



// ---- ITEMS SYSTEM ----
const ITEMS = {
  potion:    {name:'Potion',emoji:'🧪',desc:'Heal 25% HP',cost:150,effect:'heal',value:0.25},
  hipotion:  {name:'Hi-Potion',emoji:'💊',desc:'Heal 50% HP',cost:300,effect:'heal',value:0.50},
  atkboost:  {name:'ATK Boost',emoji:'⚔️',desc:'+20% ATK for battle',cost:200,effect:'buff',stat:'atk',value:0.20},
  defboost:  {name:'DEF Boost',emoji:'🛡️',desc:'+20% DEF for battle',cost:200,effect:'buff',stat:'def',value:0.20},
  spdboost:  {name:'SPD Boost',emoji:'💨',desc:'+20% SPD for battle',cost:200,effect:'buff',stat:'spd',value:0.20},
  revive:    {name:'Revive',emoji:'✨',desc:'Revive fainted ally at 30% HP',cost:500,effect:'revive',value:0.30}
};
const INV_KEY='animewar_inventory';
function loadInventory(){try{const s=localStorage.getItem(INV_KEY);if(s)return JSON.parse(s);}catch(e){}return {};}
function saveInventory(inv){localStorage.setItem(INV_KEY,JSON.stringify(inv));}
function getItemCount(itemId){const inv=loadInventory();return inv[itemId]||0;}
function buyItem(itemId,qty){
  const item=ITEMS[itemId]; if(!item) return false;
  const total=item.cost*qty;
  if(saveData.coins<total) return false;
  saveData.coins-=total; saveSave();
  const inv=loadInventory(); inv[itemId]=(inv[itemId]||0)+qty; saveInventory(inv);
  return true;
}
function consumeItem(itemId){
  const inv=loadInventory(); if(!inv[itemId]||inv[itemId]<=0) return false;
  inv[itemId]--; if(inv[itemId]<=0) delete inv[itemId]; saveInventory(inv);
  return true;
}

let equippedItems=[];
function useItemInBattle(itemId){
  if(!currentBattle||currentBattle.phase!=='action') return;
  const item=ITEMS[itemId]; if(!item) return;
  if(!consumeItem(itemId)) return;
  const idx=equippedItems.indexOf(itemId);
  if(idx>=0) equippedItems.splice(idx,1);
  const b=currentBattle, p=b.pActive;
  b.pendingLog=[];
  if(item.effect==='heal'){
    const heal=Math.floor(p.maxHP*item.value);
    p.hp=Math.min(p.maxHP,p.hp+heal);
    b.addLog(`${p.name} used ${item.name}! Healed ${heal} HP!`);
  }else if(item.effect==='buff'){
    const boost=Math.floor(p[item.stat]*item.value);
    p[item.stat]+=boost;
    b.addLog(`${p.name} used ${item.name}! ${item.stat.toUpperCase()} +${boost}!`);
  }else if(item.effect==='revive'){
    const fainted=b.pTeam.filter(c=>c.fainted);
    if(fainted.length>0){
      const target=fainted[0];
      target.fainted=false;
      target.hp=Math.floor(target.maxHP*item.value);
      b.addLog(`${target.name} was revived with ${target.hp} HP!`);
    }else{
      b.addLog('No fainted allies to revive!');
      // Refund the item
      const inv=loadInventory(); inv[itemId]=(inv[itemId]||0)+1; saveInventory(inv);
      equippedItems.push(itemId);
      return;
    }
  }
  // Using item takes your turn - enemy attacks
  const e=b.eActive;
  const eMoveIdx=b.aiPickMove(e,p);
  const eMove=e.moves[eMoveIdx];
  b.execAttack(e,p,eMove);
  b.tickStatus(p); b.tickStatus(e);
  if(b.pSynergies&&b.pSynergies.some(s=>s.key==='sannin')){
    const healAmt=Math.floor(p.maxHP*0.03);
    p.hp=Math.min(p.maxHP,p.hp+healAmt);
    if(healAmt>0) b.addLog(`${p.name} recovered ${healAmt} HP from Sannin synergy!`);
  }
  b.checkFaint(); b.turn++;
  animateLogs(b.pendingLog,()=>renderBattle());
  b.pendingLog=[];
}

function showBattleItems(){
  if(!currentBattle||currentBattle.phase!=='action') return;
  const actDiv=document.getElementById('battleActions');
  let html='<div class="switch-prompt">Use an Item (takes your turn)</div><div class="switch-grid">';
  const counted={};
  equippedItems.forEach(id=>{counted[id]=(counted[id]||0)+1;});
  for(const [id,qty] of Object.entries(counted)){
    const item=ITEMS[id];
    html+=`<button class="switch-char-btn" onclick="useItemInBattle('${id}')">
      <span style="font-size:24px">${item.emoji}</span>
      <span>${item.name} x${qty}</span>
      <span style="font-size:10px;opacity:0.7">${item.desc}</span>
    </button>`;
  }
  html+=`</div><button class="switch-btn" onclick="renderBattle()" style="margin-top:8px">Cancel</button>`;
  actDiv.innerHTML=html;
}

function showItemShop(){
  const modal=document.getElementById('gachaModal');
  if(!modal) return;
  const inv=loadInventory();
  let html=`<div class="gacha-header">
    <div class="gacha-title">🛍️ SHOP</div>
    <div class="gacha-coins">💰 ${saveData.coins.toLocaleString()}</div>
  </div><div class="shop-grid">`;
  for(const [id,item] of Object.entries(ITEMS)){
    const owned=inv[id]||0;
    const canBuy=saveData.coins>=item.cost;
    html+=`<div class="shop-item">
      <div class="shop-emoji">${item.emoji}</div>
      <div class="shop-name">${item.name}</div>
      <div class="shop-desc">${item.desc}</div>
      <div class="shop-owned">Owned: ${owned}</div>
      <button class="gp-btn ${canBuy?'':'gp-disabled'}" onclick="buyItemUI('${id}')" ${canBuy?'':'disabled'}>${item.cost} COINS</button>
    </div>`;
  }
  html+=`</div><button class="gacha-close" onclick="closeGachaShop()">BACK</button>`;
  modal.querySelector('.gacha-content').innerHTML=html;
  modal.style.display='flex';
}

function buyItemUI(itemId){
  if(buyItem(itemId,1)){
    showItemShop(); // refresh
  }
}


// ---- EVOLUTION / TRANSFORMATION SYSTEM ----

// ---- CHARACTER LEVEL / EXP SYSTEM ----
const CHAR_LEVEL_KEY = 'animewar_charlevels';
const MAX_CHAR_LEVEL = 50;

// EXP curve: each level needs more EXP
function expForLevel(lvl){
  if(lvl<=1) return 0;
  return Math.floor(80 * Math.pow(lvl-1, 1.5));
}
function totalExpForLevel(lvl){
  let total=0;
  for(let i=1;i<=lvl;i++) total+=expForLevel(i);
  return total;
}

function loadCharLevels(){try{const s=localStorage.getItem(CHAR_LEVEL_KEY);if(s)return JSON.parse(s);}catch(e){}return {};}
function saveCharLevels(){localStorage.setItem(CHAR_LEVEL_KEY,JSON.stringify(charLevelData));}
let charLevelData = loadCharLevels();

function getCharLevel(id){
  const d=charLevelData[id];
  if(!d) return {level:1,exp:0};
  return {level:d.level||1, exp:d.exp||0};
}

function getCharLevelNum(id){return getCharLevel(id).level;}

function addCharExp(id, amount){
  if(!isUnlocked(id)) return {levelUps:0,newLevel:1,levelDowns:0};
  let d=charLevelData[id]||{level:1,exp:0};
  d.exp += amount;
  let levelUps=0;
  let levelDowns=0;
  // Handle leveling DOWN when exp goes negative (from wagering)
  while(d.exp < 0 && d.level > 1){
    d.level--;
    levelDowns++;
    const needed = expForLevel(d.level+1);
    d.exp += needed;
  }
  if(d.exp < 0) d.exp = 0; // floor at level 1, 0 exp
  // Handle leveling UP
  while(d.level < MAX_CHAR_LEVEL){
    const needed = expForLevel(d.level+1);
    if(d.exp >= needed){
      d.exp -= needed;
      d.level++;
      levelUps++;
    } else break;
  }
  if(d.level >= MAX_CHAR_LEVEL){d.level=MAX_CHAR_LEVEL;d.exp=0;}
  charLevelData[id]=d;
  saveCharLevels();
  return {levelUps, newLevel:d.level, levelDowns};
}

// EXP rewards by context
function calcBattleExp(won, diff, charTier, isStory, isBoss){
  const tierMult = {'C':1,'B':1.1,'A':1.2,'S':1.3,'S+':1.4}[charTier]||1;
  const diffMult = {'easy':0.5,'medium':1.5,'hard':5,'extreme':10}[diff]||1;
  let base = won ? 60 : 15;
  if(isStory) base = won ? 80 : 20;
  if(isBoss && won) base = 150;
  return Math.floor(base * diffMult * tierMult);
}

// Growth system: base stats = max potential. Characters start at 40% and grow to 100%.
// Level 1 = 40%, Level 50 = 100%. Each level adds ~1.22% of potential.
// Returns the multiplier for a character's stats at their current level.
const GROWTH_FLOOR = 0.40; // starting strength (40% of potential)
const GROWTH_CEIL = 1.00;  // full potential at max level
const MAX_LEVEL = 50;

function getLevelMultiplier(id){
  const lvl = getCharLevelNum(id);
  if(lvl >= MAX_LEVEL) return GROWTH_CEIL;
  // Linear interpolation from floor to ceiling
  return GROWTH_FLOOR + (GROWTH_CEIL - GROWTH_FLOOR) * ((lvl - 1) / (MAX_LEVEL - 1));
}

// Returns the actual stats for a character at their current level
function getEffectiveStats(id, ch){
  const mult = getLevelMultiplier(id);
  return {
    atk: Math.floor((ch.atk||0) * mult),
    def: Math.floor((ch.def||0) * mult),
    spd: Math.floor((ch.spd||0) * mult),
    haki: Math.floor((ch.haki||0) * mult),
    df: Math.floor((ch.df||0) * mult)
  };
}

// For detail view: shows how much stats grew from leveling (current - base level 1 value)
function getLevelStatBonus(id, baseStats){
  const mult = getLevelMultiplier(id);
  const floor = GROWTH_FLOOR;
  const gain = mult - floor; // how much we gained beyond starting point
  if(gain <= 0) return {atk:0,def:0,spd:0,haki:0,df:0};
  return {
    atk: Math.floor((baseStats.atk||0) * gain),
    def: Math.floor((baseStats.def||0) * gain),
    spd: Math.floor((baseStats.spd||0) * gain),
    haki: Math.floor((baseStats.haki||0) * gain),
    df: Math.floor((baseStats.df||0) * gain)
  };
}


const EVO_KEY = 'animewar_evolutions';
function loadEvolutions(){try{const s=localStorage.getItem(EVO_KEY);if(s)return JSON.parse(s);}catch(e){}return {};}
function saveEvolutions(ev){localStorage.setItem(EVO_KEY,JSON.stringify(ev));}
let evoData = loadEvolutions();

const CHAR_EVOLUTIONS={
'op1':{stages:[{name:'Rubber Boy Luffy',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Gear 4 Luffy',level:15,boosts:{atk:7,def:5,spd:4,haki:4,df:4}},{name:'Gear 5 Nika',level:35,boosts:{atk:12,def:10,spd:8,haki:8,df:8}}],learnMoves:{2:{name:'Gear 4: Boundman',type:'df',power:95,acc:88,pp:8,effect:null},3:{name:'Bajrang Gatling',type:'special',power:125,acc:75,pp:4,effect:null}}},
'op2':{stages:[{name:'Three-Sword Zoro',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Asura Zoro',level:15,boosts:{atk:7,def:5,spd:4,haki:4,df:4}},{name:'King of Hell Zoro',level:35,boosts:{atk:12,def:10,spd:8,haki:8,df:8}}],learnMoves:{2:{name:'Asura: Demon Flash',type:'sword',power:92,acc:90,pp:8,effect:null},3:{name:'King Hell Retribution',type:'kenjutsu',power:128,acc:80,pp:4,effect:null}}},
'op3':{stages:[{name:'Black Leg Sanji',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Diable Jambe Sanji',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Ifrit Jambe Sanji',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Hell Memories',type:'special',power:88,acc:85,pp:8,effect:null},3:{name:'Inferno Kick',type:'taijutsu',power:115,acc:80,pp:5,effect:null}}},
'op4':{stages:[{name:'Cat Burglar Nami',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Zeus Nami',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Thunderbolt Tempo',type:'special',power:85,acc:80,pp:6,effect:null}}},
'op5':{stages:[{name:'Devil Child Robin',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Demonio Fleur Robin',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Demonio Fleur: Gigantesco',type:'special',power:82,acc:85,pp:7,effect:null}}},
'op6':{stages:[{name:'Cyborg Franky',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'General Franky',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Shogun: Cannon Blast',type:'special',power:88,acc:82,pp:6,effect:null}}},
'op7':{stages:[{name:'Fish-Man Jinbe',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Helmsman Jinbe',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Knight of the Sea',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Ryutei Suigun',type:'physical',power:90,acc:88,pp:7,effect:null},3:{name:'Ocean Sovereignty',type:'special',power:120,acc:80,pp:5,effect:null}}},
'op8':{stages:[{name:'Cotton Candy Chopper',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Monster Point Chopper',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Monster Rampage',type:'taijutsu',power:80,acc:85,pp:7,effect:null}}},
'op9':{stages:[{name:'Soul King Brook',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Revive-Revive Brook',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Soul Music: Inferno',type:'special',power:83,acc:85,pp:7,effect:null}}},
'op10':{stages:[{name:'Sniper Usopp',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Sogeking / God Usopp',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Gigantesco Muzzle',type:'special',power:78,acc:80,pp:8,effect:null}}},
'op11':{stages:[{name:'Surgeon of Death',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Awakened Law',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'KRoom Law',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Awakening: Amputate',type:'special',power:92,acc:85,pp:7,effect:null},3:{name:'Kroom: Destruction',type:'df',power:122,acc:78,pp:5,effect:null}}},
'op12':{stages:[{name:'Captain Kid',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Awakened Kid',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Punk Assign Kid',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Magnetism Mastery',type:'special',power:90,acc:87,pp:7,effect:null},3:{name:'Punk Collapse',type:'special',power:118,acc:80,pp:5,effect:null}}},
'op13':{stages:[{name:'Kaido of the Beasts',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Hybrid Form Kaido',level:15,boosts:{atk:8,def:6,spd:5,haki:5,df:5}},{name:'Flame Dragon Kaido',level:35,boosts:{atk:15,def:12,spd:10,haki:10,df:10}}],learnMoves:{2:{name:'Hybrid Dragon Explosion',type:'special',power:98,acc:86,pp:7,effect:null},3:{name:'Flame Calamity',type:'special',power:132,acc:75,pp:4,effect:null}}},
'op14':{stages:[{name:'Big Mom',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Ikoku Big Mom',level:15,boosts:{atk:8,def:6,spd:5,haki:5,df:5}},{name:'Misery Big Mom',level:35,boosts:{atk:15,def:12,spd:10,haki:10,df:10}}],learnMoves:{2:{name:'Soul Burst',type:'special',power:96,acc:85,pp:7,effect:null},3:{name:'Misery Wave',type:'special',power:130,acc:76,pp:4,effect:null}}},
'op15':{stages:[{name:'Young Doffy',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'String-String Doffy',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Awakened Doflamingo',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'String String Cage',type:'special',power:88,acc:87,pp:8,effect:null},3:{name:'White Paradise',type:'special',power:115,acc:80,pp:5,effect:null}}},
'op16':{stages:[{name:'Mr. 0 Crocodile',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Desert King Crocodile',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Cross Guild Crocodile',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Sand Tomb Barrage',type:'special',power:90,acc:85,pp:7,effect:null},3:{name:'Desert Apocalypse',type:'special',power:118,acc:78,pp:5,effect:null}}},
'op17':{stages:[{name:'CP9 Lucci',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Leopard Lucci',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Awakened Lucci',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Leopard Fang',type:'taijutsu',power:92,acc:88,pp:7,effect:null},3:{name:'Soru Soru Mastery',type:'special',power:120,acc:80,pp:5,effect:null}}},
'op18':{stages:[{name:'Marine Hunter Mihawk',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Greatest Swordsman',level:15,boosts:{atk:7,def:5,spd:4,haki:4,df:4}},{name:'Cross Guild Mihawk',level:35,boosts:{atk:12,def:10,spd:8,haki:8,df:8}}],learnMoves:{2:{name:'Black Blade Descent',type:'sword',power:95,acc:90,pp:7,effect:null},3:{name:'Night Eternal',type:'kenjutsu',power:125,acc:82,pp:4,effect:null}}},
'op19':{stages:[{name:'Blackbeard',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Yami Yami Teach',level:15,boosts:{atk:7,def:5,spd:4,haki:4,df:4}},{name:'Dual Fruit Blackbeard',level:35,boosts:{atk:12,def:10,spd:8,haki:8,df:8}}],learnMoves:{2:{name:'Vortex Darkness',type:'special',power:93,acc:87,pp:7,effect:null},3:{name:'Earthquake Supremacy',type:'special',power:128,acc:78,pp:4,effect:null}}},
'op20':{stages:[{name:'Red Hair Shanks',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Conqueror Shanks',level:15,boosts:{atk:8,def:6,spd:5,haki:5,df:5}},{name:'Divine Departure Shanks',level:35,boosts:{atk:15,def:12,spd:10,haki:10,df:10}}],learnMoves:{2:{name:'Conquerors Domination',type:'haki',power:96,acc:85,pp:7,effect:null},3:{name:'Red Destiny',type:'special',power:130,acc:80,pp:4,effect:null}}},
'op21':{stages:[{name:'Whitebeard',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Quake Man Whitebeard',level:15,boosts:{atk:8,def:6,spd:5,haki:5,df:5}},{name:'Strongest Man Alive',level:35,boosts:{atk:15,def:12,spd:10,haki:10,df:10}}],learnMoves:{2:{name:'Earthquake Wave',type:'special',power:97,acc:86,pp:7,effect:null},3:{name:'World Destruction',type:'special',power:132,acc:75,pp:4,effect:null}}},
'op22':{stages:[{name:'Admiral Akainu',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Magma Fist Akainu',level:15,boosts:{atk:7,def:5,spd:4,haki:4,df:4}},{name:'Fleet Admiral Sakazuki',level:35,boosts:{atk:12,def:10,spd:8,haki:8,df:8}}],learnMoves:{2:{name:'Magma Fist Eruption',type:'special',power:94,acc:86,pp:7,effect:null},3:{name:'Absolute Justice',type:'special',power:126,acc:78,pp:4,effect:null}}},
'op23':{stages:[{name:'Fire Fist Ace',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Entei Ace',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Flame Emperor Ace',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Entei Prison',type:'special',power:89,acc:85,pp:8,effect:null},3:{name:'Flame Emperor Crown',type:'special',power:119,acc:80,pp:5,effect:null}}},
'op24':{stages:[{name:'Sweet Commander Katakuri',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Mochi Katakuri',level:15,boosts:{atk:7,def:5,spd:4,haki:4,df:4}},{name:'Awakened Katakuri',level:35,boosts:{atk:12,def:10,spd:8,haki:8,df:8}}],learnMoves:{2:{name:'Mochi Blade Storm',type:'special',power:93,acc:87,pp:7,effect:null},3:{name:'Perfection Unleashed',type:'special',power:124,acc:80,pp:4,effect:null}}},
'op25':{stages:[{name:'All-Star King',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Lunarian King',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Inferno King',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Lunarian Flame',type:'special',power:91,acc:86,pp:7,effect:null},3:{name:'Infernal Ascension',type:'special',power:118,acc:79,pp:5,effect:null}}},
'op26':{stages:[{name:'All-Star Queen',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Brachio Queen',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Cyborg Queen',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Brachio Mastery',type:'special',power:89,acc:85,pp:7,effect:null},3:{name:'Virus Supremacy',type:'special',power:117,acc:80,pp:5,effect:null}}},
'op27':{stages:[{name:'Headliner Ulti',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Pachycephalosaurus Ulti',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Dino Headbutt',type:'taijutsu',power:81,acc:85,pp:8,effect:null}}},
'op28':{stages:[{name:'Headliner Black Maria',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Rosamygale Maria',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Web Prison',type:'special',power:79,acc:83,pp:8,effect:null}}},
'op29':{stages:[{name:'Headliner Sasaki',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Triceratops Sasaki',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Trice Charge',type:'taijutsu',power:80,acc:84,pp:8,effect:null}}},
'op30':{stages:[{name:'Headliner Whos Who',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Sabertooth Whos Who',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Feline Fury',type:'taijutsu',power:82,acc:86,pp:7,effect:null}}},
'op31':{stages:[{name:'Ghost Princess',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Hollow Perona',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Ghost Mastery',type:'special',power:76,acc:82,pp:8,effect:null}}},
'op32':{stages:[{name:'Mad Scientist Caesar',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Shinokuni Caesar',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Gas Cloud Doom',type:'special',power:75,acc:80,pp:8,effect:null}}},
'op33':{stages:[{name:'Young Roger',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Pirate King Roger',level:15,boosts:{atk:8,def:6,spd:5,haki:5,df:5}},{name:'Divine Departure Roger',level:35,boosts:{atk:15,def:12,spd:10,haki:10,df:10}}],learnMoves:{2:{name:'Kings Will',type:'haki',power:97,acc:86,pp:7,effect:null},3:{name:'Final Legacy',type:'special',power:131,acc:80,pp:4,effect:null}}},
'op34':{stages:[{name:'Young Garp',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Garp the Fist',level:15,boosts:{atk:8,def:6,spd:5,haki:5,df:5}},{name:'Garp the Hero',level:35,boosts:{atk:15,def:12,spd:10,haki:10,df:10}}],learnMoves:{2:{name:'Justice Cannon',type:'special',power:96,acc:87,pp:7,effect:null},3:{name:'Heros Legacy',type:'special',power:129,acc:80,pp:4,effect:null}}},
'op35':{stages:[{name:'Admiral Aokiji',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Ice Age Aokiji',level:15,boosts:{atk:7,def:5,spd:4,haki:4,df:4}},{name:'Blackbeard Kuzan',level:35,boosts:{atk:12,def:10,spd:8,haki:8,df:8}}],learnMoves:{2:{name:'Ice Age Apocalypse',type:'special',power:92,acc:85,pp:7,effect:null},3:{name:'Eternal Frost',type:'special',power:123,acc:79,pp:4,effect:null}}},
'op36':{stages:[{name:'Admiral Kizaru',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Light Speed Kizaru',level:15,boosts:{atk:7,def:5,spd:4,haki:4,df:4}},{name:'Yasakani Kizaru',level:35,boosts:{atk:12,def:10,spd:8,haki:8,df:8}}],learnMoves:{2:{name:'Light Speed Barrage',type:'special',power:91,acc:86,pp:7,effect:null},3:{name:'Mirror World Destruction',type:'special',power:122,acc:80,pp:4,effect:null}}},
'op37':{stages:[{name:'Young Rayleigh',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Dark King Rayleigh',level:15,boosts:{atk:7,def:5,spd:4,haki:4,df:4}},{name:'Legend Rayleigh',level:35,boosts:{atk:12,def:10,spd:8,haki:8,df:8}}],learnMoves:{2:{name:'Haki Sword Mastery',type:'sword',power:94,acc:89,pp:7,effect:null},3:{name:'Dark King Supremacy',type:'special',power:126,acc:82,pp:4,effect:null}}},
'op38':{stages:[{name:'God Enel',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Raigo Enel',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Thunder God Descent',type:'special',power:84,acc:83,pp:7,effect:null}}},
'op39':{stages:[{name:'Flying Pirate Shiki',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Golden Lion Shiki',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Legend Shiki',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Floating Paradise',type:'special',power:88,acc:85,pp:7,effect:null},3:{name:'Sky Pierce',type:'special',power:116,acc:80,pp:5,effect:null}}},
'op40':{stages:[{name:'Inspector Sengoku',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Buddha Sengoku',level:15,boosts:{atk:7,def:5,spd:4,haki:4,df:4}},{name:'Fleet Admiral Sengoku',level:35,boosts:{atk:12,def:10,spd:8,haki:8,df:8}}],learnMoves:{2:{name:'Buddha Salvation',type:'special',power:93,acc:86,pp:7,effect:null},3:{name:'Divine Judgment',type:'special',power:125,acc:80,pp:4,effect:null}}},
'op41':{stages:[{name:'Young Sabo',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Flame Emperor Sabo',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Dragon Claw Sabo',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Flame Throne',type:'special',power:90,acc:86,pp:7,effect:null},3:{name:'Dragon Claw Flame',type:'special',power:120,acc:80,pp:5,effect:null}}},
'op42':{stages:[{name:'Revolutionary Dragon',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Worlds Most Wanted',level:15,boosts:{atk:8,def:6,spd:5,haki:5,df:5}},{name:'Storm Dragon',level:35,boosts:{atk:15,def:12,spd:10,haki:10,df:10}}],learnMoves:{2:{name:'Wind Blade Revolution',type:'special',power:98,acc:86,pp:7,effect:null},3:{name:'Storm Dragon Wrath',type:'special',power:132,acc:76,pp:4,effect:null}}},
'op43':{stages:[{name:'Snake Princess',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Love-Love Hancock',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Empress Hancock',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Love Concentration',type:'special',power:87,acc:85,pp:8,effect:null},3:{name:'Empress Perfection',type:'special',power:115,acc:80,pp:5,effect:null}}},
'op44':{stages:[{name:'Tyrant Kuma',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Pacifista Kuma',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Nika Kuma',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Repel Meteor',type:'special',power:91,acc:85,pp:7,effect:null},3:{name:'Nika Upgrade',type:'special',power:119,acc:80,pp:5,effect:null}}},
'op45':{stages:[{name:'Shadow Master Moria',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Shadow Asgard Moria',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Shadow Army Swarm',type:'special',power:80,acc:82,pp:8,effect:null}}},
'op46':{stages:[{name:'Clown Buggy',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Emperor Buggy',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Separation Supremacy',type:'special',power:77,acc:81,pp:8,effect:null}}},
'op47':{stages:[{name:'Young Oden',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Daimyo Oden',level:15,boosts:{atk:7,def:5,spd:4,haki:4,df:4}},{name:'Legend Oden',level:35,boosts:{atk:12,def:10,spd:8,haki:8,df:8}}],learnMoves:{2:{name:'Twin Sword Dance',type:'sword',power:93,acc:89,pp:7,effect:null},3:{name:'Heaven Piercing Slash',type:'kenjutsu',power:127,acc:82,pp:4,effect:null}}},
'op48':{stages:[{name:'Oni Princess Yamato',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Guardian Yamato',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Ice Wolf Yamato',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Oni Mastery',type:'special',power:88,acc:86,pp:8,effect:null},3:{name:'Ice Wolf Supremacy',type:'special',power:117,acc:80,pp:5,effect:null}}},
'op49':{stages:[{name:'First Division Marco',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Phoenix Marco',level:15,boosts:{atk:7,def:5,spd:4,haki:4,df:4}},{name:'Blue Flame Marco',level:35,boosts:{atk:12,def:10,spd:8,haki:8,df:8}}],learnMoves:{2:{name:'Phoenix Regeneration',type:'special',power:90,acc:87,pp:7,effect:null},3:{name:'Blue Flame Resurrection',type:'special',power:124,acc:80,pp:4,effect:null}}},
'op50':{stages:[{name:'Third Division Jozu',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Diamond Jozu',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Brilliant Jozu',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Diamond Armor',type:'special',power:86,acc:88,pp:8,effect:null},3:{name:'Brilliant Crushing',type:'special',power:114,acc:81,pp:5,effect:null}}},
'op51':{stages:[{name:'Fifth Division Vista',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Flower Sword Vista',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Vista of the Roses',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Flower Blade Elegance',type:'sword',power:89,acc:88,pp:7,effect:null},3:{name:'Rose Garden Mastery',type:'kenjutsu',power:116,acc:81,pp:5,effect:null}}},
'op52':{stages:[{name:'Head Jailer Shiryu',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Invisible Shiryu',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Clear-Clear Shiryu',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Invisibility Mastery',type:'special',power:87,acc:86,pp:8,effect:null},3:{name:'Clear World Slice',type:'special',power:115,acc:80,pp:5,effect:null}}},
'op53':{stages:[{name:'Shadow Ruler Imu',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'World Sovereign Imu',level:15,boosts:{atk:8,def:6,spd:5,haki:5,df:5}},{name:'Imu of the Throne',level:35,boosts:{atk:15,def:12,spd:10,haki:10,df:10}}],learnMoves:{2:{name:'World Erasure',type:'special',power:99,acc:84,pp:6,effect:null},3:{name:'Throne Annihilation',type:'special',power:134,acc:74,pp:3,effect:null}}},
'op54':{stages:[{name:'Elder Saturn',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Sandworm Saturn',level:15,boosts:{atk:7,def:5,spd:4,haki:4,df:4}},{name:'Ushi-Oni Saturn',level:35,boosts:{atk:12,def:10,spd:8,haki:8,df:8}}],learnMoves:{2:{name:'Sandworm Tunnel',type:'special',power:92,acc:85,pp:7,effect:null},3:{name:'Ushi-Oni Transformation',type:'special',power:127,acc:78,pp:4,effect:null}}},
'op55':{stages:[{name:'Admiral Fujitora',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Gravity Blade Fujitora',level:15,boosts:{atk:7,def:5,spd:4,haki:4,df:4}},{name:'Meteor Strike Fujitora',level:35,boosts:{atk:12,def:10,spd:8,haki:8,df:8}}],learnMoves:{2:{name:'Gravity Sword Impact',type:'special',power:91,acc:86,pp:7,effect:null},3:{name:'Meteor Shower Collapse',type:'special',power:125,acc:79,pp:4,effect:null}}},
'op56':{stages:[{name:'Admiral Ryokugyu',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Forest Admiral',level:15,boosts:{atk:7,def:5,spd:4,haki:4,df:4}},{name:'Wood-Wood Ryokugyu',level:35,boosts:{atk:12,def:10,spd:8,haki:8,df:8}}],learnMoves:{2:{name:'Forest Growth Rush',type:'special',power:90,acc:85,pp:7,effect:null},3:{name:'Wood Dominion',type:'special',power:123,acc:80,pp:4,effect:null}}},
'op57':{stages:[{name:'First Mate Beckman',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Genius Beckman',level:15,boosts:{atk:7,def:5,spd:4,haki:4,df:4}},{name:'Beckman the Rival',level:35,boosts:{atk:12,def:10,spd:8,haki:8,df:8}}],learnMoves:{2:{name:'Genius Strategy',type:'special',power:89,acc:88,pp:7,effect:null},3:{name:'Legendary Rival Clash',type:'special',power:121,acc:81,pp:4,effect:null}}},
'op58':{stages:[{name:'Massacre Soldier',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Punisher Killer',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Punisher Blade Impact',type:'special',power:82,acc:85,pp:8,effect:null}}},
'op59':{stages:[{name:'Marine Spy Drake',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Allosaurus Drake',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Dino Assault',type:'taijutsu',power:81,acc:84,pp:8,effect:null}}},
'op60':{stages:[{name:'Magician Hawkins',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Straw Man Hawkins',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Straw Puppet Army',type:'special',power:78,acc:83,pp:8,effect:null}}},
'op61':{stages:[{name:'Roar of the Sea',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Sound Blast Apoo',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Sonic Boom Barrage',type:'special',power:80,acc:82,pp:8,effect:null}}},
'op62':{stages:[{name:'Gang Bege',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Big Father Bege',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Castle Fortification',type:'special',power:79,acc:84,pp:8,effect:null}}},
'op63':{stages:[{name:'Mad Monk Urouge',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Damage Convert Urouge',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Pain Amplification',type:'special',power:81,acc:83,pp:8,effect:null}}},
'op64':{stages:[{name:'Big Eater Bonney',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Nika Bonney',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Age Acceleration',type:'special',power:77,acc:81,pp:8,effect:null}}},
'op65':{stages:[{name:'Cabin Boy Koby',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Captain Koby',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Future Foresight',type:'special',power:76,acc:82,pp:8,effect:null}}},
'op66':{stages:[{name:'Captain Smoker',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Vice Admiral Smoker',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Smoke Screen Mastery',type:'special',power:78,acc:84,pp:8,effect:null}}},
'op67':{stages:[{name:'Guard Sentomaru',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Commander Sentomaru',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Pacifista Control',type:'special',power:80,acc:85,pp:7,effect:null}}},
'op68':{stages:[{name:'Warden Magellan',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Venom Demon Magellan',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Hydra Magellan',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Poison Dragon Fury',type:'special',power:89,acc:84,pp:7,effect:null},3:{name:'Hydra Apocalypse',type:'special',power:118,acc:79,pp:5,effect:null}}},
'op69':{stages:[{name:'Vice Admiral Tsuru',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Great Staff Tsuru',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Washing Chain Mastery',type:'special',power:79,acc:85,pp:8,effect:null}}},
'op70':{stages:[{name:'Admiral Kong',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Commander in Chief Kong',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Supreme Kong',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Kongs Authority',type:'special',power:88,acc:87,pp:7,effect:null},3:{name:'Supreme Power',type:'special',power:117,acc:80,pp:5,effect:null}}},
'op71':{stages:[{name:'Supersonic Augur',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Warp-Warp Augur',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Warp Teleport',type:'special',power:76,acc:80,pp:8,effect:null}}},
'op72':{stages:[{name:'Corrupt King Pizarro',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Island-Island Pizarro',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Island Merger',type:'special',power:83,acc:83,pp:7,effect:null}}},
'op73':{stages:[{name:'Sweet Commander Cracker',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Biscuit Soldier Cracker',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Infinite Army Cracker',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Biscuit Army Surge',type:'special',power:87,acc:85,pp:8,effect:null},3:{name:'Infinite Arsenal',type:'special',power:116,acc:80,pp:5,effect:null}}},
'op74':{stages:[{name:'Sweet Commander Smoothie',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Wring-Wring Smoothie',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Giant Smoothie',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Juice Extraction',type:'special',power:88,acc:85,pp:7,effect:null},3:{name:'Giant Growth Form',type:'special',power:119,acc:80,pp:5,effect:null}}},
'op75':{stages:[{name:'Candy Man Perospero',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Candy Maiden Perospero',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Candy Fortress Prison',type:'special',power:80,acc:84,pp:8,effect:null}}},
'op76':{stages:[{name:'Heat-Heat Oven',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Nekketsu Oven',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Heat Armor Mastery',type:'special',power:81,acc:85,pp:8,effect:null}}},
'op77':{stages:[{name:'All-Star Jack',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Mammoth Jack',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Jack the Drought',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Mammoth Crush',type:'taijutsu',power:90,acc:86,pp:7,effect:null},3:{name:'Drought Supremacy',type:'special',power:118,acc:80,pp:5,effect:null}}},
'op78':{stages:[{name:'Headliner Page One',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Spinosaurus Page One',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Spinosaurus Fang',type:'taijutsu',power:79,acc:85,pp:8,effect:null}}},
'op79':{stages:[{name:'Foxfire Kinemon',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Akazaya Kinemon',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Akazaya Fury',type:'special',power:81,acc:85,pp:8,effect:null}}},
'op80':{stages:[{name:'Kyoshiro',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Denjiro Unmasked',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Scabbard Blade Art',type:'sword',power:82,acc:86,pp:8,effect:null}}},
'op81':{stages:[{name:'Duke Inuarashi',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Sulong Inuarashi',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Sulong Beast Fury',type:'taijutsu',power:80,acc:84,pp:8,effect:null}}},
'op82':{stages:[{name:'Boss Nekomamushi',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Sulong Nekomamushi',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Sulong Cat Assault',type:'taijutsu',power:81,acc:85,pp:8,effect:null}}},
'op83':{stages:[{name:'Bandit Ashura',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Ashura the Scabbard',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Ashura Blade Strike',type:'sword',power:83,acc:86,pp:8,effect:null}}},
'op84':{stages:[{name:'Kawamatsu the Kappa',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Yokozuna Kawamatsu',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Sumo Champion Crush',type:'taijutsu',power:82,acc:85,pp:8,effect:null}}},
'op85':{stages:[{name:'Commander Izo',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Gunslinger Izo',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Gun Mastery Barrage',type:'special',power:80,acc:85,pp:8,effect:null}}},
'op86':{stages:[{name:'Emporio Ivankov',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Hormone Monster Ivankov',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Hormone Conversion Mastery',type:'special',power:79,acc:82,pp:8,effect:null}}},
'op87':{stages:[{name:'Cannibal Bartolomeo',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Barrier Crash Bartolomeo',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Barrier Wall Smash',type:'special',power:81,acc:84,pp:8,effect:null}}},
'op88':{stages:[{name:'White Horse Cavendish',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Hakuba',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Hakuba Rampage',type:'taijutsu',power:83,acc:85,pp:7,effect:null}}},
'op89':{stages:[{name:'Self-Proclaimed Son',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Whitebeard Jr. Weevil',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Rampage Weevil',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Quake Slash Rampage',type:'special',power:89,acc:85,pp:7,effect:null},3:{name:'Unstoppable Fury',type:'special',power:117,acc:80,pp:5,effect:null}}},
'op90':{stages:[{name:'CP9 Kaku',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Giraffe Kaku',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Giraffe Sword Mastery',type:'sword',power:81,acc:86,pp:8,effect:null}}},
'op91':{stages:[{name:'CP9 Jabra',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Wolf Jabra',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Wolf Beast Attack',type:'taijutsu',power:80,acc:85,pp:8,effect:null}}},
'op92':{stages:[{name:'Arlong the Saw',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Shark Arlong',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Shark Teeth Fury',type:'taijutsu',power:78,acc:83,pp:8,effect:null}}},
'op93':{stages:[{name:'Mr. 2 Bon Clay',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Newkama Bon Clay',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Okama Kenpo Mastery',type:'taijutsu',power:76,acc:81,pp:8,effect:null}}},
'op94':{stages:[{name:'Commander Vergo',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Full-Body Haki Vergo',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Haki Armor Mastery',type:'haki',power:79,acc:85,pp:8,effect:null}}},
'op95':{stages:[{name:'Hero Diamante',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Flutter-Flutter Diamante',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Flutter Blade Mastery',type:'special',power:80,acc:84,pp:8,effect:null}}},
'op96':{stages:[{name:'Executive Pica',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Stone Giant Pica',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Stone Colossus Crush',type:'special',power:82,acc:83,pp:8,effect:null}}},
'op97':{stages:[{name:'Jaguar Pedro',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Electro Pedro',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Electro Jaguar Pounce',type:'special',power:81,acc:84,pp:8,effect:null}}},
'op98':{stages:[{name:'Young Momonosuke',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Dragon Momonosuke',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Dragon Ascension',type:'special',power:75,acc:80,pp:8,effect:null}}},
'op99':{stages:[{name:'Red Hair Roux',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Quick Draw Roux',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Berserker Roux',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Gun Mastery',type:'special',power:88,acc:86,pp:7,effect:null},3:{name:'Berserker Rampage',type:'special',power:117,acc:80,pp:5,effect:null}}},
'op100':{stages:[{name:'Red Hair Yasopp',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Eagle Eye Yasopp',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Observation Master Yasopp',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Eagle Eye Precision',type:'special',power:87,acc:88,pp:7,effect:null},3:{name:'Observation Mastery',type:'special',power:116,acc:81,pp:5,effect:null}}},
'op101':{stages:[{name:'Young Rocks',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'God Valley Rocks',level:15,boosts:{atk:8,def:6,spd:5,haki:5,df:5}},{name:'Rocks the Conqueror',level:35,boosts:{atk:15,def:12,spd:10,haki:10,df:10}}],learnMoves:{2:{name:'God Valley Dominance',type:'special',power:99,acc:85,pp:7,effect:null},3:{name:'Conqueror Supremacy',type:'special',power:133,acc:74,pp:3,effect:null}}},
'op102':{stages:[{name:'Hyena Bellamy',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Spring Bellamy',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Spring Bomb Bounce',type:'special',power:74,acc:80,pp:8,effect:null}}},
'nr1':{stages:[{name:'Genin Naruto',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Sage Mode Naruto',level:15,boosts:{atk:8,def:6,spd:5,haki:5,df:5}},{name:'Baryon Mode Naruto',level:35,boosts:{atk:15,def:12,spd:10,haki:10,df:10}}],learnMoves:{2:{name:'Sage Truth Seeker',type:'ninjutsu',power:99,acc:86,pp:7,effect:null},3:{name:'Baryon Devastation',type:'special',power:134,acc:75,pp:3,effect:null}}},
'nr2':{stages:[{name:'Genin Sasuke',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Mangekyo Sasuke',level:15,boosts:{atk:8,def:6,spd:5,haki:5,df:5}},{name:'Rinne Sasuke',level:35,boosts:{atk:15,def:12,spd:10,haki:10,df:10}}],learnMoves:{2:{name:'Amaterasu Inferno',type:'ninjutsu',power:98,acc:85,pp:7,effect:null},3:{name:'Rinnegan Annihilation',type:'special',power:132,acc:76,pp:3,effect:null}}},
'nr3':{stages:[{name:'Genin Sakura',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Byakugou Sakura',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Byakugou Healing Punch',type:'taijutsu',power:81,acc:85,pp:8,effect:null}}},
'nr4':{stages:[{name:'Copy Ninja Kakashi',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Mangekyo Kakashi',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'DMS Kakashi',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Kamui Dimension',type:'special',power:91,acc:86,pp:7,effect:null},3:{name:'Dual Mangekyou Mastery',type:'special',power:120,acc:80,pp:5,effect:null}}},
'nr5':{stages:[{name:'Anbu Itachi',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Mangekyo Itachi',level:15,boosts:{atk:7,def:5,spd:4,haki:4,df:4}},{name:'Susanoo Itachi',level:35,boosts:{atk:12,def:10,spd:8,haki:8,df:8}}],learnMoves:{2:{name:'Tsukuyomi Torture',type:'genjutsu',power:94,acc:84,pp:7,effect:null},3:{name:'Susanoo Perfect Form',type:'special',power:128,acc:78,pp:4,effect:null}}},
'nr6':{stages:[{name:'Young Madara',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Edo Madara',level:15,boosts:{atk:8,def:6,spd:5,haki:5,df:5}},{name:'Six Paths Madara',level:35,boosts:{atk:15,def:12,spd:10,haki:10,df:10}}],learnMoves:{2:{name:'Edo Resurrection Power',type:'special',power:99,acc:85,pp:7,effect:null},3:{name:'Six Paths Supremacy',type:'special',power:133,acc:74,pp:3,effect:null}}},
'nr7':{stages:[{name:'Young Hashirama',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Wood Style Hashirama',level:15,boosts:{atk:8,def:6,spd:5,haki:5,df:5}},{name:'Sage Mode Hashirama',level:35,boosts:{atk:15,def:12,spd:10,haki:10,df:10}}],learnMoves:{2:{name:'Wood Dragon Technique',type:'ninjutsu',power:98,acc:86,pp:7,effect:null},3:{name:'True Sage Form',type:'special',power:131,acc:75,pp:3,effect:null}}},
'nr8':{stages:[{name:'Young Obito',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Masked Man Tobi',level:15,boosts:{atk:7,def:5,spd:4,haki:4,df:4}},{name:'Ten Tails Obito',level:35,boosts:{atk:12,def:10,spd:8,haki:8,df:8}}],learnMoves:{2:{name:'Masked Kamui Domain',type:'special',power:96,acc:84,pp:7,effect:null},3:{name:'Ten Tails Awakening',type:'special',power:129,acc:76,pp:4,effect:null}}},
'nr9':{stages:[{name:'Yahiko Pain',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Six Paths Pain',level:15,boosts:{atk:7,def:5,spd:4,haki:4,df:4}},{name:'Chibaku Tensei Pain',level:35,boosts:{atk:12,def:10,spd:8,haki:8,df:8}}],learnMoves:{2:{name:'Six Paths Mastery',type:'special',power:93,acc:85,pp:7,effect:null},3:{name:'Planetary Destruction',type:'special',power:126,acc:78,pp:4,effect:null}}},
'nr10':{stages:[{name:'Young Jiraiya',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Toad Sage Jiraiya',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Sage Mode Jiraiya',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Toad Swamp Technique',type:'ninjutsu',power:90,acc:85,pp:7,effect:null},3:{name:'Sage Art Mastery',type:'special',power:119,acc:80,pp:5,effect:null}}},
'nr11':{stages:[{name:'Young Tsunade',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Slug Princess Tsunade',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Creation Rebirth Tsunade',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Slug Healing Arts',type:'ninjutsu',power:88,acc:86,pp:8,effect:null},3:{name:'Creation Rebirth Perfection',type:'special',power:118,acc:80,pp:5,effect:null}}},
'nr12':{stages:[{name:'Young Orochimaru',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Snake Sage Orochimaru',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'White Snake Orochimaru',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Snake Sage Arts',type:'ninjutsu',power:92,acc:84,pp:7,effect:null},3:{name:'White Snake Form',type:'special',power:120,acc:79,pp:5,effect:null}}},
'nr13':{stages:[{name:'Young Minato',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Yellow Flash Minato',level:15,boosts:{atk:7,def:5,spd:4,haki:4,df:4}},{name:'KCM Minato',level:35,boosts:{atk:12,def:10,spd:8,haki:8,df:8}}],learnMoves:{2:{name:'Flying Raijin Mastery',type:'ninjutsu',power:95,acc:87,pp:7,effect:null},3:{name:'Kurama Mode Supremacy',type:'special',power:127,acc:79,pp:4,effect:null}}},
'nr14':{stages:[{name:'Jonin Guy',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Seven Gates Guy',level:15,boosts:{atk:7,def:5,spd:4,haki:4,df:4}},{name:'Eight Gates Guy',level:35,boosts:{atk:12,def:10,spd:8,haki:8,df:8}}],learnMoves:{2:{name:'Seventh Gate Explosion',type:'taijutsu',power:97,acc:85,pp:7,effect:null},3:{name:'Eighth Gate Apocalypse',type:'special',power:130,acc:75,pp:3,effect:null}}},
'nr15':{stages:[{name:'Genin Lee',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Fifth Gate Lee',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Gate Opening Mastery',type:'taijutsu',power:82,acc:84,pp:8,effect:null}}},
'nr16':{stages:[{name:'Chunin Exam Gaara',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Kazekage Gaara',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Ultimate Defense Gaara',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Sand Armor Mastery',type:'ninjutsu',power:89,acc:85,pp:7,effect:null},3:{name:'Desert Burial Coffin',type:'special',power:118,acc:80,pp:5,effect:null}}},
'nr17':{stages:[{name:'Jinchuriki Bee',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Eight Tails Bee',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Full Gyuki Bee',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Tailed Beast Bomb',type:'special',power:91,acc:84,pp:7,effect:null},3:{name:'Full Gyuki Control',type:'special',power:119,acc:80,pp:5,effect:null}}},
'nr18':{stages:[{name:'Genin Neji',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Jonin Neji',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Byakugan Mastery',type:'ninjutsu',power:80,acc:86,pp:8,effect:null}}},
'nr19':{stages:[{name:'Shy Hinata',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Twin Lion Fist Hinata',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Twin Lion Combination',type:'taijutsu',power:77,acc:83,pp:8,effect:null}}},
'nr20':{stages:[{name:'Lazy Shikamaru',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Strategist Shikamaru',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Shadow Strategy Mastery',type:'ninjutsu',power:79,acc:85,pp:8,effect:null}}},
'nr21':{stages:[{name:'Spy Kabuto',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Snake Kabuto',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Sage Mode Kabuto',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Snake Transformation',type:'ninjutsu',power:88,acc:85,pp:7,effect:null},3:{name:'Sage Kabuto Perfection',type:'special',power:117,acc:80,pp:5,effect:null}}},
'nr22':{stages:[{name:'Akatsuki Deidara',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'C4 Karura Deidara',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'C4 Clay Explosion',type:'special',power:84,acc:82,pp:7,effect:null}}},
'nr23':{stages:[{name:'Akatsuki Sasori',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Hundred Puppets Sasori',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Puppet Army Control',type:'special',power:81,acc:83,pp:8,effect:null}}},
'nr24':{stages:[{name:'Akatsuki Kisame',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Samehada Fusion Kisame',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Shark Skin Kisame',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Water Prison Mastery',type:'ninjutsu',power:89,acc:84,pp:7,effect:null},3:{name:'Shark Skin Dominance',type:'special',power:118,acc:80,pp:5,effect:null}}},
'nr25':{stages:[{name:'Akatsuki Hidan',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Jashin Ritual Hidan',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Immortal Curse',type:'special',power:80,acc:83,pp:8,effect:null}}},
'nr26':{stages:[{name:'Akatsuki Kakuzu',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Five Hearts Kakuzu',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Five Element Mastery',type:'special',power:82,acc:84,pp:8,effect:null}}},
'nr27':{stages:[{name:'Akatsuki Konan',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Paper Ocean Konan',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Paper Angel Mastery',type:'special',power:79,acc:82,pp:8,effect:null}}},
'nr28':{stages:[{name:'Demon of the Mist',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Hidden Mist Zabuza',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Mist Sword Technique',type:'sword',power:81,acc:85,pp:8,effect:null}}},
'nr29':{stages:[{name:'Ice Mirror Haku',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Crystal Ice Haku',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Ice Crystal Mastery',type:'ninjutsu',power:76,acc:81,pp:8,effect:null}}},
'nr30':{stages:[{name:'Young Tobirama',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Lord Second',level:15,boosts:{atk:7,def:5,spd:4,haki:4,df:4}},{name:'Edo Tensei Creator',level:35,boosts:{atk:12,def:10,spd:8,haki:8,df:8}}],learnMoves:{2:{name:'Water Shark Mastery',type:'ninjutsu',power:94,acc:86,pp:7,effect:null},3:{name:'Edo Tensei Perfection',type:'special',power:126,acc:79,pp:4,effect:null}}},
'nr31':{stages:[{name:'Young Hiruzen',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'God of Shinobi',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Reaper Death Seal Hiruzen',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'God-Level Jutsu',type:'ninjutsu',power:91,acc:85,pp:7,effect:null},3:{name:'Reaper Death Seal',type:'special',power:120,acc:80,pp:5,effect:null}}},
'nr32':{stages:[{name:'Root Leader Danzo',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Izanagi Danzo',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Izanagi Genjutsu',type:'genjutsu',power:81,acc:82,pp:7,effect:null}}},
'nr33':{stages:[{name:'Sealed Kaguya',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Rinne Sharingan Kaguya',level:15,boosts:{atk:8,def:6,spd:5,haki:5,df:5}},{name:'All-Killing Ash Kaguya',level:35,boosts:{atk:15,def:12,spd:10,haki:10,df:10}}],learnMoves:{2:{name:'Rinne Sharingan Vision',type:'special',power:99,acc:84,pp:7,effect:null},3:{name:'All-Killing Ash Bones',type:'special',power:134,acc:74,pp:3,effect:null}}},
'nr34':{stages:[{name:'Genin Temari',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Wind Scythe Temari',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Wind Scythe Mastery',type:'ninjutsu',power:77,acc:82,pp:8,effect:null}}},
'nr35':{stages:[{name:'Genin Ino',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Sensory Ino',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Mind Transfer Mastery',type:'ninjutsu',power:76,acc:81,pp:8,effect:null}}},
'nr36':{stages:[{name:'Genin Kiba',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Fang Over Fang Kiba',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Four Legged Beast',type:'taijutsu',power:78,acc:83,pp:8,effect:null}}},
'nr37':{stages:[{name:'Jonin Asuma',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Guardian Ninja Asuma',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Chakra Blade Mastery',type:'special',power:80,acc:84,pp:8,effect:null}}},
'nr38':{stages:[{name:'Anbu Tenzo',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Wood Style Yamato',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Wood Prison Technique',type:'ninjutsu',power:79,acc:84,pp:8,effect:null}}},
'nr39':{stages:[{name:'Genin Shino',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Insect Swarm Shino',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Parasite Swarm Control',type:'ninjutsu',power:76,acc:82,pp:8,effect:null}}},
'nr40':{stages:[{name:'Genin Choji',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Butterfly Mode Choji',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Butterfly Transformation',type:'special',power:81,acc:83,pp:8,effect:null}}},
'nr41':{stages:[{name:'Young Shisui',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Teleporter Shisui',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Kotoamatsukami Shisui',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Shisui Teleportation',type:'ninjutsu',power:88,acc:87,pp:7,effect:null},3:{name:'Kotoamatsukami Genjutsu',type:'genjutsu',power:119,acc:80,pp:5,effect:null}}},
'nr42':{stages:[{name:'Young Ay',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Lightning Armor Ay',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Raikage Ay',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Lightning Speed Mastery',type:'ninjutsu',power:90,acc:86,pp:7,effect:null},3:{name:'Raikage Supremacy',type:'special',power:119,acc:80,pp:5,effect:null}}},
'nr43':{stages:[{name:'Young Ohnoki',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Tsuchikage Ohnoki',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Particle Style Ohnoki',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Earth Style Mastery',type:'ninjutsu',power:89,acc:85,pp:7,effect:null},3:{name:'Particle Style Destruction',type:'special',power:118,acc:80,pp:5,effect:null}}},
'nr44':{stages:[{name:'Sound Five Kimimaro',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Bone Armored Kimimaro',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Bone Forest Prison',type:'special',power:81,acc:83,pp:8,effect:null}}},
'nr45':{stages:[{name:'Young Hagoromo',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Sage of Six Paths',level:15,boosts:{atk:8,def:6,spd:5,haki:5,df:5}},{name:'Juubi Jinchuriki Hagoromo',level:35,boosts:{atk:15,def:12,spd:10,haki:10,df:10}}],learnMoves:{2:{name:'Six Paths Technique',type:'special',power:99,acc:85,pp:7,effect:null},3:{name:'Ten Tails Power',type:'special',power:133,acc:74,pp:3,effect:null}}},
'nr46':{stages:[{name:'Young Mei',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Mizukage Mei',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Lava Style Mastery',type:'ninjutsu',power:80,acc:84,pp:8,effect:null}}},
'nr47':{stages:[{name:'Moon Toneri',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Tenseigan Toneri',level:15,boosts:{atk:7,def:5,spd:4,haki:4,df:4}},{name:'Golden Wheel Toneri',level:35,boosts:{atk:12,def:10,spd:8,haki:8,df:8}}],learnMoves:{2:{name:'Tenseigan Power',type:'special',power:92,acc:85,pp:7,effect:null},3:{name:'Golden Wheel Cutter',type:'special',power:124,acc:79,pp:4,effect:null}}},
'nr48':{stages:[{name:'Young Third Raikage',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Strongest Shield',level:15,boosts:{atk:7,def:5,spd:4,haki:4,df:4}},{name:'Hell Stab Raikage',level:35,boosts:{atk:12,def:10,spd:8,haki:8,df:8}}],learnMoves:{2:{name:'Spear of Heaven',type:'ninjutsu',power:95,acc:86,pp:7,effect:null},3:{name:'Hell Stab Mastery',type:'special',power:128,acc:78,pp:4,effect:null}}},
'nr49':{stages:[{name:'Second Tsuchikage',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Invisible Mu',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Fission Mu',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Particle Clones',type:'ninjutsu',power:87,acc:85,pp:8,effect:null},3:{name:'Fission Explosion',type:'special',power:117,acc:80,pp:5,effect:null}}},
'nr50':{stages:[{name:'Second Mizukage',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Giant Clam Gengetsu',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Mirage Gengetsu',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Water Mirage Art',type:'ninjutsu',power:88,acc:84,pp:8,effect:null},3:{name:'Clam Shell Mastery',type:'special',power:116,acc:80,pp:5,effect:null}}},
'nr51':{stages:[{name:'Fourth Mizukage',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Three Tails Yagura',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Full Isobu Yagura',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Tailed Beast Ball',type:'special',power:90,acc:84,pp:7,effect:null},3:{name:'Isobu Control Perfect',type:'special',power:119,acc:80,pp:5,effect:null}}},
'nr52':{stages:[{name:'Kazekage Rasa',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Gold Dust Rasa',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Gold Dust Shield Wall',type:'special',power:79,acc:84,pp:8,effect:null}}},
'nr53':{stages:[{name:'Cloud Yugito',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Two Tails Yugito',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Two Tails Fire Bomb',type:'special',power:80,acc:83,pp:8,effect:null}}},
'nr54':{stages:[{name:'Jinchuriki Roshi',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Lava Style Roshi',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Lava Release Technique',type:'ninjutsu',power:81,acc:83,pp:8,effect:null}}},
'nr55':{stages:[{name:'Jinchuriki Han',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Steam Armor Han',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Steam Bomb Technique',type:'special',power:80,acc:84,pp:8,effect:null}}},
'nr56':{stages:[{name:'Jinchuriki Utakata',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Bubble Style Utakata',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Bubble Explosion',type:'special',power:79,acc:82,pp:8,effect:null}}},
'nr57':{stages:[{name:'Jinchuriki Fu',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Seven Tails Fu',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Seven Tails Bomb',type:'special',power:80,acc:83,pp:8,effect:null}}},
'nr58':{stages:[{name:'Kaguyas Will',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'True Form Zetsu',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Black White Merge',type:'special',power:75,acc:80,pp:8,effect:null}}},
'nr59':{stages:[{name:'Clone Zetsu',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Spiral Zetsu',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Spiral Bomb Technique',type:'special',power:74,acc:79,pp:8,effect:null}}},
'nr60':{stages:[{name:'Young Hanzo',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Hanzo the Salamander',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Demigod Hanzo',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Salamander Venom',type:'special',power:88,acc:84,pp:7,effect:null},3:{name:'Demigod Supremacy',type:'special',power:117,acc:80,pp:5,effect:null}}},
'nr61':{stages:[{name:'Sound Four Tayuya',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Curse Mark Tayuya',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Flute Demon Art',type:'special',power:76,acc:81,pp:8,effect:null}}},
'nr62':{stages:[{name:'Sound Four Kidomaru',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Curse Mark Kidomaru',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Spider Web Prison',type:'special',power:77,acc:82,pp:8,effect:null}}},
'nr63':{stages:[{name:'Sound Four Sakon',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Merged Form Sakon',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Twin Body Fusion',type:'special',power:78,acc:83,pp:8,effect:null}}},
'nr64':{stages:[{name:'Sound Four Jirobo',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Curse Mark Jirobo',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Earth Style Mastery',type:'ninjutsu',power:76,acc:81,pp:8,effect:null}}},
'nr65':{stages:[{name:'Genin Kankuro',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Puppet Master Kankuro',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Puppet Army Control',type:'special',power:80,acc:84,pp:8,effect:null}}},
'nr66':{stages:[{name:'Elder Chiyo',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Ten Puppets Chiyo',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Ten Puppet Mastery',type:'special',power:82,acc:85,pp:7,effect:null}}},
'nr67':{stages:[{name:'Taka Suigetsu',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Demon of the Mist Suigetsu',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Water Form Mastery',type:'ninjutsu',power:79,acc:83,pp:8,effect:null}}},
'nr68':{stages:[{name:'Taka Jugo',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Sage Transformation Jugo',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Sage Power Release',type:'special',power:81,acc:84,pp:8,effect:null}}},
'nr69':{stages:[{name:'Taka Karin',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Uzumaki Chains Karin',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Chakra Chains Control',type:'special',power:76,acc:81,pp:8,effect:null}}},
'nr70':{stages:[{name:'Cloud Jonin Darui',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Storm Release Darui',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Fifth Raikage Darui',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Storm Release Mastery',type:'ninjutsu',power:89,acc:85,pp:7,effect:null},3:{name:'Raikage Authority',type:'special',power:118,acc:80,pp:5,effect:null}}},
'nr71':{stages:[{name:'Cloud Genin Omoi',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Lightning Blade Omoi',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Lightning Sword Mastery',type:'ninjutsu',power:77,acc:82,pp:8,effect:null}}},
'nr72':{stages:[{name:'Young Chojuro',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Sixth Mizukage Chojuro',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Sword Shark Technique',type:'sword',power:80,acc:85,pp:8,effect:null}}},
'nr73':{stages:[{name:'Root Anbu Sai',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Super Beast Scroll Sai',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Beast Scroll Art',type:'special',power:79,acc:84,pp:8,effect:null}}},
'nr74':{stages:[{name:'Academy Konohamaru',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Rasengan Konohamaru',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Rasengan Mastery',type:'ninjutsu',power:76,acc:82,pp:8,effect:null}}},
'nr75':{stages:[{name:'Jonin Kurenai',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Genjutsu Master Kurenai',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Genjutsu Mastery',type:'genjutsu',power:75,acc:81,pp:8,effect:null}}},
'nr76':{stages:[{name:'Special Jonin Anko',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Snake Summoner Anko',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Snake Summoning Technique',type:'ninjutsu',power:77,acc:82,pp:8,effect:null}}},
'nr77':{stages:[{name:'Academy Iruka',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Sensei Iruka',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Teachers Wisdom',type:'special',power:74,acc:80,pp:8,effect:null}}},
'nr78':{stages:[{name:'Genin Duy',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Eight Gates Duy',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Gate Power Legacy',type:'taijutsu',power:80,acc:83,pp:8,effect:null}}},
'nr79':{stages:[{name:'Clan Head Hiashi',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Byakugan Master Hiashi',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Byakugan Gentle Fist',type:'taijutsu',power:81,acc:85,pp:8,effect:null}}},
'nr80':{stages:[{name:'Jonin Commander Shikaku',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Chief Strategist Shikaku',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Shadow Tactics Mastery',type:'ninjutsu',power:80,acc:85,pp:8,effect:null}}},
'nr81':{stages:[{name:'Hot-Blooded Kushina',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Red Hot Habanero',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Chakra Chain Mastery',type:'special',power:80,acc:84,pp:8,effect:null}}},
'nr82':{stages:[{name:'Genin Tenten',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Weapons Mistress Tenten',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Weapon Arsenal Mastery',type:'special',power:77,acc:83,pp:8,effect:null}}},
'nr83':{stages:[{name:'Samurai General Mifune',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Iai Slash Mifune',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Iai Slash Mastery',type:'sword',power:81,acc:86,pp:8,effect:null}}},
'nr84':{stages:[{name:'Scorch Style Pakura',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Hero of Suna Pakura',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Scorch Release Mastery',type:'ninjutsu',power:80,acc:84,pp:8,effect:null}}},
'nr85':{stages:[{name:'Gold Brother Ginkaku',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Sage Tools Ginkaku',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Sage Tool Mastery',type:'special',power:80,acc:84,pp:8,effect:null}}},
'nr86':{stages:[{name:'Silver Brother Kinkaku',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Sage Tools Kinkaku',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Six Tails Kinkaku',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Sage Tool Control',type:'special',power:88,acc:84,pp:7,effect:null},3:{name:'Six Tails Power',type:'special',power:117,acc:80,pp:5,effect:null}}},
'nr87':{stages:[{name:'Seven Swordsman Mangetsu',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'All Blades Mangetsu',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Seven Sword Mastery',type:'sword',power:82,acc:86,pp:8,effect:null}}},
'nr88':{stages:[{name:'Root Torune',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Nano Insects Torune',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Nano Insect Swarm',type:'ninjutsu',power:75,acc:80,pp:8,effect:null}}},
'nr89':{stages:[{name:'Hunter Ao',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Byakugan Ao',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Byakugan Vision',type:'ninjutsu',power:76,acc:82,pp:8,effect:null}}},
'nr90':{stages:[{name:'Monk Chiriku',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Welcoming Approach Chiriku',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Monk Prayer Technique',type:'special',power:78,acc:83,pp:8,effect:null}}},
'nr91':{stages:[{name:'Rain Genin Ajisai',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Paper Bomb Ajisai',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Paper Bomb Mastery',type:'special',power:75,acc:81,pp:8,effect:null}}},
'nr92':{stages:[{name:'Proctor Hayate',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Crescent Moon Hayate',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Crescent Moon Blade',type:'sword',power:76,acc:83,pp:8,effect:null}}},
'nr93':{stages:[{name:'Interrogator Ibiki',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Mental Warfare Ibiki',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Mind Break Technique',type:'genjutsu',power:76,acc:80,pp:8,effect:null}}},
'nr94':{stages:[{name:'Police Chief Fugaku',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Wicked Eye Fugaku',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Sharingan Eye Power',type:'special',power:79,acc:84,pp:8,effect:null}}},
'nr95':{stages:[{name:'Young Izuna',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Mangekyo Izuna',level:15,boosts:{atk:6,def:4,spd:3,haki:3,df:3}},{name:'Legendary Izuna',level:30,boosts:{atk:10,def:8,spd:6,haki:6,df:6}}],learnMoves:{2:{name:'Izuna Susanoo',type:'special',power:89,acc:85,pp:7,effect:null},3:{name:'Legendary Power',type:'special',power:118,acc:80,pp:5,effect:null}}},
'nr96':{stages:[{name:'Young Kagami',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Loyal Sharingan Kagami',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Sharingan Copy Mastery',type:'special',power:79,acc:84,pp:8,effect:null}}},
'nr97':{stages:[{name:'Young Sakumo',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'White Fang',level:15,boosts:{atk:7,def:5,spd:4,haki:4,df:4}},{name:'Legend of the White Fang',level:35,boosts:{atk:12,def:10,spd:8,haki:8,df:8}}],learnMoves:{2:{name:'White Fang Mastery',type:'sword',power:95,acc:88,pp:7,effect:null},3:{name:'Legendary Sword Art',type:'special',power:126,acc:81,pp:4,effect:null}}},
'nr98':{stages:[{name:'Genin Nawaki',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Will of Fire Nawaki',level:20,boosts:{atk:4,def:3,spd:2,haki:2,df:2}}],learnMoves:{2:{name:'Fire Spirit Technique',type:'ninjutsu',power:75,acc:81,pp:8,effect:null}}},
'nr99':{stages:[{name:'Jonin Dan',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Spirit Dan Kato',level:20,boosts:{atk:5,def:4,spd:3,haki:2,df:2}}],learnMoves:{2:{name:'Spirit Fire Technique',type:'ninjutsu',power:79,acc:84,pp:8,effect:null}}},
'nr100':{stages:[{name:'Crippled Nagato',level:1,boosts:{atk:0,def:0,spd:0,haki:0,df:0}},{name:'Rinnegan Nagato',level:15,boosts:{atk:7,def:5,spd:4,haki:4,df:4}},{name:'Edo Nagato Restored',level:35,boosts:{atk:12,def:10,spd:8,haki:8,df:8}}],learnMoves:{2:{name:'Rinnegan Six Paths',type:'special',power:96,acc:85,pp:7,effect:null},3:{name:'Edo Rinnegan Mastery',type:'special',power:128,acc:78,pp:4,effect:null}}},
};

function getEvoStage(id){const saved=evoData[id];if(saved===true)return 2;return(typeof saved==='number'&&saved>=1)?saved:1;}
function getEvoStageData(id){const evo=CHAR_EVOLUTIONS[id];if(!evo)return null;const stage=getEvoStage(id);return evo.stages[stage-1]||evo.stages[0];}
function getNextEvo(id){const evo=CHAR_EVOLUTIONS[id];if(!evo)return null;const stage=getEvoStage(id);if(stage>=evo.stages.length)return null;return evo.stages[stage];}
function canEvolve(id){const evo=CHAR_EVOLUTIONS[id];if(!evo)return false;const stage=getEvoStage(id);if(stage>=evo.stages.length)return false;const next=evo.stages[stage];if(getCharLevelNum(id)<next.level)return false;return true;}
function evolveCharacter(id){if(!canEvolve(id))return;const evo=CHAR_EVOLUTIONS[id];const stage=getEvoStage(id);const nextStage=stage+1;evoData[id]=nextStage;saveEvolutions(evoData);if(evo.learnMoves&&evo.learnMoves[nextStage]){const newMove=evo.learnMoves[nextStage];learnNewMove(id,newMove);}playSound('win');showCharDetail(id);}
function learnNewMove(id,newMove){const moves=BATTLE_MOVES[id];if(!moves)return;let weakIdx=0;let weakPow=moves[0].power;for(let i=1;i<moves.length;i++){if(moves[i].power<weakPow){weakPow=moves[i].power;weakIdx=i;}}if(newMove.power>weakPow){const safeMove={name:newMove.name||'Unknown Move',type:newMove.type||'normal',power:newMove.power||0,acc:newMove.acc!==undefined?newMove.acc:100,pp:newMove.pp!==undefined?newMove.pp:15,effect:newMove.effect||null};moves[weakIdx]=safeMove;}}
function getEvoBoosts(id){const evo=CHAR_EVOLUTIONS[id];if(!evo)return{atk:0,def:0,spd:0,haki:0,df:0};const stage=getEvoStage(id);if(stage<=1)return{atk:0,def:0,spd:0,haki:0,df:0};let total={atk:0,def:0,spd:0,haki:0,df:0};for(let i=1;i<stage;i++){const b=evo.stages[i].boosts;total.atk+=b.atk||0;total.def+=b.def||0;total.spd+=b.spd||0;total.haki+=b.haki||0;total.df+=b.df||0;}return total;}
function isEvolved(id){return getEvoStage(id)>1;}
function getEvoFormName(id){const data=getEvoStageData(id);return data?data.name:null;}
function getMaxEvoStage(id){const evo=CHAR_EVOLUTIONS[id];return evo?evo.stages.length:1;}


// ---- CHARACTER PASSIVES ----
const CHAR_PASSIVES = {
  // ONE PIECE
  'op1': {name:'Rubber Body',emoji:'🎈',desc:'Takes 20% less physical/taijutsu damage',type:'damage_reduce',moveTypes:['physical','taijutsu'],value:0.20},
  'op2': {name:'Demon Aura',emoji:'👹',desc:'Crit rate +8%',type:'crit_boost',value:0.08},
  'op3': {name:'Observation Haki',emoji:'👁️',desc:'Dodge 12% of attacks',type:'dodge',value:0.12},
  'op4': {name:'Sniper King',emoji:'🎯',desc:'All moves +5% accuracy',type:'acc_boost',value:5},
  'op5': {name:'Diable Jambe',emoji:'🍳',desc:'25% chance to burn on physical hit',type:'on_hit_burn',value:0.25},
  'op6': {name:'Monster Trio',emoji:'🦌',desc:'Heal 3% HP per turn',type:'regen',value:0.03},
  'op7': {name:'Soul King',emoji:'🎸',desc:'Team SPD +5% (aura)',type:'team_buff',stat:'spd',value:0.05},
  'op8': {name:'Emergency Healing',emoji:'🩺',desc:'Heal 15% HP once when below 25%',type:'emergency_heal',value:0.15,threshold:0.25},
  'op9': {name:'Clutch',emoji:'🌸',desc:'15% chance to stun on hit',type:'on_hit_stun',value:0.15},
  'op10':{name:'Weather Witch',emoji:'⛈️',desc:'+15% DF move damage',type:'move_boost',moveTypes:['df','ninjutsu'],value:0.15},
  'op11':{name:'Helmsman',emoji:'🌊',desc:'Team DEF +5% (aura)',type:'team_buff',stat:'def',value:0.05},
  'op13':{name:'Mythical Zoan',emoji:'🐉',desc:'Takes 15% less damage from all sources',type:'flat_reduce',value:0.15},
  'op14':{name:'Homies',emoji:'☁️',desc:'Burn and poison last 1 extra turn',type:'status_extend',value:1},
  'op19':{name:'Darkness',emoji:'🕳️',desc:'Negates enemy passive 50% of the time',type:'passive_negate',value:0.50},
  'op20':{name:'Conquerors Haki',emoji:'⚡',desc:'10% chance enemy skips turn (fear)',type:'fear',value:0.10},
  'op15':{name:'Wax Armor',emoji:'🕯️',desc:'+15% DEF when HP above 50%',type:'conditional_stat',stat:'def',value:0.15,condition:'hp_above_50'},
  'op16':{name:'Sand Logia',emoji:'🏜️',desc:'15% chance to dodge physical moves',type:'dodge_type',moveTypes:['physical','taijutsu','sword'],value:0.15},
  'op22':{name:'Magma Fist',emoji:'🌋',desc:'All attacks have 20% burn chance',type:'on_hit_burn',value:0.20},
  'op36':{name:'Ice Age',emoji:'❄️',desc:'20% chance to stun on hit',type:'on_hit_stun',value:0.20},
  'op35':{name:'Light Speed',emoji:'💡',desc:'Always attacks first',type:'priority',value:1},
  // NARUTO
  'nr1': {name:'Nine-Tails Chakra',emoji:'🦊',desc:'ATK +20% when HP below 40%',type:'conditional_stat',stat:'atk',value:0.20,condition:'hp_below_40'},
  'nr2': {name:'Sharingan',emoji:'👁️',desc:'Copy enemy crit rate (match theirs)',type:'crit_copy',value:1},
  'nr3': {name:'Medical Ninja',emoji:'💚',desc:'Heal 5% HP per turn',type:'regen',value:0.05},
  'nr4': {name:'Eight Gates',emoji:'💪',desc:'ATK +3% per turn (stacking)',type:'stacking_buff',stat:'atk',value:0.03},
  'nr5': {name:'Mangekyo Sharingan',emoji:'🔴',desc:'20% chance to dodge + counter',type:'counter',value:0.20},
  'nr6': {name:'Rinnegan',emoji:'🟣',desc:'Revive once at 30% HP when KOd',type:'revive',value:0.30},
  'nr7': {name:'Wood Release',emoji:'🌿',desc:'Heal 4% HP per turn, +10% DEF',type:'regen_plus',healValue:0.04,statBoost:{def:0.10}},
  'nr8': {name:'Kamui',emoji:'🌀',desc:'25% chance to phase through attacks',type:'dodge',value:0.25},
  'nr9': {name:'Rinnegan - Deva Path',emoji:'💜',desc:'Every 3rd attack deals 1.5x damage',type:'nth_attack_boost',n:3,value:1.5},
  'nr10':{name:'Sand Shield',emoji:'🛡️',desc:'Auto-blocks first hit each battle (0 dmg)',type:'auto_shield',value:1},
  'nr11':{name:'Byakugan',emoji:'👁️',desc:'See enemy moves, +5% accuracy',type:'acc_boost',value:5},
  'nr12':{name:'Immortality',emoji:'🐍',desc:'Survive lethal hit once with 1 HP',type:'endure',value:1},
  'nr13':{name:'Lightning Cloak',emoji:'⚡',desc:'+15% SPD, attacks have 10% paralyze',type:'spd_plus_stun',spdBonus:0.15,stunChance:0.10},
  'nr14':{name:'Shadow Genius',emoji:'🧠',desc:'Enemy accuracy -10%',type:'acc_debuff',value:10},
  'nr30':{name:'Yellow Flash',emoji:'⚡',desc:'Always attacks first, +10% dodge',type:'priority_dodge',dodgeValue:0.10},
  'nr33':{name:'Rinnegan Sasuke',emoji:'🔮',desc:'Swap places with enemy (switch after 2 turns)',type:'forced_switch',value:2},
  'nr45':{name:'Copy Ninja',emoji:'📋',desc:'Copies the type of the last move used against him',type:'type_copy',value:1},
  'nr47':{name:'Sage of Six Paths',emoji:'☯️',desc:'All damage +10%, all damage taken -10%',type:'sage_balance',atkMult:0.10,defMult:0.10},
};

// Passives added by evolution
const EVO_PASSIVES = {
  'joyboy':     {name:'Sun God Nika',emoji:'☀️',desc:'All damage +25%, immune to stun',type:'nika',dmgBoost:0.25},
  'ashura':     {name:'Ashura Form',emoji:'👹',desc:'Crit rate +15%, crit damage 2x instead of 1.5x',type:'ashura_crit',critBoost:0.15,critDmg:2.0},
  'ifrit':      {name:'Ifrit Jambe',emoji:'🔥',desc:'Burns enemy on every hit, +20% SPD',type:'always_burn',spdBoost:0.20},
  'dragon_scales':{name:'Dragon Scales',emoji:'🐉',desc:'Take 25% less damage, immune to burn',type:'dragon_def',reduce:0.25},
  'baryon_mode':{name:'Baryon Mode',emoji:'⚛️',desc:'+40% ATK but lose 5% max HP per turn',type:'baryon',atkBoost:0.40,hpCost:0.05},
  'amenotejikara':{name:'Amenotejikara',emoji:'🔮',desc:'30% chance to dodge and teleport behind enemy (+50% next hit)',type:'teleport_counter',dodge:0.30,nextHitBoost:0.50},
  'byakugou':   {name:'Byakugou Seal',emoji:'💎',desc:'Heal 8% HP per turn, survive lethal once',type:'seal_heal',healPct:0.08},
  'eighth_gate':{name:'Night Guy',emoji:'💚',desc:'+50% ATK/SPD but lose 10% HP per turn',type:'gate_burn',atkBoost:0.50,spdBoost:0.50,hpCost:0.10},
  'limbo':      {name:'Limbo Clones',emoji:'🌙',desc:'20% of attacks hit twice (shadow clone)',type:'double_hit',value:0.20},
  'yata_mirror':{name:'Yata Mirror',emoji:'🛡️',desc:'Block 50% damage once every 3 turns',type:'periodic_shield',reduce:0.50,interval:3},
  'chibaku':    {name:'Chibaku Tensei',emoji:'🪐',desc:'Every 4th turn, deal 30% of enemy max HP as damage',type:'periodic_nuke',interval:4,value:0.30},
  'sand_shield':{name:'Ultimate Sand Defense',emoji:'🏜️',desc:'Auto-block first 2 hits per battle',type:'multi_shield',charges:2},
  'flying_raijin':{name:'Flying Raijin',emoji:'⚡',desc:'Always first, 20% chance to attack twice',type:'priority_double',doubleChance:0.20},
  'kamui_double':{name:'Double Kamui',emoji:'⚡',desc:'35% dodge, attacks ignore 30% DEF',type:'kamui_master',dodge:0.35,defIgnore:0.30},
  'immortality':{name:'Eternal Youth',emoji:'🐍',desc:'Revive twice at 25% HP',type:'multi_revive',charges:2,hpPct:0.25},
  'wood_golem': {name:'Wood Golem',emoji:'🌳',desc:'Team heals 3% HP per turn, +15% DEF',type:'team_regen',healPct:0.03,defBoost:0.15},
  'dual_fruit': {name:'Twin Devil Fruits',emoji:'🌑',desc:'All DF damage +30%, quake damage ignores DEF',type:'dual_power',dfBoost:0.30},
  'conquerors_haki':{name:'Supreme King',emoji:'⚡',desc:'15% chance enemy faints from pressure (< 20% HP only)',type:'conqueror_ko',chance:0.15,threshold:0.20},
  'soul_drain': {name:'Soul Pocus',emoji:'👻',desc:'Heal 15% of damage dealt',type:'lifesteal',value:0.15},
  'monster_point':{name:'Monster Point',emoji:'💊',desc:'+30% ATK/DEF but -20% SPD',type:'stat_trade',atkBoost:0.30,defBoost:0.30,spdPenalty:0.20},
  'fish_karate': {name:'Fish-Man Karate Master',emoji:'🌊',desc:'Water attacks ignore 40% DEF',type:'def_pierce',value:0.40},
  'demonio_fleur':{name:'Demonio Fleur',emoji:'🌸',desc:'25% stun chance, +20% DF damage',type:'demon_power',stunChance:0.25,dfBoost:0.20},
  'truth_seeking':{name:'Truth-Seeking Balls',emoji:'🌀',desc:'Negate enemy passive completely',type:'passive_negate_full',value:1.0},
  'double_hit':  {name:'Double Strike',emoji:'⚔️',desc:'20% chance to hit twice',type:'double_hit',value:0.20},
};

// Maps charId -> {stage: passiveKey} for evolution passive unlocks
const EVO_PASSIVE_MAP = {
  'op1':{3:'joyboy'},'op2':{3:'ashura'},'op3':{3:'ifrit'},'op13':{3:'dragon_scales'},
  'op14':{3:'soul_drain'},'op19':{3:'dual_fruit'},'op20':{3:'conquerors_haki'},
  'op8':{2:'monster_point'},'op9':{2:'demonio_fleur'},'op11':{3:'fish_karate'},
  'nr1':{3:'baryon_mode'},'nr2':{3:'amenotejikara'},'nr3':{2:'byakugou'},
  'nr5':{3:'yata_mirror'},'nr6':{3:'limbo'},'nr9':{3:'chibaku'},
  'nr12':{3:'immortality'},'nr8':{3:'truth_seeking'},'nr4':{3:'eighth_gate'},
  'nr7':{3:'wood_golem'},'nr10':{3:'sand_shield'},'nr30':{3:'flying_raijin'},
  'nr45':{3:'kamui_double'},
};

function getCharPassive(id){
  // Check evolution passive (unlocked at specific stage)
  const evoP = EVO_PASSIVE_MAP[id];
  if(evoP){
    const stage = getEvoStage(id);
    for(const reqStage in evoP){
      if(stage >= parseInt(reqStage) && EVO_PASSIVES[evoP[reqStage]]){
        return EVO_PASSIVES[evoP[reqStage]];
      }
    }
  }
  return CHAR_PASSIVES[id]||null;
}


// ---- EQUIPMENT / RELIC SYSTEM ----
const EQUIP_KEY = 'animewar_equipment';
function loadEquipment(){try{const s=localStorage.getItem(EQUIP_KEY);if(s)return JSON.parse(s);}catch(e){}return {inventory:[],equipped:{}};}
function saveEquipment(eq){localStorage.setItem(EQUIP_KEY,JSON.stringify(eq));}
let equipmentData = loadEquipment();

const RELICS = {
  straw_hat:    {name:'Straw Hat',emoji:'👒',desc:'+10% ATK for physical moves',stat:'atk',moveType:'physical',value:0.10,cost:2000,tier:'B'},
  headband:     {name:'Ninja Headband',emoji:'🥷',desc:'+10% ATK for ninjutsu moves',stat:'atk',moveType:'ninjutsu',value:0.10,cost:2000,tier:'B'},
  iron_shield:  {name:'Iron Shield',emoji:'🛡️',desc:'+12% DEF',stat:'def',value:0.12,cost:2500,tier:'B'},
  swift_boots:  {name:'Swift Boots',emoji:'👢',desc:'+12% SPD',stat:'spd',value:0.12,cost:2500,tier:'B'},
  power_ring:   {name:'Power Ring',emoji:'💍',desc:'+8% ATK, +8% DEF',stats:{atk:0.08,def:0.08},cost:3000,tier:'A'},
  chakra_stone: {name:'Chakra Stone',emoji:'💎',desc:'+15% ninjutsu/DF damage',stat:'df',moveType:'df',value:0.15,cost:3500,tier:'A'},
  haki_crystal: {name:'Haki Crystal',emoji:'🔮',desc:'+15% haki/genjutsu damage',stat:'haki',moveType:'haki',value:0.15,cost:3500,tier:'A'},
  berserker:    {name:'Berserker Charm',emoji:'💀',desc:'+20% ATK, -10% DEF',stats:{atk:0.20,def:-0.10},cost:4000,tier:'A'},
  life_orb:     {name:'Life Orb',emoji:'🟢',desc:'Heal 5% HP per turn',healPerTurn:0.05,cost:4000,tier:'A'},
  scope_lens:   {name:'Scope Lens',emoji:'🔭',desc:'+6% crit rate',critBoost:0.06,cost:3000,tier:'A'},
  sea_stone:    {name:'Sea Stone Cuffs',emoji:'⛓️',desc:'Enemy DF damage -20%',enemyDebuff:{moveType:'df',value:0.20},cost:5000,tier:'S'},
  sage_scroll:  {name:'Sage Scroll',emoji:'📜',desc:'+10% all stats',stats:{atk:0.10,def:0.10,spd:0.10},cost:8000,tier:'S'},
  will_of_d:    {name:'Will of D.',emoji:'🏴‍☠️',desc:'Survive lethal hit once with 1 HP',endure:true,cost:10000,tier:'S+'},
  curse_mark:   {name:'Curse Mark',emoji:'🔥',desc:'+25% ATK when HP < 50%',conditionalBuff:{stat:'atk',value:0.25,condition:'hp_below_50'},cost:10000,tier:'S+'},
};

function buyRelic(relicId){
  const r=RELICS[relicId];
  if(!r||saveData.coins<r.cost) return;
  if(equipmentData.inventory.includes(relicId)) return; // already own
  saveData.coins-=r.cost;
  saveSave();
  equipmentData.inventory.push(relicId);
  saveEquipment(equipmentData);
}

function equipRelic(charId,relicId){
  if(!equipmentData.inventory.includes(relicId)) return;
  // Unequip from anyone else who has it
  for(const cid in equipmentData.equipped){
    if(equipmentData.equipped[cid]===relicId) delete equipmentData.equipped[cid];
  }
  equipmentData.equipped[charId]=relicId;
  saveEquipment(equipmentData);
}

function unequipRelic(charId){
  delete equipmentData.equipped[charId];
  saveEquipment(equipmentData);
}

function getCharRelic(charId){
  const rid=equipmentData.equipped[charId];
  if(rid && RELICS[rid]) return {id:rid,...RELICS[rid]};
  return null;
}

function showRelicShop(){
  const modal=document.getElementById('gachaModal');
  if(!modal) return;
  let html='<div class="gacha-header"><div class="gacha-title">⚔️ RELIC SHOP</div><div class="gacha-coins">💰 '+saveData.coins.toLocaleString()+'</div></div>';
  html+='<div class="shop-grid">';
  const tierOrder=['S+','S','A','B'];
  for(const tid of tierOrder){
    const relics=Object.entries(RELICS).filter(([_,r])=>r.tier===tid);
    if(relics.length===0) continue;
    html+='<div class="shop-tier-label tier-'+tid.replace('+','p')+'">'+tid+' Tier</div>';
    for(const [rid,r] of relics){
      const owned=equipmentData.inventory.includes(rid);
      const canBuy=!owned&&saveData.coins>=r.cost;
      const equippedBy=Object.entries(equipmentData.equipped).find(([_,v])=>v===rid);
      const eqLabel=equippedBy?'Equipped':'';
      html+='<div class="shop-item '+(owned?'shop-owned':'')+'"><div class="shop-item-icon">'+r.emoji+'</div><div class="shop-item-info"><div class="shop-item-name">'+r.name+'</div><div class="shop-item-desc">'+r.desc+'</div>'+(eqLabel?'<div class="shop-item-eq">'+eqLabel+'</div>':'')+'</div>';
      if(!owned) html+='<button class="shop-buy-btn '+(canBuy?'':'shop-cant')+'" onclick="buyRelic(\''+rid+'\');showRelicShop()">'+r.cost+'</button>';
      else html+='<div class="shop-owned-tag">OWNED</div>';
      html+='</div>';
    }
  }
  html+='</div><button class="gacha-close" onclick="closeGachaShop()">BACK</button>';
  modal.querySelector('.gacha-content').innerHTML=html;
  modal.style.display='flex';
}


// ---- AI PERSONALITY SYSTEM ----
const AI_PERSONALITIES = {
  // Aggressive: always goes for max damage, never switches
  aggressive: {name:'Berserker',pickMove:(moves,attacker,defender)=>{
    const valid=moves.filter(m=>m.curPP>0);
    if(!valid.length) return 0;
    let best=0,bestDmg=0;
    valid.forEach((m,i)=>{
      const eff=m.power*(m.acc/100)*(TYPE_CHART[m.type]?(TYPE_CHART[m.type][defender._moves[0]?.type]||1):1);
      if(eff>bestDmg){bestDmg=eff;best=moves.indexOf(m);}
    });
    return best;
  },shouldSwitch:()=>false},
  // Defensive: prioritizes status moves and switches to type advantage
  tactical: {name:'Tactician',pickMove:(moves,attacker,defender)=>{
    const valid=moves.filter(m=>m.curPP>0);
    if(!valid.length) return 0;
    // Prefer status moves if enemy has no status
    const statusMoves=valid.filter(m=>m.effect&&!defender.status.length);
    if(statusMoves.length>0&&Math.random()<0.6) return moves.indexOf(statusMoves[0]);
    // Otherwise pick best type-effective move
    let best=0,bestScore=0;
    valid.forEach((m,i)=>{
      const typeMult=TYPE_CHART[m.type]?(TYPE_CHART[m.type][defender._moves[0]?.type]||1):1;
      const score=m.power*(m.acc/100)*typeMult*(m.effect?1.3:1);
      if(score>bestScore){bestScore=score;best=moves.indexOf(m);}
    });
    return best;
  },shouldSwitch:(team,current,enemy)=>{
    // Switch if current matchup is bad
    const curType=current._moves[0]?.type;
    const enemyType=enemy._moves[0]?.type;
    if(curType&&enemyType&&TYPE_CHART[enemyType]&&TYPE_CHART[enemyType][curType]>1.1){
      return team.findIndex((c,i)=>{
        if(c.fainted||c===current) return false;
        const t=c._moves[0]?.type;
        return t&&TYPE_CHART[t]&&TYPE_CHART[t][enemyType]>1.1;
      });
    }
    return -1;
  }},
  // Balanced: mix of offense and defense
  balanced: {name:'Balanced',pickMove:(moves,attacker,defender)=>{
    const valid=moves.filter(m=>m.curPP>0);
    if(!valid.length) return 0;
    // 30% chance to use status move
    if(Math.random()<0.3){
      const sm=valid.filter(m=>m.effect);
      if(sm.length) return moves.indexOf(sm[Math.floor(Math.random()*sm.length)]);
    }
    // Otherwise pick move with best expected damage
    let best=0,bestDmg=0;
    valid.forEach((m,i)=>{
      const dmg=m.power*(m.acc/100);
      if(dmg>bestDmg){bestDmg=dmg;best=moves.indexOf(m);}
    });
    return best;
  },shouldSwitch:()=>-1},
  // Reckless: picks highest power move regardless of accuracy
  reckless: {name:'Reckless',pickMove:(moves)=>{
    const valid=moves.filter(m=>m.curPP>0);
    if(!valid.length) return 0;
    let best=0,bestPwr=0;
    valid.forEach((m,i)=>{if(m.power>bestPwr){bestPwr=m.power;best=moves.indexOf(m);}});
    return best;
  },shouldSwitch:()=>false},
};

// Map character IDs to AI personalities
const CHAR_AI_STYLE = {
  'op1':'aggressive','op2':'aggressive','op3':'aggressive',
  'op13':'aggressive','op14':'tactical','op19':'reckless',
  'op20':'balanced','op22':'aggressive','op36':'tactical',
  'nr1':'aggressive','nr2':'tactical','nr3':'balanced',
  'nr4':'reckless','nr5':'tactical','nr6':'aggressive',
  'nr7':'balanced','nr8':'tactical','nr9':'aggressive',
  'nr10':'balanced','nr14':'tactical','nr30':'aggressive',
};

function getAIPersonality(charId){
  const style=CHAR_AI_STYLE[charId]||'balanced';
  return AI_PERSONALITIES[style]||AI_PERSONALITIES.balanced;
}


// ---- PRESTIGE / NEW GAME+ STORY ----
const PRESTIGE_KEY = 'animewar_prestige';
function loadPrestige(){try{const s=localStorage.getItem(PRESTIGE_KEY);if(s)return JSON.parse(s);}catch(e){}return {};}
function savePrestige(p){localStorage.setItem(PRESTIGE_KEY,JSON.stringify(p));}
let prestigeData = loadPrestige();

const PRESTIGE_LEVELS = [
  {level:1,name:'New Game+',emoji:'⭐',statMult:1.3,hpMult:1.5,rewardMult:2.0,color:'#FFD700'},
  {level:2,name:'Legendary',emoji:'🌟',statMult:1.6,hpMult:2.0,rewardMult:3.0,color:'#FF6600'},
  {level:3,name:'Mythic',emoji:'💫',statMult:2.0,hpMult:2.5,rewardMult:5.0,color:'#FF0066'},
];

function getArcPrestige(arcId){return prestigeData[arcId]||0;}
function getPrestigeInfo(level){return PRESTIGE_LEVELS[level-1]||null;}

function canPrestigeArc(arcId){
  const story=loadStory();
  if(!story.bossCleared[arcId]) return false;
  const current=getArcPrestige(arcId);
  return current < PRESTIGE_LEVELS.length;
}

function prestigeArc(arcId){
  if(!canPrestigeArc(arcId)) return;
  const current=getArcPrestige(arcId);
  prestigeData[arcId]=current+1;
  savePrestige(prestigeData);
  // Reset arc completion so they have to clear it again
  const story=loadStory();
  delete story.completed[arcId];
  story.bossCleared[arcId]=false;
  saveStory(story);
  showStoryMode();
}


// ---- FAVORITES & SORTING ----
const FAV_KEY = 'animewar_favorites';
function loadFavorites(){try{const s=localStorage.getItem(FAV_KEY);if(s)return JSON.parse(s);}catch(e){}return [];}
function saveFavorites(f){localStorage.setItem(FAV_KEY,JSON.stringify(f));}
let favoriteChars = loadFavorites();
let collectionSort = 'tier'; // tier, atk, def, spd, name, favorites

function toggleFavorite(id){
  const idx=favoriteChars.indexOf(id);
  if(idx>=0) favoriteChars.splice(idx,1);
  else favoriteChars.push(id);
  saveFavorites(favoriteChars);
}
function isFavorite(id){return favoriteChars.includes(id);}

function setCollSort(s){
  collectionSort=s;
  renderCollection();
  document.querySelectorAll('.sort-btn').forEach(btn=>{
    btn.classList.toggle('sort-active', btn.getAttribute('data-sort')===s);
  });
}


// ---- STORY MODE ----
const STORY_KEY='animewar_story';
const STORY_ARCS=[
  // ONE PIECE
  {id:'op_east_blue',name:'East Blue Saga',anime:'onepiece',difficulty:'easy',emoji:'⛵',
    chapters:[
      {name:'Romance Dawn',enemies:['op92','op102','op31'],reward:200},
      {name:'Baratie Showdown',enemies:['op91','op90','op17'],reward:250},
      {name:'Arlong Park',enemies:['op92','op66','op38'],reward:300}
    ],
    boss:{name:'Arlong - Tyrant of the East',bossId:'op92',allies:['op31','op102'],reward:500,bossHpMult:3,bossStatMult:1.3},
    arcReward:1500
  },
  {id:'op_baroque',name:'Baroque Works',anime:'onepiece',difficulty:'medium',emoji:'🏜️',
    chapters:[
      {name:'Whiskey Peak',enemies:['op93','op95','op96'],reward:300},
      {name:'Rain Dinners',enemies:['op94','op95','op32'],reward:350},
      {name:'Alabasta Rebellion',enemies:['op15','op94','op96'],reward:400},
      {name:'Royal Tomb',enemies:['op16','op15','op32'],reward:450}
    ],
    boss:{name:'Crocodile - Desert King',bossId:'op16',allies:['op15','op32'],reward:700,bossHpMult:3,bossStatMult:1.4},
    arcReward:2000
  },
  {id:'op_marineford',name:'Marineford War',anime:'onepiece',difficulty:'hard',emoji:'⚓',
    chapters:[
      {name:'Gates of Justice',enemies:['op68','op67','op65'],reward:400},
      {name:'Admiral Assault',enemies:['op36','op35','op55'],reward:500},
      {name:'Whitebeard\'s Stand',enemies:['op22','op40','op56'],reward:500},
      {name:'Ace\'s Execution',enemies:['op22','op36','op35'],reward:600}
    ],
    boss:{name:'Akainu - Absolute Justice',bossId:'op22',allies:['op40','op36'],reward:1000,bossHpMult:3.5,bossStatMult:1.5},
    arcReward:3000
  },
  // NARUTO
  {id:'nr_chunin',name:'Chunin Exams',anime:'naruto',difficulty:'easy',emoji:'📜',
    chapters:[
      {name:'Forest of Death',enemies:['nr44','nr61','nr62'],reward:200},
      {name:'Preliminary Rounds',enemies:['nr65','nr34','nr82'],reward:250},
      {name:'Finals Arena',enemies:['nr16','nr18','nr15'],reward:300}
    ],
    boss:{name:'Orochimaru - The Serpent',bossId:'nr12',allies:['nr44','nr21'],reward:500,bossHpMult:3,bossStatMult:1.3},
    arcReward:1500
  },
  {id:'nr_akatsuki',name:'Akatsuki Hunt',anime:'naruto',difficulty:'medium',emoji:'☁️',
    chapters:[
      {name:'Kazekage Rescue',enemies:['nr22','nr23','nr58'],reward:300},
      {name:'Immortal Duo',enemies:['nr25','nr26','nr59'],reward:350},
      {name:'Itachi Pursuit',enemies:['nr5','nr24','nr21'],reward:400},
      {name:'Path of Pain',enemies:['nr9','nr27','nr100'],reward:450}
    ],
    boss:{name:'Pain - God of the New World',bossId:'nr9',allies:['nr27','nr100'],reward:700,bossHpMult:3,bossStatMult:1.4},
    arcReward:2000
  },
  {id:'nr_war',name:'Fourth Great Ninja War',anime:'naruto',difficulty:'hard',emoji:'🌀',
    chapters:[
      {name:'Edo Tensei Army',enemies:['nr60','nr48','nr49'],reward:400},
      {name:'Jinchuriki Unleashed',enemies:['nr53','nr55','nr51'],reward:500},
      {name:'Uchiha Legacy',enemies:['nr8','nr5','nr41'],reward:500},
      {name:'Ten-Tails Assault',enemies:['nr6','nr8','nr33'],reward:600}
    ],
    boss:{name:'Madara Uchiha - Infinite Tsukuyomi',bossId:'nr6',allies:['nr8','nr33'],reward:1000,bossHpMult:3.5,bossStatMult:1.5},
    arcReward:3000
  }
];

function loadStory(){try{const s=localStorage.getItem(STORY_KEY);if(s)return JSON.parse(s);}catch(e){}return {completed:{},bossCleared:{}};}
function saveStory(st){localStorage.setItem(STORY_KEY,JSON.stringify(st));}

function showStoryMode(){
  const modal=document.getElementById('gachaModal');
  if(!modal) return;
  const story=loadStory();
  let html=`<div class="gacha-header">
    <div class="gacha-title">📖 STORY MODE</div>
    <div class="gacha-coins">💰 ${saveData.coins.toLocaleString()}</div>
  </div>`;

  // Group by anime
  const opArcs=STORY_ARCS.filter(a=>a.anime==='onepiece');
  const nrArcs=STORY_ARCS.filter(a=>a.anime==='naruto');

  html+=`<div class="story-section-title">☠️ ONE PIECE</div>`;
  html+=renderStoryArcs(opArcs,story);
  html+=`<div class="story-section-title">🍥 NARUTO</div>`;
  html+=renderStoryArcs(nrArcs,story);
  html+=`<button class="gacha-close" onclick="closeGachaShop()">BACK</button>`;

  modal.querySelector('.gacha-content').innerHTML=html;
  modal.style.display='flex';
}

function renderStoryArcs(arcs,story){
  let html='';
  for(const arc of arcs){
    const totalChapters=arc.chapters.length;
    const bossCleared=story.bossCleared[arc.id]||false;
    const diffColor=arc.difficulty==='easy'?'#4CAF50':arc.difficulty==='medium'?'#FFD700':'#ff4444';
    const totalCoins=arc.chapters.reduce((s,ch)=>s+ch.reward,0)+arc.boss.reward+arc.arcReward;
    html+=`<div class="story-arc" style="--arc-color:${diffColor}">
      <div class="arc-header">
        <span class="arc-emoji">${arc.emoji}</span>
        <span class="arc-name">${arc.name}</span>
        <span class="arc-diff" style="color:${diffColor}">${arc.difficulty.toUpperCase()}</span>
      </div>`;
    if(bossCleared){
      html+=`<div class="arc-progress">🏆 Arc Cleared! ${pInfo ? pInfo.emoji+' '+pInfo.name : ''}</div>`;
    }else{
      html+=`<div class="arc-progress">${totalChapters} chapters + Boss</div>`;
    }
    // Chapter preview (non-interactive, just shows what you'll face)
    html+=`<div class="arc-chapters">`;
    arc.chapters.forEach((ch,i)=>{
      html+=`<div class="story-ch-preview">
        <span>${i+1}. ${ch.name}</span><span class="ch-reward">+${ch.reward}</span>
      </div>`;
    });
    html+=`<div class="story-ch-preview story-boss-preview">
      <span>⚠️ BOSS: ${arc.boss.name}</span><span class="ch-reward">+${arc.boss.reward}</span>
    </div>`;
    // Action button
    const pLvl = getArcPrestige(arc.id);
    const pInfo = pLvl > 0 ? getPrestigeInfo(pLvl) : null;
    const canPres = canPrestigeArc(arc.id);
    if(bossCleared){
      html+=`<button class="story-start-btn story-replay-btn" onclick="startStoryArc('${arc.id}')">
        🔄 Replay Arc <span class="ch-reward">+${totalCoins-arc.arcReward} coins</span>
      </button>`;
      if(canPres){
        const nextP = getPrestigeInfo(pLvl+1);
        html+=`<button class="story-start-btn story-prestige-btn" style="background:linear-gradient(135deg,${nextP.color},#333)" onclick="prestigeArc('${arc.id}')">
          ${nextP.emoji} Prestige to ${nextP.name} <span class="ch-reward">${nextP.rewardMult}x rewards</span>
        </button>`;
      }
    }else{
      html+=`<button class="story-start-btn" onclick="startStoryArc('${arc.id}')">
        ⚔️ Begin Arc <span class="ch-reward">+${totalCoins} coins</span>
      </button>`;
    }
    html+=`<div class="arc-rules">Must clear all chapters + boss in one run. HP carries over between fights. Fainted allies revive at 20% HP.</div>`;
    html+=`</div></div>`;
  }
  return html;
}

let storyContext=null;
let storyRunState=null; // tracks current arc run {arcId, chIdx, teamHP, coinsBanked}
let endlessBattle={active:false,charId:null,wins:0,diff:'medium',totalExp:0,startingCoins:0}; // Endless mode state
let lastBattleTeam = []; // Store the last team used for "Play Again"

// Start a full arc run from the beginning (team selection)
function startStoryArc(arcId){
  const arc=STORY_ARCS.find(a=>a.id===arcId);
  if(!arc) return;
  storyRunState={arcId,chIdx:0,coinsBanked:0,teamHP:null};
  storyContext={arcId,chIdx:0,type:'chapter',reward:arc.chapters[0].reward};
  closeGachaShop();
  document.getElementById('title-screen').style.display='none';
  document.getElementById('battleSetup').style.display='block';
  selectedBattleTeam=[];
  selectedDifficulty=arc.difficulty;
  currentBet=0;
  equippedItems=[];
  renderBattleSetup();
  const btn=document.getElementById('btnBattleStart');
  if(btn) btn.textContent='START: '+arc.chapters[0].name+' (1/'+arc.chapters.length+')';
}

// Start just the boss fight (team selection)
function startStoryBoss(arcId){
  const arc=STORY_ARCS.find(a=>a.id===arcId);
  if(!arc) return;
  const boss=arc.boss;
  storyRunState={arcId,chIdx:'boss',coinsBanked:0,teamHP:null};
  storyContext={arcId,type:'boss',reward:boss.reward,arcReward:arc.arcReward,bossId:boss.bossId,allies:boss.allies,bossHpMult:boss.bossHpMult,bossStatMult:boss.bossStatMult};
  closeGachaShop();
  document.getElementById('title-screen').style.display='none';
  document.getElementById('battleSetup').style.display='block';
  selectedBattleTeam=[];
  selectedDifficulty=arc.difficulty;
  currentBet=0;
  equippedItems=[];
  renderBattleSetup();
  const btn=document.getElementById('btnBattleStart');
  if(btn) btn.textContent='FIGHT BOSS: '+boss.name;
}

// Auto-advance to the next chapter/boss without team re-selection
function storyAdvanceNext(){
  if(!storyRunState) return;
  const arc=STORY_ARCS.find(a=>a.id===storyRunState.arcId);
  if(!arc) return;
  const nextIdx=storyRunState.chIdx+1;
  // Save team HP state from current battle before advancing
  const teamHP=currentBattle?currentBattle.pTeam.map(c=>({id:c.id,hp:c.hp,maxHP:c.maxHP,fainted:c.fainted,moves:c.moves.map(m=>({curPP:m.curPP}))})):storyRunState.teamHP;
  if(nextIdx<arc.chapters.length){
    // Next chapter
    storyRunState.chIdx=nextIdx;
    const ch=arc.chapters[nextIdx];
    storyContext={arcId:arc.id,chIdx:nextIdx,type:'chapter',reward:ch.reward};
    // Build enemy team
    const eTeam=ch.enemies.map(id=>ALL_CHARS.find(c=>c.id===id)).filter(Boolean);
    const STORY_DIFF_LVL={easy:1,medium:15,hard:35,extreme:50};
    eTeam.forEach(c=>{c._forcedLevel=STORY_DIFF_LVL[arc.difficulty]||35;});
    const pTeam=selectedBattleTeam.map(id=>ALL_CHARS.find(c=>c.id===id));
    currentBattle=new Battle(pTeam,eTeam,arc.difficulty);
    currentBattle.storyContext=storyContext;
    // Restore player team HP/PP from previous chapter
    if(teamHP){
      currentBattle.pTeam.forEach((bc,i)=>{
        const saved=teamHP[i];
        if(saved){
          bc.hp=Math.max(1,saved.hp); // at least 1 HP to keep them alive
          if(saved.fainted){bc.hp=Math.max(1,Math.floor(bc.maxHP*0.2));} // revive fainted at 20%
          if(saved.moves) saved.moves.forEach((sm,mi)=>{if(bc.moves[mi]) bc.moves[mi].curPP=sm.curPP;});
        }
      });
      // Make sure active character isn't fainted
      if(currentBattle.pTeam[currentBattle.pIdx].hp<=0) currentBattle.pTeam[currentBattle.pIdx].hp=1;
    }
    document.getElementById('battleArena').style.display='block';
    renderBattle();
  }else{
    // All chapters done, advance to boss
    const boss=arc.boss;
    storyRunState.chIdx='boss';
    storyContext={arcId:arc.id,type:'boss',reward:boss.reward,arcReward:arc.arcReward,bossId:boss.bossId,allies:boss.allies,bossHpMult:boss.bossHpMult,bossStatMult:boss.bossStatMult};
    const bossChar={...ALL_CHARS.find(c=>c.id===boss.bossId)};
    const _pMult2 = (typeof getPrestigeInfo==='function') ? (getPrestigeInfo(arc.id).statMult||1) : 1;
    bossChar.atk=Math.floor(bossChar.atk*boss.bossStatMult*_pMult2);
    bossChar.def=Math.floor(bossChar.def*boss.bossStatMult*_pMult2);
    bossChar.spd=Math.floor(bossChar.spd*boss.bossStatMult*_pMult2);
    if(bossChar.haki) bossChar.haki=Math.floor(bossChar.haki*boss.bossStatMult*_pMult2);
    if(bossChar.df) bossChar.df=Math.floor(bossChar.df*boss.bossStatMult*_pMult2);
    bossChar._bossHpMult=boss.bossHpMult*(typeof getPrestigeInfo==='function'?(getPrestigeInfo(arc.id).hpMult||1):1);
    const allies=boss.allies.map(id=>ALL_CHARS.find(c=>c.id===id)).filter(Boolean);
    const eTeam=[bossChar,...allies];
    const pTeam=selectedBattleTeam.map(id=>ALL_CHARS.find(c=>c.id===id));
    currentBattle=new Battle(pTeam,eTeam,arc.difficulty);
    currentBattle.storyContext=storyContext;
    // Restore HP/PP
    if(teamHP){
      currentBattle.pTeam.forEach((bc,i)=>{
        const saved=teamHP[i];
        if(saved){
          bc.hp=Math.max(1,saved.hp);
          if(saved.fainted){bc.hp=Math.max(1,Math.floor(bc.maxHP*0.2));}
          if(saved.moves) saved.moves.forEach((sm,mi)=>{if(bc.moves[mi]) bc.moves[mi].curPP=sm.curPP;});
        }
      });
      if(currentBattle.pTeam[currentBattle.pIdx].hp<=0) currentBattle.pTeam[currentBattle.pIdx].hp=1;
    }
    document.getElementById('battleArena').style.display='block';
    renderBattle();
  }
}

// Abandon a story run (quit mid-arc)
function abandonStoryRun(){
  // Bank any coins earned so far in this run
  if(storyRunState && storyRunState.coinsBanked>0){
    addCoins(storyRunState.coinsBanked);
  }
  storyRunState=null;
  storyContext=null;
  currentBattle=null;
  document.getElementById('battleArena').style.display='none';
  document.getElementById('battleSetup').style.display='none';
  document.getElementById('title-screen').style.display='flex';
  showStoryMode();
}

// Legacy compat: startStoryChapter now starts the full arc
function startStoryChapter(arcId,chIdx){
  startStoryArc(arcId);
}

function completeStoryChapter(arcId,chIdx,reward){
  // Don't save permanently yet, just bank the coins for this run
  if(storyRunState){
    storyRunState.coinsBanked+=reward;
  }
}

function completeStoryBoss(arcId,reward,arcReward){
  const story=loadStory();
  const alreadyCleared=story.bossCleared[arcId];
  // Mark ALL chapters and boss as complete for this arc
  const arc=STORY_ARCS.find(a=>a.id===arcId);
  if(arc){
    story.completed[arcId]=arc.chapters.map((_,i)=>i);
  }
  story.bossCleared[arcId]=true;
  saveStory(story);
  // Pay out everything: banked chapter coins + boss reward + arc reward
  const banked=(storyRunState?storyRunState.coinsBanked:0);
  if(!alreadyCleared){
    addCoins(banked+reward+arcReward);
  } else {
    // Replaying: still pay chapter coins + boss reward, but no arc bonus
    addCoins(banked+reward);
  }
  storyRunState=null;
  return !alreadyCleared;
}

// ---- DAILY CHALLENGES ----
const DAILY_KEY='animewar_daily';
const CHALLENGE_POOL=[
  {id:'b_tier_only',name:'B-Tier Warriors',desc:'Win a battle using only B-tier characters',emoji:'🅱️',reward:400,check:(r)=>r.won&&r.team.every(c=>c.tier==='B')},
  {id:'c_tier_only',name:'Underdog Victory',desc:'Win a battle using only C-tier characters',emoji:'🐕',reward:800,check:(r)=>r.won&&r.team.every(c=>c.tier==='C')},
  {id:'no_items',name:'Pure Skill',desc:'Win a battle without using any items',emoji:'💪',reward:300,check:(r)=>r.won&&r.itemsUsed===0},
  {id:'synergy_win',name:'Team Synergy',desc:'Win with at least 1 active synergy',emoji:'🤝',reward:400,check:(r)=>r.won&&r.synergies>0},
  {id:'hard_win',name:'Hard Mode',desc:'Win a Hard difficulty battle',emoji:'🔥',reward:500,check:(r)=>r.won&&r.diff==='hard'},
  {id:'no_faint',name:'Perfect Victory',desc:'Win without any of your team fainting',emoji:'🏆',reward:600,check:(r)=>r.won&&r.fainted===0},
  {id:'speed_win',name:'Quick Battle',desc:'Win in 8 turns or less',emoji:'⚡',reward:500,check:(r)=>r.won&&r.turns<=8},
  {id:'op_only',name:'Pirate Crew',desc:'Win using only One Piece characters',emoji:'☠️',reward:350,check:(r)=>r.won&&r.team.every(c=>c.anime==='onepiece')},
  {id:'nr_only',name:'Ninja Squad',desc:'Win using only Naruto characters',emoji:'🍥',reward:350,check:(r)=>r.won&&r.team.every(c=>c.anime==='naruto')},
  {id:'win_3',name:'Triple Threat',desc:'Win 3 battles today',emoji:'3️⃣',reward:500,check:(r)=>r.dailyWins>=3},
  {id:'story_chapter',name:'Story Time',desc:'Complete any story chapter',emoji:'📖',reward:300,check:(r)=>r.storyChapter},
  {id:'boss_kill',name:'Boss Slayer',desc:'Defeat any story boss',emoji:'👑',reward:700,check:(r)=>r.bossKill},
  {id:'big_spender',name:'High Roller',desc:'Win a bet of 1000+ coins',emoji:'💰',reward:400,check:(r)=>r.won&&r.bet>=1000},
  {id:'mixed_tier',name:'Variety Pack',desc:'Win with 3 different tier characters',emoji:'🎭',reward:350,check:(r)=>{if(!r.won) return false; const t=new Set(r.team.map(c=>c.tier)); return t.size>=3;}},
  {id:'s_tier',name:'Elite Squad',desc:'Win using at least 2 S or S+ tier characters',emoji:'⭐',reward:300,check:(r)=>r.won&&r.team.filter(c=>c.tier==='S'||c.tier==='S+').length>=2}
];

function loadDaily(){
  try{const s=localStorage.getItem(DAILY_KEY);if(s){const d=JSON.parse(s);if(d.date===getTodayStr()) return d;}}catch(e){}
  return {date:getTodayStr(),completed:[],streak:getStreak(),dailyWins:0};
}
function saveDaily(d){localStorage.setItem(DAILY_KEY,JSON.stringify(d));}
function getTodayStr(){const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}

function getStreak(){
  try{const s=localStorage.getItem(DAILY_KEY);if(s){const d=JSON.parse(s);
    const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);
    const yStr=yesterday.getFullYear()+'-'+(yesterday.getMonth()+1)+'-'+yesterday.getDate();
    if(d.date===yStr&&d.completed.length>0) return (d.streak||0)+1;
    if(d.date===getTodayStr()) return d.streak||0;
  }}catch(e){}
  return 0;
}

function getDailyChallenges(){
  // Seed from today's date to get consistent daily challenges
  const dateStr=getTodayStr();
  let hash=0;
  for(let i=0;i<dateStr.length;i++){hash=((hash<<5)-hash)+dateStr.charCodeAt(i);hash|=0;}
  const seed=Math.abs(hash);
  // Pick 3 unique challenges
  const shuffled=[...CHALLENGE_POOL];
  for(let i=shuffled.length-1;i>0;i--){
    const j=(seed*(i+1)*31)%shuffled.length;
    [shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];
  }
  return shuffled.slice(0,3);
}

function checkDailyChallenges(battleResult){
  const daily=loadDaily();
  const challenges=getDailyChallenges();
  let completed=false;
  for(const ch of challenges){
    if(daily.completed.includes(ch.id)) continue;
    if(ch.check(battleResult)){
      daily.completed.push(ch.id);
      const streakMult=1+Math.min(0.5,daily.streak*0.1);
      const reward=Math.floor(ch.reward*streakMult);
      addCoins(reward);
      completed=true;
    }
  }
  if(battleResult.won) daily.dailyWins=(daily.dailyWins||0)+1;
  saveDaily(daily);
  return completed;
}

function showDailyChallenges(){
  const modal=document.getElementById('gachaModal');
  if(!modal) return;
  const daily=loadDaily();
  const challenges=getDailyChallenges();
  const streak=daily.streak||0;
  const streakMult=1+Math.min(0.5,streak*0.1);

  let html=`<div class="gacha-header">
    <div class="gacha-title">🎯 DAILY CHALLENGES</div>
    ${streak>0?`<div class="daily-streak">🔥 ${streak}-day streak! +${Math.round((streakMult-1)*100)}% bonus</div>`:''}
  </div><div class="daily-grid">`;

  for(const ch of challenges){
    const done=daily.completed.includes(ch.id);
    const reward=Math.floor(ch.reward*streakMult);
    html+=`<div class="daily-card ${done?'daily-done':''}">
      <div class="daily-emoji">${ch.emoji}</div>
      <div class="daily-name">${ch.name}</div>
      <div class="daily-desc">${ch.desc}</div>
      <div class="daily-reward">${done?'✅ Completed':`+${reward} coins`}</div>
    </div>`;
  }
  html+=`</div><div class="daily-info">New challenges every day. Complete at least 1 to keep your streak!</div>`;
  html+=`<button class="gacha-close" onclick="closeGachaShop()">BACK</button>`;
  modal.querySelector('.gacha-content').innerHTML=html;
  modal.style.display='flex';
}

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
  // DEF is primary HP stat, haki/df add a small resilience bonus
  const hakiBonus = (ch.haki||0) * 0.3;
  const dfBonus = (ch.df||0) * 0.3;
  return Math.floor((ch.def*2.5 + hakiBonus + dfBonus + 150)*(TIER_MULT[ch.tier]||1));
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
  // Tuned formula: lower divisors so stats hit harder
  // ATK/30 means 60 ATK = 2x power multiplier (was 1.2x with /50)
  // 35/(35+DEF) means 35 DEF blocks ~50% (was ~41% with 50/(50+DEF))
  const base=((move.power*(atkStat/30))*(35/(35+defStat)))+2;
  const variance=0.85+Math.random()*0.15;
  // Speed bonus: max 20% at +40 spd gap (was 12%)
  const spdDiff=atk.spd-def.spd;
  const spdBonus=spdDiff>0?1+Math.min(0.20,spdDiff*0.005):1.0;
  // Speed also gives dodge chance to defender (max 12%)
  const dodgeChance=spdDiff<0?Math.min(0.12,Math.abs(spdDiff)*0.003):0;
  if(Math.random()<dodgeChance) return {dmg:0,crit:false,typeMult:1,dodged:true};
  const typeMult=getTypeMultiplier(move.type, def._moves||[]);
  let dmg=Math.floor(base*variance*spdBonus*typeMult);
  // Crit: base 8%, +0.15% per speed point above opponent (max 20%)
  const critRate=Math.min(0.20,0.08+(spdDiff>0?spdDiff*0.0015:0));
  const crit=Math.random()<critRate;
  if(crit) dmg=Math.floor(dmg*1.5);
  return {dmg:Math.max(1,dmg),crit,typeMult,dodged:false};
}

// ---- BATTLE STATE ----
let currentBattle=null;

function detectSynergies(teamIds) {
  const active = [];
  for (const [key, synergy] of Object.entries(TEAM_SYNERGIES)) {
    const memberCount = synergy.members.filter(m => teamIds.includes(m)).length;
    if (memberCount >= 2) {
      active.push({ key, ...synergy, memberCount });
    }
  }
  return active;
}

function getSynergyBonuses(synergies) {
  const merged = { atk: 1.0, def: 1.0, spd: 1.0, haki: 1.0, df: 1.0, healing: 0.0 };
  for (const syn of synergies) {
    if (syn.bonus.atk) merged.atk *= (1 + syn.bonus.atk);
    if (syn.bonus.def) merged.def *= (1 + syn.bonus.def);
    if (syn.bonus.spd) merged.spd *= (1 + syn.bonus.spd);
    if (syn.bonus.haki) merged.haki *= (1 + syn.bonus.haki);
    if (syn.bonus.df) merged.df *= (1 + syn.bonus.df);
    if (syn.bonus.healing) merged.healing += syn.bonus.healing;
  }
  return merged;
}


class BattleChar{
  constructor(ch, synergyBonuses) {
    // Default synergy bonuses if not provided
    synergyBonuses = synergyBonuses || { atk: 1.0, def: 1.0, spd: 1.0, haki: 1.0, df: 1.0, healing: 0.0 };
        Object.assign(this,ch);
    // Store character level for display
    // _forcedLevel lets enemies fight at a set strength (e.g. difficulty-scaled)
    const isPlayer = typeof isUnlocked==='function' && isUnlocked(ch.id) && !ch._forcedLevel;
    this._isPlayer = isPlayer; // flag so upgrade boosts only apply to player chars
    this.charLevel = ch._forcedLevel || (typeof getCharLevelNum==='function' ? getCharLevelNum(ch.id) : 1);
    this.evoStage = typeof getEvoStage==='function' ? getEvoStage(ch.id) : 1;
    // Show evolution form name in battle
    const _evoName = typeof getEvoFormName==='function' ? getEvoFormName(ch.id) : null;
    if(_evoName) this.name = _evoName;
    // GROWTH SYSTEM: base stats represent max potential, scale by level
    // For enemies with _forcedLevel, compute growth directly
    const _lvl = this.charLevel;
    const _growthMult = _lvl >= MAX_LEVEL ? GROWTH_CEIL : GROWTH_FLOOR + (GROWTH_CEIL - GROWTH_FLOOR) * ((_lvl - 1) / (MAX_LEVEL - 1));
    const effStats = isPlayer && typeof getEffectiveStats==='function'
      ? getEffectiveStats(ch.id, ch)
      : {atk:Math.floor((ch.atk||0)*_growthMult), def:Math.floor((ch.def||0)*_growthMult), spd:Math.floor((ch.spd||0)*_growthMult), haki:Math.floor((ch.haki||0)*_growthMult), df:Math.floor((ch.df||0)*_growthMult)};
    this.atk = effStats.atk; this.def = effStats.def; this.spd = effStats.spd;
    this.haki = effStats.haki; this.df = effStats.df;
    // Evolution boosts stack on top (beyond potential)
    const evoB = typeof getEvoBoosts==='function' ? getEvoBoosts(ch.id) : {atk:0,def:0,spd:0,haki:0,df:0};
    this.atk += evoB.atk; this.def += evoB.def; this.spd += evoB.spd;
    if(evoB.haki) this.haki = (this.haki||0) + evoB.haki;
    if(evoB.df) this.df = (this.df||0) + evoB.df;
    // Store passive reference
    this._passive = typeof getCharPassive==='function' ? getCharPassive(ch.id) : null;
    // Store relic reference
    this._relic = typeof getCharRelic==='function' ? getCharRelic(ch.id) : null;
    // Apply relic stat buffs
    if(this._relic){
      const rl=this._relic;
      if(rl.stats){for(const s in rl.stats){if(this[s]!==undefined) this[s]=Math.floor(this[s]*(1+rl.stats[s]));}}
      if(rl.stat&&rl.value&&!rl.moveType){this[rl.stat]=Math.floor(this[rl.stat]*(1+rl.value));}
    }
    // Passive init counters
    this._passiveUsed = false;
    this._attackCount = 0;
    this._shieldCharges = 0;
    this._turnCount = 0;
    // Apply synergy bonuses to base stats BEFORE HP calculation
    this.atk = Math.floor(this.atk * synergyBonuses.atk);
    this.def = Math.floor(this.def * synergyBonuses.def);
    this.spd = Math.floor(this.spd * synergyBonuses.spd);
    if (synergyBonuses.haki > 1.0) this.haki = Math.floor((this.haki || 0) * synergyBonuses.haki);
    if (synergyBonuses.df > 1.0) this.df = Math.floor((this.df || 0) * synergyBonuses.df);
    this._synergyHealing = synergyBonuses.healing;
    // HP uses current effective stats (growth-scaled), not raw potential
    this.maxHP=calcMaxHP(this);
    if(ch._bossHpMult) this.maxHP=Math.floor(this.maxHP*ch._bossHpMult);
    this.hp=this.maxHP;

    // Move progression system based on character level
    const allMoves = BATTLE_MOVES[ch.id]||[
      {name:'Strike',type:'physical',power:50,acc:100,pp:30,effect:null},
      {name:'Power Hit',type:'physical',power:75,acc:90,pp:15,effect:null},
      {name:'Special',type:'special',power:90,acc:85,pp:8,effect:null},
      {name:'Ultimate',type:'special',power:110,acc:78,pp:4,effect:null}
    ];

    // Determine available moves based on character level
    const lvl = this.charLevel;
    let moveCount = 1;
    if(lvl >= 35) moveCount = 4;
    else if(lvl >= 20) moveCount = 3;
    else if(lvl >= 10) moveCount = 2;

    const availMoves = allMoves.slice(0, moveCount);
    this.moves = availMoves.map(m=>({...m,curPP:m.pp}));
    this.status=[];
    this.statMod={atk:0,def:0,spd:0};
    this.fainted=false;
    this._moves=this.moves; // ref for type chart
  }
}

class Battle{
  constructor(pTeam,eTeam,diff){
    // Detect synergies for player team
    const pSynergies = detectSynergies(pTeam.map(c => c.id));
    const pSynergyBonuses = getSynergyBonuses(pSynergies);
    this.pSynergies = pSynergies;
    this.pSynergyBonuses = pSynergyBonuses;
    this.pTeam=pTeam.map(c=>new BattleChar(c, pSynergyBonuses));
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
    let pSpd=p.spd*(1+p.statMod.spd*0.25);
    let eSpd=e.spd*(1+e.statMod.spd*0.25);
    // Priority passive: always goes first
    if(p._passive && p._passive.type==='priority') pSpd=99999;
    if(e._passive && e._passive.type==='priority') eSpd=99999;
    const playerFirst=pSpd>=eSpd;

    const first=playerFirst?p:e, second=playerFirst?e:p;
    const fMove=playerFirst?pMove:eMove, sMove=playerFirst?eMove:pMove;
    const fTarget=playerFirst?e:p, sTarget=playerFirst?p:e;

    this.execAttack(first,fTarget,fMove);
    if(!sTarget.fainted&&!second.fainted) this.execAttack(second,sTarget,sMove);

    // Status ticks
    this.tickStatus(p); this.tickStatus(e);

    // Sannin healing: 3% HP per turn if synergy active
    if (this.pSynergies && this.pSynergies.some(s => s.key === 'sannin')) {
      const healAmount = Math.floor(p.maxHP * 0.03);
      p.hp = Math.min(p.maxHP, p.hp + healAmount);
      if (healAmount > 0) this.addLog(`${p.name} recovered ${healAmount} HP from Sannin synergy!`);
    }

    // Check fainting
    this.checkFaint();
    this.turn++;
    return this.pendingLog;
  }

  execAttack(atk,def,move){
    if(atk.fainted) return;
    atk._turnCount = (atk._turnCount||0) + 1;
    atk._attackCount = (atk._attackCount||0) + 1;
    const isPlayerAtk = this.pTeam.includes(atk);
    const isPlayerDef = this.pTeam.includes(def);
    // Fear passive: chance enemy skips turn
    if(def._passive && def._passive.type==='fear' && Math.random()<def._passive.value){
      this.addLog(`${atk.name} is frozen with fear by ${def.name}!`);
      return;
    }
    // Stun check
    if(atk.status.some(s=>s.type==='stun')&&Math.random()<0.3){
      this.addLog(`${atk.name} is paralyzed and can't move!`); return;
    }
    if(move.curPP<=0){this.addLog(`${atk.name} has no PP for ${move.name}!`);return;}
    move.curPP--;
    // Accuracy - passive acc boost
    let accMod = 0;
    if(atk._passive && atk._passive.type==='acc_boost') accMod = atk._passive.value;
    // Dodge passives on defender
    if(def._passive){
      const dp = def._passive;
      if(dp.type==='dodge' && Math.random()<dp.value){
        this.addLog(`${atk.name} used ${move.name}... ${def.name} dodged!`);
        playSound('miss'); playMissAnimation(!isPlayerDef);
        return;
      }
      if(dp.type==='dodge_type' && dp.moveTypes && dp.moveTypes.includes(move.type) && Math.random()<dp.value){
        this.addLog(`${atk.name} used ${move.name}... ${def.name} dodged!`);
        playSound('miss'); playMissAnimation(!isPlayerDef);
        return;
      }
      if(dp.type==='counter' && Math.random()<dp.value){
        this.addLog(`${def.name} dodged and countered!`);
        playSound('miss'); playMissAnimation(!isPlayerDef);
        // Counter does 50% of a basic attack back
        const counterDmg = Math.max(1, Math.floor((def.atk - atk.def*0.3)*0.5));
        atk.hp = Math.max(0, atk.hp - counterDmg);
        this.addLog(`${def.name} dealt ${counterDmg} counter damage!`);
        if(atk.hp<=0){atk.fainted=true;this.addLog(`${atk.name} fainted!`);}
        return;
      }
    }
    // Accuracy check
    if(Math.random()*100>(move.acc+accMod)){
      this.addLog(`${atk.name} used ${move.name}... Miss!`);
      playSound('miss'); playMissAnimation(!isPlayerDef);
      return;
    }
    // Passive negate: darkness negates enemy passive temporarily
    let defPassiveSaved = def._passive;
    if(atk._passive && atk._passive.type==='passive_negate' && Math.random()<atk._passive.value){
      def._passive = null;
      this.addLog(`${atk.name}'s darkness negated ${def.name}'s passive!`);
    }
    // Calculate damage
    let {dmg,crit,typeMult,dodged}=calcDamage(atk,def,move);
    // Speed dodge
    if(dodged){
      this.addLog(`${def.name} dodged ${atk.name}'s ${move.name}!`);
      playSound('miss');
      def._passive = defPassiveSaved;
      return; // exit execAttack; doTurn handles faint checking
    }
    // Passive crit boost
    if(!crit && atk._passive && atk._passive.type==='crit_boost'){
      if(Math.random()<atk._passive.value){crit=true;dmg=Math.floor(dmg*1.5);}
    }
    // Nika passive: all damage +25%
    if(atk._passive && atk._passive.type==='nika') dmg = Math.floor(dmg * (1 + atk._passive.dmgBoost));
    // Baryon mode: +30% atk bonus when hp below 40%
    if(atk._passive && atk._passive.type==='conditional_stat' && atk._passive.condition==='hp_below_40' && atk.hp < atk.maxHP*0.4){
      dmg = Math.floor(dmg * (1 + atk._passive.value));
    }
    // Eighth gate: massive damage boost but self-damage
    if(atk._passive && atk._passive.type==='eighth_gate'){
      dmg = Math.floor(dmg * 1.5);
      const selfDmg = Math.floor(atk.maxHP * 0.05);
      atk.hp = Math.max(1, atk.hp - selfDmg);
    }
    // Damage reduction passives on defender
    if(def._passive && def._passive.type==='damage_reduce' && def._passive.moveTypes && def._passive.moveTypes.includes(move.type)){
      dmg = Math.floor(dmg * (1 - def._passive.value));
    }
    // Conditional DEF boost
    if(def._passive && def._passive.type==='conditional_stat' && def._passive.stat==='def' && def._passive.condition==='hp_above_50' && def.hp > def.maxHP*0.5){
      dmg = Math.floor(dmg * (1 - def._passive.value));
    }
    // Shield charges (yata_mirror)
    if(def._passive && def._passive.type==='shield' && (def._shieldCharges||0)<(def._passive.charges||3)){
      dmg = Math.floor(dmg * (1 - (def._passive.value||0.5)));
      def._shieldCharges = (def._shieldCharges||0)+1;
    }
    // Relic move type bonus for attacker
    if(atk._relic){
      const r = atk._relic;
      if(r.moveType && r.moveType===move.type) dmg = Math.floor(dmg * (1 + r.value));
      else if(r.stat==='atk' && !r.moveType) dmg = Math.floor(dmg * (1 + r.value));
    }
    def.hp=Math.max(0,def.hp-dmg);
    let msg=`${atk.name} used ${move.name}! ${dmg} dmg!`;
    if(typeMult>1.1){msg+=` Super effective!`;playSound('supereffective');}
    else if(typeMult<0.9){msg+=` Not very effective...`;}
    if(crit){msg+=` Critical hit!`;playSound('crit');shakeScreen('big');}
    else{playSound('hit');shakeScreen('small');}
    this.addLog(msg);
    // Animations
    playHitAnimation(!isPlayerDef, crit, typeMult);
    showDamageNumber(!isPlayerDef ? '#eCharCard' : '#pCharCard', dmg, crit, typeMult);
    // On-hit passives: burn chance
    if(atk._passive && (atk._passive.type==='on_hit_burn') && Math.random()<atk._passive.value && !def.fainted){
      if(!def.status.some(s=>s.type==='burn')){
        def.status.push({type:'burn',turns:3});
        this.addLog(`${def.name} was burned by ${atk.name}'s passive!`);
        playStatusAnimation(!isPlayerDef, 'burn');
      }
    }
    // On-hit stun
    if(atk._passive && atk._passive.type==='on_hit_stun' && Math.random()<atk._passive.value && !def.fainted){
      if(!def.status.some(s=>s.type==='stun')){
        def.status.push({type:'stun',turns:2});
        this.addLog(`${def.name} was stunned by ${atk.name}'s passive!`);
        playStatusAnimation(!isPlayerDef, 'stun');
      }
    }
    // Revive passive check (Rinnegan)
    if(def.hp<=0){
      if(def._passive && def._passive.type==='revive' && !def._passiveUsed){
        def._passiveUsed = true;
        def.hp = Math.floor(def.maxHP * def._passive.value);
        def.fainted = false;
        this.addLog(`${def.name} revived with their passive!`);
        playHealAnimation(!isPlayerDef);
      } else {
        def.fainted=true;this.addLog(`${def.name} fainted!`);playSound('faint');shakeScreen('big');
      }
    }
    // Emergency heal passive
    if(!def.fainted && def._passive && def._passive.type==='emergency_heal' && !def._passiveUsed && def.hp>0 && def.hp<def.maxHP*def._passive.threshold){
      def._passiveUsed = true;
      const heal = Math.floor(def.maxHP * def._passive.value);
      def.hp = Math.min(def.maxHP, def.hp + heal);
      this.addLog(`${def.name}'s passive healed ${heal} HP!`);
      playHealAnimation(!isPlayerDef);
    }
    // Restore defender passive if negated
    def._passive = defPassiveSaved;
    // Effect
    if(move.effect&&!def.fainted) this.applyEffect(atk,def,move.effect);
  }

  applyEffect(atk,def,eff){
    const isPlayerDef2 = this.pTeam.includes(def);
    const isPlayerAtk2 = this.pTeam.includes(atk);
    if(eff==='burn'&&!def.status.some(s=>s.type==='burn')){
      def.status.push({type:'burn',turns:3});this.addLog(`${def.name} was burned!`);
      playStatusAnimation(!isPlayerDef2, 'burn');
    }else if(eff==='poison'&&!def.status.some(s=>s.type==='poison')){
      def.status.push({type:'poison',turns:3});this.addLog(`${def.name} was poisoned!`);
      playStatusAnimation(!isPlayerDef2, 'poison');
    }else if(eff==='stun'&&!def.status.some(s=>s.type==='stun')){
      def.status.push({type:'stun',turns:2});this.addLog(`${def.name} was paralyzed!`);
      playStatusAnimation(!isPlayerDef2, 'stun');
    }else if(eff.startsWith('heal:')){
      const pct=parseInt(eff.split(':')[1]);
      const heal=Math.floor(atk.maxHP*pct/100);
      atk.hp=Math.min(atk.maxHP,atk.hp+heal);
      this.addLog(`${atk.name} recovered ${heal} HP!`);playSound('heal');
      playHealAnimation(isPlayerAtk2);
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
    // Passive regen
    if(ch._passive && (ch._passive.type==='regen'||ch._passive.type==='regen_plus')){
      const healAmt = Math.floor(ch.maxHP * (ch._passive.healValue||ch._passive.value));
      if(healAmt>0 && ch.hp<ch.maxHP){
        ch.hp=Math.min(ch.maxHP, ch.hp+healAmt);
        this.addLog(`${ch.name} regenerated ${healAmt} HP!`);
      }
    }
    // Relic regen
    if(ch._relic && ch._relic.stat==='regen'){
      const rHeal = Math.floor(ch.maxHP * ch._relic.value);
      if(rHeal>0 && ch.hp<ch.maxHP){
        ch.hp=Math.min(ch.maxHP, ch.hp+rHeal);
        this.addLog(`${ch.name}'s ${ch._relic.name} healed ${rHeal} HP!`);
      }
    }
    // Soul drain passive: steal HP on kill (handled elsewhere)
    // Status ticks
    ch.status=ch.status.filter(s=>{
      // Status extend passive
      const extPassive = ch._passive && ch._passive.type==='status_extend' ? ch._passive.value : 0;
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
    // Use AI personality for medium/hard
    const personality = typeof getAIPersonality==='function' ? getAIPersonality(ai.id) : null;
    if(personality && this.diff==='hard'){
      const idx = personality.pickMove(ai.moves, ai, target);
      // Hard mode: also consider switching
      const switchIdx = personality.shouldSwitch ? personality.shouldSwitch(this.eTeam, ai, target) : -1;
      if(switchIdx >= 0 && switchIdx < this.eTeam.length && !this.eTeam[switchIdx].fainted){
        this.eIdx = switchIdx;
        return typeof getAIPersonality==='function' ? getAIPersonality(this.eActive.id).pickMove(this.eActive.moves, this.eActive, target) : 0;
      }
      return idx;
    }
    if(personality && this.diff==='medium'){
      return Math.random()<0.7 ? personality.pickMove(ai.moves, ai, target) : avail[Math.floor(Math.random()*avail.length)].i;
    }
    // Fallback
    let best=avail[0];
    avail.forEach(x=>{if(x.m.power*x.m.acc>best.m.power*best.m.acc) best=x;});
    return best.i;
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
  document.getElementById('battleArena').style.display='none';
  document.getElementById('battleSetup').style.display='block';
  currentBattle=null;
  selectedBattleTeam=[];
  selectedDifficulty='medium';
  currentBet=0;
  expWagerMult=1;
  equippedItems=[];
  // Remove endless toggle if present
  const endToggle = document.getElementById('endlessToggleContainer');
  if(endToggle) endToggle.remove();
  // Show bet section, hide EXP wager section (normal mode)
  const betSection = document.querySelector('.bet-section');
  if(betSection) betSection.style.display='block';
  const wagerSection = document.getElementById('expWagerSection');
  if(wagerSection) wagerSection.style.display='none';
  renderBattleSetup();
}

function renderBattleSetup(){
  const grid=document.getElementById('battleTeamGrid');
  let unlocked=ALL_CHARS.filter(c=>isUnlocked(c.id));
  // In story mode, restrict to matching anime
  if(storyContext){
    const arc=STORY_ARCS.find(a=>a.id===storyContext.arcId);
    if(arc) unlocked=unlocked.filter(c=>c.anime===arc.anime);
  } else if(typeof globalAnimeFilter!=='undefined'&&globalAnimeFilter!=='both'){
    unlocked=unlocked.filter(c=>c.anime===globalAnimeFilter);
  }

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
  const startBtn = document.getElementById('btnBattleStart');
  startBtn.disabled=selectedBattleTeam.length!==3;
  startBtn.textContent='FIGHT!';
  startBtn.onclick=()=>startBattleFight();

  // Story mode anime restriction label
  const storyLabel=document.getElementById('storyAnimeLabel');
  if(storyLabel){
    if(storyContext){
      const arc=STORY_ARCS.find(a=>a.id===storyContext.arcId);
      const animeName=arc&&arc.anime==='onepiece'?'One Piece':'Naruto';
      storyLabel.style.display='block';
      storyLabel.textContent=`${animeName} characters only`;
    } else {
      storyLabel.style.display='none';
    }
  }

  // Difficulty buttons
  document.querySelectorAll('.diff-btn').forEach(b=>{
    b.classList.toggle('diff-active',b.dataset.diff===selectedDifficulty);
  });

  // Show bet and item rows (hidden in endless mode)
  const betRow = document.getElementById('betRow');
  if(betRow) betRow.style.display='block';
  if(betRow) {
    const betOpts = getBetOptions();
    betRow.innerHTML = betOpts.map(amt => {
      const selected = currentBet === amt;
      const isAllIn = amt > 0 && amt === saveData.coins;
      const label = amt === 0 ? 'NONE' : (isAllIn ? `ALL IN (${amt.toLocaleString()})` : amt.toLocaleString());
      return `<button class="bet-btn ${selected?'bet-active':''} ${isAllIn?'bet-allin':''}"
        onclick="setBet(${amt})">
        ${label}
      </button>`;
    }).join('');
  }

  // Show potential winnings
  const potentialEl = document.getElementById('betPotential');
  if(potentialEl) {
    const baseReward = DIFF_REWARDS[selectedDifficulty] + DIFF_BONUS_WIN[selectedDifficulty];
    const betWin = currentBet > 0 ? Math.floor(currentBet * ({'easy':1.5,'medium':2,'hard':3,'extreme':4}[selectedDifficulty]||2)) : 0;
    potentialEl.textContent = currentBet > 0
      ? `Win: +${baseReward} base + ${betWin} bet payout = ${baseReward+betWin} total`
      : `Win: +${baseReward} coins`;
  }

  // Item equip row
  const itemRow = document.getElementById('itemEquipRow');
  if(itemRow) {
    itemRow.style.display='block';
    const inv = loadInventory();
    const hasItems = Object.keys(inv).length > 0;
    if(hasItems) {
      let html = '';
      for(const [id, qty] of Object.entries(inv)) {
        if(qty <= 0) continue;
        const item = ITEMS[id]; if(!item) continue;
        const eqCount = equippedItems.filter(e=>e===id).length;
        const available = qty - eqCount;
        const equipped = eqCount > 0;
        html += `<button class="item-eq-btn ${equipped?'item-equipped':''}" onclick="toggleEquipItem('${id}')">
          ${item.emoji} ${item.name}${qty>1?' x'+qty:''} ${eqCount>0?'('+eqCount+' equipped)':''}
        </button>`;
      }
      if(equippedItems.length > 0) {
        html += `<button class="item-eq-btn item-clear" onclick="equippedItems=[];renderBattleSetup()">Clear All</button>`;
      }
      itemRow.innerHTML = html;
    } else {
      itemRow.innerHTML = '<span style="font-size:11px;color:#666">No items. Buy some from the Shop!</span>';
    }
  }

  // Hide EXP wager in normal battle mode (EXP wager is endless-only)
  const wagerSection = document.getElementById('expWagerSection');
  if(wagerSection) wagerSection.style.display = 'none';

  // Show active synergies
  const synergyEl = document.getElementById('activeSynergies');
  if(synergyEl) {
    if(selectedBattleTeam.length >= 2) {
      const synergies = detectSynergies(selectedBattleTeam);
      if(synergies.length > 0) {
        synergyEl.innerHTML = synergies.map(s => {
          const bonusParts = [];
          if(s.bonus.atk) bonusParts.push(`+${Math.round(s.bonus.atk*100)}% ATK`);
          if(s.bonus.def) bonusParts.push(`+${Math.round(s.bonus.def*100)}% DEF`);
          if(s.bonus.spd) bonusParts.push(`+${Math.round(s.bonus.spd*100)}% SPD`);
          if(s.bonus.haki) bonusParts.push(`+${Math.round(s.bonus.haki*100)}% HAKI`);
          if(s.bonus.df) bonusParts.push(`+${Math.round(s.bonus.df*100)}% DF`);
          if(s.bonus.healing) bonusParts.push(`+${Math.round(s.bonus.healing*100)}% heal/turn`);
          return `<div class="synergy-badge"><span class="syn-emoji">${s.emoji}</span> <strong>${s.name}</strong> <span class="syn-bonus">${bonusParts.join(', ')}</span></div>`;
        }).join('');
        synergyEl.style.display = 'block';
      } else {
        synergyEl.style.display = 'none';
      }
    } else {
      synergyEl.style.display = 'none';
    }
  }
}

function toggleBattleChar(id){
  const idx=selectedBattleTeam.indexOf(id);
  if(idx>=0) selectedBattleTeam.splice(idx,1);
  else if(selectedBattleTeam.length<3) selectedBattleTeam.push(id);
  renderBattleSetup();
}

function setDifficulty(d){selectedDifficulty=d;renderBattleSetup();}

function toggleEquipItem(itemId){
  const inv=loadInventory();
  const owned=inv[itemId]||0;
  const eqCount=equippedItems.filter(e=>e===itemId).length;
  if(eqCount>0){
    // Unequip one
    const idx=equippedItems.indexOf(itemId);
    if(idx>=0) equippedItems.splice(idx,1);
  }else if(equippedItems.length<3 && eqCount<owned){
    // Equip one
    equippedItems.push(itemId);
  }
  renderBattleSetup();
}

let currentBet = 0;
let expWagerMult = 1; // EXP wager multiplier: 1x (safe), 2x, 5x, 10x
function getBetOptions() {
  const coins = saveData.coins || 0;
  const opts = [0];
  for(const amt of [100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000]) {
    if(amt <= coins) opts.push(amt);
  }
  if(coins > 0 && opts[opts.length-1] !== coins) opts.push(coins);
  return opts;
}

function setExpWager(mult) {
  expWagerMult = mult;
  renderBattleSetup();
}

function setBet(amount) {
  if(amount > saveData.coins) return;
  currentBet = amount;
  renderBattleSetup();
}

function startBattleFight(){
  if(selectedBattleTeam.length!==3) return;
  if(currentBet > saveData.coins) { currentBet = 0; }
  const pTeam=selectedBattleTeam.map(id=>ALL_CHARS.find(c=>c.id===id));
  let eTeam;

  // Save the last team used for "Play Again"
  lastBattleTeam = [...selectedBattleTeam];

  if(storyContext){
    if(storyContext.type==='boss'){
      // Boss fight: boss has boosted stats
      const bossChar={...ALL_CHARS.find(c=>c.id===storyContext.bossId)};
      const _pMult = typeof getArcPrestige==='function' ? (function(){ const pl=getArcPrestige(storyContext.arcId); const pi=getPrestigeInfo(pl); return pi?pi.statMult:1; })() : 1;
    bossChar.atk=Math.floor(bossChar.atk*storyContext.bossStatMult*_pMult);
      bossChar.def=Math.floor(bossChar.def*storyContext.bossStatMult*_pMult);
      bossChar.spd=Math.floor(bossChar.spd*storyContext.bossStatMult*_pMult);
      if(bossChar.haki) bossChar.haki=Math.floor(bossChar.haki*storyContext.bossStatMult*_pMult);
      if(bossChar.df) bossChar.df=Math.floor(bossChar.df*storyContext.bossStatMult*_pMult);
      bossChar._bossHpMult=storyContext.bossHpMult;
      bossChar._forcedLevel=50; // bosses always fight at full potential
      const allies=storyContext.allies.map(id=>ALL_CHARS.find(c=>c.id===id)).filter(Boolean);
      allies.forEach(a=>{a._forcedLevel=50;});
      eTeam=[bossChar,...allies];
    }else{
      const arc=STORY_ARCS.find(a=>a.id===storyContext.arcId);
      const ch=arc.chapters[storyContext.chIdx];
      eTeam=ch.enemies.map(id=>ALL_CHARS.find(c=>c.id===id)).filter(Boolean);
    }
  }else{
    eTeam=aiSelectTeam(selectedDifficulty);
  }

  // Set enemy level based on difficulty so growth system scales them
  const DIFF_ENEMY_LEVEL = {easy:1, medium:15, hard:35, extreme:50};
  const eLvl = DIFF_ENEMY_LEVEL[selectedDifficulty] || 35;
  eTeam.forEach(c=>{ if(!c._forcedLevel) c._forcedLevel = eLvl; });
  currentBattle=new Battle(pTeam,eTeam,selectedDifficulty);
  currentBattle.bet = currentBet;
  currentBattle.expWager = expWagerMult;
  currentBattle.storyContext = storyContext;
  // Deduct bet upfront (no betting in story mode)
  if(!storyContext && currentBet > 0) { saveData.coins -= currentBet; saveSave(); }
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
  const pLvlEl=document.getElementById('pLevel');
  if(pLvlEl) pLvlEl.textContent='Lv.'+p.charLevel;
  const pEvoEl=document.getElementById('pEvoStage');
  if(pEvoEl){const ms=getMaxEvoStage(p.id);pEvoEl.textContent=p.evoStage>1?'★'.repeat(p.evoStage-1):'';pEvoEl.className='fighter-evo evo-s'+p.evoStage;}
  // Evo aura on player image
  const pImgEl=document.getElementById('pImg');
  pImgEl.src=CHAR_IMGS[p.id]||'images/'+p.id+'.jpg';
  pImgEl.className='fighter-img'+(p.evoStage>=3?' evo-aura-3':p.evoStage>=2?' evo-aura-2':'');
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
  const eLvlEl=document.getElementById('eLevel');
  if(eLvlEl) eLvlEl.textContent='Lv.'+e.charLevel;
  const eEvoEl=document.getElementById('eEvoStage');
  if(eEvoEl){eEvoEl.textContent=e.evoStage>1?'★'.repeat(e.evoStage-1):'';eEvoEl.className='fighter-evo evo-s'+e.evoStage;}
  // Evo aura on enemy image
  const eImgEl=document.getElementById('eImg');
  eImgEl.src=CHAR_IMGS[e.id]||'images/'+e.id+'.jpg';
  eImgEl.className='fighter-img'+(e.evoStage>=3?' evo-aura-3':e.evoStage>=2?' evo-aura-2':'');
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
      ${equippedItems.length>0?`<button class="item-btn" onclick="showBattleItems()">🧪 Items (${equippedItems.length})</button>`:''}
      <button class="forfeit-btn" onclick="${storyContext?'abandonStoryRun()':'closeBattle()'}">Quit</button>
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
    const betMult = {'easy':1.5,'medium':2,'hard':3,'extreme':4}[b.diff]||2;
    const betWin = b.phase==='won' ? Math.floor(bet * betMult) : 0;
    if(!b._resultHandled) {
      b._resultHandled = true;
      const sc=b.storyContext;
      if(sc && b.phase==='won'){
        if(sc.type==='chapter'){
          completeStoryChapter(sc.arcId,sc.chIdx,sc.reward);
        }else if(sc.type==='boss'){
          b._bossFirstClear=completeStoryBoss(sc.arcId,sc.reward,sc.arcReward);
        }
        saveData.wins++;saveSave();playSound('win');
      }else if(b.phase==='won'){
        saveData.wins++;addCoins(reward+bonus+betWin);playSound('win');
      }else{
        saveData.losses++;saveSave();
      }
      // Check daily challenges
      // Award EXP to team (with wager multiplier)
      const expResults = [];
      const wagerMult = b.expWager || 1;
      if(b.pTeam){
        const sc2=b.storyContext;
        b.pTeam.forEach(bc=>{
          let expAmt = calcBattleExp(b.phase==='won', b.diff, bc.tier||'B', !!sc2, !!(sc2&&sc2.type==='boss'));
          if(wagerMult > 1){
            if(b.phase==='won'){
              expAmt = Math.floor(expAmt * wagerMult);
            } else {
              // Lost with wager: LOSE exp (negative)
              expAmt = -Math.floor(Math.abs(expAmt) * wagerMult);
            }
          }
          const result = addCharExp(bc.id, expAmt);
          expResults.push({id:bc.id, name:bc.name, exp:expAmt, levelUps:result.levelUps, newLevel:result.newLevel, levelDowns:result.levelDowns||0});
        });
      }
      b._expResults = expResults;

      const daily=loadDaily();
      const battleResult={
        won:b.phase==='won',
        team:b.pTeam,
        diff:b.diff,
        synergies:(b.pSynergies||[]).length,
        fainted:b.pTeam.filter(c=>c.fainted).length,
        turns:b.turn,
        itemsUsed:(b._itemsUsed||0),
        bet:b.bet||0,
        storyChapter:!!(sc&&sc.type==='chapter'&&b.phase==='won'),
        bossKill:!!(sc&&sc.type==='boss'&&b.phase==='won'),
        dailyWins:(daily.dailyWins||0)+(b.phase==='won'?1:0)
      };
      b._dailyCompleted=checkDailyChallenges(battleResult);
    }

    let rewardHTML = '';
    const sc=b.storyContext;
    if(sc && b.phase==='won'){
      if(sc.type==='chapter'){
        const arc=STORY_ARCS.find(a=>a.id===sc.arcId);
        const chTotal=arc?arc.chapters.length:0;
        const nextIsLast=sc.chIdx+1>=chTotal;
        rewardHTML=`<div class="reward-breakdown">
          <div class="reward-line">📖 Chapter Complete! (${sc.chIdx+1}/${chTotal})</div>
          <div class="reward-total">+${sc.reward} coins banked</div>
          <div class="reward-line" style="font-size:0.75rem;opacity:0.7">Coins paid out after full arc clear</div>
          ${nextIsLast?'<div class="reward-line" style="color:#ff4444;font-weight:bold;margin-top:4px">⚠️ BOSS FIGHT NEXT</div>':''}
        </div>`;
      }else if(sc.type==='boss'){
        const arcR=b._bossFirstClear?sc.arcReward:0;
        const banked=storyRunState?0:(b._bankedCoins||0); // already paid out in completeStoryBoss
        rewardHTML=`<div class="reward-breakdown">
          <div class="reward-line">👑 Boss Defeated!</div>
          <div class="reward-line">📖 All chapter rewards paid out</div>
          <div class="reward-total">+${sc.reward} boss reward</div>
          ${arcR>0?`<div class="reward-line reward-bet">🏆 Arc Complete Bonus: +${arcR}</div>`:''}
        </div>`;
      }
    }else if(b.phase==='won') {
      rewardHTML = `<div class="reward-breakdown">
        <div class="reward-line">Base reward: +${reward+bonus}</div>
        ${betWin > 0 ? `<div class="reward-line reward-bet">Bet payout (${betMult}x): +${betWin}</div>` : ''}
        <div class="reward-total">Total: +${reward+bonus+betWin} coins</div>
      </div>`;
    } else if(bet > 0) {
      rewardHTML = `<div class="reward-breakdown loss"><div class="reward-line">Bet lost: -${bet} coins</div></div>`;
    }

    // Show EXP gains/losses
    if(b._expResults && b._expResults.length > 0){
      const wMult = b.expWager || 1;
      const hasLoss = b._expResults.some(er => er.exp < 0);
      rewardHTML += '<div class="exp-results' + (hasLoss ? ' exp-loss' : '') + '">';
      rewardHTML += '<div class="exp-results-title">' + (hasLoss ? 'EXP LOST ('+wMult+'x WAGER)' : (wMult > 1 ? 'EXP GAINED ('+wMult+'x WAGER)' : 'EXP GAINED')) + '</div>';
      b._expResults.forEach(er=>{
        const lvlInfo = getCharLevel(er.id);
        const nextExp = er.newLevel >= MAX_CHAR_LEVEL ? 1 : expForLevel(er.newLevel+1);
        const pct = nextExp > 0 ? Math.floor(lvlInfo.exp/nextExp*100) : 100;
        const expLabel = er.exp >= 0 ? '+'+er.exp+' EXP' : er.exp+' EXP';
        const expClass = er.exp < 0 ? 'exp-amount-loss' : 'exp-amount';
        rewardHTML += '<div class="exp-result-row">'
          + '<span class="exp-char-name">'+er.name+'</span>'
          + '<span class="'+expClass+'">'+expLabel+'</span>'
          + (er.levelDowns>0?'<span class="exp-leveldown">LEVEL DOWN! Lv.'+er.newLevel+'</span>'
            :er.levelUps>0?'<span class="exp-levelup">LEVEL UP! Lv.'+er.newLevel+'</span>'
            :'<span class="exp-level">Lv.'+er.newLevel+'</span>')
          + '<div class="exp-bar-mini"><div class="exp-bar-fill" style="width:'+pct+'%"></div></div>'
          + '</div>';
      });
      rewardHTML += '</div>';
    }

    // Story mode: determine buttons
    let resultBtns='';
    const dailyNote=b._dailyCompleted?'<div class="daily-complete-note">🎯 Daily Challenge Completed!</div>':'';
    if(sc && b.phase==='won' && sc.type==='chapter'){
      // Won a chapter: auto-advance
      const arc=STORY_ARCS.find(a=>a.id===sc.arcId);
      const nextIdx=sc.chIdx+1;
      const nextLabel=nextIdx<arc.chapters.length?'Next Chapter: '+arc.chapters[nextIdx].name:'FIGHT THE BOSS';
      resultBtns=`<button onclick="storyAdvanceNext()" style="background:linear-gradient(135deg,#ff6600,#ff3300);font-weight:bold">⚔️ ${nextLabel}</button>
        <button onclick="abandonStoryRun()" style="font-size:0.8rem;opacity:0.7">Abandon Run</button>`;
    }else if(sc && b.phase==='won' && sc.type==='boss'){
      // Beat the boss: arc complete
      resultBtns=`<button onclick="storyContext=null;storyRunState=null;showStoryMode()">Back to Story</button>
        <button onclick="storyContext=null;storyRunState=null;closeBattle()">Main Menu</button>`;
    }else if(sc && b.phase==='lost'){
      // Lost in story mode: run failed
      const banked=storyRunState?storyRunState.coinsBanked:0;
      rewardHTML+=`<div class="reward-breakdown loss">
        <div class="reward-line">💀 Run Failed!</div>
        ${banked>0?`<div class="reward-line">You keep ${banked} banked coins from cleared chapters</div>`:''}
        <div class="reward-line" style="font-size:0.75rem;opacity:0.7">You must clear the entire arc in one run</div>
      </div>`;
      resultBtns=`<button onclick="abandonStoryRun()">Back to Story</button>
        <button onclick="storyContext=null;storyRunState=null;closeBattle()">Main Menu</button>`;
    }else if(endlessBattle.active && b.phase==='won'){
      // Won in endless mode: continue or quit
      endlessBattle.wins++;
      const expMult={'easy':1,'medium':2,'hard':5,'extreme':10}[endlessBattle.diff]||1;
      const wgr=endlessBattle.expWager||1;
      const expGain=Math.floor(30*expMult*wgr);
      // Award EXP to all team members
      (endlessBattle.teamIds||[]).forEach(cid=>addCharExp(cid,expGain));
      endlessBattle.totalExp+=expGain;
      const reward=DIFF_REWARDS[endlessBattle.diff]||100;
      addCoins(reward);
      rewardHTML=`<div class="reward-breakdown">
        <div class="reward-line">⭐ +${expGain} EXP (each)</div>
        <div class="reward-line">💰 +${reward} coins</div>
        <div class="reward-line">🏆 Streak: ${endlessBattle.wins}</div>
      </div>`;
      resultBtns=`<button onclick="endlessNextRound()">Next Opponent</button>
        <button onclick="endlessDefeat()">End Run</button>`;
    }else if(endlessBattle.active && b.phase==='lost'){
      // Lost in endless mode: apply EXP wager penalty then show stats
      endlessBattle.active=false;
      const wgr=endlessBattle.expWager||1;
      if(wgr > 1){
        const expMult={'easy':1,'medium':2,'hard':5,'extreme':10}[endlessBattle.diff]||1;
        const penalty = Math.floor(30 * expMult * wgr);
        (endlessBattle.teamIds||[]).forEach(cid=>addCharExp(cid, -penalty));
        endlessBattle.totalExp -= penalty;
      }
      const coinsDiff=saveData.coins-endlessBattle.startingCoins;
      const wagerNote = wgr > 1 ? '<div class="reward-line" style="color:#f44">💢 EXP Wager Lost! -' + Math.floor(30 * ({'easy':1,'medium':2,'hard':5,'extreme':10}[endlessBattle.diff]||1) * wgr) + ' EXP</div>' : '';
      rewardHTML=`<div class="reward-breakdown loss">
        <div class="reward-line">💀 Endless Run Failed!</div>
        <div class="reward-line">🏆 Final Streak: ${endlessBattle.wins} wins</div>
        <div class="reward-line">⭐ Net EXP: ${endlessBattle.totalExp}</div>
        ${wagerNote}
        <div class="reward-line">💰 Coins Earned: ${coinsDiff}</div>
      </div>`;
      const savedTeamIds = [...(endlessBattle.teamIds || [])];
      resultBtns=`<button onclick="playAgainEndless(${JSON.stringify(savedTeamIds).replace(/"/g, '&quot;')})">Play Again</button>
        <button onclick="showBattleSetup()">Try Another</button>
        <button onclick="closeBattle()">Main Menu</button>`;
    }else{
      // Normal battle
      resultBtns=`<button onclick="playAgainNormalBattle()">Play Again</button>
        <button onclick="closeBattle()">Main Menu</button>`;
    }

    actDiv.innerHTML=`<div class="battle-result ${b.phase}">
      <h2>${b.phase==='won'?'VICTORY!':'DEFEAT'}</h2>
      ${rewardHTML}
      ${dailyNote}
      <div class="result-btns">
        ${resultBtns}
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
  let logs;
  try{ logs=currentBattle.doTurn(idx); }catch(err){ console.error('doTurn error:',err); currentBattle.phase='action'; renderBattle(); return; }
  if(!logs||!logs.length){ renderBattle(); return; }
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


// ---- BATTLE ANIMATION SYSTEM ----
function flashElement(selector, color, duration){
  const el = document.querySelector(selector);
  if(!el) return;
  el.style.transition = 'none';
  el.style.boxShadow = '0 0 30px '+color+', inset 0 0 20px '+color;
  el.style.filter = 'brightness(1.5)';
  requestAnimationFrame(()=>{
    el.style.transition = 'all '+(duration||400)+'ms ease-out';
    el.style.boxShadow = 'none';
    el.style.filter = 'brightness(1)';
  });
}

function showDamageNumber(selector, dmg, isCrit, typeMult){
  const el = document.querySelector(selector);
  if(!el) return;
  const numEl = document.createElement('div');
  numEl.className = 'dmg-number' + (isCrit?' dmg-crit':'') + (typeMult>1.1?' dmg-super':'') + (typeMult<0.9?' dmg-weak':'');
  numEl.textContent = (isCrit?'CRIT! ':'') + dmg;
  numEl.style.position = 'absolute';
  numEl.style.left = '50%';
  numEl.style.top = '20%';
  el.style.position = 'relative';
  el.appendChild(numEl);
  requestAnimationFrame(()=>{
    numEl.style.transform = 'translate(-50%, -60px) scale(1.5)';
    numEl.style.opacity = '0';
  });
  setTimeout(()=>numEl.remove(), 800);
}

function playHitAnimation(isPlayer, isCrit, typeMult){
  const target = isPlayer ? '#pCharCard' : '#eCharCard';
  const img = isPlayer ? '#pImg' : '#eImg';
  // Shake
  const shakeAmt = isCrit ? 12 : 6;
  const imgEl = document.querySelector(img);
  if(imgEl){
    imgEl.style.transition = 'none';
    imgEl.style.transform = 'translateX('+shakeAmt+'px)';
    setTimeout(()=>{imgEl.style.transition='transform 80ms';imgEl.style.transform='translateX(-'+shakeAmt+'px)';},50);
    setTimeout(()=>{imgEl.style.transform='translateX('+(shakeAmt/2)+'px)';},130);
    setTimeout(()=>{imgEl.style.transform='translateX(0)';},200);
  }
  // Color flash
  const color = typeMult > 1.1 ? '#ffaa00' : (typeMult < 0.9 ? '#6666ff' : (isCrit ? '#ff0000' : '#ffffff'));
  flashElement(target, color, 400);
}

function playMissAnimation(isPlayer){
  const img = isPlayer ? '#pImg' : '#eImg';
  const el = document.querySelector(img);
  if(!el) return;
  el.style.transition = 'opacity 150ms';
  el.style.opacity = '0.3';
  setTimeout(()=>{el.style.opacity='1';}, 300);
}

function playStatusAnimation(isPlayer, statusType){
  const target = isPlayer ? '#pCharCard' : '#eCharCard';
  const colors = {burn:'#ff4400',poison:'#88ff00',stun:'#ffff00'};
  flashElement(target, colors[statusType]||'#ffffff', 600);
}

function playHealAnimation(isPlayer){
  const target = isPlayer ? '#pCharCard' : '#eCharCard';
  flashElement(target, '#00ff88', 600);
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

  // Sort with favorites and multiple options
  const tierOrder={'S+':0,'S':1,'A':2,'B':3,'C':4};
  chars.sort((a,b)=>{
    const ua=isUnlocked(a.id)?0:1, ub=isUnlocked(b.id)?0:1;
    if(ua!==ub) return ua-ub;
    // Favorites always first among unlocked
    const fa=isFavorite(a.id)?0:1, fb=isFavorite(b.id)?0:1;
    if(fa!==fb) return fa-fb;
    // Then sort by selected criteria
    if(collectionSort==='evo') return getEvoStage(b.id)-getEvoStage(a.id);
    if(collectionSort==='level') return getCharLevelNum(b.id)-getCharLevelNum(a.id);
    if(collectionSort==='atk') return (b.atk||0)-(a.atk||0);
    if(collectionSort==='def') return (b.def||0)-(a.def||0);
    if(collectionSort==='spd') return (b.spd||0)-(a.spd||0);
    if(collectionSort==='name') return a.name.localeCompare(b.name);
    return (tierOrder[a.tier]||9)-(tierOrder[b.tier]||9);
  });

  const grid=document.getElementById('collGrid');
  grid.innerHTML=chars.map(c=>{
    const unlocked=isUnlocked(c.id);
    const cost=TIER_COSTS[c.tier]||800;
    const canAfford=saveData.coins>=cost;
    const fav=isFavorite(c.id);
    const evo=isEvolved(c.id);
    const clvl = getCharLevel(c.id);
    const clvlNum = clvl.level;
    const nxtExp = clvlNum >= MAX_CHAR_LEVEL ? 1 : expForLevel(clvlNum+1);
    const expPct = clvlNum >= MAX_CHAR_LEVEL ? 100 : Math.floor(clvl.exp/nxtExp*100);
    return `<div class="coll-card ${unlocked?'coll-unlocked':'coll-locked'} ${fav?'coll-fav':''}" onclick="${unlocked?`showCharDetail('${c.id}')`:(canAfford?`tryUnlock('${c.id}')`:'')}">
      ${unlocked&&fav?'<div class="coll-fav-star">⭐</div>':''}
      ${unlocked&&evo?'<div class="coll-evo-badge">★'+getEvoStage(c.id)+'</div>':''}
      <div class="coll-img-wrap">
        <img src="${CHAR_IMGS[c.id]||'images/'+c.id+'.jpg'}" class="${unlocked?''+(getEvoStage(c.id)>=3?' evo-aura-3':getEvoStage(c.id)>=2?' evo-aura-2':''):'coll-silhouette'}">
        ${!unlocked?`<div class="coll-cost ${canAfford?'can-afford':''}">${cost} coins</div>`:''}
      </div>
      <div class="coll-name">${unlocked?(getEvoFormName(c.id)||c.name):'???'}</div>
      <div class="coll-tier tier-${c.tier.replace('+','p')}">${c.tier}</div>
      ${unlocked?`<div class="coll-level-row"><span class="coll-lvl-num">Lv.${clvlNum}</span><div class="coll-exp-bar"><div class="coll-exp-fill" style="width:${expPct}%"></div></div></div>`:''}
    </div>`;
  }).join('');

  // Update filter buttons
  document.querySelectorAll('.coll-filter-btn').forEach(b=>{
    b.classList.toggle('filter-active',b.dataset.filter===collectionFilter);
  });
}

function tryUnlock(id){
  const ch=ALL_CHARS.find(c=>c.id===id);
  if(!ch||isUnlocked(id)) return;
  closeCharDetail();
  showGachaShop();
}

function closeCollection(){
  document.getElementById('collectionScreen').style.display='none';
  document.getElementById('title-screen').style.display='flex';
  if(typeof updateMenuStats === 'function') updateMenuStats();
}


// ===== CHARACTER DETAIL PAGE =====
function showCharDetail(id) {
 console.log('showCharDetail called for', id);
 try{
  const ch = ALL_CHARS.find(c => c.id === id);
  if(!ch) return;
  const moves = BATTLE_MOVES[id] || [];
  const unlocked = isUnlocked(id);
  const upgrades = getCharUpgrades(id);
  const currentLevel = getUpgradeLevel(id);
  const upgBoosts = getUpgradeBoosts(id);
  const evoBoosts = typeof getEvoBoosts==='function' ? getEvoBoosts(id) : {atk:0,def:0,spd:0,haki:0,df:0};
  // Effective stats = growth-scaled base (what character currently has from leveling)
  const eff = typeof getEffectiveStats==='function' ? getEffectiveStats(id, ch) : {atk:ch.atk,def:ch.def,spd:ch.spd,haki:ch.haki||0,df:ch.df||0};
  // Boosts from upgrades + evolution (shown as bonus on top)
  const boosts = {atk:upgBoosts.atk+evoBoosts.atk, def:upgBoosts.def+evoBoosts.def, spd:upgBoosts.spd+evoBoosts.spd, haki:upgBoosts.haki+evoBoosts.haki, df:upgBoosts.df+evoBoosts.df};
  const maxHP = calcMaxHP({def:eff.def+boosts.def, haki:eff.haki+boosts.haki, df:eff.df+boosts.df, tier:ch.tier});
  const clampedLevel = Math.min(currentLevel, upgrades.length);
  const upgLabel = clampedLevel > 0 ? upgrades[clampedLevel-1].label : 'Base Form';
  const growthPct = Math.round((typeof getLevelMultiplier==='function' ? getLevelMultiplier(id) : 1) * 100);

  // Stat bar: current effective + boost, with potential shown as faint background
  function statBar(val, boost, potential, color) {
    const cap = Math.max(potential * 1.3, val + boost + 10);
    const basePct = Math.min(100, val/cap*100);
    const boostPct = Math.min(100, (val+boost)/cap*100);
    const potPct = Math.min(100, potential/cap*100);
    return `<div class="stat-bar-bg">
      <div class="stat-bar-fill" style="width:${potPct}%;background:#555;opacity:0.15"></div>
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
            <div class="detail-name">${getEvoFormName(id)||ch.name}</div>
            <div class="detail-title">${ch.title||''}</div>
            <div class="detail-anime-tag">${ch.anime==='onepiece'?'☠️ One Piece':'🍥 Naruto'}</div>
          </div>
        </div>
      </div>
      ${unlocked && currentLevel > 0 ? `<div class="detail-form-tag">${upgLabel}</div>` : ''}
      ${unlocked ? (()=>{
        const _cl = getCharLevel(id);
        const _nxt = _cl.level >= MAX_CHAR_LEVEL ? 1 : expForLevel(_cl.level+1);
        const _pct = _cl.level >= MAX_CHAR_LEVEL ? 100 : Math.floor(_cl.exp/_nxt*100);
        return '<div class="detail-level-section">'
          + '<div class="detail-level-info">'
          + '<span class="detail-level-num">Level ' + _cl.level + '</span>'
          + (_cl.level >= MAX_CHAR_LEVEL ? '<span class="detail-level-max">MAX</span>' : '<span class="detail-level-exp">' + _cl.exp + ' / ' + _nxt + ' EXP</span>')
          + '</div>'
          + '<div class="detail-exp-bar"><div class="detail-exp-fill" style="width:' + _pct + '%"></div></div>'
          + '<div class="detail-growth-tag">Power: ' + growthPct + '% of potential</div>'
          + '</div>';
      })() : ''}
      <div class="detail-quick-stats">
        <div class="dqs"><span class="dqs-val">${maxHP}</span><span class="dqs-lbl">HP</span></div>
        <div class="dqs"><span class="dqs-val">${eff.atk}${boosts.atk?`<small>+${boosts.atk}</small>`:''}</span><span class="dqs-lbl">ATK</span></div>
        <div class="dqs"><span class="dqs-val">${eff.def}${boosts.def?`<small>+${boosts.def}</small>`:''}</span><span class="dqs-lbl">DEF</span></div>
        <div class="dqs"><span class="dqs-val">${eff.spd}${boosts.spd?`<small>+${boosts.spd}</small>`:''}</span><span class="dqs-lbl">SPD</span></div>
        <div class="dqs"><span class="dqs-val">${eff.haki}${boosts.haki?`<small>+${boosts.haki}</small>`:''}</span><span class="dqs-lbl">HAKI</span></div>
      </div>
      <div class="detail-stats">
        <div class="stat-row"><span class="stat-label">ATK</span><span class="stat-val">${eff.atk}${boosts.atk?`<span class="stat-boost">+${boosts.atk}</span>`:''}</span>${statBar(eff.atk,boosts.atk,ch.atk,'#f44336')}</div>
        <div class="stat-row"><span class="stat-label">DEF</span><span class="stat-val">${eff.def}${boosts.def?`<span class="stat-boost">+${boosts.def}</span>`:''}</span>${statBar(eff.def,boosts.def,ch.def,'#2196F3')}</div>
        <div class="stat-row"><span class="stat-label">SPD</span><span class="stat-val">${eff.spd}${boosts.spd?`<span class="stat-boost">+${boosts.spd}</span>`:''}</span>${statBar(eff.spd,boosts.spd,ch.spd,'#4CAF50')}</div>
        <div class="stat-row"><span class="stat-label">HAKI</span><span class="stat-val">${eff.haki}${boosts.haki?`<span class="stat-boost">+${boosts.haki}</span>`:''}</span>${statBar(eff.haki,boosts.haki,ch.haki||0,'#9C27B0')}</div>
        <div class="stat-row"><span class="stat-label">${ch.anime==='onepiece'?'DF':'JUTSU'}</span><span class="stat-val">${eff.df}${boosts.df?`<span class="stat-boost">+${boosts.df}</span>`:''}</span>${statBar(eff.df,boosts.df,ch.df||0,'#FF9800')}</div>
      </div>
      <div class="detail-section-title">MOVES</div>
      <div class="detail-moves">${moves.map((m, moveIdx) => {
        const safeName = (m && m.name) || 'Unknown Move';
        const safeType = (m && m.type) || 'normal';
        const safePower = (m && m.power !== undefined) ? m.power : 0;
        const safeAcc = (m && m.acc !== undefined) ? m.acc : 100;
        const safePP = (m && m.pp !== undefined) ? m.pp : 15;
        const safeEffect = (m && m.effect) || null;
        // Determine if this move is locked based on character level
        const charLvl = getCharLevelNum(id);
        let isLocked = false;
        let unlocksAt = 0;
        if(moveIdx === 1 && charLvl < 10) { isLocked = true; unlocksAt = 10; }
        else if(moveIdx === 2 && charLvl < 20) { isLocked = true; unlocksAt = 20; }
        else if(moveIdx === 3 && charLvl < 35) { isLocked = true; unlocksAt = 35; }
        const moveClass = isLocked ? 'detail-move-locked' : '';
        return `
        <div class="detail-move move-${safeType} ${moveClass}">
          <div class="dm-top">
            <span class="dm-name">${isLocked ? '🔒 ' : ''}${safeName}</span>
            <span class="dm-pwr">${isLocked ? 'LOCKED' : 'PWR '+safePower}</span>
          </div>
          <div class="dm-stats">
            ${isLocked ? `<span class="dm-locked-text">Unlocks at Lv.${unlocksAt}</span>` : `
              <span class="dm-type">${safeType}</span>
              <span>Acc ${safeAcc}%</span>
              <span>PP ${safePP}</span>
              ${safeEffect?`<span class="dm-effect">${safeEffect}</span>`:''}
            `}
          </div>
        </div>
      `;}).join('')}</div>
      ${unlocked ? renderUpgradeSection(id, ch, currentLevel, upgrades) : `
      `}
      ${unlocked ? renderEvoSection(id, ch) : ''}
      ${unlocked ? renderPassiveSection(id) : ''}
      ${unlocked ? renderRelicSection(id) : ''}
      ${unlocked ? '<div class="detail-fav-row"><button class="detail-fav-btn '+(isFavorite(id)?'fav-active':'')+'" onclick="toggleFavorite(\''+id+'\');showCharDetail(\''+id+'\')">'+
        (isFavorite(id)?'⭐ Favorited':'☆ Add to Favorites')+'</button></div>' : ''}
      ${!unlocked ? `
        <div class="detail-locked-msg">
          <div>🔒 Available in Gacha packs</div>
        </div>
      ` : ''}
    </div>
  `;
  modal.style.display = 'flex';
  // Click outside to close
  modal.onclick = function(e) {
    if(e.target === modal) closeCharDetail();
  };
 }catch(err){console.error('showCharDetail error:',err);alert('Error opening character: '+err.message);}
}


// Render multi-stage evolution section in char detail
function renderEvoSection(id, ch){
  const evo = CHAR_EVOLUTIONS[id];
  if(!evo) return '<div class="detail-section-title">EVOLUTION</div><div class="evo-section"><div class="evo-locked">No evolution data</div></div>';
  const curStage = getEvoStage(id);
  const maxStage = evo.stages.length;
  const charLvl = getCharLevelNum(id);

  // Build evolution tree display
  let stagesHtml = '<div class="evo-tree">';
  for(let i=0; i<maxStage; i++){
    const s = evo.stages[i];
    const stageNum = i+1;
    const isActive = stageNum === curStage;
    const isDone = stageNum < curStage;
    const isNext = stageNum === curStage + 1;
    const cls = isDone ? 'evo-stage-done' : isActive ? 'evo-stage-active' : isNext ? 'evo-stage-next' : 'evo-stage-locked';
    const icon = isDone ? '✅' : isActive ? '⭐' : '🔒';
    const b = s.boosts;
    const boostStr = stageNum===1 ? 'Base Form' : 'ATK+'+b.atk+' DEF+'+b.def+' SPD+'+b.spd;
    stagesHtml += '<div class="evo-stage '+cls+'"><div class="evo-stage-icon">'+icon+'</div><div class="evo-stage-info"><div class="evo-stage-name">'+s.name+'</div><div class="evo-stage-level">Lv.'+s.level+'</div><div class="evo-stage-boost">'+boostStr+'</div></div></div>';
    if(i < maxStage-1) stagesHtml += '<div class="evo-arrow">▼</div>';
  }
  stagesHtml += '</div>';

  // Evolve button if applicable
  let actionHtml = '';
  if(curStage < maxStage){
    const next = evo.stages[curStage];
    const canDo = canEvolve(id);
    if(canDo){
      const moveInfo = evo.learnMoves && evo.learnMoves[curStage+1] ? ' + New Move: '+evo.learnMoves[curStage+1].name : '';
      actionHtml = '<button class="evo-btn" onclick="evolveCharacter(\''+id+'\')">EVOLVE to '+next.name+moveInfo+'</button>';
    } else {
      actionHtml = '<div class="evo-locked">Requires Level '+next.level+' (currently Lv.'+charLvl+')</div>';
    }
  } else {
    actionHtml = '<div class="evo-maxed">MAX EVOLUTION</div>';
  }

  return '<div class="detail-section-title">EVOLUTION (Stage '+curStage+'/'+maxStage+')</div>'+stagesHtml+actionHtml;
}

// Render passive section
function renderPassiveSection(id){
  const p = getCharPassive(id);
  if(!p) return '<div class="detail-section-title">PASSIVE</div><div class="passive-section passive-none">No passive ability</div>';
  return '<div class="detail-section-title">PASSIVE ABILITY</div><div class="passive-section"><span class="passive-emoji">'+p.emoji+'</span><span class="passive-name">'+p.name+'</span><div class="passive-desc">'+p.desc+'</div></div>';
}

// Render relic/equipment section
function renderRelicSection(id){
  const relic = getCharRelic(id);
  const owned = equipmentData.inventory;
  let html = '<div class="detail-section-title">EQUIPPED RELIC</div>';
  if(relic){
    html += '<div class="relic-section relic-equipped"><span class="relic-emoji">'+relic.emoji+'</span><span class="relic-name">'+relic.name+'</span><div class="relic-desc">'+relic.desc+'</div><button class="relic-unequip" onclick="unequipRelic(\''+id+'\');showCharDetail(\''+id+'\')">Unequip</button></div>';
  } else {
    html += '<div class="relic-section">';
    const available = owned.filter(rid => {
      // Not equipped by anyone else
      const eq = equipmentData.equipped;
      for(const cid in eq){ if(eq[cid]===rid) return false; }
      return true;
    });
    if(available.length > 0){
      html += '<div class="relic-options">';
      available.forEach(rid => {
        const r = RELICS[rid];
        html += '<button class="relic-option" onclick="equipRelic(\''+id+'\',\''+rid+'\');showCharDetail(\''+id+'\')">'+r.emoji+' '+r.name+'</button>';
      });
      html += '</div>';
    } else {
      html += '<div class="relic-none">No relics available. Visit the Relic Shop!</div>';
    }
    html += '</div>';
  }
  return html;
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

const UPGRADE_BOOST_MULT = 4; // multiplier so powerups feel impactful

function getUpgradeBoosts(id) {
  const level = getUpgradeLevel(id);
  if(level === 0) return {atk:0,def:0,spd:0,haki:0,df:0};
  const upgrades = getCharUpgrades(id);
  const clamped = Math.min(level, upgrades.length);
  const u = upgrades[clamped-1];
  if(!u) return {atk:0,def:0,spd:0,haki:0,df:0};
  const b = u.boosts || {atk:0,def:0,spd:0,haki:0,df:0};
  const m = UPGRADE_BOOST_MULT;
  return {atk:b.atk*m, def:b.def*m, spd:b.spd*m, haki:b.haki*m, df:b.df*m};
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

// Patch: apply upgrade boosts in battle mode (PLAYER ONLY - AI never gets powerups)
(function() {
  const origCalcMaxHP = calcMaxHP;
  window.calcMaxHP = function(ch) {
    if(!ch._isPlayer) return origCalcMaxHP(ch);
    const boosts = getUpgradeBoosts(ch.id);
    const boosted = {...ch, def: ch.def + boosts.def, haki: (ch.haki||0) + boosts.haki, df: (ch.df||0) + boosts.df};
    return origCalcMaxHP(boosted);
  };

  const origCalcDamage = calcDamage;
  window.calcDamage = function(atk, def, move) {
    // Only apply upgrade boosts to player characters
    const atkBoosts = atk._isPlayer ? getUpgradeBoosts(atk.id) : {atk:0,def:0,spd:0,haki:0,df:0};
    const defBoosts = def._isPlayer ? getUpgradeBoosts(def.id) : {atk:0,def:0,spd:0,haki:0,df:0};
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

// ===== ENDLESS BATTLE MODE =====

let endlessTeamSize = 1; // 1 or 3

function showEndlessSetup(){
  document.getElementById('title-screen').style.display='none';
  document.getElementById('battleArena').style.display='none';
  document.getElementById('battleSetup').style.display='block';
  currentBattle=null;
  // Only clear team if switching modes, otherwise keep pre-filled team
  if(!endlessBattle || !endlessBattle.teamIds){
    selectedBattleTeam=[];
  }
  selectedDifficulty='medium';
  currentBet=0;
  expWagerMult=1;
  equippedItems=[];

  // Ensure toggle container exists (use innerHTML to keep it clean)
  let toggleEl = document.getElementById('endlessToggleContainer');
  if(!toggleEl){
    toggleEl = document.createElement('div');
    toggleEl.id='endlessToggleContainer';
    toggleEl.className='endless-toggle';
    const setupHead = document.getElementById('battleSetup').querySelector('h2');
    if(setupHead) setupHead.parentNode.insertBefore(toggleEl, setupHead.nextSibling);
  }
  toggleEl.innerHTML=`
    <button class="endless-toggle-btn ${endlessTeamSize===1?'active':''}" onclick="setEndlessMode(1)">1v1</button>
    <button class="endless-toggle-btn ${endlessTeamSize===3?'active':''}" onclick="setEndlessMode(3)">3v3</button>
  `;

  // Character selection grid
  const grid=document.getElementById('battleTeamGrid');
  let unlocked=ALL_CHARS.filter(c=>isUnlocked(c.id));

  grid.innerHTML=unlocked.map(c=>{
    const sel=selectedBattleTeam.includes(c.id);
    const lvl = getUpgradeLevel(c.id);
    const lvlTag = lvl > 0 ? `<div class="bt-char-lvl">Lv.${lvl}</div>` : '';
    return `<div class="bt-char ${sel?'bt-selected':''}" onclick="toggleEndlessChar('${c.id}')">
      <img src="${CHAR_IMGS[c.id]||'images/'+c.id+'.jpg'}" alt="${c.name}">
      <div class="bt-char-name">${c.name}</div>
      <div class="bt-char-tier tier-${c.tier.replace('+','p')}">${c.tier}</div>
      ${lvlTag}
    </div>`;
  }).join('');

  const teamCountText = endlessTeamSize === 1 ? '1' : '3';
  document.getElementById('battleTeamCount').textContent=`${selectedBattleTeam.length}/${teamCountText}`;
  const startBtn = document.getElementById('btnBattleStart');
  startBtn.disabled=selectedBattleTeam.length!==endlessTeamSize;
  startBtn.textContent='START ENDLESS';
  startBtn.onclick=()=>startEndlessBattle();

  // Hide coin bet row, show EXP wager row
  const betRow = document.getElementById('betRow');
  if(betRow) betRow.style.display='none';
  const betSection = betRow ? betRow.parentElement : null;
  if(betSection && betSection.classList.contains('bet-section')) betSection.style.display='none';
  const itemRow = document.getElementById('itemEquipRow');
  if(itemRow) itemRow.style.display='none';
  // Show EXP wager
  const wagerSection = document.getElementById('expWagerSection');
  if(wagerSection) wagerSection.style.display='block';
  const wagerRow = document.getElementById('expWagerRow');
  if(wagerRow){
    const wagerOpts = [1, 2, 5, 10, 25, 50, 100];
    wagerRow.innerHTML = wagerOpts.map(mult => {
      const active = expWagerMult === mult;
      const label = mult === 1 ? 'SAFE' : mult + 'x';
      const cls = mult >= 100 ? 'wager-suicidal' : mult >= 25 ? 'wager-insane' : mult >= 10 ? 'wager-extreme' : mult >= 5 ? 'wager-high' : '';
      return '<button class="wager-btn ' + (active ? 'wager-active ' : '') + cls + '" onclick="setExpWager(' + mult + ');showEndlessSetup()">' + label + '</button>';
    }).join('');
  }
  const wagerInfo = document.getElementById('expWagerInfo');
  if(wagerInfo){
    if(expWagerMult >= 100){
      wagerInfo.textContent = 'SUICIDAL! Win: ' + expWagerMult + 'x EXP | Lose: -' + expWagerMult + 'x EXP (TOTAL DESTRUCTION!)';
    } else if(expWagerMult >= 25){
      wagerInfo.textContent = 'INSANE! Win: ' + expWagerMult + 'x EXP | Lose: -' + expWagerMult + 'x EXP (WILL level down!)';
      wagerInfo.style.color = expWagerMult >= 100 ? '#ff0000' : '#ff00ff';
    } else if(expWagerMult > 1){
      wagerInfo.textContent = 'Win: ' + expWagerMult + 'x EXP | Lose: -' + expWagerMult + 'x EXP (can level DOWN!)';
      wagerInfo.style.color = expWagerMult >= 10 ? '#f44' : expWagerMult >= 5 ? '#ff8c00' : '#ffd700';
    } else {
      wagerInfo.textContent = 'No risk. Normal EXP gain on win.';
      wagerInfo.style.color = '#4CAF50';
    }
  }

  // Update difficulty buttons
  document.querySelectorAll('.diff-btn').forEach(b=>{
    b.classList.toggle('diff-active',b.dataset.diff===selectedDifficulty);
  });
}

function setEndlessMode(size){
  endlessTeamSize = size;
  selectedBattleTeam = []; // Reset team selection when mode changes
  showEndlessSetup();
}

function toggleEndlessChar(id){
  if(selectedBattleTeam.includes(id)){
    selectedBattleTeam = selectedBattleTeam.filter(c => c !== id);
  }else{
    if(selectedBattleTeam.length < endlessTeamSize){
      selectedBattleTeam.push(id);
    }
  }
  showEndlessSetup();
}

function startEndlessBattle(){
  if(selectedBattleTeam.length !== endlessTeamSize) return;
  const charIds = [...selectedBattleTeam];
  const chars = charIds.map(id => ALL_CHARS.find(c => c.id === id)).filter(c => c);
  if(chars.length === 0) return;

  endlessBattle={
    active:true,
    teamIds:charIds,
    wins:0,
    diff:selectedDifficulty,
    totalExp:0,
    startingCoins:saveData.coins,
    teamSize:endlessTeamSize,
    expWager:expWagerMult
  };

  // Start the first fight
  endlessNextRound();
}

function getEndlessOpponent(wins){
  // Get progressively harder opponents based on win count
  let tiers=['C'];
  if(wins>=2) tiers=['C','B'];
  if(wins>=5) tiers=['B'];
  if(wins>=10) tiers=['A','B'];
  if(wins>=15) tiers=['A'];
  if(wins>=20) tiers=['A','S'];
  if(wins>=25) tiers=['S'];
  if(wins>=30) tiers=['S','S+'];
  if(wins>=35) tiers=['S+'];

  let candidates=ALL_CHARS.filter(c=>tiers.includes(c.tier));
  if(candidates.length===0) candidates=ALL_CHARS.filter(c=>c.tier==='S+');

  const opponent=candidates[Math.floor(Math.random()*candidates.length)];
  return opponent;
}

function endlessNextRound(){
  if(!endlessBattle.active) return;

  // Get player team
  const pTeam = endlessBattle.teamIds.map(id => ALL_CHARS.find(c => c.id === id)).filter(c => c);
  if(pTeam.length === 0) return;

  // Get opponents
  const eTeam = [];
  const teamSize = endlessBattle.teamSize || 1;
  for(let i = 0; i < teamSize; i++){
    const opponent = getEndlessOpponent(endlessBattle.wins);
    const baseLvl = {'easy':1,'medium':15,'hard':35,'extreme':50}[endlessBattle.diff]||15;
    const eLvl = Math.min(50, baseLvl + endlessBattle.wins);
    opponent._forcedLevel = eLvl;
    eTeam.push(opponent);
  }

  // Create the battle
  currentBattle = new Battle(pTeam, eTeam, endlessBattle.diff);
  currentBattle._endless = true;

  document.getElementById('title-screen').style.display='none';
  document.getElementById('battleSetup').style.display='none';
  document.getElementById('battleArena').style.display='block';
  renderBattle();
}

function endlessDefeat(){
  // Called when user wants to end their run early from the "Next Opponent" menu
  if(!endlessBattle.active) return;

  endlessBattle.active=false;

  const coinsDiff=saveData.coins-endlessBattle.startingCoins;
  const savedTeamIds = [...(endlessBattle.teamIds || [])];

  // Show end-of-run screen
  const actDiv=document.getElementById('battleActions');
  actDiv.innerHTML=`<div class="battle-result lost">
    <h2>RUN ENDED</h2>
    <div class="reward-breakdown">
      <div class="reward-line">🏆 Final Streak: ${endlessBattle.wins} wins</div>
      <div class="reward-line">⭐ Total EXP: ${endlessBattle.totalExp}</div>
      <div class="reward-line">💰 Coins: +${coinsDiff}</div>
    </div>
    <div class="result-btns">
      <button onclick="playAgainEndless(${JSON.stringify(savedTeamIds).replace(/"/g, '&quot;')})">Play Again</button>
      <button onclick="showBattleSetup()">Try Another</button>
      <button onclick="closeBattle()">Main Menu</button>
    </div>
  </div>`;
}

function playAgainEndless(teamIds){
  const savedDiff = selectedDifficulty;
  const savedWager = expWagerMult;
  const savedSize = teamIds.length;
  endlessTeamSize = savedSize;
  showEndlessSetup();
  // Restore settings that showEndlessSetup reset
  selectedDifficulty = savedDiff;
  expWagerMult = savedWager;
  selectedBattleTeam = [...teamIds];
  renderBattleSetup();
}

function playAgainNormalBattle(){
  const savedDiff = selectedDifficulty;
  const savedBet = currentBet;
  const savedTeam = lastBattleTeam.length > 0 ? [...lastBattleTeam] : [];
  showBattleSetup();
  // Restore settings that showBattleSetup reset
  selectedDifficulty = savedDiff;
  currentBet = savedBet;
  selectedBattleTeam = savedTeam;
  renderBattleSetup();
}

