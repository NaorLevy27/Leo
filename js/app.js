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
function nextStory(){return STORY.find(x=>!done(x))}
function curCh(){const n=nextStory();return n?n.c:5}
function locked(x){return S.spoil&&x.c>curCh()&&(x.story||x.g.includes("side"))}
function title(x){return locked(x)?`🔒 משימה מפרק ${x.c}`:x.n}
function missable(x){return !!x.m}
function forever(x){return !!x.pers&&!x.m}
function nextPonr(){const n=nextStory();if(!n)return null;return STORY.find(x=>x.ord>=n.ord&&x.ponr)}

function glyph(x,extra=""){
  const c=mainCat(x),d=done(x)?" done":"",t=missable(x)?" time":"";
  if(c==="story")return `<span class="gl ${x.opt?"opt":"story"}${t}${d}${extra}">${esc(x.w&&x.w.length===1?x.w:"")}</span>`;
  if(c==="side")return `<span class="gl side${t}${d}${extra}">${esc(x.w&&x.w.length===1?x.w:"")}</span>`;
  const e=x.t&&KTE[x.t]||CAT[c]&&CAT[c][1]||"•";
  return `<span class="gl coll${t}${d}${extra}">${e}</span>`;
}
function tags(x,max=3){
  const a=[];
  if(x.isNew)a.push(`<span class="tag ex">🆕 חדש</span>`);
  if(x.ponr)a.push(`<span class="tag ponr">⚠ אל־חזור</span>`);
  if(missable(x))a.push(`<span class="tag miss">⏳ אפשר לפספס</span>`);
  else if(forever(x))a.push(`<span class="tag ok">♾ אפשר גם בהמשך</span>`);
  if(x.veh)a.push(`<span class="tag">🚗 רכב</span>`);
  return a.slice(0,max).join("");
}
function sub(x){
  const parts=[`פרק ${x.c}`];
  const c=mainCat(x);if(c!=="story")parts.push(CAT[c]?CAT[c][0]:c);
  if(x.w&&WHO[x.w])parts.push(WHO[x.w]);
  if(!locked(x)&&x.loc)parts.push(x.loc[x.loc.length-1].split(" – ")[0]);
  return parts.join(" · ");
}
function row(x){
  return `<a class="row${done(x)?" done":""}${locked(x)?" locked":""}" href="#/i/${x.s}">${glyph(x)}<div class="t"><b>${bdi(title(x))}</b><small>${esc(sub(x))}</small>${S.casual||locked(x)?"":`<div class="tg">${tags(x,2)}</div>`}</div>${S.casual?"":`<button class="chk${done(x)?" on":""}" data-chk="${esc(x.id)}" aria-label="סמן">✓</button>`}</a>`;
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
function ring(p,label){const r=40,c=2*Math.PI*r;return `<svg class="ring" viewBox="0 0 96 96"><circle cx="48" cy="48" r="${r}" fill="none" stroke="#0a1322" stroke-width="9"/><circle cx="48" cy="48" r="${r}" fill="none" stroke="url(#rg)" stroke-width="9" stroke-linecap="round" stroke-dasharray="${c*p/100} ${c}" transform="rotate(-90 48 48)"/><defs><linearGradient id="rg"><stop offset="0" stop-color="#5fe0d2"/><stop offset="1" stop-color="#f08fb0"/></linearGradient></defs><text x="48" y="52" text-anchor="middle">${p}%</text><text class="s" x="48" y="68" text-anchor="middle">${esc(label)}</text></svg>`}

function pageHome(){
  const n=nextStory(),ch=curCh();
  const all=IT.filter(x=>!x.tip),dn=all.filter(done).length;
  const st=STORY.filter(done).length;
  const pr=nextPonr();
  const soon=IT.filter(x=>!done(x)&&missable(x)&&x.c===ch&&(!pr||x.ord<=pr.ord+0.5)).slice(0,5);
  const near=n?IT.filter(x=>!done(x)&&!x.story&&x.p===n.p&&!x.tip).slice(0,4):[];
  let h=`<section class="hero"><div class="kick">Leo · פרק ${ch}</div><h1>${S.casual?"מה יש לגלות היום?":(n?"ממשיכים מאיפה שעצרת":"סיימת את הסיפור! 🎉")}</h1>`;
  if(!S.casual){
    h+=`<div class="ringrow">${ring(pct(dn,all.length),"מכל המשחק")}<div class="stat3"><div><b>${st}/${STORY.length}</b><span>סיפור</span></div><div><b>${dn}</b><span>סומנו</span></div><div><b>${soon.length}</b><span>ייסגרו בקרוב</span></div></div></div>`;
  }
  if(n){h+=`<a class="cont" href="#/i/${n.s}">${glyph(n)}<div class="t"><span class="dim" style="font-size:12px;font-weight:800">המשימה הבאה</span><b>${bdi(n.n)}</b><span class="muted" style="font-size:12.5px">${esc(sub(n))}</span></div><span class="go">‹</span></a>`}
  h+=`</section>`;
  if(pr&&!S.casual)h+=`<div class="blk warn" style="margin-top:12px"><h3><span class="e">⚠</span>לפני <bdi>${esc(pr.n)}</bdi></h3><p class="muted" style="margin:0">זו נקודת אל־חזור. כדאי לסיים קודם את מה שמסומן ⏳ למטה.</p></div>`;
  if(soon.length&&!S.casual)h+=`<div class="sec"><h2>⏳ ייסגר בקרוב</h2><a href="#/list?miss=1">הכל</a></div>`+soon.map(row).join("");
  if(near.length&&!S.casual)h+=`<div class="sec"><h2>📍 באותו אזור</h2></div>`+near.map(row).join("");
  if(S.casual){
    const pick=IT.filter(x=>x.g.includes("egg")||x.g.includes("event")).sort(()=>Math.random()-.5).slice(0,5);
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

/* list with tri-state filters: 1 = only, 2 = all except, 0 = off */
const LF=Object.assign({cat:{},ch:0,q:"",stat:"",miss:0,kt:{}},S.lists||{});
function triCls(v){return v===1?" on":v===2?" not":""}
function pageList(q){
  if(q.cat){LF.cat={[q.cat]:1}}if(q.ch)LF.ch=+q.ch;if(q.miss)LF.miss=1;
  const catOn=Object.keys(LF.cat).filter(k=>LF.cat[k]===1),catNot=Object.keys(LF.cat).filter(k=>LF.cat[k]===2);
  const ktOn=Object.keys(LF.kt).filter(k=>LF.kt[k]===1),ktNot=Object.keys(LF.kt).filter(k=>LF.kt[k]===2);
  const qq=LF.q.trim().toLowerCase();
  const list=IT.filter(x=>{
    const c=mainCat(x);
    if(catOn.length&&!catOn.some(k=>x.g.includes(k)||c===k))return false;
    if(catNot.some(k=>x.g.includes(k)||c===k))return false;
    if(ktOn.length&&!ktOn.includes(x.t))return false;if(ktNot.includes(x.t))return false;
    if(LF.ch&&x.c!==LF.ch)return false;
    if(LF.stat==="open"&&done(x))return false;if(LF.stat==="done"&&!done(x))return false;
    if(LF.miss&&!missable(x))return false;
    if(qq&&!((x.n+" "+x.ne+" "+(x.sp||"")+" "+(x.loc||[]).join(" ")).toLowerCase().includes(qq)))return false;
    return true;});
  let h=`<div class="search"><span>🔎</span><input id="q" placeholder="חפש משימה, מקום, רכב…" value="${esc(LF.q)}"></div>`;
  h+=`<div class="chips">`+Object.keys(CAT).map(k=>`<button class="chip${triCls(LF.cat[k])}" data-cat="${k}">${CAT[k][1]} ${CAT[k][0]}</button>`).join("")+`</div>`;
  if(LF.cat.collect===1)h+=`<div class="chips">`+Object.keys(D.KT).map(k=>`<button class="chip${triCls(LF.kt[k])}" data-kt="${k}">${KTE[k]||""} ${esc(D.KT[k][0])}</button>`).join("")+`</div>`;
  h+=`<div class="chips"><button class="chip${LF.ch?"":" on"}" data-ch="0">כל הפרקים</button>`+[1,2,3,4,5].map(c=>`<button class="chip${LF.ch===c?" on":""}" data-ch="${c}">פרק ${c}</button>`).join("")+`</div>`;
  if(!S.casual)h+=`<div class="chips"><button class="chip${LF.stat===""?" on":""}" data-st="">הכל</button><button class="chip${LF.stat==="open"?" on":""}" data-st="open">עוד לא עשיתי</button><button class="chip${LF.stat==="done"?" on":""}" data-st="done">עשיתי</button><button class="chip${LF.miss?" on":""}" data-miss="1">⏳ רק מה שאפשר לפספס</button></div>`;
  h+=`<div class="dim" style="font-size:12px;margin:2px 4px">${list.length} תוצאות · לחיצה על פילטר = רק זה, פעמיים = הכל חוץ מזה</div>`;
  let lastC=0;
  for(const x of list){if(x.c!==lastC){lastC=x.c;const a=list.filter(y=>y.c===x.c);h+=`<div class="grp">פרק ${x.c} · ${a.filter(done).length}/${a.length}</div>`}h+=row(x)}
  if(!list.length)h+=`<div class="empty">אין תוצאות. נסה לנקות פילטרים.</div>`;
  return h;
}
function bindList(){
  const save=()=>{Store.setS("lists",LF);route(true)};
  $$("[data-cat]").forEach(b=>b.onclick=()=>{const k=b.dataset.cat;LF.cat[k]=((LF.cat[k]||0)+1)%3;if(!LF.cat[k])delete LF.cat[k];if(k==="collect"&&LF.cat[k]!==1)LF.kt={};save()});
  $$("[data-kt]").forEach(b=>b.onclick=()=>{const k=b.dataset.kt;LF.kt[k]=((LF.kt[k]||0)+1)%3;if(!LF.kt[k])delete LF.kt[k];save()});
  $$("[data-ch]").forEach(b=>b.onclick=()=>{LF.ch=+b.dataset.ch;save()});
  $$("[data-st]").forEach(b=>b.onclick=()=>{LF.stat=b.dataset.st;save()});
  $$("[data-miss]").forEach(b=>b.onclick=()=>{LF.miss=LF.miss?0:1;save()});
  const q=$("#q");if(q){q.oninput=()=>{LF.q=q.value;clearTimeout(q._t);q._t=setTimeout(()=>{Store.setS("lists",LF);const p=q.selectionStart;route(true);const n=$("#q");n.focus();n.setSelectionRange(p,p)},250)}}
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
  if(missable(x))h+=`<p><b style="color:#ff9a9a">⏳ אפשר לפספס</b> – אם לא עושים בזמן, זה נעלם.</p>`;
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
function pageGuide(id){const g=GUIDES.find(x=>x.id===id);if(!g)return `<div class="empty">לא נמצא</div>`;return `<div class="ihead"><div class="kick">מדריך</div><h1 style="margin-top:4px">${g.e} ${esc(g.t)}</h1></div><div class="blk gbody">${g.h}</div>${commentsBlock("g:"+g.id)}`}

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
let map=null,mapReady=false,layer=null,base=null,mini=null;
const BOUNDS=L.latLngBounds([-800,160],[-160,832]);
const ML=Object.assign({mine:true,cats:{},kinds:{}},S.mapLayers||{});
function setBase(){
  if(base)map.removeLayer(base);
  if(S.mapStyle==="original"){
    const M=window.AFF;const p=(fx,fy)=>[fx*M[0][0]+fy*M[1][0]+M[2][0],fx*M[0][1]+fy*M[1][1]+M[2][1]];
    const a=p(0,0),b=p(1,1);base=L.imageOverlay("map-original.jpg",[[-a[1],a[0]],[-b[1],b[0]]]).addTo(map);
  }else base=L.tileLayer("tiles/day/{z}/{z},{y},{x}.webp",{tileSize:256,minZoom:-1,minNativeZoom:0,maxNativeZoom:5,maxZoom:8,noWrap:true,bounds:BOUNDS,
    attribution:'<a href="https://github.com/fbritoferreira/gta6" target="_blank" rel="noopener">Open GTA 6 Map</a> (CC BY 4.0) · © Rockstar Games'}).addTo(map);
  base.bringToBack&&base.bringToBack();
}
function itemShown(x){
  if(x.x==null||x.tip)return false;
  if(S.hideDone&&done(x))return false;
  if(S.upTo&&x.c>curCh())return false;
  if(S.exactOnly&&!x.ex)return false;
  const on=Object.keys(ML.cats).filter(k=>ML.cats[k]);
  if(on.length&&!on.includes(mainCat(x)))return false;
  return true;
}
function pinHtml(arr){
  const x=arr[0];const cnt=arr.length>1?`<span class="cnt">${arr.length}</span>`:"";
  if(x.L){const k=KINDS[x.k]||{};return `<div class="mpin" style="position:relative"><span class="edot${Store.done("L:"+x.id)?" done":""}" style="background:${k.c}"></span>${cnt}</div>`}
  return `<div class="mpin${x.ex?"":" ap"}" style="position:relative">${glyph(x)}${cnt}</div>`;
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
  map=L.map("map",{crs:L.CRS.Simple,minZoom:-1,maxZoom:8,zoomSnap:0.25,zoomDelta:0.5,wheelPxPerZoomLevel:90,maxBounds:BOUNDS.pad(0.3),zoomControl:false,attributionControl:true});
  map.attributionControl.setPrefix(false);
  const xs=LOCS.map(l=>l.x),ys=LOCS.map(l=>l.y);window.LAND=L.latLngBounds([-Math.max(...ys),Math.min(...xs)],[-Math.min(...ys),Math.max(...xs)]);map.fitBounds(LAND,{padding:[20,20]});window._map=map;setBase();mapChips();drawPins();mapReady=true;
  $("#zin").onclick=()=>map.zoomIn();$("#zout").onclick=()=>map.zoomOut();$("#zfit").onclick=()=>map.fitBounds(LAND,{padding:[20,20]});
}
function focusMap(q){
  if(q.i&&BYS[q.i]){const x=BYS[q.i];if(x.x!=null){if(!itemShown(x)){ML.mine=true;ML.cats={};drawPins();mapChips()}map.setView([-x.y,x.x],6);setTimeout(()=>preview(x),250)}}
  if(q.l&&LBY[q.l]){const l=LBY[q.l];if(!ML.kinds[l.k]){ML.kinds[l.k]=true;drawPins()}map.setView([-l.y,l.x],6);setTimeout(()=>preview(Object.assign({L:1},l)),250)}
}
function drawMini(x,y,o){
  if(mini){mini.remove();mini=null}
  const el=$("#mini");if(!el)return;
  mini=L.map(el,{crs:L.CRS.Simple,minZoom:1,maxZoom:8,zoomControl:false,attributionControl:false,maxBounds:BOUNDS.pad(0.2),scrollWheelZoom:false});
  L.tileLayer("tiles/day/{z}/{z},{y},{x}.webp",{tileSize:256,minNativeZoom:0,maxNativeZoom:5,maxZoom:8,noWrap:true,bounds:BOUNDS}).addTo(mini);
  mini.setView([-y,x],o.ex===0?4:6);
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
