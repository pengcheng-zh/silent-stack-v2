import type { MatchDetailVO } from './match-api'


/* ---------------- 真实接口映射（GET /match/detail/{id}） ---------------- */

// 状态码 → 中文（与广场列表一致）
export const statusLabelOf = (code : string) : string => {
	if (code == 'P') { return '进行中' }
	if (code == 'C') { return '报名中' }
	if (code == 'S') { return '已暂停' }
	if (code == 'F') { return '已结束' }
	return '进行中'
}

// "yyyy-MM-dd HH:mm:ss" → "MM-DD HH:mm"
export const formatStart = (v : string) : string => {
	return v.length >= 16 ? v.slice(5, 16) : v
}

// 我的状态文案：结合 joined / joinValid / 比赛状态
export const myStateOfVo = (vo : MatchDetailVO) : string => {
	switch (vo.joinedStatus) {
		case 'C': return '未加入'
		case 'E': return '已报名'
		case 'A': return '已加入'
		case 'D': return '已离桌'
		case 'K': return '已踢出'
		case 'L': return '已复活'
		default: return '未报名'
	}
}


