"use client";
import {create} from "zustand";
import {cases} from "./cases";
import {deriveState,deriveConclusion} from "./machine";
type Player={caseIndex:number;head:number;elapsed:number;running:boolean;done:boolean;showConclusion:boolean;error:string|null;select:(index:number)=>void;play:()=>void;pause:()=>void;step:()=>void;replay:()=>void;tick:(ms:number)=>void;setConclusion:(open:boolean)=>void};
const initial={head:-1,elapsed:0,running:false,done:false,showConclusion:false,error:null};
export const useHearing=create<Player>((set,get)=>({caseIndex:0,...initial,
 select(index){if(!Number.isInteger(index)||!cases[index])throw new Error("案件不存在");set({...initial,caseIndex:index});},
 play(){const s=get();if(s.done){set({showConclusion:true});return;}if(s.head===-1)set({head:0,elapsed:0,running:true});else set({running:true});},
 pause(){set({running:false});},
 step(){const s=get();if(s.done)return;try{if(s.head<cases[s.caseIndex].beats.length-1){deriveState(cases[s.caseIndex],s.head+1);set({head:s.head+1,elapsed:cases[s.caseIndex].beats[s.head+1].duration,running:false});}else{deriveConclusion(cases[s.caseIndex],deriveState(cases[s.caseIndex],s.head,true));set({done:true,running:false,showConclusion:true});}}catch(e){set({running:false,error:String(e)});}},
 replay(){set({...initial,head:0,running:true});},
 tick(ms){const s=get();if(!s.running||s.done||s.head<0)return;const c=cases[s.caseIndex];const elapsed=s.elapsed+Math.min(ms,250);if(elapsed<c.beats[s.head].duration){set({elapsed});return;}try{if(s.head===c.beats.length-1){deriveConclusion(c,deriveState(c,s.head,true));set({elapsed:c.beats[s.head].duration,done:true,running:false,showConclusion:true});}else{deriveState(c,s.head+1);set({head:s.head+1,elapsed:0});}}catch(e){set({running:false,error:String(e)});}},
 setConclusion(open){if(open&&!get().done)return;set({showConclusion:open});}
}));
