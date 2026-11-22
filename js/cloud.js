/* Cloud: Supabase auth, progress sync and comments. Off when config.js is empty. */
(function(){
  const C=window.LR_CONFIG||{};
  const on=!!(C.supabaseUrl&&C.supabaseAnonKey&&window.supabase);
  const sb=on?window.supabase.createClient(C.supabaseUrl,C.supabaseAnonKey):null;
  let user=null,profile=null,pushT=null,status=on?"off":"none";
  const subs=new Set();const emit=()=>subs.forEach(f=>f());

  async function pull(){
    if(!user)return;
    status="sync";emit();
    const {data,error}=await sb.from("progress").select("st").eq("user_id",user.id).maybeSingle();
    if(error){status="err";emit();return}
    if(data&&data.st)Store.mergeIn(data.st);
    await push(true);
  }
  async function push(now){
    if(!user)return;
    clearTimeout(pushT);
    const run=async()=>{
      status="sync";emit();
      const {error}=await sb.from("progress").upsert({user_id:user.id,st:Store.all(),updated_at:new Date().toISOString()});
      status=error?"err":"on";emit();
    };
    if(now)return run();pushT=setTimeout(run,1200);
  }
  async function loadProfile(){
    const {data}=await sb.from("profiles").select("*").eq("id",user.id).maybeSingle();
    profile=data||null;
    if(!profile){const name=(user.user_metadata&&(user.user_metadata.full_name||user.user_metadata.name))||(user.email||"").split("@")[0];
      const r=await sb.from("profiles").upsert({id:user.id,name}).select().maybeSingle();profile=r.data||{id:user.id,name}}
  }
  if(on){
    sb.auth.onAuthStateChange(async(_e,session)=>{
      const u=session&&session.user||null;const changed=(u&&u.id)!==(user&&user.id);user=u;
      if(user&&changed){await loadProfile();await pull()}
      if(!user){profile=null;status="off"}
      emit();
    });
    Store.sub(()=>push());
  }

  window.Cloud={
    on,get user(){return user},get profile(){return profile},get status(){return status},sub:f=>subs.add(f),
    async google(){return sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+location.pathname}})},
    async email(addr){return sb.auth.signInWithOtp({email:addr,options:{emailRedirectTo:location.origin+location.pathname}})},
    async out(){await sb.auth.signOut();user=null;profile=null;status="off";emit()},
    async rename(name){const r=await sb.from("profiles").update({name}).eq("id",user.id).select().maybeSingle();if(r.data)profile=r.data;emit();return r},
    /* comments */
    async comments(key){
      const {data,error}=await sb.from("comments_view").select("*").eq("item_key",key).order("created_at",{ascending:true});
      if(error)throw error;return data||[];
    },
    async post(key,body,parent){
      return sb.from("comments").insert({item_key:key,body,parent_id:parent||null,user_id:user.id});
    },
    async vote(id,v){
      if(v===0)return sb.from("comment_votes").delete().match({comment_id:id,user_id:user.id});
      return sb.from("comment_votes").upsert({comment_id:id,user_id:user.id,v});
    },
    async myVotes(ids){if(!user||!ids.length)return{};const {data}=await sb.from("comment_votes").select("comment_id,v").eq("user_id",user.id).in("comment_id",ids);const r={};(data||[]).forEach(x=>r[x.comment_id]=x.v);return r},
    async del(id){return sb.from("comments").delete().eq("id",id)},
    async report(id,reason){return sb.from("reports").insert({comment_id:id,user_id:user.id,reason})},
    async counts(){const {data}=await sb.from("comment_counts").select("*");const r={};(data||[]).forEach(x=>r[x.item_key]=x.n);return r},
    async find(f){return sb.from("finds").insert(Object.assign({user_id:user.id},f))},
    async board(){const {data}=await sb.from("leaderboard").select("*").limit(20);return data||[]}
  };
})();
