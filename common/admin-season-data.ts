/* ---------------- 赛季管理（后台） ---------------- */
// 列表数据来自 /match-season/list（见 season-api.ts）
// 赛季只有 3 个可编辑字段：名称 / 开始时间 / 截止时间
// 状态（进行中 / 未开始 / 已结束）由日期与"今天"实时推导，不落库

export type AdminSeasonRow = {
	id : string
	name : string
	start : string        // YYYY-MM-DD
	end : string          // YYYY-MM-DD
}

/* ---------------- 状态推导 ---------------- */
export type SeasonStatus = 'ongoing' | 'upcoming' | 'ended'

export const SEASON_STATUS_META : Record<SeasonStatus, { label : string, color : string }> = {
	ongoing:  { label: '进行中', color: '#B07AE8' },
	upcoming: { label: '未开始', color: '#7AB6F2' },
	ended:    { label: '已结束', color: '#6E7573' }
}

const pad2 = (n : number) : string => n < 10 ? '0' + n.toString() : n.toString()

// 今天的 YYYY-MM-DD；所有状态 / 剩余天数都以它为基准
export const todayStr = () : string => {
	const t = new Date()
	return t.getFullYear().toString() + '-' + pad2(t.getMonth() + 1) + '-' + pad2(t.getDate())
}

// YYYY-MM-DD 定长字典序 = 时间序，直接比字符串即可判先后
export const statusOf = (s : AdminSeasonRow) : SeasonStatus => {
	const today : string = todayStr()
	if (today < s.start) { return 'upcoming' }
	if (today > s.end) { return 'ended' }
	return 'ongoing'
}

/* ---------------- 日期工具 ---------------- */
const toTs = (s : string) : number => {
	return new Date(
		parseInt(s.substring(0, 4)),
		parseInt(s.substring(5, 7)) - 1,
		parseInt(s.substring(8, 10))
	).getTime()
}

// a → b 相差的天数（b - a，可为负）
export const daysBetween = (a : string, b : string) : number => {
	return Math.round((toTs(b) - toTs(a)) / 86400000)
}

// base 加 n 天后的 YYYY-MM-DD（用于新增弹层预填截止时间）
export const addDays = (base : string, n : number) : string => {
	const t = new Date(toTs(base) + n * 86400000)
	return t.getFullYear().toString() + '-' + pad2(t.getMonth() + 1) + '-' + pad2(t.getDate())
}

// 进行中赛季的进度 0~100（其他状态由调用方决定是否展示）
export const progressOf = (s : AdminSeasonRow) : number => {
	const total : number = daysBetween(s.start, s.end)
	if (total <= 0) { return 0 }
	const passed : number = daysBetween(s.start, todayStr())
	const pct : number = Math.floor(passed * 100 / total)
	if (pct < 0) { return 0 }
	if (pct > 100) { return 100 }
	return pct
}

// 剩余天数（已结束返回 0）
export const remainDays = (s : AdminSeasonRow) : number => {
	const r : number = daysBetween(todayStr(), s.end)
	return r < 0 ? 0 : r
}
