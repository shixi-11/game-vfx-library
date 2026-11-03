import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.dirname(fileURLToPath(import.meta.url));
const upstream=path.join(root,'01_开源特效/PixelFX');
const {allIds,loadEffect}=await import(pathToFileURL(path.join(upstream,'tools/lib/fxlib.mjs')));
const commit='a84159688af3ca37a4be05a0d422b94451b2e24e'; // Pinned revision of the vendored source.
if(commit!=='a84159688af3ca37a4be05a0d422b94451b2e24e')throw new Error('Unexpected source revision');
const selected=['fire/torch','explosions/small-explosion','ice/frost-nova','melee/sword-slash','moves/fireball-throw','ui/coin-collect'];
const labels={'fire/torch':'火焰','explosions/small-explosion':'爆炸与烟雾','ice/frost-nova':'冰霜扩散','melee/sword-slash':'剑气','moves/fireball-throw':'火球投掷','ui/coin-collect':'拾取反馈'};
const categories={moves:'完整招式',fire:'火焰',explosions:'爆炸',water:'水',ice:'冰霜',lightning:'闪电',scifi:'科幻','sci-fi':'科幻',melee:'近战',impacts:'命中',projectiles:'投射物',spawn:'生成与消散',arcane:'奥术',holy:'神圣',shadow:'暗影',status:'状态',nature:'自然',weather:'天气',ui:'界面反馈',pickups:'拾取物',transitions:'转场',critters:'小生物'};
const effects=[];
for(const id of allIds()){
 const {meta,mod}=await loadEffect(id);const [category,name]=id.split('/');
 const item={id,provider:'PixelFX',category,category_zh:categories[category]||category,name:meta.name,description:meta.desc,tags:meta.tags,
  source:`01_开源特效/PixelFX/src/fx/${id}.js`,size:meta.size,origin:meta.origin,fps:meta.fps,duration:meta.duration,loop:meta.loop,
  simulated:typeof mod.create==='function',actor_dependent:!!meta.actor,has_act:!!mod.act,status:'downloaded-source',license:'MIT',source_commit:commit};
 if(selected.includes(id)){
  const base=`02_导出样例/PixelFX/${id}`,jsonPath=`${base}/${name}.json`,sheet=JSON.parse(fs.readFileSync(path.join(root,jsonPath),'utf8'));
  item.example={label:labels[id],sheet:`${base}/${name}.png`,metadata:jsonPath,contact:`${base}/contact.png`,frame_count:sheet.frames.length};
  item.status='sample-exported';
 }
 effects.push(item);
}
if(effects.length!==244)throw new Error('Unexpected effect inventory');
if(fs.existsSync(path.join(upstream,'gallery/fonts')))throw new Error('Excluded font was downloaded');
const existing=[
 {id:'spell-lab',name:'星隙法术试验场',path:'spell-lab',entry:'index.html',kind:'Three.js / React Three Fiber',scope:'三种法术与14种可切换命中特效',status:'included'}
];
for(const x of existing)if(!fs.existsSync(path.join(root,x.path,x.entry)))throw new Error('Missing project: '+x.id);
const resources=JSON.parse(fs.readFileSync(path.join(root,'资源清单.json'),'utf8'));
if(resources.schema!==1)throw new Error('Unsupported resource manifest');
const {collections,assets,sequences}=resources;
function localFile(rel){
 if(typeof rel!=='string'||path.isAbsolute(rel)||/^[a-z]:/i.test(rel)||rel.includes('\\'))throw new Error('Invalid local path');
 const full=path.resolve(root,rel),relative=path.relative(root,full);
 if(relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative))throw new Error('Path escapes library');
 const actual=fs.realpathSync(full),realRelative=path.relative(fs.realpathSync(root),actual);
 if(realRelative==='..'||realRelative.startsWith('..'+path.sep)||path.isAbsolute(realRelative))throw new Error('Resource resolves outside library');
 return full;
}
const byId=new Map(),byPath=new Map(),collectionIds=new Set();
for(const c of collections){
 if(collectionIds.has(c.id))throw new Error('Duplicate collection: '+c.id);
 collectionIds.add(c.id);localFile(c.license_file);
}
for(const a of assets){
 if(byId.has(a.id)||!collectionIds.has(a.collection_id))throw new Error('Duplicate or unknown asset: '+a.id);
 const data=fs.readFileSync(localFile(a.path));
 if(data.length!==a.bytes||createHash('sha256').update(data).digest('hex')!==a.sha256)throw new Error('Resource integrity mismatch: '+a.id);
 byId.set(a.id,a);byPath.set(a.path,a);
}
for(const c of collections){
 if(c.asset_ids.length!==c.file_count||new Set(c.asset_ids).size!==c.file_count)throw new Error('Collection count mismatch: '+c.id);
 if(c.asset_ids.some(id=>byId.get(id)?.collection_id!==c.id))throw new Error('Wrong collection member: '+c.id);
 if(assets.filter(a=>a.collection_id===c.id).length!==c.file_count)throw new Error('Unlisted asset: '+c.id);
}
const sequenceIds=new Set();
const naturalOrder=new Intl.Collator('en',{numeric:true});
for(const s of sequences){
 if(sequenceIds.has(s.id)||!collectionIds.has(s.collection_id)||!s.frame_count||s.frames.length!==s.frame_count)throw new Error('Invalid sequence: '+s.id);
 sequenceIds.add(s.id);
 if(!s.frames.includes(s.poster)||s.frames.some(p=>byPath.get(p)?.collection_id!==s.collection_id||!byPath.get(p)?.image))throw new Error('Missing sequence image: '+s.id);
 const ordered=[...s.frames].sort((a,b)=>naturalOrder.compare(a,b));
 if(s.frames.some((p,i)=>p!==ordered[i])||new Set(s.frames).size!==s.frames.length)throw new Error('Sequence order mismatch: '+s.id);
}
const catalog={schema:1,date:'2026-11-04',library_root_hint:'.',authority:'game-vfx-library',
 providers:[{id:'PixelFX',url:'https://github.com/patch-gg/pixelfx',commit,version:'0.3.0',local:'01_开源特效/PixelFX',license:'MIT',notice:'01_开源特效/PixelFX/NOTICE.md',excluded:['gallery/fonts','upstream Agent skill registration','node_modules','local gallery server']}],
 existing_projects:existing,effects,collections,assets,sequences,reuse:resources.reuse,not_downloaded:resources.not_downloaded};
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const demos=effects.filter(x=>x.example).map(e=>({id:e.id,label:e.example.label,sheet:e.example.sheet,frames:JSON.parse(fs.readFileSync(path.join(root,e.example.metadata),'utf8')).frames,fps:e.fps,loop:e.loop}));
const rows=effects.map(e=>`<tr data-search="${esc([e.id,e.category_zh,e.name,...e.tags].join(' ').toLowerCase())}"><td>${esc(e.category_zh)}</td><td><a href="${esc(e.source)}">${esc(e.id)}</a></td><td>${esc(e.name)}</td><td>${e.loop?'循环':'一次性'}</td><td>${e.example?'已导出样例':'源码已下载'}</td></tr>`).join('\n');
const kinds={texture:'贴图',sequence:'序列帧','texture-sheet':'光束素材图','effekseer-project':'特效工程与依赖','godot-shader':'Godot着色器'};
const collectionCards=collections.map(c=>{
 const images=assets.filter(a=>a.collection_id===c.id&&a.image);
 const pick=c.kind==='sequence'?sequences.filter(s=>s.collection_id===c.id).slice(0,3).map(s=>({path:s.poster,name:s.name})):Array.from(new Set([0,Math.floor(images.length/2),images.length-1])).filter(i=>i>=0&&images[i]).map(i=>images[i]);
 return `<article class="card"><h3>${esc(c.name)}</h3><p>${esc(c.provider)} · ${esc(c.license)}</p><div class="thumbs">${pick.map(a=>`<img loading="lazy" width="160" height="120" src="${esc(a.path)}" alt="${esc(a.name)}">`).join('')}</div><p>${esc(c.notes)}</p><p>${c.png_count?c.png_count+'张PNG':'1份着色器源码'}${c.effect_project_count?' · '+c.effect_project_count+'个工程':''}</p><div class="links"><a href="${esc(c.base+'/')}">本地文件</a><a href="${esc(c.license_file)}">许可</a><a href="${esc(c.source)}">来源</a></div></article>`;
}).join('');
const sequenceCards=sequences.map(s=>`<article class="card"><img class="poster" loading="lazy" width="240" height="180" src="${esc(s.poster)}" alt="${esc(s.name)}静帧"><h3>${esc(s.name)}</h3><p>${s.frame_count}帧 · 原始帧率未注明</p><a href="${esc(path.posix.dirname(s.poster)+'/')}">查看原生序列</a></article>`).join('');
const assetRows=assets.map(a=>{const c=collections.find(c=>c.id===a.collection_id);return `<tr data-search="${esc([a.id,a.name,c.name,c.provider,...a.tags].join(' ').toLowerCase())}"><td>${esc(c.name)}</td><td><a href="${esc(a.path)}">${esc(a.name)}</a></td><td>${esc(kinds[a.kind])}</td><td>${a.image?a.image.width+'×'+a.image.height:'源码'}</td><td><a href="${esc(c.license_file)}">${esc(a.license)}</a></td></tr>`}).join('');
const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>游戏特效库</title>
<style>*{box-sizing:border-box}body{margin:0;background:#101b22;color:#e8e4da;font:16px/1.65 system-ui,"Microsoft YaHei",sans-serif}main{max-width:1280px;margin:auto;padding:36px 24px}h1{font-size:32px;margin-bottom:8px}h2{font-size:22px;margin-top:40px}p{max-width:850px;color:#bac5c9}a{color:#90d7ce}button,input{font:inherit}button{padding:8px 18px;border:1px solid #50666d;background:#20343e;color:inherit;border-radius:8px;cursor:pointer}input{padding:12px;width:100%;max-width:650px;border:1px solid #50666d;border-radius:8px;background:#192a32;color:inherit}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px}.card{background:#172933;border:1px solid #314751;padding:16px;border-radius:12px}.card canvas{display:block;width:100%;height:220px;object-fit:contain;background:repeating-conic-gradient(#253740 0% 25%,#203039 0% 50%) 50%/20px 20px;image-rendering:pixelated;pointer-events:none}.card h3{margin:12px 0 4px}.links{display:flex;gap:16px;flex-wrap:wrap}.table-wrap{overflow:auto}table{border-collapse:collapse;width:100%;min-width:660px;margin-top:16px}th,td{text-align:left;padding:11px 14px;border-bottom:1px solid #314751}th{color:#a9c1c7}code{word-break:break-word}.note{font-size:14px}footer{margin-top:40px;color:#91a7b0}@media(max-width:600px){main{padding:24px 16px}h1{font-size:28px}}.thumbs{display:flex;gap:8px;overflow:auto}.thumbs img{width:30%;height:100px;object-fit:contain;background:#253740;pointer-events:none}.poster{display:block;width:100%;height:180px;object-fit:contain;background:#253740;pointer-events:none}summary{cursor:pointer;padding:12px 0}</style>
<main><h1>游戏特效库</h1><p>按用途查找特效源码、导出样例和已有工程。PixelFX 已有244项源码和六组动画样例，另收录八组免费贴图、透明序列与特效源码。</p>
<div class="links"><a href="README.md">使用说明</a><a href="特效查找与更新指南.md">查找与更新</a><a href="#resources">新入库资源</a><a href="特效索引.json">完整索引</a><a href="01_开源特效/PixelFX/LICENSE">许可声明</a><a href="https://github.com/patch-gg/pixelfx">PixelFX 原仓库</a></div>
<h2>导出样例</h2><p>预览默认静止，点击后重复演示。样例保留原生像素尺寸和透明 PNG；放大仅用于查看。</p><button id="toggle">播放样例</button><div class="grid" id="demos"></div>
<h2 id="resources">免费素材与源码</h2><p>贴图可直接选取，工程和着色器按对应引擎使用。仅保存源文件的资源尚未做运行验证。</p><div class="grid">${collectionCards}</div>
<h2>二维法术序列</h2><p>以下显示静帧，原生透明PNG序列可直接取用；按项目节奏设置播放速度。</p><div class="grid">${sequenceCards}</div>
<h2>已有工程</h2><div class="grid">${existing.map(x=>`<article class="card"><h3>${esc(x.name)}</h3><p>${esc(x.scope)}</p><code>${esc(x.path)}</code></article>`).join('')}</div>
<h2>PixelFX特效</h2><label for="search">搜索名称、分类或标签</label><br><input id="search" type="search" placeholder="例如：冰霜、火焰、slash、smoke"><p id="count">244 项</p><div class="table-wrap"><table><thead><tr><th>分类</th><th>特效源码</th><th>名称</th><th>播放方式</th><th>本地状态</th></tr></thead><tbody id="pixel-rows">${rows}</tbody></table></div>
<h2>素材与源码文件</h2><label for="asset-search">搜索新入库的素材和源码</label><br><input id="asset-search" type="search" placeholder="例如：烟雾、法阵、剑火、light、dissolve"><p id="asset-count">${assets.length}个文件</p><details id="asset-details"><summary>展开文件列表</summary><div class="table-wrap"><table><thead><tr><th>资源组</th><th>文件</th><th>类型</th><th>原生尺寸</th><th>许可</th></tr></thead><tbody id="asset-rows">${assetRows}</tbody></table></div></details>
<footer>新增资源按各自许可取用，详情在资源组的许可和来源文件中。PixelFX 代码与特效采用 MIT 许可，使用时保留版权与许可声明。Patch Pixel 演示字体未收录。已有工程和其模型、纹理等素材分别遵循原项目授权。</footer></main>
<script type="module">const data=${JSON.stringify(demos).replaceAll('<','\\u003c')};const grid=document.querySelector('#demos');let playing=false,raf=0,start=0;const items=[];
for(const d of data){const card=document.createElement('article');card.className='card';const c=document.createElement('canvas');const f=d.frames[0].frame;c.width=f.w;c.height=f.h;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;const img=new Image();const title=document.createElement('h3');title.textContent=d.label;const link=document.createElement('a');link.href=d.sheet;link.textContent='透明PNG图集';const text=document.createElement('p');text.textContent=d.id;card.append(c,title,text,link);grid.append(card);const item={d,c,ctx,img,ready:false};img.onload=()=>{item.ready=true;draw(item,Math.floor(d.frames.length/3))};img.src=d.sheet;items.push(item)}
function draw(i,n){if(!i.ready)return;const f=i.d.frames[n%i.d.frames.length].frame;i.ctx.clearRect(0,0,i.c.width,i.c.height);i.ctx.drawImage(i.img,f.x,f.y,f.w,f.h,0,0,f.w,f.h)}
function tick(t){if(!playing||document.hidden){raf=0;return}for(const i of items)draw(i,Math.floor((t-start)/1000*i.d.fps));raf=requestAnimationFrame(tick)}
document.querySelector('#toggle').onclick=()=>{playing=!playing;document.querySelector('#toggle').textContent=playing?'暂停样例':'播放样例';if(playing){start=performance.now();raf=requestAnimationFrame(tick)}else{cancelAnimationFrame(raf);raf=0}};
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0}else if(playing&&!raf){start=performance.now();raf=requestAnimationFrame(tick)}});
addEventListener('pagehide',()=>{playing=false;cancelAnimationFrame(raf)});
document.querySelector('#search').oninput=e=>{const q=e.target.value.trim().toLowerCase();let n=0;for(const row of document.querySelectorAll('#pixel-rows tr')){row.hidden=!row.dataset.search.includes(q);if(!row.hidden)n++}document.querySelector('#count').textContent=n+' 项'};
document.querySelector('#asset-search').oninput=e=>{const q=e.target.value.trim().toLowerCase();let n=0;for(const row of document.querySelectorAll('#asset-rows tr')){row.hidden=!row.dataset.search.includes(q);if(!row.hidden)n++}document.querySelector('#asset-count').textContent=n+'个文件';if(q)document.querySelector('#asset-details').open=true};
</script></html>`;
fs.writeFileSync(path.join(root,'特效索引.json'),JSON.stringify(catalog,null,2)+'\n');
fs.writeFileSync(path.join(root,'特效目录.html'),html);
console.log(JSON.stringify({effects:effects.length,examples:demos.length,existing:existing.length,collections:collections.length,assetFiles:assets.length,sequences:sequences.length,fontsExcluded:true,entry:path.join(root,'特效目录.html')}));
