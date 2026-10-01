/* ---------------- 段位花色（复用 jiude-data 的 6 级） ---------------- */
// 与 rank-data / jiude-data 保持同一组 key；tierLevel 1=I 最高 / 6=V 最低
export type TierKey = 'legend' | 'crown' | 'spade' | 'heart' | 'club' | 'diamond'

export const TIER_META : Record<TierKey, { name : string, suit : string, color : string }> = {
	diamond: { name: '方片', suit: '♦', color: '#7AB6F2' },
	club:    { name: '梅花', suit: '♣', color: '#7AC79A' },
	heart:   { name: '红心', suit: '♥', color: '#FF6255' },
	spade:   { name: '黑桃', suit: '♠', color: '#C7CDCB' },
	crown:   { name: '王座', suit: '♛', color: '#E8C275' },
	legend:  { name: '传奇', suit: '★', color: '#FFE9B8' }
}

/* ---------------- 用户行（后台视角的完整数据） ---------------- */
/* ---------------- 资产字段（用于调账弹层 + 账单展示） ---------------- */
// 10 个可调账资产；key 对应 AdminUserRow 的字段名，
// label / color / unit 决定弹层选项的展示与账单列表的视觉
export type AssetKey = 'balance' | 'ticketCount' | 'monthlyTicket' | 'directTicket' | 'points'
                    | 'jiudeBalance' | 'jiudeA' | 'jiudeB' | 'jiudeC' | 'jiudeGrowth'

export type AssetMeta = {
	key : AssetKey
	label : string       // 中文展示
	color : string       // 弹层 / 账单色块
	unit : string        // 单位（元 / 张 / 枚 / 分）
	intOnly : boolean    // 整数 only（票/分），false 允许小数（元）
}

export const ASSET_META : AssetMeta[] = [
	{ key: 'balance',       label: '金额',         color: '#E8C275', unit: '元',  intOnly: false },
	{ key: 'ticketCount',   label: '门票',         color: '#7AB6F2', unit: '张',  intOnly: true  },
	{ key: 'monthlyTicket', label: '月票',         color: '#2AA97A', unit: '张',  intOnly: true  },
	{ key: 'directTicket',  label: '直通函',       color: '#B07AE8', unit: '张',  intOnly: true  },
	{ key: 'points',        label: '积分',         color: '#FF6255', unit: '分',  intOnly: true  },
	{ key: 'jiudeBalance',  label: '酒德余额',     color: '#57C79A', unit: '币',  intOnly: true  },
	{ key: 'jiudeA',        label: '酒德套餐券A',  color: '#2AA97A', unit: '张',  intOnly: true  },
	{ key: 'jiudeB',        label: '酒德套餐券B',  color: '#E8C275', unit: '张',  intOnly: true  },
	{ key: 'jiudeC',        label: '酒德套餐券C',  color: '#B07AE8', unit: '张',  intOnly: true  },
	{ key: 'jiudeGrowth',   label: '酒德成长值',   color: '#7AB6F2', unit: '点',  intOnly: true  }
]

const assetByKey = (k : AssetKey) : AssetMeta => {
	const list : AssetMeta[] = ASSET_META
	const len : number = list.length
	for (let i : number = 0; i < len; i++) { if (list[i].key == k) { return list[i] } }
	return list[0]
}
export const metaOf = assetByKey

/* ---------------- 段位名（罗马数字 I ~ VI） ---------------- */
const romanOf = (n : number) : string => {
	if (n <= 1) { return 'I' }
	if (n == 2) { return 'II' }
	if (n == 3) { return 'III' }
	if (n == 4) { return 'IV' }
	if (n == 5) { return 'V' }
	return 'VI'
}
export const tierRoman = romanOf

/* ---------------- 手机号脱敏 ---------------- */
// 中间 4 位替换为 *；空串 / 长度不足原样返回
export const maskPhone = (raw : string) : string => {
	if (raw.length < 7) { return raw }
	return raw.substring(0, 3) + '****' + raw.substring(raw.length - 4)
}

