import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Vehicle,SeekBehavior,Vector3} from 'yuka';
import {ParticleSystem,BatchedRenderer,ConstantValue} from 'three.quarks';
const v=new Vehicle();v.maxSpeed=2;v.steering.add(new SeekBehavior(new Vector3(5,0,0)));for(let i=0;i<60;i++)v.update(1/60);assert(v.position.x>0);
const mat=new THREE.MeshBasicMaterial();const p=new ParticleSystem({material:mat,emissionOverTime:new ConstantValue(10)});const b=new BatchedRenderer();new THREE.Scene().add(p.emitter,b);b.addSystem(p);for(let i=0;i<30;i++)b.update(1/60);assert(p.particleNum>0);b.deleteSystem(p);mat.dispose();console.log(JSON.stringify({yukaMovement:v.position.x,quarksParticles:p.particleNum,ok:true}));
