import { httpGet, httpPost } from './http'

/** 酒德积分申请（来自 /jiu-de/request-list，字段与后端 PointsRequestVO 一致，不做映射） */
export type PointsRequestVO = {
	id : number
	userId : number
	userNo : string
	username : string
	avatar : string
	storeId : number
	storeName : string
	points : number
	currentPoints : number
	type : number            // 0 存积分 / 1 取积分
	status : string          // 后端状态串
	createTime : string
}

// 后端状态串归一：'1'/'A'/含 APPROV/PASS → 已通过；'2'/'R'/含 REJECT → 已拒绝；其余 → 待审核
export const normalizeStatus = (s : string) : 'A' | 'P' | 'R' => {
	const v : string = (s || '').toString().trim().toUpperCase()
	if (v == '1' || v == 'A' || v.indexOf('APPROV') >= 0 || v == 'PASS') { return 'P' }
	if (v == '2' || v == 'R' || v.indexOf('REJECT') >= 0) { return 'R' }
	return 'A'
}

// '2026-09-20 11:20:00' → '09-20 11:20'
export const fmtDate = (t : string) : string => {
	const s : string = (t || '').toString()
	return s.length >= 16 ? s.substring(5, 16) : s
}

/**
 * GET /jiu-de/request-list?type=0&page=1&limit=20 —— 酒德积分申请列表
 * @param type 0 存积分 / 1 取积分
 */
export const fetchJiudeRequests = (type : 0 | 1, page : number = 1, limit : number = 20) : Promise<PointsRequestVO[]> => {
	return httpGet<any>('/jiu-de/request-list', { type: type, page: page, limit: limit }).then((r : any) => {
		// 兼容 { list } / { records } / 纯数组
		const rawList : any[] = Array.isArray(r) ? r : ((r && (r.list || r.records)) || [])
		return rawList as PointsRequestVO[]
	})
}

/**
 * POST /jiu-de/approve —— 审核酒德积分申请
 * @param id 申请 id
 * @param status P 通过 / R 拒绝
 */
export const approveJiudeRequest = (id : number, status : 'P' | 'R') : Promise<void> => {
	return httpPost<void>('/jiu-de/approve', { id: id, status: status }).then(() => { return })
}

/* ---------------- 我的酒德数据（GET /jiu-de/info，与后端 UserJiuDeVO 字段一一对应） ---------------- */
export type UserJiuDeVO = {
	userId : number
	username : string
	avatar : string
	storeId : number
	storeName : string
	points : number           // 总积分
	monthPoints : number      // 本月积分
	weekPoints : number       // 本周积分
	ranking : number          // 酒德排名
	amount : number           // 酒德余额
	totalAmount : number      // 累计
	comboA : number
	comboAUsed : number
	comboB : number
	comboBUsed : number
	comboC : number
	comboCUsed : number
	levelLabel : string
	needScore : number
}

/* ---------------- 等级权益（GET /jiu-de/level-benefit） ---------------- */
export type LevelBenefitVO = {
	levelLabel : string
	points : number
	score : number
	needScore : number
	monthCard : number
	monthACombo : number
	monthBCombo : number
	monthCCombo : number
}

/** 等级权益列表：GET /jiu-de/level-benefit（每个等级一条 LevelBenefitVO） */
export const fetchLevelBenefit = () : Promise<LevelBenefitVO[]> => {
	return httpGet<any>('/jiu-de/level-benefit').then((r : any) => {
		// 兼容纯数组 / { list } / { records } 包装
		const rawList : any[] = Array.isArray(r) ? r : ((r && (r.list || r.records)) || [])
		return rawList as LevelBenefitVO[]
	})
}

/** 存积分：POST /jiu-de/recharge { storeId, points }（storeId 为当前选中门店，未选传 0） */
export const rechargePoints = (storeId : number, points : number) : Promise<void> => {
	return httpPost<void>('/jiu-de/recharge', { storeId: storeId, points: points })
}

/** 取积分：POST /jiu-de/withdraw { storeId, points }（storeId 为当前选中门店，未选传 0） */
export const withdrawPoints = (storeId : number, points : number) : Promise<void> => {
	return httpPost<void>('/jiu-de/withdraw', { storeId: storeId, points: points })
}