/* ---------------- 种子用户池 ---------------- */
// 取 JIUDE_RANK_TOTAL 全部 40 位玩家，按 rank 顺序填 ID；
// 钱包/门票/月票/直通函/积分/酒德余额/A/B/C/成长值 = rank 序号为种子的"看起来合理"的演示值
/* ---------------- 用户的荣誉列表（弹层用） ---------------- */
// 给每人生成 3~6 项荣誉：日期从今天回溯；level 三档（金/银/铜）按 rank 派生
export type UserHonorItem = {
	id : string
	title : string
	subtitle : string
	date : string           // YYYY-MM-DD
	level : 'gold' | 'silver' | 'bronze'
}

const HONOR_POOL : { title : string, sub : string }[] = [
	{ title: '周末深筹赛冠军',     sub: '上海外滩旗舰店 · 9 人桌' },
	{ title: '月度最佳玩家',       sub: '8 月 · 杭州西湖店' },
	{ title: '大师赛资格赛 · 门票', sub: '晋级下一轮 D2' },
	{ title: '复活狂欢夜冠军',     sub: '上海静安寺店' },
	{ title: '高额挑战赛季军',     sub: '奖金 4,800 元' },
	{ title: '连续打卡 30 日',     sub: '每月签到无中断' },
	{ title: '蘑菇王',             sub: '本月累计 88 枚蘑菇' },
	{ title: '跨城联赛亚军',       sub: '苏州站 → 杭州站' },
	{ title: '邀请赛 · 8-Max',     sub: '上海陆家嘴店' },
	{ title: '周日重头戏冠军',     sub: '上海陆家嘴店 · 27 人桌' }
]

const buildHonors = (userId : string, seed : number) : UserHonorItem[] => {
	const count : number = 3 + (seed % 4)            // 3~6 项
	const list : UserHonorItem[] = []
	const today : Date = new Date()
	for (let k : number = 0; k < count; k++) {
		const pool : { title : string, sub : string } = HONOR_POOL[(seed + k * 7) % HONOR_POOL.length]
		const offset : number = 7 + (seed + k * 13) % 180   // 距今 7~186 天
		const d : Date = new Date(today.getTime() - offset * 86400000)
		const y : string = d.getFullYear().toString()
		const mo : string = ((d.getMonth() + 1).toString().length == 1 ? '0' + (d.getMonth() + 1).toString() : (d.getMonth() + 1).toString())
		const dd : string = (d.getDate().toString().length == 1 ? '0' + d.getDate().toString() : d.getDate().toString())
		const lvl : 'gold' | 'silver' | 'bronze' = (k == 0 && seed % 3 == 0) ? 'gold' : (k == count - 1 ? 'bronze' : 'silver')
		list.push({
			id: userId + '-h' + k.toString(),
			title: pool.title,
			subtitle: pool.sub,
			date: y + '-' + mo + '-' + dd,
			level: lvl
		})
	}
	return list
}

/* ---------------- 用户的账单（弹层用） ---------------- */
// 演示：每用户 8 条记录，类型覆盖 6 种（gift/deduct/buy/redeem/refund/sign），
// 数量按用户在池中的位置派生，保证不同用户数据有差异；时间从今天回溯
export type UserBillItem = {
	id : string
	date : string                 // 简洁展示：今天 / 昨天 / MM-DD HH:mm
	type : 'gift' | 'deduct' | 'buy' | 'redeem' | 'refund' | 'sign'
	asset : string                // 资产展示名（如"酒德余额"）
	assetColor : string           // 颜色（沿用 ASSET_META）
	delta : number                // 正负
	reason : string               // 备注
	operator : string             // 操作员
}

