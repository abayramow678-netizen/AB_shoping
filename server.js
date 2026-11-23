'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DATA = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data'));
const PORT = Number(process.env.PORT || 3000);
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const IS_PROD = process.env.NODE_ENV === 'production';
fs.mkdirSync(DATA, { recursive:true });
const db = new DatabaseSync(path.join(DATA, 'store.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS products (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 title_tm TEXT NOT NULL, title_ru TEXT NOT NULL, title_en TEXT NOT NULL,
 description_tm TEXT DEFAULT '', description_ru TEXT DEFAULT '', description_en TEXT DEFAULT '',
 category TEXT NOT NULL, price_cents INTEGER NOT NULL, image_url TEXT DEFAULT '',
 emoji TEXT DEFAULT '📦', gradient TEXT DEFAULT 'lavender', sizes TEXT NOT NULL DEFAULT '', active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS orders (
 id INTEGER PRIMARY KEY AUTOINCREMENT, customer_name TEXT NOT NULL,
 phone TEXT NOT NULL, email TEXT DEFAULT '', country TEXT NOT NULL,
 city TEXT NOT NULL, address TEXT NOT NULL, note TEXT DEFAULT '',
 language TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new',
 currency TEXT NOT NULL, subtotal_cents INTEGER NOT NULL,
 demo INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS order_items (
 id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL,
 product_id INTEGER, title TEXT NOT NULL, unit_price_cents INTEGER NOT NULL,
 quantity INTEGER NOT NULL, size TEXT NOT NULL DEFAULT '', FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);`);
// Upgrade existing databases without losing saved products or orders.
for(const [table,col] of [['products','sizes'],['order_items','size']]){
 const columns=db.prepare(`PRAGMA table_info(${table})`).all();
 if(!columns.some(c=>c.name===col))db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} TEXT NOT NULL DEFAULT ''`);
}
// AB_shoping official customer contact links. Shown on the storefront and editable by admin.
const CONTACT_LINKS = {
  instagram:'https://www.instagram.com/dr.bayramov_ahmet/',
  telegram:'https://t.me/dr_bayramow',
  whatsapp:'https://wa.me/99365132834'
};
const seedSettings = {
  currency:'USD', ...CONTACT_LINKS,
  demo_mode:'1', shop_notice_tm:'', shop_notice_ru:'', shop_notice_en:''
};
for (const [k,v] of Object.entries(seedSettings)) db.prepare('INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)').run(k,v);
// Apply the requested contact update once to already-created SQLite stores too.
// The migration flag means subsequent admin edits will NOT be overwritten on restart.
const contactMigration = 'social_contacts_20261123';
if (!db.prepare('SELECT value FROM settings WHERE key=?').get(contactMigration)) {
 const put = db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
 db.exec('BEGIN IMMEDIATE');
 try {
  for (const [key,value] of Object.entries(CONTACT_LINKS)) put.run(key,value);
  put.run(contactMigration,'1');
  db.exec('COMMIT');
 } catch (e) { db.exec('ROLLBACK'); throw e; }
}
if (!db.prepare("SELECT value FROM settings WHERE key='catalog_seeded'").get() && db.prepare('SELECT COUNT(*) AS n FROM products').get().n === 0) {
 const seed = [
 ['Minimalist sumka','Минималистичная сумка','Minimalist shoulder bag','Gündelik ulanmak üçin döwrebap sumka.','Современная сумка на каждый день.','Modern bag for everyday use.','fashion',3890,'','👜','peach'],
 ['Simsiz nauşnik','Беспроводные наушники','Wireless headphones','Gündelik diňlemek üçin ýeňil nauşnik.','Лёгкие наушники для повседневного использования.','Lightweight headphones for everyday listening.','electronics',5490,'','🎧','lavender'],
 ['Keramik käse','Керамическая кружка','Ceramic coffee mug','Ýönekeý we owadan dizaýnly käse.','Кружка с лаконичным дизайном.','A mug with a clean, minimalist design.','home',1850,'','☕','mint'],
 ['Gündelik krossowka','Повседневные кроссовки','Everyday sneakers','Her gün geýmek üçin sport aýakgap.','Удобные кроссовки на каждый день.','Casual sneakers for everyday wear.','fashion',6290,'','👟','blue'],
 ['Akylly sagat','Умные часы','Smart watch','Häzirki zaman görnüşli sagat.','Часы в современном стиле.','Modern-style smart watch.','electronics',7490,'','⌚','sand'],
 ['Derini ideg toplumy','Набор для ухода за кожей','Skincare set','Özüňe ideg etmek üçin toplum.','Набор для ежедневного ухода.','A set for your daily skincare routine.','beauty',3290,'','🧴','pink'],
 ['Stol çyrasy','Настольная лампа','Desk lamp','Okamak we işlemek üçin stol çyrasy.','Настольная лампа для учёбы и работы.','A desk lamp for studying and working.','home',4450,'','💡','lavender'],
 ['Şäher ryukzagy','Городской рюкзак','City backpack','Syýahat we okuw üçin ýeňil ryukzak.','Лёгкий рюкзак для поездок и учёбы.','Lightweight backpack for travel and study.','fashion',3990,'','🎒','mint']
 ];
 const ins=db.prepare(`INSERT INTO products(title_tm,title_ru,title_en,description_tm,description_ru,description_en,category,price_cents,image_url,emoji,gradient) VALUES(?,?,?,?,?,?,?,?,?,?,?)`);
 for(const row of seed) ins.run(...row);
}
db.prepare("INSERT OR IGNORE INTO settings(key,value) VALUES('catalog_seeded','1')").run();
// Existing demo catalog: add available shoe sizes and one example piece of clothing.
db.prepare("UPDATE products SET sizes='36,37,38,39,40,41,42,43,44,45' WHERE title_en='Everyday sneakers' AND sizes=''").run();
if(db.prepare("SELECT value FROM settings WHERE key='clothing_sample_v1'").get()===undefined){
 if(db.prepare("SELECT value FROM settings WHERE key='demo_mode'").get()?.value==='1' && !db.prepare("SELECT 1 FROM products WHERE title_en='Classic cotton T-shirt'").get()){
  db.prepare("INSERT INTO products(title_tm,title_ru,title_en,description_tm,description_ru,description_en,category,price_cents,image_url,emoji,gradient,sizes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)")
  .run('Pagta futbolka','Хлопковая футболка','Classic cotton T-shirt','Ölçeg saýlap bolýar (synag harydy).','Можно выбрать размер (демо).','Choose your size (demo product).','fashion',2490,'','👕','blue','S,M,L,XL,XXL');
 }
 db.prepare("INSERT INTO settings(key,value) VALUES('clothing_sample_v1','1')").run();
}
function cfg(){return Object.fromEntries(db.prepare('SELECT key,value FROM settings').all().map(x=>[x.key,x.value]));}
function json(res,status,payload,extra={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extra});res.end(JSON.stringify(payload));}
function err(res,status,msg){return json(res,status,{error:msg});}
function body(req){return new Promise((resolve,reject)=>{let data='';let size=0;req.on('data',x=>{size+=x.length;if(size>1600000){reject(new Error('Request too large'));req.destroy();return;}data+=x;});req.on('end',()=>{try{resolve(JSON.parse(data || '{}'));}catch{reject(new Error('Invalid JSON'));}});req.on('error',reject);});}
function clean(v,max=200){return String(v??'').trim().slice(0,max);}
function validText(v,min,max){return typeof v==='string'&&v.trim().length>=min&&v.trim().length<=max;}
function safeLink(value,service){
  const raw=clean(value,200);
  if(!raw)return '';
  if(service==='whatsapp'&&/^\+?[0-9 ()-]{8,20}$/.test(raw))return 'https://wa.me/'+raw.replace(/\D/g,'');
  if((service==='instagram'||service==='telegram')&&/^@?[a-zA-Z0-9._]{3,35}$/.test(raw)){
    const user=raw.replace(/^@/,'');
    return service==='instagram'?'https://www.instagram.com/'+user+'/':'https://t.me/'+user;
  }
  try{const url=new URL(raw);if(url.protocol!=='https:')return null;
    const allowed=service==='instagram'?['instagram.com','www.instagram.com']:service==='telegram'?['t.me','telegram.me','www.t.me']:['wa.me','api.whatsapp.com','chat.whatsapp.com'];
    return allowed.includes(url.hostname.toLowerCase())?url.toString():null;
  }catch{return null;}
}
const loginTries=new Map();
const sessions=new Map();
function token(){return crypto.randomBytes(32).toString('hex');}
function adminSession(req){const cookie=req.headers.cookie||'';const found=/(?:^|;\s*)ab_session=([a-f0-9]{64})(?:;|$)/.exec(cookie);if(!found)return false;const key=crypto.createHash('sha256').update(found[1]).digest('hex');const s=sessions.get(key);if(!s||s<Date.now()){sessions.delete(key);return false;}return true;}
function requireAdmin(req,res){if(!adminSession(req)){err(res,401,'Admin login required');return false;}return true;}
function guardMutation(req,res){
  if(!['POST','PUT','DELETE','PATCH'].includes(req.method))return true;
  if(req.headers['content-type']?.split(';')[0] !== 'application/json'){err(res,415,'JSON required');return false;}
  if(req.headers['x-ab-request']!=='1'){err(res,403,'Missing request header');return false;}
  const origin=req.headers.origin;
  if(origin){try{if(new URL(origin).host!==req.headers.host){err(res,403,'Invalid origin');return false;}}catch{err(res,403,'Invalid origin');return false;}}
  return true;
}
function getProducts(admin=false){return db.prepare('SELECT * FROM products '+(admin?'':'WHERE active=1 ')+'ORDER BY id DESC').all().map(p=>({...p,active:Boolean(p.active)}));}
const statuses=new Set(['new','confirmed','processing','shipped','delivered','cancelled']);
function productInput(b){
 const cols=['title_tm','title_ru','title_en'];if(!cols.every(k=>validText(b[k],2,120)))throw new Error('Product names required in all 3 languages (2–120 characters)');
 const categories=['fashion','electronics','home','beauty'];if(!categories.includes(b.category))throw new Error('Invalid category');
 const price=Number(b.price_cents);if(!Number.isSafeInteger(price)||price<1||price>100000000)throw new Error('Invalid price');
 const image=clean(b.image_url,1500000);
 if(image){
  const isHttps=/^https:\/\/[a-z0-9.-]+(?:[:][0-9]+)?(?:[/?#]|$)/i.test(image);
  const isData=/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(image);
  if(!isHttps&&!isData)throw new Error('Use an HTTPS image URL or upload an image file');
  if(isData&&image.length>1400000)throw new Error('Uploaded image is too large');
 }
 const gradients=['lavender','peach','mint','blue','sand','pink'];
 const rawSizes=clean(b.sizes,300);
 const options=rawSizes?rawSizes.split(',').map(x=>x.trim()).filter(Boolean):[];
 if(options.length>25||options.some(x=>x.length>15||!/^[\p{L}\p{N} .+\/-]+$/u.test(x))||new Set(options.map(x=>x.toLowerCase())).size!==options.length)throw new Error('Invalid sizes: comma-separated unique size values required');
 return {title_tm:clean(b.title_tm,120),title_ru:clean(b.title_ru,120),title_en:clean(b.title_en,120),description_tm:clean(b.description_tm,700),description_ru:clean(b.description_ru,700),description_en:clean(b.description_en,700),category:b.category,price_cents:price,image_url:image,emoji:clean(b.emoji,8)||'📦',gradient:gradients.includes(b.gradient)?b.gradient:'lavender',sizes:options.join(','),active:b.active===false||b.active===0?0:1};
}
function writeProduct(id,p){const keys=Object.keys(p);if(id){db.prepare('UPDATE products SET '+keys.map(k=>`${k}=?`).join(',')+' WHERE id=?').run(...keys.map(k=>p[k]),id);return id;}
 return Number(db.prepare('INSERT INTO products('+keys.join(',')+') VALUES('+keys.map(()=>'?').join(',')+')').run(...keys.map(k=>p[k])).lastInsertRowid);
}
function sendStatic(req,res,pathname){let urlPath=pathname==='/'?'/index.html':pathname==='/admin'?'/admin.html':pathname;const target=path.resolve(PUBLIC,'.'+urlPath);if(!target.startsWith(PUBLIC+path.sep))return err(res,404,'Not found');const ext=path.extname(target);const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'}[ext];if(!mime)return err(res,404,'Not found');fs.readFile(target,(e,d)=>{if(e)return err(res,404,'Not found');res.writeHead(200,{'Content-Type':mime,'Cache-Control':ext==='.html'?'no-cache':'public, max-age=600'});res.end(d);});}
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('Permissions-Policy','geolocation=(), microphone=(), camera=()');
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https: data:; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
 if(IS_PROD)res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains');
 const pathname=new URL(req.url||'/', 'http://localhost').pathname;
 if(!pathname.startsWith('/api/'))return sendStatic(req,res,pathname);
 try{
  if(!guardMutation(req,res))return;
  if(req.method==='GET'&&pathname==='/api/config'){
   const c=cfg();return json(res,200,{currency:c.currency,demo_mode:c.demo_mode==='1',socials:{instagram:c.instagram,telegram:c.telegram,whatsapp:c.whatsapp},notice:{tm:c.shop_notice_tm,ru:c.shop_notice_ru,en:c.shop_notice_en}});
  }
  if(req.method==='GET'&&pathname==='/api/products')return json(res,200,{products:getProducts()});
  if(req.method==='POST'&&pathname==='/api/orders'){
   const b=await body(req);if(!validText(b.customer_name,2,100)||!validText(b.phone,6,40)||!validText(b.country,2,80)||!validText(b.city,2,80)||!validText(b.address,5,300))return err(res,400,'Please complete the required customer fields');
   if(b.email&&(!/^\S+@\S+\.\S+$/.test(b.email)||b.email.length>150))return err(res,400,'Invalid email');
   if(!Array.isArray(b.items)||b.items.length===0||b.items.length>25)return err(res,400,'Invalid cart');
   const ids=new Set();let total=0;const lines=[];
   for(const item of b.items){const id=Number(item.product_id),q=Number(item.quantity);if(!Number.isSafeInteger(id)||!Number.isSafeInteger(q)||q<1||q>20)return err(res,400,'Invalid cart item');
    const product=db.prepare('SELECT * FROM products WHERE id=? AND active=1').get(id);if(!product)return err(res,400,'Product unavailable');
    const allowed=(product.sizes||'').split(',').map(x=>x.trim()).filter(Boolean);const size=clean(item.size,20);
    if((allowed.length&&!allowed.includes(size))||(!allowed.length&&size))return err(res,400,'Invalid or missing size');
    const itemKey=id+'|'+size;if(ids.has(itemKey))return err(res,400,'Duplicate variant');ids.add(itemKey);
    total+=product.price_cents*q;if(total>1000000000)return err(res,400,'Cart too large');lines.push({id,title:product.title_en,price:product.price_cents,q,size});}
   const config=cfg();const lang=['tm','ru','en'].includes(b.language)?b.language:'tm';
   db.exec('BEGIN IMMEDIATE');let oid;
   try{oid=Number(db.prepare('INSERT INTO orders(customer_name,phone,email,country,city,address,note,language,status,currency,subtotal_cents,demo) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(clean(b.customer_name,100),clean(b.phone,40),clean(b.email,150),clean(b.country,80),clean(b.city,80),clean(b.address,300),clean(b.note,1000),lang,'new',config.currency,total,config.demo_mode==='1'?1:0).lastInsertRowid);
    const stmt=db.prepare('INSERT INTO order_items(order_id,product_id,title,unit_price_cents,quantity,size) VALUES(?,?,?,?,?,?)');for(const line of lines)stmt.run(oid,line.id,line.title,line.price,line.q,line.size);db.exec('COMMIT');
   }catch(e){db.exec('ROLLBACK');throw e;}
   return json(res,201,{order_number:'AB-'+String(oid).padStart(6,'0'),demo:config.demo_mode==='1',total_cents:total,currency:config.currency});
  }
  if(req.method==='POST'&&pathname==='/api/admin/login'){
   const ip=(req.socket.remoteAddress||'unknown'),attempt=loginTries.get(ip)||{n:0,reset:Date.now()+900000};if(attempt.reset<Date.now()){attempt.n=0;attempt.reset=Date.now()+900000;}
   if(attempt.n>=8)return err(res,429,'Too many login attempts; try again later');
   const b=await body(req);const mail=clean(b.email,160).toLowerCase();const pass=String(b.password||'');
   const secureEqual=(a,b)=>{const x=crypto.createHash('sha256').update(a).digest(),y=crypto.createHash('sha256').update(b).digest();return crypto.timingSafeEqual(x,y);};
   if(!ADMIN_EMAIL||ADMIN_PASSWORD.length<12||!secureEqual(mail,ADMIN_EMAIL)||!secureEqual(pass,ADMIN_PASSWORD)){
    attempt.n++;loginTries.set(ip,attempt);return err(res,401,'Invalid login or admin account not configured');}
   loginTries.delete(ip);const sid=token();sessions.set(crypto.createHash('sha256').update(sid).digest('hex'),Date.now()+43200000);
   return json(res,200,{ok:true},{'Set-Cookie':`ab_session=${sid}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${IS_PROD?'; Secure':''}`});
  }
  if(req.method==='POST'&&pathname==='/api/admin/logout'){
   const cookie=req.headers.cookie||'';const found=/(?:^|;\s*)ab_session=([a-f0-9]{64})(?:;|$)/.exec(cookie);if(found)sessions.delete(crypto.createHash('sha256').update(found[1]).digest('hex'));
   return json(res,200,{ok:true},{'Set-Cookie':`ab_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${IS_PROD?'; Secure':''}`});
  }
  if(pathname.startsWith('/api/admin/')){
   if(!requireAdmin(req,res))return;
   if(req.method==='GET'&&pathname==='/api/admin/me')return json(res,200,{ok:true,email:ADMIN_EMAIL});
   if(req.method==='GET'&&pathname==='/api/admin/products')return json(res,200,{products:getProducts(true)});
   if(req.method==='POST'&&pathname==='/api/admin/products'){const p=productInput(await body(req));const id=writeProduct(null,p);return json(res,201,{id});}
   const productMatch=/^\/api\/admin\/products\/(\d+)$/.exec(pathname);
   if(productMatch&&req.method==='PUT'){const id=Number(productMatch[1]);if(!db.prepare('SELECT 1 FROM products WHERE id=?').get(id))return err(res,404,'Product not found');const p=productInput(await body(req));writeProduct(id,p);return json(res,200,{ok:true});}
   if(productMatch&&req.method==='DELETE'){db.prepare('DELETE FROM products WHERE id=?').run(Number(productMatch[1]));return json(res,200,{ok:true});}
   if(req.method==='GET'&&pathname==='/api/admin/orders'){
    const rows=db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 500').all();const items=db.prepare('SELECT * FROM order_items WHERE order_id=?');return json(res,200,{orders:rows.map(o=>({...o,order_number:'AB-'+String(o.id).padStart(6,'0'),items:items.all(o.id)}))});
   }
   const orderMatch=/^\/api\/admin\/orders\/(\d+)$/.exec(pathname);
   if(orderMatch&&req.method==='PATCH'){const b=await body(req);if(!statuses.has(b.status))return err(res,400,'Invalid status');const x=db.prepare('UPDATE orders SET status=? WHERE id=?').run(b.status,Number(orderMatch[1]));return x.changes?json(res,200,{ok:true}):err(res,404,'Order not found');}
   if(req.method==='GET'&&pathname==='/api/admin/settings')return json(res,200,{settings:cfg()});
   if(req.method==='PUT'&&pathname==='/api/admin/settings'){
    const b=await body(req);if(!['USD','CNY','TMT','EUR'].includes(b.currency))return err(res,400,'Invalid currency');
    const data={currency:b.currency,demo_mode:b.demo_mode?'1':'0'};
    for(const social of ['instagram','telegram','whatsapp']){const link=safeLink(b[social],social);if(link===null)return err(res,400,`Invalid ${social} link/handle`);data[social]=link;}
    for(const k of ['tm','ru','en'])data['shop_notice_'+k]=clean(b['shop_notice_'+k],220);
    const put=db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');db.exec('BEGIN IMMEDIATE');try{for(const [key,value] of Object.entries(data))put.run(key,value);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
    return json(res,200,{ok:true,settings:cfg()});
   }
  }
  return err(res,404,'Not found');
 }catch(e){console.error('[api]',e.message);if(!res.headersSent)err(res,400,e.message==='Request too large'?'Request too large':e.message==='Invalid JSON'?'Invalid JSON':e.message.startsWith('Product')||e.message.startsWith('Invalid')||e.message.startsWith('Use an')?e.message:'Request failed');}
});
server.listen(PORT, '0.0.0.0',()=>{console.log(`AB_shoping running at http://localhost:${PORT}`);if(!ADMIN_EMAIL||ADMIN_PASSWORD.length<12)console.warn('⚠️ Admin login is disabled until ADMIN_EMAIL and ADMIN_PASSWORD (12+ chars) are set.');});
