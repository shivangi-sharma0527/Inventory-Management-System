const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'data', 'inventory.json');
const PUBLIC = path.join(ROOT, 'public');
const MIME = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};

function loadDb(){ return JSON.parse(fs.readFileSync(DATA_FILE,'utf8')); }
function saveDb(db){ const tmp=DATA_FILE+'.tmp'; fs.writeFileSync(tmp,JSON.stringify(db,null,2)); fs.renameSync(tmp,DATA_FILE); }
function text(v){ return String(v ?? '').trim(); }
function num(v,f=0){ const n=Number(v); return Number.isFinite(n)?n:f; }
function status(p){ return p.quantity===0?'Out of Stock':p.quantity<=p.minStock?'Low Stock':'In Stock'; }
function send(res,code,data){ const body=JSON.stringify(data); res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}); res.end(body); }
function validate(b){
  const value={sku:text(b.sku),name:text(b.name),category:text(b.category),supplier:text(b.supplier),price:num(b.price),quantity:num(b.quantity),minStock:num(b.minStock,5)};
  if(!value.sku||!value.name||!value.category) return {error:'SKU, product name and category are required.'};
  if(value.price<0||value.quantity<0||value.minStock<0||!Number.isInteger(value.quantity)||!Number.isInteger(value.minStock)) return {error:'Price must be non-negative and quantity/minimum stock must be whole numbers.'};
  return {value};
}
function body(req){ return new Promise((resolve,reject)=>{let raw='';req.on('data',c=>{raw+=c;if(raw.length>1e6)req.destroy();});req.on('end',()=>{try{resolve(raw?JSON.parse(raw):{})}catch(e){reject(e)}});req.on('error',reject)}); }

async function api(req,res,url){
  const db=loadDb(); const p=url.pathname; const method=req.method;
  if(p==='/api/dashboard'&&method==='GET'){
    const totalProducts=db.products.length,totalUnits=db.products.reduce((s,x)=>s+x.quantity,0),lowStock=db.products.filter(x=>x.quantity>0&&x.quantity<=x.minStock).length,outOfStock=db.products.filter(x=>x.quantity===0).length,inventoryValue=db.products.reduce((s,x)=>s+x.quantity*x.price,0);
    const recent=db.movements.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,8).map(m=>({...m,product:db.products.find(x=>x.id===m.productId)?.name||'Deleted product'}));
    const categoryBreakdown=Object.entries(db.products.reduce((a,x)=>(a[x.category]=(a[x.category]||0)+x.quantity,a),{})).map(([category,units])=>({category,units}));
    return send(res,200,{totalProducts,totalUnits,lowStock,outOfStock,inventoryValue,recent,categoryBreakdown});
  }
  if(p==='/api/categories'&&method==='GET') return send(res,200,[...new Set(db.products.map(x=>x.category))].sort());
  if(p==='/api/products'&&method==='GET'){
    const search=text(url.searchParams.get('search')).toLowerCase(),category=text(url.searchParams.get('category')),st=text(url.searchParams.get('status'));
    let list=db.products.slice();
    if(search) list=list.filter(x=>[x.name,x.sku,x.category,x.supplier].some(v=>String(v).toLowerCase().includes(search)));
    if(category) list=list.filter(x=>x.category===category); if(st) list=list.filter(x=>status(x)===st);
    return send(res,200,list.sort((a,b)=>b.id-a.id).map(x=>({...x,status:status(x)})));
  }
  const productMatch=p.match(/^\/api\/products\/(\d+)$/), movementMatch=p.match(/^\/api\/products\/(\d+)\/movement$/);
  if(method==='POST'&&p==='/api/products'){
    let b;try{b=await body(req)}catch(e){return send(res,400,{error:'Invalid JSON.'})} const v=validate(b); if(v.error)return send(res,400,{error:v.error});
    if(db.products.some(x=>x.sku.toLowerCase()===v.value.sku.toLowerCase()))return send(res,409,{error:'SKU already exists.'});
    const now=new Date().toISOString(),product={id:db.nextProductId++,...v.value,createdAt:now,updatedAt:now};db.products.push(product);
    if(product.quantity>0)db.movements.push({id:db.nextMovementId++,productId:product.id,type:'IN',quantity:product.quantity,note:'Initial stock',createdAt:now});saveDb(db);return send(res,201,{...product,status:status(product)});
  }
  if(productMatch){const id=Number(productMatch[1]),index=db.products.findIndex(x=>x.id===id);
    if(method==='GET')return index<0?send(res,404,{error:'Product not found.'}):send(res,200,{...db.products[index],status:status(db.products[index])});
    if(index<0)return send(res,404,{error:'Product not found.'});
    if(method==='PUT'){let b;try{b=await body(req)}catch(e){return send(res,400,{error:'Invalid JSON.'})}const v=validate(b);if(v.error)return send(res,400,{error:v.error});if(db.products.some((x,i)=>i!==index&&x.sku.toLowerCase()===v.value.sku.toLowerCase()))return send(res,409,{error:'SKU already exists.'});db.products[index]={...db.products[index],...v.value,updatedAt:new Date().toISOString()};saveDb(db);return send(res,200,{...db.products[index],status:status(db.products[index])});}
    if(method==='DELETE'){db.products.splice(index,1);db.movements=db.movements.filter(x=>x.productId!==id);saveDb(db);return send(res,200,{message:'Product deleted successfully.'});}
  }
  if(movementMatch&&method==='POST'){
    const id=Number(movementMatch[1]),product=db.products.find(x=>x.id===id);if(!product)return send(res,404,{error:'Product not found.'});let b;try{b=await body(req)}catch(e){return send(res,400,{error:'Invalid JSON.'})};const type=text(b.type).toUpperCase(),quantity=num(b.quantity),note=text(b.note);if(!['IN','OUT'].includes(type)||!Number.isInteger(quantity)||quantity<=0)return send(res,400,{error:'Enter a valid stock quantity.'});if(type==='OUT'&&quantity>product.quantity)return send(res,400,{error:`Only ${product.quantity} units are available.`});product.quantity+=type==='IN'?quantity:-quantity;product.updatedAt=new Date().toISOString();db.movements.push({id:db.nextMovementId++,productId:id,type,quantity,note:note||(type==='IN'?'Stock received':'Stock issued'),createdAt:product.updatedAt});saveDb(db);return send(res,200,{...product,status:status(product)});
  }
  if(p==='/api/movements'&&method==='GET')return send(res,200,db.movements.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(m=>{const pr=db.products.find(x=>x.id===m.productId);return {...m,product:pr?.name||'Deleted product',sku:pr?.sku||'-'}}));
  return send(res,404,{error:'API route not found.'});
}

const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type'});return res.end();}
  if(url.pathname.startsWith('/api/')){try{return await api(req,res,url)}catch(e){console.error(e);return send(res,500,{error:'Server error.'})}}
  let file=url.pathname==='/'?path.join(PUBLIC,'index.html'):path.join(PUBLIC,url.pathname.replace(/^\//,''));
  if(!file.startsWith(PUBLIC))return send(res,403,{error:'Forbidden'});
  fs.readFile(file,(err,data)=>{if(err){if(url.pathname!=='/')return fs.readFile(path.join(PUBLIC,'index.html'),(e,d)=>{if(e){res.writeHead(404);res.end('Not found')}else{res.writeHead(200,{'Content-Type':MIME['.html']});res.end(d)}});res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream'});res.end(data)});
});
server.listen(PORT,()=>console.log(`SmartStock is running at http://localhost:${PORT}`));
