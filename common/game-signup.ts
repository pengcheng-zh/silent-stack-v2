import type { GameItem, StoreInfo, GameDetail } from './types'
import { MOCK_GAMES, MOCK_STORES } from './mock-data'
import { getGameDetail, emptyGameDetail } from './game-detail'
import { GLOBAL_ASSET, STORE_ASSETS } from './mine-data'
import type { StoreAsset } from './mine-data'
import { joinedSeatOf } from './joined-store'

/* ---------------- 类型 ---------------- */

// 座位：taken = 已被别人占（不可选），mine = 我报名时锁定的座位
export type SignupSeat = {
	no : number
	taken : boolean
	mine : boolean
}

// 一张牌桌：固定 10 个座位（荷官位不在 seats 里，由页面画在桌上方）
export type SignupTable = {
	no : number
	seats : SignupSeat[]
	takenCount : number
	free : number
}

// 我的资产项（门票 / 月票 / 直通函 / 余额）
export type SignupAsset = {
	key : string
	name : string
	value : string
	unit : string
	color : string
	empty : boolean
}

// 支付方式：available = false 时前端展示 reason，点了给提示而不是静默失效
export type PayMethod = {
	key : string
	name : string
	desc : string
	available : boolean
	reason : string
	color : string
}

export type GameSignupInfo = {
	game : GameItem
	type : string
	city : string
	address : string
	fee : number
	entrants : number
	alive : number
	joined : boolean
	rebuyCount : number
	mushroomTotal : number
	mushroomLeft : number
	levelLabel : string
	smallBlind : number
	bigBlind : number
	tables : SignupTable[]
	assets : SignupAsset[]
	payMethods : PayMethod[]
}

const SEATS_PER_TABLE : number = 10

const EMPTY_GAME : GameItem = {
	id: '', storeId: '', storeName: '', city: '', title: '',
	players: 0, maxPlayers: 0, startChips: 0, level: '', status: '',
	startTime: '', buyIn: 0
}

// 页面在拿到 id 之前需要安全占位，避免模板里到处判空
export const emptyGameSignup = () : GameSignupInfo => {
	return {
		game: EMPTY_GAME,
		type: '',
		city: '',
		address: '',
		fee: 0,
		entrants: 0,
		alive: 0,
		joined: false,
		rebuyCount: 0,
		mushroomTotal: 0,
		mushroomLeft: 0,
		levelLabel: '',
		smallBlind: 0,
		bigBlind: 0,
		tables: [],
		assets: [],
		payMethods: []
	}
}

/* ---------------- 基础工具 ---------------- */

const seedOf = (s : string) : number => {
	let n : number = 0
	for (let i : number = 0; i < s.length; i++) {
		n = n + s.charCodeAt(i)
	}
	return n
}

// 线性同余伪随机：同一 seed 结果稳定，避免每次进页面座位占用都在跳
const rand = (n : number) : number => {
	const x : number = (n * 9301 + 49297) % 233280
	return x / 233280
}

const has = (arr : number[], v : number) : boolean => {
	for (let i : number = 0; i < arr.length; i++) {
		if (arr[i] == v) { return true }
	}
	return false
}

const findGame = (id : string) : GameItem | null => {
	for (let i : number = 0; i < MOCK_GAMES.length; i++) {
		if (MOCK_GAMES[i].id == id) { return MOCK_GAMES[i] }
	}
	return null
}

const findStore = (storeId : string) : StoreInfo | null => {
	for (let i : number = 0; i < MOCK_STORES.length; i++) {
		if (MOCK_STORES[i].id == storeId) { return MOCK_STORES[i] }
	}
	return null
}

// 每店资产只有部分门店有记录（mine 页同口径），没有记录的门店按 0 处理
const storeAssetValueOf = (storeId : string, wantTicket : boolean) : number => {
	for (let i : number = 0; i < STORE_ASSETS.length; i++) {
		const a : StoreAsset = STORE_ASSETS[i]
		if (a.storeId == storeId) {
			return wantTicket ? a.tickets : a.balance
		}
	}
	return 0
}

// "Lv.6 400/800" → "Lv.6"；现金桌原样返回
const levelOf = (level : string) : string => {
	const parts : string[] = level.split(' ')
	return parts.length > 0 ? parts[0] : level
}

/* ---------------- 座位 ---------------- */

// 一桌的占用：用 seed 派生 taken 个不重复座位号；我的座位永远留出来（不算被占）
const buildTable = (seed : number, tableIdx : number, taken : number, mySeatNo : number) : SignupTable => {
	const picked : number[] = []
	let cursor : number = seed + tableIdx * 977 + 13
	let guard : number = 0
	while (picked.length < taken && guard < 200) {
		guard++
		const no : number = 1 + Math.floor(rand(cursor) * SEATS_PER_TABLE)
		cursor = cursor + 137
		if (no != mySeatNo && !has(picked, no)) { picked.push(no) }
	}

	const seats : SignupSeat[] = []
	let free : number = 0
	for (let n : number = 1; n <= SEATS_PER_TABLE; n++) {
		const mine : boolean = n == mySeatNo
		const isTaken : boolean = !mine && has(picked, n)
		if (!mine && !isTaken) { free++ }
		seats.push({ no: n, taken: isTaken, mine: mine })
	}
	return { no: tableIdx + 1, seats: seats, takenCount: picked.length, free: free }
}

/* ---------------- 对外入口 ---------------- */

