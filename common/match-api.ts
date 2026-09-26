import { httpGet, httpPost } from './http'
import type { AdminTournament } from './admin-tournament-data'
import type { TournamentStatus } from './admin-tournament-data'
import type { UserRankingDTO } from './ranking-api'

/** 后端状态码 → 前端状态 */
export const statusFromCode = (code : string) : TournamentStatus => {
	switch ((code || '').toUpperCase()) {
		case 'P': return 'active'
		case 'C': return 'signup'
		case 'S': return 'paused'
		case 'F': return 'ended'
	}
	return 'active'
}

export const statusLabelOf = (s : TournamentStatus) : string => {
	switch (s) {
		case 'active': return '进行中'
		case 'signup': return '报名中'
		case 'paused': return '已暂停'
		case 'ended': return '已结束'
	}
	return s
}

/** MatchVO → AdminTournament（字段名与后端对齐，仅做类型归一化） */
export const fromMatchVO = (vo : MatchVO) : AdminTournament => {
	return {
		id: String(vo.id),
		storeId: String(vo.storeId),
		storeName: (vo.storeName ?? '').toString(),
		matchName: (vo.name ?? '').toString(),
		typeId: Number(vo.type ?? 0),
		typeName: (vo.typeName ?? '').toString(),
		scheduled: Number(vo.scheduled ?? 0),
		startTime: (vo.startTime ?? '').toString(),
		currentLevel: Number(vo.currentLevel ?? 0),
		firstHalfDuration: Number(vo.firstHalfDuration ?? 0),
		secondHalfDuration: Number(vo.secondHalfDuration ?? 0),
		originChips: Number(vo.originChips ?? 0),
		minChips: Number(vo.minChips ?? 0),
		maxChips: Number(vo.maxChips ?? 0),
		preChips: Number(vo.preChips ?? 0),
		userReliveCount: Number(vo.userReliveCount ?? 0),
		mushReliveCount: Number(vo.mushReliveCount ?? 0),
		joinAmount: 0,                          // 列表 VO 不返回
		joinTicket: 0,                          // 列表 VO 不返回
		joinMonthTicket: 0,                     // 列表 VO 不返回
		joinInviteCard: 0,                      // 列表 VO 不返回
		deskCount: Number(vo.deskCount ?? 0),
		rankOneScore: Number(vo.rankOneScore ?? 0),
		rankTwoScore: Number(vo.rankTwoScore ?? 0),
		rankThreeScore: Number(vo.rankThreeScore ?? 0),
		rankOneTicket: Number(vo.rankOneTicket ?? 0),
		rankTwoTicket: Number(vo.rankTwoTicket ?? 0),
		rankThreeTicket: Number(vo.rankThreeTicket ?? 0),
		status: statusFromCode(vo.status)
	}
}

/** 比赛管理列表 VO（来自 /match/manage-list） */
export type MatchVO = {
	id : number | string
	storeId : number | string
	storeName : string
	address : string
	latitude : string
	longitude : string
	type : number
	typeName : string
	deskCount : number
	name : string
	scheduled : number              // 0=比赛，1=预约
	startTime : string
	currentLevel : number
	originChips : number
	minChips : number
	maxChips : number
	preChips : number
	userReliveCount : number
	mushReliveCount : number
	remainReliveCount : number
	firstHalfDuration : number
	secondHalfDuration : number
	rankOneScore : number
	rankTwoScore : number
	rankThreeScore : number
	rankOneTicket : number
	rankTwoTicket : number
	rankThreeTicket : number
	avgChips : number
	playerCount : number
	currentPlayerCount : number
	status : string                 // P=进行中 C=报名中 S=暂停 F=已结束
}

export type MatchPage = {
	list : MatchVO[]
	total : number
	page : number
	limit : number
}

/** 比赛类型 VO（来自 /match/types） */
export type MatchTypeVO = {
	id : number
	name : string
	originChips : number
	joinAmount : number
	joinTicket : number
	joinMonthTicket : number
	joinInviteCard : number
	userReliveCount : number
	mushReliveCount : number
	rankOneScore : number
	rankTwoScore : number
	rankThreeScore : number
	rankOneTicket : number
	rankTwoTicket : number
	rankThreeTicket : number
}

/** 比赛等级规则 VO（来自 /match/rule） */
export type MatchRuleVO = {
	id : number
	matchLevel : number
	minChips : number
	maxChips : number
	preChips : number
	duration : number
	createTime : string
}

