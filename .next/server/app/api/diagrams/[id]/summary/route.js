"use strict";(()=>{var e={};e.id=5266,e.ids=[5266],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},4770:e=>{e.exports=require("crypto")},2615:e=>{e.exports=require("http")},8791:e=>{e.exports=require("https")},8621:e=>{e.exports=require("punycode")},6162:e=>{e.exports=require("stream")},7360:e=>{e.exports=require("url")},1568:e=>{e.exports=require("zlib")},6005:e=>{e.exports=require("node:crypto")},4373:(e,t,i)=>{i.r(t),i.d(t,{originalPathname:()=>C,patchFetch:()=>D,requestAsyncStorage:()=>W,routeModule:()=>S,serverHooks:()=>B,staticGenerationAsyncStorage:()=>j});var r,n={};i.r(n),i.d(n,{GET:()=>q});var s=i(9303),a=i(8716),o=i(670),l=i(7070),c=i(3493),u=i(9949);class d extends Error{constructor(e="Version conflict"){super(e),this.name="ConflictError"}}class m extends Error{constructor(e="Not found"){super(e),this.name="NotFoundError"}}class h extends Error{constructor(e="Forbidden"){super(e),this.name="ForbiddenError"}}class p extends Error{constructor(e="Rate limit exceeded"){super(e),this.name="RateLimitError"}}async function f(){let e=await (0,u.ts)();if(!e?.id)throw new h("Authentication required");return e.id}async function w(e,t,i="read"){let r=await f(),n=(0,u.lx)();try{if("project"===t){let{data:t}=await n.from("projects").select("owner_id, collaborators(user_id, role)").eq("id",e).single();if(!t)return!1;if(t.owner_id===r)return!0;let s=t.collaborators?.find(e=>e.user_id===r);if(!s)return!1;switch(i){case"read":return["OWNER","EDITOR","VIEWER"].includes(s.role);case"write":return["OWNER","EDITOR"].includes(s.role);case"delete":return"OWNER"===s.role;default:return!1}}if("diagram"===t){let{data:t}=await n.from("diagrams").select(`
          owner_id,
          project:projects!inner(
            owner_id,
            collaborators(user_id, role)
          )
        `).eq("id",e).single();if(!t)return!1;if(t.owner_id===r)return!0;let s=t.project;if(s.owner_id===r)return!0;let a=s.collaborators?.find(e=>e.user_id===r);if(!a)return!1;switch(i){case"read":return["OWNER","EDITOR","VIEWER"].includes(a.role);case"write":return["OWNER","EDITOR"].includes(a.role);case"delete":return["OWNER"].includes(a.role)}}return!1}catch(e){return console.error("Resource access check failed:",e),!1}}async function g(e,t,i="read"){if(!await w(e,t,i))throw new h(`Insufficient permissions for ${i} access to ${t}`)}var y=i(9953),b=i(6859);let k=process.env.UPSTASH_REDIS_REST_URL&&process.env.UPSTASH_REDIS_REST_TOKEN?new b.Redis({url:process.env.UPSTASH_REDIS_REST_URL,token:process.env.UPSTASH_REDIS_REST_TOKEN}):null,v=k&&new y.Ratelimit({redis:k,limiter:y.Ratelimit.slidingWindow(100,"1 m")}),x=k&&new y.Ratelimit({redis:k,limiter:y.Ratelimit.slidingWindow(30,"1 m")}),R=k&&new y.Ratelimit({redis:k,limiter:y.Ratelimit.slidingWindow(10,"1 m")});async function E(e,t,i="read"){if(!k)return!0;let r=(e.headers.get("x-forwarded-for")||"").split(",")[0]||"0.0.0.0",n=`${i}:${t??"anon"}:${r}`,s="write"===i?x:"ai"===i?R:v;if(!s)return!0;try{return(await s.limit(n)).success}catch(e){return console.error("Rate limiting failed:",e),!0}}function I(e,t){void 0!==t&&e.set("X-RateLimit-Remaining",t.toString())}var T=i(4770);let _=(e,t=!1)=>{let i="string"==typeof e?e:JSON.stringify(e),r=(0,T.createHash)("sha1").update(i,"utf8").digest("hex");return`${t?"W/":""}"${r}"`},A=(e,t)=>e.headers.get("if-none-match")===t,P=(e,t=!0)=>_(`v${e}`,t),q=(r=async(e,{params:t})=>{let i=await f();if(await g(t.id,"diagram","read"),!await E(e,i,"read"))return l.NextResponse.json({error:"Rate limit exceeded"},{status:429});let r=await c._.diagram.findFirst({where:{id:t.id,deletedAt:null,OR:[{ownerId:i},{project:{OR:[{ownerId:i},{collaborators:{some:{userId:i}}}]}}]},select:{id:!0,title:!0,updatedAt:!0,version:!0,projectId:!0,thumbnailUrl:!0,metadata:!0,owner:{select:{name:!0,email:!0}},project:{select:{name:!0}}}});if(!r)throw new m("Diagram");let n={id:r.id,title:r.title,updatedAt:r.updatedAt.toISOString(),version:r.version,projectId:r.projectId,thumbnailUrl:r.thumbnailUrl||void 0,lastEditor:r.owner.name||r.owner.email,elementCount:r.metadata?.elementCount||void 0},s=P(r.version);if(A(e,s)){let e=new Response(null,{status:304});return I(e.headers),e}let a=function(e,t,i=200){return new Response(JSON.stringify(e),{status:i,headers:{"Content-Type":"application/json",ETag:t}})}(n,s);return I(a.headers),a},async(...e)=>{try{return await r(...e)}catch(e){return function(e,t){let[i,r]=e instanceof d?[409,{type:"/errors/conflict",title:"Version conflict",detail:e.message}]:e instanceof m?[404,{type:"/errors/not-found",title:"Not found",detail:e.message}]:e instanceof h?[403,{type:"/errors/forbidden",title:"Forbidden",detail:e.message}]:e instanceof p?[429,{type:"/errors/rate-limit",title:"Too many requests",detail:e.message}]:(console.error("Unexpected API error:",e),[500,{type:"/errors/server",title:"Server error",detail:"An unexpected error occurred"}]);return l.NextResponse.json(r,{status:i,headers:{"Content-Type":"application/problem+json"}})}(e)}}),S=new s.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/diagrams/[id]/summary/route",pathname:"/api/diagrams/[id]/summary",filename:"route",bundlePath:"app/api/diagrams/[id]/summary/route"},resolvedPagePath:"/Users/home/Desktop/mvp/app/api/diagrams/[id]/summary/route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:W,staticGenerationAsyncStorage:j,serverHooks:B}=S,C="/api/diagrams/[id]/summary/route";function D(){return(0,o.patchFetch)({serverHooks:B,staticGenerationAsyncStorage:j})}},9949:(e,t,i)=>{i.d(t,{et:()=>o,lx:()=>s,ts:()=>a,xv:()=>l});var r=i(6718),n=i(1615);function s(){let e=(0,n.cookies)();return(0,r.createServerClient)("https://adjdqxptoaecafmmjgtf.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkamRxeHB0b2FlY2FmbW1qZ3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NTgzOTMsImV4cCI6MjA3MTEzNDM5M30.L_PMZMsTkFklUOx9lNll-s1NiaW9HnGifk-bkB5tdIQ",{cookies:{get:t=>e.get(t)?.value,set(t,i,r){e.set({name:t,value:i,...r})},remove(t,i){e.set({name:t,value:"",...i})}}})}async function a(){let e=s();try{let{data:{user:t},error:i}=await e.auth.getUser();if(i||!t)return null;return t}catch(e){return console.error("Error getting current user:",e),null}}async function o(e){let t=s();try{let{data:i,error:r}=await t.from("profiles").select(`
        *,
        subscriptions (
          plan,
          status,
          current_period_end
        )
      `).eq("id",e).single();if(r)return console.error("Error getting user profile:",r),null;return i}catch(e){return console.error("Error getting user profile:",e),null}}async function l(e){let t=s();try{let{data:i,error:r}=await t.from("profiles").insert({id:e.id,email:e.email,name:e.user_metadata?.full_name||e.email?.split("@")[0]||"User",avatar_url:e.user_metadata?.avatar_url}).select().single();if(r)return console.error("Error creating profile:",r),null;let{error:n}=await t.from("subscriptions").insert({profile_id:e.id,stripe_customer_id:`temp_${e.id}`,plan:"FREE",status:"ACTIVE",current_period_end:new Date(Date.now()+31536e6)});return n&&console.error("Error creating subscription:",n),i}catch(e){return console.error("Error creating user profile:",e),null}}},3493:(e,t,i)=>{i.d(t,{_:()=>n});let r=require("@prisma/client"),n=globalThis.prisma??new r.PrismaClient},1589:e=>{var t=Object.defineProperty,i=Object.getOwnPropertyDescriptor,r=Object.getOwnPropertyNames,n=Object.prototype.hasOwnProperty,s={};((e,i)=>{for(var r in i)t(e,r,{get:i[r],enumerable:!0})})(s,{Analytics:()=>c}),e.exports=((e,s,a,o)=>{if(s&&"object"==typeof s||"function"==typeof s)for(let a of r(s))n.call(e,a)||void 0===a||t(e,a,{get:()=>s[a],enumerable:!(o=i(s,a))||o.enumerable});return e})(t({},"__esModule",{value:!0}),s);var a=`
local key = KEYS[1]
local field = ARGV[1]

local data = redis.call("ZRANGE", key, 0, -1, "WITHSCORES")
local count = {}

for i = 1, #data, 2 do
  local json_str = data[i]
  local score = tonumber(data[i + 1])
  local obj = cjson.decode(json_str)

  local fieldValue = obj[field]

  if count[fieldValue] == nil then
    count[fieldValue] = score
  else
    count[fieldValue] = count[fieldValue] + score
  end
end

local result = {}
for k, v in pairs(count) do
  table.insert(result, {k, v})
end

return result
`,o=`
local prefix = KEYS[1]
local first_timestamp = tonumber(ARGV[1]) -- First timestamp to check
local increment = tonumber(ARGV[2])       -- Increment between each timestamp
local num_timestamps = tonumber(ARGV[3])  -- Number of timestampts to check (24 for a day and 24 * 7 for a week)
local num_elements = tonumber(ARGV[4])    -- Number of elements to fetch in each category
local check_at_most = tonumber(ARGV[5])   -- Number of elements to check at most.

local keys = {}
for i = 1, num_timestamps do
  local timestamp = first_timestamp - (i - 1) * increment
  table.insert(keys, prefix .. ":" .. timestamp)
end

-- get the union of the groups
local zunion_params = {"ZUNION", num_timestamps, unpack(keys)}
table.insert(zunion_params, "WITHSCORES")
local result = redis.call(unpack(zunion_params))

-- select num_elements many items
local true_group = {}
local false_group = {}
local denied_group = {}
local true_count = 0
local false_count = 0
local denied_count = 0
local i = #result - 1

-- index to stop at after going through "checkAtMost" many items:
local cutoff_index = #result - 2 * check_at_most

-- iterate over the results
while (true_count + false_count + denied_count) < (num_elements * 3) and 1 <= i and i >= cutoff_index do
  local score = tonumber(result[i + 1])
  if score > 0 then
    local element = result[i]
    if string.find(element, "success\\":true") and true_count < num_elements then
      table.insert(true_group, {score, element})
      true_count = true_count + 1
    elseif string.find(element, "success\\":false") and false_count < num_elements then
      table.insert(false_group, {score, element})
      false_count = false_count + 1
    elseif string.find(element, "success\\":\\"denied") and denied_count < num_elements then
      table.insert(denied_group, {score, element})
      denied_count = denied_count + 1
    end
  end
  i = i - 2
end

return {true_group, false_group, denied_group}
`,l=`
local prefix = KEYS[1]
local first_timestamp = tonumber(ARGV[1])
local increment = tonumber(ARGV[2])
local num_timestamps = tonumber(ARGV[3])

local keys = {}
for i = 1, num_timestamps do
  local timestamp = first_timestamp - (i - 1) * increment
  table.insert(keys, prefix .. ":" .. timestamp)
end

-- get the union of the groups
local zunion_params = {"ZUNION", num_timestamps, unpack(keys)}
table.insert(zunion_params, "WITHSCORES")
local result = redis.call(unpack(zunion_params))

return result
`,c=class{redis;prefix;bucketSize;constructor(e){this.redis=e.redis,this.prefix=e.prefix??"@upstash/analytics",this.bucketSize=this.parseWindow(e.window)}validateTableName(e){if(!/^[a-zA-Z0-9_-]+$/.test(e))throw Error(`Invalid table name: ${e}. Table names can only contain letters, numbers, dashes and underscores.`)}parseWindow(e){if("number"==typeof e){if(e<=0)throw Error(`Invalid window: ${e}`);return e}let t=/^(\d+)([smhd])$/;if(!t.test(e))throw Error(`Invalid window: ${e}`);let[,i,r]=e.match(t),n=parseInt(i);switch(r){case"s":return 1e3*n;case"m":return 6e4*n;case"h":return 36e5*n;case"d":return 864e5*n;default:throw Error(`Invalid window unit: ${r}`)}}getBucket(e){return Math.floor((e??Date.now())/this.bucketSize)*this.bucketSize}async ingest(e,...t){this.validateTableName(e),await Promise.all(t.map(async t=>{let i=this.getBucket(t.time),r=[this.prefix,e,i].join(":");await this.redis.zincrby(r,1,JSON.stringify({...t,time:void 0}))}))}formatBucketAggregate(e,t,i){let r={};return e.forEach(([e,i])=>{"success"==t&&(e=1===e?"true":null===e?"false":e),r[t]=r[t]||{},r[t][(e??"null").toString()]=i}),{time:i,...r}}async aggregateBucket(e,t,i){this.validateTableName(e);let r=this.getBucket(i),n=[this.prefix,e,r].join(":"),s=await this.redis.eval(a,[n],[t]);return this.formatBucketAggregate(s,t,r)}async aggregateBuckets(e,t,i,r){this.validateTableName(e);let n=this.getBucket(r),s=[];for(let r=0;r<i;r+=1)s.push(this.aggregateBucket(e,t,n)),n-=this.bucketSize;return Promise.all(s)}async aggregateBucketsWithPipeline(e,t,i,r,n){this.validateTableName(e),n=n??48;let s=this.getBucket(r),o=[],l=this.redis.pipeline(),c=[];for(let r=1;r<=i;r+=1){let u=[this.prefix,e,s].join(":");l.eval(a,[u],[t]),o.push(s),s-=this.bucketSize,(r%n==0||r==i)&&(c.push(l.exec()),l=this.redis.pipeline())}return(await Promise.all(c)).flat().map((e,i)=>this.formatBucketAggregate(e,t,o[i]))}async getAllowedBlocked(e,t,i){this.validateTableName(e);let r=[this.prefix,e].join(":"),n=this.getBucket(i),s=await this.redis.eval(l,[r],[n,this.bucketSize,t]),a={};for(let e=0;e<s.length;e+=2){let t=s[e],i=t.identifier,r=+s[e+1];a[i]||(a[i]={success:0,blocked:0}),a[i][t.success?"success":"blocked"]=r}return a}async getMostAllowedBlocked(e,t,i,r,n){this.validateTableName(e);let s=[this.prefix,e].join(":"),a=this.getBucket(r),[l,c,u]=await this.redis.eval(o,[s],[a,this.bucketSize,t,i,n??5*i]);return{allowed:this.toDicts(l),ratelimited:this.toDicts(c),denied:this.toDicts(u)}}toDicts(e){let t=[];for(let i=0;i<e.length;i+=1){let r=+e[i][0],n=e[i][1];t.push({identifier:n.identifier,count:r})}return t}}},9953:(e,t,i)=>{var r=Object.defineProperty,n=Object.getOwnPropertyDescriptor,s=Object.getOwnPropertyNames,a=Object.prototype.hasOwnProperty,o=(e,t)=>{for(var i in t)r(e,i,{get:t[i],enumerable:!0})},l={};o(l,{Analytics:()=>u,IpDenyList:()=>k,MultiRegionRatelimit:()=>B,Ratelimit:()=>C}),e.exports=((e,t,i,o)=>{if(t&&"object"==typeof t||"function"==typeof t)for(let i of s(t))a.call(e,i)||void 0===i||r(e,i,{get:()=>t[i],enumerable:!(o=n(t,i))||o.enumerable});return e})(r({},"__esModule",{value:!0}),l);var c=i(1589),u=class{analytics;table="events";constructor(e){this.analytics=new c.Analytics({redis:e.redis,window:"1h",prefix:e.prefix??"@upstash/ratelimit",retention:"90d"})}extractGeo(e){return void 0!==e.geo?e.geo:void 0!==e.cf?e.cf:{}}async record(e){await this.analytics.ingest(this.table,e)}async series(e,t){let i=Math.min((this.analytics.getBucket(Date.now())-this.analytics.getBucket(t))/36e5,256);return this.analytics.aggregateBucketsWithPipeline(this.table,e,i)}async getUsage(e=0){let t=Math.min((this.analytics.getBucket(Date.now())-this.analytics.getBucket(e))/36e5,256);return await this.analytics.getAllowedBlocked(this.table,t)}async getUsageOverTime(e,t){return await this.analytics.aggregateBucketsWithPipeline(this.table,t,e)}async getMostAllowedBlocked(e,t,i){return t=t??5,this.analytics.getMostAllowedBlocked(this.table,e,t,void 0,i)}},d=class{cache;constructor(e){this.cache=e}isBlocked(e){if(!this.cache.has(e))return{blocked:!1,reset:0};let t=this.cache.get(e);return t<Date.now()?(this.cache.delete(e),{blocked:!1,reset:0}):{blocked:!0,reset:t}}blockUntil(e,t){this.cache.set(e,t)}set(e,t){this.cache.set(e,t)}get(e){return this.cache.get(e)||null}incr(e){let t=this.cache.get(e)??0;return t+=1,this.cache.set(e,t),t}pop(e){this.cache.delete(e)}empty(){this.cache.clear()}size(){return this.cache.size}};function m(e){let t=e.match(/^(\d+)\s?(ms|s|m|h|d)$/);if(!t)throw Error(`Unable to parse window size: ${e}`);let i=Number.parseInt(t[1]);switch(t[2]){case"ms":return i;case"s":return 1e3*i;case"m":return 6e4*i;case"h":return 36e5*i;case"d":return 864e5*i;default:throw Error(`Unable to parse window size: ${e}`)}}var h=async(e,t,i,r)=>{try{return await e.redis.evalsha(t.hash,i,r)}catch(n){if(`${n}`.includes("NOSCRIPT"))return await e.redis.eval(t.script,i,r);throw n}},p={singleRegion:{fixedWindow:{limit:{script:`
  local key           = KEYS[1]
  local window        = ARGV[1]
  local incrementBy   = ARGV[2] -- increment rate per request at a given value, default is 1

  local r = redis.call("INCRBY", key, incrementBy)
  if r == tonumber(incrementBy) then
  -- The first time this key is set, the value will be equal to incrementBy.
  -- So we only need the expire command once
  redis.call("PEXPIRE", key, window)
  end

  return r
`,hash:"b13943e359636db027ad280f1def143f02158c13"},getRemaining:{script:`
      local key = KEYS[1]
      local tokens = 0

      local value = redis.call('GET', key)
      if value then
          tokens = value
      end
      return tokens
    `,hash:"8c4c341934502aee132643ffbe58ead3450e5208"}},slidingWindow:{limit:{script:`
  local currentKey  = KEYS[1]           -- identifier including prefixes
  local previousKey = KEYS[2]           -- key of the previous bucket
  local tokens      = tonumber(ARGV[1]) -- tokens per window
  local now         = ARGV[2]           -- current timestamp in milliseconds
  local window      = ARGV[3]           -- interval in milliseconds
  local incrementBy = ARGV[4]           -- increment rate per request at a given value, default is 1

  local requestsInCurrentWindow = redis.call("GET", currentKey)
  if requestsInCurrentWindow == false then
    requestsInCurrentWindow = 0
  end

  local requestsInPreviousWindow = redis.call("GET", previousKey)
  if requestsInPreviousWindow == false then
    requestsInPreviousWindow = 0
  end
  local percentageInCurrent = ( now % window ) / window
  -- weighted requests to consider from the previous window
  requestsInPreviousWindow = math.floor(( 1 - percentageInCurrent ) * requestsInPreviousWindow)
  if requestsInPreviousWindow + requestsInCurrentWindow >= tokens then
    return -1
  end

  local newValue = redis.call("INCRBY", currentKey, incrementBy)
  if newValue == tonumber(incrementBy) then
    -- The first time this key is set, the value will be equal to incrementBy.
    -- So we only need the expire command once
    redis.call("PEXPIRE", currentKey, window * 2 + 1000) -- Enough time to overlap with a new window + 1 second
  end
  return tokens - ( newValue + requestsInPreviousWindow )
`,hash:"e1391e429b699c780eb0480350cd5b7280fd9213"},getRemaining:{script:`
  local currentKey  = KEYS[1]           -- identifier including prefixes
  local previousKey = KEYS[2]           -- key of the previous bucket
  local now         = ARGV[1]           -- current timestamp in milliseconds
  local window      = ARGV[2]           -- interval in milliseconds

  local requestsInCurrentWindow = redis.call("GET", currentKey)
  if requestsInCurrentWindow == false then
    requestsInCurrentWindow = 0
  end

  local requestsInPreviousWindow = redis.call("GET", previousKey)
  if requestsInPreviousWindow == false then
    requestsInPreviousWindow = 0
  end

  local percentageInCurrent = ( now % window ) / window
  -- weighted requests to consider from the previous window
  requestsInPreviousWindow = math.floor(( 1 - percentageInCurrent ) * requestsInPreviousWindow)

  return requestsInPreviousWindow + requestsInCurrentWindow
`,hash:"65a73ac5a05bf9712903bc304b77268980c1c417"}},tokenBucket:{limit:{script:`
  local key         = KEYS[1]           -- identifier including prefixes
  local maxTokens   = tonumber(ARGV[1]) -- maximum number of tokens
  local interval    = tonumber(ARGV[2]) -- size of the window in milliseconds
  local refillRate  = tonumber(ARGV[3]) -- how many tokens are refilled after each interval
  local now         = tonumber(ARGV[4]) -- current timestamp in milliseconds
  local incrementBy = tonumber(ARGV[5]) -- how many tokens to consume, default is 1
        
  local bucket = redis.call("HMGET", key, "refilledAt", "tokens")
        
  local refilledAt
  local tokens

  if bucket[1] == false then
    refilledAt = now
    tokens = maxTokens
  else
    refilledAt = tonumber(bucket[1])
    tokens = tonumber(bucket[2])
  end
        
  if now >= refilledAt + interval then
    local numRefills = math.floor((now - refilledAt) / interval)
    tokens = math.min(maxTokens, tokens + numRefills * refillRate)

    refilledAt = refilledAt + numRefills * interval
  end

  if tokens == 0 then
    return {-1, refilledAt + interval}
  end

  local remaining = tokens - incrementBy
  local expireAt = math.ceil(((maxTokens - remaining) / refillRate)) * interval
        
  redis.call("HSET", key, "refilledAt", refilledAt, "tokens", remaining)
  redis.call("PEXPIRE", key, expireAt)
  return {remaining, refilledAt + interval}
`,hash:"5bece90aeef8189a8cfd28995b479529e270b3c6"},getRemaining:{script:`
  local key         = KEYS[1]
  local maxTokens   = tonumber(ARGV[1])
        
  local bucket = redis.call("HMGET", key, "refilledAt", "tokens")

  if bucket[1] == false then
    return {maxTokens, -1}
  end
        
  return {tonumber(bucket[2]), tonumber(bucket[1])}
`,hash:"a15be2bb1db2a15f7c82db06146f9d08983900d0"}},cachedFixedWindow:{limit:{script:`
  local key     = KEYS[1]
  local window  = ARGV[1]
  local incrementBy   = ARGV[2] -- increment rate per request at a given value, default is 1

  local r = redis.call("INCRBY", key, incrementBy)
  if r == incrementBy then
  -- The first time this key is set, the value will be equal to incrementBy.
  -- So we only need the expire command once
  redis.call("PEXPIRE", key, window)
  end
      
  return r
`,hash:"c26b12703dd137939b9a69a3a9b18e906a2d940f"},getRemaining:{script:`
  local key = KEYS[1]
  local tokens = 0

  local value = redis.call('GET', key)
  if value then
      tokens = value
  end
  return tokens
`,hash:"8e8f222ccae68b595ee6e3f3bf2199629a62b91a"}}},multiRegion:{fixedWindow:{limit:{script:`
	local key           = KEYS[1]
	local id            = ARGV[1]
	local window        = ARGV[2]
	local incrementBy   = tonumber(ARGV[3])

	redis.call("HSET", key, id, incrementBy)
	local fields = redis.call("HGETALL", key)
	if #fields == 2 and tonumber(fields[2])==incrementBy then
	-- The first time this key is set, and the value will be equal to incrementBy.
	-- So we only need the expire command once
	  redis.call("PEXPIRE", key, window)
	end

	return fields
`,hash:"a8c14f3835aa87bd70e5e2116081b81664abcf5c"},getRemaining:{script:`
      local key = KEYS[1]
      local tokens = 0

      local fields = redis.call("HGETALL", key)

      return fields
    `,hash:"8ab8322d0ed5fe5ac8eb08f0c2e4557f1b4816fd"}},slidingWindow:{limit:{script:`
	local currentKey    = KEYS[1]           -- identifier including prefixes
	local previousKey   = KEYS[2]           -- key of the previous bucket
	local tokens        = tonumber(ARGV[1]) -- tokens per window
	local now           = ARGV[2]           -- current timestamp in milliseconds
	local window        = ARGV[3]           -- interval in milliseconds
	local requestId     = ARGV[4]           -- uuid for this request
	local incrementBy   = tonumber(ARGV[5]) -- custom rate, default is  1

	local currentFields = redis.call("HGETALL", currentKey)
	local requestsInCurrentWindow = 0
	for i = 2, #currentFields, 2 do
	requestsInCurrentWindow = requestsInCurrentWindow + tonumber(currentFields[i])
	end

	local previousFields = redis.call("HGETALL", previousKey)
	local requestsInPreviousWindow = 0
	for i = 2, #previousFields, 2 do
	requestsInPreviousWindow = requestsInPreviousWindow + tonumber(previousFields[i])
	end

	local percentageInCurrent = ( now % window) / window
	if requestsInPreviousWindow * (1 - percentageInCurrent ) + requestsInCurrentWindow >= tokens then
	  return {currentFields, previousFields, false}
	end

	redis.call("HSET", currentKey, requestId, incrementBy)

	if requestsInCurrentWindow == 0 then 
	  -- The first time this key is set, the value will be equal to incrementBy.
	  -- So we only need the expire command once
	  redis.call("PEXPIRE", currentKey, window * 2 + 1000) -- Enough time to overlap with a new window + 1 second
	end
	return {currentFields, previousFields, true}
`,hash:"cb4fdc2575056df7c6d422764df0de3a08d6753b"},getRemaining:{script:`
	local currentKey    = KEYS[1]           -- identifier including prefixes
	local previousKey   = KEYS[2]           -- key of the previous bucket
	local now         	= ARGV[1]           -- current timestamp in milliseconds
  	local window      	= ARGV[2]           -- interval in milliseconds

	local currentFields = redis.call("HGETALL", currentKey)
	local requestsInCurrentWindow = 0
	for i = 2, #currentFields, 2 do
	requestsInCurrentWindow = requestsInCurrentWindow + tonumber(currentFields[i])
	end

	local previousFields = redis.call("HGETALL", previousKey)
	local requestsInPreviousWindow = 0
	for i = 2, #previousFields, 2 do
	requestsInPreviousWindow = requestsInPreviousWindow + tonumber(previousFields[i])
	end

	local percentageInCurrent = ( now % window) / window
  	requestsInPreviousWindow = math.floor(( 1 - percentageInCurrent ) * requestsInPreviousWindow)
	
	return requestsInCurrentWindow + requestsInPreviousWindow
`,hash:"558c9306b7ec54abb50747fe0b17e5d44bd24868"}}}},f={script:`
      local pattern = KEYS[1]

      -- Initialize cursor to start from 0
      local cursor = "0"

      repeat
          -- Scan for keys matching the pattern
          local scan_result = redis.call('SCAN', cursor, 'MATCH', pattern)

          -- Extract cursor for the next iteration
          cursor = scan_result[1]

          -- Extract keys from the scan result
          local keys = scan_result[2]

          for i=1, #keys do
          redis.call('DEL', keys[i])
          end

      -- Continue scanning until cursor is 0 (end of keyspace)
      until cursor == "0"
    `,hash:"54bd274ddc59fb3be0f42deee2f64322a10e2b50"},w="denyList",g="ipDenyList",y="ipDenyListStatus",b=`
  -- Checks if values provideed in ARGV are present in the deny lists.
  -- This is done using the allDenyListsKey below.

  -- Additionally, checks the status of the ip deny list using the
  -- ipDenyListStatusKey below. Here are the possible states of the
  -- ipDenyListStatusKey key:
  -- * status == -1: set to "disabled" with no TTL
  -- * status == -2: not set, meaning that is was set before but expired
  -- * status  >  0: set to "valid", with a TTL
  --
  -- In the case of status == -2, we set the status to "pending" with
  -- 30 second ttl. During this time, the process which got status == -2
  -- will update the ip deny list.

  local allDenyListsKey     = KEYS[1]
  local ipDenyListStatusKey = KEYS[2]

  local results = redis.call('SMISMEMBER', allDenyListsKey, unpack(ARGV))
  local status  = redis.call('TTL', ipDenyListStatusKey)
  if status == -2 then
    redis.call('SETEX', ipDenyListStatusKey, 30, "pending")
  end

  return { results, status }
`,k={};o(k,{ThresholdError:()=>x,disableIpDenyList:()=>I,updateIpDenyList:()=>E});var v=e=>864e5-((e||Date.now())-72e5)%864e5,x=class extends Error{constructor(e){super(`Allowed threshold values are from 1 to 8, 1 and 8 included. Received: ${e}`),this.name="ThresholdError"}},R=async e=>{if("number"!=typeof e||e<1||e>8)throw new x(e);try{let t=await fetch(`https://raw.githubusercontent.com/stamparm/ipsum/master/levels/${e}.txt`);if(!t.ok)throw Error(`Error fetching data: ${t.statusText}`);return(await t.text()).split("\n").filter(e=>e.length>0)}catch(e){throw Error(`Failed to fetch ip deny list: ${e}`)}},E=async(e,t,i,r)=>{let n=await R(i),s=[t,w,"all"].join(":"),a=[t,w,g].join(":"),o=[t,y].join(":"),l=e.multi();return l.sdiffstore(s,s,a),l.del(a),l.sadd(a,n.at(0),...n.slice(1)),l.sdiffstore(a,a,s),l.sunionstore(s,s,a),l.set(o,"valid",{px:r??v()}),await l.exec()},I=async(e,t)=>{let i=[t,w,"all"].join(":"),r=[t,w,g].join(":"),n=[t,y].join(":"),s=e.multi();return s.sdiffstore(i,i,r),s.del(r),s.set(n,"disabled"),await s.exec()},T=new d(new Map),_=e=>e.find(e=>T.isBlocked(e).blocked),A=e=>{T.size()>1e3&&T.empty(),T.blockUntil(e,Date.now()+6e4)},P=async(e,t,i)=>{let r;let[n,s]=await e.eval(b,[[t,w,"all"].join(":"),[t,y].join(":")],i);return n.map((e,t)=>{e&&(A(i[t]),r=i[t])}),{deniedValue:r,invalidIpDenyList:-2===s}},q=(e,t,[i,r],n)=>{if(r.deniedValue&&(i.success=!1,i.remaining=0,i.reason="denyList",i.deniedValue=r.deniedValue),r.invalidIpDenyList){let r=E(e,t,n);i.pending=Promise.all([i.pending,r])}return i},S=e=>({success:!1,limit:0,remaining:0,reset:0,pending:Promise.resolve(),reason:"denyList",deniedValue:e}),W=class{limiter;ctx;prefix;timeout;primaryRedis;analytics;enableProtection;denyListThreshold;constructor(e){this.ctx=e.ctx,this.limiter=e.limiter,this.timeout=e.timeout??5e3,this.prefix=e.prefix??"@upstash/ratelimit",this.enableProtection=e.enableProtection??!1,this.denyListThreshold=e.denyListThreshold??6,this.primaryRedis="redis"in this.ctx?this.ctx.redis:this.ctx.regionContexts[0].redis,this.analytics=e.analytics?new u({redis:this.primaryRedis,prefix:this.prefix}):void 0,e.ephemeralCache instanceof Map?this.ctx.cache=new d(e.ephemeralCache):void 0===e.ephemeralCache&&(this.ctx.cache=new d(new Map))}limit=async(e,t)=>{let i=null;try{let r=this.getRatelimitResponse(e,t),{responseArray:n,newTimeoutId:s}=this.applyTimeout(r);i=s;let a=await Promise.race(n);return this.submitAnalytics(a,e,t)}finally{i&&clearTimeout(i)}};blockUntilReady=async(e,t)=>{let i;if(t<=0)throw Error("timeout must be positive");let r=Date.now()+t;for(;!(i=await this.limit(e)).success;){if(0===i.reset)throw Error("This should not happen");let e=Math.min(i.reset,r)-Date.now();if(await new Promise(t=>setTimeout(t,e)),Date.now()>r)break}return i};resetUsedTokens=async e=>{let t=[this.prefix,e].join(":");await this.limiter().resetTokens(this.ctx,t)};getRemaining=async e=>{let t=[this.prefix,e].join(":");return await this.limiter().getRemaining(this.ctx,t)};getRatelimitResponse=async(e,t)=>{let i=this.getKey(e),r=this.getDefinedMembers(e,t),n=_(r),s=n?[S(n),{deniedValue:n,invalidIpDenyList:!1}]:await Promise.all([this.limiter().limit(this.ctx,i,t?.rate),this.enableProtection?P(this.primaryRedis,this.prefix,r):{deniedValue:void 0,invalidIpDenyList:!1}]);return q(this.primaryRedis,this.prefix,s,this.denyListThreshold)};applyTimeout=e=>{let t=null,i=[e];if(this.timeout>0){let e=new Promise(e=>{t=setTimeout(()=>{e({success:!0,limit:0,remaining:0,reset:0,pending:Promise.resolve(),reason:"timeout"})},this.timeout)});i.push(e)}return{responseArray:i,newTimeoutId:t}};submitAnalytics=(e,t,i)=>{if(this.analytics)try{let r=i?this.analytics.extractGeo(i):void 0,n=this.analytics.record({identifier:"denyList"===e.reason?e.deniedValue:t,time:Date.now(),success:"denyList"===e.reason?"denied":e.success,...r}).catch(e=>{let t="Failed to record analytics";`${e}`.includes("WRONGTYPE")&&(t=`
    Failed to record analytics. See the information below:

    This can occur when you uprade to Ratelimit version 1.1.2
    or later from an earlier version.

    This occurs simply because the way we store analytics data
    has changed. To avoid getting this error, disable analytics
    for *an hour*, then simply enable it back.

    `),console.warn(t,e)});e.pending=Promise.all([e.pending,n])}catch(e){console.warn("Failed to record analytics",e)}return e};getKey=e=>[this.prefix,e].join(":");getDefinedMembers=(e,t)=>[e,t?.ip,t?.userAgent,t?.country].filter(Boolean)};function j(){let e="",t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",i=t.length;for(let r=0;r<16;r++)e+=t.charAt(Math.floor(Math.random()*i));return e}var B=class extends W{constructor(e){super({prefix:e.prefix,limiter:e.limiter,timeout:e.timeout,analytics:e.analytics,ctx:{regionContexts:e.redis.map(e=>({redis:e})),cache:e.ephemeralCache?new d(e.ephemeralCache):void 0}})}static fixedWindow(e,t){let i=m(t);return()=>({async limit(t,r,n){if(t.cache){let{blocked:i,reset:n}=t.cache.isBlocked(r);if(i)return{success:!1,limit:e,remaining:0,reset:n,pending:Promise.resolve(),reason:"cacheBlock"}}let s=j(),a=Math.floor(Date.now()/i),o=[r,a].join(":"),l=n?Math.max(1,n):1,c=t.regionContexts.map(e=>({redis:e.redis,request:h(e,p.multiRegion.fixedWindow.limit,[o],[s,i,l])})),u=e-(await Promise.any(c.map(e=>e.request))).reduce((e,t,i)=>{let r=0;return i%2&&(r=Number.parseInt(t)),e+r},0);async function d(){let t=[...new Set((await Promise.all(c.map(e=>e.request))).flat().reduce((e,t,i)=>(i%2==0&&e.push(t),e),[])).values()];for(let i of c){let r=(await i.request).reduce((e,t,i)=>{let r=0;return i%2&&(r=Number.parseInt(t)),e+r},0),n=(await i.request).reduce((e,t,i)=>(i%2==0&&e.push(t),e),[]);if(r>=e)continue;let s=t.filter(e=>!n.includes(e));if(0!==s.length)for(let e of s)await i.redis.hset(o,{[e]:l})}}let m=u>0,f=(a+1)*i;return t.cache&&!m&&t.cache.blockUntil(r,f),{success:m,limit:e,remaining:u,reset:f,pending:d()}},async getRemaining(t,r){let n=Math.floor(Date.now()/i),s=[r,n].join(":"),a=t.regionContexts.map(e=>({redis:e.redis,request:h(e,p.multiRegion.fixedWindow.getRemaining,[s],[null])}));return{remaining:Math.max(0,e-(await Promise.any(a.map(e=>e.request))).reduce((e,t,i)=>{let r=0;return i%2&&(r=Number.parseInt(t)),e+r},0)),reset:(n+1)*i}},async resetTokens(e,t){let i=[t,"*"].join(":");e.cache&&e.cache.pop(t),await Promise.all(e.regionContexts.map(e=>{h(e,f,[i],[null])}))}})}static slidingWindow(e,t){let i=m(t),r=m(t);return()=>({async limit(t,n,s){if(t.cache){let{blocked:i,reset:r}=t.cache.isBlocked(n);if(i)return{success:!1,limit:e,remaining:0,reset:r,pending:Promise.resolve(),reason:"cacheBlock"}}let a=j(),o=Date.now(),l=Math.floor(o/i),c=[n,l].join(":"),u=[n,l-1].join(":"),d=s?Math.max(1,s):1,m=t.regionContexts.map(t=>({redis:t.redis,request:h(t,p.multiRegion.slidingWindow.limit,[c,u],[e,o,r,a,d])})),f=o%r/r,[w,g,y]=await Promise.any(m.map(e=>e.request));y&&w.push(a,d.toString());let b=e-(Math.ceil(g.reduce((e,t,i)=>{let r=0;return i%2&&(r=Number.parseInt(t)),e+r},0)*(1-f))+w.reduce((e,t,i)=>{let r=0;return i%2&&(r=Number.parseInt(t)),e+r},0));async function k(){let t=[...new Set((await Promise.all(m.map(e=>e.request))).flatMap(([e])=>e).reduce((e,t,i)=>(i%2==0&&e.push(t),e),[])).values()];for(let i of m){let[r,n,s]=await i.request,a=r.reduce((e,t,i)=>(i%2==0&&e.push(t),e),[]);if(r.reduce((e,t,i)=>{let r=0;return i%2&&(r=Number.parseInt(t)),e+r},0)>=e)continue;let o=t.filter(e=>!a.includes(e));if(0!==o.length)for(let e of o)await i.redis.hset(c,{[e]:d})}}let v=(l+1)*r;return t.cache&&!y&&t.cache.blockUntil(n,v),{success:!!y,limit:e,remaining:Math.max(0,b),reset:v,pending:k()}},async getRemaining(t,r){let n=Date.now(),s=Math.floor(n/i),a=[r,s].join(":"),o=[r,s-1].join(":"),l=t.regionContexts.map(e=>({redis:e.redis,request:h(e,p.multiRegion.slidingWindow.getRemaining,[a,o],[n,i])}));return{remaining:Math.max(0,e-await Promise.any(l.map(e=>e.request))),reset:(s+1)*i}},async resetTokens(e,t){let i=[t,"*"].join(":");e.cache&&e.cache.pop(t),await Promise.all(e.regionContexts.map(e=>{h(e,f,[i],[null])}))}})}},C=class extends W{constructor(e){super({prefix:e.prefix,limiter:e.limiter,timeout:e.timeout,analytics:e.analytics,ctx:{redis:e.redis},ephemeralCache:e.ephemeralCache,enableProtection:e.enableProtection,denyListThreshold:e.denyListThreshold})}static fixedWindow(e,t){let i=m(t);return()=>({async limit(t,r,n){let s=Math.floor(Date.now()/i),a=[r,s].join(":");if(t.cache){let{blocked:i,reset:n}=t.cache.isBlocked(r);if(i)return{success:!1,limit:e,remaining:0,reset:n,pending:Promise.resolve(),reason:"cacheBlock"}}let o=await h(t,p.singleRegion.fixedWindow.limit,[a],[i,n?Math.max(1,n):1]),l=o<=e,c=(s+1)*i;return t.cache&&!l&&t.cache.blockUntil(r,c),{success:l,limit:e,remaining:Math.max(0,e-o),reset:c,pending:Promise.resolve()}},async getRemaining(t,r){let n=Math.floor(Date.now()/i),s=[r,n].join(":");return{remaining:Math.max(0,e-await h(t,p.singleRegion.fixedWindow.getRemaining,[s],[null])),reset:(n+1)*i}},async resetTokens(e,t){let i=[t,"*"].join(":");e.cache&&e.cache.pop(t),await h(e,f,[i],[null])}})}static slidingWindow(e,t){let i=m(t);return()=>({async limit(t,r,n){let s=Date.now(),a=Math.floor(s/i),o=[r,a].join(":"),l=[r,a-1].join(":");if(t.cache){let{blocked:i,reset:n}=t.cache.isBlocked(r);if(i)return{success:!1,limit:e,remaining:0,reset:n,pending:Promise.resolve(),reason:"cacheBlock"}}let c=await h(t,p.singleRegion.slidingWindow.limit,[o,l],[e,s,i,n?Math.max(1,n):1]),u=c>=0,d=(a+1)*i;return t.cache&&!u&&t.cache.blockUntil(r,d),{success:u,limit:e,remaining:Math.max(0,c),reset:d,pending:Promise.resolve()}},async getRemaining(t,r){let n=Date.now(),s=Math.floor(n/i),a=[r,s].join(":"),o=[r,s-1].join(":");return{remaining:Math.max(0,e-await h(t,p.singleRegion.slidingWindow.getRemaining,[a,o],[n,i])),reset:(s+1)*i}},async resetTokens(e,t){let i=[t,"*"].join(":");e.cache&&e.cache.pop(t),await h(e,f,[i],[null])}})}static tokenBucket(e,t,i){let r=m(t);return()=>({async limit(t,n,s){if(t.cache){let{blocked:e,reset:r}=t.cache.isBlocked(n);if(e)return{success:!1,limit:i,remaining:0,reset:r,pending:Promise.resolve(),reason:"cacheBlock"}}let a=Date.now(),[o,l]=await h(t,p.singleRegion.tokenBucket.limit,[n],[i,r,e,a,s?Math.max(1,s):1]),c=o>=0;return t.cache&&!c&&t.cache.blockUntil(n,l),{success:c,limit:i,remaining:o,reset:l,pending:Promise.resolve()}},async getRemaining(e,t){let[n,s]=await h(e,p.singleRegion.tokenBucket.getRemaining,[t],[i]),a=Date.now()+r,o=s+r;return{remaining:n,reset:-1===s?a:o}},async resetTokens(e,t){e.cache&&e.cache.pop(t),await h(e,f,[t],[null])}})}static cachedFixedWindow(e,t){let i=m(t);return()=>({async limit(t,r,n){if(!t.cache)throw Error("This algorithm requires a cache");let s=Math.floor(Date.now()/i),a=[r,s].join(":"),o=(s+1)*i,l=n?Math.max(1,n):1;if("number"==typeof t.cache.get(a)){let r=t.cache.incr(a),n=r<e,s=n?h(t,p.singleRegion.cachedFixedWindow.limit,[a],[i,l]):Promise.resolve();return{success:n,limit:e,remaining:e-r,reset:o,pending:s}}let c=await h(t,p.singleRegion.cachedFixedWindow.limit,[a],[i,l]);t.cache.set(a,c);let u=e-c;return{success:u>=0,limit:e,remaining:u,reset:o,pending:Promise.resolve()}},async getRemaining(t,r){if(!t.cache)throw Error("This algorithm requires a cache");let n=Math.floor(Date.now()/i),s=[r,n].join(":");return"number"==typeof t.cache.get(s)?{remaining:Math.max(0,e-(t.cache.get(s)??0)),reset:(n+1)*i}:{remaining:Math.max(0,e-await h(t,p.singleRegion.cachedFixedWindow.getRemaining,[s],[null])),reset:(n+1)*i}},async resetTokens(e,t){if(!e.cache)throw Error("This algorithm requires a cache");let r=[t,Math.floor(Date.now()/i)].join(":");e.cache.pop(r);let n=[t,"*"].join(":");await h(e,f,[n],[null])}})}}}};var t=require("../../../../../webpack-runtime.js");t.C(e);var i=e=>t(t.s=e),r=t.X(0,[9276,5972,4305,6859],()=>i(4373));module.exports=r})();