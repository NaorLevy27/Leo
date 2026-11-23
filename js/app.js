/* Leonida Route – the app. Pages: home, list, item, map, guides, settings. */
(async function(){
"use strict";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const bdi=s=>`<bdi>${esc(s)}</bdi>`;
const S=Store.S;
const MQD=window.matchMedia?matchMedia("(prefers-color-scheme: dark)"):null;
function applyTheme(){const t=S.theme||"auto";const d=t==="dark"||(t==="auto"&&MQD&&MQD.matches);document.documentElement.dataset.theme=d?"dark":"light";const m=document.querySelector('meta[name="theme-color"]');if(m)m.content=d?"#1d1b4a":"#8f93d6"}
applyTheme();if(MQD&&MQD.addEventListener)MQD.addEventListener("change",applyTheme);

/* ---------- data ---------- */
const [D,LD,EX]=await Promise.all([fetch("data/items.json").then(r=>r.json()),fetch("data/locs.json").then(r=>r.json()),fetch("data/extra.json").then(r=>r.ok?r.json():{}).catch(()=>({}))]);
/* daily discoveries: extra.json items use the same shape; same id = update an existing item */
(EX.items||[]).forEach(e=>{const i=D.items.findIndex(x=>x.id===e.id);if(i>=0)D.items[i]=Object.assign(D.items[i],e);else{e.g=e.g||["egg"];e.c=e.c||1;e.pos=e.pos==null?9999:e.pos;e.s=e.s||e.id.toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,60);e.isNew=1;D.items.push(e)}});
const NEWS=(EX.news||[]).slice().sort((a,b)=>a.d<b.d?1:-1);
const TIPS2=(EX.tips||[]).slice().sort((a,b)=>a.d<b.d?1:-1);
D.items.forEach(x=>x.ord=x.c*100000+x.pos);const IT=D.items.sort((a,b)=>a.ord-b.ord);
if(window.LANG==="en"){IT.forEach(x=>{if(x.ne)x.n=x.ne;if(x.src==="guide"&&!x.sp_e)delete x.sp;[["sp","sp_e"],["why","why_e"],["d","d_e"],["lk","lk_e"],["k","k_e"],["nt","nt_e"],["st","st_e"],["wn","wn_e"]].forEach(([a,b])=>{if(x[b])x[a]=x[b]});
  if(x.steps_e)x.steps=x.steps_e;else if(x.src){delete x.steps;delete x.tips;delete x.ch;delete x.rw}});
  for(const k in D.KT)D.KT[k]=[D.KT[k][1]||D.KT[k][0],D.KT[k][1]];}
const BY={},BYS={};IT.forEach(x=>{BY[x.id]=x;BYS[x.s]=x});
const KINDS=LD.kinds;if(window.LANG==="en")for(const k in KINDS)KINDS[k].n=KINDS[k].en||KINDS[k].n;
const LOCS=LD.locs.map(a=>({id:a[0],k:a[1],x:a[2],y:a[3],n:a[4],t:a[5],d:a[6],a:a[7]}));
const LBY={};LOCS.forEach(l=>LBY[l.id]=l);
const STORY=IT.filter(x=>x.story);

const CAT=window.LANG==="en"?{story:["Story","📖"],side:["Side missions","🎭"],op:["Gang ops","💼"],collect:["Collectibles","🃏"],event:["Random events","🎲"],money:["Money","💵"],vehicle:["Vehicles","🚗"],weapon:["Weapons","🔫"],egg:["Easter eggs","🥚"],tip:["Tips","💡"]}:{story:["סיפור","📖"],side:["משימות צד","🎭"],op:["מבצעי כנופיות","💼"],collect:["אספנות","🃏"],event:["אירועים אקראיים","🎲"],money:["כסף","💵"],vehicle:["רכבים","🚗"],weapon:["נשקים","🔫"],egg:["ביצי פסחא","🥚"],tip:["טיפים","💡"]};
const KTE={card:"🃏",mag:"📚",book:"📖",med:"🧘",dive:"🤿",flam:"🦩",drone:"🛸",wink:"📷",other:"✨"};
const WHO={J:"Jason",L:"Lucia",B:window.LANG==="en"?"Both":"שניהם"};
const CATC={story:"#f29ac0",side:"#c7a3e6",op:"#f6b07e",collect:"#f8cf8a",event:"#a9b8f0",money:"#f2c49a",vehicle:"#9fa6ec",weapon:"#f2948c",egg:"#e2b6e8",tip:"#f8cf8a"};
const CI={story:"book-open",side:"drama",op:"briefcase",collect:"layers",event:"dice-5",money:"banknote",vehicle:"car",weapon:"crosshair",egg:"egg",tip:"lightbulb"};
const KTI={card:"layers",mag:"book-marked",book:"book-open",med:"sun",dive:"waves",flam:"bird",drone:"plane",wink:"camera",other:"sparkles"};
const EI={"📲":"smartphone","🧭":"route","🎯":"target","🎁":"gift","💡":"lightbulb","📍":"map-pin","🕒":"clock","🅿️":"square-parking","▶":"play","🔗":"layers","💬":"message-circle","📝":"book-open","⌨️":"gamepad-2","⚠":"triangle-alert","🎮":"gamepad-2","🗺️":"map","🔑":"key-round","🚨":"siren","💵":"banknote","💾":"save","👁️":"scan-eye","✨":"sparkles","🌍":"navigation","🆕":"sparkles","⏳":"hourglass","🙈":"eye-off","👤":"user-round","🤝":"share-2","🌐":"languages","🕹️":"joystick","📖":"book-open","🎭":"drama","💼":"briefcase","🃏":"layers","🎲":"dice-5","🚗":"car","🔫":"crosshair","🥚":"egg","⭐":"star","🏘️":"house","🛣️":"route","💀":"skull","🔐":"lock"};
const EIC=e=>EI[e.trim()]||EI[e.trim().replace(/\uFE0F/g,"")];
function deco(h){return h.replace(/<i data-ic="([a-z0-9-]+)"(?: class="([^"]*)")?><\/i>/g,(m,n,c)=>`<span class="hi ${c||""}">${ic(n)}</span>`).replace(/(<h1[^>]*>)\s*(?:\p{Extended_Pictographic}\uFE0F?\s*)+/gu,"$1").replace(/(<span class="(?:e|ti)">)([^<]{1,4})(<\/span>)/g,(m,a,e,b)=>EIC(e)?a+ic(EIC(e))+b:m).replace(/(<div class="(?:getline|tipline|pline)"><span>)([^<]{1,4})(<\/span>)/g,(m,a,e,b)=>EIC(e)?a+ic(EIC(e))+b:m).replace(/<span class="chev">⌄<\/span>/g,'<span class="chev">'+ic("chevron-down")+'</span>')}
const mainCat=x=>x.story?"story":(x.g.find(g=>g!=="tip"&&CAT[g])||x.g[0]||"side");

/* ---------- derived state ---------- */
let REV;try{REV=new Set(JSON.parse(localStorage.getItem('lr_rev')||'[]'))}catch(e){REV=new Set()}
let REVC;try{REVC=new Set(JSON.parse(localStorage.getItem('lr_revc')||'[]'))}catch(e){REVC=new Set()}
let MYR;try{MYR=JSON.parse(localStorage.getItem('lr_route')||'[]')}catch(e){MYR=[]}
const saveMyr=()=>{try{localStorage.setItem('lr_route',JSON.stringify(MYR))}catch(e){}};
const inRoute=id=>MYR.includes(id);
function toggleRoute(id){const i=MYR.indexOf(id);if(i>=0)MYR.splice(i,1);else MYR.push(id);saveMyr();toast(i>=0?"הוסר מהמסלול":`נוסף למסלול (${MYR.length})`);$$(`[data-rt="${CSS.escape(id)}"]`).forEach(b=>{b.classList.toggle("on",inRoute(id));b.innerHTML=rtLabel(id)});if(typeof mapChips==="function"&&mapReady)mapChips()}
const rtLabel=id=>inRoute(id)?`${ic("check")} במסלול שלי`:`${ic("plus")} למסלול שלי`;
let HREV;try{HREV=new Set(JSON.parse(localStorage.getItem('lr_howrev')||'[]'))}catch(e){HREV=new Set()}
const saveHrev=()=>{try{localStorage.setItem('lr_howrev',JSON.stringify([...HREV]))}catch(e){}};
const howHid=x=>!!S.hideHow&&!HREV.has(x.id)&&!!((x.steps&&x.steps.length)||x.d||x.rw||x.tips);
const saveRev=()=>{try{localStorage.setItem('lr_rev',JSON.stringify([...REV]));localStorage.setItem('lr_revc',JSON.stringify([...REVC]))}catch(e){}};
const hid=x=>locked(x)&&!REVC.has(x.id);
const done=x=>Store.done(x.id);
const BYNE={};IT.forEach(x=>{if(!BYNE[x.ne]||x.story)BYNE[x.ne]=x});
const STORYN=STORY.map(x=>x.ne).sort((a,b)=>b.length-a.length);
const REFC=new Map();function ref(str){if(!str)return null;if(REFC.has(str))return REFC.get(str);const r=_ref(str);REFC.set(str,r);return r}
function _ref(str){if(BYNE[str])return BYNE[str];const n=STORYN.find(n=>str.includes(n));return n?BYNE[n]:null}
function nextStory(){if(MEMO.has('ns'))return MEMO.get('ns');const n=STORY.find(x=>!done(x));MEMO.set('ns',n);return n}
function curCh(){const n=nextStory();return n?n.c:5}
/* availability: now | later (unlocks after a mission you haven't done) | missed (its window closed) */
const MEMO=new Map();Store.sub(()=>MEMO.clear());const _setS=Store.setS;Store.setS=(k,v)=>{MEMO.clear();_setS(k,v)};
function avail(x){const k='a'+x.id;let v=MEMO.get(k);if(v===undefined){v=_avail(x);MEMO.set(k,v)}return v}
function _avail(x){
  if(done(x))return "done";
  for(const f of ["bf","dl","lim"]){const r=ref(x[f]);if(r&&r!==x&&done(r))return "missed"}
  const a=ref(x.af);if(a&&a!==x&&!done(a))return "later";
  if(x.story){const n=nextStory();if(n&&x.ord>n.ord)return "later"}
  return "now";
}
function locked(x){const k='l'+x.id;let v=MEMO.get(k);if(v===undefined){v=_locked(x);MEMO.set(k,v)}return v}
function _locked(x){
  if(!S.spoil||done(x))return false;
  if(x.c>curCh())return true;
  if(S.spoilLvl!=="strict")return false;
  const n=nextStory();
  if(x.story&&n&&x.ord>n.ord)return true;
  const a=ref(x.af);if(a&&a.story&&!done(a)&&n&&a.ord>n.ord)return true;
  return false;
}
function title(x){return locked(x)&&!REV.has(x.id)?(x.story?`🔒 משימת סיפור (שם מוסתר)`:`🔒 שם מוסתר · פרק ${x.c}`):x.n}
function missable(x){return !!x.m}
function timed(x){return !!x.soon}
function untilName(x){const r=ref(x.bf)||ref(x.dl)||ref(x.lim);return r&&!locked(r)?r.n:null}
function forever(x){return !!x.pers&&!x.m}
function nextPonr(){const n=nextStory();if(!n)return null;return STORY.find(x=>x.ord>=n.ord&&x.ponr)}

function glyph(x,extra=""){
  const c=mainCat(x),d=done(x)?" done":"",t=timed(x)?" time":missable(x)?" miss":"",ms=avail(x)==="missed"?" missed":"";
  const lt=x.w&&x.w.length===1?x.w:"";
  if(c==="story")return `<span class="gl ${x.opt?"opt":"story"}${t}${d}${ms}${extra}">${esc(lt)}</span>`;
  if(c==="side")return `<span class="gl side${t}${d}${ms}${extra}">${esc(lt)}</span>`;
  const e=ic(x.t&&KTI[x.t]||CI[c]||"sparkles");
  return `<span class="gl coll${t}${d}${ms}${extra}" style="--c:${CATC[c]||"#ffdc82"}">${e}</span>`;
}
function tags(x,max=3){
  const a=[],av=avail(x);
  if(av==="missed")a.push(`<span class="tag gone">${ic("x")} פוספס</span>`);
  if(av==="later"&&!x.story){const r=ref(x.af);a.push(`<span class="tag">${ic("lock")} אחרי ${r?bdi(title(r)):bdi(x.af)}</span>`)}
  if(x.isNew)a.push(`<span class="tag ex">${ic("sparkles")} חדש</span>`);
  if(x.ponr)a.push(`<span class="tag ponr">${ic("triangle-alert")} אל־חזור</span>`);
  if(av!=="missed"&&av!=="done"){if(timed(x))a.push(`<span class="tag soon">${ic("hourglass")} עלול להיגמר בקרוב</span>`);else if(missable(x)){const u=untilName(x);a.push(`<span class="tag miss">${ic("circle-alert")} אפשר לפספס${u?` עד ${bdi(u)}`:""}</span>`)}else if(forever(x))a.push(`<span class="tag ok">${ic("infinity")} אפשר גם בהמשך</span>`)}
  if(x.veh)a.push(`<span class="tag">${ic("car")} רכב</span>`);
  return a.slice(0,max).join("");
}
function sub(x){
  const parts=[`פרק ${x.c}`];
  const c=mainCat(x);if(c!=="story")parts.push(CAT[c]?CAT[c][0]:c);
  if(x.w&&WHO[x.w])parts.push(WHO[x.w]);
  if(x.loc)parts.push(x.loc[x.loc.length-1].split(" – ")[0]);
  return parts.join(", ");
}
function dot(x){const av=avail(x);if(av==='done'||locked(x))return '';if(av==='missed')return '<span class="sdot gone" title="פוספס"></span>';if(timed(x))return '<span class="sdot soon" title="עלול להיגמר"></span>';if(missable(x))return '<span class="sdot miss" title="אפשר לפספס"></span>';if(av==='later')return '<span class="sdot later" title="עוד לא נפתח"></span>';if(x.isNew)return '<span class="sdot new" title="חדש"></span>';return ''}
function row(x,cls=""){
  const av=avail(x);
  return `<a style="--c:${CATC[mainCat(x)]||"#ffc23c"}" class="row ${cls}${done(x)?" done":""}${av==="missed"?" gone":""}${av==="later"?" later":""}${locked(x)?" locked":""}" href="#/i/${x.s}">${glyph(x)}<div class="t"><b>${bdi(title(x))}</b><small>${esc(sub(x))}</small></div>${S.casual||String(cls).includes("lite")?"":dot(x)}${locked(x)?`<button class="rev" data-rev="${esc(x.id)}" aria-label="הצג שם">${ic("eye")}</button>`:""}${S.casual||String(cls).includes("lite")?`<span class="chv">${ic("chevron-left")}</span>`:`<button class="chk${done(x)?" on":""}" data-chk="${esc(x.id)}" aria-label="סמן">✓</button>`}</a>`;
}

/* ---------- ui helpers ---------- */
let toastT;function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("on");clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove("on"),1800)}
function openSheet(html){document.body.classList.add("sheeton");$("#toast").classList.remove("on");$("#sheet").innerHTML=`<div class="grab"></div>`+deco(html);$("#sheet").classList.add("on");$("#scrim").classList.add("on");$("#sheet").scrollTop=0}
function closeSheet(){document.body.classList.remove("sheeton");$("#sheet").classList.remove("on");$("#scrim").classList.remove("on")}
$("#scrim").onclick=closeSheet;
let touchY=null;$("#sheet").addEventListener("touchstart",e=>{touchY=$("#sheet").scrollTop<=0?e.touches[0].clientY:null},{passive:true});
$("#sheet").addEventListener("touchend",e=>{if(touchY!=null&&e.changedTouches[0].clientY-touchY>90)closeSheet();touchY=null});
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-chk]");
  if(b){e.preventDefault();e.stopPropagation();const x=BY[b.dataset.chk];const on=Store.toggle(x.id);toast(on?"✓ סומן – כל הכבוד":"הסימון הוסר");refreshSoft();return}
  const l=e.target.closest("[data-lchk]");
  if(l){e.preventDefault();const k="L:"+l.dataset.lchk;Store.set(k,!Store.done(k));toast(Store.done(k)?"✓ נמצא":"הסימון הוסר");refreshSoft();return}
  const ut=e.target.closest("[data-upto]");if(ut){e.preventDefault();const m=BY[ut.dataset.upto];const n=markUpTo(m);toast(`✓ סומנו ${n} משימות סיפור עד כאן`);refreshSoft();return}
  const rv=e.target.closest("[data-rev]");if(rv){e.preventDefault();e.stopPropagation();REV.add(rv.dataset.rev);saveRev();MEMO.clear();refreshSoft();return}
  const rt=e.target.closest("[data-rt]");if(rt){e.preventDefault();e.stopPropagation();toggleRoute(rt.dataset.rt);return}
  const sh=e.target.closest("[data-share]");if(sh){e.preventDefault();const x=BYS[sh.dataset.share];share(x.n+" · Leo",`${x.n} ב־GTA 6 – איך עושים, מה מקבלים ואיפה בדיוק 👇`,SITE+"#/i/"+x.s);return}
  const v=e.target.closest(".vid .ph");if(v){v.outerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${v.dataset.id}?autoplay=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;}
});
function refreshSoft(){const m=$("#main"),y=m.scrollTop;route(true);m.scrollTop=y;if(mapReady)drawPins()}


/* ---------- growth: share, what's new, install ---------- */
const SITE="https://naorlevy27.github.io/Leo/";
async function share(title,text,url){url=url||SITE;try{if(navigator.share){await navigator.share({title,text,url});return}}catch(e){return}
  try{await navigator.clipboard.writeText(text+"\n"+url);toast("הקישור הועתק – הדבק בוואטסאפ")}catch(e){prompt("העתק את הקישור:",url)}}
const shareApp=()=>share("Leo · המדריך ל־GTA VI בעברית","מצאתי מדריך מטורף ל־GTA 6 בעברית: כל המשימות, מפה, טיפים, צ'יטים וכפתורים סודיים 👇");
const lastSeen=+(localStorage.getItem("lr_seen")||0);
const freshNews=NEWS.filter(n=>Date.parse(n.d)+86399e3>lastSeen);
function whatsNew(){
  openSheet(`<h3 style="font-size:19px;margin:0 0 4px">🆕 מה חדש באתר</h3><p class="dim" style="margin:0 0 10px;font-size:12.5px">אנחנו מוסיפים תגליות וטיפים כל יום</p>`+NEWS.slice(0,15).map(n=>`<a class="row" href="${n.s?"#/i/"+esc(n.s):"#/guides"}"><span class="gl coll" style="--c:#ff8a3d">🆕</span><div class="t"><b>${esc(n.t)}</b><small class="ltr">${esc(n.d.split("-").reverse().join("/"))}</small></div></a>`).join(""));
  localStorage.setItem("lr_seen",Date.now());$$(".newdot").forEach(e=>e.remove());
}
let deferredInstall=null;addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e});
function installBox(){
  if(matchMedia("(display-mode: standalone)").matches||navigator.standalone||localStorage.getItem("lr_noinst"))return "";
  const ios=/iphone|ipad/i.test(navigator.userAgent);
  return `<div class="inst"><span class="e">📲</span><div><b>שים את Leo על המסך הבית</b><small>${ios?"ב־Safari: כפתור השיתוף ⬆ › \"הוסף למסך הבית\"":"נפתח כמו אפליקציה, גם בלי אינטרנט"}</small></div>${!ios?`<button class="btn sm pri" id="instb">התקן</button>`:""}<button class="x" id="instx">✕</button></div>`;
}