/** 后端单条比赛记录 → MatchVO（字段归一化，manage-list / list 共用） */
const toMatchVO = (it : any) : MatchVO => {
	return {
		id: it.id,
		storeId: it.storeId,
		storeName: (it.storeName ?? '').toString(),
		address: (it.address ?? '').toString(),
		latitude: (it.latitude ?? '').toString(),
		longitude: (it.longitude ?? '').toString(),
		type: Number(it.type ?? 0),
		typeName: (it.typeName ?? '').toString(),
		deskCount: Number(it.deskCount ?? 0),
		name: (it.name ?? '').toString(),
		scheduled: Number(it.scheduled ?? 0),
		startTime: (it.startTime ?? '').toString(),
		currentLevel: Number(it.currentLevel ?? 0),
		originChips: Number(it.originChips ?? 0),
		minChips: Number(it.minChips ?? 0),
		maxChips: Number(it.maxChips ?? 0),
		preChips: Number(it.preChips ?? 0),
		userReliveCount: Number(it.userReliveCount ?? 0),
		mushReliveCount: Number(it.mushReliveCount ?? 0),
		remainReliveCount: Number(it.remainReliveCount ?? 0),
		firstHalfDuration: Number(it.firstHalfDuration ?? 0),
		secondHalfDuration: Number(it.secondHalfDuration ?? 0),
		rankOneScore: Number(it.rankOneScore ?? 0),
		rankTwoScore: Number(it.rankTwoScore ?? 0),
		rankThreeScore: Number(it.rankThreeScore ?? 0),
		rankOneTicket: Number(it.rankOneTicket ?? 0),
		rankTwoTicket: Number(it.rankTwoTicket ?? 0),
		rankThreeTicket: Number(it.rankThreeTicket ?? 0),
		avgChips: Number(it.avgChips ?? 0),
		playerCount: Number(it.playerCount ?? 0),
		currentPlayerCount: Number(it.currentPlayerCount ?? 0),
		status: (it.status ?? '').toString()
	}
}

/** GET /match/manage-list?page=1&limit=10 */
export const fetchMatchManageList = (page : number, limit : number = 10) : Promise<MatchPage> => {
	return httpGet<any>('/match/manage-list', { page: page, limit: limit }).then((r : any) => {
		// 兼容 { list, total } / { records, total } / 纯数组
		const rawList : any[] = Array.isArray(r) ? r : ((r && (r.list || r.records)) || [])
		const total : number = Number((r && r.total) ?? rawList.length)
		const out : MatchVO[] = []
		for (let i = 0; i < rawList.length; i++) {
			out.push(toMatchVO(rawList[i]))
		}
		return { list: out, total: total, page: page, limit: limit }
	})
}

/**
 * 比赛列表（服务端分页）：GET /match/list?status=P&city=&storeId=&page=1&limit=20
 * status：P=进行中 C=报名中 S=暂停 F=已结束；city 空串 = 不限城市；storeId 不传 = 不限门店
 */
export const fetchMatchList = (
	status : string,
	city : string = '',
	storeId : string = '',
	page : number = 1,
	limit : number = 20
) : Promise<MatchPage> => {
	return httpGet<any>('/match/list', {
		status: status,
		city: city,
		storeId: storeId.length > 0 ? storeId : null,
		page: page,
		limit: limit
	}).then((r : any) => {
		// 兼容纯数组 / { list, total } / { records, total } 三种返回
		const rawList : any[] = Array.isArray(r) ? r : ((r && (r.list || r.records)) || [])
		const total : number = Number((r && r.total) ?? rawList.length)
		const out : MatchVO[] = []
		for (let i = 0; i < rawList.length; i++) {
			out.push(toMatchVO(rawList[i]))
		}
		return { list: out, total: total, page: page, limit: limit }
	})
}

/** GET /match/types —— 比赛类型及对应数值 */
export const fetchMatchTypes = () : Promise<MatchTypeVO[]> => {
	return httpGet<any>('/match/types').then((r : any) => {
		const raw : any[] = Array.isArray(r) ? r : ((r && r.list) || [])
		return raw.map((it : any) => ({
			id: Number(it.id ?? 0),
			name: (it.name ?? '').toString(),
			originChips: Number(it.originChips ?? 0),
			joinAmount: Number(it.joinAmount ?? 0),
			joinTicket: Number(it.joinTicket ?? 0),
			joinMonthTicket: Number(it.joinMonthTicket ?? 0),
			joinInviteCard: Number(it.joinInviteCard ?? 0),
			userReliveCount: Number(it.userReliveCount ?? 0),
			mushReliveCount: Number(it.mushReliveCount ?? 0),
			rankOneScore: Number(it.rankOneScore ?? 0),
			rankTwoScore: Number(it.rankTwoScore ?? 0),
			rankThreeScore: Number(it.rankThreeScore ?? 0),
			rankOneTicket: Number(it.rankOneTicket ?? 0),
			rankTwoTicket: Number(it.rankTwoTicket ?? 0),
			rankThreeTicket: Number(it.rankThreeTicket ?? 0)
		}))
	})
}

