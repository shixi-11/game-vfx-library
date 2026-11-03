import React,{useEffect,useRef,useState} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';

export function LibraryEffects({look,impacts,onStatus}){
 const [loaded,setLoaded]=useState(null);
 useEffect(()=>{
  if(look.kind==='classic'){onStatus(look.id,'ready');return;}
  let active=true;
  const loader=new THREE.TextureLoader();
  const textures=[];
  onStatus(look.id,'loading');
  const jobs=look.urls.map(url=>new Promise((resolve,reject)=>{
   const t=loader.load(url,texture=>{
    if(!active){texture.dispose();return;}
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.generateMipmaps=false;
    texture.minFilter=THREE.LinearFilter;
    if(look.kind==='beam'){
     const {width,height}=texture.image;
     texture.offset.set(135/width,1-407/height);
     texture.repeat.set(56/width,99/height);
    }
    resolve(texture);
   },undefined,reject);
   textures.push(t);
  }));
  Promise.all(jobs).then(maps=>{
   if(active){setLoaded({id:look.id,maps});onStatus(look.id,'ready');}
  },()=>{if(active){textures.forEach(t=>t.dispose());onStatus(look.id,'error');}});
  return()=>{active=false;textures.forEach(t=>t.dispose());};
 },[look,onStatus]);
 if(loaded?.id!==look.id)return null;
 return impacts.filter(i=>i.look===look.id).map(i=><LibraryBurst key={i.id} look={look} impact={i} maps={loaded.maps}/>);
}

function LibraryBurst({look,impact,maps}){
 const group=useRef(),parts=useRef([]);
 const kind=look.kind;
 const count=kind==='sparks'?12:kind==='smoke'?5:1;
 const duration=kind==='sequence'?maps.length/24:kind==='smoke'?1.55:.82;
 const additive=kind==='sparks'||kind==='beam'||kind==='ring';
 useFrame(()=>{
  if(!group.current)return;
  const age=performance.now()/1000-impact.time;
  const t=Math.max(0,age/duration);
  group.current.visible=t<1;
  if(t>=1)return;
  for(let i=0;i<count;i++){
   const part=parts.current[i];if(!part)continue;
   const angle=i*2.39996;
   const spread=(kind==='sparks'?2.1:kind==='smoke'?.9:0)*t;
   part.position.set(Math.cos(angle)*spread,.22+(kind==='smoke'?1.05*t:kind==='sparks'?Math.sin(angle)*spread:0),Math.sin(angle)*spread*.45);
   const size=kind==='sequence'?3.1:kind==='ring'?1.15+2.1*t:kind==='smoke'?.85+1.45*t:kind==='beam'?1.45+.55*t:.32*(1-.55*t);
   const frame=maps[Math.min(maps.length-1,Math.floor(t*maps.length))];
   const aspect=kind==='sequence'?frame.image.width/frame.image.height:kind==='beam'?.56:1;
   part.scale.set(size*aspect,size,1);
   part.material.map=frame;
   part.material.opacity=kind==='sequence'?1:(1-t)*(kind==='smoke'?.66:1);
   if(part.isSprite)part.material.rotation=kind==='beam'?Math.PI/2:kind==='sparks'?angle:0;
  }
 });
 const material={map:maps[0],transparent:true,depthWrite:false,toneMapped:false,
  color:kind==='sparks'||kind==='ring'?impact.spell.color:'#ffffff',
  blending:additive?THREE.AdditiveBlending:THREE.NormalBlending};
 return <group ref={group} position={impact.position} visible={false}>
  {Array.from({length:count},(_,i)=>kind==='ring'
   ?<mesh key={i} ref={x=>{parts.current[i]=x;}} rotation={[-Math.PI/2,0,0]}><planeGeometry/><meshBasicMaterial {...material} side={THREE.DoubleSide}/></mesh>
   :<sprite key={i} ref={x=>{parts.current[i]=x;}}><spriteMaterial {...material}/></sprite>)}
 </group>;
}
