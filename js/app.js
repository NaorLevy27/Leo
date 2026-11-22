/* Leonida Route – the app. Pages: home, list, item, map, guides, settings. */
(async function(){
"use strict";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const bdi=s=>`<bdi>${esc(s)}</bdi>`;
const S=Store.S;

/* ---------- data ---------- */
const [D,LD,EX]=await Promise.all([fetch("data/items.json").then(r=>r.json()),fetch("data/locs.json").then(r=>r.json()),fetch("data/extra.json").then(r=>r.ok?r.json():{}).catch(()=>({}))]);
/* daily discoveries: extra.json items use the same shape; same id = update an existing item */
(EX.items||[]).forEach(e=>{const i=D.items.findIndex(x=>x.id===e.id);if(i>=0)D.items[i]=Object.assign(D.items[i],e);else{e.g=e.g||["egg"];e.c=e.c||1;e.pos=e.pos==null?9999:e.pos;e.s=e.s||e.id.toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,60);e.isNew=1;D.items.push(e)}});
const NEWS=(EX.news||[]).slice().sort((a,b)=>a.d<b.d?1:-1);
D.items.forEach(x=>x.ord=x.c*100000+x.pos);const IT=D.items.sort((a,b)=>a.ord-b.ord);
const BY={},BYS={};IT.forEach(x=>{BY[x.id]=x;BYS[x.s]=x});
const KINDS=LD.kinds;
const LOCS=LD.locs.map(a=>({id:a[0],k:a[1],x:a[2],y:a[3],n:a[4],t:a[5],d:a[6],a:a[7]}));
const LBY={};LOCS.forEach(l=>LBY[l.id]=l);
const STORY=IT.filter(x=>x.story);

const CAT={story:["סיפור","📖"],side:["משימות צד","🎭"],op:["מבצעי כנופיות","💼"],collect:["אספנות","🃏"],event:["אירועים אקראיים","🎲"],money:["כסף","💵"],vehicle:["רכבים","🚗"],weapon:["נשקים","🔫"],egg:["ביצי פסחא","🥚"],tip:["טיפים","💡"]};
const KTE={card:"🃏",mag:"📚",book:"📖",med:"🧘",dive:"🤿",flam:"🦩",drone:"🛸",wink:"📷",other:"✨"};
const WHO={J:"Jason",L:"Lucia",B:"שניהם"};
const mainCat=x=>x.story?"story":(x.g.find(g=>g!=="tip"&&CAT[g])||x.g[0]||"side");

/* ---------- derived state ---------- */
const done=x=>Store.done(x.id);
const BYNE={};IT.forEach(x=>{if(!BYNE[x.ne]||x.story)BYNE[x.ne]=x});
const STORYN=STORY.map(x=>x.ne).sort((a,b)=>b.length-a.length);
function ref(str){if(!str)return null;if(BYNE[str])return BYNE[str];const n=STORYN.find(n=>str.includes(n));return n?BYNE[n]:null}
function nextStory(){return STORY.find(x=>!done(x))}
function curCh(){const n=nextStory();return n?n.c:5}
/* availability: now | later (unlocks after a mission you haven't done) | missed (its window closed) */
function avail(x){
  if(done(x))return "done";
  for(const f of ["bf","dl","lim"]){const r=ref(x[f]);if(r&&r!==x&&done(r))return "missed"}
  const a=ref(x.af);if(a&&a!==x&&!done(a))return "later";
  if(x.story){const n=nextStory();if(n&&x.ord>n.ord)return "later"}
  return "now";
}
function locked(x){
  if(!S.spoil||done(x))return false;
  if(x.c>curCh())return true;
  const n=nextStory();
  if(x.story&&n&&x.ord>n.ord)return true;
  const a=ref(x.af);if(a&&a.story&&!done(a)&&n&&a.ord>n.ord)return true;
  return false;
}
function title(x){return locked(x)?(x.story?`🔒 משימת סיפור בהמשך`:`🔒 נפתח בהמשך (פרק ${x.c})`):x.n}
function missable(x){return !!x.m}
function timed(x){return !!x.soon}
function untilName(x){const r=ref(x.bf)||ref(x.dl)||ref(x.lim);return r&&!locked(r)?r.n:null}
function forever(x){return !!x.pers&&!x.m}
function nextPonr(){const n=nextStory();if(!n)return null;return STORY.find(x=>x.ord>=n.ord&&x.ponr)}

function glyph(x,extra=""){
  const c=mainCat(x),d=done(x)?" done":"",t=timed(x)?" time":missable(x)?" miss":"",ms=avail(x)==="missed"?" missed":"";
  const lt=locked(x)?"":(x.w&&x.w.length===1?x.w:"");
  if(c==="story")return `<span class="gl ${x.opt?"opt":"story"}${t}${d}${ms}${extra}">${esc(lt)}</span>`;
  if(c==="side")return `<span class="gl side${t}${d}${ms}${extra}">${esc(lt)}</span>`;
  const e=locked(x)?"🔒":(x.t&&KTE[x.t]||CAT[c]&&CAT[c][1]||"•");
  return `<span class="gl coll${t}${d}${ms}${extra}">${e}</span>`;
}
function tags(x,max=3){
  const a=[],av=avail(x);
  if(av==="missed")a.push(`<span class="tag gone">❌ פוספס</span>`);
  if(av==="later"&&!x.story){const r=ref(x.af);a.push(`<span class="tag">🔒 אחרי ${locked(x)?"משימה בהמשך":bdi(r?r.n:x.af)}</span>`)}
  if(x.isNew)a.push(`<span class="tag ex">🆕 חדש</span>`);
  if(x.ponr)a.push(`<span class="tag ponr">⚠ אל־חזור</span>`);
  if(av!=="missed"&&av!=="done"){if(timed(x))a.push(`<span class="tag soon">⏳ עלול להיגמר בקרוב</span>`);else if(missable(x)){const u=untilName(x);a.push(`<span class="tag miss">❗ אפשר לפספס${u?` · עד ${bdi(u)}`:""}</span>`)}else if(forever(x))a.push(`<span class="tag ok">♾ אפשר גם בהמשך</span>`)}
  if(x.veh)a.push(`<span class="tag">🚗 רכב</span>`);
  return a.slice(0,max).join("");
}
function sub(x){
  const parts=[`פרק ${x.c}`];
  const c=mainCat(x);if(c!=="story")parts.push(CAT[c]?CAT[c][0]:c);
  if(x.w&&WHO[x.w]&&!locked(x))parts.push(WHO[x.w]);
  if(!locked(x)&&x.loc)parts.push(x.loc[x.loc.length-1].split(" – ")[0]);
  return parts.join(" · ");
}
function row(x,cls=""){
  const av=avail(x);
  return `<a class="row ${cls}${done(x)?" done":""}${av==="missed"?" gone":""}${av==="later"?" later":""}${locked(x)?" locked":""}" href="#/i/${x.s}">${glyph(x)}<div class="t"><b>${bdi(title(x))}</b><small>${esc(sub(x))}</small>${S.casual?"":`<div class="tg">${tags(x,2)}</div>`}</div>${S.casual?"":`<button class="chk${done(x)?" on":""}" data-chk="${esc(x.id)}" aria-label="סמן">✓</button>`}</a>`;
}

/* ---------- ui helpers ---------- */
let toastT;function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("on");clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove("on"),1800)}
function openSheet(html){$("#sheet").innerHTML=`<div class="grab"></div>`+html;$("#sheet").classList.add("on");$("#scrim").classList.add("on");$("#sheet").scrollTop=0}
function closeSheet(){$("#sheet").classList.remove("on");$("#scrim").classList.remove("on")}
$("#scrim").onclick=closeSheet;
let touchY=null;$("#sheet").addEventListener("touchstart",e=>{touchY=$("#sheet").scrollTop<=0?e.touches[0].clientY:null},{passive:true});
$("#sheet").addEventListener("touchend",e=>{if(touchY!=null&&e.changedTouches[0].clientY-touchY>90)closeSheet();touchY=null});
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-chk]");
  if(b){e.preventDefault();e.stopPropagation();const x=BY[b.dataset.chk];const on=Store.toggle(x.id);toast(on?"✓ סומן – כל הכבוד":"הסימון הוסר");refreshSoft();return}
  const l=e.target.closest("[data-lchk]");
  if(l){e.preventDefault();const k="L:"+l.dataset.lchk;Store.set(k,!Store.done(k));toast(Store.done(k)?"✓ נמצא":"הסימון הוסר");refreshSoft();return}
  const v=e.target.closest(".vid .ph");if(v){v.outerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${v.dataset.id}?autoplay=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;}
});
function refreshSoft(){const y=scrollY;route(true);scrollTo(0,y);if(mapReady)drawPins()}