export const getGameSignup = (id : string) : GameSignupInfo | null => {
	const game : GameItem | null = findGame(id)
	if (game == null) { return null }

	const detail : GameDetail | null = getGameDetail(id)
	const d : GameDetail = detail == null ? emptyGameDetail() : detail
	const store : StoreInfo | null = findStore(game.storeId)
	const seed : number = seedOf(game.id)
	const fee : number = game.level == '现金桌' ? 0 : game.buyIn

	// ---- 开桌：10 人一桌，容量超过 18 人的场次就是两桌（与 plaza 的 maxPlayers 口径一致）----
	const tableCount : number = game.maxPlayers > 18 ? 2 : 1
	const capacity : number = tableCount * SEATS_PER_TABLE
	// 至少留 2 个空位，否则本页没有可选座位（已满员的场次不会从详情页进来）
	let takenTotal : number = game.players
	if (takenTotal > capacity - 2) { takenTotal = capacity - 2 }
	if (takenTotal < 0) { takenTotal = 0 }

	const mySeat : number[] = joinedSeatOf(game.id)
	const tables : SignupTable[] = []
	let left : number = takenTotal
	for (let t : number = 0; t < tableCount; t++) {
		const mineNo : number = mySeat[0] == t + 1 ? mySeat[1] : 0
		let take : number = left > SEATS_PER_TABLE ? SEATS_PER_TABLE : left
		// 我的座位要占掉一格，否则会和我自己"被占"的座位冲突
		if (mineNo > 0 && take > SEATS_PER_TABLE - 1) { take = SEATS_PER_TABLE - 1 }
		left = left - take
		tables.push(buildTable(seed, t, take, mineNo))
	}

	// ---- 我的资产：门票按门店、月票/直通函跨门店通用（与 mine 页资产口径一致）----
	const storeTickets : number = storeAssetValueOf(game.storeId, true)
	const monthTickets : number = GLOBAL_ASSET.monthTickets
	const directLetters : number = GLOBAL_ASSET.directLetters
	let balance : number = storeAssetValueOf(game.storeId, false)

	// ---- 入场方式：与后台比赛模型（ticketOn / monthlyOn / directOn）同口径 ----
	const allowTicket : boolean = seed % 2 == 0
	const allowMonthly : boolean = seed % 3 == 0
	const allowDirect : boolean = seed % 4 == 0

	// 三种券都用不了时把余额补足，避免演示时走进"无可用支付方式"的死路；
	// 真实业务这里应该引导去充值，本页只保证流程能走通
	const voucherUsable : boolean = (allowTicket && storeTickets > 0)
		|| (allowMonthly && monthTickets > 0)
		|| (allowDirect && directLetters > 0)
	if (fee > 0 && !voucherUsable && balance < fee) {
		balance = fee + 100 + seed % 400
	}

	const payMethods : PayMethod[] = [
		{
			key: 'ticket',
			name: '比赛门票',
			desc: '消耗门票 ×1（剩 ' + storeTickets + ' 张）',
			available: allowTicket && storeTickets > 0,
			reason: allowTicket ? '门票不足，先去酒德存一张' : '本场不支持门票入场',
			color: '#7AB6F2'
		},
		{
			key: 'monthly',
			name: '比赛月票',
			desc: '消耗月票 ×1（剩 ' + monthTickets + ' 张）',
			available: allowMonthly && monthTickets > 0,
			reason: allowMonthly ? '月票不足' : '本场不支持月票入场',
			color: '#2AA97A'
		},
		{
			key: 'direct',
			name: '比赛直通函',
			desc: '消耗直通函 ×1（剩 ' + directLetters + ' 张）',
			available: allowDirect && directLetters > 0,
			reason: allowDirect ? '直通函不足' : '本场不支持直通函入场',
			color: '#B07AE8'
		},
		{
			key: 'balance',
			name: '门店余额',
			desc: fee > 0 ? ('扣款 ¥' + fee + '（余额 ¥' + balance + '）') : '本场免报名费',
			available: balance >= fee,
			reason: '余额不足，还差 ¥' + (fee - balance),
			color: '#E8C275'
		}
	]

	const assets : SignupAsset[] = [
		{ key: 'ticket', name: '门票', value: storeTickets.toString(), unit: '张', color: '#7AB6F2', empty: storeTickets <= 0 },
		{ key: 'monthly', name: '月票', value: monthTickets.toString(), unit: '张', color: '#2AA97A', empty: monthTickets <= 0 },
		{ key: 'direct', name: '直通函', value: directLetters.toString(), unit: '张', color: '#B07AE8', empty: directLetters <= 0 },
		{ key: 'balance', name: '余额', value: balance.toString(), unit: '元', color: '#E8C275', empty: balance <= 0 }
	]

	// ---- 复活 / 蘑菇：蘑菇"剩余" = 共用总数 - 已用 ----
	const mushroomTotal : number = 2 + seed % 3
	const mushroomLeft : number = mushroomTotal - seed % (mushroomTotal + 1)

	return {
		game: game,
		type: d.type,
		city: store == null ? game.city : store.city,
		address: store == null ? '' : store.address,
		fee: fee,
		entrants: d.entrants,
		alive: d.alive,
		joined: d.joined,
		rebuyCount: seed % 4,
		mushroomTotal: mushroomTotal,
		mushroomLeft: mushroomLeft,
		levelLabel: levelOf(game.level),
		smallBlind: d.smallBlind,
		bigBlind: d.bigBlind,
		tables: tables,
		assets: assets,
		payMethods: payMethods
	}
}
