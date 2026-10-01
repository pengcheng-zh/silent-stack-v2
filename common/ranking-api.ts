/**
 * 排行榜接口
 *
 * 后端契约（参考）：
 *   GET /user-ranking/summary —— 我的排名信息 + 赛季/榜单类型选项 + 赛季荣誉
 *   GET /user-ranking/list    —— 榜单成员列表（服务端分页，已按榜单类型排序）
 */
import { httpGet } from './http'

/** 我的排名信息（summary.userRanking 字段） */
export type UserRankingDTO = {
	userId ?: number
	userNo ?: string
	username ?: string
	ranking ?: number                  // 我的当前排名
	rankingScore ?: number | string    // 后端 BigDecimal，序列化可能是数字或字符串
	happyScore ?: number
	winnerCount ?: number              // 胜场数
	joinMatchCount ?: number           // 参赛场次
	enterFinalCount ?: number          // 进圈（决赛圈）次数
	winnerRate ?: number | string      // 胜率
	mushReliveCount ?: number          // 蘑菇复活次数
}

/** 榜单成员（/user-ranking/list 元素，后端已按榜单类型排序） */
export type UserRankingListDTO = {
	userId ?: number
	rankingScore ?: number | string
	winnerCount ?: number
	joinMatchCount ?: number
	enterFinalCount ?: number
	winnerRate ?: number | string
	mushReliveCount ?: number
	happyScore ?: number
	username ?: string
	userNo ?: string
	avatar ?: string
	honorImageUrl ?: string
	levelName ?: string
	levelImage ?: string
}

/** 赛季选项（summary.seasonOptions 字段） */
export type StackMatchSeasonDTO = {
	id ?: number
	name ?: string
}

/** 榜单类型选项（summary.rankingTypeOptions 字段） */
export type RankingTypeDTO = {
	id ?: number
	name ?: string
}

/** 赛季前三荣誉（summary.seasonHonorList 字段） */
export type SeasonHonorVO = {
	id ?: number
	seasonId ?: number
	userId ?: number
	username ?: string
	avatar ?: string
	ranking ?: number       // 名次：1 冠军 / 2 亚军 / 3 季军
}

/** GET /user-ranking/summary 返回体 */
export type UserRankingSummaryVO = {
	userRanking ?: UserRankingDTO
	seasonOptions ?: StackMatchSeasonDTO[]
	rankingTypeOptions ?: RankingTypeDTO[]
	seasonHonorList ?: SeasonHonorVO[]
}

/** GET /user-ranking/list 分页结构 */
export type UserRankingPage = {
	list : UserRankingListDTO[]
	total : number
}

/** 排行榜汇总：GET /user-ranking/summary?seasonId=&rankingTypeId= */
export const fetchUserRankingSummary = (seasonId : string = '', rankingTypeId : string = '') : Promise<UserRankingSummaryVO> => {
	return httpGet<any>('/user-ranking/summary', { seasonId: seasonId, rankingTypeId: rankingTypeId }).then((r : any) => {
		return (r || {}) as UserRankingSummaryVO
	})
}

/** 排行榜列表（服务端分页）：GET /user-ranking/list?seasonId=&rankingTypeId=&page=&limit= */
export const fetchUserRankingList = (
	seasonId : string,
	rankingTypeId : string,
	page : number = 1,
	limit : number = 20
) : Promise<UserRankingPage> => {
	return httpGet<any>('/user-ranking/list', {
		seasonId: seasonId,
		rankingTypeId: rankingTypeId,
		page: page,
		limit: limit
	}).then((r : any) => {
		// 兼容纯数组 / { list, total } / { records, total } 三种返回
		const rawList : any[] = Array.isArray(r) ? r : ((r && (r.list || r.records)) || [])
		const total : number = Number((r && r.total) ?? rawList.length)
		return { list: rawList as UserRankingListDTO[], total: total }
	})
}