/* "where am I" – mark the whole story up to a mission in one tap */
function markUpTo(m){let n=0;STORY.forEach(x=>{if(x.ord<=m.ord&&!done(x)){Store.set(x.id,true);n++}});MEMO.clear();return n}
function whereSheet(ch){
  ch=ch||curCh();
  const list=STORY.filter(x=>x.c===ch);
  openSheet(`<h3 style="font-size:19px;margin:0 0 4px">📍 איפה אתה בסיפור?</h3><p class="dim" style="margin:0 0 10px;font-size:12.5px">בחר את המשימה האחרונה שסיימת – נסמן ✓ את כל משימות הסיפור עד אליה. משימות צד לא נוגעים.</p>
  <div class="seg wide" style="margin-bottom:10px">${[1,2,3,4,5].map(c=>`<button data-wc="${c}" class="${c===ch?"on":""}">פרק ${c}</button>`).join("")}</div>
  ${ch>curCh()?`<p class="tag ponr" style="display:block;padding:8px 10px">⚠ הפרק הזה אחרי איפה שאתה – השמות יופיעו כאן כי ביקשת.</p>`:""}
  ${list.map(x=>`<button class="row${done(x)?" done":""}" style="width:100%;text-align:start" data-wm="${esc(x.id)}">${glyph(x)}<div class="t"><b>${bdi(x.n)}</b><small>${done(x)?"✓ סומן":"סיימתי עד כאן"}</small></div></button>`).join("")}`);
  $$("[data-wc]").forEach(b=>b.onclick=()=>whereSheet(+b.dataset.wc));
  $$("[data-wm]").forEach(b=>b.onclick=()=>{const m=BY[b.dataset.wm];const n=markUpTo(m);closeSheet();toast(n?`✓ סומנו ${n} משימות עד ${m.n}`:"הכל כבר מסומן");refreshSoft()});
}


/* ---------- first visit: ask before showing anything ---------- */
function pageWelcome(step){
  step=+step||1;
  const dots=`<div class="wdots">${[1,2,3].map(i=>`<i class="${i===step?"on":""}"></i>`).join("")}</div>`;
  if(step===1)return `<div class="welcome"><img src="icons/leo2-logo.png" class="wlogo" alt="Leo"><h1>ברוך הבא ל־Leo</h1><p class="muted">המדריך ל־GTA VI – משימות, מפה, טיפים. שלוש שאלות קצרות ומתחילים.</p>
    <div class="wopts"><button class="wopt" data-wl="he"><b>עברית</b></button><button class="wopt" data-wl="en"><b>English</b></button></div>${dots}</div>`;
  if(step===2){const n=STORY.find(x=>x.c===2)||STORY[3];
    const o=[["strict","🙈","בלי ספוילרים בכלל","רואים רק את המשימה הבאה. כל השאר – מוסתר עד שתחליט לגלות."],["ch","🙂","רק מה שבפרק שלי","שמות של משימות בפרק שלך גלויים. פרקים הבאים – מוסתרים."],["off","😎","תראה לי הכל","בלי הסתרות בכלל."]];
    return `<div class="welcome"><h1>כמה ספוילרים?</h1><p class="muted">אפשר לשנות בכל רגע ב"אני".</p><div class="wopts col">${o.map(a=>`<button class="wopt" data-ws="${a[0]}"><span class="we">${a[1]}</span><div><b>${a[2]}</b><small>${a[3]}</small></div></button>`).join("")}</div>${dots}</div>`;}
  return `<div class="welcome"><h1>איפה אתה במשחק?</h1><p class="muted">ככה "מה עושים עכשיו" יהיה נכון מהרגע הראשון.</p><div class="wopts col">
    <button class="wopt" data-wp="new"><span class="we">🎮</span><div><b>עוד לא התחלתי / ממש בהתחלה</b></div></button>
    <button class="wopt" data-wp="mid"><span class="we">📍</span><div><b>אני באמצע – אבחר משימה</b><small>בוחרים את המשימה האחרונה שסיימת</small></div></button>
    <button class="wopt" data-wp="code"><span class="we">💾</span><div><b>יש לי קוד / קישור גיבוי</b></div></button></div>${dots}</div>`;
}
function bindWelcome(step){
  step=+step||1;const go=n=>location.hash="#/welcome/"+n;
  $$("[data-wl]").forEach(b=>b.onclick=()=>{try{localStorage.setItem("lr_lang",b.dataset.wl)}catch(e){};if(b.dataset.wl!==(window.LANG||"he")){location.hash="#/welcome/2";location.reload()}else go(2)});
  $$("[data-ws]").forEach(b=>b.onclick=()=>{const v=b.dataset.ws;Store.setS("spoil",v!=="off");Store.setS("spoilLvl",v==="strict"?"strict":"ch");go(3)});
  const fin=()=>{localStorage.setItem("lr_onb","1");location.hash="#/"};
  $$("[data-wp]").forEach(b=>b.onclick=()=>{const v=b.dataset.wp;
    if(v==="new")return fin();
    if(v==="mid"){localStorage.setItem("lr_onb","1");location.hash="#/";setTimeout(()=>whereSheet(1),300);return}
    const c=prompt("הדבק את הקוד או את קישור הגיבוי:");if(c){try{const n=Store.fromCode(c.includes("#/restore/")?c.split("#/restore/")[1]:c);toast(`שוחזרו ${n} סימונים ✓`)}catch(e){toast("הקוד לא תקין")}}fin()});
}

/* ---------- pages ---------- */
function pct(a,b){return b?Math.round(a/b*100):0}
function ring(p,label){const r=40,c=2*Math.PI*r;return `<svg class="ring" viewBox="0 0 96 96"><circle cx="48" cy="48" r="${r}" fill="none" stroke="#1a1020" stroke-width="9"/><circle cx="48" cy="48" r="${r}" fill="none" stroke="url(#rg)" stroke-width="9" stroke-linecap="round" stroke-dasharray="${c*p/100} ${c}" transform="rotate(-90 48 48)"/><defs><linearGradient id="rg"><stop offset="0" stop-color="#ff9a3c"/><stop offset="1" stop-color="#ff3d8b"/></linearGradient></defs><text x="48" y="52" text-anchor="middle">${p}%</text><text class="s" x="48" y="68" text-anchor="middle">${esc(label)}</text></svg>`}

function pageHome(){
  const n=nextStory(),ch=curCh();
  const pr=nextPonr();
  const toPonr=pr&&n?STORY.filter(x=>x.ord>=n.ord&&x.ord<pr.ord).length:0;
  const soon=IT.filter(x=>avail(x)==="now"&&(missable(x)||timed(x))&&x.c===ch&&!locked(x)&&!x.story&&(!pr||x.ord<=pr.ord+0.5))
    .sort((a,b)=>(timed(b)-timed(a))||(a.ord-b.ord));
  const CHN=["","Just Like Paradise","Paradise Lost","Tits, Ass, Drug Money","Vice City, Baby","Top of the World, Ma"];
  const chp=(()=>{const a=STORY.filter(x=>x.c===ch);return a.length?Math.round(a.filter(done).length/a.length*100):0})();
  let h=`<button class="hwhere" id="wh" aria-label="עדכן איפה אני"><span class="chn"><b>פרק ${ch}</b> ${esc(CHN[ch]||"")}</span><span class="chb"><i style="width:${chp}%"></i></span></button>`;
  if(n)h+=`<a class="now${n.x!=null?" hasmap":""}" href="#/i/${n.s}"${n.x!=null?` style="--mx:${((n.x-150)/700*100).toFixed(1)}%;--my:${((n.y-150)/670*100).toFixed(1)}%"`:""}>${n.x!=null?`<span class="nmap"></span><span class="npin"></span>`:""}<svg class="palm" viewBox="0 0 150 210" aria-hidden="true"><path fill="currentColor" d="M112 210C104 160 92 110 80 62l6-2c12 48 26 98 36 150zM82 58C60 40 30 38 4 52c26-8 52-4 78 10zM82 58C70 30 48 14 20 12c26 8 46 24 60 50zM82 58c8-30 26-46 54-50-24 12-40 28-52 54zM82 58c26-14 50-12 68 4-22-10-46-8-66 2zM82 60c-16 6-34 26-42 52 14-24 30-38 44-48zM84 60c20 6 36 24 44 48-14-20-28-34-44-44z"/></svg><div class="nk">מה עושים עכשיו</div><div class="nt">${glyph(n)}<b>${bdi(title(n))}</b></div><div class="ns">${esc(sub(n))}</div><span class="ngo">${ic("chevron-left")}</span></a>`;
  else h+=`<div class="now"><div class="nk">סיימת את הסיפור 🎉</div><div class="ns">נשאר לך לאסוף דברים במפה</div></div>`;
  if(!S.casual){
    if(pr&&toPonr<=3)h+=`<div class="hint warn">${ic("triangle-alert")} ${toPonr===0?"המשימה הבאה סוגרת דברים לתמיד":`עוד ${toPonr} משימות לנקודת אל־חזור`}</div>`;
    if(soon.length){h+=`<div class="sec"><h2>לפני שזה נגמר</h2></div><div class="group">`+soon.slice(0,3).map(x=>row(x,"lite")).join("")+`</div>`;if(soon.length>3)h+=`<a class="morel" href="#/list" id="moresoon">עוד ${soon.length-3} דברים שעלולים להיעלם ›</a>`}
  }
  if(NEWS.length){const nw=NEWS[0];h+=`<button class="newsline" id="wn"><span class="e">🆕</span><span>${freshNews.length>1?`<b>${freshNews.length} חדשים</b> · `:""}${esc(nw.t)}</span><span class="dim">‹</span></button>`}
  return h;
}

