import {createBook,freeze,money,format,share,signed, type Evidence} from "./ledger";
export type Role="host"|"accountant"|"investigator"|"reviewer";
export type Phase="idle"|"dispatched"|"investigating"|"reviewing"|"supplementing"|"recalculating"|"concluded";
export type Beat={role:Role;phase:Phase;text:string;tool:string;handoff?:string;request?:boolean;recalculate?:boolean;duration:number};
const book1=createBook([{name:"广告",budget:money(30),actual:money(33)},{name:"软件",budget:money(5),actual:money(22)},{name:"其他",budget:money(65),actual:money(65)}]);
const book2=createBook([{name:"本月市场费用",budget:money(80),actual:money(72)}]);
const allocation=money(7),eventAmount=money(18),ad=book1.rows[0].actual-book1.rows[0].budget,software=book1.rows[1].actual-book1.rows[1].budget;
const b=(role:Role,phase:Phase,text:string,tool:string,extra:Partial<Beat>={}):Beat=>({role,phase,text,tool,duration:4000,...extra});
export const cases=freeze([
 {id:"01",scriptId:"sales-allocation-v1",title:"软件费用算给了谁",department:"销售部",topic:"跨部门归属",period:"2026-08",claim:`本月超预算 ${format(book1.bookVariance)} 万，主要因为广告投放增加。`,book:book1,amount:allocation,buckets:{销售部:book1.bookActual,客服部:0} as Record<string,number>,target:"销售部",rule:"无本期已批准分摊单，不得调整部门归属。",unresolved:"软件增加的业务原因仍待确认。共享使用和分摊批准，只说明费用归谁，不解释为什么增加。",evidence:[
 {id:"S-01",name:"8 月部门费用明细",kind:"ledger",status:"record",period:"2026-08",summary:"财务底稿 · 账面快照",body:"销售部 / 2026 年 8 月\n广告：预算 30 万，实际 33 万。\n软件：预算 5 万，实际 22 万。\n其他：预算 65 万，实际 65 万。\n合计：预算 100 万，实际 120 万。",unlock:-1},
 {id:"S-02",name:"软件服务合同",kind:"contract",status:"record",period:"2026-08",amount:software,summary:"使用方：销售 / 客服",body:"合同编号：SYN-SOFT-0826\n本期新增软件服务金额：17 万。\n使用部门：销售部、客服部。\n合同未约定具体的部门费用分摊金额。\n共同使用仅支持调查假设，不构成调整依据。",unlock:2},
 {id:"S-03",name:"本期分摊批准单",kind:"allocation",status:"approved",period:"2026-08",amount:allocation,allocation:{销售部:-allocation,客服部:allocation},summary:"已批准 · 客服承担 7 万",body:"批准单编号：SYN-ALLOC-202608-07\n适用期间：2026 年 8 月\n分摊基数：本期新增软件费用 17 万。\n销售部承担 10 万，客服部承担 7 万。\n从销售部调减 7 万，同时客服部调增 7 万。\n审批状态：已批准（合成凭证）。\n仅调整管理口径，原始账面保持不变。",unlock:5}
 ] as Evidence[],beats:[
 b("host","dispatched","会审开始。账面快照已锁定。核算拆解差异，调查同步查软件合同；复核等待证据后把关。","lock_book_snapshot",{handoff:"核算 ∥ 调查 · 并行任务已派发"}),
 b("accountant","investigating",`超预算 ${format(book1.bookVariance)} 万：广告 ${signed(ad)} 万，占 ${share(ad,book1.bookVariance)}%；软件 ${signed(software)} 万，占 ${share(software,book1.bookVariance)}%。\n广告只多花了 ${format(ad)} 万，这 ${format(book1.bookVariance)} 万的锅，它背不动。`,"calculate_variance"),
 b("investigator","investigating","合同显示软件由销售和客服共用。我提出一个假设：新增费用可能全部记到了销售部，需要核实分摊。","read_evidence(S-02)",{handoff:"调查 → 复核 · 共同使用假设"}),
 b("reviewer","reviewing","共同使用只是假设。没有本期已批准分摊单，不能把费用调走。当前证据不足，暂不接受归属调整。","reject_unapproved_allocation",{handoff:"复核 → 主持 · 请求批准件"}),
 b("host","supplementing","发起第 1 轮补查：查找本期分摊批准单，确认期间、金额和审批状态。继续保留账面原值。","request_supplement(1/2)",{request:true,handoff:"主持 → 调查 · 补查分摊批准单"}),
 b("investigator","supplementing",`已取得本期分摊批准单：新增软件 ${format(software)} 万中，客服承担 ${format(allocation)} 万。审批有效，适用 8 月。`,"read_evidence(S-03)",{handoff:"调查 → 核算 · 批准件已齐"}),
 b("accountant","recalculating",`管理口径重算：销售调减 ${format(allocation)} 万，客服调增 ${format(allocation)} 万。销售超支 ${format(book1.bookVariance)} → ${format(book1.bookVariance-allocation)} 万；公司本案费用合计仍为 ${format(book1.bookActual)} 万。账面不变。`,"allocate_and_reconcile",{recalculate:true}),
 b("reviewer","reviewing","批准件、分摊金额、零和勾稽均通过。原广告解释不成立；软件增加的业务原因仍没有证据，保留为未决项。","verify_evidence_and_balance"),
 b("host","reviewing","可形成修正解释：广告不是主要超支来源，软件差异应先扣除客服承担部分。金额已核实，业务原因待补充，结论交人确认。","derive_conclusion_card",{duration:8000})
 ]},
 {id:"02",scriptId:"marketing-period-v1",title:"展会费属于下月吗",department:"市场部",topic:"跨月期间",period:"2026-08",claim:`本月市场费用节约 ${format(-book2.bookVariance)} 万。展会搭建 ${format(eventAmount)} 万应计入下月，展会 9 月才开。`,book:book2,amount:eventAmount,buckets:{"2026-08":book2.bookActual,"2026-09":eventAmount} as Record<string,number>,target:"2026-08",rule:"本演示采用固定管理规则：无已批准待摊单，不得将已进场的本期费用调出。",unresolved:"补查仅取得未签字待摊草稿，尚无有效批准件。待摊理由和审批仍待确认，本次不接受调出 8 月。",evidence:[
 {id:"M-01",name:"8 月费用与预付明细",kind:"ledger",status:"record",period:"2026-08",summary:"8 月 72 万 · 9 月预付 18 万",body:"市场部 / 2026 年 8 月\n本月预算 80 万，账面实际 72 万，差异 −8 万。\n展会搭建 18 万已挂入 9 月预付。\n本案费用池：8 月 72 万 + 9 月 18 万 = 90 万。\n其他月份未纳入本案，调整不改变全年合计。",unlock:-1},
 {id:"M-02",name:"展会搭建合同",kind:"contract",status:"record",amount:eventAmount,period:"2026-08",summary:"合同金额 18 万",body:"合同编号：SYN-EXPO-0826\n搭建金额：18 万。\n施工进场约定：2026/08/27。\n展会对外开放：2026 年 9 月。\n展会开放日期不等于费用归属的批准依据。",unlock:2},
 {id:"M-03",name:"搭建服务发票",kind:"invoice",status:"record",amount:eventAmount,period:"2026-08",summary:"开票日期 08/22",body:"合成发票 / 不作报销凭证\n开票日期：2026/08/22。\n项目：展会搭建服务。\n价税合计：18 万。",unlock:2},
 {id:"M-04",name:"施工进场记录",kind:"entry",status:"record",period:"2026-08",summary:"进场日期 08/27",body:"记录编号：SYN-ENTRY-0827\n进场日期：2026/08/27。\n现场记录：搭建人员与材料已进场。\n用于本演示的固定期间核查规则。",unlock:2},
 {id:"M-05",name:"待摊申请草稿",kind:"deferral",status:"unsigned",amount:eventAmount,period:"2026-08",summary:"未签字 · 不构成批准件",body:"申请事项：将搭建费用 18 万调入 9 月。\n申请理由：展会 9 月开放。\n审批人签字：[空白]\n审批日期：[空白]\n状态：未签字草稿。\n本次补查没有找到已批准待摊单。",unlock:5}
 ] as Evidence[],beats:[
 b("host","dispatched","会审开始。锁定 8 月账面，核算与调查同步核查展会费用；复核重点查看跨期依据。","lock_book_snapshot",{handoff:"核算 ∥ 调查 · 并行任务已派发"}),
 b("accountant","investigating",`账面 ${format(book2.bookActual)} 万对预算 ${format(book2.bookBudget)} 万，看似节约 ${format(-book2.bookVariance)} 万。但另有 ${format(eventAmount)} 万挂在 9 月，节约来自跨期，不能直接解释为费用下降。`,"inspect_period_bridge"),
 b("investigator","investigating",`合同 ${format(eventAmount)} 万，发票日期 8 月 22 日，施工进场 8 月 27 日。展会 9 月开幕，但搭建已经在 8 月开始。`,"read_evidence(M-02,M-03,M-04)",{handoff:"调查 → 复核 · 三份材料已取得"}),
 b("reviewer","reviewing","按本案管理规则，没有已批准待摊单，不能跨月。展会 9 月开幕不能代替批准件，请补查。","require_approved_deferral",{handoff:"复核 → 主持 · 请求待摊批准单"}),
 b("host","supplementing","发起第 1 轮补查：确认是否有已批准待摊单。若只有草稿，本次不接受调出 8 月。","request_supplement(1/2)",{request:true}),
 b("investigator","supplementing","补查只找到未签字草稿，审批人和审批日期均为空。没有有效批准件。","read_evidence(M-05)",{handoff:"调查 → 复核 · 未签字草稿"}),
 b("reviewer","reviewing","证据不足，不予调出。按本案固定规则，将搭建费用恢复至 8 月管理口径；待摊申请保留为未决项。","reject_unsigned_deferral"),
 b("accountant","recalculating",`8 月管理实际：${format(book2.bookActual)} + ${format(eventAmount)} = ${format(book2.bookActual+eventAmount)} 万。节约 ${format(-book2.bookVariance)} 万变为超支 ${format(book2.bookVariance+eventAmount)} 万。9 月同步调减 ${format(eventAmount)} 万，全年合计不变。`,"restore_period_and_reconcile",{recalculate:true}),
 b("host","reviewing","原节约解释不成立。结论卡保留账面原值、期间金额桥和未签字草稿。当前不接受跨月处理，审批事项待人确认。","derive_conclusion_card",{duration:8000})
 ]}
]);
export type Case=typeof cases[number];
