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

/** 桌位玩家（MatchDetailVO.deskPositionList 元素） */
export type DeskPositionVO = {
	deskNum : number        // 桌号
	position : number       // 座位号
	ranking : number        // 名次
	userId : number
	avatar : string
	username : string
}

/** 比赛详情 VO：GET /match/detail/{id} */
export type MatchDetailVO = {
	id : number | string
	userRole : string
	phoneBind : boolean
	storeId : number
	storeName : string
	storeAddress : string
	name : string
	type : number
	typeName : string
	currentLevel : number
	currentLevelRemainTime : string
	currentLevelRemainSeconds : number
	minChips : number
	maxChips : number
	preChips : number
	originChips : number
	scheduled : number
	startTime : string
	endTime : string
	costTime : string
	userReliveCount : number
	userRemainReliveCount : number
	mushReliveCount : number
	remainReliveCount : number
	joinAmount : number
	joinTicket : number
	joinMonthTicket : number
	joinInviteCard : number
	doubleRelive : boolean
	rankOneScore : number
	rankTwoScore : number
	rankThreeScore : number
	rankOneTicket : number
	rankTwoTicket : number
	rankThreeTicket : number
	joined : boolean
	joinedStatus : string
	joinValid : boolean
	deskCount : number
	currentPlayerCount : number
	totalPlayerCount : number
	avgChips : number
	totalChips : number
	deskPositionList : DeskPositionVO[]
	userBalance : number
	userTicket : number
	userMonthTicket : number
	userInviteCard : number
	creatorId : number
	status : string
	createTime : string
}

/** 比赛详情：GET /match/detail/{id}，未找到返回 null */
export const fetchMatchDetail = (id : string) : Promise<MatchDetailVO | null> => {
	return httpGet<any>('/match/detail/' + id).then((r : any) => {
		if (r == null) { return null }
		const rawList : any[] = Array.isArray(r.deskPositionList) ? r.deskPositionList : []
		const desks : DeskPositionVO[] = []
		for (let i = 0; i < rawList.length; i++) {
			const it = rawList[i]
			desks.push({
				deskNum: Number(it.deskNum ?? 0),
				position: Number(it.position ?? 0),
				ranking: Number(it.ranking ?? 0),
				userId: Number(it.userId ?? 0),
				avatar: (it.avatar ?? '').toString(),
				username: (it.username ?? '').toString()
			})
		}
		return {
			id: r.id,
			userRole: (r.userRole ?? '').toString(),
			phoneBind: r.phoneBind == true,
			storeId: Number(r.storeId ?? 0),
			storeName: (r.storeName ?? '').toString(),
			storeAddress: (r.storeAddress ?? '').toString(),
			name: (r.name ?? '').toString(),
			type: Number(r.type ?? 0),
			typeName: (r.typeName ?? '').toString(),
			currentLevel: Number(r.currentLevel ?? 0),
			currentLevelRemainTime: (r.currentLevelRemainTime ?? '').toString(),
			currentLevelRemainSeconds: Number(r.currentLevelRemainSeconds ?? 0),
			minChips: Number(r.minChips ?? 0),
			maxChips: Number(r.maxChips ?? 0),
			preChips: Number(r.preChips ?? 0),
			originChips: Number(r.originChips ?? 0),
			scheduled: Number(r.scheduled ?? 0),
			startTime: (r.startTime ?? '').toString(),
			endTime: (r.endTime ?? '').toString(),
			costTime: (r.costTime ?? '').toString(),
			userReliveCount: Number(r.userReliveCount ?? 0),
			userRemainReliveCount: Number(r.userRemainReliveCount ?? 0),
			mushReliveCount: Number(r.mushReliveCount ?? 0),
			remainReliveCount: Number(r.remainReliveCount ?? 0),
			joinAmount: Number(r.joinAmount ?? 0),
			joinTicket: Number(r.joinTicket ?? 0),
			joinMonthTicket: Number(r.joinMonthTicket ?? 0),
			joinInviteCard: Number(r.joinInviteCard ?? 0),
			doubleRelive: r.doubleRelive == true,
			rankOneScore: Number(r.rankOneScore ?? 0),
			rankTwoScore: Number(r.rankTwoScore ?? 0),
			rankThreeScore: Number(r.rankThreeScore ?? 0),
			rankOneTicket: Number(r.rankOneTicket ?? 0),
			rankTwoTicket: Number(r.rankTwoTicket ?? 0),
			rankThreeTicket: Number(r.rankThreeTicket ?? 0),
			joined: r.joined == true,
			joinedStatus: (r.joinedStatus ?? '').toString(),
			joinValid: r.joinValid == true,
			deskCount: Number(r.deskCount ?? 0),
			currentPlayerCount: Number(r.currentPlayerCount ?? 0),
			totalPlayerCount: Number(r.totalPlayerCount ?? 0),
			avgChips: Number(r.avgChips ?? 0),
			totalChips: Number(r.totalChips ?? 0),
			deskPositionList: desks,
			userBalance: Number(r.userBalance ?? 0),
			userTicket: Number(r.userTicket ?? 0),
			userMonthTicket: Number(r.userMonthTicket ?? 0),
			userInviteCard: Number(r.userInviteCard ?? 0),
			creatorId: Number(r.creatorId ?? 0),
			status: (r.status ?? '').toString(),
			createTime: (r.createTime ?? '').toString()
		}
	})
}