/* ---------- missions list: tabs + organized filter sheet + chapter timeline ---------- */
const TABS=[["all","הכל"],["story","סיפור"],["side","צד"],["collect","אספנות"],["op","כנופיות"],["event","אירועים"],["more","עוד"]];
const MORE=["money","vehicle","weapon","egg","tip"];
const LF=Object.assign({tab:"all",ch:0,q:"",stat:"",avail:"",miss:0,kt:{},ex:{},open:{}},S.lists2||{});for(const k in LF.kt)if(LF.kt[k]!==1)delete LF.kt[k];for(const k in LF.ex)if(!LF.ex[k])delete LF.ex[k];
function inTab(x){const c=mainCat(x);if(LF.tab==="all")return !x.tip&&c!=="collect";if(LF.tab==="more")return MORE.includes(c)||x.g.some(g=>MORE.includes(g));return c===LF.tab||x.g.includes(LF.tab)}
function passes(x){
  if(!inTab(x))return false;
  const c=mainCat(x);
  for(const k in LF.ex)if(LF.ex[k]&&(c===k||x.g.includes(k)))return false;
  const ktOn=Object.keys(LF.kt).filter(k=>LF.kt[k]===1);if(ktOn.length&&!ktOn.includes(x.t))return false;if(LF.kt[x.t]===2)return false;
  if(LF.ch&&x.c!==LF.ch)return false;
  const av=avail(x);
  if(LF.stat==="open"&&(av==="done"||av==="missed"))return false;
  if(LF.stat==="done"&&av!=="done")return false;
  if(LF.stat==="missed"&&av!=="missed")return false;
  if(LF.avail==="now"&&av!=="now")return false;
  if(LF.miss&&!((missable(x)||timed(x))&&av==="now"))return false;
  if(LF.q.trim()&&!itemMatches(x,LF.q))return false;
  return true;
}
function nFilters(){return (LF.ch?1:0)+(LF.stat?1:0)+(LF.avail?1:0)+(LF.miss?1:0)+Object.values(LF.ex).filter(Boolean).length+Object.values(LF.kt).filter(Boolean).length}
const STL={"":"הכל",open:"עוד לא עשיתי",done:"עשיתי",missed:"פוספס"};
/* ---------- search engine: normalised, multi-word, Hebrew⇄English synonyms, typo-tolerant, ranked ---------- */
const FIN={"ך":"כ","ם":"מ","ן":"נ","ף":"פ","ץ":"צ"};
const norm=s=>(s==null?"":String(s)).toLowerCase().replace(/[֑-ׇ]/g,"").replace(/[ךםןףץ]/g,c=>FIN[c]).replace(/<[^>]+>/g," ").replace(/['’`׳״"]/g,"").replace(/[־\-–—_'’`"״׳.,:;!?()\[\]{}\/\\|·•+*~#@%^&=<>…]/g," ").replace(/וו/g,"ו").replace(/יי/g,"י").replace(/\s+/g," ").trim();
const SYNR=[["וילה","אחוזה","mansion","villa","estate"],["כספת","כספות","safe","safes","vault"],["רכב","מכונית","אוטו","car","vehicle","ride"],["סופרקאר","מכונית ספורט","supercar","sports car"],["אופנוע","bike","motorcycle","scooter"],["סירה","boat","jet ski","seashark"],["מסוק","helicopter","heli"],["מטוס","plane","airplane","jet"],["נשק","weapon","gun","guns"],["רובה","rifle","longarm","shotgun"],["אקדח","pistol","revolver"],["כסף","מזומן","cash","money","$"],["סוד","סודי","סודית","secret","hidden"],["ביצת פסחא","איסטר","easter egg","egg"],["אדום","red","ruby"],["ירוק","green"],["סגול","purple"],["כחול","blue"],["צהוב","yellow"],["שחור","black"],["לבן","white"],["ורוד","pink"],["זהב","gold","golden"],["דוב","דובים","דובון","דובונים","bear","bears","teddy","teddy bear"],["ואן","טנדר","מסחרית","van","rumpo","minivan"],["קלף","קלפים","card","cards","trading card"],["בייסבול","baseball"],["כדורסל","basketball","hoop"],["מחסן","warehouse","storage","lockup"],["כלב","dog"],["תנין","gator","alligator"],["כריש","shark"],["ביגפוט","bigfoot","skunk ape"],["חייזר","alien","ufo"],["רוח","ghost"],["שוד","robbery","heist","rob"],["בנק","bank","fleeca"],["תכשיט","jewelry","jewel"],["סמים","drugs","narcotics"],["משטרה","שוטר","police","cop","cops"],["שומר","מאבטח","guard","guards","security"],["קוד","code","codes"],["ציט","cheat","cheats"],["חוף","beach"],["אי","island"],["ביצה","swamp","grassrivers"],["שדה תעופה","airport","vcia"],["מועדון","club"],["מוסך","garage"],["מלון","hotel"],["משימה","mission","quest"],["אספנות","collectible","collectibles"],["אירוע","random event","event"],["טיפ","tip","tips"],["כפתור","button","buttons"],["מפה","map"],["פסל","statue"],["שעון","watch"],["תמונה","photo","picture"]].map(a=>a.map(norm));
const SYN={};SYNR.forEach(g=>g.forEach(w=>{(SYN[w]=SYN[w]||new Set());g.forEach(v=>v!==w&&SYN[w].add(v))}));
const PFX="הבלמוכש";
const STOP=new Set(["עמ","של","את","על","או","גמ","יש","מה","איכ","איפה","זה","אני","רוצה","שיש","עוד","כמו","the","a","an","of","with","and","in","to","for","on","at","gta","6"].map(norm));
const HTR={"א":"","ב":"b","ג":"g","ד":"d","ה":"","ו":"","ז":"s","ח":"","ט":"t","י":"","כ":"k","ל":"l","מ":"m","נ":"n","ס":"s","ע":"","פ":"p","צ":"ts","ק":"k","ר":"r","ש":"s","ת":"t"};
const skel=w=>w.replace(/j/g,"g").replace(/ph/g,"p").replace(/[fp]/g,"p").replace(/[vw]/g,"b").replace(/[cqk]/g,"k").replace(/[zs]/g,"s").replace(/[aeiouyh]/g,"").replace(/(.)\1+/g,"$1");
const hskel=w=>(w[0]==="ו"?"b":"")+[...(w[0]==="ו"?w.slice(1):w)].map(c=>HTR[c]!=null?HTR[c]:"").join("").replace(/(.)\1+/g,"$1");
const SKC=new Map();function skelWords(t){let v=SKC.get(t);if(!v){v=t.split(" ").filter(w=>/^[a-z]/.test(w)).map(skel).filter(w=>w.length>=2);if(SKC.size>40000)SKC.clear();SKC.set(t,v)}return v}
function qTerms(q){
  const n=norm(q);if(!n)return [];
  let words=n.split(" ").filter(w=>!STOP.has(w));if(!words.length)words=n.split(" ");const out=[];
  for(let i=0;i<words.length;i++){
    let w=words[i],two=i+1<words.length?w+" "+words[i+1]:null;
    if(two&&SYN[two]){out.push([two,...SYN[two]]);i++;continue}
    const alts=new Set([w]);
    (SYN[w]||[]).forEach(v=>alts.add(v));
    if(w.length>=4&&PFX.includes(w[0])){const s=w.slice(1);alts.add(s);(SYN[s]||[]).forEach(v=>alts.add(v))}
    if(w.length>=4&&PFX.includes(w[0])&&PFX.includes(w[1])){alts.add(w.slice(2))}
    [...alts].forEach(a=>{if(/[\u05d0-\u05ea]/.test(a)){const m=a.match(/^(.{2,})(ימ|ות|ה|ית)$/);if(m){alts.add(m[1]);(SYN[m[1]]||[]).forEach(v=>alts.add(v))}}});
    const A=[...alts];if(/^[\u05d0-\u05ea]{3,}$/.test(w)){const k=hskel(w);if(k.length>=2)A.push("\u0001"+k)}
    out.push(A);
  }
  return out;
}
function lev1(a,b){if(Math.abs(a.length-b.length)>1)return false;let i=0,j=0,e=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue}if(++e>1)return false;if(a.length>b.length)i++;else if(b.length>a.length)j++;else{i++;j++}}return e+(a.length-i)+(b.length-j)<=1}
function hitIn(txt,alts){
  if(!txt)return 0;let best=0;
  for(const a of alts){
    if(a[0]==="\u0001"){if(best)continue;const k=a.slice(1);if(skelWords(txt).some(w=>k.length<3?w===k:w.startsWith(k)))best=.8;continue}
    const lat=/^[a-z0-9$]/.test(a);let p=txt.indexOf(a),v=0;
    while(p>=0){const pre=p===0?" ":txt[p-1],pre2=p<2?" ":txt[p-2];
      if(pre===" ")v=Math.max(v,p===0?3:2);
      else if(!lat&&(PFX.includes(pre)&&(pre2===" "||PFX.includes(pre2)&&(p<3||txt[p-3]===" "))))v=Math.max(v,1.6);
      else if(!lat&&a.length>=4)v=Math.max(v,.7);
      if(v>=2)break;p=txt.indexOf(a,p+1)}
    if(v>best)best=v;if(best===3)break}
  if(!best){const a0=alts[0];if(a0.length>=5&&!/\d/.test(a0)){for(const w of txt.split(" "))if(w.length>=5&&lev1(a0,w)){best=.6;break}}}
  return best;
}
/* fields: [text, weight] – returns score or 0 if any term misses */
function scoreF(fields,terms,part){
  let tot=0,m=0;
  for(const alts of terms){let b=0;for(const [t,w] of fields){const h=hitIn(t,alts);if(h&&h*w>b)b=h*w}if(b){m++;tot+=b}else if(!part)return 0}
  if(!m)return 0;
  if(part){const need=terms.length<=2?terms.length:Math.ceil(terms.length/2);if(m<need)return 0;return tot+(m===terms.length?1000:m*100)}
  return tot;
}
const IX=new Map(),GTX=new Map();
function guideText(g){const k=g.id+"|"+curCh()+"|"+S.spoil;if(GTX.has(k))return GTX.get(k);const t=document.createElement("template");t.innerHTML=g.h;if(S.spoil)t.content.querySelectorAll("[data-ch]").forEach(e=>{if(+e.dataset.ch>curCh())e.remove()});const v=norm(t.content.textContent);GTX.set(k,v);return v}
function ixItem(x){
  let o=IX.get(x.id);if(o)return o;
  const k=(x.g||[]).map(g=>(CAT[g]||[""])[0]).join(" ");
  let nb="";if(x.x!=null){for(const l of LOCS){const dx=l.x-x.x,dy=l.y-x.y;if(dx*dx+dy*dy<4)nb+=" "+l.n}}
  o={pub:[[norm((x.loc||[]).join(" ")+" "+(x.st||"")),5],[norm(k),2],[norm(nb),2]],
     nm:[[norm(x.n+" "+(x.ne||"")),10]],
     sec:[[norm([x.sp,x.lk].join(" ")),4],[norm([x.why,x.d,x.k,x.rw,x.nt].join(" ")),3],[norm([...(x.steps||[]),...(x.tips||[]),x.ch].join(" ")),1.5]]};
  IX.set(x.id,o);return o;
}
function searchAll(q,opts={}){
  const terms=qTerms(q);const R={items:[],hidden:[],locs:[],places:[],guides:[],tips:[],cheats:[],terms};
  if(!terms.length)return R;
  const cur=curCh();
  IT.forEach(x=>{const o=ixItem(x);
    if(!locked(x)||opts.all){let s=scoreF([...o.nm,...o.pub,...(hid(x)&&!opts.all?[]:o.sec)],terms,1);if(s){if(done(x))s-=2;else if(avail(x)==="now")s+=2;R.items.push([s,x])}}
    else{const s=scoreF([...o.nm,...o.pub,...o.sec],terms,1);if(s){R.hidden.push(x);if(s>=1000)R.hfull=(R.hfull||0)+1}}});
  R.items.sort((a,b)=>b[0]-a[0]);R.full=R.items.filter(a=>a[0]>=1000).length;R.items=R.items.map(a=>a[1]);
  LOCS.forEach(l=>{const s=scoreF([[norm(l.n),8],[norm((KINDS[l.k]||{}).n+" "+l.t+" "+(l.a||"")),3],[norm(l.d),1.5]],terms,1);if(s)R.locs.push([s,l])});
  R.locs.sort((a,b)=>b[0]-a[0]);R.locs=R.locs.map(a=>a[1]);
  if(VEC){const L=VEC.lab;
    [["dist","🗺️","מחוז / עיר"],["hood","🏘️","שכונה"],["street","🛣️","רחוב"]].forEach(([k,e,t])=>(L[k]||[]).forEach(h=>{const s=scoreF([[norm(h[0]),9]],terms);if(s)R.places.push([s+(k==="dist"?2:k==="hood"?1:0),{n:h[0],x:h[1],y:h[2],e,t}])}));
    (L.places||[]).forEach(p=>{const s=scoreF([[norm(p[0]),7],[norm(p[1]),2]],terms);if(s)R.places.push([s,{n:p[0],x:p[2],y:p[3],e:"📍",t:p[1]}])});
    R.places.sort((a,b)=>b[0]-a[0]);R.places=R.places.map(a=>a[1]);}
  (window.GUIDES||[]).forEach(g=>{const s=scoreF([[norm(g.t),9],[norm(g.d),5],[guideText(g),1.5]],terms,1);if(s)R.guides.push([s,g])});
  R.guides.sort((a,b)=>b[0]-a[0]);R.guides=R.guides.map(a=>a[1]);
  tipList(999).forEach(t=>{const s=scoreF([[norm(t.t),4]],terms,1);if(s)R.tips.push([s,t])});
  R.tips.sort((a,b)=>b[0]-a[0]);R.tips=R.tips.map(a=>a[1]);
  (CH.list||[]).forEach(c=>{const s=scoreF([[norm(c.n+" "+(c.ne||"")),8],[norm(c.cat+" "+(c.u||"")),2],[norm(c.kw||""),6],["ציט cheat cheats קוד code",3]],terms,1);if(s)R.cheats.push([s,c])});
  R.cheats.sort((a,b)=>b[0]-a[0]);R.cheats=R.cheats.map(a=>a[1]);
  return R;
}
function itemMatches(x,q){const terms=qTerms(q);if(!terms.length)return true;const o=ixItem(x);return !!scoreF([...o.nm,...o.pub,...(hid(x)?[]:o.sec)].filter(f=>!(locked(x)&&!REV.has(x.id)&&f===o.nm[0])),terms)}
let SQ="",SALL=0;
const SUGG=["כספת","רכב נדיר","כסף","ביצת פסחא"];
function pageSearch(q){
  if(q&&q.q!=null)SQ=q.q;
  return `<div class="search big">${ic("search")}<input id="sq" type="search" enterkeyhint="search" autocomplete="off" placeholder="חפש הכל – משימה, מקום, רכב, טיפ…" value="${esc(SQ)}"><button id="sqx" class="dim"${SQ?"":" hidden"}>✕</button></div><div id="sres">${searchHtml()}</div>`;
}
function searchHtml(){
  const q=SQ.trim();
  if(norm(q).length<2){let h=`<div class="grp">נסה למשל</div><div class="chips wrap">`+SUGG.filter(s=>!(S.spoil&&s==="Moses"&&curCh()<2)).map(s=>`<button class="chip" data-sg="${esc(s)}">${esc(s)}</button>`).join("")+`</div>`;
    h+=`<p class="dim" style="font-size:12.5px;margin:14px 2px">אפשר לכתוב בעברית או באנגלית, כמה מילים ביחד ("כספת Vice Beach"), וגם עם שגיאת כתיב קטנה.</p>`;return h}
  const R=searchAll(q,{all:SALL});
  const n=R.items.length+R.locs.length+R.places.length+R.guides.length+R.tips.length+R.cheats.length;
  let h="";
  const sec=(t,arr,f,max)=>{if(!arr.length)return;h+=`<div class="grp">${t} (${arr.length})</div>`;h+=`<div class="group">`+arr.slice(0,max).map(f).join("")+`</div>`;if(arr.length>max)h+=`<div class="dim" style="font-size:12px;margin:4px 4px 0">ועוד ${arr.length-max} – נסה לדייק את החיפוש</div>`};
  const hb=R.hidden.length&&!SALL?`<button class="blk hidres" id="sall"><b>🔒 עוד ${R.hidden.length} תוצאות מחלקים שעוד לא הגעת אליהם</b><small>לחץ כדי לראות אותן ברשימה (השמות יישארו מוסתרים עד שתבחר לחשוף)</small></button>`:"";
  if(hb&&R.hfull&&!R.full)h+=hb;
  if(R.items.length&&R.full===0&&R.terms.length>2)h+=`<div class="dim" style="font-size:12px;margin:2px 4px 6px">לא מצאתי משהו עם כל המילים – אלה הכי קרובים:</div>`;
  sec("משימות ודברים",R.items,x=>row(x),25);
  sec("מדריכים",R.guides,g=>`<a class="row" href="#/g/${g.id}"><span class="gl coll">${g.e}</span><div class="t"><b>${esc(g.t)}</b><small>${esc(g.d)}</small></div><span class="dim">‹</span></a>`,6);
  sec("צ'יטים",R.cheats,c=>`<a class="row" href="#/cheats"><span class="gl coll">🎮</span><div class="t"><b>${bdi(c.n)}</b><small>${esc(c.cat||"")}${c.code&&c.code.length?" · יש קוד":""}</small></div><span class="dim">‹</span></a>`,6);
  sec("טיפים",R.tips,t=>`<a class="row" href="#/${t.k==="btn"?"buttons":"tips"}"><span class="gl coll">${t.k==="btn"?"🎮":"💡"}</span><div class="t"><b style="font-weight:600;font-size:13.5px">${esc(t.t)}</b></div></a>`,6);
  sec("במפה",R.locs,l=>`<a class="row" href="#/map?l=${encodeURIComponent(l.id)}"><span class="gl coll">${esc((KINDS[l.k]||{}).i||"📍")}</span><div class="t"><b>${bdi(l.n)}</b><small>${esc((KINDS[l.k]||{}).n||l.k)}${l.a?" · "+esc(l.a):""}</small></div><span class="dim">🗺️</span></a>`,12);
  sec("מקומות ושכונות",R.places,p=>`<a class="row" href="#/map?at=${p.x},${p.y}"><span class="gl coll">${p.e}</span><div class="t"><b>${bdi(p.n)}</b><small>${esc(p.t)}</small></div><span class="dim">🗺️</span></a>`,8);
  if(hb&&!(R.hfull&&!R.full))h+=hb;
  if(!n&&!R.hidden.length)h+=`<div class="empty">לא מצאתי 🤔<br><small>נסה מילה אחרת, באנגלית, או פחות מילים</small></div>`;
  return (n?`<div class="dim cnt">${n} תוצאות</div>`:"")+h;
}
function bindSearch(){
  const i=$("#sq");if(!i)return;
  const draw=()=>{$("#sres").innerHTML=searchHtml();$("#sqx").hidden=!SQ;bindSres()};
  i.oninput=()=>{SQ=i.value;SALL=0;clearTimeout(i._t);i._t=setTimeout(()=>{history.replaceState(null,"","#/search?q="+encodeURIComponent(SQ));draw()},160)};
  i.onkeydown=e=>{if(e.key==="Enter")i.blur()};
  $("#sqx").onclick=()=>{SQ="";i.value="";draw();i.focus()};
  if(!SQ)setTimeout(()=>i.focus(),80);
  if(!VEC)loadVec().then(()=>{if(curPage==="search"&&SQ)draw()});
  bindSres();
}
function bindSres(){
  $$("[data-sg]").forEach(b=>b.onclick=()=>{SQ=b.dataset.sg;$("#sq").value=SQ;history.replaceState(null,"","#/search?q="+encodeURIComponent(SQ));$("#sres").innerHTML=searchHtml();$("#sqx").hidden=false;bindSres()});
  const a=$("#sall");if(a)a.onclick=()=>{SALL=1;$("#sres").innerHTML=searchHtml();bindSres()};
}

function pageList(q){
  if(q.cat){const t=TABS.find(t=>t[0]===q.cat);LF.tab=t?q.cat:(MORE.includes(q.cat)?"more":"all")}if(q.ch)LF.ch=+q.ch;if(q.miss){LF.miss=1;LF.tab="all"}
  const list=IT.filter(passes);
  if(!q.keepq)LF.q="";
  let h=`<div class="ihead"><h1>משימות</h1></div>`;
  h+=`<div class="tabs">`+TABS.map(t=>`<button class="tab${LF.tab===t[0]?" on":""}" style="--c:${CATC[t[0]]||"#ff8a3d"}" data-tab="${t[0]}">${t[1]}</button>`).join("")+`</div>`;
  const nf=nFilters();
  const SORTN={chrono:"לפי הסדר",near:"הכי קרוב",soon:"מה נגמר קודם",type:"לפי סוג"};
  h+=`<div class="fbar"><span class="cntl">${list.length} דברים</span><button class="fbtn sortb" id="fsortb">${ic("arrow-up-down")} ${SORTN[LF.sort||"chrono"]}</button><button class="fbtn${nf?" on":""}" id="fopen" aria-label="סינון ומיון">${ic("sliders-horizontal")}${nf?` <b>${nf}</b>`:""}</button></div>`;
  const act=[];
  if(LF.stat)act.push([`מצב: ${STL[LF.stat]}`,"stat"]);if(LF.miss)act.push(["רק מה שעלול להיעלם","miss"]);
  for(const k in LF.ex)if(LF.ex[k])act.push([`בלי ${CAT[k][0]}`,"ex:"+k]);
  for(const k in LF.kt)if(LF.kt[k]===1)act.push([`רק ${D.KT[k][0]}`,"kt:"+k]);
  if(act.length)h+=`<div class="chips act">`+act.map(a=>`<button class="chip on" data-rm="${a[1]}">${esc(a[0])} ✕</button>`).join("")+`<button class="chip" data-rm="all">נקה הכל</button></div>`;
  if(!list.length)return h+`<div class="empty">אין תוצאות.<br><button class="btn sm" data-rm="all" style="margin-top:10px">נקה פילטרים</button></div>`;
  const cur=curCh();
  const mode=LF.sort||"chrono";
  if(mode==="near"){
    const r=routeFrom(list.filter(x=>x.x!=null&&avail(x)==="now"));
    h+=`<div class="blk routeb"><h3><span class="e">🧭</span>מסלול מומלץ – מהמשימה הבאה, לפי קרבה</h3><p class="muted" style="margin:0 0 8px;font-size:13px">רק מה שאפשר לעשות עכשיו. כל תחנה – הכי קרובה לקודמת.</p><a class="btn pri wide" href="#/map?route=1">🗺️ הצג את המסלול במפה</a></div>`;
    r.slice(0,40).forEach((x,i)=>{h+=`<div class="rstep"><span class="rn">${i+1}</span>${row(x)}</div>`});
    if(!r.length)h+=`<div class="empty">אין כרגע דברים עם מיקום שזמינים עכשיו.</div>`;
    return h;
  }
  if(mode==="soon"){/*g*/
    const u=list.filter(x=>(timed(x)||missable(x))&&avail(x)==="now").sort((a,b)=>(timed(b)-timed(a))||(((ref(a.bf)||{}).ord||9e9)-((ref(b.bf)||{}).ord||9e9)));
    h+=`<div class="grp">⏳ עלול להיגמר בכל רגע · ❗ נעלם בנקודה ידועה</div>`+(u.map(x=>row(x)).join("")||`<div class="empty">אין כרגע משהו שעומד להיגמר 🎉</div>`);
    return h;
  }
  if(mode==="type"){
    for(const k in CAT){const a=list.filter(x=>mainCat(x)===k);if(!a.length)continue;const open=LF.open["t"+k]!=null?LF.open["t"+k]:false;
      h+=`<section class="chap${open?" open":""}"><button class="chead" data-tog="t${k}"><span class="cn">${ic(CI[k])} ${CAT[k][0]}</span><span class="bar"><i style="width:${pct(a.filter(done).length,a.length)}%"></i></span><span class="cp">${a.filter(done).length}/${a.length}</span><span class="cv">${open?"▴":"▾"}</span></button>${open?a.map(x=>row(x)).join(""):""}</section>`}
    return h;
  }
  const timeline=LF.tab==="all"||LF.tab==="story"||LF.tab==="side";
  for(let c=1;c<=5;c++){
    const inC=list.filter(x=>x.c===c);if(!inC.length)continue;
    const allC=IT.filter(x=>x.c===c&&inTab(x)),dn=allC.filter(done).length;
    const open=LF.open[c]!=null?LF.open[c]:(c===cur||!!LF.ch||!!LF.q);
    h+=`<section class="chap${open?" open":""}"><button class="chead" data-tog="${c}"><span class="cn">פרק ${c}</span><span class="bar"><i style="width:${pct(dn,allC.length)}%"></i></span><span class="cp">${dn}/${allC.length}</span><span class="cv">${open?"▴":"▾"}</span></button>`;
    if(open){
      if(timeline){
        const used=new Set();const stories=inC.filter(x=>x.story);
        const kidsOf=m=>inC.filter(x=>!x.story&&!used.has(x.id)&&ref(x.af)===m);
        const free=inC.filter(x=>!x.story&&(!x.af||!ref(x.af)||ref(x.af).c!==c||!stories.includes(ref(x.af))&&!IT.includes(ref(x.af))));
        const orphan=inC.filter(x=>!x.story&&x.af&&ref(x.af)&&!stories.includes(ref(x.af)));
        const pre=[...new Set([...free,...orphan])];
        if(pre.length&&LF.tab!=="story"){h+=`<div class="tl-h">בכל זמן בפרק</div>`;pre.forEach(x=>{used.add(x.id);h+=row(x,"kid")})}
        stories.forEach(m=>{h+=row(m,"tl");const k=kidsOf(m);if(k.length){h+=`<div class="kids"><div class="kl">נפתח אחרי המשימה הזאת · ${k.length}</div>`;k.forEach(x=>{used.add(x.id);h+=row(x,"kid")});h+=`</div>`}});
        inC.filter(x=>!x.story&&!used.has(x.id)).forEach(x=>h+=row(x,"kid"));
      }else inC.forEach(x=>h+=row(x));
    }
    h+=`</section>`;
  }
  return h;
}
function routeFrom(arr){
  const n=nextStory();let cx=n&&n.x!=null?n.x:480,cy=n&&n.x!=null?n.y:520;const left=arr.filter(x=>x!==n);const out=n&&n.x!=null&&arr.includes(n)?[n]:[];
  while(left.length){let bi=0,bd=1e18;for(let i=0;i<left.length;i++){const dx=left[i].x-cx,dy=left[i].y-cy,dd=dx*dx+dy*dy;if(dd<bd){bd=dd;bi=i}}const x=left.splice(bi,1)[0];out.push(x);cx=x.x;cy=x.y}
  return out;
}
function filterSheet(){
  let h=`<h3 style="font-size:19px;margin:0 0 10px">סינון ומיון</h3>`;
  h+=`<div class="fsec"><b>סדר</b><div class="seg wide">`+[["chrono","לפי הסדר"],["near","הכי קרוב"],["soon","נגמר קודם"],["type","לפי סוג"]].map(m=>`<button data-fso="${m[0]}" class="${(LF.sort||"chrono")===m[0]?"on":""}">${m[1]}</button>`).join("")+`</div></div>`;
  h+=`<div class="fsec"><b>פרק</b><div class="seg wide">`+[0,1,2,3,4,5].map(c=>`<button data-fc="${c}" class="${LF.ch===c?"on":""}">${c?c:"הכל"}</button>`).join("")+`</div></div>`;
  h+=`<div class="fsec"><b>מצב</b><div class="seg wide">`+Object.keys(STL).map(k=>`<button data-fs="${k}" class="${LF.stat===k?"on":""}">${STL[k]}</button>`).join("")+`</div></div>`;
  h+=`<div class="fsec"><div class="set" style="padding:6px 0;border:0"><div class="t"><b>רק מה שזמין עכשיו</b><small>בלי מה שעוד לא נפתח ובלי מה שפוספס</small></div><button class="sw${LF.avail==="now"?" on":""}" data-fa></button></div>
  <div class="set" style="padding:6px 0;border:0"><div class="t"><b>רק מה שעלול להיעלם</b><small>זמן מוגבל + דברים שנעלמים בנקודה מסוימת</small></div><button class="sw${LF.miss?" on":""}" data-fm></button></div></div>`;
  h+=`<div class="fsec"><b>אילו סוגים להציג</b><div class="chips wrap">`+Object.keys(CAT).filter(k=>k!=="tip").map(k=>`<button class="chip pick${LF.ex[k]?"":" on"}" style="--c:${CATC[k]}" data-fx="${k}">${ic(CI[k])} ${CAT[k][0]}</button>`).join("")+`</div></div>`;
  if(LF.tab==="collect"){const anyK=Object.values(LF.kt).some(v=>v===1);h+=`<div class="fsec"><b>סוגי אספנות</b><small class="dim" style="display:block;margin:-2px 0 6px">${anyK?"מוצגים רק הסוגים הצבועים":"מוצג הכל – בחר סוג כדי לראות רק אותו"}</small><div class="chips wrap">`+Object.keys(D.KT).map(k=>`<button class="chip pick${LF.kt[k]===1?" on":""}" style="--c:#ffc23c" data-fk="${k}">${ic(KTI[k]||"sparkles")} ${esc(D.KT[k][0])}</button>`).join("")+`</div></div>`}
  h+=`<div class="fact"><button class="btn" data-rm="all">נקה הכל</button><button class="btn pri" id="fdone">הצג ${IT.filter(passes).length} תוצאות</button></div>`;
  const sc=$("#sheet").classList.contains("on")?$("#sheet").scrollTop:0;
  openSheet(h);$("#sheet").scrollTop=sc;
  const re=()=>{Store.setS("lists2",LF);filterSheet();route(true)};
  $$("[data-fc]").forEach(b=>b.onclick=()=>{LF.ch=+b.dataset.fc;re()});
  $$("[data-fso]").forEach(b=>b.onclick=()=>{LF.sort=b.dataset.fso;re()});
  $$("[data-fs]").forEach(b=>b.onclick=()=>{LF.stat=b.dataset.fs;re()});
  $$("[data-fa]").forEach(b=>b.onclick=()=>{LF.avail=LF.avail?"":"now";re()});
  $$("[data-fm]").forEach(b=>b.onclick=()=>{LF.miss=LF.miss?0:1;re()});
  $$("[data-fx]").forEach(b=>b.onclick=()=>{const k=b.dataset.fx;LF.ex[k]=!LF.ex[k];if(!LF.ex[k])delete LF.ex[k];re()});
  $$("[data-fk]").forEach(b=>b.onclick=()=>{const k=b.dataset.fk;if(LF.kt[k]===1)delete LF.kt[k];else LF.kt[k]=1;re()});
  $("#fdone").onclick=closeSheet;const w2=$("#fwh2");if(w2)w2.onclick=()=>whereSheet();
  bindRm();
}
function bindRm(){$$("[data-rm]").forEach(b=>b.onclick=()=>{const r=b.dataset.rm;
  if(r==="all"){LF.ch=0;LF.stat="";LF.avail="";LF.miss=0;LF.ex={};LF.kt={};LF.q=""}
  else if(r==="stat")LF.stat="";else if(r==="miss")LF.miss=0;else if(r.startsWith("ex:"))LF.ex[r.slice(3)]=false;else if(r.startsWith("kt:"))delete LF.kt[r.slice(3)];
  Store.setS("lists2",LF);if($("#sheet").classList.contains("on"))filterSheet();route(true)})}
/* ---------- ask a question in the guides hub: finds the guide section that answers it ---------- */
const QSTOP=new Set(["איך","מה","למה","איפה","מתי","כמה","האם","אפשר","אני","צריך","לעשות","עושים","יכול","יכולים","רוצה","שלי","שלו","לי","לו","אם","כדי","דרך","משהו","יותר","בכלל","נכון","מישהו","זה","זו","זאת","הזה","הזאת","ככה","הכי","מתי","בבקשה","כדאי","למצוא","מוצאים","מוצא","להגיע","מגיעים","לקבל","מקבלים","עובד","עובדים","צריכים","שווה","בעצם","find","how","what","where","why","when","can","i","do","does","to","get","is","are","my"].map(norm));
const ASKSYN=[["לברוח","בורחים","בורח","בריחה","להתחמק","להיפטר","להיעלמ","להעלמ","לאבד","escape","lose","evade"],["משטרה","שוטרים","שוטר","מבוקש","מבוקשים","כוכבים","כוכב","police","cops","wanted","stars","heat"],["לגנוב","גונבים","גונב","גניבה","לגנוב רכב","steal","stealing","theft"],["לשמור","שומרים","שומר","שמירה","לשמירה","save","saving","keep"],["לרשום","רושמים","רישום","להירשמ","register","registration"],["להרויח","מרויחים","להשיג","להרוויח","earn","make","farm"],["טרקר","טראקר","מעקב","tracker"],["סמל","סמלים","אייקון","אייקונים","סימנ","סימנים","icon","icons","marker"],["פוקוס","focus"],["טלפונ","phone","אפליקציה","אפליקציות","app","apps"],["להפקיד","הפקדה","מפקידים","deposit"],["כספומט","כספומטים","atm","atms"],["לפספס","פספוס","מפספסים","פוספס","missable","miss","missed"],["אל חזור","נקודת אל חזור","ponr","point of no return"],["רכב","רכבים","מכונית","מכוניות","אוטו","car","cars","vehicle"],["מוסכ","חניה","garage","parking"],["בגדים","בגד","להחליפ בגדים","clothes","outfit"],["נשק","נשקים","רובה","אקדח","weapon","gun"],["כפתור","כפתורים","לחיצה","ללחוצ","שליטה","button","buttons","controls"],["ציט","ציטים","קוד","קודים","cheat","cheats","code"],["כסף","מזומן","money","cash","buckme"],["ירי","לירות","יורים","כיוונ","לכוונ","פגיעה","פגעתי","איקס","צהוב","אדום","shoot","shooting","aim","hit","hitmarker","marker"],["פרופיל","פרופיל פלילי","מוניטין","criminal profile","profile","professional","psycho","פסיכו","מקצוען"],["מדד","מדדים","כוח","חיים","בריאות","סיבולת","ריצה","כושר","אימונ","חדר כושר","stats","strength","health","cardio","stamina","fitness","gym"],["טלפונ","פלאפונ","אפליקציה","אפליקציות","phone","app","apps","whatup","snapmatic","waink","ווינק"]].map(a=>a.map(norm));
ASKSYN.forEach(g=>g.forEach(w=>{(SYN[w]=SYN[w]||new Set());g.forEach(v=>v!==w&&SYN[w].add(v))}));
let GSEC=null,GSEC_K="";
function guideSections(){
  const k=curCh()+"|"+S.spoil;if(GSEC&&GSEC_K===k)return GSEC;GSEC_K=k;GSEC=[];
  (window.GUIDES||[]).forEach(g=>{
    const t=document.createElement("template");t.innerHTML=g.h;
    if(S.spoil)t.content.querySelectorAll("[data-ch]").forEach(e=>{if(+e.dataset.ch>curCh())e.remove()});
    let cur={g,i:-1,title:g.t,html:"",txt:""};const push=()=>{if(cur.html.trim())GSEC.push(cur)};
    let n=0;[...t.content.childNodes].forEach(nd=>{
      if(nd.nodeName==="H2"){push();cur={g,i:n++,title:nd.textContent.trim(),html:"",txt:""};return}
      cur.html+=nd.outerHTML||nd.textContent||"";cur.txt+=" "+(nd.textContent||"")});
    push();
  });
  GSEC.forEach(s=>{s.f=[[norm(s.g.t+" "+s.g.d),6],[norm(s.title),8],[norm(s.txt),2]]});
  return GSEC;
}
function askTerms(q){const n=norm(q).split(" ").filter(w=>w&&!QSTOP.has(w)&&!(w.length>3&&QSTOP.has(w.slice(1))));return n.length?qTerms(n.join(" ")):qTerms(q)}
let AQ="";
function askHtml(){
  const q=AQ.trim();
  if(norm(q).length<3)return "";
  const terms=askTerms(q);
  const how=/^(איך|how)\b/i.test(norm(q))||/איכ /.test(norm(q)+" ");
  const secs=guideSections().map(s=>{let v=scoreF(s.f,terms,1);if(v&&s.i<0&&how)v-=5;return [v,s]}).filter(a=>a[0]).sort((a,b)=>b[0]-a[0]);
  const tipS=tipList(999).map(t=>[scoreF([[norm(t.t+" "+(t.x||"")),4]],terms,1),t]).filter(a=>a[0]).sort((a,b)=>b[0]-a[0]);let tips=tipS.map(a=>a[1]);
  const R=searchAll(terms.map(a=>a[0]).join(" "));
  let h="";
  const gFull=secs.length&&secs[0][0]>=1000,isCheatQ=terms.some(a=>a.includes("ציט")||a.includes("cheat"));
  const top=R.items[0];let itemFirst=false;
  if(!gFull&&isCheatQ&&R.cheats.length){const c=R.cheats.shift(),AR={Up:"↑",Down:"↓",Left:"←",Right:"→"};
    h+=`<div class="answer"><div class="ah">${ic("joystick")}<span><b>${bdi(c.n)}</b><small>צ'יט${c.cat?", "+esc(c.cat):""}</small></span></div><div class="gbody">${c.code&&c.code.length?`<p class="ltr code">${c.code.map(k=>AR[k]||k).join(" ")}</p>`:`<p>הקוד עוד לא ידוע – נעדכן ברגע שיתגלה.</p>`}${c.u?`<p><b>איך פותחים:</b> ${esc(c.u)}</p>`:""}</div><a class="btn sm" href="#/cheats">לכל הצ'יטים ${ic("chevron-left")}</a></div>`;itemFirst=true}
  else if(!gFull&&tipS.length&&tipS[0][0]>=1000&&!(top&&R.full>0&&/\d|[A-Z]/.test(""))){const t=tips.shift();
    h+=`<div class="answer"><div class="ah">${ic(t.k==="btn"?"gamepad-2":"lightbulb")}<span><b>${esc(t.t.split(/[:–]/)[0].slice(0,60))}</b><small>${t.k==="btn"?"כפתור סודי":"טיפ"}</small></span></div><div class="gbody"><p>${esc(t.t)}</p>${t.x?`<p>${esc(t.x)}</p>`:""}</div><a class="btn sm" href="#/${t.k==="btn"?"buttons":"tips"}">לכל ה${t.k==="btn"?"כפתורים":"טיפים"} ${ic("chevron-left")}</a></div>`;itemFirst=true}
  else itemFirst=top&&R.full>0&&!gFull;
  if(h);else if(itemFirst){const x=top,hd=hid(x)||howHid(x);
    h+=`<div class="answer"><div class="ah">${ic(CI[mainCat(x)]||"sparkles")}<span><b>${bdi(title(x))}</b><small>${esc(sub(x))}</small></span></div><div class="gbody">${hd?`<p>${ic("lock")} ${hid(x)?"התוכן מוסתר כי זה מפרק שעוד לא הגעת אליו.":"הפירוט מוסתר לפי ההגדרה שלך – פתח את הדף המלא כדי לראות."}</p>`:`${x.why||x.d?`<p>${esc(x.why||x.d)}</p>`:""}${x.sp?`<p><b>איפה:</b> ${esc(x.sp)}</p>`:""}${(x.steps||[]).length?`<ol class="steps">${x.steps.slice(0,5).map(t=>`<li>${esc(t)}</li>`).join("")}</ol>`:""}`}</div><a class="btn sm" href="#/i/${x.s}">לדף המלא ${ic("chevron-left")}</a></div>`;
    R.items.shift()}
  else if(secs.length){const s=secs[0][1];
    h+=`<div class="answer"><div class="ah">${ic(GI[s.g.id]||"book-open")}<span><b>${esc(s.i<0?s.g.t:s.title)}</b><small>מתוך המדריך "${esc(s.g.t)}"</small></span></div><div class="gbody">${s.html}</div><a class="btn sm" href="#/g/${s.g.id}${s.i>=0?"?s="+s.i:""}">למדריך המלא ${ic("chevron-left")}</a></div>`}
  if(tips.length)h+=`<div class="grp">טיפים שקשורים לזה</div>`+tips.slice(0,3).map(tipHtml).join("");
  const more=secs.slice(1).filter(a=>a[1].g!==(secs[0]&&secs[0][1].g)||a[0]>=1000).slice(0,4);
  if(more.length)h+=`<div class="grp">עוד במדריכים</div>`+`<div class="group">`+more.map(([,s])=>`<a class="row" href="#/g/${s.g.id}${s.i>=0?"?s="+s.i:""}"><span class="gl coll" style="--c:var(--p-aqua)">${ic(GI[s.g.id]||"book-open")}</span><div class="t"><b>${esc(s.title)}</b><small>${esc(s.g.t)}</small></div></a>`).join("")+`</div>`;
  if(R.cheats.length)h+=`<div class="grp">צ'יטים</div>`+`<div class="group">`+R.cheats.slice(0,3).map(c=>`<a class="row" href="#/cheats"><span class="gl coll" style="--c:var(--p-flamingo)">${ic("joystick")}</span><div class="t"><b>${bdi(c.n)}</b><small>${esc(c.cat||"")}</small></div></a>`).join("")+`</div>`;
  if(R.items.length)h+=`<div class="grp">משימות ודברים</div>`+`<div class="group">`+R.items.slice(0,3).map(x=>row(x)).join("")+`</div>`;
  if(!secs.length&&!tips.length&&!R.items.length&&!itemFirst&&!R.cheats.length)h+=`<div class="empty">עוד אין לנו תשובה לזה.<br><small>שלח לנו את השאלה – נוסיף מדריך או טיפ בעדכון הקרוב.</small><br><button class="btn sm pri" id="asksend" style="margin-top:10px">שלח את השאלה</button></div>`;
  else h+=`<button class="linkb askmiss" id="asksend">לא מצאת מה שחיפשת? שלח לנו את השאלה</button>`;
  return h;
}
const GI={"map-icons":"map-pinned","steal-cars":"key-round","keep-cars":"square-parking",police:"siren",money:"banknote",saves:"save",phone:"smartphone",stats:"flame",profile:"drama",shooting:"crosshair","how-site":"circle-help"};
function bindAsk(){
  const i=$("#aq");if(!i)return;
  const draw=()=>{$("#ares").innerHTML=deco(askHtml());$(".glists").classList.toggle("dimmed",norm(AQ).length>=3);bindAres()};
  i.oninput=()=>{AQ=i.value;clearTimeout(i._t);i._t=setTimeout(draw,220)};
  i.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();i.blur()}};
  bindAres();
}
function bindAres(){
  $$("[data-ask]").forEach(b=>b.onclick=()=>{AQ=b.dataset.ask;$("#aq").value=AQ;$("#ares").innerHTML=deco(askHtml());$(".glists").classList.add("dimmed");bindAres()});
  const s=$("#asksend");if(s)s.onclick=()=>{const q=AQ.trim();if(!q)return;
    window.open(`https://github.com/NaorLevy27/Leo/issues/new?labels=question&title=${encodeURIComponent("שאלה: "+q.slice(0,80))}&body=${encodeURIComponent("שאלה מהמרכז באפליקציה:\n\n"+q+"\n\nפרק: "+curCh())}`,"_blank");toast("תודה! נענה בעדכון הקרוב")};
}

