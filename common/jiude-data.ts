import type { MyJiude, JiudeVoucher, JiudeRecord } from './types'

/* ---------------- 酒德等级门槛上限 ---------------- */
// 等级体系与权益由后端 /jiu-de/level-benefit 提供，前端不再维护等级 mock 数据。
// 仅保留"已满级"展示用的进度上限，避免进度条满格
export const JIUDE_MAX_THRESHOLD : number = 20000

/* ---------------- "我"的酒德状态 ---------------- */
// 演示数据："我"位于黑桃 III（spade，门槛 5000），已成长 6320 / 下一档 8500
// availablePoints 与 mine 页 jiude.balance / monthPoints / rank 字段保持同口径，
// 这样从 mine 页的"我的酒德"卡片点击进来，数字不会跳变
export const MY_JIUDE : MyJiude = {
	tierKey: 'tier3',
	tierLevel: 3,
	growthValue: 6320,
	nextThreshold: 8500,
	availablePoints: 2880,
	totalPoints: 12480,
	monthPoints: 184,
	rank: 32
}

/* ---------------- 套餐券 A / B / C ---------------- */
// 接口失败时的降级占位：仅 code / name / count / color，数量以 /jiu-de/info 的 combo 字段为准
export const JIUDE_VOUCHERS : JiudeVoucher[] = [
	{ code: 'A', name: '套餐', count: 0, color: '#2AA97A' },
	{ code: 'B', name: '套餐', count: 0, color: '#E8C275' },
	{ code: 'C', name: '套餐', count: 0, color: '#B07AE8' }
]

/* ---------------- 存取记录 ---------------- */
// 演示数据扩充到 24 条：单独页有滚动内容
// 前几条用"今天 / 昨天"叙事，9 月初回看给完整日期 + 时间
// type 决定左侧色条与符号（存=绿色 +、取=金色 −、转=紫色 ↔）
// amount 是酒德币绝对值，前端展示时按 type 加符号
export const JIUDE_RECORDS : JiudeRecord[] = [
	{ id: 'r01', type: 'deposit',   amount: 200, source: '赛事奖励 · 周三例行赛 #3',  date: '今天 21:42' },
	{ id: 'r02', type: 'withdraw',  amount: 500, source: '兑换套餐券 A · 成长礼包',     date: '今天 18:15' },
	{ id: 'r03', type: 'deposit',   amount: 80,  source: '签到奖励 · 连续 7 日',          date: '今天 09:30' },
	{ id: 'r04', type: 'transfer',  amount: 300, source: '转赠 · 河圈艺术家',             date: '昨天 22:08' },
	{ id: 'r05', type: 'deposit',   amount: 150, source: '生日礼 · 双倍积分',             date: '昨天 14:00' },
	{ id: 'r06', type: 'withdraw',  amount: 200, source: '兑换包厢折扣 · 红心权益',     date: '09-12 20:18' },
	{ id: 'r07', type: 'deposit',   amount: 400, source: '赛事奖励 · 赏金赛 #10',         date: '09-11 23:55' },
	{ id: 'r08', type: 'transfer',  amount: 100, source: '转赠 · GTO七号',                date: '09-10 19:42' },
	{ id: 'r09', type: 'withdraw',  amount: 300, source: '兑换 · 赛事纪念徽章',           date: '09-09 17:06' },
	{ id: 'r10', type: 'deposit',   amount: 250, source: '赛事奖励 · 资格赛 D1',          date: '09-08 22:30' },
	{ id: 'r11', type: 'deposit',   amount: 80,  source: '签到奖励 · 连续 5 日',          date: '09-07 09:30' },
	{ id: 'r12', type: 'withdraw',  amount: 150, source: '兑换 · 月度酒会席位',           date: '09-06 21:11' },
	{ id: 'r13', type: 'deposit',   amount: 600, source: '赛事奖励 · 周末明星赛 · 冠军', date: '09-05 23:02' },
	{ id: 'r14', type: 'transfer',  amount: 200, source: '转赠 · 小盲注本人',             date: '09-04 19:55' },
	{ id: 'r15', type: 'withdraw',  amount: 100, source: '兑换 · 茶水券 × 5',             date: '09-03 21:30' },
	{ id: 'r16', type: 'deposit',   amount: 350, source: '赛事奖励 · 涡轮赛 #14',         date: '09-02 22:18' },
	{ id: 'r17', type: 'deposit',   amount: 120, source: '赛事奖励 · 周六例行 · 进圈',    date: '09-01 23:46' },
	{ id: 'r18', type: 'withdraw',  amount: 80,  source: '兑换 · 迎新券',                 date: '08-31 17:22' },
	{ id: 'r19', type: 'transfer',  amount: 250, source: '转赠 · 牌桌上的猫',             date: '08-30 20:08' },
	{ id: 'r20', type: 'deposit',   amount: 500, source: '赛事奖励 · 资格赛 D1 · 冠军',   date: '08-29 23:15' },
	{ id: 'r21', type: 'withdraw',  amount: 400, source: '兑换 · 定制牌具礼盒',           date: '08-28 16:42' },
	{ id: 'r22', type: 'deposit',   amount: 200, source: '赛事奖励 · 赏金赛 #5',          date: '08-27 22:33' },
	{ id: 'r23', type: 'transfer',  amount: 150, source: '转赠 · 慢打的KK',               date: '08-26 19:18' },
	{ id: 'r24', type: 'withdraw',  amount: 120, source: '兑换 · 包厢 9 折券',            date: '08-25 21:05' }
]