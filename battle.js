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
      html+=`<div class="arc-progress">🏆 Arc Cleared!</div>`;
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
    if(bossCleared){
      html+=`<button class="story-start-btn story-replay-btn" onclick="startStoryArc('${arc.id}')">
        🔄 Replay Arc <span class="ch-reward">+${totalCoins-arc.arcReward} coins</span>
      </button>`;
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
    bossChar.atk=Math.floor(bossChar.atk*boss.bossStatMult);
    bossChar.def=Math.floor(bossChar.def*boss.bossStatMult);
    bossChar.spd=Math.floor(bossChar.spd*boss.bossStatMult);
    if(bossChar.haki) bossChar.haki=Math.floor(bossChar.haki*boss.bossStatMult);
    if(bossChar.df) bossChar.df=Math.floor(bossChar.df*boss.bossStatMult);
    bossChar._bossHpMult=boss.bossHpMult;
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
    // Apply synergy bonuses to base stats BEFORE HP calculation
    this.atk = Math.floor(this.atk * synergyBonuses.atk);
    this.def = Math.floor(this.def * synergyBonuses.def);
    this.spd = Math.floor(this.spd * synergyBonuses.spd);
    if (synergyBonuses.haki > 1.0) this.haki = Math.floor((this.haki || 0) * synergyBonuses.haki);
    if (synergyBonuses.df > 1.0) this.df = Math.floor((this.df || 0) * synergyBonuses.df);
    this._synergyHealing = synergyBonuses.healing;
    this.maxHP=calcMaxHP(ch);
    if(ch._bossHpMult) this.maxHP=Math.floor(this.maxHP*ch._bossHpMult);
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
  equippedItems=[];
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
  document.getElementById('btnBattleStart').disabled=selectedBattleTeam.length!==3;

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

  // Bet buttons
  const betRow = document.getElementById('betRow');
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
    const betWin = currentBet > 0 ? Math.floor(currentBet * (selectedDifficulty==='easy'?1.5:selectedDifficulty==='medium'?2:3)) : 0;
    potentialEl.textContent = currentBet > 0
      ? `Win: +${baseReward} base + ${betWin} bet payout = ${baseReward+betWin} total`
      : `Win: +${baseReward} coins`;
  }

  // Item equip row
  const itemRow = document.getElementById('itemEquipRow');
  if(itemRow) {
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
function getBetOptions() {
  const coins = saveData.coins || 0;
  const opts = [0];
  for(const amt of [100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000]) {
    if(amt <= coins) opts.push(amt);
  }
  if(coins > 0 && opts[opts.length-1] !== coins) opts.push(coins);
  return opts;
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

  if(storyContext){
    if(storyContext.type==='boss'){
      // Boss fight: boss has boosted stats
      const bossChar={...ALL_CHARS.find(c=>c.id===storyContext.bossId)};
      bossChar.atk=Math.floor(bossChar.atk*storyContext.bossStatMult);
      bossChar.def=Math.floor(bossChar.def*storyContext.bossStatMult);
      bossChar.spd=Math.floor(bossChar.spd*storyContext.bossStatMult);
      if(bossChar.haki) bossChar.haki=Math.floor(bossChar.haki*storyContext.bossStatMult);
      if(bossChar.df) bossChar.df=Math.floor(bossChar.df*storyContext.bossStatMult);
      bossChar._bossHpMult=storyContext.bossHpMult;
      const allies=storyContext.allies.map(id=>ALL_CHARS.find(c=>c.id===id)).filter(Boolean);
      eTeam=[bossChar,...allies];
    }else{
      const arc=STORY_ARCS.find(a=>a.id===storyContext.arcId);
      const ch=arc.chapters[storyContext.chIdx];
      eTeam=ch.enemies.map(id=>ALL_CHARS.find(c=>c.id===id)).filter(Boolean);
    }
  }else{
    eTeam=aiSelectTeam(selectedDifficulty);
  }

  currentBattle=new Battle(pTeam,eTeam,selectedDifficulty);
  currentBattle.bet = currentBet;
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
    const betMult = b.diff==='easy'?1.5:b.diff==='medium'?2:3;
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
    }else{
      // Normal battle
      resultBtns=`<button onclick="showBattleSetup()">Play Again</button>
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
