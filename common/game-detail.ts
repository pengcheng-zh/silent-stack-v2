import type { GameItem, GameDetail, PlayerInfo } from './types'
import type { MatchDetailVO, MatchUserVO } from './match-api'
import { resolveFileUrl } from './http'
import { MOCK_GAMES } from './mock-data'
import { hasJoinedOverride } from './joined-store'

// 昵称池：按对局 id 派生取用，保证同一场对局每次进入看到的名单与筹码都一致
const PLAYER_NAMES : string[] = [
	'静默阿飞', '老K不落', '河牌之王', '陈默', 'All-in 老王',
	'梅花三', '南风过境', '跟注侠', '九筒', '深水炸弹',
	'半山腰', '短码老李', 'Poker Face', '三炮', '慢打阿甘',
	'红桃七', '夜行者', '铁头娃', '沉默的鱼', '一炮而红',
	'德州老张', '空城', '冷面杀手', '小盲注', '翻牌前弃牌',
	'黑桃A', '浪里白条', '顺子猎人', '孤注一掷', '橙子汽水'
]

// 已淘汰玩家单独用一组昵称，避免和存活名单大面积撞名
const BUSTED_NAMES : string[] = [
	'过牌侠', '追花的人', '盲注王', '小丑牌', '坚果控',
	'弃牌大师', '葫芦娃', '听牌老刘', '加注狂魔', '稳健派',
	'诈唬王', '数学帝', '位置论者', '读牌人', '下风期',
	'上头了', '短筹快打', '慢速赛专家', '翻倍或出局', '最后一颗子弹'
]

const CHIP_STEP : number = 100

const EMPTY_GAME : GameItem = {
	id: '', storeId: '', storeName: '', city: '', title: '',
	players: 0, maxPlayers: 0, startChips: 0, level: '', status: '',
	startTime: '', buyIn: 0
}

// 详情页在拿到 id 之前需要一个安全的占位，避免模板里到处判空
export const emptyGameDetail = () : GameDetail => {
	return {
		game: EMPTY_GAME,
		type: '',
		entrants: 0,
		alive: 0,
		busted: 0,
		joined: false,
		joinValid: false,
		myState: '',
		myChips: 0,
		myRank: 0,
		smallBlind: 0,
		bigBlind: 0,
		avgChips: 0,
		totalChips: 0,
		creatorId: 0,
		players: []
	}
}

const seedOf = (s : string) : number => {
	let n : number = 0
	for (let i : number = 0; i < s.length; i++) {
		n = n + s.charCodeAt(i)
	}
	return n
}

// 线性同余伪随机：同一 seed 结果稳定，避免每次进页面数据都在跳
const rand = (n : number) : number => {
	const x : number = (n * 9301 + 49297) % 233280
	return x / 233280
}

// "400" / "2k" / "1.2k" / "1.5k" → 数字
const parseChip = (raw : string) : number => {
	const lower : string = raw.trim().toLowerCase()
	if (lower == '') { return 0 }
	if (lower.indexOf('k') >= 0) {
		const n : number = parseFloat(lower.replace('k', ''))
		if (isNaN(n)) { return 0 }
		return Math.round(n * 1000)
	}
	const v : number = parseInt(lower)
	return isNaN(v) ? 0 : v
}

// level 形如 "Lv.6 400/800"、"Lv.10 2k/4k"，取末段拆分盲注
const parseBlinds = (level : string) : number[] => {
	const out : number[] = [0, 0]
	const parts : string[] = level.split(' ')
	if (parts.length < 2) { return out }
	const pair : string[] = parts[parts.length - 1].split('/')
	if (pair.length == 2) {
		out[0] = parseChip(pair[0])
		out[1] = parseChip(pair[1])
	}
	return out
}

// 现金桌没有 level，盲注写在标题里，形如 "现金桌 · 2/5 NLH"
const parseCashBlinds = (title : string) : number[] => {
	const out : number[] = [0, 0]
	const segs : string[] = title.split('·')
	if (segs.length < 2) { return out }
	const tail : string = segs[segs.length - 1].trim()
	const words : string[] = tail.split(' ')
	if (words.length == 0) { return out }
	const pair : string[] = words[0].split('/')
	if (pair.length == 2) {
		out[0] = parseChip(pair[0])
		out[1] = parseChip(pair[1])
	}
	return out
}

