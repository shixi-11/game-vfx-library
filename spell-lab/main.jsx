import React,{useState,useMemo,useRef,useEffect,useCallback,Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {Canvas,useFrame} from '@react-three/fiber';
import {OrbitControls,Trail,Line} from '@react-three/drei';
import {Physics,RigidBody,BallCollider,CylinderCollider} from '@react-three/rapier';
import {EffectComposer,Bloom,Vignette} from '@react-three/postprocessing';
import * as THREE from 'three';
import {SpellEffects,ImpactPulse} from './vfx.jsx';
import {SPELLS,TARGETS,ORIGIN} from './spells.js';
import {looks} from './library-looks.js';
import {LibraryEffects} from './library-vfx.jsx';
import './style.css';

window.spellLab={frames:0,casts:0,impacts:0,debrisCollisions:0,sparks:0,smoke:0,events:[],projectiles:0};
const now=()=>performance.now()/1000;
const emissive=(color,intensity=2)=>({color,emissive:color,emissiveIntensity:intensity,toneMapped:false});
function Ring({radius,color='#638b91',width=.015,y=.015,opacity=1}){return <mesh rotation={[-Math.PI/2,0,0]} position={[0,y,0]}><ringGeometry args={[radius-width,radius+width,144]}/><meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} side={THREE.DoubleSide}/></mesh>;}
function RuneCircle(){const ref=useRef();useFrame((_,dt)=>{ref.current.rotation.y-=dt*.025;});return <group ref={ref}>
 {[2.15,2.3,5.65,5.72,6.65].map((r,i)=><Ring key={r} radius={r} color={i<2?'#548e93':'#3e666c'} width={i===2?.027:.012}/>)}
 {Array.from({length:64},(_,i)=>{const a=i/64*Math.PI*2;return <mesh key={i} position={[Math.cos(a)*6.2,.024,Math.sin(a)*6.2]} rotation={[-Math.PI/2,0,-a]}><planeGeometry args={[i%4===0?.24:.10,.025]}/><meshBasicMaterial color={i%4===0?'#9ebdae':'#477b80'} toneMapped={false}/></mesh>;})}
 {[0,Math.PI/3,Math.PI*2/3].map(a=><mesh key={a} rotation={[-Math.PI/2,0,a]} position={[0,.018,0]}><ringGeometry args={[3.85,3.865,3]}/><meshBasicMaterial color="#33535e" side={THREE.DoubleSide}/></mesh>)}
 </group>;}