/* ---------------- 参赛用户列表（GET /match-user/{matchId}/list） ---------------- */

/** 参赛用户 VO（对应后端 MatchUserVO） */
export type MatchUserVO = {
	id : number
	matchId : number
	storeId : number
	matchName : string
	userId : number
	userNo : string
	username : string
	avatar : string
	stealth : string               // Y/N 是否隐身
	originChips : number           // 初始筹码
	currentChips : number          // 当前筹码
	deskNum : number               // 桌号
	position : number              // 座位号
	ranking : number               // 名次（0 = 未排名）
	finalScore : number            // 该场积分
	prizeTicket : number           // 奖励票
	ticket : number
	userReliveCount : number       // 个人复活次数
	mushReliveCount : number       // 蘑菇次数（公共）
	status : string                // C=未加入 E=已报名 A=已加入 D=已离桌 L=已复活 K=已踢出
	userBackgroundUrl : string
	joinMatchCount : number        // 累计参赛场次
	winnerRate : number            // 胜率
	enterFinalCount : number       // 进圈次数
	happyScore : number            // 摸鱼分
	createTime : string
}

/** 参赛用户列表：GET /match-user/{matchId}/list */
export const fetchMatchUsers = (matchId : string) : Promise<MatchUserVO[]> => {
	return httpGet<any>('/match-user/' + matchId + '/list').then((r : any) => {
		// 兼容纯数组 / { list } / { records } 三种返回
		const raw : any[] = Array.isArray(r) ? r : ((r && (r.list || r.records)) || [])
		const out : MatchUserVO[] = []
		for (let i = 0; i < raw.length; i++) {
			const it = raw[i]
			out.push({
				id: Number(it.id ?? 0),
				matchId: Number(it.matchId ?? 0),
				storeId: Number(it.storeId ?? 0),
				matchName: (it.matchName ?? '').toString(),
				userId: Number(it.userId ?? 0),
				userNo: (it.userNo ?? '').toString(),
				username: (it.username ?? '').toString(),
				avatar: (it.avatar ?? '').toString(),
				stealth: (it.stealth ?? '').toString(),
				originChips: Number(it.originChips ?? 0),
				currentChips: Number(it.currentChips ?? 0),
				deskNum: Number(it.deskNum ?? 0),
				position: Number(it.position ?? 0),
				ranking: Number(it.ranking ?? 0),
				finalScore: Number(it.finalScore ?? 0),
				prizeTicket: Number(it.prizeTicket ?? 0),
				ticket: Number(it.ticket ?? 0),
				userReliveCount: Number(it.userReliveCount ?? 0),
				mushReliveCount: Number(it.mushReliveCount ?? 0),
				status: (it.status ?? '').toString(),
				userBackgroundUrl: (it.userBackgroundUrl ?? '').toString(),
				joinMatchCount: Number(it.joinMatchCount ?? 0),
				winnerRate: Number(it.winnerRate ?? 0),
				enterFinalCount: Number(it.enterFinalCount ?? 0),
				happyScore: Number(it.happyScore ?? 0),
				createTime: (it.createTime ?? '').toString()
			})
		}
		return out
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
