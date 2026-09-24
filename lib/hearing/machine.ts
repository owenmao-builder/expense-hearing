import { cases, type Case, type Phase } from "./cases";
import {allocate,restoreCurrentPeriod,format,signed,sum,freeze} from "./ledger";
export const MAX_ROUNDS=2;
export function requestSupplement(rounds:number){if(!Number.isInteger(rounds)||rounds<0||rounds>=MAX_ROUNDS)throw new Error("补查上限为 2 轮，转为未决");return rounds+1;}
export function deriveState(c:Case,head:number,done=false){
 if(!Number.isInteger(head)||head < -1||head>=c.beats.length)throw new Error("无效播放位置");
 if(done&&head!==c.beats.length-1)throw new Error("尚未完成会审");
 let rounds=0;let mgmt:Readonly<Record<string,number>>={...c.buckets};let adjusted=false;
 const evidence=c.evidence.filter(e=>e.unlock<=head);
 for(let i=0;i<=head;i++){const beat=c.beats[i];if(beat.request)rounds=requestSupplement(rounds);if(beat.recalculate){
 const available=c.evidence.filter(e=>e.unlock<=i);
 mgmt=c.id==="01"?allocate(c.buckets,[{bucket:"销售部",delta:-c.amount},{bucket:"客服部",delta:c.amount}],available.find(e=>e.kind==="allocation"),c.period):restoreCurrentPeriod(c.buckets,c.amount,available);
 adjusted=true;
 }}
 return freeze({scriptId:c.scriptId,caseId:c.id,phase:(done?"concluded":head<0?"idle":c.beats[head].phase) as Phase,head,rounds,evidence,mgmt,mgmtActual:mgmt[c.target],mgmtBudget:c.book.bookBudget,mgmtVariance:mgmt[c.target]-c.book.bookBudget,adjusted,book:c.book,done});
}
export type HearingState=ReturnType<typeof deriveState>;
export function deriveConclusion(c:Case,state:HearingState){
 if(!state.done||!state.adjusted||state.caseId!==c.id)throw new Error("会审尚未结束");
 const balance=sum(Object.values(state.mgmt));
 return freeze({id:`${c.scriptId}:${state.evidence.map(e=>e.id).join("+")}`,original:c.claim,verdict:"原解释不成立",correction:c.id==="01"?`本月销售部账面超预算 ${format(c.book.bookVariance)} 万，主要差异来自软件。按本期批准单将 ${format(c.amount)} 万归属客服后，销售部管理口径实际 ${format(state.mgmtActual)} 万、超预算 ${format(state.mgmtVariance)} 万；广告增加 ${format(c.book.rows[0].actual-c.book.rows[0].budget)} 万，软件增加的业务原因仍待确认。`:`本月市场费用账面显示节约 ${format(-c.book.bookVariance)} 万，但展会搭建 ${format(c.amount)} 万缺少已批准待摊依据。按本案规则恢复至 8 月后，管理口径实际 ${format(state.mgmtActual)} 万、超预算 ${format(state.mgmtVariance)} 万；本次不接受调入 9 月。`,before:signed(c.book.bookVariance),adjustment:signed(state.mgmtActual-c.book.bookActual),after:signed(state.mgmtVariance),balance,balanceText:c.id==="01"?`销售部 ${format(state.mgmt["销售部"])} + 客服部 ${format(state.mgmt["客服部"])} = ${format(balance)} 万，公司本案费用合计不变。`:`8 月 ${format(state.mgmt["2026-08"])} + 9 月 ${format(state.mgmt["2026-09"])} = ${format(balance)} 万，本案全年合计不变。`,evidenceIds:state.evidence.map(e=>e.id),unresolved:c.unresolved});
}
