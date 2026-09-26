/**
 * 排行榜接口
 *
 * 后端契约（参考）：
 *   GET /user-ranking/info —— 一次返回：我的排名信息 + 榜单列表 + 赛季/榜单类型选项 + 赛季荣誉
 */
import { httpGet } from './http'

/** 我的排名信息（userRanking 字段） */
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

/** 榜单成员（userListRanking 字段） */
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

/** 赛季选项（seasonOptions 字段） */
export type StackMatchSeasonDTO = {
	id ?: number
	name ?: string
}

/** 榜单类型选项（rankingTypeOptions 字段） */
export type RankingTypeDTO = {
	id ?: number
	name ?: string
}

/** 赛季前三荣誉（seasonHonorList 字段） */
export type SeasonHonorVO = {
	id ?: number
	seasonId ?: number
	userId ?: number
	username ?: string
	avatar ?: string
	ranking ?: number       // 名次：1 冠军 / 2 亚军 / 3 季军
}

/** GET /user-ranking/info 返回体 */
export type UserRankingVO = {
	userRanking ?: UserRankingDTO
	userListRanking ?: UserRankingListDTO[]
	seasonOptions ?: StackMatchSeasonDTO[]
	rankingTypeOptions ?: RankingTypeDTO[]
	seasonHonorList ?: SeasonHonorVO[]
}

/** 排行榜信息：GET /user-ranking/info?seasonId=&rankingTypeId= */
export const fetchUserRanking = (seasonId : string = '', rankingTypeId : string = '') : Promise<UserRankingVO> => {
	return httpGet<any>('/user-ranking/info', { seasonId: seasonId, rankingTypeId: rankingTypeId }).then((r : any) => {
		return (r || {}) as UserRankingVO
	})
}
