import type { JiudeRankPlayer } from './types'

/* ---------------- 玩家命名池 ---------------- */
// 取名风格：扑克圈诨号（避免真实姓名）；NAMES 长度 ~60，足够 3 个榜单共用
const NAMES : string[] = [
	'河圈艺术家', '深海老鲨', 'GTO七号', '老K不浪', '西装暴徒', '天黑请闭眼', '咖啡因选手',
	'牌桌上的猫', '短码刺客', '翻牌圈诗人', '冷面下注', '河底抽花侠', '柠檬味筹码', '慢打的KK',
	'坚果成瘾', '底池收割', '位置控', '盲注精算', '顶对爱好者', '偷鸡未遂', '价值下注', '口袋迷',
	'同花梦', '顺子听牌', 'SET成瘾', '坚果之王', '转牌戏法', 'check-raise王', '3bet常客',
	'小盲注本人', '大盲护体', '连开三枪', '四次过牌', 'fold怪', 'limp王', 'limp-fold循环',
	'straddle爱好者', 'all-in或弃', 'pot-commit', 'ICM恐惧', '抽花上瘾', '买花不买牌',
	'A嗨不离手', '口袋J信仰', 'KK见光死', 'AA被打翻', '77永不弃', '翻牌圈弃牌', '转牌全押',
	'河牌全押', '慢打爱好者', '快打急先锋', 'preflop肉搏', 'postflop散步', 'donk下注',
	'overbet常客', 'check-call', 'check-fold', 'flop-cbet', 'turn-probe', '六号位铁人'
]

const CITIES : string[] = ['上海', '北京', '广州', '深圳', '杭州', '苏州', '南京', '宁波', '成都', '武汉']

// 段位顺序：低 → 高；用于 buildPool 中按 i / 5 切换，每 5 人降一段
const TIER_KEYS : string[] = ['diamond', 'club', 'heart', 'spade', 'crown', 'legend']

/* ---------------- 数字加千分位 ---------------- */
// 榜单里的积分动辄 5 位数，3 位一隔更易读
export const formatNum = (n : number) : string => {
	const s : string = n.toString()
	let out : string = ''
	let c : number = 0
	for (let i : number = s.length - 1; i >= 0; i--) {
		out = s.charAt(i) + out
		c++
		if (c % 3 == 0 && i > 0) { out = ',' + out }
	}
	return out
}

/* ---------------- "我"的酒德榜记录 ---------------- */
// 与 jiude-data.MY_JIUDE 同步：monthPoints=184 / totalPoints=12480 / tier=spade
// 导出供页面 me-card 直接消费；同时也插入到月度榜 + 总榜里钉住"我"的位置
// 新人榜不参与（joinDate 2025-08-12 远超 30 天门槛）
export const ME_PLAYER : JiudeRankPlayer = {
	rank: 0,					// 由 sortAndRank 回填
	id: 'me',
	name: '低调的深筹',
	city: '上海',
	totalPoints: 12480,
	monthPoints: 184,
	tierKey: 'spade',
	tierLevel: 3,
	isNew: false,
	joinDate: '2025-08-12',
	isMe: true
}

