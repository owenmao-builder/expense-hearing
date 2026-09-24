import {useHearing} from "./store";
import {cases} from "./cases";
import {deriveState,deriveConclusion} from "./machine";
type Tool={name:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean;untrustedContentHint:boolean};execute:(input:unknown)=>unknown};
type Context={registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void>};
const read=()=>{const s=useHearing.getState();const c=cases[s.caseIndex];const derived=deriveState(c,s.head,s.done);return {caseId:c.id,running:s.running,head:s.head,phase:derived.phase,book:derived.book,mgmtActual:derived.mgmtActual,mgmtVariance:derived.mgmtVariance,rounds:derived.rounds,evidence:derived.evidence.map(e=>({id:e.id,status:e.status})),conclusion:s.done?deriveConclusion(c,derived):null}};
export function registerHearingTools(){
 const context=(document as Document&{modelContext?:Context}).modelContext;if(!context?.registerTool)return;
 const lifecycle=new AbortController();
 const tools:Tool[]=[{name:"read_expense_hearing",description:"读取当前费用会审的账面、管理口径、证据和结论，金额单位为人民币分。",inputSchema:{type:"object",properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(input){if(!input||typeof input!=="object"||Object.keys(input).length)throw new Error("应传入空对象");return read();}},
 {name:"control_expense_hearing",description:"控制合成数据会审演示：选案、播放、暂停、单步或重放。选案将重置播放状态。",inputSchema:{type:"object",properties:{action:{type:"string",enum:["select_01","select_02","play","pause","step","replay"]}},required:["action"],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},async execute(input){if(!input||typeof input!=="object"||Object.keys(input).length!==1||!("action"in input))throw new Error("需要唯一 action 参数");const action=(input as {action:unknown}).action;const s=useHearing.getState();switch(action){case"select_01":s.select(0);break;case"select_02":s.select(1);break;case"play":s.play();break;case"pause":s.pause();break;case"step":s.step();break;case"replay":s.replay();break;default:throw new Error("未知动作");}await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));return read();}}];
 for(const tool of tools){try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
 return()=>lifecycle.abort();
}
