/* ---------------- 比赛类型枚举 ---------------- */
// 接口未加载时的兜底类型名，正式来源为 /match/types
export type TournamentType = '淘汰赛' | '快速赛' | '豪客赛' | '邀请赛' | '免费赛' | '卫星赛'

export const TOURNAMENT_TYPES : TournamentType[] = [
	'淘汰赛',
	'快速赛',
	'豪客赛',
	'邀请赛',
	'免费赛',
	'卫星赛'
]

/* ---------------- 比赛 vs 预约 ---------------- */
// 比赛 = 直接开打；预约 = 计划未来某时开打（表单里存后端的 scheduled：0=比赛 1=预约）
export type TournamentMode = 'match' | 'reservation'