/* ---------- pages ---------- */
function pct(a,b){return b?Math.round(a/b*100):0}
function ring(p,label){const r=40,c=2*Math.PI*r;return `<svg class="ring" viewBox="0 0 96 96"><circle cx="48" cy="48" r="${r}" fill="none" stroke="#1a1020" stroke-width="9"/><circle cx="48" cy="48" r="${r}" fill="none" stroke="url(#rg)" stroke-width="9" stroke-linecap="round" stroke-dasharray="${c*p/100} ${c}" transform="rotate(-90 48 48)"/><defs><linearGradient id="rg"><stop offset="0" stop-color="#ff9a3c"/><stop offset="1" stop-color="#ff3d8b"/></linearGradient></defs><text x="48" y="52" text-anchor="middle">${p}%</text><text class="s" x="48" y="68" text-anchor="middle">${esc(label)}</text></svg>`}

function pageHome(){
  const n=nextStory(),ch=curCh();
  const all=IT.filter(x=>!x.tip),dn=all.filter(done).length;
  const st=STORY.filter(done).length;
  const pr=nextPonr();
  const soon=IT.filter(x=>avail(x)==='now'&&(missable(x)||timed(x))&&x.c===ch&&!locked(x)&&(!pr||x.ord<=pr.ord+0.5)).sort((a,b)=>(timed(b)-timed(a))||(a.ord-b.ord)).slice(0,6);
  const near=n?IT.filter(x=>avail(x)==='now'&&!locked(x)&&!x.story&&x.p===n.p&&!x.tip).slice(0,4):[];
  let h=`<section class="hero"><div class="kick">Leo · פרק ${ch}</div><h1>${S.casual?"מה יש לגלות היום?":(n?"ממשיכים מאיפה שעצרת":"סיימת את הסיפור! 🎉")}</h1>`;
  if(!S.casual){
    h+=`<div class="ringrow">${ring(pct(dn,all.length),"מכל המשחק")}<div class="stat3"><div><b>${st}/${STORY.length}</b><span>סיפור</span></div><div><b>${dn}</b><span>סומנו</span></div><div><b>${soon.length}</b><span>ייסגרו בקרוב</span></div></div></div>`;
  }
  if(n){h+=`<a class="cont" href="#/i/${n.s}">${glyph(n)}<div class="t"><span class="dim" style="font-size:12px;font-weight:800">המשימה הבאה</span><b>${bdi(n.n)}</b><span class="muted" style="font-size:12.5px">${esc(sub(n))}</span></div><span class="go">‹</span></a>`}
  h+=`</section>`;
  if(pr&&!S.casual)h+=`<div class="blk warn" style="margin-top:12px"><h3><span class="e">⚠</span>לפני <bdi>${esc(pr.n)}</bdi></h3><p class="muted" style="margin:0">זו נקודת אל־חזור. כדאי לסיים קודם את מה שמסומן ⏳ למטה.</p></div>`;
  if(soon.length&&!S.casual)h+=`<div class="sec"><h2>⏳ לפני שזה נגמר</h2><a href="#/list?miss=1">הכל</a></div>`+soon.map(row).join("");
  if(near.length&&!S.casual)h+=`<div class="sec"><h2>📍 באותו אזור</h2></div>`+near.map(row).join("");
  if(S.casual){
    const pick=IT.filter(x=>!locked(x)&&(x.g.includes("egg")||x.g.includes("event"))).sort(()=>Math.random()-.5).slice(0,5);
    h+=`<div class="sec"><h2>🥚 דברים מגניבים לגלות</h2></div>`+pick.map(row).join("");
  }
  if(NEWS.length)h+=`<div class="sec"><h2>🆕 מה חדש</h2><span class="dim" style="font-size:12px">מתעדכן כל יום</span></div><div class="card">${NEWS.slice(0,4).map(n=>`<div style="display:flex;gap:10px;padding:6px 0"><span class="dim ltr" style="font-size:12px;flex:none">${esc(n.d.slice(5).split("-").reverse().join("/"))}</span><span>${n.s?`<a href="#/i/${esc(n.s)}">${esc(n.t)}</a>`:esc(n.t)}</span></div>`).join("")}</div>`;
  h+=`<div class="sec"><h2>לפי סוג</h2><a href="#/list">לרשימה</a></div><div class="grid2">`;
  for(const c in CAT){if(c==="tip")continue;const a=IT.filter(x=>mainCat(x)===c);if(!a.length)continue;const d=a.filter(done).length;
    h+=`<a class="catcard" href="#/list?cat=${c}"><div class="h"><span>${CAT[c][1]}</span>${CAT[c][0]}</div>${S.casual?`<span class="dim" style="font-size:12px">${a.length} פריטים</span>`:`<div class="bar"><i style="width:${pct(d,a.length)}%"></i></div><span class="dim" style="font-size:12px">${d}/${a.length}</span>`}</a>`}
  h+=`</div>`;
  if(!S.casual){h+=`<div class="sec"><h2>לפי פרק</h2></div>`;
    for(let c=1;c<=5;c++){const a=IT.filter(x=>x.c===c&&!x.tip),d=a.filter(done).length;h+=`<a class="chrow" href="#/list?ch=${c}"><span class="n">פרק ${c}</span><div class="bar"><i style="width:${pct(d,a.length)}%"></i></div><span class="p">${pct(d,a.length)}%</span></a>`}}
  h+=`<div class="sec"><h2>מדריכים קצרים</h2><a href="#/guides">הכל</a></div>`+GUIDES.slice(0,3).map(gcard).join("");
  return h;
}