function bindList(){
  const save=()=>{Store.setS("lists2",LF);route(true)};
  $$("[data-tab]").forEach(b=>b.onclick=()=>{LF.tab=b.dataset.tab;LF.kt={};save()});
  $("#fopen").onclick=filterSheet;
  const fsb=$("#fsortb");if(fsb)fsb.onclick=()=>window.sortSheet();
  window.sortSheet=()=>{const M=[["chrono","📖 לפי הסדר","כמו במשחק – פרק אחרי פרק, ומה שנפתח אחרי כל משימה"],["near","🧭 הכי קרוב","מסלול מהמשימה הבאה – כל תחנה הכי קרובה לקודמת"],["soon","⏳ מה נגמר קודם","מה שעלול להיעלם – למעלה"],["type","🗂 לפי סוג","קלפים, רכבים, נשקים…"]];openSheet(`<h3 style="font-size:19px;margin:0 0 10px">איך לסדר?</h3>`+M.map(m=>`<button class="row" style="width:100%;text-align:start" data-so="${m[0]}"><div class="t"><b>${m[1]}</b><small>${m[2]}</small></div>${(LF.sort||"chrono")===m[0]?"✓":""}</button>`).join(""));$$("[data-so]").forEach(b=>b.onclick=()=>{LF.sort=b.dataset.so;closeSheet();save()})};
  if(false)$("#fch").onclick=()=>{openSheet(`<h3 style="font-size:19px;margin:0 0 10px">איזה פרק?</h3>`+[0,1,2,3,4,5].map(c=>`<button class="row" style="width:100%" data-pc="${c}"><div class="t"><b>${c?"פרק "+c:"כל הפרקים"}</b>${c===curCh()?`<small>אתה כאן</small>`:""}</div>${LF.ch===c?"✓":""}</button>`).join(""));$$("[data-pc]").forEach(b=>b.onclick=()=>{LF.ch=+b.dataset.pc;closeSheet();save()})};
  $$("[data-tog]").forEach(b=>b.onclick=()=>{const c=/^t/.test(b.dataset.tog)?b.dataset.tog:+b.dataset.tog;const cur=b.parentElement.classList.contains("open");LF.open[c]=!cur;save()});
  bindRm();
  const qx=$("#qx");if(qx)qx.onclick=()=>{LF.q="";save()};
  const q=$("#q");if(q){q.oninput=()=>{LF.q=q.value;clearTimeout(q._t);q._t=setTimeout(()=>{Store.setS("lists2",LF);const p=q.selectionStart;route(true);const n=$("#q");n.focus();n.setSelectionRange(p,p)},250)}}
}

/* item page */
function vehText(x){
  const a=[];
  if(x.k)a.push(`<p><b>${esc(x.k)}</b></p>`);
  if(x.c===1)a.push(S.spoil&&curCh()<2?`<p>בפרק 1 עוד אי אפשר לשמור רכבים – כל רכב גנוב הוא זמני. תזכור את המקום: בהמשך המשחק תיפתח דרך לשמור, ואז נראה לך כאן איך.</p>`:`<p>בפרק 1 עוד אי אפשר לשמור רכבים – כל רכב גנוב הוא זמני. תזכור את המקום ותחזור אחרי המשימה <b>Moses</b> בפרק 2.</p>`);
  else if(x.c===2&&!(S.spoil&&curCh()<2))a.push(`<p>סרוק את הרכב באפליקציית <b>WAiNK</b>:<br>⚪ בלי טרקר → המוסך של <b>Moses</b> ב־Port Gellhorn (צביעה ואז Register).<br>🟡 טרקר רגיל → אפשר רק מפרק 3, ב־Pay 'n' Spray.<br>🔴 טרקר מתקדם → אי אפשר לשמור.</p>`);
  else if(!(S.spoil&&curCh()<x.c))a.push(`<p>סרוק באפליקציית <b>WAiNK</b>:<br>⚪ בלי טרקר / 🟡 טרקר רגיל → כל <b>Pay 'n' Spray</b> (צביעה ואז Register). מחיר הרישום מופיע בסריקה.<br>🔴 טרקר מתקדם → רק דרך הרשימה של Randy.</p>`);
  if(!a.length||(a.length===1&&x.k))a.push(`<p>איך שומרים רכב נפתח בהמשך המשחק – כשתגיע לשם, נסביר כאן בדיוק מה לעשות.</p>`);
  if(!(S.spoil&&curCh()<2))a.push(`<p class="muted" style="margin:0">אחרי הרישום – החנה במוסך (נפתח ב־Daily Driver). רכב לא רשום נעלם בסוף, גם במוסך. <a href="#/g/keep-cars">המדריך המלא ›</a></p>`);
  return a.join("");
}
function ytId(u){const m=String(u).match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/);return m&&m[1]}
function related(x){
  const r=[],seen=new Set([x.id]);
  const add=(lab,arr)=>{arr=arr.filter(y=>!seen.has(y.id)&&!y.tip).slice(0,6);arr.forEach(y=>seen.add(y.id));if(arr.length)r.push(`<div class="grp">${lab}</div>`+arr.map(row).join(""))};
  if(x.story){const i=STORY.indexOf(x);add("לפני ואחרי בסיפור",[STORY[i-1],STORY[i+1]].filter(Boolean))}
  add("נפתח אחרי אותה משימה",IT.filter(y=>x.af&&y.af===x.af));
  add("נפתח אחרי המשימה הזאת",IT.filter(y=>y.af===x.ne||y.in===x.ne));
  add("באותו מקום",IT.filter(y=>y.p&&y.p===x.p));
  return r.join("");
}
function statusPill(x){const av=avail(x);
  if(av==="missed")return `<span class="tag gone">❌ פוספס</span>`;if(av==="done")return `<span class="tag ok">✓ עשיתי</span>`;
  if(x.ponr)return `<span class="tag ponr">⚠ אל־חזור</span>`;if(timed(x))return `<span class="tag soon">⏳ עלול להיגמר בקרוב</span>`;
  if(missable(x)){const u=untilName(x);return `<span class="tag miss">❗ אפשר לפספס${u?` · עד ${bdi(u)}`:""}</span>`}
  if(av==="later"&&!x.story){const r=ref(x.af);return `<span class="tag">🔒 אחרי ${r?bdi(title(r)):bdi(x.af)}</span>`}
  return forever(x)?`<span class="tag ok">♾ אפשר גם בהמשך</span>`:"";}
