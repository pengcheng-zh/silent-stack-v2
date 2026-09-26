/**
 * 报名状态（运行时内存）。
 *
 * 详情页的 joined 本来是 mock 数据按 id 派生出来的（game-detail.ts 里的 joinedOf），
 * 用户在本机走完「报名」流程后要立刻生效，所以这里再记一层"本机已报名"的覆盖状态。
 * 只存在内存里，整包重载后回到 mock 口径，和 splash-guard 的做法保持一致。
 */

// 我报名的座位：gameId 唯一；table / seat 从 1 开始，0 表示没记录
type JoinedSeat = {
	gameId : string
	table : number
	seat : number
}

const JOINED : JoinedSeat[] = []

/** 本机是否已报名（详情页计算 joined 时叠加这一层） */
export const hasJoinedOverride = (gameId : string) : boolean => {
	for (let i : number = 0; i < JOINED.length; i++) {
		if (JOINED[i].gameId == gameId) { return true }
	}
	return false
}

/** 报名成功后记录座位；同场重复报名则覆盖 */
export const markJoined = (gameId : string, table : number, seat : number) : void => {
	for (let i : number = 0; i < JOINED.length; i++) {
		if (JOINED[i].gameId == gameId) {
			JOINED[i].table = table
			JOINED[i].seat = seat
			return
		}
	}
	JOINED.push({ gameId: gameId, table: table, seat: seat })
}

/** 我在这场选的座位：[桌号, 座位号]；[0, 0] 表示没有记录 */
export const joinedSeatOf = (gameId : string) : number[] => {
	for (let i : number = 0; i < JOINED.length; i++) {
		if (JOINED[i].gameId == gameId) {
			return [JOINED[i].table, JOINED[i].seat]
		}
	}
	return [0, 0]
}