/* ---------- missions list: tabs + organized filter sheet + chapter timeline ---------- */
const TABS=[["all","הכל","✨"],["story","סיפור","📖"],["side","משימות צד","🎭"],["op","כנופיות","💼"],["collect","אספנות","🃏"],["event","אירועים","🎲"],["more","עוד","⭐"]];
const MORE=["money","vehicle","weapon","egg","tip"];
const LF=Object.assign({tab:"all",ch:0,q:"",stat:"",avail:"",miss:0,kt:{},ex:{},open:{}},S.lists2||{});
function inTab(x){const c=mainCat(x);if(LF.tab==="all")return !x.tip;if(LF.tab==="more")return MORE.includes(c)||x.g.some(g=>MORE.includes(g));return c===LF.tab||x.g.includes(LF.tab)}
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
  const qq=LF.q.trim().toLowerCase();
  if(qq&&(locked(x)||!((x.n+" "+x.ne+" "+(x.sp||"")+" "+(x.loc||[]).join(" ")).toLowerCase().includes(qq))))return false;
  return true;
}
function nFilters(){return (LF.ch?1:0)+(LF.stat?1:0)+(LF.avail?1:0)+(LF.miss?1:0)+Object.values(LF.ex).filter(Boolean).length+Object.values(LF.kt).filter(Boolean).length}
const STL={"":"הכל",open:"עוד לא עשיתי",done:"עשיתי",missed:"פוספס"};
function pageList(q){
  if(q.cat){const t=TABS.find(t=>t[0]===q.cat);LF.tab=t?q.cat:(MORE.includes(q.cat)?"more":"all")}if(q.ch)LF.ch=+q.ch;if(q.miss){LF.miss=1;LF.tab="all"}
  const list=IT.filter(passes);
  let h=`<div class="search"><span>🔎</span><input id="q" placeholder="חפש משימה, מקום, רכב…" value="${esc(LF.q)}">${LF.q?`<button id="qx" class="dim">✕</button>`:""}</div>`;
  h+=`<div class="tabs">`+TABS.map(t=>`<button class="tab${LF.tab===t[0]?" on":""}" data-tab="${t[0]}"><span>${t[2]}</span>${t[1]}</button>`).join("")+`</div>`;
  const nf=nFilters();
  h+=`<div class="fbar"><button class="fbtn${nf?" on":""}" id="fopen">⚙ סינון${nf?` <b>${nf}</b>`:""}</button><button class="fbtn${LF.ch?" on":""}" id="fch">📚 ${LF.ch?"פרק "+LF.ch:"כל הפרקים"} ▾</button>${S.casual?"":`<button class="fbtn${LF.avail==="now"?" on":""}" id="fnow">✅ זמין עכשיו</button>`}</div>`;
  const act=[];
  if(LF.stat)act.push([`מצב: ${STL[LF.stat]}`,"stat"]);if(LF.miss)act.push(["⏳❗ רק מה שעלול להיעלם","miss"]);
  for(const k in LF.ex)if(LF.ex[k])act.push([`בלי ${CAT[k][0]}`,"ex:"+k]);
  for(const k in LF.kt)if(LF.kt[k])act.push([`${LF.kt[k]===2?"בלי ":""}${D.KT[k][0]}`,"kt:"+k]);
  if(act.length)h+=`<div class="chips act">`+act.map(a=>`<button class="chip on" data-rm="${a[1]}">${esc(a[0])} ✕</button>`).join("")+`<button class="chip" data-rm="all">נקה הכל</button></div>`;
  h+=`<div class="dim cnt">${list.length} תוצאות</div>`;
  if(!list.length)return h+`<div class="empty">אין תוצאות.<br><button class="btn sm" data-rm="all" style="margin-top:10px">נקה פילטרים</button></div>`;
  const cur=curCh();
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
function filterSheet(){
  const tri=v=>v===1?" on":v===2?" not":"";
  let h=`<h3 style="font-size:19px;margin:0 0 4px">סינון</h3><p class="dim" style="margin:0 0 10px;font-size:12.5px">בחר מה לראות. הכל נשמר אוטומטית.</p>`;
  h+=`<div class="fsec"><b>פרק</b><div class="seg wide">`+[0,1,2,3,4,5].map(c=>`<button data-fc="${c}" class="${LF.ch===c?"on":""}">${c?c:"הכל"}</button>`).join("")+`</div></div>`;
  h+=`<div class="fsec"><b>מצב</b><div class="seg wide">`+Object.keys(STL).map(k=>`<button data-fs="${k}" class="${LF.stat===k?"on":""}">${STL[k]}</button>`).join("")+`</div></div>`;
  h+=`<div class="fsec"><div class="set" style="padding:6px 0;border:0"><div class="t"><b>רק מה שזמין עכשיו</b><small>מסתיר מה שעוד לא נפתח ומה שפוספס</small></div><button class="sw${LF.avail==="now"?" on":""}" data-fa></button></div>
  <div class="set" style="padding:6px 0;border:0"><div class="t"><b>⏳❗ רק מה שעלול להיעלם</b><small>זמן מוגבל + דברים שנעלמים בנקודה מסוימת</small></div><button class="sw${LF.miss?" on":""}" data-fm></button></div></div>`;
  h+=`<div class="fsec"><b>להסתיר סוגים</b><div class="chips wrap">`+Object.keys(CAT).filter(k=>k!=="tip").map(k=>`<button class="chip${LF.ex[k]?" not":""}" data-fx="${k}">${CAT[k][1]} ${CAT[k][0]}</button>`).join("")+`</div></div>`;
  if(LF.tab==="collect"||LF.tab==="all")h+=`<div class="fsec"><b>סוגי אספנות</b><small class="dim" style="display:block;margin:-2px 0 6px">לחיצה = רק זה · פעמיים = הכל חוץ מזה</small><div class="chips wrap">`+Object.keys(D.KT).map(k=>`<button class="chip${tri(LF.kt[k])}" data-fk="${k}">${KTE[k]||""} ${esc(D.KT[k][0])}</button>`).join("")+`</div></div>`;
  h+=`<div class="fact"><button class="btn" data-rm="all">נקה</button><button class="btn pri" id="fdone">הצג ${IT.filter(passes).length} תוצאות</button></div>`;
  openSheet(h);
  const re=()=>{Store.setS("lists2",LF);filterSheet();route(true)};
  $$("[data-fc]").forEach(b=>b.onclick=()=>{LF.ch=+b.dataset.fc;re()});
  $$("[data-fs]").forEach(b=>b.onclick=()=>{LF.stat=b.dataset.fs;re()});
  $$("[data-fa]").forEach(b=>b.onclick=()=>{LF.avail=LF.avail?"":"now";re()});
  $$("[data-fm]").forEach(b=>b.onclick=()=>{LF.miss=LF.miss?0:1;re()});
  $$("[data-fx]").forEach(b=>b.onclick=()=>{LF.ex[b.dataset.fx]=!LF.ex[b.dataset.fx];re()});
  $$("[data-fk]").forEach(b=>b.onclick=()=>{const k=b.dataset.fk;LF.kt[k]=((LF.kt[k]||0)+1)%3;if(!LF.kt[k])delete LF.kt[k];re()});
  $("#fdone").onclick=closeSheet;
  bindRm();
}
function bindRm(){$$("[data-rm]").forEach(b=>b.onclick=()=>{const r=b.dataset.rm;
  if(r==="all"){LF.ch=0;LF.stat="";LF.avail="";LF.miss=0;LF.ex={};LF.kt={};LF.q=""}
  else if(r==="stat")LF.stat="";else if(r==="miss")LF.miss=0;else if(r.startsWith("ex:"))LF.ex[r.slice(3)]=false;else if(r.startsWith("kt:"))delete LF.kt[r.slice(3)];
  Store.setS("lists2",LF);if($("#sheet").classList.contains("on"))filterSheet();route(true)})}
function bindList(){
  const save=()=>{Store.setS("lists2",LF);route(true)};
  $$("[data-tab]").forEach(b=>b.onclick=()=>{LF.tab=b.dataset.tab;LF.kt={};save()});
  $("#fopen").onclick=filterSheet;
  $("#fch").onclick=()=>{openSheet(`<h3 style="font-size:19px;margin:0 0 10px">איזה פרק?</h3>`+[0,1,2,3,4,5].map(c=>`<button class="row" style="width:100%" data-pc="${c}"><div class="t"><b>${c?"פרק "+c:"כל הפרקים"}</b>${c===curCh()?`<small>אתה כאן</small>`:""}</div>${LF.ch===c?"✓":""}</button>`).join(""));$$("[data-pc]").forEach(b=>b.onclick=()=>{LF.ch=+b.dataset.pc;closeSheet();save()})};
  const fn=$("#fnow");if(fn)fn.onclick=()=>{LF.avail=LF.avail?"":"now";save()};
  $$("[data-tog]").forEach(b=>b.onclick=()=>{const c=+b.dataset.tog;const cur=b.parentElement.classList.contains("open");LF.open[c]=!cur;save()});
  bindRm();
  const qx=$("#qx");if(qx)qx.onclick=()=>{LF.q="";save()};
  const q=$("#q");if(q){q.oninput=()=>{LF.q=q.value;clearTimeout(q._t);q._t=setTimeout(()=>{Store.setS("lists2",LF);const p=q.selectionStart;route(true);const n=$("#q");n.focus();n.setSelectionRange(p,p)},250)}}
}

/* item page */
function vehText(x){
  const a=[];
  if(x.k)a.push(`<p><b>${esc(x.k)}</b></p>`);
  if(x.c===1)a.push(`<p>בפרק 1 עוד אי אפשר לשמור רכבים – כל רכב גנוב הוא זמני. תזכור את המקום ותחזור אחרי המשימה <b>Moses</b> בפרק 2.</p>`);
  else if(x.c===2)a.push(`<p>סרוק את הרכב באפליקציית <b>WAiNK</b>:<br>⚪ בלי טרקר → המוסך של <b>Moses</b> ב־Port Gellhorn (צביעה ואז Register).<br>🟡 טרקר רגיל → אפשר רק מפרק 3, ב־Pay 'n' Spray.<br>🔴 טרקר מתקדם → אי אפשר לשמור.</p>`);
  else a.push(`<p>סרוק באפליקציית <b>WAiNK</b>:<br>⚪ בלי טרקר / 🟡 טרקר רגיל → כל <b>Pay 'n' Spray</b> (צביעה ואז Register). מחיר הרישום מופיע בסריקה.<br>🔴 טרקר מתקדם → רק דרך הרשימה של Randy.</p>`);
  a.push(`<p class="muted" style="margin:0">אחרי הרישום – החנה במוסך (נפתח ב־Daily Driver). רכב לא רשום נעלם בסוף, גם במוסך. <a href="#/g/keep-cars">המדריך המלא ›</a></p>`);
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
function pageItem(slug){
  const x=BYS[slug];if(!x)return `<div class="empty">לא נמצא</div>`;
  if(locked(x))return `<div class="ihead"><div class="meta"><span class="tag">פרק ${x.c}</span></div><h1>🔒 מוסתר כדי לא לספיילר</h1><p class="muted">זה תוכן מפרק ${x.c}, ואתה עכשיו בפרק ${curCh()}.</p><button class="btn pri wide" id="unspoil">הצג בכל זאת</button><p class="dim" style="font-size:12.5px;margin-top:10px">אפשר לכבות את ההסתרה בהגדרות.</p></div>`;
  const c=mainCat(x);
  let h=`<div class="ihead"><div class="meta">${glyph(x)}<span class="tag">${CAT[c]?CAT[c][1]+" "+CAT[c][0]:""}</span><span class="tag">פרק ${x.c}</span>${x.w&&WHO[x.w]?`<span class="tag">👤 ${WHO[x.w]}</span>`:""}${tags(x,4)}</div>
  <h1>${bdi(x.n)}</h1>${x.ne&&x.ne!==x.n?`<div class="en ltr">${esc(x.ne)}</div>`:""}
  ${S.casual?"":`<button class="bigchk${done(x)?" on":""}" data-chk="${esc(x.id)}">${done(x)?"✓ עשיתי את זה":"סמן שעשיתי ✓"}</button>`}</div>`;
  /* what you get */
  const rw=x.rw||x.why;
  if(rw||x.nt)h+=`<div class="blk reward"><h3><span class="e">🎁</span>מה מקבלים</h3>${rw?`<p>${esc(rw)}</p>`:""}${x.nt&&x.nt!==rw?`<p class="muted" style="font-weight:500">${esc(x.nt)}</p>`:""}</div>`;
  if(x.d&&!x.steps)h+=`<div class="blk"><h3><span class="e">🎯</span>מה עושים</h3><p>${esc(x.d)}</p></div>`;
  /* when */
  const wh=[];
  if(x.af)wh.push(["נפתח אחרי",x.af]);if(x.in)wh.push(["במהלך",x.in]);if(x.prev)wh.push(["משימה קודמת",x.prev]);
  if(x.bf)wh.push(["נעלם אחרי",x.bf]);if(x.dl&&x.dl!==x.bf)wh.push(["תעשה לפני",x.dl]);if(x.lim)wh.push(["אחרון אפשרי",x.lim]);
  const linkM=n=>{const y=IT.find(z=>z.ne===n);return y?`<a href="#/i/${y.s}">${bdi(y.n)}</a>`:bdi(n)};
  h+=`<div class="blk"><h3><span class="e">🕒</span>מתי לעשות</h3>`;
  if(x.ponr)h+=`<p class="tag ponr" style="display:block;padding:8px 10px;margin-bottom:8px">⚠ נקודת אל־חזור – שמור לפני ותסיים קודם את מה שמסומן ⏳ בפרק</p>`;
  const av=avail(x);
  if(av==="missed")h+=`<p class="tag gone" style="display:block;padding:8px 10px;margin-bottom:8px">❌ פוספס – החלון של זה נסגר כשסיימת את <bdi>${esc((ref(x.bf)||ref(x.dl)||ref(x.lim)||{}).n||"")}</bdi>. אם עשית בכל זאת – סמן ✓.</p>`;
  else if(av==="later"&&!x.story)h+=`<p class="tag" style="display:block;padding:8px 10px;margin-bottom:8px">🔒 עוד לא זמין – נפתח אחרי <bdi>${esc((ref(x.af)||{}).n||x.af)}</bdi></p>`;
  if(timed(x)&&av!=="missed")h+=`<p><b style="color:var(--gold)">⏳ עלול להיגמר בקרוב</b> – הצעה עם זמן מוגבל (שעון חול / שיחת טלפון). כדאי לעשות עכשיו, לפני שממשיכים בסיפור.</p>`;
  else if(missable(x)&&av!=="missed"){const u=untilName(x);h+=`<p><b style="color:#ff9a9a">❗ אפשר לפספס</b> – ${u?`נעלם אחרי <bdi>${esc(u)}</bdi>. יש לך זמן עד אז, אבל לא אחרי.`:"אם לא עושים בזמן, זה נעלם לתמיד."}</p>`}
  else if(forever(x))h+=`<p><b style="color:var(--green)">♾ אפשר גם בהמשך</b> – לא צריך למהר.</p>`;
  h+=wh.length?`<dl class="kv">${wh.map(([a,b])=>`<dt>${a}</dt><dd>${linkM(b)}</dd>`).join("")}</dl>`:(x.story?`<p class="muted" style="margin:0">חלק מהסיפור – נפתח לבד כשמגיעים.</p>`:"");
  if(x.wn)h+=`<p class="muted" style="margin-top:6px">${esc(Array.isArray(x.wn)?x.wn[0]:x.wn)}</p>`;
  h+=`</div>`;
  /* steps */
  if(x.steps&&x.steps.length)h+=`<div class="blk"><h3><span class="e">🧭</span>${x.story?"שלב אחרי שלב":"איך עושים"}</h3><ol class="steps">${x.steps.map(s=>`<li><span>${esc(s)}</span></li>`).join("")}</ol>${x.src==="kg"?`<p class="dim" style="font-size:12px;margin:8px 0 0">תקציר כללי. יש לך טיפ? כתוב בתגובות למטה.</p>`:""}</div>`;
  if(x.tips&&x.tips.length)h+=`<div class="blk"><h3><span class="e">💡</span>טיפים</h3><ul class="tips">${x.tips.map(t=>`<li>${esc(t)}</li>`).join("")}</ul></div>`;
  if(x.ch)h+=`<div class="blk"><h3><span class="e">🔀</span>בחירות</h3><p>${esc(x.ch)}</p></div>`;
  if(x.veh)h+=`<div class="blk vehbox"><h3><span class="e">🅿️</span>איך שומרים את הרכב</h3>${vehText(x)}</div>`;
  /* where */
  if(x.loc||x.sp||x.x!=null){
    h+=`<div class="blk"><h3><span class="e">📍</span>איפה בדיוק ${x.x!=null?(x.ex?`<span class="tag ex">📍 מדויק</span>`:`<span class="tag ap">≈ אזור</span>`):""}</h3>`;
    if(x.loc)h+=`<div class="path">${x.loc.map(p=>`<span>${bdi(p)}</span>`).join("")}${x.st?`<span>${bdi(x.st)}</span>`:""}</div>`;
    if(x.sp)h+=`<p>${esc(x.sp)}</p>`;
    if(x.lk)h+=`<p class="muted">👀 איך זה נראה: ${esc(x.lk)}</p>`;
    if(x.x!=null)h+=`<div class="minimap" id="mini"></div><a class="btn sm" style="margin-top:8px" href="#/map?i=${x.s}">פתח במפה הגדולה ›</a>`;
    h+=`</div>`;
  }
  /* videos */
  const vids=(x.v||[]).map(ytId).filter(Boolean);
  if(vids.length||x.q){h+=`<div class="blk"><h3><span class="e">▶</span>סרטון</h3>`+vids.map(id=>`<div class="vid"><div class="ph" data-id="${id}" style="background-image:url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)">▶</div></div>`).join("");
    if(x.q)h+=`<a class="btn sm" style="margin-top:8px" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent("GTA 6 "+x.q)}">חפש עוד סרטונים ב־YouTube</a>`;h+=`</div>`}
  const rel=related(x);if(rel)h+=`<div class="blk"><h3><span class="e">🔗</span>קשור</h3><div class="rel">${rel}</div></div>`;
  h+=commentsBlock("i:"+x.id);
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
  if(!Cloud.on){L.innerHTML=`<p class="muted" style="margin:0">התגובות יופעלו כשהאתר יחובר לשרת (Supabase). ההוראות ב־README.</p>`;return}
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

/* guides */
const gcard=g=>`<a class="gcard" href="#/g/${g.id}"><span class="e">${g.e}</span><div><b>${esc(g.t)}</b><small>${esc(g.d)}</small></div></a>`;
const pageGuides=()=>`<div class="sec" style="margin-top:4px"><h2>מדריכים</h2></div><p class="muted" style="margin-top:0">הכל בפשטות – בלי מונחים מסובכים.</p>`+GUIDES.map(gcard).join("");
function pageGuide(id){const g=GUIDES.find(x=>x.id===id);if(!g)return `<div class="empty">לא נמצא</div>`;return `<div class="ihead"><div class="kick">מדריך · אתה בפרק ${curCh()}</div><h1 style="margin-top:4px">${g.e} ${esc(g.t)}</h1></div><div class="blk gbody" id="gbody">${g.h}</div>${commentsBlock("g:"+g.id)}`}
/* parts of a guide marked data-ch="N" stay closed until you reach chapter N */
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
function pageSettings(){
  let h=`<div class="sec" style="margin-top:4px"><h2>⚙ הגדרות</h2></div>`;
  h+=`<div class="card cardlist">${accountBlock()}</div>`;
  h+=`<div class="sec"><h2>תצוגה</h2></div><div class="card cardlist">`+
    sw("spoil","בלי ספוילרים","מסתיר שמות ופרטים של משימות מפרקים שעוד לא הגעת אליהם.")+
    sw("casual","מצב 'סתם מתעניין'","בלי סימונים ואחוזים – רק לגלות ולקרוא.")+`</div>`;
  h+=`<div class="sec"><h2>מפה</h2></div><div class="card cardlist">`+
    sw("hideDone","הסתר מה שעשיתי","סיכות של דברים שסימנת לא יופיעו במפה.")+
    sw("upTo","רק עד הפרק שלי","מראה במפה רק דברים שכבר אפשר לעשות.")+
    sw("exactOnly","רק מיקומים מדויקים","מסתיר סיכות שהן אזור משוער.")+
    `<div class="set"><div class="t"><b>סגנון מפה</b><small>המפה של המשחק, או מפה מקורית שציירנו (טובה לשיתוף פומבי).</small></div><div class="seg"><button data-ms="rockstar" class="${S.mapStyle==="rockstar"?"on":""}">משחק</button><button data-ms="original" class="${S.mapStyle==="original"?"on":""}">מקורית</button></div></div></div>`;
  h+=`<div class="sec"><h2>ההתקדמות שלך</h2></div><div class="card cardlist">
   <div class="set"><div class="t"><b>קוד התקדמות</b><small>העתק כגיבוי, או הדבק קוד מהגרסה הקודמת של האתר. מיזוג – לא מוחק כלום.</small></div></div>
   <div style="padding:0 14px 14px"><textarea class="in" id="code" placeholder="הדבק כאן קוד…"></textarea><div style="display:flex;gap:8px;margin-top:8px"><button class="btn sm" id="cpy">📋 העתק את הקוד שלי</button><button class="btn sm pri" id="imp">ייבא</button></div></div></div>`;
  h+=`<p class="dim" style="font-size:12px;margin:18px 4px">מפה ונתוני מיקום: <a href="https://github.com/fbritoferreira/gta6" target="_blank" rel="noopener">Open GTA 6 Map</a> (CC BY 4.0). אומנות המפה © Rockstar Games. אתר מעריצים, לא רשמי.</p>`;
  return h;
}
function accountBlock(){
  if(!Cloud.on)return `<div class="set"><div class="t"><b>☁ חשבון</b><small>ההתקדמות נשמרת במכשיר הזה. הרשמה תיפתח כשהאתר יחובר לשרת.</small></div></div>`;
  if(!Cloud.user)return `<div class="set"><div class="t"><b>☁ שמור את ההתקדמות בכל מכשיר</b><small>הרשמה חינם – וגם אפשר להגיב ולתת טיפים.</small></div></div><div style="padding:0 14px 14px;display:flex;flex-direction:column;gap:8px"><button class="btn pri wide" id="g">המשך עם Google</button><div style="display:flex;gap:8px"><input class="in" id="em" type="email" placeholder="או מייל – נשלח קישור כניסה" dir="ltr"><button class="btn" id="emb">שלח</button></div></div>`;
  const st={sync:"מסנכרן…",on:"מסונכרן ✓",err:"שגיאת סנכרון",off:""}[Cloud.status]||"";
  return `<div class="set"><div class="t"><b>👤 ${bdi(Cloud.profile&&Cloud.profile.name||Cloud.user.email)}</b><small>${esc(Cloud.user.email||"")} · ${st}</small></div><button class="btn sm" id="ren">שנה שם</button><button class="btn sm" id="out">יציאה</button></div>`;
}
function bindSettings(){
  $$("[data-sw]").forEach(b=>b.onclick=()=>{const k=b.dataset.sw;Store.setS(k,!S[k]);b.classList.toggle("on",S[k]);b.setAttribute("aria-checked",S[k]);if(mapReady)drawPins();toast("נשמר")});
  $$("[data-ms]").forEach(b=>b.onclick=()=>{Store.setS("mapStyle",b.dataset.ms);$$("[data-ms]").forEach(x=>x.classList.toggle("on",x===b));if(mapReady)setBase();toast("נשמר")});
  $("#cpy").onclick=async()=>{const c=Store.code();try{await navigator.clipboard.writeText(c);toast("הקוד הועתק")}catch(e){$("#code").value=c;$("#code").select()}};
  $("#imp").onclick=()=>{try{const n=Store.fromCode($("#code").value);toast(`יובאו ${n} סימונים ✓`);$("#code").value=""}catch(e){toast("הקוד לא תקין")}};
  const g=$("#g");if(g)g.onclick=()=>Cloud.google();
  const eb=$("#emb");if(eb)eb.onclick=async()=>{const v=$("#em").value.trim();if(!v.includes("@"))return toast("מייל לא תקין");const r=await Cloud.email(v);toast(r.error?"שגיאה בשליחה":"שלחנו קישור למייל ✉")};
  const o=$("#out");if(o)o.onclick=()=>Cloud.out();
  const rn=$("#ren");if(rn)rn.onclick=async()=>{const n=prompt("השם שיופיע בתגובות:",Cloud.profile&&Cloud.profile.name||"");if(n)await Cloud.rename(n.slice(0,40))};
}
Cloud.sub(()=>{if(curPage==="settings")route(true)});

/* ---------- map ---------- */
/* ---------- crisp vector map (land, buildings, roads, labels) – sharp at any zoom ---------- */
let VEC=null,vecP=null;
const loadVec=()=>vecP||(vecP=fetch("data/vec.json").then(r=>r.json()).then(d=>VEC=d));
const VSTY={urban:"#ebe4f4",park:"#92d692",sand:"#f3e2b3",shallow:"#6adede",paved:"#e6e0d6",building:"#d0c1e6"};
const RSTY={highway:["#fee187","#d9ae3c",2.4],main:["#fee8a0","#dcc078",1.8],street:["#fffdf6","#d6cab0",1.3],minor:["#ffffff","#dcd0b8",.9]};
function addVector(m,opts={}){
  const ren=L.canvas({padding:.4,tolerance:0});
  const pane=m.createPane("vec");pane.style.zIndex=250;
  const g=L.layerGroup();const roads={};
  const ll=pts=>pts.map(p=>[-p[1],p[0]]);
  VEC.land.forEach(poly=>{const rings=Array.isArray(poly[0][0])?poly.map(ll):[ll(poly)];g.addLayer(L.polygon(rings,{renderer:ren,pane:"vec",stroke:false,fillColor:"#f8ecd0",fillOpacity:1,interactive:false,smoothFactor:.5}))});
  ["shallow","sand","urban","park","paved","building"].forEach(k=>(VEC.surf[k]||[]).forEach(r=>g.addLayer(L.polygon(r.map(ll),{renderer:ren,pane:"vec",stroke:k==="building",color:"#bfaedb",weight:.6,fillColor:VSTY[k],fillOpacity:1,interactive:false,smoothFactor:.5}))));
  VEC.rails.forEach(l=>g.addLayer(L.polyline(ll(l),{renderer:ren,pane:"vec",color:"#9aa0ad",weight:1.2,dashArray:"4 4",interactive:false})));
  ["minor","street","main","highway"].forEach(k=>{roads[k]={c:[],f:[]};(VEC.roads[k]||[]).forEach(l=>{const a=ll(l);const c=L.polyline(a,{renderer:ren,pane:"vec",color:RSTY[k][1],lineCap:"round",lineJoin:"round",interactive:false,smoothFactor:.6});roads[k].c.push(c);g.addLayer(c)})});
  ["minor","street","main","highway"].forEach(k=>(VEC.roads[k]||[]).forEach((l,i)=>{const f=L.polyline(ll(l),{renderer:ren,pane:"vec",color:RSTY[k][0],lineCap:"round",lineJoin:"round",interactive:false,smoothFactor:.6});roads[k].f.push(f);g.addLayer(f)}));
  const from=opts.from==null?4.75:opts.from;
  function style(){
    const z=m.getZoom();const on=z>=from;
    if(on&&!m.hasLayer(g))g.addTo(m);if(!on&&m.hasLayer(g))m.removeLayer(g);
    if(!on)return;
    const sc=Math.pow(2,z-4.6);
    for(const k in roads){const w=Math.max(1.2,RSTY[k][2]*sc);roads[k].c.forEach(l=>l.setStyle({weight:w+Math.max(1.5,w*.3)}));roads[k].f.forEach(l=>l.setStyle({weight:w}))}
  }
  m.on("zoomend",style);style();
  if(opts.labels!==false)addLabels(m);
  return g;
}
function addLabels(m){
  const pane=m.createPane("labels");pane.style.zIndex=450;pane.style.pointerEvents="none";
  const box=L.DomUtil.create("div","lbls",pane);
  const LB=VEC.lab;
  function draw(){
    const z=m.getZoom(),b=m.getBounds().pad(.1);box.innerHTML="";const taken=[];
    const cand=[];
    if(z<4.6)LB.dist.forEach(d=>cand.push({t:d[0],x:d[1],y:d[2],c:"ld",fs:z<3?13:16,pr:0}));
    if(z>=3.3)LB.hood.forEach(h=>{if(z>=4.4||h[3]>=30)cand.push({t:h[0],x:h[1],y:h[2],c:"lh",fs:z>=6?14:12,pr:1+(h[3]>=30?0:1)})});
    if(z>=3)LB.routes.forEach(r=>cand.push({t:r[0],x:r[2],y:r[3],c:"lr lr-"+r[1],fs:10,pr:2}));
    if(z>=5.8)LB.street.forEach(s=>cand.push({t:s[0],x:s[1],y:s[2],c:"ls",fs:11,pr:3}));
    if(z>=6.4)LB.places.forEach(p=>{if(z>=7.4||["civic","transport","leisure","hotel","nature"].includes(p[1]))cand.push({t:p[0],x:p[2],y:p[3],c:"lp",fs:z>=8?12:10.5,pr:4})});
    cand.sort((a,b)=>a.pr-b.pr);
    let n=0;
    for(const c of cand){
      const lat=-c.y,lng=c.x;if(!b.contains([lat,lng]))continue;
      const pt=m.latLngToLayerPoint([lat,lng]);const w=c.t.length*c.fs*.58+10,h=c.fs+8;
      const r=[pt.x-w/2,pt.y-h/2,pt.x+w/2,pt.y+h/2];
      if(taken.some(t=>!(r[2]<t[0]||r[0]>t[2]||r[3]<t[1]||r[1]>t[3])))continue;
      taken.push(r);
      const e=document.createElement("div");e.className="lb "+c.c;e.textContent=c.t;e.style.cssText=`left:${pt.x}px;top:${pt.y}px;font-size:${c.fs}px`;box.appendChild(e);
      if(++n>260)break;
    }
  }
  m.on("zoomend moveend",draw);draw();
}

let map=null,mapReady=false,layer=null,base=null,mini=null;
const BOUNDS=L.latLngBounds([-800,160],[-160,832]);
const ML=Object.assign({mine:true,cats:{},kinds:{}},S.mapLayers||{});
function setBase(){
  if(base)map.removeLayer(base);
  if(S.mapStyle==="original"){
    const M=window.AFF;const p=(fx,fy)=>[fx*M[0][0]+fy*M[1][0]+M[2][0],fx*M[0][1]+fy*M[1][1]+M[2][1]];
    const a=p(0,0),b=p(1,1);base=L.imageOverlay("map-original.jpg",[[-a[1],a[0]],[-b[1],b[0]]]).addTo(map);
  }else base=L.tileLayer("tiles/day/{z}/{z},{y},{x}.webp",{tileSize:256,minZoom:-1,minNativeZoom:0,maxNativeZoom:5,maxZoom:11,noWrap:true,bounds:BOUNDS,
    attribution:'<a href="https://github.com/fbritoferreira/gta6" target="_blank" rel="noopener">Open GTA 6 Map</a> (CC BY 4.0) · © Rockstar Games'}).addTo(map);
  base.bringToBack&&base.bringToBack();
}
function itemShown(x){
  if(x.x==null||x.tip)return false;
  if(S.hideDone&&done(x))return false;
  if(S.upTo&&x.c>curCh())return false;
  if(locked(x))return false;
  if(S.hideDone&&avail(x)==="missed")return false;
  if(S.exactOnly&&!x.ex)return false;
  const on=Object.keys(ML.cats).filter(k=>ML.cats[k]);
  if(on.length&&!on.includes(mainCat(x)))return false;
  return true;
}
function pinHtml(arr){
  const x=arr[0];const cnt=arr.length>1?`<span class="cnt">${arr.length}</span>`:"";
  if(x.L){const k=KINDS[x.k]||{};return `<div class="mpin" style="position:relative"><span class="edot${Store.done("L:"+x.id)?" done":""}" style="background:${k.c}"></span>${cnt}<span class="pl">${esc(x.n)}</span></div>`}
  const nm=arr.length>1?`${title(x)} +${arr.length-1}`:title(x);
  return `<div class="mpin${x.ex?"":" ap"}" style="position:relative">${glyph(x)}${cnt}<span class="pl">${esc(nm)}</span></div>`;
}
function drawPins(){
  if(!map)return;
  if(layer)map.removeLayer(layer);
  layer=L.markerClusterGroup({maxClusterRadius:38,disableClusteringAtZoom:4,showCoverageOnHover:false,spiderfyOnMaxZoom:false,chunkedLoading:true});
  const groups=new Map();
  const put=(o,x,y)=>{const k=Math.round(x*4)/4+","+Math.round(y*4)/4;if(!groups.has(k))groups.set(k,{x,y,a:[]});groups.get(k).a.push(o)};
  if(ML.mine)IT.filter(itemShown).forEach(x=>put(x,x.x,x.y));
  const kOn=Object.keys(ML.kinds).filter(k=>ML.kinds[k]);
  if(kOn.length)LOCS.filter(l=>kOn.includes(l.k)&&!(S.hideDone&&Store.done("L:"+l.id))).forEach(l=>put(Object.assign({L:1},l),l.x,l.y));
  groups.forEach(g=>{
    g.a.sort((p,q)=>(p.L?1:0)-(q.L?1:0)||(p.story?0:1)-(q.story?0:1));
    const m=L.marker([-g.y,g.x],{icon:L.divIcon({className:"",html:pinHtml(g.a),iconSize:[28,28],iconAnchor:[14,14]})});
    m.on("click",()=>g.a.length===1?preview(g.a[0]):groupSheet(g.a));
    layer.addLayer(m);
  });
  map.addLayer(layer);
  const c=$("#mcount");if(c)c.textContent=[...groups.values()].reduce((s,g)=>s+g.a.length,0);
}
function previewHtml(o){
  if(o.L){const k=KINDS[o.k]||{};const d=Store.done("L:"+o.id);return `<div class="prev"><div class="meta" style="display:flex;gap:6px;flex-wrap:wrap"><span class="tag">${esc(k.i||"")} ${esc(k.n||o.k)}</span>${o.a?`<span class="tag">${bdi(o.a)}</span>`:""}</div><h3>${bdi(o.n)}</h3>${o.d?`<p class="muted ltr" style="text-align:left;font-size:13.5px">${esc(o.d.slice(0,220))}${o.d.length>220?"…":""}</p>`:""}<div class="acts"><a class="btn pri" href="#/l/${encodeURIComponent(o.id)}">לעמוד המלא ›</a><button class="btn${d?" ":""}" data-lchk="${esc(o.id)}">${d?"✓ נמצא":"סמן ✓"}</button></div></div>`}
  const x=o;const lk=locked(x);
  return `<div class="prev"><div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">${glyph(x)}<span class="tag">פרק ${x.c}</span>${x.ex?`<span class="tag ex">📍 מדויק</span>`:`<span class="tag ap">≈ אזור</span>`}${lk?"":tags(x,2)}</div><h3>${bdi(title(x))}</h3>${!lk&&x.sp?`<p class="muted" style="font-size:14px">${esc(x.sp)}</p>`:""}${!lk&&(x.rw||x.why)?`<p style="font-size:14px">🎁 ${esc(x.rw||x.why)}</p>`:""}<div class="acts"><a class="btn pri" href="#/i/${x.s}">לעמוד המשימה ›</a>${S.casual?"":`<button class="btn" data-chk="${esc(x.id)}">${done(x)?"✓ עשיתי":"סמן ✓"}</button>`}</div></div>`;
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
  let h=`<h3 style="font-size:18px;margin:0 0 10px">שכבות במפה</h3><div class="set" style="padding:10px 0"><div class="t"><b>המשימות והפריטים שלי</b><small>כל מה שברשימה – עם הסימונים שלך</small></div><button class="sw${ML.mine?" on":""}" data-ml="mine"></button></div>`;
  for(const g in grp){h+=`<div class="grp">${GN[g]||g}</div><div class="chips" style="flex-wrap:wrap">`+grp[g].map(k=>{const n=LOCS.filter(l=>l.k===k).length;return `<button class="chip${ML.kinds[k]?" on":""}" data-mk="${k}">${esc(KINDS[k].i)} ${esc(KINDS[k].n)} <span class="dim">${n}</span></button>`}).join("")+`</div>`}
  h+=`<p class="dim" style="font-size:12px">השכבות הנוספות הן ${LOCS.length.toLocaleString()} מיקומים מדויקים מ־Open GTA 6 Map.</p>`;
  openSheet(h);
  const save=()=>{Store.setS("mapLayers",ML);drawPins()};
  $$("[data-ml]").forEach(b=>b.onclick=()=>{ML.mine=!ML.mine;b.classList.toggle("on",ML.mine);save()});
  $$("[data-mk]").forEach(b=>b.onclick=()=>{const k=b.dataset.mk;ML.kinds[k]=!ML.kinds[k];b.classList.toggle("on",ML.kinds[k]);save()});
}
function mapChips(){
  const on=k=>ML.cats[k]?" on":"";
  $("#mapbar").innerHTML=`<button class="chip" id="mlay">🗂 שכבות</button>`+["story","side","op","collect","money","vehicle","weapon","event","egg"].map(k=>`<button class="chip${on(k)}" data-mc="${k}">${CAT[k][1]} ${CAT[k][0]}</button>`).join("");
  $("#mlay").onclick=layersSheet;
  $$("[data-mc]").forEach(b=>b.onclick=()=>{const k=b.dataset.mc;ML.cats[k]=!ML.cats[k];b.classList.toggle("on",!!ML.cats[k]);Store.setS("mapLayers",ML);drawPins()});
}
function ensureMap(){
  if(map)return;
  map=L.map("map",{crs:L.CRS.Simple,minZoom:-1,maxZoom:8.5,zoomSnap:0.25,zoomDelta:0.5,wheelPxPerZoomLevel:90,maxBounds:BOUNDS.pad(0.3),zoomControl:false,attributionControl:true});
  map.attributionControl.setPrefix(false);loadVec().then(()=>addVector(map));
  const xs=LOCS.map(l=>l.x),ys=LOCS.map(l=>l.y);window.LAND=L.latLngBounds([-Math.max(...ys),Math.min(...xs)],[-Math.min(...ys),Math.max(...xs)]);map.fitBounds(LAND,{padding:[20,20]});window._map=map;const zc=()=>{const z=map.getZoom();$("#map").classList.toggle("lbl",z>=5.3);$("#map").classList.toggle("lbl2",z>=4.3)};map.on("zoomend",zc);zc();setBase();mapChips();drawPins();mapReady=true;
  $("#zin").onclick=()=>map.zoomIn();$("#zout").onclick=()=>map.zoomOut();$("#zfit").onclick=()=>map.fitBounds(LAND,{padding:[20,20]});
}
function focusMap(q){
  if(q.i&&BYS[q.i]){const x=BYS[q.i];if(x.x!=null){if(!itemShown(x)){ML.mine=true;ML.cats={};drawPins();mapChips()}map.setView([-x.y,x.x],7);setTimeout(()=>preview(x),250)}}
  if(q.l&&LBY[q.l]){const l=LBY[q.l];if(!ML.kinds[l.k]){ML.kinds[l.k]=true;drawPins()}map.setView([-l.y,l.x],7.5);setTimeout(()=>preview(Object.assign({L:1},l)),250)}
}
function drawMini(x,y,o){
  if(mini){mini.remove();mini=null}
  const el=$("#mini");if(!el)return;
  mini=L.map(el,{crs:L.CRS.Simple,minZoom:1,maxZoom:8.5,zoomControl:false,attributionControl:false,maxBounds:BOUNDS.pad(0.2),scrollWheelZoom:false});
  L.tileLayer("tiles/day/{z}/{z},{y},{x}.webp",{tileSize:256,minNativeZoom:0,maxNativeZoom:5,maxZoom:11,noWrap:true,bounds:BOUNDS}).addTo(mini);
  mini.setView([-y,x],o.ex===0?5:7);const mm=mini;loadVec().then(()=>{if(mini===mm)addVector(mm)});
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
  const page={"":"home",list:"list",i:"item",l:"loc",map:"map",guides:"guides",g:"guide",settings:"settings"}[p]||"home";
  curPage=page;
  const isMap=page==="map";
  document.body.classList.toggle("mapmode",isMap);document.body.classList.toggle("sub",["item","loc","guide"].includes(page));
  $("#map").hidden=!isMap;$("#mapbar").hidden=!isMap;$("#mctl").hidden=!isMap;$("#main").hidden=isMap;
  const navKey={home:"home",list:"list",item:"list",loc:"map",map:"map",guides:"guides",guide:"guides",settings:"settings"}[page];
  $$("#nav a").forEach(a=>a.classList.toggle("on",a.dataset.k===navKey));moveLens();
  if(!soft)closeSheet();
  if(isMap){ensureMap();setTimeout(()=>map.invalidateSize(),30);if(!soft)focusMap(q);return}
  let h="";
  if(page==="home")h=pageHome();else if(page==="list")h=pageList(soft?{}:q);else if(page==="item")h=pageItem(parts[1]);
  else if(page==="loc")h=pageLoc(decodeURIComponent(parts[1]||""));else if(page==="guides")h=pageGuides();else if(page==="guide")h=pageGuide(parts[1]);else if(page==="settings")h=pageSettings();
  $("#main").innerHTML=h;
  if(page==="list")bindList();
  if(page==="guide")gateGuide();
  if(page==="settings")bindSettings();
  const un=$("#unspoil");if(un)un.onclick=()=>{Store.setS("spoil",false);route(true)};
  if(page==="item"){const x=BYS[parts[1]];if(x&&x.x!=null&&!locked(x))setTimeout(()=>drawMini(x.x,x.y,x),0);document.title=(x&&!locked(x)?x.n+" · ":"")+"Leo"}else document.title="Leo · המדריך ל־Leonida";
  if(page==="loc"){const l=LBY[decodeURIComponent(parts[1]||"")];if(l)setTimeout(()=>drawMini(l.x,l.y,Object.assign({L:1},l)),0)}
  if(!soft||page==="item"||page==="loc"||page==="guide")loadComments();
  if(!soft)scrollTo(0,0);
}
window.AFF=await fetch("data/affine.json").then(r=>r.json());
addEventListener("hashchange",()=>route());
$("#back").onclick=()=>history.length>1?history.back():(location.hash="#/");
route();
document.body.classList.add("ready");
if("serviceWorker"in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("sw.js").catch(()=>{});
})();