const fold=(e,t,inner,id)=>`<details class="fold"${id?` id="${id}"`:""}><summary><span class="e">${e}</span>${t}<span class="chev">⌄</span></summary><div class="fin">${inner}</div></details>`;
function pageItem(slug){
  const x=BYS[slug];if(!x)return `<div class="empty">לא נמצא</div>`;
  const c=mainCat(x);
  let h=`<div class="ihead">${glyph(x)}<div class="imeta">${CAT[c]?CAT[c][0]:""} · פרק ${x.c}${x.w&&WHO[x.w]?` · ${WHO[x.w]}`:""}</div>
  ${locked(x)&&!REV.has(x.id)?`<h1>${esc(title(x))}</h1>`:`<h1>${bdi(x.n)}</h1>`}<div class="ipill">${statusPill(x)}</div>
  <div class="irow">${S.casual?"":`<button class="bigchk${done(x)?" on":""}" data-chk="${esc(x.id)}">${ic(done(x)?"circle-check":"check")} ${done(x)?"עשיתי את זה":"סמן שעשיתי"}</button>`}<button class="btn ishare" data-share="${esc(x.s)}" aria-label="שתף">${ic("share-2")}</button></div></div>`;
  if(hid(x)){
    h+=`<div class="blk lockbox"><div style="font-size:38px">🙈</div><h3 style="justify-content:center">התוכן מוסתר כדי לא לספיילר</h3><p class="muted">זה מפרק ${x.c}${x.c>curCh()?` – ואתה עכשיו בפרק ${curCh()}`:""}. אתה מחליט מה לראות:</p>
    <div class="lockbtns">${!REV.has(x.id)?`<button class="btn" id="unspoil">👁 הצג רק את השם</button>`:""}<button class="btn pri" id="uncontent">📖 הצג מה עושים</button></div></div>`;
    return h;
  }
  /* layer 1: what to do + what you get + navigate */
  const rw=x.rw||x.why;
  let main="";
  const intro=[];
  if(x.d&&x.steps&&x.steps.length)intro.push(esc(x.d));
  if(x.src==="guide"&&x.sp)intro.push(`איפה מתחילים: ${esc(x.sp)}.`);
  else if(x.loc&&x.steps)intro.push(`מתחילים ב־${bdi(x.loc.slice(-2).join(", "))}${x.sp?` – ${esc(x.sp)}`:""}.`);
  if(x.w&&WHO[x.w]&&x.w!=="B")intro.push(`משחקים בתור ${WHO[x.w]}.`);
  if(intro.length)main+=`<p class="intro">${intro.join(" ")}</p>`;
  if(x.steps&&x.steps.length)main+=`<ol class="steps">${x.steps.map(s=>`<li><span>${esc(s)}</span></li>`).join("")}</ol>`;
  else if(x.d)main+=`<p style="font-size:15.5px">${esc(x.d)}</p>`;
  else if(x.sp)main+=`<p style="font-size:15.5px">${esc(x.sp)}</p>`;
  if(rw)main+=`<div class="getline"><span>🎁</span><b>${esc(rw)}</b></div>`;
  if(x.tips&&x.tips.length)main+=`<div class="tipline"><span>💡</span><span>${esc(x.tips[0])}</span></div>`;
  if(x.src==="kg")main+=`<p class="dim" style="font-size:12px;margin:8px 0 0">זה תקציר – מדריך מלא שלב־אחרי־שלב למשימה הזאת יתווסף בקרוב.</p>`;
  if(howHid(x))main=`<div class="howcover"><p>הפירוט מוסתר, כדי לא להרוס לך את המשימה.</p><button class="btn pri" id="showhow">הצג מה עושים</button></div>`;
  h+=`<div class="blk primary"><h3><span class="e">🎯</span>מה עושים</h3>${main||`<p class="muted">עוד אין פירוט – יש לך טיפ? כתוב בתגובות.</p>`}${x.x!=null?"":`<p class="anyw">🌍 אין לזה נקודה קבועה – ${x.g.includes("event")?"זה יכול לקרות בכל מקום במפה, תוך כדי נסיעה":"זה פזור בכמה מקומות במפה"}.</p>`}</div>`;
  /* layer 2: details on demand */
  if(x.loc||x.sp||x.x!=null){let w="";
    if(x.x!=null)w+=`<p style="margin:0 0 6px">${x.ex?`<span class="tag ex">📍 מדויק</span>`:`<span class="tag ap">≈ אזור משוער</span>`}</p>`;
    if(x.loc)w+=`<div class="path">${x.loc.map(p=>`<span>${bdi(p)}</span>`).join("")}${x.st?`<span>${bdi(x.st)}</span>`:""}</div>`;
    if(x.sp&&(x.steps||x.d))w+=`<p>${esc(x.sp)}</p>`;if(x.lk)w+=`<p class="muted">👀 איך זה נראה: ${esc(x.lk)}</p>`;
    if(x.x!=null)w+=`<div class="minimap" id="mini"></div><a class="btn pri wide" style="margin-top:10px" href="#/map?i=${x.s}">🗺️ פתח במפה הגדולה – בדיוק כאן</a><button class="btn wide rtb${inRoute(x.id)?" on":""}" style="margin-top:8px" data-rt="${esc(x.id)}">${rtLabel(x.id)}</button>`;
    h+=fold("📍","איפה בדיוק",w,"fwhere").replace("<details class=\"fold\" id=\"fwhere\">","<details class=\"fold\" id=\"fwhere\" open>");}
  const wh=[];
  if(x.af)wh.push(["נפתח אחרי",x.af]);if(x.in)wh.push(["במהלך",x.in]);if(x.prev)wh.push(["משימה קודמת",x.prev]);
  if(x.bf)wh.push(["נעלם אחרי",x.bf]);if(x.dl&&x.dl!==x.bf)wh.push(["תעשה לפני",x.dl]);if(x.lim)wh.push(["אחרון אפשרי",x.lim]);
  const linkM=n=>{const y=IT.find(z=>z.ne===n);return y?`<a href="#/i/${y.s}">${bdi(title(y))}</a>`:bdi(n)};
  let wn="";const av=avail(x);
  if(x.ponr)wn+=`<p>⚠ <b>נקודת אל־חזור</b> – שמור לפני, ותסיים קודם את מה שמסומן ⏳ בפרק.</p>`;
  if(av==="missed")wn+=`<p>❌ החלון נסגר כשסיימת את <bdi>${esc((ref(x.bf)||ref(x.dl)||ref(x.lim)||{}).n||"")}</bdi>. עשית בכל זאת? סמן ✓.</p>`;
  if(timed(x)&&av!=="missed")wn+=`<p>⏳ <b>הצעה עם זמן מוגבל</b> – כדאי לעשות עכשיו.</p>`;
  else if(missable(x)&&av!=="missed"){const u=untilName(x);wn+=`<p>❗ ${u?`נעלם אחרי <bdi>${esc(u)}</bdi> – יש זמן עד אז.`:"אם לא עושים בזמן – נעלם לתמיד."}</p>`}
  else if(forever(x))wn+=`<p>♾ לא צריך למהר – אפשר גם בהמשך.</p>`;
  if(wh.length)wn+=`<dl class="kv">${wh.map(([a,b])=>`<dt>${a}</dt><dd>${linkM(b)}</dd>`).join("")}</dl>`;
  if(x.wn)wn+=`<p class="muted" style="margin-top:6px">${esc(Array.isArray(x.wn)?x.wn[0]:x.wn)}</p>`;
  if(x.story&&!done(x)&&!S.casual)wn+=`<button class="linkb" data-upto="${esc(x.id)}" style="margin-top:6px">סיימתי גם את כל מה שלפני</button>`;
  if(wn)h+=fold("🕒","מתי לעשות",wn);
  let tp="";if(x.tips&&x.tips.length)tp+=`<ul class="tips">${x.tips.map(t=>`<li>${esc(t)}</li>`).join("")}</ul>`;if(x.ch)tp+=`<p>🔀 ${esc(x.ch)}</p>`;
  if(x.nt&&x.nt!==rw)tp+=`<p class="muted">${esc(x.nt)}</p>`;
  if(tp&&!howHid(x))h+=fold("💡","טיפים ובחירות",tp);
  if(x.veh)h+=fold("🅿️","איך שומרים את הרכב",vehText(x));
  const vids=(x.v||[]).map(ytId).filter(Boolean);
  if(vids.length||x.q){let v=vids.map(id=>`<div class="vid"><div class="ph" data-id="${id}" style="background-image:url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)">▶</div></div>`).join("");
    if(x.q)v+=`<a class="btn sm" style="margin-top:8px" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent("GTA 6 "+x.q)}">חפש עוד סרטונים ב־YouTube</a>`;h+=fold("▶","סרטון",v)}
  const rel=related(x);if(rel)h+=fold("🔗","קשור",`<div class="rel">${rel}</div>`);
  h+=fold("💬","תגובות וטיפים מהקהילה",commentsBlock("i:"+x.id).replace('<div class="blk" id="cmts"','<div id="cmts"').replace(/<h3>.*?<\/h3>/,""));
  return h;
}
function pageLoc(id){
  const l=LBY[id];if(!l)return `<div class="empty">לא נמצא</div>`;const k=KINDS[l.k]||{};const key="L:"+l.id;
  let h=`<div class="ihead"><div class="meta"><span class="edot" style="background:${k.c}">${""}</span><span class="tag">${esc(k.i||"")} ${esc(k.n||l.k)}</span>${l.a?`<span class="tag">${bdi(l.a)}</span>`:""}<span class="tag ex">📍 מדויק</span></div><h1>${bdi(l.n)}</h1>${l.t?`<div class="en ltr">${esc(l.t)}</div>`:""}
  <button class="bigchk${Store.done(key)?" on":""}" data-lchk="${esc(l.id)}">${Store.done(key)?"✓ מצאתי":"סמן שמצאתי ✓"}</button></div>`;
  if(l.d)h+=`<div class="blk"><h3><span class="e">📝</span>תיאור (באנגלית)</h3><p class="ltr" style="text-align:left">${esc(l.d)}</p></div>`;
  const mine=IT.filter(x=>x.lid===l.id);
  if(mine.length)h+=`<div class="blk"><h3><span class="e">🔗</span>אצלנו ברשימה</h3>${mine.map(row).join("")}</div>`;
  h+=`<div class="blk"><h3><span class="e">📍</span>על המפה</h3><div class="minimap" id="mini"></div><a class="btn sm" style="margin-top:8px" href="#/map?l=${encodeURIComponent(l.id)}">פתח במפה הגדולה ›</a></div>`;
  h+=commentsBlock(key);
  return h;
}

/* comments */
function commentsBlock(key){return `<div class="blk" id="cmts" data-key="${esc(key)}"><h3><span class="e">💬</span>תגובות וטיפים מהקהילה</h3><div id="cmlist" class="dim">טוען…</div></div>`}
async function loadComments(){
  const box=$("#cmts");if(!box)return;const key=box.dataset.key,L=$("#cmlist");
  if(!Cloud.on){const w=L.closest(".blk,.fold,details");if(w)w.remove();else L.remove();return}
  let list=[];try{list=await Cloud.comments(key)}catch(e){L.innerHTML=`<p class="muted">לא הצלחתי לטעון תגובות.</p>`;return}
  const mv=await Cloud.myVotes(list.map(c=>c.id));
  const kids=p=>list.filter(c=>(c.parent_id||null)===p).sort((a,b)=>p?0:(b.score-a.score)||(a.created_at<b.created_at?1:-1));
  const one=c=>`<div class="cm" data-id="${c.id}"><div class="who"><span class="av">${esc((c.name||"?")[0])}</span>${bdi(c.name||"שחקן")}<span class="dim" style="font-weight:500">${new Date(c.created_at).toLocaleDateString("he-IL")}</span></div><div class="body">${esc(c.body)}</div><div class="acts"><button data-vote="${c.id}" class="${mv[c.id]===1?"on":""}">👍 ${c.score||0}</button>${c.parent_id?"":`<button data-reply="${c.id}">השב</button>`}${Cloud.user&&c.user_id===Cloud.user.id?`<button data-del="${c.id}">מחק</button>`:`<button data-rep="${c.id}">דווח</button>`}</div>${kids(c.id).length?`<div class="kids">${kids(c.id).map(one).join("")}</div>`:""}</div>`;
  let h=kids(null).map(one).join("")||`<p class="muted" style="margin:0 0 8px">עוד אין תגובות. תהיה הראשון לתת טיפ!</p>`;
  h+=Cloud.user?`<div style="margin-top:10px"><textarea class="in" id="cmin" maxlength="1500" placeholder="טיפ, שאלה או מה שגילית…"></textarea><input type="hidden" id="cmpar"><div style="display:flex;gap:8px;margin-top:8px;align-items:center"><span id="cmrep" class="dim" style="font-size:12px;flex:1"></span><button class="btn pri sm" id="cmsend">פרסם</button></div></div>`:`<a class="btn wide" href="#/settings" style="margin-top:10px">התחבר כדי להגיב</a>`;
  L.className="";L.innerHTML=h;
  $$("[data-vote]").forEach(b=>b.onclick=async()=>{if(!Cloud.user)return toast("צריך להתחבר");const id=b.dataset.vote;await Cloud.vote(id,mv[id]===1?0:1);loadComments()});
  $$("[data-reply]").forEach(b=>b.onclick=()=>{$("#cmpar").value=b.dataset.reply;$("#cmrep").textContent="משיב לתגובה · ";$("#cmin").focus()});
  $$("[data-del]").forEach(b=>b.onclick=async()=>{if(confirm("למחוק את התגובה?")){await Cloud.del(b.dataset.del);loadComments()}});
  $$("[data-rep]").forEach(b=>b.onclick=async()=>{if(!Cloud.user)return toast("צריך להתחבר");const r=prompt("מה הבעיה בתגובה?");if(r){await Cloud.report(b.dataset.rep,r);toast("תודה, נבדוק")}});
  const s=$("#cmsend");if(s)s.onclick=async()=>{const t=$("#cmin").value.trim();if(t.length<2)return;s.disabled=true;const r=await Cloud.post(key,t,$("#cmpar").value||null);s.disabled=false;if(r.error)toast("שגיאה בשליחה");else{toast("פורסם ✓");loadComments()}};
}


/* ---------- cheats ---------- */
const CH=EX.cheats||{list:[]};if(window.LANG==="en")CH.list.forEach(c=>{c.n=c.ne});
const ARW={Up:"⬆",Down:"⬇",Left:"⬅",Right:"➡"};
function pageCheats(){
  const known=CH.list.filter(c=>c.code.length).length;
  let h=`<div class="ihead"><div class="kick">צ'יטים · ${known} קודים ידועים מתוך ${CH.list.length}</div><h1 style="margin-top:4px">🕹️ כל הצ'יטים</h1></div>
  <div class="blk"><h3><span class="e">⌨️</span>איך מקלידים צ'יט</h3><ol class="steps"><li><span>קודם: הצ'יטים עובדים רק <b>אחרי שמסיימים את הסיפור</b>, ורובם צריכים גם אתגר משלהם כדי להיפתח.</span></li><li><span>⬆ בחצים פותח את הטלפון.</span></li><li><span>מחזיקים L1 (Xbox: LB) ולוחצים R1 (Xbox: RB).</span></li><li><span>מקלידים את הקוד בחצים – אותו דבר ב־PS5 וב־Xbox.</span></li></ol></div>
  <div class="blk warn"><h3><span class="e">⚠</span>חשוב לפני</h3><p style="margin:0">צ'יט מכבה <b>גביעים/הישגים ושמירה</b> לכל אותה סשן. שמור לפני, ותתחיל סשן חדש כשרוצים לשחק "באמת".</p></div>
  <div class="chips" style="margin-top:12px"><button class="chip on" data-cc="">הכל</button>${[...new Set(CH.list.map(c=>c.cat))].map(c=>`<button class="chip" data-cc="${esc(c)}">${esc(c)}</button>`).join("")}<button class="chip" data-cc="__k">רק עם קוד</button></div><div id="chl"></div>
  <p class="dim" style="font-size:12px;margin-top:12px">הקודים נאספו משחקנים שסיימו את המשחק ומתעדכנים כל יום. קודים שעוד לא גילו מסומנים "עוד לא התגלה".</p>`;
  return h;
}
function drawCheats(f){
  const L2=CH.list.filter(c=>!f||(f==="__k"?c.code.length:c.cat===f));
  $("#chl").innerHTML=L2.map((c,i)=>`<div class="cheat"><div class="ct"><b>${esc(c.n)}</b>${c.n!==c.ne?`<span class="dim ltr">${esc(c.ne)}</span>`:""}<small>🔓 ${esc(c.u)}</small></div>${c.code.length?`<div class="code" dir="ltr">${c.code.map(k=>`<i>${ARW[k]||esc(k)}</i>`).join("")}</div><button class="btn sm" data-cpy="${esc(c.code.join(", "))}">העתק</button>`:`<div class="code none">עוד לא התגלה</div>`}</div>`).join("");
  $$("[data-cpy]").forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(b.dataset.cpy);toast("הקוד הועתק")}catch(e){}});
}

/* guides */
const gcard=g=>`<a class="gcard" href="#/g/${g.id}"><span class="e">${g.e}</span><div><b>${esc(g.t)}</b><small>${esc(g.d)}</small></div></a>`;
function tipList(n){const cur=curCh();return TIPS2.filter(t=>!(S.spoil&&(t.c||1)>cur)).slice(0,n)}
const tipHtml=t=>`<div class="tip${t.k==="btn"?" btn":""}"><span class="e">${t.k==="btn"?"🎮":"💡"}</span><div><b>${esc(t.t)}</b>${t.x?`<small>${esc(t.x)}</small>`:""}</div>${t.new||(t.d>"2026-11-22"&&Date.now()-Date.parse(t.d)<3*864e5)?`<span class="tag ex">חדש</span>`:""}</div>`;
/* hub: one colorful tile per small topic */
const HUB=[
 ["#/news","sparkles","מה חדש","התגליות האחרונות","#5a5bc0","t"],
 ["#/buttons","gamepad-2","כפתורים סודיים","מה שהמשחק לא מספר","#8a6cc0","t"],
 ["#/cheats","joystick","צ'יטים","כל הקודים","#b076bf","t"],
 ["#/tips","lightbulb","טיפים","מתעדכן כל יום","#d06aa0","t"],
 ["#/g/police","siren","בריחה מהמשטרה","כוכבים ועקבות","#e7849a"],
 ["#/g/steal-cars","key-round","גניבת רכב","טרקר או בלי","#ee9a86"],
 ["#/g/keep-cars","square-parking","לשמור רכב","רישום ומוסך","#f2ae8c"],
 ["#/g/money","banknote","כסף ו־BuckMe","איפה לשמור","#9a74c2"],
 ["#/g/saves","save","נקודות אל־חזור","מה נסגר לתמיד","#5a5bc0"],
 ["#/g/map-icons","map-pinned","סימני המפה","מה כל סמל אומר","#8a6cc0"],
 ["#/g/phone","smartphone","הטלפון והאפליקציות","WhatUp, BuckMe, WAiNK…","#b076bf"],
 ["#/g/stats","flame","המדדים","כוח, סיבולת, פוקוס","#e7849a"],
 ["#/g/profile","drama","הפרופיל הפלילי","מקצוען או פסיכו","#8a6cc0"],
 ["#/g/shooting","crosshair","ירי","צהוב, אדום ופגיעה","#d06aa0"],
 ["#/g/how-site","circle-help","איך משתמשים","3 דברים","#d06aa0"]];
const glist=(arr,hf)=>`<div class="glist">`+arr.map(t=>`<a href="${hf(t)}"><span class="gi" style="--c:${t[4]}">${ic(t[1])}</span><span class="t"><b>${t[2]}</b><small>${t[3]}</small></span><span class="chv">${ic("chevron-left")}</span></a>`).join("")+`</div>`;
const SKY=["#6a0a82","#8e0b8c","#b8108f","#e0188c","#f42f7e","#fc5072","#ff7a72","#ff9b78","#ffb37f","#ffc58a"];
const skyAt=(i,n)=>SKY[Math.round(i/(Math.max(1,n-1))*(SKY.length-1))];
const tileSky=list=>list.map((t,i)=>{const c=skyAt(i,list.length);return [...t.slice(0,4),c,t[5],i/(list.length-1)<.42]});
const tileHtml=(href,t)=>(t=[...t],t[4]=t[4].startsWith("--")?`var(${t[4]})`:t[4],t)[5]?`<a class="tile big${t[6]?" dark":""}" href="${href}" style="--f:${t[4]}"><span class="ti">${ic(t[1])}</span><span class="tt"><b>${t[2]}</b><small>${t[3]}</small></span></a>`:`<a class="tile${t[6]?" dark":""}" href="${href}" style="--f:${t[4]}"><span class="ti">${ic(t[1])}</span><b>${t[2]}</b><small>${t[3]}</small></a>`;
const pageGuides=()=>`<div class="ihead"><h1>מדריכים</h1></div><div class="search ask">${ic("message-circle")}<input id="aq" type="search" enterkeyhint="search" autocomplete="off" placeholder="שאל שאלה – למשל: איך בורחים מהמשטרה?" value="${esc(AQ)}"></div><div id="ares">${askHtml()}</div><div class="glists${norm(AQ).length>=3?" dimmed":""}"><a class="feat" href="#/news"><svg class="palm" viewBox="0 0 150 210" aria-hidden="true"><path fill="currentColor" d="M112 210C104 160 92 110 80 62l6-2c12 48 26 98 36 150zM82 58C60 40 30 38 4 52c26-8 52-4 78 10zM82 58C70 30 48 14 20 12c26 8 46 24 60 50zM82 58c8-30 26-46 54-50-24 12-40 28-52 54zM82 58c26-14 50-12 68 4-22-10-46-8-66 2zM82 60c-16 6-34 26-42 52 14-24 30-38 44-48zM84 60c20 6 36 24 44 48-14-20-28-34-44-44z"/></svg><small>מתעדכן כל יום</small><b>מה חדש ב־Leonida</b><span>${esc((NEWS[0]||{}).t||"תגליות, טיפים ומדריכים חדשים")}</span></a><div class="grp">כלים</div>${glist(HUB.filter(t=>t[5]&&t[0]!=="#/news"),t=>t[0])}<div class="grp">מדריכים</div>${glist(HUB.filter(t=>!t[5]),t=>t[0])}</div>`;
function pageTipsK(btn){const tl=tipList(999).filter(t=>btn?t.k==="btn":t.k!=="btn"),hid=TIPS2.filter(t=>btn?t.k==="btn":t.k!=="btn").length-tl.length;
  return `<div class="ihead"><div class="kick">${btn?"PS5 · ב־Xbox בסוגריים":"מתעדכן כל יום"}</div><h1 style="margin-top:4px">${btn?"🎮 כפתורים סודיים":"💡 טיפים"}</h1></div>`+(tl.map(tipHtml).join("")||`<div class="empty">עוד אין</div>`)+(hid?`<p class="dim" style="font-size:12px">🔒 ${hid} נוספים ייפתחו בהמשך המשחק</p>`:"")}
