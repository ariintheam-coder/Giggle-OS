// Runs a single-file HTML app inside a sandboxed frame and bridges its storage
// (localStorage + a small IndexedDB subset) to the host, which saves it to the user's account.

const SHIM = String.raw`(function(){
var SNAP=JSON.parse(__SNAP__)||{};var LS=SNAP.ls||{};var DB={};
function b64(buf){var s="",u=new Uint8Array(buf);for(var i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s)}
function unb64(t){var s=atob(t),u=new Uint8Array(s.length);for(var i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u}
async function enc(v){
if(v instanceof Blob)return{$t:"blob",m:v.type,d:b64(await v.arrayBuffer()),f:v.name||null};
if(v instanceof ArrayBuffer)return{$t:"ab",d:b64(v)};
if(ArrayBuffer.isView(v))return{$t:"ta",c:v.constructor.name,d:b64(v.buffer.slice(v.byteOffset,v.byteOffset+v.byteLength))};
if(v instanceof Date)return{$t:"date",d:v.getTime()};
if(Array.isArray(v)){var a=[];for(var x of v)a.push(await enc(x));return a}
if(v&&typeof v==="object"){var o={};for(var k in v)o[k]=await enc(v[k]);return o}
return v}
function dec(v){
if(Array.isArray(v))return v.map(dec);
if(v&&typeof v==="object"){
if(v.$t==="blob"){var u=unb64(v.d);return v.f?new File([u],v.f,{type:v.m}):new Blob([u],{type:v.m})}
if(v.$t==="ab")return unb64(v.d).buffer;
if(v.$t==="ta")return new (self[v.c]||Uint8Array)(unb64(v.d).buffer);
if(v.$t==="date")return new Date(v.d);
var o={};for(var k in v)o[k]=dec(v[k]);return o}
return v}
var timer=null;
function dirty(){clearTimeout(timer);timer=setTimeout(flush,1000)}
async function flush(){
clearTimeout(timer);timer=null;
var idb={};
for(var n in DB){idb[n]={};for(var s in DB[n]){var st=DB[n][s];var r={};for(var k in st.rec)r[k]=await enc(st.rec[k]);idb[n][s]={kp:st.kp,rec:r}}}
parent.postMessage({gg:"save",snap:{ls:LS,idb:idb}},"*")}
addEventListener("pagehide",function(){if(timer)flush()});
var ls={getItem:function(k){return Object.prototype.hasOwnProperty.call(LS,k)?LS[k]:null},setItem:function(k,v){LS[k]=String(v);dirty()},removeItem:function(k){delete LS[k];dirty()},clear:function(){for(var k in LS)delete LS[k];dirty()},key:function(i){return Object.keys(LS)[i]||null}};
Object.defineProperty(ls,"length",{get:function(){return Object.keys(LS).length}});
var lsx=new Proxy(ls,{get:function(t,p){return p in t?t[p]:(typeof p==="string"&&p in LS?LS[p]:undefined)},set:function(t,p,v){LS[p]=String(v);dirty();return true}});
try{Object.defineProperty(window,"localStorage",{value:lsx,configurable:true})}catch(e){}
var SS={};
try{Object.defineProperty(window,"sessionStorage",{value:{getItem:function(k){return k in SS?SS[k]:null},setItem:function(k,v){SS[k]=String(v)},removeItem:function(k){delete SS[k]},clear:function(){SS={}},key:function(i){return Object.keys(SS)[i]||null},get length(){return Object.keys(SS).length}},configurable:true})}catch(e){}
var idbSnap=SNAP.idb||{};
for(var n in idbSnap){DB[n]={};for(var s in idbSnap[n]){var src=idbSnap[n][s],rec={};for(var k in src.rec)rec[k]=dec(src.rec[k]);DB[n][s]={kp:src.kp,rec:rec}}}
function Req(){this.result=undefined;this.error=null;this.onsuccess=null;this.onerror=null}
Req.prototype.fire=function(){var q=this;setTimeout(function(){if(q.onsuccess)q.onsuccess({target:q})},0)};
try{Object.defineProperty(window,"IDBRequest",{value:Req,configurable:true,writable:true})}catch(e){}
function storeApi(n,s){
var st=DB[n][s];
function done(res){var q=new Req();q.result=res;q.fire();return q}
return{
put:function(v,key){var k=key!==undefined?key:v[st.kp];st.rec[k]=v;dirty();return done(k)},
add:function(v,key){var k=key!==undefined?key:v[st.kp];st.rec[k]=v;dirty();return done(k)},
get:function(k){return done(st.rec[k])},
getAll:function(){return done(Object.keys(st.rec).map(function(k){return st.rec[k]}))},
getAllKeys:function(){return done(Object.keys(st.rec))},
delete:function(k){delete st.rec[k];dirty();return done(undefined)},
clear:function(){st.rec={};dirty();return done(undefined)},
count:function(){return done(Object.keys(st.rec).length)},createIndex:function(){return{}}}}
function dbApi(n){return{
objectStoreNames:{contains:function(s){return !!DB[n][s]}},
createObjectStore:function(s,o){DB[n][s]={kp:o&&o.keyPath,rec:{}};dirty();return storeApi(n,s)},
transaction:function(names,mode){
var t={error:null,oncomplete:null,onerror:null,onabort:null,objectStore:function(s){return storeApi(n,s)}};
setTimeout(function(){if(t.oncomplete)t.oncomplete({target:t})},5);return t},
close:function(){}}}
try{Object.defineProperty(window,"indexedDB",{value:{open:function(n){
var q=new Req();
setTimeout(function(){
var fresh=!DB[n];if(fresh)DB[n]={};
q.result=dbApi(n);
if(fresh&&q.onupgradeneeded)q.onupgradeneeded({target:q});
if(q.onsuccess)q.onsuccess({target:q})},0);
return q}},configurable:true})}catch(e){}
var CQ={},CN=0;
function cc(op,a,tr){return new Promise(function(res,rej){var id=++CN;CQ[id]={res:res,rej:rej};parent.postMessage(Object.assign({gg:"cache",id:id,op:op},a),"*",tr||[])})}
addEventListener("message",function(e){var d=e.data;if(!d||d.gg!=="cacheRes"||!CQ[d.id])return;var q=CQ[d.id];delete CQ[d.id];d.ok?q.res(d.res):q.rej(new TypeError(d.err||"Cache error"))});
function cu(r){return typeof r==="string"?new URL(r,document.baseURI).href:r instanceof URL?r.href:r&&r.url?r.url:String(r)}
function mkResp(m){if(!m)return undefined;var h=new Headers(m.h||[]);var st=m.s===204||m.s===205||m.s===304?undefined:m.b;return new Response(st,{status:m.s,statusText:m.t,headers:h})}
function cacheApi(n){return{
match:async function(r){return mkResp(await cc("match",{n:n,u:cu(r)}))},
matchAll:async function(r){var m=r?await cc("match",{n:n,u:cu(r)}):null;return m?[mkResp(m)]:[]},
add:async function(r){await cc("add",{n:n,u:cu(r)})},
addAll:async function(l){for(var r of l)await cc("add",{n:n,u:cu(r)})},
put:async function(r,resp){var b=await resp.clone().blob();var h=[];resp.headers.forEach(function(v,k){h.push([k,v])});await cc("put",{n:n,u:cu(r),b:b,s:resp.status,t:resp.statusText,h:h})},
delete:async function(r){return cc("del",{n:n,u:cu(r)})},
keys:async function(){var l=await cc("keys",{n:n});return l.map(function(u){return new Request(u)})}}}
var cstore={
open:async function(n){await cc("open",{n:n});return cacheApi(n)},
has:function(n){return cc("has",{n:n})},
delete:function(n){return cc("delcache",{n:n})},
keys:function(){return cc("names",{})},
match:async function(r){var names=await cc("names",{});for(var n of names){var m=await cc("match",{n:n,u:cu(r)});if(m)return mkResp(m)}return undefined}};
try{Object.defineProperty(window,"caches",{value:cstore,configurable:true})}catch(e){}
})();`;

export function buildSrcdoc(html, snap) {
  const lit = JSON.stringify(JSON.stringify(snap || {})).replace(/</g, "\\u003c");
  const tag = `<script>${SHIM.replace("__SNAP__", () => lit)}</script>`;
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (m) => m + tag);
  return tag + html;
}

export const SANDBOX =
  "allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads allow-pointer-lock";