/* ---------------- 通用生成器 ---------------- */
// 用确定性映射生成单调递减的玩家池：
//   - 段位按 i / 5 切换（每 5 人降一段），对应总榜段位分布
//   - totalPoints / monthPoints 按线性递减 + 小幅扰动，保留手工调"我"位置所需的"间隙"
// 越靠前的玩家分数越高；扰动用同余算法保证可复现
const buildPool = (
	count : number,
	startTotal : number,
	endTotal : number,
	startMonth : number,
	endMonth : number
) : JiudeRankPlayer[] => {
	const totalStep : number = (startTotal - endTotal) / Math.max(count - 1, 1)
	const monthStep : number = (startMonth - endMonth) / Math.max(count - 1, 1)
	const result : JiudeRankPlayer[] = []
	for (let i : number = 0; i < count; i++) {
		const tierIdx : number = Math.floor(i / 5) % TIER_KEYS.length
		const tier : string = TIER_KEYS[tierIdx]
		const level : number = ((i % 4) + 1)
		// 总积分：基础递减 + 小幅扰动（0~99），让相邻名次的分数有"含金量"差异
		const total : number = Math.floor(startTotal - i * totalStep + ((i * 37) % 100))
		// 月积分：起点比"我"的 184 高约 17 倍
		const month : number = Math.max(0, Math.floor(startMonth - i * monthStep + ((i * 13) % 30)))
		const nmIdx : number = i % NAMES.length
		const name : string = NAMES[nmIdx] + (i >= NAMES.length ? '·' + (Math.floor(i / NAMES.length) + 1).toString() : '')
		result.push({
			rank: 0,
			id: 'p' + (i + 1).toString().padStart(2, '0'),
			name: name,
			city: CITIES[i % CITIES.length],
			totalPoints: total,
			monthPoints: month,
			tierKey: tier,
			tierLevel: level,
			isNew: false,
			// 注册日散布在 2025 年内，仅"我"在 2025-08
			joinDate: '2025-' + (((i * 5) % 12) + 1).toString().padStart(2, '0') + '-' + (((i * 7) % 28) + 1).toString().padStart(2, '0'),
			isMe: false
		})
	}
	return result
}

// 排序并回填 rank 字段
const sortAndRank = (pool : JiudeRankPlayer[], sortKey : 'month' | 'total') : JiudeRankPlayer[] => {
	const copy : JiudeRankPlayer[] = pool.slice()
	copy.sort((a : JiudeRankPlayer, b : JiudeRankPlayer) : number => {
		if (sortKey == 'month') { return b.monthPoints - a.monthPoints }
		return b.totalPoints - a.totalPoints
	})
	copy.forEach((p : JiudeRankPlayer, i : number) : void => { p.rank = i + 1 })
	return copy
}

/* ---------------- 总榜 ---------------- */
// 31 人在"我"前 + 我 + 8 人在后 = 40 条；"我"按 totalPoints=12480 自然落在 No.32
//   前 31 人 total 区间 [12,660, 38,000] 均 > 12,480；后 8 人 total 区间 [5,860, 11,800] 均 < 12,480
const TOTAL_BEFORE : JiudeRankPlayer[] = buildPool(31, 38000, 12650, 2200, 220)
const TOTAL_AFTER : JiudeRankPlayer[] = buildPool(8, 11800, 5800, 180, 80)
export const JIUDE_RANK_TOTAL : JiudeRankPlayer[] = sortAndRank([...TOTAL_BEFORE, ME_PLAYER, ...TOTAL_AFTER], 'total')

/* ---------------- 月度榜 ---------------- */
// 11 人在"我"前 + 我 + 18 人在后 = 30 条；"我"按 monthPoints=184 自然落在 No.12
//   前 11 人 month 区间 [200+, 3,200] 均 > 184；后 18 人 month 区间 [40, 180] 均 < 184
const MONTHLY_BEFORE : JiudeRankPlayer[] = buildPool(11, 3200, 200, 3200, 200)
const MONTHLY_AFTER : JiudeRankPlayer[] = buildPool(18, 180, 40, 180, 40)
export const JIUDE_RANK_MONTHLY : JiudeRankPlayer[] = sortAndRank([...MONTHLY_BEFORE, ME_PLAYER, ...MONTHLY_AFTER], 'month')

/* ---------------- 新人榜 ---------------- */
// 20 条新人数据：注册日均在 2026-09 内（30 天内），按月积分降序
// "我"注册于 2025-08-12，不在新人榜 → 页面 me-card 显示"未上榜"
export const JIUDE_RANK_NEWBIE : JiudeRankPlayer[] = (() : JiudeRankPlayer[] => {
	const pool : JiudeRankPlayer[] = buildPool(20, 1200, 80, 1200, 80)
	// 覆盖为新人属性：joinDate 落在 2026-09、tierKey=diamond、tierLevel=6、累计积分封顶 1500
	pool.forEach((p : JiudeRankPlayer, i : number) : void => {
		const d : number = (i % 25) + 1
		p.joinDate = '2026-09-' + d.toString().padStart(2, '0')
		p.tierKey = 'diamond'
		p.tierLevel = 6
		p.totalPoints = Math.min(p.totalPoints, 1500)
		p.isNew = true
	})
	return sortAndRank(pool, 'month')
})()