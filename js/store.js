/* Progress + settings store. Progress values: +ts = done at ts, -ts = un-done at ts.
   Merging two copies keeps, per key, the one with the larger |ts| – so nothing is ever lost. */
(function(){
  const K="lr_state",KS="lr_settings";
  const now=()=>Date.now();
  function norm(o){const r={};for(const k in o||{}){let v=o[k];if(v===true)v=1;if(typeof v!=="number")continue;r[k]=v===0?-1:v}return r}
  function load(){try{return norm(JSON.parse(localStorage.getItem(K)||"{}"))}catch(e){return{}}}
  let st=load();
  const subs=new Set();
  function save(){try{localStorage.setItem(K,JSON.stringify(st))}catch(e){};subs.forEach(f=>f())}
  function merge(a,b){const r=Object.assign({},a);for(const k in b){const v=b[k];if(!(k in r)||Math.abs(v)>Math.abs(r[k]))r[k]=v}return r}
  const DEF={spoil:true,casual:false,hideDone:false,upTo:false,mapStyle:"rockstar",exactOnly:false,lists:{}};
  let S;try{S=Object.assign({},DEF,JSON.parse(localStorage.getItem(KS)||"{}"))}catch(e){S=Object.assign({},DEF)}
  window.Store={
    done:id=>st[id]>0,
    set(id,on){st[id]=on?now():-now();save();Store.onChange&&Store.onChange(id)},
    toggle(id){Store.set(id,!Store.done(id));return Store.done(id)},
    all:()=>st,
    mergeIn(o){st=merge(st,norm(o));save()},
    replace(o){st=norm(o);save()},
    sub:f=>subs.add(f),
    code(){const d={};for(const k in st)if(st[k]>0)d[k]=st[k];return btoa(unescape(encodeURIComponent(JSON.stringify(d))))},
    fromCode(c){const o=JSON.parse(decodeURIComponent(escape(atob(c.trim()))));Store.mergeIn(o);return Object.keys(o).length},
    S,
    setS(k,v){S[k]=v;try{localStorage.setItem(KS,JSON.stringify(S))}catch(e){}},
    merge
  };
})();
