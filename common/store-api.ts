/**
 * 店铺管理接口
 *
 * 后端契约（参考）：
 *   GET  /store/list?page=1&limit=20
 *   POST /store/create       { id?, name, address, city, storeType, latitude, longitude }
 *   DELETE /store/delete?id=xxx
 */
import { httpGet, httpPost } from './http'

/* ---------------- 后端 VO ---------------- */
export type StoreOwnerDTO = {
	userId : number | string
	username : string
	userNo : string
}

/** store/list 返回的单条店铺 */
export type StoreVO = {
	id : number | string
	name : string
	city : string
	address : string
	latitude : string           // 后端用 String 存
	longitude : string
	creatorId : number | string
	storeType : string          // 'silent' | 'jiude'
	currentMatchCount : number
	totalMatchCount : number
	currentPlayerCount : number
	totalPlayerCount : number
	status : string             // 如 'active' / 'disabled'
	canEdit : boolean
	canAddManager : boolean
	canAddOwner : boolean
	canViewBilling : boolean
	ownerList : StoreOwnerDTO[]
	managerList : StoreOwnerDTO[]
}

/** store/list 分页结构 */
export type StorePageVO = {
	list : StoreVO[]
	total : number
	page : number
	limit : number
}

/** store/simple-list 返回的精简店铺（选店弹层用） */
export type SimpleStoreVO = {
	id : number | string
	name : string
	city : string
	address : string
	storeType : string          // 'silent' | 'jiude'
}

/** 酒德门店（GET /store/list?type=jiude）：仅 id / name / address 三个字段 */
export type JiudeStoreVO = {
	id : number
	name : string
	address : string
}

/** 门店实况 VO（GET /store/live-list，广场页用） */
export type LiveStoreVO = {
	id : number | string
	name : string
	city : string
	address : string
	latitude : string
	longitude : string
	storeType : string
	currentMatchCount : number      // 进行中比赛数
	totalMatchCount : number        // 累计比赛数
	currentPlayerCount : number     // 在座人数
	totalPlayerCount : number       // 累计人数
	status : string
}

/* ---------------- 请求 ---------------- */

/** 酒德门店列表：GET /store/list?type=jiude */
export const fetchJiudeStores = () : Promise<JiudeStoreVO[]> => {
	return httpGet<any>('/store/list', { type: 'jiude' }).then((r : any) => {
		// 兼容纯数组 / { list } / { records } 包装
		const rawList : any[] = Array.isArray(r) ? r : ((r && (r.list || r.records)) || [])
		return rawList as JiudeStoreVO[]
	})
}

/** 门店实况列表：GET /store/live-list */
export const fetchLiveStores = () : Promise<LiveStoreVO[]> => {
	return httpGet<any>('/store/live-list').then((r : any) => {
		// 兼容纯数组 / { list } / { records } 包装
		const rawList : any[] = Array.isArray(r) ? r : ((r && (r.list || r.records)) || [])
		const out : LiveStoreVO[] = []
		for (let i = 0; i < rawList.length; i++) {
			const it = rawList[i]
			out.push({
				id: it.id,
				name: (it.name ?? '').toString(),
				city: (it.city ?? '').toString(),
				address: (it.address ?? '').toString(),
				latitude: (it.latitude ?? '').toString(),
				longitude: (it.longitude ?? '').toString(),
				storeType: (it.storeType ?? '').toString(),
				currentMatchCount: Number(it.currentMatchCount ?? 0),
				totalMatchCount: Number(it.totalMatchCount ?? 0),
				currentPlayerCount: Number(it.currentPlayerCount ?? 0),
				totalPlayerCount: Number(it.totalPlayerCount ?? 0),
				status: (it.status ?? '').toString()
			})
		}
		return out
	})
}

/** 店铺列表（分页） */
export const fetchStores = (page : number, limit : number) : Promise<StorePageVO> => {
	return httpGet<StorePageVO>('/store/list', { page: page, limit: limit })
}

/** 店铺列表（分页） */
export const fetchManageStores = (page : number, limit : number) : Promise<StorePageVO> => {
	return httpGet<StorePageVO>('/store/manage-list', { page: page, limit: limit })
}

/** 门店账单汇总（GET /store/{storeId}/billing-summary）；BigDecimal 字段可能为 null，展示时需兜底 */
export type StoreBillingSummaryVO = {
	totalRecharge : number        // 总充值
	monthRecharge : number        // 本月充值
	todayRecharge : number        // 今日充值
	todayGiftBalance : number     // 今日赠金
	todayGiftTicket : number      // 今日赠票
}

/** GET /store/{storeId}/billing-summary —— 门店账单汇总 */
export const fetchStoreBillingSummary = (storeId : number | string) : Promise<StoreBillingSummaryVO> => {
	return httpGet<StoreBillingSummaryVO>('/store/' + storeId + '/billing-summary', {})
}

/** GET /store/simple-list?keyword=xxx&limit=10 —— 精简店铺列表（选店弹层/下拉用）；keyword/limit 可选 */
export const fetchSimpleStores = (keyword : string = '', storeType : string = '', limit : number = 50) : Promise<SimpleStoreVO[]> => {
	const params : Record<string, any> = { limit: limit }
	const kw : string = keyword.trim()
	if (kw.length > 0) { params.keyword = kw }
	if (storeType.length > 0) { params.type = storeType }
	return httpGet<any>('/store/simple-list', params).then((r : any) => {
		const raw : any[] = Array.isArray(r) ? r : ((r && (r.list || r.records)) || [])
		return raw.map((it : any) => ({
			id: it.id,
			name: (it.name ?? '').toString(),
			city: (it.city ?? '').toString(),
			address: (it.address ?? '').toString(),
			storeType: (it.storeType ?? it.type ?? '').toString()
		}))
	})
}

/** 创建店铺（id 不传） */
export const createStore = (
	name : string,
	city : string,
	address : string,
	storeType : 'silent' | 'jiude',
	latitude : string,
	longitude : string
) : Promise<any> => {
	return httpPost('/store/create', {
		name: name,
		city: city,
		address: address,
		storeType: storeType,
		latitude: latitude,
		longitude: longitude
	})
}

/** 更新店铺（id 必填） */
export const updateStore = (
	id : number | string,
	name : string,
	city : string,
	address : string,
	storeType : 'silent' | 'jiude',
	latitude : string,
	longitude : string
) : Promise<any> => {
	return httpPost('/store/create', {
		id: id,
		name: name,
		city: city,
		address: address,
		storeType: storeType,
		latitude: latitude,
		longitude: longitude
	})
}

/** 删除店铺 */
export const deleteStore = (id : number | string) : Promise<any> => {
	return httpPost('/store/' + id + '/delete', {})	
}

/** 添加店长：POST /store/{storeId}/add-owner { ownerIds: [] } */
export const addStoreOwners = (storeId : number | string, ownerIds : (number | string)[]) : Promise<any> => {
	return httpPost('/store/' + storeId + '/add-owner', { ownerIds: ownerIds })
}

/** 添加管理员：POST /store/{storeId}/add-manager { ownerIds: [] } */
export const addStoreManagers = (storeId : number | string, managerIds : (number | string)[]) : Promise<any> => {
	return httpPost('/store/' + storeId + '/add-manager', { ownerIds: managerIds })
}
