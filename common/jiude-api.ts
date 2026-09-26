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

/** 存积分返回结果（POST /jiu-de/deposit） */
export type DepositResultVO = {
	points : number
	amount : number
	totalAmount : number
	monthPoints : number
	comboA : number
	comboB : number
	comboC : number
}

/** 存积分：POST /jiu-de/deposit { amount } */
export const depositPoints = (amount : number) : Promise<DepositResultVO> => {
	return httpPost<DepositResultVO>('/jiu-de/deposit', { amount: amount })
}

/** 我的酒德数据：GET /jiu-de/info */
export const fetchMyJiude = () : Promise<UserJiuDeVO> => {
	return httpGet<UserJiuDeVO>('/jiu-de/info').then((r : any) => {
		return r as UserJiuDeVO
	})
}
