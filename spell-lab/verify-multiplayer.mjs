import {Server,Room} from '@colyseus/core';
import {WebSocketTransport} from '@colyseus/ws-transport';
import {Client} from '@colyseus/sdk';
import {Schema,defineTypes} from '@colyseus/schema';
import assert from 'node:assert/strict';
import fs from 'node:fs';
class State extends Schema{constructor(){super();this.count=0;}}defineTypes(State,{count:'number'});
class LocalRoom extends Room{onCreate(){this.setState(new State());this.onMessage('increment',()=>this.state.count++);}}
const server=new Server({transport:new WebSocketTransport(),greet:false,gracefullyShutdown:false});server.define('test',LocalRoom);let a,b;
try{await server.listen(5188,'127.0.0.1');const client=new Client('http://127.0.0.1:5188');a=await client.joinOrCreate('test');b=await client.joinById(a.roomId);a.send('increment');await Promise.race([new Promise(resolve=>{const check=()=>{if(b.state.count===1)resolve();};b.onStateChange(check);check();}),new Promise((_,reject)=>setTimeout(()=>reject(Error('state sync timeout')),5000))]);assert.equal(b.state.count,1);fs.writeFileSync('output/multiplayer-check.json',JSON.stringify({ok:true,localOnly:true,clients:2,count:b.state.count},null,2));console.log('Local two-client state synchronization passed');}finally{if(a)await a.leave();if(b)await b.leave();await server.gracefullyShutdown(false);}
