/** All monetary values are integer RMB cents; display is in ten-thousands. */
export const WAN = 1_000_000;
export const money = (wan: number): number => { const value=wan*WAN; if(!Number.isSafeInteger(value)) throw new Error("金额必须精确到分"); return value; };
export const format = (cents:number):string => (cents/WAN).toLocaleString("zh-CN",{maximumFractionDigits:6});
export const signed = (cents:number):string => `${cents>0?"+":cents<0?"−":""}${format(Math.abs(cents))}`;
export const sum = (values:readonly number[]):number => {const total=values.reduce((a,b)=>a+b,0);if(!values.every(Number.isSafeInteger)||!Number.isSafeInteger(total))throw new Error("金额溢出或不是整数分");return total;};
export const share = (part:number,total:number):number => total===0?0:Math.round(part*10000/total)/100;
export type BookRow=Readonly<{name:string;budget:number;actual:number}>;
export type Book=Readonly<{rows:readonly BookRow[];bookBudget:number;bookActual:number;bookVariance:number}>;
export function freeze<T>(object:T):Readonly<T>{if(object&&typeof object==="object"){Object.values(object).forEach(freeze);Object.freeze(object);}return object;}
export function createBook(rows:BookRow[]):Book {const bookBudget=sum(rows.map(r=>r.budget));const bookActual=sum(rows.map(r=>r.actual));return freeze({rows,bookBudget,bookActual,bookVariance:bookActual-bookBudget});}
export type Evidence={id:string;name:string;kind:"ledger"|"contract"|"invoice"|"entry"|"allocation"|"deferral";status:"approved"|"unsigned"|"record";amount?:number;allocation?:Readonly<Record<string,number>>;period:string;summary:string;body:string;unlock:number};
export type Entry=Readonly<{bucket:string;delta:number}>;
export function assertZeroSum(entries:readonly Entry[]){if(entries.length<2||sum(entries.map(e=>e.delta))!==0)throw new Error("调整不平衡：分录必须零和");}
export function allocate(base:Readonly<Record<string,number>>,entries:readonly Entry[],evidence:Evidence|undefined,period:string){
 if(!evidence||evidence.kind!=="allocation"||evidence.status!=="approved"||evidence.period!==period)throw new Error("缺少本期已批准分摊单，不得调整归属");
 assertZeroSum(entries);
 if(new Set(entries.map(e=>e.bucket)).size!==entries.length)throw new Error("分录重复");
 if(!evidence.allocation||entries.length!==Object.keys(evidence.allocation).length||entries.some(e=>e.delta!==evidence.allocation?.[e.bucket]))throw new Error("调整金额与批准单不一致");
 return applyEntries(base,entries);
}
export function applyEntries(base:Readonly<Record<string,number>>,entries:readonly Entry[]){assertZeroSum(entries);const result={...base};for(const entry of entries){if(!(entry.bucket in result))throw new Error("未知归属");result[entry.bucket]+=entry.delta;if(result[entry.bucket]<0)throw new Error("调整后金额不得为负");}if(sum(Object.values(result))!==sum(Object.values(base)))throw new Error("合计不守恒");return freeze(result);}
export function defer(base:Readonly<Record<string,number>>,entries:readonly Entry[],evidence:Evidence|undefined){if(evidence?.kind!=="deferral"||evidence.status!=="approved")throw new Error("缺少已批准待摊单，不得调出本期");if(sum(entries.filter(e=>e.delta>0).map(e=>e.delta))!==evidence.amount)throw new Error("金额与待摊单不一致");return applyEntries(base,entries);}
export function restoreCurrentPeriod(base:Readonly<Record<string,number>>,amount:number,evidence:readonly Evidence[]){
 const contract=evidence.find(e=>e.kind==="contract"&&e.amount===amount&&e.period==="2026-08");
 const entry=evidence.find(e=>e.kind==="entry"&&e.period==="2026-08");
 const draft=evidence.find(e=>e.kind==="deferral"&&e.status==="unsigned"&&e.amount===amount);
 if(!contract||!entry||!draft)throw new Error("合同、进场记录或补查结果不完整");
 return applyEntries(base,[{bucket:"2026-08",delta:amount},{bucket:"2026-09",delta:-amount}]);
}