const pageNews=()=>`<div class="ihead"><div class="kick">מתעדכן כל יום</div><h1 style="margin-top:4px">🆕 מה חדש</h1></div>`+NEWS.map(n=>`<a class="row" style="--c:#3fd08a" href="${n.s?"#/i/"+esc(n.s):"#/guides"}"><span class="gl coll" style="--c:#3fd08a">🆕</span><div class="t"><b>${esc(n.t)}</b><small class="ltr">${esc(n.d.split("-").reverse().join("/"))}</small></div></a>`).join("");
function pageGuide(id){const g=GUIDES.find(x=>x.id===(id==="focus"?"stats":id));if(!g)return `<div class="empty">לא נמצא</div>`;return (window.LANG==="en"?`<p class="tag" style="display:block;padding:8px 10px;margin:0 0 10px">This guide is in Hebrew for now – English is coming soon.</p>`:"")+`<div class="ihead"><div class="kick">מדריך · אתה בפרק ${curCh()}</div><h1 style="margin-top:4px">${g.e} ${esc(g.t)}</h1></div><div class="blk gbody" id="gbody">${g.h}</div>${commentsBlock("g:"+g.id)}`}
/* parts of a guide marked data-ch="N" stay closed until you reach chapter N */
/* long guides → parts: summary on top, one part at a time, tabs + "next" */
function splitGuide(active){
  const b=$("#gbody");if(!b)return;
  const kids=[...b.children],hs=kids.filter(e=>e.tagName==="H2");
  if(hs.length<2)return;
  const top=document.createElement("div"),parts=[];let cur=null;const intro=[];
  kids.forEach(e=>{if(e.tagName==="H2"){cur={t:e.textContent.trim(),h:e,els:[]};parts.push(cur);return}
    if(!cur){if(e.classList.contains("tldr"))top.appendChild(e);else intro.push(e)}else cur.els.push(e)});
  if(intro.length){parts.unshift({t:"הבסיס",els:intro,intro:1})}
  const off=intro.length?1:0;const act=active<0?0:Math.min(parts.length-1,active+off);
  const tabs=document.createElement("div");tabs.className="gparts";
  tabs.innerHTML=parts.map((p,i)=>`<button data-gp="${i}"${i===act?' class="on"':""}><i>${i+1}</i>${esc(p.t)}</button>`).join("");
  b.innerHTML="";b.appendChild(top);b.appendChild(tabs);
  parts.forEach((p,i)=>{const w=document.createElement("div");w.className="gpart";w.hidden=i!==act;
    if(p.h){p.h.classList.add("gph");w.appendChild(p.h)}p.els.forEach(e=>w.appendChild(e));
    const nav=document.createElement("div");nav.className="gnav";
    nav.innerHTML=(i>0?`<button class="btn sm" data-gp="${i-1}">${ic("arrow-right")} הקודם</button>`:"<span></span>")+(i<parts.length-1?`<button class="btn sm pri" data-gp="${i+1}">הבא: ${esc(parts[i+1].t)} ${ic("chevron-left")}</button>`:`<a class="btn sm" href="#/guides">סיימת ${ic("check")}</a>`);
    w.appendChild(nav);b.appendChild(w)});
  const go=i=>{$$("#gbody .gpart").forEach((w,j)=>w.hidden=j!==i);$$(".gparts button").forEach((x,j)=>x.classList.toggle("on",j===i));
    const t=$$(".gparts button")[i];if(t)t.scrollIntoView({inline:"center",block:"nearest"});
    const m=$("#main"),r=tabs.getBoundingClientRect();if(r.top<70||r.top>m.clientHeight*.6)m.scrollTop+=r.top-80};
  $$("#gbody [data-gp]").forEach(x=>x.onclick=()=>go(+x.dataset.gp));
  if(act)setTimeout(()=>go(act),30);
}
function gateGuide(){
  const b=$("#gbody");if(!b)return;const cur=curCh();let first=true;
  b.querySelectorAll("[data-ch]").forEach(el=>{
    const c=+el.dataset.ch;el.classList.remove("gated");el.querySelectorAll(":scope > .gate").forEach(x=>x.remove());
    if(!S.spoil||c<=cur)return;
    el.classList.add("gated");
    if(el.tagName==="TR"){el.dataset.lock=`🔒 נפתח בפרק ${c}`;return}
    if(first){const m=document.createElement("div");m.className="gatebar";m.innerHTML=`<b>✋ כרגע אתה יכול עד כאן</b><span>מה שמתחת נפתח בהמשך המשחק.</span><button class="btn sm pri" id="gshow">רוצה לראות מה יהיה בהמשך?</button>`;el.before(m);first=false}
  });
  b.querySelectorAll("tr[data-ch]").forEach(tr=>{if(tr.classList.contains("gated")&&first){const t=tr.closest("table");if(t&&!t.previousElementSibling?.classList.contains("gatebar")){const m=document.createElement("div");m.className="gatebar";m.innerHTML=`<b>✋ כרגע אתה יכול עד כאן</b><span>השורות הנעולות נפתחות בהמשך.</span><button class="btn sm pri" data-gshow>רוצה לראות מה יהיה בהמשך?</button>`;t.after(m)}}});
  b.querySelectorAll("#gshow,[data-gshow]").forEach(x=>x.onclick=()=>{b.querySelectorAll(".gated").forEach(e=>e.classList.remove("gated"));b.querySelectorAll(".gatebar").forEach(e=>e.remove())});
}

/* settings */
function sw(k,t,d){return `<div class="set"><div class="t"><b>${t}</b><small>${d}</small></div><button class="sw${S[k]?" on":""}" data-sw="${k}" role="switch" aria-checked="${!!S[k]}"></button></div>`}
const ME=[
 ["account","user-round","החשבון שלי","שמירה בכל מכשיר","#5a5bc0",1],
 ["view","eye-off","ספוילרים ותצוגה","מה מוסתר, בהיר או כהה","#8a6cc0",1],
 ["progress","flag","ההתקדמות שלי","איפה אני, גיבוי","#b076bf",1],
 ["map","map","המפה","מה מופיע עליה","#d06aa0"],
 ["share","share-2","שתף עם חברים","שלח את Leo","#e7849a"],
 ["app","smartphone","האפליקציה","רענון, התקנה, קרדיטים","#ee9a86"],
 ["lang","languages","English / עברית","Language","#f2ae8c"]];
function pageSettings(sec){
  if(!sec)return `<div class="ihead"><h1>אני</h1></div>${glist(ME.filter(t=>t[5]),t=>"#/settings/"+t[0])}<div style="height:14px"></div>${glist(ME.filter(t=>!t[5]),t=>"#/settings/"+t[0])}`;
  const T=ME.find(t=>t[0]===sec)||ME[0];
  let h=`<div class="ihead"><h1>${T[2]}</h1></div>`;
  if(sec==="account")h+=`<div class="card cardlist">${accountBlock()}</div><p class="muted" style="font-size:13px;margin:10px 4px">בלי חשבון – ההתקדמות נשמרת רק בטלפון הזה. עם חשבון – בכל מכשיר, ואפשר גם להגיב ולתת טיפים.</p>`;
  if(sec==="view"){
    const demo=STORY.find(x=>x.c===2)||STORY[5];
    h+=`<div class="card cardlist">`+sw("spoil","בלי ספוילרים","דברים מפרקים שעוד לא הגעת אליהם – מוסתרים.")+`</div>
    <div class="sec"><h2>ככה זה נראה</h2></div>
    <div class="demo"><span class="dl">${S.spoil?"מוסתר":"גלוי"}</span><div class="row" style="--c:#ff4f9a;margin:0"><span class="gl story">L</span><div class="t"><b>${S.spoil?"🔒 משימת סיפור (שם מוסתר)":bdi(demo.n)}</b><small>פרק ${demo.c} · ${S.spoil?"מה עושים – מוסתר":esc((demo.steps||[demo.d||""])[0]||"")}</small></div>${S.spoil?`<span class="rev">👁</span>`:""}</div></div>
    <p class="muted" style="font-size:13px;margin:8px 4px">במשימה מוסתרת יש שני כפתורים: <b>👁 הצג שם</b> ו־<b>📖 הצג מה עושים</b> – אתה מחליט מה לראות.</p>
    <div class="card cardlist" style="margin-top:12px"><div class="set stack"><div class="t"><b>מה נחשב "עוד לא הגעת"</b><small>"פרקים הבאים" – כל מה שבפרק שלך גלוי (נוח כשעושים משימות לא לפי הסדר).</small></div><div class="seg"><button data-sl="ch" class="${S.spoilLvl!=="strict"?"on":""}">פרקים הבאים</button><button data-sl="strict" class="${S.spoilLvl==="strict"?"on":""}">כל מה שאחרי הבאה</button></div></div>
    <div class="set"><div class="t"><b>מה שכבר גילית</b><small>${REV.size} שמות · ${REVC.size} תיאורים</small></div><button class="btn sm" id="revclr">הסתר שוב</button></div>`+
    sw("casual","מצב 'סתם מתעניין'","בלי סימונים ואחוזים – רק לגלות ולקרוא.")+
    sw("hideHow","להסתיר את 'מה עושים'","בכל משימה – גם בזו שאתה באמצע. השלבים, הטיפים ומה מקבלים נפתחים רק כשתלחץ.")+
    (HREV.size?`<div class="set"><div class="t"><b>מה שכבר פתחת</b><small>${HREV.size} משימות</small></div><button class="btn sm" id="rehow">הסתר שוב</button></div>`:"")+`</div>`+
    `<div class="sec"><h2>מראה</h2></div><div class="card cardlist" style="padding:12px 14px"><div class="seg wide">`+[["auto","לפי הטלפון"],["light","בהיר"],["dark","כהה"]].map(m=>`<button data-thm="${m[0]}" class="${(S.theme||"auto")===m[0]?"on":""}">${m[1]}</button>`).join("")+`</div><small class="dim" style="display:block;margin-top:8px;font-size:12.5px">"לפי הטלפון" עובר לכהה לבד כשהטלפון במצב כהה.</small></div>`;}
  if(sec==="progress")h+=`<div class="card cardlist"><div class="set"><div class="t"><b>📍 איפה אתה בסיפור</b><small>בחר את המשימה האחרונה שסיימת – נסמן הכל עד אליה</small></div><button class="btn sm pri" id="swh">עדכן</button></div></div>
   <div class="card cardlist" style="margin-top:10px"><div class="set"><div class="t"><b>💾 קוד התקדמות</b><small>גיבוי, או העברה ממכשיר אחר / מהגרסה הקודמת. ייבוא רק מוסיף – לא מוחק.</small></div></div>
   <div style="padding:0 14px 14px"><textarea class="in" id="code" placeholder="הדבק כאן קוד…"></textarea><div style="display:flex;gap:8px;margin-top:8px"><button class="btn sm pri" id="bkl">🔗 קישור גיבוי</button><button class="btn sm" id="cpy">📋 קוד</button><button class="btn sm pri" id="imp">ייבא</button></div></div></div>`;
  if(sec==="map")h+=`<div class="card cardlist">`+sw("hideDone","הסתר מה שעשיתי","סיכות של דברים שסימנת לא יופיעו.")+sw("upTo","רק עד הפרק שלי","בלי דברים מפרקים הבאים.")+sw("exactOnly","רק מיקומים מדויקים","בלי סיכות של 'אזור משוער'.")+`</div>
   <p class="muted" style="font-size:13px;margin:10px 4px">טיפ: הכפתור <b>🎮 כמו במשחק</b> במפה מראה רק מה שאפשר לעשות עכשיו.</p>`;
  if(sec==="share")h+=`<div class="blk" style="text-align:center"><div class="bigic">${ic("share-2")}</div><h3 style="justify-content:center;font-size:18px">יש לך חברים שמשחקים?</h3><p class="muted">כל אחד שומר את ההתקדמות שלו – בלי הרשמה.</p><button class="btn pri wide" id="shapp">📤 שתף את Leo</button><button class="btn wide" id="cplink" style="margin-top:8px">🔗 העתק קישור</button></div>`;
  if(sec==="lang")h+=`<div class="blk" style="text-align:center"><div style="font-size:40px">🌐</div><div class="lockbtns"><button class="btn${window.LANG!=="en"?" pri":""}" onclick="setLang('he')">עברית</button><button class="btn${window.LANG==="en"?" pri":""}" onclick="setLang('en')">English</button></div><p class="dim" style="font-size:12.5px;margin-top:10px">English: missions, map and menus. Guides & tips are still in Hebrew – coming soon.</p></div>`;
  if(sec==="app")h+=`<div class="card cardlist"><div class="set"><div class="t"><b>🔄 רענון</b><small>מוריד את הגרסה הכי חדשה. ההתקדמות נשארת.</small></div><button class="btn sm pri" onclick="hardRefresh()">רענן</button></div>
   <div class="set"><div class="t"><b>📲 על המסך הבית</b><small>${/iphone|ipad/i.test(navigator.userAgent)?"ב־Safari: שיתוף ⬆ › 'הוסף למסך הבית'":"בתפריט הדפדפן: 'התקן אפליקציה'"}</small></div></div></div>
   <p class="dim" style="font-size:12px;margin:18px 4px">מפה ונתוני מיקום: <a href="https://github.com/fbritoferreira/gta6" target="_blank" rel="noopener">Open GTA 6 Map</a> (CC BY 4.0). אתר מעריצים, לא רשמי. GTA ו־Rockstar Games הם סימנים של Take-Two.</p>`;
  return h;
}
function accountBlock(){
  if(!Cloud.on)return `<div class="set"><div class="t"><b>☁ חשבון</b><small>ההתקדמות נשמרת במכשיר הזה. הרשמה תיפתח כשהאתר יחובר לשרת.</small></div></div>`;
  if(!Cloud.user)return `<div class="set"><div class="t"><b>☁ שמור את ההתקדמות בכל מכשיר</b><small>הרשמה חינם – וגם אפשר להגיב ולתת טיפים.</small></div></div><div style="padding:0 14px 14px;display:flex;flex-direction:column;gap:8px"><button class="btn pri wide" id="g">המשך עם Google</button><div style="display:flex;gap:8px"><input class="in" id="em" type="email" placeholder="או מייל – נשלח קישור כניסה" dir="ltr"><button class="btn" id="emb">שלח</button></div></div>`;
  const st={sync:"מסנכרן…",on:"מסונכרן ✓",err:"שגיאת סנכרון",off:""}[Cloud.status]||"";
  return `<div class="set"><div class="t"><b>👤 ${bdi(Cloud.profile&&Cloud.profile.name||Cloud.user.email)}</b><small>${esc(Cloud.user.email||"")} · ${st}</small></div><button class="btn sm" id="ren">שנה שם</button><button class="btn sm" id="out">יציאה</button></div>`;
}
function bindSettings(){
  $$("[data-thm]").forEach(b=>b.onclick=()=>{Store.setS("theme",b.dataset.thm);S.theme=b.dataset.thm;applyTheme();$$("[data-thm]").forEach(x=>x.classList.toggle("on",x===b))});
  const on=(sel,f)=>{const e=$(sel);if(e)e.onclick=f};
  const rh=$("#rehow");if(rh)rh.onclick=()=>{HREV.clear();saveHrev();toast("הוסתר שוב");route(true)};
  $$("[data-sw]").forEach(b=>b.onclick=()=>{const k=b.dataset.sw;Store.setS(k,!S[k]);b.classList.toggle("on",S[k]);b.setAttribute("aria-checked",S[k]);if(mapReady)drawPins();toast("נשמר");if(k==="spoil")route(true)});
  on("#swh",()=>whereSheet());
  $$("[data-sl]").forEach(b=>b.onclick=()=>{Store.setS("spoilLvl",b.dataset.sl);$$("[data-sl]").forEach(x=>x.classList.toggle("on",x===b));if(mapReady)drawPins();toast("נשמר")});
  on("#revclr",()=>{REV.clear();REVC.clear();saveRev();MEMO.clear();route(true);toast("הוסתר שוב")});
  on("#cpy",async()=>{const c=Store.code();try{await navigator.clipboard.writeText(c);toast("הקוד הועתק")}catch(e){$("#code").value=c;$("#code").select()}});
  on("#bkl",async()=>{const u=SITE+"#/restore/"+encodeURIComponent(Store.code());try{if(navigator.share)await navigator.share({title:"גיבוי Leo",text:"הקישור הזה משחזר את ההתקדמות שלי ב־Leo",url:u});else{await navigator.clipboard.writeText(u);toast("קישור הגיבוי הועתק – שמור אותו בפתקים")}}catch(e){}});
  on("#imp",()=>{try{const n=Store.fromCode($("#code").value);toast(`יובאו ${n} סימונים ✓`);$("#code").value=""}catch(e){toast("הקוד לא תקין")}});
  on("#g",()=>Cloud.google());
  on("#emb",async()=>{const v=$("#em").value.trim();if(!v.includes("@"))return toast("מייל לא תקין");const r=await Cloud.email(v);toast(r.error?"שגיאה בשליחה":"שלחנו קישור למייל ✉")});
  on("#out",()=>Cloud.out());
  on("#ren",async()=>{const n=prompt("השם שיופיע בתגובות:",Cloud.profile&&Cloud.profile.name||"");if(n)await Cloud.rename(n.slice(0,40))});
  on("#shapp",()=>shareApp());on("#cplink",async()=>{try{await navigator.clipboard.writeText(SITE);toast("הקישור הועתק")}catch(e){prompt("הקישור:",SITE)}});
}
Cloud.sub(()=>{if(curPage==="settings")route(true)});

/* ---------- map ---------- */
/* ---------- crisp vector map (land, buildings, roads, labels) – sharp at any zoom ---------- */
let VEC=null,vecP=null;
const loadVec=()=>vecP||(vecP=fetch("data/vec-lo.json").then(r=>r.json()).then(d=>{d.surf.building=[];d.roads.minor=[];VEC=d;return d}));
let hiP=null;const VLAYERS=[];
function loadHi(){return hiP||(hiP=fetch("data/vec-hi.json").then(r=>r.json()).then(h=>{VEC.surf.building=h.surf.building;VEC.roads.minor=h.roads.minor;VIDX=null;VLAYERS.forEach(l=>l._map&&l.redraw())}))}
const LANDC="#86a982";const VSTY={urban:"#aeb3b6",park:"#6f9c63",sand:"#e6d5a2",shallow:"#5ea9cc",paved:"#c3c4c0",building:"#8f949b"};
const RSTY={highway:["#f7f4ec","#7d8288",2.4],main:["#efede6","#868b90",1.8],street:["#e6e5e0","#90959a",1.3],minor:["#dcdcd8","#9a9fa3",.9]};
/* Vector map drawn into canvas tiles: paths are built once (Path2D, map units), each tile just
   transforms + fills, so panning is smooth and every zoom level is sharp. */