// 比赛类型：mock 数据没有独立字段，从标题与级别里归纳，规则命中即返回
const gameTypeOf = (g : GameItem) : string => {
	if (g.level == '现金桌') { return '现金桌' }
	const t : string = g.title
	if (t.indexOf('卫星赛') >= 0) { return '卫星赛' }
	if (t.indexOf('资格赛') >= 0 || t.indexOf('门票赛') >= 0) { return '资格赛' }
	if (t.indexOf('猎人') >= 0 || t.indexOf('Bounty') >= 0 || t.indexOf('Mystery') >= 0) { return '赏金赛' }
	if (t.indexOf('Turbo') >= 0 || t.indexOf('涡轮') >= 0 || t.indexOf('快速') >= 0) { return '快速赛' }
	if (t.indexOf('奥马哈') >= 0 || t.indexOf('OML') >= 0) { return '奥马哈' }
	if (t.indexOf('短牌') >= 0) { return '短牌' }
	if (t.indexOf('深筹') >= 0 || t.indexOf('深码') >= 0) { return '深筹码赛' }
	if (t.indexOf('双打') >= 0) { return '双人赛' }
	if (t.indexOf('女性') >= 0) { return '女性专场' }
	if (t.indexOf('新手') >= 0 || t.indexOf('入门') >= 0) { return '新手局' }
	if (t.indexOf('6-Max') >= 0 || t.indexOf('8-Max') >= 0) { return '常规赛' }
	return '标准锦标赛'
}

const findGame = (id : string) : GameItem | null => {
	for (let i : number = 0; i < MOCK_GAMES.length; i++) {
		if (MOCK_GAMES[i].id == id) { return MOCK_GAMES[i] }
	}
	return null
}

// 是否参赛：由 id 派生，保证同一场对局的状态稳定
const joinedOf = (g : GameItem, seed : number) : boolean => {
	if (g.level == '现金桌') { return seed % 2 == 0 }
	if (g.status == '进行中' || g.status == '已满员') { return seed % 3 != 0 }
	return seed % 2 == 0
}

const myStateOf = (g : GameItem, joined : boolean) : string => {
	if (!joined) {
		if (g.status == '进行中') { return '未参赛' }
		if (g.status == '已满员') { return '未报名' }
		if (g.status == '报名中') { return '可报名' }
		return '未报名'
	}
	if (g.status == '进行中') { return '在局中' }
	if (g.status == '已满员') { return '候补中' }
	if (g.status == '报名中') { return '已报名' }
	return '已报名'
}

// 筹码降序即名次，淘汰玩家筹码为 0 会自然落到末尾
const sortByChipsDesc = (list : PlayerInfo[]) : void => {
	for (let i : number = 0; i < list.length; i++) {
		let maxIdx : number = i
		for (let j : number = i + 1; j < list.length; j++) {
			if (list[j].chips > list[maxIdx].chips) { maxIdx = j }
		}
		if (maxIdx != i) {
			const tmp : PlayerInfo = list[i]
			list[i] = list[maxIdx]
			list[maxIdx] = tmp
		}
	}
}