function Sanctuary(){const orb=useRef();const stars=useMemo(()=>{const a=new Float32Array(220*3);for(let i=0;i<220;i++){a[i*3]=(Math.random()-.5)*55;a[i*3+1]=2+Math.random()*16;a[i*3+2]=-10-Math.random()*30;}return a;},[]);useFrame((_,dt)=>{orb.current.rotation.y+=dt*.12;orb.current.rotation.z+=dt*.04;});
 return <group>
 <mesh position={[0,-.55,0]} receiveShadow><cylinderGeometry args={[7.25,7.05,.8,96]}/><meshStandardMaterial color="#17252d" metalness={.65} roughness={.38}/></mesh>
 <mesh position={[0,-1.04,0]}><cylinderGeometry args={[6.5,5.5,.4,12]}/><meshStandardMaterial color="#0c151e" metalness={.5} roughness={.5}/></mesh>
 <Ring radius={7.25} color="#335763" y={-.13} width={.035}/><RuneCircle/>
 {[-1,1].flatMap(side=>[0,1,2].map(i=><group key={`${side}-${i}`} position={[side*(6.6+i*.4),-.1,-3-i*2.4]} rotation={[0,side*.13,side*(i===1?.12:0)]}>
 <mesh position={[0,.1,0]}><cylinderGeometry args={[.6,.72,.28,6]}/><meshStandardMaterial color="#263541" metalness={.4} roughness={.4}/></mesh>
 <mesh position={[0,1.5+i*.25,0]} castShadow><cylinderGeometry args={[.24,.36,2.8+i*.5,6]}/><meshStandardMaterial color="#202f3b" metalness={.6} roughness={.37}/></mesh>
 <mesh position={[0,2.92+i*.5,0]}><octahedronGeometry args={[.28]}/><meshStandardMaterial {...emissive('#517b8b',.7)}/></mesh>
 </group>))}
 <group ref={orb} position={[0,4.8,-6.8]}>
 <mesh><icosahedronGeometry args={[.58,1]}/><meshStandardMaterial color="#5e7d92" metalness={.9} roughness={.18} emissive="#244158" emissiveIntensity={.8}/></mesh>
 {[0,1,2].map(i=><mesh key={i} rotation={[.4+i*.8,.3+i*.7,0]}><torusGeometry args={[1.4+i*.24,.016,8,100]}/><meshBasicMaterial color={i===1?'#b19c78':'#5ca7ac'} toneMapped={false}/></mesh>)}
 <mesh><icosahedronGeometry args={[.83,0]}/><meshBasicMaterial color="#5a8e9a" wireframe transparent opacity={.22}/></mesh><pointLight color="#6099c8" intensity={9} distance={11}/>
 </group>
 <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[stars,3]}/></bufferGeometry><pointsMaterial color="#9cbfc8" size={.035} transparent opacity={.6} depthWrite={false}/></points>
 </group>;
}
function Target({index,flash,selected,onSelect}){const crystal=useRef();const light=useRef();const pos=TARGETS[index];const color=SPELLS[index].color;
 useFrame((_,dt)=>{crystal.current.rotation.y+=dt*.2;const f=Math.max(0,1-(now()-flash)/.6);crystal.current.scale.setScalar(1+f*.12);crystal.current.children[0].material.emissiveIntensity=.75+f*3;light.current.intensity=3+f*20;});
 return <group>
 <group position={[pos[0],-.02,pos[2]]}>
 <mesh castShadow receiveShadow><cylinderGeometry args={[.98,1.1,.34,10]}/><meshStandardMaterial color="#23323c" metalness={.7} roughness={.3}/></mesh>
 <Ring radius={.91} color={color} width={selected?.03:.012} y={.18} opacity={selected?.8:.3}/>
 <mesh position={[0,.22,0]}><cylinderGeometry args={[.5,.8,.18,6]}/><meshStandardMaterial color="#33464c" metalness={.8} roughness={.2}/></mesh>
 </group>
 <RigidBody type="fixed" colliders={false} position={pos} userData={{kind:'target',index}}><BallCollider args={[.69]}/>
 <group ref={crystal} onClick={e=>{e.stopPropagation();onSelect(index);}} onPointerOver={()=>document.body.style.cursor='crosshair'} onPointerOut={()=>document.body.style.cursor='default'}>
 <mesh castShadow scale={[.58,1,.58]}><octahedronGeometry args={[.9,0]}/><meshStandardMaterial color={color} emissive={color} emissiveIntensity={.75} metalness={.7} roughness={.18}/></mesh>
 <mesh rotation={[.5,0,.3]}><torusGeometry args={[.95,.014,8,70]}/><meshBasicMaterial color={color} toneMapped={false}/></mesh>
 <mesh rotation={[1,0,-.4]}><torusGeometry args={[.82,.009,6,70]}/><meshBasicMaterial color={color} transparent opacity={.5}/></mesh>
 <pointLight ref={light} color={color} distance={7} decay={2}/>
 </group></RigidBody>
 </group>;
}
function CastingWell(){const ref=useRef();useFrame((_,dt)=>{ref.current.rotation.y+=dt*.5;});return <group position={[ORIGIN[0],.01,ORIGIN[2]]}>
 <Ring radius={.85} color="#78b9b6" width={.02}/><Ring radius={.66} color="#44656d" width={.01}/>
 <group ref={ref} position={[0,1,0]}><mesh><octahedronGeometry args={[.22]}/><meshStandardMaterial {...emissive('#c1fff3',2)}/></mesh><mesh rotation={[.8,0,.4]}><torusGeometry args={[.48,.012,6,80]}/><meshBasicMaterial color="#92ddcf"/></mesh><pointLight color="#7fe6d4" intensity={5} distance={5}/></group>
 </group>;}
