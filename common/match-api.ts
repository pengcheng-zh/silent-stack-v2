import { httpGet, httpPost } from './http'
import type { UserRankingDTO } from './ranking-api'

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
	joinAmount : number
	joinTicket : number
	joinMonthTicket : number
	joinInviteCard : number
}

export type MatchPage = {
	list : MatchVO[]
	total : number
	page : number
	limit : number
}

/** 空比赛表单（创建比赛/预约时的默认值，直接是 MatchVO 结构） */
export const emptyMatchVO = (scheduled : number) : MatchVO => ({
	id: 0,
	storeId: 0,
	storeName: '',
	address: '',
	latitude: '',
	longitude: '',
	type: 0,
	typeName: '',
	deskCount: 1,
	name: '',
	scheduled: scheduled,
	startTime: '',
	currentLevel: 1,
	originChips: 10000,
	minChips: 25,
	maxChips: 50,
	preChips: 1500,
	userReliveCount: 0,
	mushReliveCount: 2,
	remainReliveCount: 0,
	firstHalfDuration: 20,
	secondHalfDuration: 30,
	rankOneScore: 200,
	rankTwoScore: 120,
	rankThreeScore: 80,
	rankOneTicket: 5,
	rankTwoTicket: 3,
	rankThreeTicket: 1,
	avgChips: 0,
	playerCount: 0,
	currentPlayerCount: 0,
	status: 'P',
	joinAmount: 200,
	joinTicket: 0,
	joinMonthTicket: 0,
	joinInviteCard: 0
})

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

/** GET /match/manage-list?page=1&limit=10 */
export const fetchMatchManageList = (page : number, limit : number = 10) : Promise<MatchPage> => {
	return httpGet<any>('/match/manage-list', { page: page, limit: limit }).then((r : any) => {
		// 兼容 { list, total } / { records, total } / 纯数组
		const rawList : any[] = Array.isArray(r) ? r : ((r && (r.list || r.records)) || [])
		const total : number = Number((r && r.total) ?? rawList.length)
		return { list: rawList as MatchVO[], total: total, page: page, limit: limit }
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
		return { list: rawList as MatchVO[], total: total, page: page, limit: limit }
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
	deskNum : number        // 桌号
	position : number       // 座位号
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

/** 比赛详情：GET /match/detail/{id}；httpGet 已解包 object 业务载荷，业务失败走 reject */
export const fetchMatchDetail = (id : string) : Promise<MatchDetailVO | null> => {
	return httpGet<any>('/match/detail/' + id).then((r : any) => {
		if (r == null) { return null }
		return r as MatchDetailVO
	})
}

/** 比赛报名详情：GET /match/detail-to-join/{id}（字段与 /match/detail/{id} 一致，带当前用户资产/报名状态） */
export const fetchMatchDetailToJoin = (id : string) : Promise<MatchDetailVO | null> => {
	return httpGet<any>('/match/detail-to-join/' + id).then((r : any) => {
		if (r == null) { return null }
		return r as MatchDetailVO
	})
}

/** 比赛报名：POST /match-user/{matchId}/join */
export const joinMatch = (matchId : string, payType : string, deskNum : number, position : number) : Promise<void> => {
	return httpPost('/match-user/' + matchId + '/join', {
		payType: payType,
		deskNum: deskNum,
		position: position
	}).then((): void => {})
}

/* ---------------- 比赛管理动作 ---------------- */
const matchAction = (path : string) : Promise<void> => {
	return httpPost(path, {}).then((): void => {})
}

/** 暂停比赛：POST /match/{id}/pause */
export const pauseMatch = (id : string) : Promise<void> => matchAction('/match/' + id + '/pause')

/** 恢复比赛：POST /match/{id}/stop-pause */
export const stopPauseMatch = (id : string) : Promise<void> => matchAction('/match/' + id + '/stop-pause')

/** 重新开始：POST /match/{id}/reset */
export const resetMatch = (id : string) : Promise<void> => matchAction('/match/' + id + '/reset')

/** 下一级别：POST /match/{matchId}/next-level */
export const matchNextLevel = (id : string) : Promise<void> => matchAction('/match/' + id + '/next-level')

/** 上一级别：POST /match/{matchId}/previous-level */
export const matchPrevLevel = (id : string) : Promise<void> => matchAction('/match/' + id + '/previous-level')

/* ---------------- 参赛用户管理动作 ---------------- */
/** 出局：POST /match-user/{matchId}/kick-out/{userId} */
export const kickOutUser = (matchId : string, userId : number) : Promise<void> => {
	return httpPost('/match-user/' + matchId + '/kick-out/' + userId, {}).then((): void => {})
}

/** 出桌：POST /match-user/{matchId}/leave-desk/{userId} */
export const leaveDesk = (matchId : string, userId : number) : Promise<void> => {
	return httpPost('/match-user/' + matchId + '/leave-desk/' + userId, {}).then((): void => {})
}

/** 回桌：POST /match-user/{matchId}/pull-back/{userId} */
export const pullBackUser = (matchId : string, userId : number) : Promise<void> => {
	return httpPost('/match-user/' + matchId + '/pull-back/' + userId, {}).then((): void => {})
}

/** 设置摸鱼分：POST /match-user/{matchId}/happy-score，body { userId, score } */
export const setHappyScore = (matchId : string, userId : number, score : number) : Promise<void> => {
	return httpPost('/match-user/' + matchId + '/happy-score', {
		userId: userId,
		score: score
	}).then((): void => {})
}

/** 蘑菇复活：POST /match-user/{matchId}/relive，body { payType, reviveCount }（reviveCount：1=1倍 / 2=2倍，payType：BALANCE / TICKET） */
export const reliveUser = (matchId : string, payType : string, reviveCount : number) : Promise<void> => {
	return httpPost('/match-user/' + matchId + '/relive', {
		payType: payType,
		reviveCount: reviveCount
	}).then((): void => {})
}

/** 结束比赛名次项（对应后端 MatchUserRankingItem） */
export type MatchUserRankingItem = {
	userId : number
	ranking : number
}

/** 结束比赛前取当前名次列表：GET /match-user/{matchId}/ranking（返回 MatchUserVO[]，异常时后端可能报错） */
export const fetchMatchRanking = (matchId : string) : Promise<MatchUserVO[]> => {
	return httpGet('/match-user/' + matchId + '/ranking').then((r : any) => {
		return Array.isArray(r) ? (r as MatchUserVO[]) : []
	})
}

/** 结束比赛并提交最终名次：POST /match/{id}/end-ranking，body { rankingList } */
export const endMatchRanking = (id : string, rankingList : MatchUserRankingItem[]) : Promise<void> => {
	return httpPost('/match/' + id + '/end-ranking', {
		rankingList: rankingList
	}).then((): void => {})
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
