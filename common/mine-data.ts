import type { RankPlayer } from './types'
import { SEASONS, TIERS } from './rank-data'
import { MOCK_STORES } from './mock-data'

/* ---------------- "我"基础信息 ---------------- */
// 从赛季榜里取"我"的玩家，统计字段天然与排行榜同口径；
// 这里只补 mine 页专属的字段（id、酒德、资产等），避免污染 RankPlayer
const findMe = () : RankPlayer => {
	const players : RankPlayer[] = SEASONS[0].players
	for (let i : number = 0; i < players.length; i++) {
		if (players[i].isMe) { return players[i] }
	}
	return players[0]
}

const ME : RankPlayer = findMe()

// 用户 ID：与赛季/榜字段无关，独立生成 "SS-xxxx" 形式
// 末段 4 位由名字的字符码派生，保证稳定（每次进 mine 页都一样）
const deriveUserId = (name : string) : string => {
	let n : number = 0
	for (let i : number = 0; i < name.length; i++) { n = (n * 131 + name.charCodeAt(i)) % 10000 }
	return 'SS-' + (n < 1000 ? ('0' + n) : n.toString())
}

export type MineProfile = {
	id : string
	name : string
	city : string
	isAdmin : boolean
	points : number
	tier : string
	tierLevel : number
	games : number
	wins : number
	itm : number
}

export const MINE_PROFILE : MineProfile = {
	id: deriveUserId(ME.name),
	name: ME.name,
	city: ME.city,
	isAdmin: true,                     // 演示数据：标记为管理员，让"管理后台"入口可见
	points: ME.points,
	tier: ME.tier,
	tierLevel: ME.tierLevel,
	games: ME.games,
	wins: ME.wins,
	itm: ME.itm
}

/* ---------------- 我的酒德 ---------------- */
// 酒德 = 比赛礼仪 / 守时 / 投诉率等"软指标"，独立于段位分。
// 三项指标：monthPoints（本月累积）、rank（酒德榜排名）、balance（可消费酒德币）
export type JiudeInfo = {
	monthPoints : number
	rank : number
	balance : number
}

export const JIUDE : JiudeInfo = {
	monthPoints: 184,
	rank: 32,
	balance: 2880
}

/* ---------------- 我的资产 ---------------- */
// 通用资产：跨门店通用的凭证；月票为按月重置，直通函为永久免资格
export type GlobalAsset = {
	monthTickets : number      // 月票（剩余）
	directLetters : number     // 直通函（剩余）
}

export const GLOBAL_ASSET : GlobalAsset = {
	monthTickets: 5,
	directLetters: 2
}

// 每店资产：在特定门店可用的余额与门票
// 只展示本用户在 mock 中有余额/门票的门店，避免全 9 家店都摆空卡片
// 余额按 50~1500 区间随机分布、门票 0~4 张，与战绩规模成正比（用 isMe 的 games 做种子）
const buildStoreAssets = () : StoreAsset[] => {
	const seed : number = MINE_PROFILE.games
	const list : StoreAsset[] = []
	const len : number = MOCK_STORES.length
	for (let i : number = 0; i < len; i++) {
		const s : { id : string, name : string } = MOCK_STORES[i]
		// 随机筛出 ~6 家有资产，其余不显示
		const hasAsset : boolean = ((seed * 7 + i * 13) % 5) > 0
		if (!hasAsset) { continue }
		const balance : number = 80 + ((seed * 17 + i * 53) % 1420)        // 80 ~ 1499
		const tickets : number = ((seed * 11 + i * 37) % 5)               // 0 ~ 4
		list.push({ storeId: s.id, storeName: s.name, balance: balance, tickets: tickets })
	}
	return list
}

export type StoreAsset = {
	storeId : string
	storeName : string
	balance : number
	tickets : number
}

export const STORE_ASSETS : StoreAsset[] = buildStoreAssets()

/* ---------------- 段位辅助 ---------------- */
// mine 页段位读取方式与 record.vue 一致：从 TIERS 索引拿到颜色 / 名称 / 罗马数字
export { TIERS }