/** GET /match/rule —— 比赛等级规则列表 */
export const fetchMatchRules = () : Promise<MatchRuleVO[]> => {
	return httpGet<any>('/match/rule').then((r : any) => {
		const raw : any[] = Array.isArray(r) ? r : ((r && r.list) || [])
		return raw.map((it : any) => ({
			id: Number(it.id ?? 0),
			matchLevel: Number(it.matchLevel ?? 0),
			minChips: Number(it.minChips ?? 0),
			maxChips: Number(it.maxChips ?? 0),
			preChips: Number(it.preChips ?? 0),
			duration: Number(it.duration ?? 0),
			createTime: (it.createTime ?? '').toString()
		}))
	})
}

/** 创建/更新比赛 payload（对齐后端 DTO；id 有值 = 更新） */
export type MatchSavePayload = {
	id ?: number
	storeId : number
	matchName : string
	typeId : number
	firstHalfDuration : number      // 1~6级别时间（分钟）
	secondHalfDuration : number     // 7~20级别时间（分钟）
	scheduled : number              // 0=比赛 1=预约
	currentLevel : number
	minChips : number               // 小盲注
	maxChips : number               // 大盲注
	preChips : number               // 预制分
	originChips : number            // 初始筹码
	userReliveCount : number
	mushReliveCount : number
	joinAmount : number             // 入场金额（元）
	joinTicket : number             // 入场票数
	joinMonthTicket : number
	joinInviteCard : number
	deskCount : number
	rankOneScore : number
	rankTwoScore : number
	rankThreeScore : number
	rankOneTicket : number
	rankTwoTicket : number
	rankThreeTicket : number
}

/** POST /match/create —— 创建比赛；payload 带 id 时为更新 */
export const createMatch = (payload : MatchSavePayload) : Promise<any> => {
	return httpPost('/match/create', payload)
}

/** POST /match/{id}/end —— 结束比赛 */
export const endMatch = (id : number | string) : Promise<any> => {
	return httpPost('/match/' + id + '/end', {})
}

/* ---------------- 我的战绩（/match-user） ---------------- */

/** 单场战绩 VO（GET /match-user/match-record，对应后端 UserJoinRecordVO） */
export type MatchRecordVO = {
	id : number | string          // matchId
	title : string                // matchName 赛事名
	storeName : string
	date : string                 // matchTime → yyyy-MM-dd
	rank : number                 // ranking 最终名次
	finalScore : number           // finalScore 该场积分
	win : boolean                 // 冠军
	itm : boolean                 // 进圈（前三）
}

const toNum = (v : any) : number => {
	const n = Number(v)
	return isFinite(n) ? n : 0
}

// 后端时间多为 "yyyy-MM-dd HH:mm:ss"，列表只展示日期段
const date10 = (v : any) : string => {
	const s : string = (v ?? '').toString()
	return s.length >= 10 ? s.slice(0, 10) : s
}

/** UserJoinRecordVO → MatchRecordVO */
export const fromMatchRecordVO = (it : any, i : number) : MatchRecordVO => {
	const rank : number = toNum(it ? it.ranking : 0)
	return {
		id: (it && it.matchId != null) ? it.matchId : ('r' + i),
		title: ((it ? it.matchName : '') ?? '').toString(),
		storeName: ((it ? it.storeName : '') ?? '').toString(),
		date: date10(it ? it.matchTime : ''),
		rank: rank,
		finalScore: toNum(it ? it.finalScore : 0),
		win: rank == 1,
		itm: rank > 0 && rank <= 3
	}
}

/** 战绩列表分页返回体 */
export type MatchRecordPage = {
	list : MatchRecordVO[]
	total : number
	page : number
	limit : number
}

/**
 * 战绩列表（服务端分页）：GET /match-user/match-record?timeRange=all&matchType=win&page=1&limit=20
 * timeRange：all 所有时间 / week 最近一周 / month 最近一月 / year 最近一年
 * matchType：不传 = 全部对局；win = 仅获胜；reward = 奖励圈
 */
export const fetchMatchRecords = (
	timeRange : string,
	matchType : string = '',
	page : number = 1,
	limit : number = 20
) : Promise<MatchRecordPage> => {
	return httpGet<any>('/match-user/match-record', {
		rangeType: timeRange,
		matchType: matchType.length > 0 ? matchType : null,
		page: page,
		limit: limit
	}).then((r : any) => {
		// 兼容纯数组 / { list, total } / { records, total } 三种返回
		const raw : any[] = Array.isArray(r) ? r : ((r && (r.list || r.records)) || [])
		const total : number = Number((r && r.total) ?? raw.length)
		const out : MatchRecordVO[] = []
		for (let i = 0; i < raw.length; i++) { out.push(fromMatchRecordVO(raw[i], i)) }
		return { list: out, total: total, page: page, limit: limit }
	})
}

/** 战绩总览：GET /match-user/match-summary（返回 UserRankingDTO，与排行榜同构） */
export const fetchMatchSummary = () : Promise<UserRankingDTO> => {
	return httpGet<any>('/match-user/match-summary').then((r : any) => {
		return ((r && r.userRanking) ? r.userRanking : (r || {})) as UserRankingDTO
	})
}
