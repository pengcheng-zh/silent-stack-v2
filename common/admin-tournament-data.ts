import { ADMIN_STORES } from './admin-store-data'

/* ---------------- 比赛类型枚举 ---------------- */
// 接口未加载时的兜底类型名，正式来源为 /match/types
export type TournamentType = '淘汰赛' | '快速赛' | '豪客赛' | '邀请赛' | '免费赛' | '卫星赛'

export const TOURNAMENT_TYPES : TournamentType[] = [
	'淘汰赛',
	'快速赛',
	'豪客赛',
	'邀请赛',
	'免费赛',
	'卫星赛'
]

/* ---------------- 比赛 vs 预约 ---------------- */
// 比赛 = 直接开打；预约 = 计划未来某时开打（表单里存后端的 scheduled：0=比赛 1=预约）
export type TournamentMode = 'match' | 'reservation'

/* ---------------- 状态 ---------------- */
// 进行中：展示「编辑 / 结束比赛」；已结束：不展示操作按钮，状态徽标置灰
export type TournamentStatus = 'active' | 'signup' | 'paused' | 'ended'

/* ---------------- 后台「比赛」数据模型 ---------------- */
// 字段名与后端创建/编辑 DTO、列表 VO 完全对齐，不做二次命名
export type AdminTournament = {
	id : string                     // 后端比赛 id
	storeId : string                // 比赛店铺 id
	storeName : string              // 反范式：列表展示店铺名
	matchName : string              // 比赛名称
	typeId : number                 // 比赛类型 id
	typeName : string               // 比赛类型名（展示）
	scheduled : number              // 0=比赛 1=预约
	startTime : string              // 开打/预约时间 YYYY-MM-DD HH:mm
	currentLevel : number           // 当前比赛级别
	firstHalfDuration : number      // 1~6级别时间（分钟）
	secondHalfDuration : number     // 7~20级别时间（分钟）
	originChips : number            // 初始筹码
	minChips : number               // 小盲注
	maxChips : number               // 大盲注
	preChips : number               // 预制分
	userReliveCount : number        // 个人复活次数
	mushReliveCount : number        // 共用蘑菇次数
	joinAmount : number             // 入场金额（元）
	joinTicket : number             // 入场票数（>0 支持门票入场）
	joinMonthTicket : number        // 月票（>0 支持）
	joinInviteCard : number         // 直通函（>0 支持）
	deskCount : number              // 开桌数量
	rankOneScore : number           // 第一名积分
	rankTwoScore : number           // 第二名积分
	rankThreeScore : number         // 第三名积分
	rankOneTicket : number          // 第一名门票
	rankTwoTicket : number          // 第二名门票
	rankThreeTicket : number        // 第三名门票
	status : TournamentStatus
}

/* ---------------- 种子数据 ---------------- */
// 取 ADMIN_STORES 每家店至少 1 场，共 10 场；交叉进行状态 / 类型 / 模式，弹层回填即生效
const NAMES : string[] = [
	'周末深筹赛',
	'新人欢迎赛',
	'大师邀请赛',
	'快速淘汰夜',
	'高额挑战赛',
	'月例锦标赛',
	'卫星资格赛',
	'复活狂欢夜',
	'闭门精英赛',
	'月末冲刺赛'
]

// 时间字段：相对今天 ±若干天；拼接出 YYYY-MM-DD HH:mm，避免 padStart 以兼容老 JS 引擎
const fmtDate = (base : Date, offsetDay : number, hour : number, minute : number) : string => {
	const d = new Date(base.getTime() + offsetDay * 86400000)
	const y = d.getFullYear().toString()
	const m = (d.getMonth() + 1).toString()
	const day = d.getDate().toString()
	const hh = hour.toString()
	const mm = minute.toString()
	return y + '-' + (m.length == 1 ? '0' + m : m) + '-' + (day.length == 1 ? '0' + day : day)
		+ ' ' + (hh.length == 1 ? '0' + hh : hh) + ':' + (mm.length == 1 ? '0' + mm : mm)
}

const pick = <T>(arr : T[], i : number) : T => arr[((i % arr.length) + arr.length) % arr.length]

const buildSeed = (i : number, now : Date) : AdminTournament => {
	const store = ADMIN_STORES[i % ADMIN_STORES.length]
	const t = pick<TournamentType>(TOURNAMENT_TYPES, i)
	const isReservation : boolean = i % 5 == 4
	const isEnded : boolean = i % 4 == 3
	const sb : number = 25 * (1 << (i % 4))
	const bb : number = sb * 2
	return {
		id: 't' + (i + 1).toString(),
		matchName: (isReservation ? '【预约】' : '') + pick(NAMES, i),
		storeId: String(store.id),
		storeName: store.name,
		typeId: 1 + (i % 6),
		typeName: t,
		scheduled: isReservation ? 1 : 0,
		startTime: fmtDate(now, isReservation ? 3 + i : -1 * (i + 1), 20, 0),
		currentLevel: 1 + (i % 6),
		firstHalfDuration: 20,
		secondHalfDuration: 30,
		minChips: sb,
		maxChips: bb,
		preChips: pick<number>([1000, 1500, 2000, 2500], i),
		originChips: pick<number>([8000, 10000, 15000, 20000, 25000], i),
		userReliveCount: i % 4,
		mushReliveCount: 2 + (i % 3),
		joinAmount: pick<number>([100, 200, 300, 500], i),
		joinTicket: i % 2 == 0 ? 1 : 0,
		joinMonthTicket: i % 3 == 0 ? 1 : 0,
		joinInviteCard: i % 4 == 0 ? 1 : 0,
		deskCount: 4 + (i % 5) * 2,
		rankOneScore: 200 + i * 20,
		rankTwoScore: 120 + i * 15,
		rankThreeScore: 80 + i * 10,
		rankOneTicket: 5,
		rankTwoTicket: 3,
		rankThreeTicket: 1,
		status: isEnded ? 'ended' : 'active'
	}
}

const SEED_COUNT : number = 10
export const ADMIN_TOURNAMENTS : AdminTournament[] = ((): AdminTournament[] => {
	const out : AdminTournament[] = []
	const now : Date = new Date()
	for (let i : number = 0; i < SEED_COUNT; i++) { out.push(buildSeed(i, now)) }
	return out
})()

/* ---------------- 默认空表单（创建时回填） ---------------- */
// 编辑弹层打开时按此深拷贝一份，避免污染种子
export const emptyTournament = (scheduled : number) : AdminTournament => ({
	id: '',
	storeId: '',
	storeName: '',
	matchName: '',
	typeId: 0,
	typeName: '',
	scheduled: scheduled,
	startTime: '',
	currentLevel: 1,
	firstHalfDuration: 20,
	secondHalfDuration: 30,
	originChips: 10000,
	minChips: 25,
	maxChips: 50,
	preChips: 1500,
	userReliveCount: 0,
	mushReliveCount: 2,
	joinAmount: 200,
	joinTicket: 0,
	joinMonthTicket: 0,
	joinInviteCard: 0,
	deskCount: 1,
	rankOneScore: 200,
	rankTwoScore: 120,
	rankThreeScore: 80,
	rankOneTicket: 5,
	rankTwoTicket: 3,
	rankThreeTicket: 1,
	status: 'active'
})