export const getGameDetail = (id : string) : GameDetail | null => {
	const found : GameItem | null = findGame(id)
	if (found == null) { return null }
	const game : GameItem = found
	const seed : number = seedOf(game.id)

	// ---- 人数：进行中的对局才有淘汰，现金桌不淘汰 ----
	const entrants : number = game.players
	let busted : number = 0
	if (game.status == '进行中' && game.level != '现金桌') {
		const maxOut : number = Math.floor(entrants / 3)
		if (maxOut > 0) { busted = seed % (maxOut + 1) }
	}
	let alive : number = entrants - busted
	if (alive < 2) { alive = entrants > 1 ? 2 : entrants }

	// ---- 筹码守恒：总筹码 = 起始筹码 × 参赛人数，平均筹码按存活人数摊 ----
	const totalChips : number = game.startChips * entrants
	const avgChips : number = alive > 0 ? Math.round(totalChips / alive / CHIP_STEP) * CHIP_STEP : 0

	// ---- 盲注 ----
	let blinds : number[] = parseBlinds(game.level)
	if (blinds[1] == 0) { blinds = parseCashBlinds(game.title) }

	// ---- 参赛玩家 ----
	// 本机刚走完报名流程的场次直接算已参赛（joined-store 是内存覆盖层）
	const joined : boolean = joinedOf(game, seed) || hasJoinedOverride(game.id)
	const myIdx : number = alive > 0 ? seed % alive : -1

	const weights : number[] = []
	let weightSum : number = 0
	for (let i : number = 0; i < alive; i++) {
		const w : number = 0.5 + rand(seed + i * 13) * 1.5
		weights.push(w)
		weightSum = weightSum + w
	}

	const players : PlayerInfo[] = []
	// 桌号：每 9 人一桌（标准 9-Max），桌数向上取整；cash 桌同理
	const tableCount : number = alive > 0 ? Math.ceil(alive / 9) : 0
	for (let i : number = 0; i < alive; i++) {
		let chips : number = weightSum > 0
			? Math.round(totalChips * weights[i] / weightSum / CHIP_STEP) * CHIP_STEP
			: CHIP_STEP
		if (chips <= 0) { chips = CHIP_STEP }
		players.push({
			rank: 0,
			name: PLAYER_NAMES[(seed + i * 7) % PLAYER_NAMES.length],
			avatar: '',
			chips: chips,
			alive: true,
			isMe: joined && i == myIdx,
			// 买入次数：1 次为主，少数玩家有 1 次重购（1 + 0/1）
			buyIns: 1 + (rand(seed + i * 31) > 0.7 ? 1 : 0),
			// 摸鱼分：0 ~ 59 的现场软指标
			fishScore: Math.floor(rand(seed + i * 47) * 60),
			tableNo: 1 + (i % tableCount),
			seatNo: 1 + ((seed + i * 5) % 9),
			offTable: false,
			userStatus: 'A'
		})
	}
	for (let i : number = 0; i < busted; i++) {
		players.push({
			rank: 0,
			name: BUSTED_NAMES[(seed + i * 3) % BUSTED_NAMES.length],
			avatar: '',
			chips: 0,
			alive: false,
			isMe: false,
			// 淘汰玩家通常重购过更多次才会离场
			buyIns: 1 + Math.floor(rand(seed + i * 53) * 3),
			fishScore: Math.floor(rand(seed + i * 61) * 40),
			// 出局后不再占桌
			tableNo: 0,
			seatNo: 0,
			offTable: false,
			userStatus: 'K'
		})
	}

	sortByChipsDesc(players)

	let myChips : number = 0
	let myRank : number = 0
	for (let i : number = 0; i < players.length; i++) {
		players[i].rank = i + 1
		if (players[i].isMe) {
			myChips = players[i].chips
			myRank = players[i].rank
		}
	}

	return {
		game: game,
		type: gameTypeOf(game),
		entrants: entrants,
		alive: alive,
		busted: busted,
		joined: joined,
		joinValid: !joined,
		myState: myStateOf(game, joined),
		myChips: myChips,
		myRank: myRank,
		smallBlind: blinds[0],
		bigBlind: blinds[1],
		avgChips: avgChips,
		totalChips: totalChips,
		creatorId: 0,
		players: players
	}
}

/* ---------------- 真实接口映射（GET /match/detail/{id}） ---------------- */

// 状态码 → 中文（与广场列表一致）
const statusLabelOf = (code : string) : string => {
	if (code == 'P') { return '进行中' }
	if (code == 'C') { return '报名中' }
	if (code == 'S') { return '已暂停' }
	if (code == 'F') { return '已结束' }
	return '进行中'
}

// "yyyy-MM-dd HH:mm:ss" → "MM-DD HH:mm"
const formatStart = (v : string) : string => {
	return v.length >= 16 ? v.slice(5, 16) : v
}

// 我的状态文案：结合 joined / joinValid / 比赛状态
const myStateOfVo = (vo : MatchDetailVO) : string => {
	if (vo.joined) {
		if (vo.status == 'P') { return '在局中' }
		return '已报名'
	}
	if (vo.joinValid && vo.status == 'C') { return '可报名' }
	if (vo.status == 'P') { return '未参赛' }
	return '未报名'
}

