/**
 * 余额流水模块接口
 *
 * 后端契约：
 *   GET /balance/records?page=1&limit=20&startDate=&endDate=   余额变动流水（时间筛选可选）
 *   GET /balance/store-records?storeId=xx&page=1&limit=20&startDate=&endDate=   指定门店的余额流水（管理端账单页）
 *
 * assumeType：1-充值 2-消费 3-退款 4-扣减（assumeTypeName 为后端给的展示名）
 * balanceType：chips-筹码 ticket-门票（balanceTypeLabel 为展示名）
 * amount：正数增加、负数减少
 */
import { httpGet } from './http'

export type BalanceRecord = {
	id : number
	userId : number
	userNo : string
	username : string
	storeId : number
	storeName : string
	operatorId : number
	operatorName : string
	assumeType : number
	assumeTypeName : string
	balanceType : string
	balanceTypeLabel : string
	amount : number
	balanceBefore : number
	balanceAfter : number
	remark : string
	refId : number
	createTime : string
}

/** 拉取余额流水（startDate / endDate 传空串表示不限；userId > 0 时查指定用户——管理员入口） */
export const fetchBalanceRecords = (page : number, limit : number, startDate : string, endDate : string, userId : number = 0) : Promise<BalanceRecord[]> => {
	const params : Record<string, any> = { page: page, limit: limit }
	if (startDate.length > 0) { params.startDate = startDate }
	if (endDate.length > 0) { params.endDate = endDate }
	if (userId > 0) { params.userId = userId }
	return httpGet<any>('/balance/records', params).then((rows : any) => {
		// 兼容三种返回形态：数组 / { list } / { records }
		if (Array.isArray(rows)) { return rows as BalanceRecord[] }
		if (rows && Array.isArray(rows.list)) { return rows.list as BalanceRecord[] }
		if (rows && Array.isArray(rows.records)) { return rows.records as BalanceRecord[] }
		return []
	})
}

/** 拉取指定门店的余额流水：GET /balance/store-records?storeId=xx&page=1&limit=20&startDate=&endDate= */
export const fetchStoreBalanceRecords = (storeId : number | string, page : number, limit : number, startDate : string = '', endDate : string = '') : Promise<BalanceRecord[]> => {
	const params : Record<string, any> = { storeId: storeId, page: page, limit: limit }
	if (startDate.length > 0) { params.startDate = startDate }
	if (endDate.length > 0) { params.endDate = endDate }
	return httpGet<any>('/balance/store-records', params).then((rows : any) => {
		// 兼容三种返回形态：数组 / { list } / { records }
		if (Array.isArray(rows)) { return rows as BalanceRecord[] }
		if (rows && Array.isArray(rows.list)) { return rows.list as BalanceRecord[] }
		if (rows && Array.isArray(rows.records)) { return rows.records as BalanceRecord[] }
		return []
	})
}
