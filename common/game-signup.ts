import { fetchMatchDetailToJoin } from './match-api'
import type { MatchDetailVO, DeskPositionVO } from './match-api'

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
const SEATS_PER_TABLE : number = 10

/* ---------------- 真实接口映射（GET /match/detail-to-join/{id}） ---------------- */

// 真实桌位：deskCount 张桌 × 10 座；deskPositionList 标出已占座位（含我自己，mine 单独标记）
export const buildTables = (deskCount : number, positions : DeskPositionVO[], myUserId : string) : SignupTable[] => {
	const count : number = deskCount > 0 ? deskCount : 1
	const tables : SignupTable[] = []
	for (let t : number = 1; t <= count; t++) {
		const seats : SignupSeat[] = []
		let free : number = 0
		for (let n : number = 1; n <= SEATS_PER_TABLE; n++) {
			let taken : boolean = false
			let mine : boolean = false
			for (let i : number = 0; i < positions.length; i++) {
				const dp : DeskPositionVO = positions[i]
				if (Number(dp.deskNum) == t && Number(dp.position) == n) {
					taken = true
					mine = myUserId != '' && String(dp.userId) == myUserId
					break
				}
			}
			if (!taken) { free++ }
			seats.push({ no: n, taken: taken, mine: mine })
		}
		tables.push({ no: t, seats: seats, takenCount: SEATS_PER_TABLE - free, free: free })
	}
	return tables
}


/** 报名页数据入口：GET /match/detail-to-join/{id}；对局不存在 / 已结束返回 null */
export const fetchGameSignup = (id : string) : Promise<MatchDetailVO | null> => {
	return fetchMatchDetailToJoin(id).then((vo : MatchDetailVO | null) => {
		if (vo == null) { return null }
		return vo
	})
}