const BILL_REASONS : { type : UserBillItem['type'], asset : AssetKey, reason : string }[] = [
	{ type: 'gift',   asset: 'balance',       reason: '客服手工赠送 · 投诉补偿' },
	{ type: 'gift',   asset: 'ticketCount',   reason: '赛事奖励 · 周三例行赛 #3' },
	{ type: 'gift',   asset: 'jiudeBalance',  reason: '签到奖励 · 连续 7 日' },
	{ type: 'gift',   asset: 'points',        reason: '生日礼 · 双倍积分' },
	{ type: 'gift',   asset: 'jiudeGrowth',   reason: '赛季结束 · 段位成长补发' },
	{ type: 'gift',   asset: 'monthlyTicket', reason: '月度自动发放 · 9 月' },
	{ type: 'deduct', asset: 'balance',       reason: '报名费 · 周末深筹赛' },
	{ type: 'deduct', asset: 'ticketCount',   reason: '兑换 · 定制牌具礼盒' },
	{ type: 'deduct', asset: 'jiudeBalance',  reason: '兑换 · 包厢 9 折券' },
	{ type: 'deduct', asset: 'jiudeA',        reason: '兑换 · 成长礼包券' },
	{ type: 'deduct', asset: 'jiudeC',        reason: '兑换 · 私人牌局定制名额' },
	{ type: 'buy',    asset: 'ticketCount',   reason: '商城购入 · 大师赛门票 ×1' },
	{ type: 'buy',    asset: 'directTicket',  reason: '商城购入 · 直通函 ×1' },
	{ type: 'redeem', asset: 'jiudeB',        reason: '兑换 · 赛事纪念徽章' },
	{ type: 'refund', asset: 'balance',       reason: '赛事取消 · 报名费退回' },
	{ type: 'sign',   asset: 'jiudeGrowth',   reason: '每日签到 · +10 成长' }
]

const fmtBillDate = (offsetDay : number, hour : number, minute : number) : string => {
	const d : Date = new Date()
	d.setDate(d.getDate() - offsetDay)
	const mo : string = ((d.getMonth() + 1).toString().length == 1 ? '0' + (d.getMonth() + 1).toString() : (d.getMonth() + 1).toString())
	const dd : string = (d.getDate().toString().length == 1 ? '0' + d.getDate().toString() : d.getDate().toString())
	const hh : string = (hour.toString().length == 1 ? '0' + hour.toString() : hour.toString())
	const mm : string = (minute.toString().length == 1 ? '0' + minute.toString() : minute.toString())
	if (offsetDay == 0) { return '今天 ' + hh + ':' + mm }
	if (offsetDay == 1) { return '昨天 ' + hh + ':' + mm }
	return mo + '-' + dd + ' ' + hh + ':' + mm
}

const buildBills = (userId : string, seed : number) : UserBillItem[] => {
	const list : UserBillItem[] = []
	const total : number = 8
	for (let k : number = 0; k < total; k++) {
		const slot : { type : UserBillItem['type'], asset : AssetKey, reason : string } = BILL_REASONS[(seed + k * 11) % BILL_REASONS.length]
		const meta : AssetMeta = assetByKey(slot.asset)
		const amt : number = meta.intOnly ? (1 + (seed + k * 3) % 9) : Math.round(((seed + k * 17) % 500) * 100) / 100
		const delta : number = (slot.type == 'gift' || slot.type == 'refund' || slot.type == 'sign') ? amt : -amt
		const hour : number = 8 + ((seed + k * 5) % 14)
		const minute : number = ((seed + k * 7) % 60)
		list.push({
			id: userId + '-b' + k.toString(),
			date: fmtBillDate(k, hour, minute),
			type: slot.type,
			asset: meta.label,
			assetColor: meta.color,
			delta: delta,
			reason: slot.reason,
			operator: (k % 2 == 0) ? '客服 A' : '客服 B'
		})
	}
	return list
}

/* ---------------- 账单类型中文 ---------------- */
export const BILL_TYPE_LABEL : Record<UserBillItem['type'], string> = {
	gift:   '赠送',
	deduct: '扣减',
	buy:    '购入',
	redeem: '兑换',
	refund: '退回',
	sign:   '签到'
}