function Projectile({shot,trails,onHit,onExpire}){const ref=useRef();const done=useRef(false);const s=shot.spell;const velocity=useMemo(()=>new THREE.Vector3().fromArray(TARGETS[shot.target]).sub(new THREE.Vector3().fromArray(ORIGIN)).normalize().multiplyScalar(s.speed).toArray(),[shot]);
 useFrame(()=>{if(!done.current&&now()-shot.time>5){done.current=true;onExpire(shot.id);}});
 const body=<group><mesh><icosahedronGeometry args={[s.size,1]}/><meshBasicMaterial color={s.core} toneMapped={false}/></mesh><mesh rotation={[.4,.3,0]}><torusGeometry args={[s.size*1.7,.018,6,36]}/><meshBasicMaterial color={s.color} toneMapped={false}/></mesh><pointLight color={s.color} intensity={10} distance={5}/></group>;
 return <RigidBody ref={ref} colliders={false} position={ORIGIN} gravityScale={0} linearVelocity={velocity} ccd restitution={0} userData={{kind:'projectile'}} onCollisionEnter={event=>{
 if(done.current)return;const kind=event.other.rigidBodyObject?.userData?.kind;if(kind!=='target'&&kind!=='floor')return;done.current=true;const p=ref.current.translation();onHit(shot,[p.x,p.y,p.z],event.other.rigidBodyObject?.userData?.index??-1);
 }}><BallCollider args={[s.size]}/>{trails?<Trail width={s.size*15} length={15} decay={1.2} color={new THREE.Color(s.color).multiplyScalar(1.8)} attenuation={x=>x*x}>{body}</Trail>:body}</RigidBody>;
}
function Debris({impact}){const bits=useMemo(()=>Array.from({length:9},(_,i)=>{const a=i/9*Math.PI*2;return {v:[Math.cos(a)*impact.spell.force,2.8+Math.random()*3,Math.sin(a)*impact.spell.force],size:.045+Math.random()*.08,rot:[Math.random()*6,Math.random()*6,0]};}),[impact]);return bits.map((b,i)=><RigidBody key={i} position={impact.position} colliders="cuboid" linearVelocity={b.v} angularVelocity={[3,5,2]} restitution={.42} friction={.65} userData={{kind:'debris'}} onCollisionEnter={e=>{if(e.other.rigidBodyObject?.userData?.kind==='floor')window.spellLab.debrisCollisions++;}}><mesh rotation={b.rot} castShadow><boxGeometry args={[b.size,b.size*2,b.size]}/><meshStandardMaterial color={impact.spell.color} emissive={impact.spell.color} emissiveIntensity={.65} metalness={.8} roughness={.25}/></mesh></RigidBody>);}
function Scene({settings,spellIndex,auto,request,selected,setSelected,look,onLookStatus}){
 const [shots,setShots]=useState([]),[impacts,setImpacts]=useState([]),[flashes,setFlashes]=useState([-100,-100,-100]);const last=useRef(0),sequence=useRef(0),castRef=useRef();const autoTime=useRef(0),cycle=useRef(0),settingsRef=useRef(settings);settingsRef.current=settings;const lookRef=useRef(look);lookRef.current=look;
 const cast=useCallback((type,target)=>{if(now()-last.current<.28)return;last.current=now();const shot={id:++sequence.current,spell:SPELLS[type],target,look:lookRef.current.id,time:now()};setShots(a=>[...a.slice(-6),shot]);window.spellLab.casts++;window.spellLab.events.push({type:'cast',spell:type,target,time:shot.time});if(window.spellLab.events.length>100)window.spellLab.events.shift();},[]);castRef.current=cast;
 useEffect(()=>{if(request.id)cast(spellIndex,selected);},[request.id]);
 const onHit=useCallback((shot,position,target)=>{const impact={id:shot.id,position,spell:shot.spell,look:shot.look,time:now()};setShots(a=>a.filter(s=>s.id!==shot.id));setImpacts(a=>[...a.filter(i=>now()-i.time<4).slice(-5),impact]);if(target>=0)setFlashes(a=>a.map((v,i)=>i===target?now():v));window.spellLab.impacts++;window.spellLab.events.push({type:'collision',id:shot.id,target,position,time:now()});},[]);
 const expire=useCallback(id=>setShots(a=>a.filter(s=>s.id!==id)),[]);
 useFrame((_,dt)=>{window.spellLab.frames++;window.spellLab.projectiles=shots.length;autoTime.current+=Math.min(dt,.1);if(auto&&autoTime.current>2.15){autoTime.current=0;const step=cycle.current++;castRef.current(step%3,step%3);}if(window.spellLab.frames%60===0)setImpacts(a=>a.filter(i=>now()-i.time<4));});
 return <>
 <Sanctuary/><CastingWell/>
 <Physics gravity={[0,-9.81,0]} timeStep={1/60}>
 <RigidBody type="fixed" colliders={false} position={[0,-.35,0]} userData={{kind:'floor'}}><CylinderCollider args={[.2,7.2]}/></RigidBody>
 {TARGETS.map((p,i)=><Target key={i} index={i} flash={flashes[i]} selected={selected===i} onSelect={i=>{setSelected(i);cast(spellIndex,i);}}/>)}
 {shots.map(s=><Projectile key={s.id} shot={s} trails={settings.trails} onHit={onHit} onExpire={expire}/>)}
 {impacts.map(i=><Debris key={i.id} impact={i}/>)}
 </Physics>
 <SpellEffects impacts={impacts} settings={settings}/><LibraryEffects look={look} impacts={impacts} onStatus={onLookStatus}/>{impacts.map(i=><ImpactPulse key={i.id} impact={i}/>)}
 </>;
}
function SpellIcon({index}){return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d={index===0?'M7 25L25 7M12 7h13v13M6 15l5 6M13 22l3 3':index===1?'M19 3L8 18h8l-3 11 12-16h-9z':'M16 3c2 8 9 9 9 17a9 9 0 01-18 0c0-4 3-7 5-10 0 7 5 6 4-7z'} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function App(){const reduced=useMemo(()=>matchMedia('(prefers-reduced-motion: reduce)').matches,[]);const [auto,setAuto]=useState(!reduced),[spell,setSpell]=useState(0),[lookId,setLookId]=useState('classic'),[lookStatus,setLookStatus]=useState({id:'classic',status:'ready'}),[selected,setSelected]=useState(1),[request,setRequest]=useState({id:0}),[settings,setSettings]=useState({smoke:true,sparks:true,trails:true,bloom:true});const look=looks.find(l=>l.id===lookId);const status=lookStatus.id===lookId?lookStatus.status:'loading';const onLookStatus=useCallback((id,status)=>setLookStatus({id,status}),[]);const cast=useCallback(()=>setRequest(r=>({id:r.id+1})),[]);useEffect(()=>{const k=e=>{if(e.code==='Space'&&!e.repeat&&!e.target?.closest?.('button,select,input,textarea,[contenteditable]')){e.preventDefault();cast();}};window.addEventListener('keydown',k);return()=>window.removeEventListener('keydown',k);},[cast]);useEffect(()=>{window.spellLab.settings=settings;window.spellLab.auto=auto;window.spellLab.spell=spell;},[settings,auto,spell]);
 return <><div className="vignette"/><header><div className="eyebrow"><span/> ASTRAL SANCTUM <em>01 / 试炼</em></div><h1>星隙<span>法术试炼</span></h1><p>凝聚星光，击碎寂静。</p></header>
 <div className="top-actions"><button className={'auto '+(auto?'on':'')} aria-pressed={auto} onClick={()=>setAuto(a=>!a)}><i/>{auto?'自动演示中':'自动演示已停'}</button></div>
 <Canvas shadows camera={{position:[10.8,8.7,14],fov:45}} dpr={[1,1.5]} gl={{antialias:true,powerPreference:'high-performance'}}><color attach="background" args={['#061019']}/><fog attach="fog" args={['#061019',19,48]}/><hemisphereLight args={['#9dbbc9','#10141b',.7]}/><directionalLight position={[-5,10,4]} color="#96c8e4" intensity={2.4} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9}/><pointLight position={[1,5,0]} color="#6685a0" intensity={15} distance={18}/><Suspense fallback={null}><Scene settings={settings} spellIndex={spell} auto={auto} request={request} selected={selected} setSelected={setSelected} look={look} onLookStatus={onLookStatus}/></Suspense><OrbitControls makeDefault target={[0,1.1,-.5]} minDistance={10} maxDistance={29} maxPolarAngle={1.38} minPolarAngle={.3} enablePan={false}/>{settings.bloom&&<EffectComposer multisampling={2}><Bloom luminanceThreshold={1} intensity={1.05} mipmapBlur/><Vignette darkness={.3} offset={.25}/></EffectComposer>}</Canvas>
 <aside className="side-note"><b>星光成刃</b><span>烟尘散去，余烬仍在。</span></aside>
 <footer><div className="look-control"><label htmlFor="effect-look">命中特效</label><select id="effect-look" value={lookId} onChange={e=>setLookId(e.target.value)}><option value="classic">原版命中</option><optgroup label="贴图特效">{looks.filter(l=>l.kind!=='classic'&&l.kind!=='sequence').map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</optgroup><optgroup label="透明法术序列">{looks.filter(l=>l.kind==='sequence').map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</optgroup></select><span role="status">{status==='loading'?'载入中…':status==='error'?'素材未能载入':'施法后查看命中效果'}</span></div><div className="spell-bar">{SPELLS.map((s,i)=><button key={s.name} className={'spell '+(spell===i?'selected':'')} style={{'--spell':s.color}} aria-pressed={spell===i} onClick={()=>setSpell(i)}><SpellIcon index={i}/><span><small>{s.label}</small><strong>{s.name}</strong></span><em>0{i+1}</em></button>)}<button className="cast" onClick={cast}>施放法术 <kbd>空格</kbd></button></div><div className="underbar"><p>点击晶石瞄准施法 <span>·</span> 拖动环视 <span>·</span> 滚轮缩放</p><div className="switches">{[['smoke','烟雾'],['sparks','火花'],['trails','拖尾'],['bloom','泛光']].map(([key,label])=><button key={key} aria-pressed={settings[key]} onClick={()=>setSettings(s=>({...s,[key]:!s[key]}))}><i/>{label}</button>)}</div></div></footer></>;
}
createRoot(document.getElementById('root')).render(<App/>);