let VIDX=null;
function buildVecIndex(){
  if(VIDX)return VIDX;
  const CELL=16,grid=new Map(),feats=[];
  const add=(kind,pts,closed,layer)=>{
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;const p=new Path2D();
    const rings=Array.isArray(pts[0][0])?pts:[pts];
    rings.forEach(r=>{r.forEach((q,i)=>{if(q[0]<x0)x0=q[0];if(q[0]>x1)x1=q[0];if(q[1]<y0)y0=q[1];if(q[1]>y1)y1=q[1];i?p.lineTo(q[0],q[1]):p.moveTo(q[0],q[1])});if(closed)p.closePath()});
    const f={kind,layer,p,o:feats.length};feats.push(f);
    for(let gx=Math.floor(x0/CELL);gx<=Math.floor(x1/CELL);gx++)for(let gy=Math.floor(y0/CELL);gy<=Math.floor(y1/CELL);gy++){const k=gx+","+gy;let c=grid.get(k);if(!c)grid.set(k,c=[]);c.push(f)}
  };
  VEC.land.forEach(poly=>add("fill",poly,true,0));
  const SL={shallow:-1,sand:2,urban:3,park:4,paved:5,building:6};
  for(const k in SL)(VEC.surf[k]||[]).forEach(r=>add(k,r,true,SL[k]));
  VEC.rails.forEach(l=>add("rail",l,false,7));
  const RL={minor:8,street:9,main:10,highway:11};
  for(const k in RL)(VEC.roads[k]||[]).forEach(l=>add(k,l,false,RL[k]));
  return VIDX={grid,CELL};
}
const VecTiles=L.GridLayer.extend({
  createTile(c,doneCb){
    const t=document.createElement("canvas");t.width=t.height=1;
    const q=VecTiles.q||(VecTiles.q=[]);q.push(()=>{if(!this._map){return}this._draw(t,c);doneCb(null,t)});
    if(!VecTiles.busy){VecTiles.busy=true;const pump=()=>{const st=performance.now();while(q.length&&performance.now()-st<10)q.shift()();if(q.length)requestAnimationFrame(pump);else VecTiles.busy=false};requestAnimationFrame(pump)}
    return t;
  },
  _draw(t,c){const dpr=Math.min(window.devicePixelRatio||1,2);
    const TS=this.options.tileSize;t.width=t.height=TS*dpr;const ctx=t.getContext("2d");
    const sc=Math.pow(2,c.z),x0=c.x*TS/sc,y0=c.y*TS/sc,span=TS/sc;
    const {grid,CELL}=buildVecIndex();
    const seen=new Set(),list=[];
    for(let gx=Math.floor(x0/CELL);gx<=Math.floor((x0+span)/CELL);gx++)for(let gy=Math.floor(y0/CELL);gy<=Math.floor((y0+span)/CELL);gy++){const cell=grid.get(gx+","+gy);if(cell)for(const f of cell)if(!seen.has(f)){seen.add(f);list.push(f)}}
    list.sort((a,b)=>a.layer-b.layer||a.o-b.o);
    ctx.setTransform(dpr*sc,0,0,dpr*sc,-x0*dpr*sc,-y0*dpr*sc);
    ctx.lineCap="round";ctx.lineJoin="round";
    const px=v=>v/sc; // pixel width -> map units
    const zz=c.z;const rw=k=>Math.max(zz<4?.7:1.1,RSTY[k][2]*Math.pow(2,zz-4.6));
    const roads=[];
    for(const f of list){
      if(f.kind==="fill"){ctx.fillStyle=LANDC;ctx.fill(f.p)}
      else if(VSTY[f.kind]){if(f.kind==="building"&&zz<4)continue;ctx.fillStyle=VSTY[f.kind];ctx.fill(f.p);if(f.kind==="building"&&zz>=6){ctx.strokeStyle="#767b82";ctx.lineWidth=px(.8);ctx.stroke(f.p)}}
      else if(f.kind==="rail"){ctx.strokeStyle="#9aa0ad";ctx.lineWidth=px(1.4);ctx.setLineDash([px(5),px(4)]);ctx.stroke(f.p);ctx.setLineDash([])}
      else{if(zz<4&&f.kind==="minor"||zz<3&&f.kind==="street")continue;roads.push(f)}
    }
    for(const f of roads){const w=rw(f.kind);ctx.strokeStyle=RSTY[f.kind][1];ctx.lineWidth=px(w+Math.max(1.5,w*.3));ctx.stroke(f.p)}
    for(const f of roads){ctx.strokeStyle=RSTY[f.kind][0];ctx.lineWidth=px(rw(f.kind));ctx.stroke(f.p)}
  }
});
function addVector(m,opts={}){
  const layer=new VecTiles({tileSize:512,zoomOffset:0,minZoom:opts.from==null?4:opts.from,maxZoom:12,minNativeZoom:0,maxNativeZoom:11,noWrap:true,bounds:BOUNDS,updateWhenZooming:false,updateWhenIdle:true,keepBuffer:4,pane:"overlayPane"});
  const pane=m.getPane("vec")||m.createPane("vec");pane.style.zIndex=250;layer.options.pane="vec";
  layer.addTo(m);VLAYERS.push(layer);
  const hz=()=>{if(m.getZoom()>=4.4)loadHi()};m.on("zoomend",hz);hz();
  if(opts.labels!==false)addLabels(m);
  return layer;
}
function addLabels(m){
  const pane=m.createPane("labels");pane.style.zIndex=450;pane.style.pointerEvents="none";
  const box=L.DomUtil.create("div","lbls",pane);
  const LB=VEC.lab;
  const biz=LOCS.filter(l=>["shop","food","store","bank","leisure","civic","transport","safehouse","building","range","arcade","payday","fence"].includes(l.k)).map(l=>[l.n.replace(/ - [^-]+$/,""),l.x,l.y]);
  let raf=0;
  function draw(){
    const z=m.getZoom(),b=m.getBounds().pad(.05);box.innerHTML="";const taken=[];
    const cand=[];const inb=(x,y)=>b.contains([-y,x]);
    if(z<4.4)LB.dist.forEach(d=>inb(d[1],d[2])&&cand.push({t:d[0],x:d[1],y:d[2],c:"ld",fs:z<3?12:15,pr:0}));
    if(z>=2.4)LB.hood.forEach(h=>{if((z>=3.8||h[3]>=30)&&inb(h[1],h[2]))cand.push({t:h[0],x:h[1],y:h[2],c:"lh",fs:z>=6?15:z>=5?13:11.5,pr:z>=6?2:1})});
    if(z>=3.5)LB.routes.forEach(r=>inb(r[2],r[3])&&cand.push({t:r[0],x:r[2],y:r[3],c:"lr lr-"+r[1],fs:10,pr:1.5}));
    if(z>=5.2)LB.street.forEach(s=>inb(s[1],s[2])&&cand.push({t:s[0],x:s[1],y:s[2],c:"ls",fs:12,pr:1.6}));
    if(z>=5.4)LB.places.forEach(p=>{if((z>=6.6||["civic","transport","leisure","hotel","nature"].includes(p[1]))&&inb(p[2],p[3]))cand.push({t:p[0],x:p[2],y:p[3],c:"lp",fs:z>=7.5?12.5:11,pr:3})});
    if(z>=6.2)biz.forEach(p=>inb(p[1],p[2])&&cand.push({t:p[0],x:p[1],y:p[2],c:"lp lb2",fs:z>=7.5?12:10.5,pr:4}));
    cand.sort((a,b)=>a.pr-b.pr);
    let n=0;const frag=document.createDocumentFragment();
    for(const c of cand){
      const pt=m.latLngToLayerPoint([-c.y,c.x]);const w=c.t.length*c.fs*.56+8,h=c.fs+6;
      const r=[pt.x-w/2,pt.y-h/2,pt.x+w/2,pt.y+h/2];
      let hit=false;for(const t of taken)if(!(r[2]<t[0]||r[0]>t[2]||r[3]<t[1]||r[1]>t[3])){hit=true;break}
      if(hit)continue;taken.push(r);
      const e=document.createElement("div");e.className="lb "+c.c;e.textContent=c.t;e.style.cssText=`left:${pt.x}px;top:${pt.y}px;font-size:${c.fs}px`;frag.appendChild(e);
      if(++n>180)break;
    }
    box.appendChild(frag);
  }
  const sched=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(draw)};
  m.on("zoomstart",()=>box.style.opacity=0);m.on("zoomend moveend",()=>{sched();box.style.opacity=1});sched();
}

let map=null,mapReady=false,layer=null,base=null,mini=null;
const BOUNDS=L.latLngBounds([-800,160],[-160,832]);
const ML=Object.assign({mine:true,cats:{},kinds:{},game:true},S.mapLayers||{});
function setBase(){
  if(base)map.removeLayer(base);
  if(S.mapStyle==="original"){
    const M=window.AFF;const p=(fx,fy)=>[fx*M[0][0]+fy*M[1][0]+M[2][0],fx*M[0][1]+fy*M[1][1]+M[2][1]];
    const a=p(0,0),b=p(1,1);base=L.imageOverlay("map-original.jpg",[[-a[1],a[0]],[-b[1],b[0]]]).addTo(map);
  }else{base=null;map.attributionControl.addAttribution('<a href="https://github.com/fbritoferreira/gta6" target="_blank" rel="noopener">Open GTA 6 Map</a> (CC BY 4.0)')}
  base&&base.bringToBack&&base.bringToBack();
}
function itemShown(x){
  if(x.x==null||x.tip)return false;
  if(S.hideDone&&done(x))return false;
  if(S.upTo&&x.c>curCh())return false;
  if(S.hideDone&&avail(x)==="missed")return false;
  if(ML.game){if(done(x)||avail(x)!=="now")return false;if(x.story&&x!==nextStory())return false}
  if(S.exactOnly&&!x.ex)return false;
  const on=Object.keys(ML.cats).filter(k=>ML.cats[k]);
  if(on.length&&!on.includes(mainCat(x)))return false;
  if(!on.length&&mainCat(x)==="collect")return false;
  return true;
}
function pinHtml(arr){
  const x=arr[0];const cnt=arr.length>1?`<span class="cnt">${arr.length}</span>`:"";
  if(x.L){const k=KINDS[x.k]||{};return `<div class="mpin" style="position:relative"><span class="edot${Store.done("L:"+x.id)?" done":""}" style="background:${k.c}"></span>${cnt}<span class="pl">${esc(x.n)}</span></div>`}
  const nm0=locked(x)?"🔒":title(x);const nm=arr.length>1?`${nm0} +${arr.length-1}`:nm0;const c=mainCat(x);
  const g=(c==="story"||c==="side")?esc(x.w&&x.w.length===1?x.w:"★"):ic(x.t&&KTI[x.t]||CI[c]||"sparkles");
  return `<div class="tpin${done(x)?" done":""}${avail(x)==="missed"?" gone":""}${x.ex?"":" ap"}${timed(x)?" soon":missable(x)?" miss":""}" style="--c:${CATC[c]||"#ffc23c"}"><i><b>${g}</b></i>${cnt}<span class="pl">${esc(nm)}</span></div>`;
}
function drawPins(){
  if(!map)return;
  if(layer)map.removeLayer(layer);
  layer=L.markerClusterGroup({maxClusterRadius:46,disableClusteringAtZoom:5,showCoverageOnHover:false,spiderfyOnMaxZoom:false,chunkedLoading:true,animate:false,removeOutsideVisibleBounds:true,
    iconCreateFunction(cl){const ms=cl.getAllChildMarkers();const cnt={};let n=0;ms.forEach(m=>{const c=m.options.col||"#ccc";const k=m.options.n||1;cnt[c]=(cnt[c]||0)+k;n+=k});
      let a=0;const seg=Object.entries(cnt).sort((p,q)=>q[1]-p[1]).map(([c,v])=>{const s=`${c} ${a}deg ${a+=v/n*360}deg`;return s}).join(",");
      const sz=n>=50?52:n>=15?46:40;
      return L.divIcon({className:"",html:`<div class="clu" style="--g:conic-gradient(${seg});width:${sz}px;height:${sz}px"><span>${n}</span></div>`,iconSize:[sz,sz],iconAnchor:[sz/2,sz/2]})}});
  const groups=new Map();
  const put=(o,x,y)=>{const k=Math.round(x*4)/4+","+Math.round(y*4)/4;if(!groups.has(k))groups.set(k,{x,y,a:[]});groups.get(k).a.push(o)};
  if(ML.mine)IT.filter(itemShown).forEach(x=>put(x,x.x,x.y));
  const kOn=Object.keys(ML.kinds).filter(k=>ML.kinds[k]);
  if(kOn.length)LOCS.filter(l=>kOn.includes(l.k)&&!(S.hideDone&&Store.done("L:"+l.id))).forEach(l=>put(Object.assign({L:1},l),l.x,l.y));
  groups.forEach(g=>{
    g.a.sort((p,q)=>(p.L?1:0)-(q.L?1:0)||(p.story?0:1)-(q.story?0:1));
    const f=g.a[0];const col=f.L?((KINDS[f.k]||{}).c||"#ccc"):(CATC[mainCat(f)]||"#ffc23c");
    const m=L.marker([-g.y,g.x],{col,n:g.a.length,icon:L.divIcon({className:"",html:pinHtml(g.a),iconSize:f.L?[18,18]:[30,38],iconAnchor:f.L?[9,9]:[15,36]})});
    m.on("click",()=>g.a.length===1?preview(g.a[0]):groupSheet(g.a));
    layer.addLayer(m);
  });
  map.addLayer(layer);
  const c=$("#mcount");if(c)c.textContent=[...groups.values()].reduce((s,g)=>s+g.a.length,0);
}
function previewHtml(o){
  if(o.L){const k=KINDS[o.k]||{};const d=Store.done("L:"+o.id);
    return `<div class="pcard" style="--c:${k.c||"#ffc23c"}"><div class="pch"><span class="pic">${esc(k.i||"📍")}</span><span>${esc(k.n||o.k)}${o.a?` · ${bdi(o.a)}`:""}</span></div><h3>${bdi(o.n)}</h3>${o.d?`<p class="pwhat ltr">${esc(o.d.slice(0,180))}${o.d.length>180?"…":""}</p>`:""}<div class="acts"><a class="btn pri" href="#/l/${encodeURIComponent(o.id)}">לעמוד המלא ›</a><button class="btn" data-lchk="${esc(o.id)}">${d?"✓ נמצא":"סמן ✓"}</button></div></div>`}
  const x=o,lk=hid(x),c=mainCat(x);
  const hh=howHid(x);
  const what=lk||hh?"":(x.steps&&x.steps[0])||x.d||x.sp||"";
  const get=lk||hh?"":(x.rw||x.why||"");
  const where=lk?"":(x.steps||x.d)?(x.sp||""):"";
  return `<div class="pcard" style="--c:${CATC[c]||"#ffc23c"}">
   <div class="pch">${glyph(x)}<span>${CAT[c]?CAT[c][0]:""} · פרק ${x.c}${x.w&&WHO[x.w]?` · ${WHO[x.w]}`:""}</span>${x.ex?`<span class="pex">📍 מדויק</span>`:`<span class="pex ap">≈ אזור</span>`}</div>
   <h3>${bdi(title(x))}</h3>${statusPill(x)?`<div style="margin:-2px 0 8px">${statusPill(x)}</div>`:""}
   ${lk?`<p class="pwhat">🙈 התוכן מוסתר כדי לא לספיילר</p>`:""}
   ${what?`<div class="pline"><span>🎯</span><p>${esc(what.length>140?what.slice(0,140)+"…":what)}</p></div>`:""}
   ${get?`<div class="pline get"><span>🎁</span><p><b>${esc(get.length>110?get.slice(0,110)+"…":get)}</b></p></div>`:""}
   ${where?`<div class="pline"><span>📍</span><p class="muted">${esc(where.length>110?where.slice(0,110)+"…":where)}</p></div>`:""}
   <div class="acts"><a class="btn pri" href="#/i/${x.s}">${lk?"לעמוד":"פרטים מלאים"} ›</a>${S.casual?"":`<button class="btn" data-chk="${esc(x.id)}">${done(x)?"✓ עשיתי":"סמן ✓"}</button>`}${x.x!=null?`<button class="btn rtb${inRoute(x.id)?" on":""}" data-rt="${esc(x.id)}">${rtLabel(x.id)}</button>`:""}</div></div>`;
}
function preview(o){openSheet(previewHtml(o))}
function groupSheet(a){
  openSheet(`<h3 style="font-size:18px;margin:0 0 4px">${a.length} דברים בנקודה הזאת</h3><p class="dim" style="margin:0 0 10px;font-size:13px">לחץ על פריט כדי לראות אותו</p>`+a.map((o,i)=>o.L?`<a class="row" href="#" data-gi="${i}"><span class="edot" style="background:${(KINDS[o.k]||{}).c};width:22px;height:22px"></span><div class="t"><b>${bdi(o.n)}</b><small>${esc((KINDS[o.k]||{}).n||o.k)}</small></div></a>`:`<a class="row${done(o)?" done":""}" href="#" data-gi="${i}">${glyph(o)}<div class="t"><b>${bdi(title(o))}</b><small>${esc(sub(o))}</small></div><span class="dim">‹</span></a>`).join(""));
  $$("[data-gi]").forEach(r=>r.onclick=e=>{e.preventDefault();preview(a[+r.dataset.gi])});
}
function layersSheet(){
  const kinds=Object.keys(KINDS).filter(k=>LOCS.some(l=>l.k===k));
  const grp={};kinds.forEach(k=>{const g=KINDS[k].g||"Other";(grp[g]=grp[g]||[]).push(k)});
  const GN={Collectibles:"אספנות",Activities:"פעילויות",Crime:"פשע",Places:"מקומות",Other:"אחר"};
  let h=`<h3 style="font-size:18px;margin:0 0 10px">שכבות במפה</h3><div class="grp" style="margin-inline:0">מהרשימה שלי</div><div class="chips" style="flex-wrap:wrap">`+["story","side","op","collect","money","vehicle","weapon","event","egg"].map(k=>`<button class="chip pick${ML.cats[k]?" on":""}" style="--c:${CATC[k]}" data-mc="${k}">${ic(CI[k])} ${CAT[k][0]}</button>`).join("")+`</div>`+`<div class="set" style="padding:10px 0"><div class="t"><b>המשימות והפריטים שלי</b><small>כל מה שברשימה – עם הסימונים שלך</small></div><button class="sw${ML.mine?" on":""}" data-ml="mine"></button></div>`;
  for(const g in grp){h+=`<div class="grp">${GN[g]||g}</div><div class="chips" style="flex-wrap:wrap">`+grp[g].map(k=>{const n=LOCS.filter(l=>l.k===k).length;return `<button class="chip pick${ML.kinds[k]?" on":""}" style="--c:${KINDS[k].c}" data-mk="${k}">${esc(KINDS[k].i)} ${esc(KINDS[k].n)} <span class="dim">${n}</span></button>`}).join("")+`</div>`}
  h+=`<p class="dim" style="font-size:12px">השכבות הנוספות הן ${LOCS.length.toLocaleString()} מיקומים מדויקים מ־Open GTA 6 Map.</p>`;
  openSheet(h);
  const save=()=>{Store.setS("mapLayers",ML);drawPins()};
  $$("[data-ml]").forEach(b=>b.onclick=()=>{ML.mine=!ML.mine;b.classList.toggle("on",ML.mine);save()});
  $$("[data-mk]").forEach(b=>b.onclick=()=>{const k=b.dataset.mk;ML.kinds[k]=!ML.kinds[k];b.classList.toggle("on",ML.kinds[k]);save();mapChips()});
  $$("#sheet [data-mc]").forEach(b=>b.onclick=()=>{const k=b.dataset.mc;ML.cats[k]=!ML.cats[k];b.classList.toggle("on",!!ML.cats[k]);save();mapChips()});
}
function mapChips(){
  const on=k=>ML.cats[k]?" on":"";
  $("#msearch").innerHTML=`${ic("search")}<input id="mq" placeholder="חיפוש במפה">`;
  const mq=$("#mq");mq.onkeydown=e=>{if(e.key==="Enter")mq.blur()};mq.oninput=()=>{clearTimeout(mq._t);mq._t=setTimeout(()=>mapSearch(mq.value),250)};
  const nL=Object.values(ML.cats).filter(Boolean).length+Object.values(ML.kinds).filter(Boolean).length;
  $("#mapbar").innerHTML=`<button class="chip gm${ML.game?" on":""}" id="mgame">${ML.game?"מה פתוח עכשיו":"הכל"}</button><button class="chip" id="mlay">${ic("layers-2")} שכבות${nL?` <b class="nb">${nL}</b>`:""}</button><button class="chip${RMODE?" on":""}" id="mroute">${ic("route")} ${RMODE==="auto"?"מסלול מוצע":"המסלול שלי"}${MYR.length&&RMODE!=="auto"?` <b class="nb">${MYR.length}</b>`:""}${RMODE?` <span class="rx" id="rclr">${ic("x")}</span>`:""}</button>`;
  $("#mroute").onclick=e=>{if(e.target.closest("#rclr")){clearRoute();return}if(RMODE==="auto"){clearRoute();return}if(!MYR.length||RMODE==="mine")routeSheet();else showRoute(true)};
  $("#mlay").onclick=layersSheet;
  $("#mgame").onclick=()=>{ML.game=!ML.game;Store.setS("mapLayers",ML);mapChips();drawPins();toast(ML.game?"🎮 רואים רק מה שאפשר לעשות עכשיו":"רואים הכל")};
  $$("[data-mc]").forEach(b=>b.onclick=()=>{const k=b.dataset.mc;ML.cats[k]=!ML.cats[k];b.classList.toggle("on",!!ML.cats[k]);Store.setS("mapLayers",ML);drawPins()});
}
function mapSearch(q){
  if(norm(q).length<2){closeSheet();return}
  const R=searchAll(q),res=[];
  R.items.filter(x=>x.x!=null).slice(0,15).forEach(x=>res.push({t:title(x),s:sub(x),go:()=>{location.hash="#/map?i="+x.s},g:glyph(x)}));
  R.places.slice(0,10).forEach(p=>res.push({t:p.n,s:p.t,go:()=>{closeSheet();map.setView([-p.y,p.x],p.e==="🗺️"?4.5:p.e==="🏘️"?5.5:6.5)},g:`<span class="gl coll">${p.e}</span>`}));
  R.locs.slice(0,25).forEach(l=>res.push({t:l.n,s:(KINDS[l.k]||{}).n||l.k,go:()=>{location.hash="#/map?l="+encodeURIComponent(l.id)},g:`<span class="gl coll">${esc((KINDS[l.k]||{}).i||"📍")}</span>`}));
  openSheet(`<h3 style="font-size:17px;margin:0 0 8px">${res.length?res.length+" תוצאות":"לא נמצא"}</h3>`+res.map((r,i)=>`<a class="row" href="#" data-sr="${i}">${r.g}<div class="t"><b>${bdi(r.t)}</b><small>${esc(r.s)}</small></div></a>`).join("")+(R.hidden.length?`<p class="dim" style="font-size:12px;margin:10px 4px 0">🔒 עוד ${R.hidden.length} תוצאות מחלקים שעוד לא הגעת אליהם – בחיפוש הראשי (🔎 למעלה) אפשר לראות אותן</p>`:""));
  $$("[data-sr]").forEach(a=>a.onclick=e=>{e.preventDefault();res[+a.dataset.sr].go()});
}
/* community: report a find on the map (long-press, or the 📍 button) */
let pickMode=false;
function reportSheet(x,y){
  openSheet(`<h3 style="font-size:19px;margin:0 0 4px">📍 מצאת משהו כאן?</h3><p class="dim" style="margin:0 0 10px;font-size:12.5px">ספר לנו – אנחנו בודקים ומוסיפים לאתר לכולם.</p>
   <input class="in" id="rf_t" maxlength="80" placeholder="מה זה? (למשל: כספת סודית, רכב נדיר)">
   <textarea class="in" id="rf_b" style="margin-top:8px" maxlength="800" placeholder="איך מגיעים / מה עושים / מה מקבלים"></textarea>
   <input class="in" id="rf_v" style="margin-top:8px" dir="ltr" placeholder="קישור לסרטון (לא חובה)">
   <div class="fact"><button class="btn" id="rf_x">ביטול</button><button class="btn pri" id="rf_s">שלח</button></div>`);
  $("#rf_x").onclick=closeSheet;
  $("#rf_s").onclick=async()=>{
    const t=$("#rf_t").value.trim(),b=$("#rf_b").value.trim(),v=$("#rf_v").value.trim();if(t.length<3)return toast("כתוב מה מצאת");
    const pos=`x=${x.toFixed(1)}, y=${y.toFixed(1)}`;
    if(Cloud.on&&Cloud.user){const r=await Cloud.find({x,y,title:t,body:b,video:v});closeSheet();toast(r.error?"שגיאה בשליחה":"תודה! קיבלנו ✓");return}
    const body=`**מה מצאתי:** ${t}\n\n${b}\n\n${v?`**סרטון:** ${v}\n\n`:""}**מיקום במפה:** ${pos}\n${SITE}#/map?at=${x.toFixed(1)},${y.toFixed(1)}`;
    window.open(`https://github.com/NaorLevy27/Leo/issues/new?labels=find&title=${encodeURIComponent("תגלית: "+t)}&body=${encodeURIComponent(body)}`,"_blank");closeSheet();toast("תודה! 🙏");
  };
}
function ensureMap(){
  if(map)return;
  map=L.map("map",{crs:L.CRS.Simple,preferCanvas:true,fadeAnimation:false,tap:false,bounceAtZoomLimits:false,inertiaDeceleration:2600,minZoom:-1,maxZoom:8.5,zoomSnap:0.25,zoomDelta:0.5,wheelPxPerZoomLevel:90,maxBounds:BOUNDS.pad(0.3),zoomControl:false,attributionControl:true});
  map.attributionControl.setPrefix(false);L.imageOverlay("data/overview.webp",[[-820,150],[-150,850]],{interactive:false,pane:"tilePane"}).addTo(map);setTimeout(()=>loadVec().then(()=>addVector(map)),60);
  const xs=LOCS.map(l=>l.x),ys=LOCS.map(l=>l.y);window.LAND=L.latLngBounds([-Math.max(...ys),Math.min(...xs)],[-Math.min(...ys),Math.max(...xs)]);map.fitBounds(LAND,{padding:[20,20]});window._map=map;const zc=()=>{const z=map.getZoom();$("#map").classList.toggle("lbl",z>=4.8);$("#map").classList.toggle("lbl2",z>=4.3)};map.on("zoomend",zc);zc();setBase();mapChips();drawPins();mapReady=true;
  map.on("contextmenu",e=>reportSheet(e.latlng.lng,-e.latlng.lat));map.on("click",e=>{if(pickMode){pickMode=false;$("#map").classList.remove("picking");reportSheet(e.latlng.lng,-e.latlng.lat)}});
  $("#zrep").onclick=()=>{pickMode=true;$("#map").classList.add("picking");toast("לחץ על המקום במפה 📍")};
  $("#zin").onclick=()=>map.zoomIn();$("#zout").onclick=()=>map.zoomOut();$("#zfit").onclick=()=>map.fitBounds(LAND,{padding:[20,20]});
}
let RLAYER=null;
function showRoute(mine){
  if(RLAYER){map.removeLayer(RLAYER);RLAYER=null}
  const r=mine?MYR.map(id=>BY[id]).filter(x=>x&&x.x!=null):routeFrom(IT.filter(x=>x.x!=null&&!x.tip&&avail(x)==="now"&&passes(x))).slice(0,25);if(!r.length)return toast(mine?"המסלול שלך ריק":"אין מסלול כרגע");
  RLAYER=L.layerGroup().addTo(map);L.polyline(r.map(x=>[-x.y,x.x]),{color:"#ff3d8b",weight:4,opacity:.85,dashArray:"8 8"}).addTo(RLAYER);
  r.forEach((x,i)=>L.marker([-x.y,x.x],{zIndexOffset:1000,icon:L.divIcon({className:"",html:`<div class="rpin">${i+1}</div>`,iconSize:[26,26],iconAnchor:[13,13]})}).on("click",()=>preview(x)).addTo(RLAYER));
  map.fitBounds(L.latLngBounds(r.map(x=>[-x.y,x.x])).pad(.2));
  RMODE=mine?"mine":"auto";mapChips();
}
let FOCUS=null,RMODE=null;
function clearRoute(){if(RLAYER){map.removeLayer(RLAYER);RLAYER=null}RMODE=null;mapChips()}
function routeSheet(){
  const a=MYR.map(id=>BY[id]).filter(Boolean);
  let h=`<h3 style="font-size:19px;margin:0 0 4px">המסלול שלי</h3><p class="dim" style="margin:0 0 10px;font-size:13px">${a.length?"התחנות לפי הסדר. אפשר להזיז או להסיר.":"עוד אין תחנות. במפה או בדף משימה לחץ \"למסלול שלי\"."}</p>`;
  if(a.length){h+=`<div class="group">`+a.map((x,i)=>`<div class="row rrow"><span class="rnum">${i+1}</span><div class="t"><b>${bdi(title(x))}</b><small>${esc(sub(x))}</small></div><button class="rbtn" data-rup="${i}" aria-label="למעלה"${i?"":" disabled"}>${ic("chevron-down")}</button><button class="rbtn" data-rdel="${i}" aria-label="הסר">${ic("x")}</button></div>`).join("")+`</div>`;
    h+=`<div class="acts" style="margin-top:12px"><button class="btn pri" id="rshow">${ic("route")} הצג במפה</button><button class="btn" id="rnear">סדר לפי הכי קרוב</button><button class="btn" id="rclear">נקה</button></div>`}
  openSheet(h);
  $$("[data-rdel]").forEach(b=>b.onclick=()=>{MYR.splice(+b.dataset.rdel,1);saveMyr();if(RMODE==="mine")MYR.length?showRoute(true):clearRoute();else mapChips();routeSheet()});
  $$("[data-rup]").forEach(b=>b.onclick=()=>{const i=+b.dataset.rup;if(!i)return;[MYR[i-1],MYR[i]]=[MYR[i],MYR[i-1]];saveMyr();if(RMODE==="mine")showRoute(true);routeSheet()});
  const sh=$("#rshow");if(sh)sh.onclick=()=>{closeSheet();showRoute(true)};
  const nr=$("#rnear");if(nr)nr.onclick=()=>{const pts=MYR.map(id=>BY[id]).filter(x=>x&&x.x!=null);if(!pts.length)return;const out=[pts.shift()];while(pts.length){const l=out[out.length-1];let bi=0,bd=1e9;pts.forEach((p,i)=>{const d=(p.x-l.x)**2+(p.y-l.y)**2;if(d<bd){bd=d;bi=i}});out.push(pts.splice(bi,1)[0])}MYR=out.map(x=>x.id).concat(MYR.filter(id=>!out.some(x=>x.id===id)));saveMyr();if(RMODE==="mine")showRoute(true);routeSheet();toast("סודר לפי הכי קרוב")};
  const cl=$("#rclear");if(cl)cl.onclick=()=>{MYR=[];saveMyr();if(RMODE==="mine")clearRoute();else mapChips();closeSheet();toast("המסלול נוקה")};
}
function focusMap(q){
  if(q.route){setTimeout(showRoute,300);return}
  if(q.at){const [ax,ay]=q.at.split(",").map(Number);map.setView([-ay,ax],7);L.marker([-ay,ax]).addTo(map);return}
  if(q.i&&BYS[q.i]){const x=BYS[q.i];if(x.x!=null){
    if(FOCUS){map.removeLayer(FOCUS);FOCUS=null}
    const ll=[-x.y,x.x];map.invalidateSize();map.setView(ll,x.ex?6.5:5.5,{animate:false});
    FOCUS=L.layerGroup().addTo(map);
    if(!x.ex)L.circle(ll,{radius:6,color:"#c58cff",weight:2,dashArray:"6 6",fillOpacity:.1,interactive:false}).addTo(FOCUS);
    L.marker(ll,{zIndexOffset:2000,icon:L.divIcon({className:"",html:`<div class="focuspin"><span></span>${pinHtml([x])}</div>`,iconSize:[30,38],iconAnchor:[15,36]})}).on("click",()=>preview(x)).addTo(FOCUS);
    setTimeout(()=>{map.panTo(ll,{animate:false});map.panBy([0,Math.round(map.getSize().y*0.22)],{animate:false});preview(x)},250)}}
  if(q.l&&LBY[q.l]){const l=LBY[q.l];if(!ML.kinds[l.k]){ML.kinds[l.k]=true;drawPins()}map.setView([-l.y,l.x],7.5);setTimeout(()=>preview(Object.assign({L:1},l)),250)}
}
function drawMini(x,y,o){
  if(mini){mini.remove();mini=null}
  const el=$("#mini");if(!el)return;
  mini=L.map(el,{crs:L.CRS.Simple,minZoom:1,maxZoom:8.5,zoomControl:false,attributionControl:false,maxBounds:BOUNDS.pad(0.2),scrollWheelZoom:false});
  mini.setView([-y,x],o.ex===0?5:7);L.imageOverlay("data/overview.webp",[[-820,150],[-150,850]],{interactive:false,pane:"tilePane"}).addTo(mini);const mm=mini;loadVec().then(()=>{if(mini===mm)addVector(mm)});
  if(o.ex===0)L.circle([-y,x],{radius:9,color:"#b9a2ff",weight:2,dashArray:"5 5",fillOpacity:.12}).addTo(mini);
  L.marker([-y,x],{icon:L.divIcon({className:"",html:o.L?`<span class="edot" style="background:${(KINDS[o.k]||{}).c};width:20px;height:20px"></span>`:`<div class="mpin">${glyph(o)}</div>`,iconSize:[28,28],iconAnchor:[14,14]})}).addTo(mini);
}