/**
 * MatchUserVO[] → PlayerInfo[]（参赛用户列表 → 详情页玩家行）
 * 状态映射：A=已加入 / L=已复活（在局）；D=已离桌（出桌，可回桌）；K=已踢出（淘汰）；E=已报名 / C=未加入（待入座）
 * 排序：ranking 升序（0 = 未排名放最后），同名次保持接口顺序
 */
export const mapMatchUsers = (users : MatchUserVO[], myUserId : string) : PlayerInfo[] => {
	const list : MatchUserVO[] = users.slice()
	for (let i : number = 0; i < list.length; i++) {
		let minIdx : number = i
		for (let j : number = i + 1; j < list.length; j++) {
			const a : number = list[j].ranking > 0 ? list[j].ranking : 999999
			const b : number = list[minIdx].ranking > 0 ? list[minIdx].ranking : 999999
			if (a < b) { minIdx = j }
		}
		if (minIdx != i) {
			const tmp : MatchUserVO = list[i]
			list[i] = list[minIdx]
			list[minIdx] = tmp
		}
	}

	const players : PlayerInfo[] = []
	for (let i : number = 0; i < list.length; i++) {
		const it : MatchUserVO = list[i]
		players.push({
			rank: i + 1,
			name: it.username,
			avatar: resolveFileUrl(it.avatar),
			chips: it.currentChips,
			// 只有踢出（K）才算彻底出局；离桌（D）可回桌 / 可复活
			alive: it.status != 'K',
			isMe: myUserId != '' && String(it.userId) == myUserId,
			// 接口暂无逐人买入次数字段，填 1
			buyIns: 1,
			fishScore: it.happyScore,
			tableNo: it.deskNum,
			seatNo: it.position,
			offTable: it.status == 'D',
			userStatus: it.status
		})
	}
	return players
}

/**
 * MatchDetailVO + 参赛用户列表 → 详情页展示结构 GameDetail
 * 玩家列表来自 /match-user/{id}/list（见 mapMatchUsers）；
 * detail 的人数统计缺失时用用户列表长度兜底
 */
export const mapMatchDetail = (vo : MatchDetailVO, myUserId : string, users : MatchUserVO[] = []) : GameDetail => {
	const players : PlayerInfo[] = mapMatchUsers(users, myUserId)
	const entrants : number = vo.totalPlayerCount > 0 ? vo.totalPlayerCount : players.length
	let aliveFromList : number = 0
	for (let i : number = 0; i < players.length; i++) {
		if (players[i].alive) { aliveFromList = aliveFromList + 1 }
	}
	const alive : number = vo.currentPlayerCount > 0 ? vo.currentPlayerCount : aliveFromList
	const busted : number = entrants > alive ? entrants - alive : 0

	// "我"的名次 / 筹码：从玩家列表取（ranking 有值时 rank 序号即真实名次）
	let myRank : number = 0
	let myChips : number = 0
	for (let i : number = 0; i < players.length; i++) {
		if (players[i].isMe) {
			if (myRank == 0) { myRank = players[i].rank }
			myChips = players[i].chips
			break
		}
	}

	return {
		game: {
			id: String(vo.id),
			storeId: String(vo.storeId),
			storeName: vo.storeName,
			city: '',
			title: vo.name,
			players: vo.currentPlayerCount,
			maxPlayers: vo.totalPlayerCount,
			startChips: vo.originChips,
			level: 'Lv.' + vo.currentLevel,
			status: statusLabelOf(vo.status),
			startTime: formatStart(vo.startTime),
			buyIn: vo.joinAmount
		},
		type: vo.typeName,
		entrants: entrants,
		alive: alive,
		busted: busted,
		joined: vo.joined,
		joinValid: vo.joinValid,
		myState: myStateOfVo(vo),
		myChips: myChips,
		myRank: myRank,
		smallBlind: vo.minChips,
		bigBlind: vo.maxChips,
		avgChips: vo.avgChips,
		totalChips: vo.totalChips,
		creatorId: vo.creatorId,
		players: players
	}
}
