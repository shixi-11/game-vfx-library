import React,{useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {BatchedRenderer} from 'three.quarks';
import {createSparkSystem} from './spark-system.js';

// One draw call for the smoke pool. The surface is turbulent and softly lit,
// rather than a field of opaque circles or additive glowing squares.
const smokeVertex=`
 attribute vec3 aCenter; attribute vec3 aTint;
 attribute float aBirth; attribute float aSize; attribute float aSeed;
 uniform float uTime; varying vec2 vUv; varying float vAge; varying vec3 vTint; varying float vSeed;
 void main(){float age=max(0.,uTime-aBirth);vAge=age/3.4;vUv=uv;vTint=aTint;vSeed=aSeed;
 if(vAge>=1.||uTime<aBirth){gl_Position=vec4(2.,2.,2.,1.);return;}
 vec3 center=aCenter;center.y+=age*.5;center.x+=sin(age*1.4+aSeed)*age*.2;center.z+=cos(age+aSeed)*age*.12;
 vec4 view=modelViewMatrix*vec4(center,1.);float angle=aSeed+age*.13;mat2 rot=mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
 view.xy+=rot*position.xy*aSize*(.6+age*.65);gl_Position=projectionMatrix*view;
 }`;
const smokeFragment=`
 uniform float uTime;varying vec2 vUv;varying float vAge;varying vec3 vTint;varying float vSeed;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 float fbm(vec2 p){float n=0.;float a=.55;for(int i=0;i<4;i++){n+=a*noise(p);p=p*2.06+3.7;a*=.48;}return n;}
 void main(){if(vAge>=1.||vAge<=0.)discard;vec2 p=vUv*2.-1.;float n=fbm(p*3.1+vec2(vSeed,-uTime*.18));
 float edge=1.-smoothstep(.28,.98,length(p)+n*.25);float life=smoothstep(0.,.08,vAge)*(1.-smoothstep(.25,1.,vAge));
 float alpha=edge*life*(.13+n*.32);if(alpha<.007)discard;vec3 color=mix(vec3(.10,.13,.18),vTint*.65,.4+n*.5);
 gl_FragColor=vec4(color,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`;

export function SpellEffects({impacts,settings}){
 const {scene}=useThree();const runtime=useRef();const seen=useRef(new Set());
 const smoke=useMemo(()=>{
  const g=new THREE.InstancedBufferGeometry();const plane=new THREE.PlaneGeometry(1,1);g.index=plane.index.clone();g.setAttribute('position',plane.attributes.position.clone());g.setAttribute('uv',plane.attributes.uv.clone());plane.dispose();
  const cap=144;for(const [name,size] of [['aCenter',3],['aTint',3],['aBirth',1],['aSize',1],['aSeed',1]]){const a=new Float32Array(cap*size);if(name==='aBirth')a.fill(-100);g.setAttribute(name,new THREE.InstancedBufferAttribute(a,size));}g.instanceCount=cap;
  const material=new THREE.ShaderMaterial({vertexShader:smokeVertex,fragmentShader:smokeFragment,uniforms:{uTime:{value:0}},transparent:true,depthWrite:false,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(g,material);mesh.frustumCulled=false;mesh.renderOrder=3;return {g,material,mesh,cap,cursor:0};
 },[]);
 useEffect(()=>{const batch=new BatchedRenderer();scene.add(batch,smoke.mesh);runtime.current={batch,systems:[]};return()=>{for(const s of runtime.current.systems)s.system.dispose();scene.remove(batch,smoke.mesh);smoke.g.dispose();smoke.material.dispose();runtime.current=null;};},[scene,smoke]);
 useEffect(()=>{
  if(!runtime.current)return;
  for(const impact of impacts){if(seen.current.has(impact.id))continue;seen.current.add(impact.id);const color=new THREE.Color(impact.spell.color);
   if(settings.sparks){const material=new THREE.MeshBasicMaterial({color:impact.spell.color,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
    const system=createSparkSystem(impact.spell,material);
    system.emitter.position.fromArray(impact.position);scene.add(system.emitter);runtime.current.batch.addSystem(system);runtime.current.systems.push({system,birth:performance.now()/1000,material});
   }
   if(settings.smoke){for(let j=0;j<14;j++){const k=smoke.cursor++%smoke.cap;const c=smoke.g.getAttribute('aCenter');c.setXYZ(k,impact.position[0]+(Math.random()-.5)*.8,impact.position[1]+(Math.random()-.5)*.5,impact.position[2]+(Math.random()-.5)*.8);smoke.g.getAttribute('aTint').setXYZ(k,color.r,color.g,color.b);smoke.g.getAttribute('aBirth').setX(k,performance.now()/1000-Math.random()*.1);smoke.g.getAttribute('aSize').setX(k,.9+Math.random()*1.1);smoke.g.getAttribute('aSeed').setX(k,Math.random()*40);}for(const a of Object.values(smoke.g.attributes))if(a.isInstancedBufferAttribute)a.needsUpdate=true;}
  }
  // IDs are monotonic and live impacts are bounded; discard old bookkeeping too.
  if(seen.current.size>120){seen.current=new Set(impacts.map(i=>i.id));}
 },[impacts,settings.sparks,settings.smoke,scene,smoke]);
 useFrame((_,dt)=>{const r=runtime.current;if(!r)return;const now=performance.now()/1000;r.batch.update(Math.min(dt,.05));let sparks=0;for(let i=r.systems.length-1;i>=0;i--){const s=r.systems[i];sparks+=s.system.particleNum;if(now-s.birth>1.5){s.system.dispose();s.material.dispose();r.systems.splice(i,1);}}
  smoke.mesh.visible=settings.smoke;smoke.material.uniforms.uTime.value=now;
  let active=0;const birth=smoke.g.getAttribute('aBirth');for(let i=0;i<smoke.cap;i++)if(now-birth.getX(i)<3.4)active++;
  r.batch.visible=settings.sparks;window.spellLab.sparks=settings.sparks?sparks:0;window.spellLab.smoke=settings.smoke?active:0;
 });return null;
}

export function ImpactPulse({impact}){
 const ref=useRef(),light=useRef();const mats=useMemo(()=>[new THREE.MeshBasicMaterial({color:impact.spell.color,transparent:true,opacity:.8,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}),new THREE.MeshBasicMaterial({color:impact.spell.core,transparent:true,opacity:1,wireframe:true,blending:THREE.AdditiveBlending,depthWrite:false})],[impact.spell]);
 useEffect(()=>()=>mats.forEach(m=>m.dispose()),[mats]);
 useFrame(()=>{const t=performance.now()/1000-impact.time;ref.current.visible=t<1.25;const s=.2+t*3.8;ref.current.children[0].scale.setScalar(s);ref.current.children[1].scale.setScalar(s*.75);ref.current.children[2].scale.setScalar(.2+t*2.4);mats[0].opacity=Math.max(0,1-t/1.1)*.8;mats[1].opacity=Math.max(0,1-t/.55);light.current.intensity=Math.max(0,1-t/.65)*36;});
 return <group ref={ref} position={impact.position}><mesh rotation={[Math.PI/2,0,0]} material={mats[0]}><ringGeometry args={[.92,1,80]}/></mesh><mesh rotation={[0,0,Math.PI/3]} material={mats[0]}><ringGeometry args={[.97,1,80]}/></mesh><mesh material={mats[1]}><icosahedronGeometry args={[1,1]}/></mesh><pointLight ref={light} color={impact.spell.color} distance={9} decay={2}/></group>;
}