/* ---------- liquid glass nav lens ---------- */
const NAV=$("#nav");const lens=document.createElement("i");lens.className="lens";NAV.prepend(lens);
function moveLens(el){el=el||NAV.querySelector("a.on");if(!el){lens.style.opacity=0;return}lens.style.opacity=1;lens.style.left=el.offsetLeft+"px";lens.style.width=el.offsetWidth+"px"}
addEventListener("resize",()=>moveLens());
let drag=false;
const atX=x=>[...NAV.querySelectorAll("a")].find(a=>{const r=a.getBoundingClientRect();return x>=r.left&&x<=r.right});
NAV.addEventListener("pointerdown",e=>{drag=true;NAV.classList.add("press");const a=atX(e.clientX);if(a)moveLens(a)});
NAV.addEventListener("pointermove",e=>{if(!drag)return;const a=atX(e.clientX);if(a)moveLens(a)});
addEventListener("pointerup",e=>{if(!drag)return;drag=false;NAV.classList.remove("press");const a=atX(e.clientX);if(a&&e.target.closest&&!e.target.closest("#nav"))location.hash=a.getAttribute("href").slice(1);setTimeout(()=>moveLens(),0)});
NAV.addEventListener("pointercancel",()=>{drag=false;NAV.classList.remove("press");moveLens()});

/* ---------- router ---------- */
let curPage="";
function parse(){const h=location.hash.slice(1)||"/";const [p,qs]=h.split("?");const q={};(qs||"").split("&").filter(Boolean).forEach(kv=>{const [k,v]=kv.split("=");q[k]=decodeURIComponent(v||"")});return {parts:p.split("/").filter(Boolean),q}}
function route(soft){
  const {parts,q}=parse();const p=parts[0]||"";
  const page={"":"home",list:"list",i:"item",l:"loc",map:"map",guides:"guides",g:"guide",settings:"settings",cheats:"cheats",tips:"tips",buttons:"buttons",news:"news",welcome:"welcome",restore:"restore",search:"search"}[p]||"home";
  curPage=page;
  if(page==="restore"){try{const n=Store.fromCode(decodeURIComponent(parts.slice(1).join("/")));localStorage.setItem("lr_onb","1");toast(`שוחזרו ${n} סימונים ✓`)}catch(e){toast("קישור הגיבוי לא תקין")}location.hash="#/";return}
  if(page!=="welcome"&&!localStorage.getItem("lr_onb")&&!Object.keys(Store.all()).length){location.hash="#/welcome/1";return}
  if(page!=="welcome"&&!localStorage.getItem("lr_onb"))localStorage.setItem("lr_onb","1");
  const isMap=page==="map";
  document.body.classList.toggle("mapmode",isMap);document.body.classList.toggle("sub",["item","loc","guide","cheats","tips","buttons","news","search"].includes(page)||(page==="settings"&&parts[1]));
  $("#map").hidden=!isMap;$("#mapbar").hidden=!isMap;$("#msearch").hidden=!isMap;$("#mctl").hidden=!isMap;$("#main").hidden=isMap;
  const navKey={home:"home",list:"list",item:"list",loc:"map",map:"map",guides:"guides",guide:"guides",settings:"settings",cheats:"guides",tips:"guides",buttons:"guides",news:"guides"}[page];
  $$("#nav a").forEach(a=>a.classList.toggle("on",a.dataset.k===navKey));moveLens();
  if(!soft)closeSheet();
  if(isMap){ensureMap();setTimeout(()=>map.invalidateSize(),30);if(!soft)focusMap(q);return}
  let h="";
  if(page==="home")h=pageHome();else if(page==="list")h=pageList(soft?{}:q);else if(page==="item")h=pageItem(parts[1]);
  else if(page==="loc")h=pageLoc(decodeURIComponent(parts[1]||""));else if(page==="guides")h=pageGuides();else if(page==="guide")h=pageGuide(parts[1]);else if(page==="settings")h=pageSettings(parts[1]);else if(page==="cheats")h=pageCheats();else if(page==="welcome")h=pageWelcome(parts[1]);else if(page==="search")h=pageSearch(q);else if(page==="tips")h=pageTipsK(false);else if(page==="buttons")h=pageTipsK(true);else if(page==="news"){h=pageNews();localStorage.setItem("lr_seen",Date.now());$$(".newdot").forEach(e=>e.remove())}
  $("#main").innerHTML=`<div class="wrap">${deco(h)}</div>`;
  if(page==="home"){const ms=$("#moresoon");if(ms)ms.onclick=e=>{e.preventDefault();LF.sort="soon";Store.setS("lists2",LF);location.hash="#/list"};const wh=$("#wh");if(wh)wh.onclick=()=>whereSheet();const w=$("#wn");if(w)w.onclick=()=>location.hash="#/news";const sh=$("#shr");if(sh)sh.onclick=shareApp;const ib=$("#instb");if(ib)ib.onclick=async()=>{if(deferredInstall){deferredInstall.prompt();deferredInstall=null}else toast("בתפריט הדפדפן: 'הוסף למסך הבית'")};const ix=$("#instx");if(ix)ix.onclick=()=>{localStorage.setItem("lr_noinst",1);ix.parentElement.remove()}}
  if(page==="list")bindList();
  if(page==="search")bindSearch();
  if(page==="guide"){gateGuide();splitGuide(q.s!=null?+q.s:-1)}
  if(page==="guides")bindAsk();
  if(page==="welcome")bindWelcome(parts[1]);document.body.classList.toggle("welcomemode",page==="welcome");
  if(page==="cheats"){drawCheats("");$$("[data-cc]").forEach(b=>b.onclick=()=>{$$("[data-cc]").forEach(x=>x.classList.toggle("on",x===b));drawCheats(b.dataset.cc)})}
  if(page==="settings")bindSettings();
  const un=$("#unspoil");if(un)un.onclick=()=>{const x=BYS[parse().parts[1]];if(x){REV.add(x.id);saveRev();MEMO.clear()}route(true)};
  const shw=$("#showhow");if(shw)shw.onclick=()=>{const x=BYS[parse().parts[1]];if(x){HREV.add(x.id);saveHrev()}route(true)};
  const uc=$("#uncontent");if(uc)uc.onclick=()=>{const x=BYS[parse().parts[1]];if(x){REVC.add(x.id);saveRev()}route(true)};
  if(page==="item"){const x=BYS[parts[1]];if(x&&x.x!=null){const f=$("#fwhere");if(f){if(f.open){f._m=1;setTimeout(()=>drawMini(x.x,x.y,x),0)}f.addEventListener("toggle",()=>{if(f.open&&!f._m){f._m=1;drawMini(x.x,x.y,x)}})}}document.title=(x?title(x)+" · ":"")+"Leo"}else document.title="Leo · המדריך ל־Leonida";
  if(page==="loc"){const l=LBY[decodeURIComponent(parts[1]||"")];if(l)setTimeout(()=>drawMini(l.x,l.y,Object.assign({L:1},l)),0)}
  if(!soft||page==="item"||page==="loc"||page==="guide")loadComments();
  if(!soft)$("#main").scrollTop=0;
}
window.AFF=await fetch("data/affine.json").then(r=>r.json());
addEventListener("hashchange",()=>route());
if(freshNews.length){const a=$('#nav a[data-k="home"]');if(a){const d=document.createElement('span');d.className='newdot';d.textContent=freshNews.length;a.appendChild(d)}}
$("#back").onclick=()=>history.length>1?history.back():(location.hash="#/");
route();
document.body.classList.add("ready");try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}setTimeout(()=>(window.requestIdleCallback||setTimeout)(()=>loadVec()),2500);
if("serviceWorker"in navigator&&location.protocol.startsWith("http")){
  navigator.serviceWorker.register("sw.js").then(reg=>{
    const ask=()=>{const b=document.createElement("button");b.className="upd";b.textContent="✨ יש גרסה חדשה – לחץ לרענון";b.onclick=()=>location.reload();document.body.appendChild(b)};
    reg.addEventListener("updatefound",()=>{const w=reg.installing;w&&w.addEventListener("statechange",()=>{if(w.state==="activated"&&navigator.serviceWorker.controller)ask()})});
    document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")reg.update().catch(()=>{})});
  }).catch(()=>{});
}
window.hardRefresh=async()=>{try{const ks=await caches.keys();await Promise.all(ks.filter(k=>k!=="lr-tiles").map(k=>caches.delete(k)));const rs=await navigator.serviceWorker.getRegistrations();await Promise.all(rs.map(r=>r.unregister()))}catch(e){}location.reload()};
})();