/* ---------------- 等级统一配色 ---------------- */
// 与 jiude.vue 等级权益卡保持同一套 7 级主色：X 最低（灰）→ A → AA → AAA → AAAA → AAAAA → AAAAAA 最高
// 其他酒德页面（榜单/记录等）统一从这里取色，避免各页维护各自的色表
export const JIUDE_TIER_COLORS : string[] = ['#A9B4C0', '#5AC8FA', '#4CD97B', '#FF7A5C', '#E8EDF2', '#FFCB3D', '#FFF0B8']

/** 按 levelLabel 取等级主色（X→灰，A~AAAAAA 按 A 的个数 1~6 取色；未识别回落灰色） */
export const jiudeTierColor = (levelLabel : string) : string => {
	const s : string = (levelLabel || '').toString().trim().toUpperCase()
	let idx : number = 0
	if (/^A+$/.test(s)) { idx = s.length }
	return JIUDE_TIER_COLORS[idx >= 0 && idx < JIUDE_TIER_COLORS.length ? idx : 0]
}

/** 文字颜色样式串，模板直接绑定 */
export const jiudeTierColorStyle = (levelLabel : string) : string => {
	return 'color:' + jiudeTierColor(levelLabel) + ';'
}

/** 我的酒德数据：GET /jiu-de/info */
export const fetchMyJiude = () : Promise<UserJiuDeVO> => {
	return httpGet<UserJiuDeVO>('/jiu-de/info').then((r : any) => {
		return r as UserJiuDeVO
	})
}

/**
 * 酒德排行榜：GET /jiu-de/rank?type=0&page=1&limit=10
 * type: 0=月度榜 / 1=新人榜 / 2=总榜
 * 直接消费后端 VO（userId/username/avatar/points/monthPoints/weekPoints/levelLabel）
 */
export const fetchJiudeRank = (type : number, page : number, limit : number) : Promise<UserJiuDeVO[]> => {
	return httpGet<any>('/jiu-de/rank', { type: type, page: page, limit: limit }).then((r : any) => {
		const rawList : any[] = Array.isArray(r) ? r : ((r && (r.list || r.records)) || [])
		return rawList as UserJiuDeVO[]
	})
}

/** 酒德积分变动记录（GET /jiu-de/record-list 与 /jiu-de/billing，直接消费后端 VO，不做映射） */
export type PointsRecordVO = {
	id : number
	userId : number
	storeId : number
	storeName ?: string        // billing 接口返回：变动发生的门店名
	points : number           // 变化量（可正可负）
	pointsBefore : number     // 变化前
	pointsAfter : number      // 变化后
	operatorId ?: number       // billing 接口返回：操作人 id
	operatorName ?: string     // billing 接口返回：操作人名字（后端声明 Integer，实际按名字字符串展示）
	type : number             // 0 保存积分 / 1 兑换积分 / 2 充值 / 3 消费
	createTime : string
}

/**
 * GET /jiu-de/record-list?page=1&limit=10&startDate=&endDate=
 * 直接返回后端 VO 数组，页面消费 points / pointsBefore / pointsAfter / type / createTime
 */
export const fetchJiudeRecords = (page : number, limit : number, startDate : string = '', endDate : string = '') : Promise<PointsRecordVO[]> => {
	const params : Record<string, any> = { page: page, limit: limit }
	if (startDate.length > 0) { params.startDate = startDate }
	if (endDate.length > 0) { params.endDate = endDate }
	return httpGet<any>('/jiu-de/record-list', params).then((r : any) => {
		const rawList : any[] = Array.isArray(r) ? r : ((r && (r.list || r.records)) || [])
		return rawList as PointsRecordVO[]
	})
}

/**
 * 酒德账单（管理端查指定用户）：GET /jiu-de/billing?userId=&page=&limit=&startDate=&endDate=
 * 直接返回后端 PointsRecordVO 数组，页面消费 points / pointsBefore / pointsAfter / type / storeName / operatorName / createTime
 */
export const fetchJiudeBilling = (userId : number, page : number, limit : number, startDate : string = '', endDate : string = '') : Promise<PointsRecordVO[]> => {
	const params : Record<string, any> = { userId: userId, page: page, limit: limit }
	if (startDate.length > 0) { params.startDate = startDate }
	if (endDate.length > 0) { params.endDate = endDate }
	return httpGet<any>('/jiu-de/billing', params).then((r : any) => {
		const rawList : any[] = Array.isArray(r) ? r : ((r && (r.list || r.records)) || [])
		return rawList as PointsRecordVO[]
	})
}
