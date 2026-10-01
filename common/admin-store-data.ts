import { MOCK_STORES } from './mock-data'
import { JIUDE_RANK_TOTAL } from './jiude-rank-data'
import type { StoreOwnerDTO } from './store-api'

/* ---------------- 人员 / 用户 ---------------- */
// 店长 / 管理员：后端 StoreOwnerDTO { userId, username, userNo }
export type StaffMember = {
	id : number | string
	name : string
	userNo ?: string
}

// 后台可搜索的用户池：复用酒德总榜 40 位玩家（含 id / 昵称 / 城市）
export type AdminUser = {
	id : string
	name : string
	city : string
}

const buildAdminUsers = () : AdminUser[] => {
	const list : AdminUser[] = []
	const len : number = JIUDE_RANK_TOTAL.length
	for (let i : number = 0; i < len; i++) {
		const p = JIUDE_RANK_TOTAL[i]
		list.push({ id: p.id, name: p.name, city: p.city })
	}
	return list
}

export const ADMIN_USERS : AdminUser[] = buildAdminUsers()

/* ---------------- 店铺管理（后台） ---------------- */
// 管理后台「店铺管理」页的数据模型，与后端 StoreVO 对齐
export type AdminStore = {
	id : number | string         // 后端必返，编辑/删除/人员管理都依赖它
	name : string
	city : string
	address : string
	latitude : string             // 后端 String
	longitude : string
	lat : number                 // 前端便利字段（parseFloat 后的纬度）
	lng : number                 // 前端便利字段（parseFloat 后的经度）
	storeType : 'silent' | 'jiude'
	status : string               // 如 'active' / 'disabled'
	currentMatchCount : number
	totalMatchCount : number
	currentPlayerCount : number
	totalPlayerCount : number
	canEdit : boolean
	canAddManager : boolean
	canAddOwner : boolean
	canViewBilling : boolean
	managers : StaffMember[]     // 对应后端 ownerList（店长）
	admins : StaffMember[]       // 对应后端 managerList（管理员）
}

/**
 * 后端 StoreVO → 前端 AdminStore 的字段映射
 * 把 StoreOwnerDTO 拆成 managers / admins，把 latitude/longitude 同时存原始字符串和 number
 */
export const fromStoreVO = (vo : any) : AdminStore => {
	const latStr = (vo.latitude ?? '').toString()
	const lngStr = (vo.longitude ?? '').toString()
	return {
		id: vo.id,
		name: (vo.name ?? '').toString(),
		city: (vo.city ?? '').toString(),
		address: (vo.address ?? '').toString(),
		latitude: latStr,
		longitude: lngStr,
		lat: latStr.length > 0 ? parseFloat(latStr) : 0,
		lng: lngStr.length > 0 ? parseFloat(lngStr) : 0,
		storeType: (vo.storeType ?? 'silent').toString() as 'silent' | 'jiude',
		status: (vo.status ?? 'active').toString().toLowerCase(),
		currentMatchCount: vo.currentMatchCount ?? 0,
		totalMatchCount: vo.totalMatchCount ?? 0,
		currentPlayerCount: vo.currentPlayerCount ?? 0,
		totalPlayerCount: vo.totalPlayerCount ?? 0,
		canEdit: vo.canEdit !== false,
		canAddManager: vo.canAddManager !== false,
		canAddOwner: vo.canAddOwner !== false,
		canViewBilling: vo.canViewBilling !== false,
		managers: fromOwnerList(vo.ownerList),
		admins: fromOwnerList(vo.managerList)
	}
}

const fromOwnerList = (list : any[] | null | undefined) : StaffMember[] => {
	if (!Array.isArray(list)) { return [] }
	const out : StaffMember[] = []
	for (let i : number = 0; i < list.length; i++) {
		const o = list[i] as StoreOwnerDTO
		out.push({
			id: o.userId,
			name: o.username,
			userNo: o.userNo
		})
	}
	return out
}

/* ---------------- 本地 mock（接口未通时兜底） ---------------- */
const CITY_COORDS : { city : string, lat : number, lng : number }[] = [
	{ city: '上海', lat: 31.2304, lng: 121.4737 },
	{ city: '苏州', lat: 31.2989, lng: 120.5853 },
	{ city: '杭州', lat: 30.2741, lng: 120.1551 },
	{ city: '南京', lat: 32.0603, lng: 118.7969 },
	{ city: '宁波', lat: 29.8683, lng: 121.5440 }
]

const coordOf = (city : string, i : number) : { lat : number, lng : number } => {
	const len : number = CITY_COORDS.length
	for (let j : number = 0; j < len; j++) {
		if (CITY_COORDS[j].city == city) {
			return {
				lat: CITY_COORDS[j].lat + ((i % 3) - 1) * 0.006,
				lng: CITY_COORDS[j].lng + ((i % 4) - 1) * 0.008
			}
		}
	}
	return { lat: 31.2304, lng: 121.4737 }
}

const pickUsers = (offset : number, count : number) : StaffMember[] => {
	const list : StaffMember[] = []
	const len : number = ADMIN_USERS.length
	for (let j : number = 0; j < count; j++) {
		const u = ADMIN_USERS[(offset + j * 5) % len]
		list.push({ id: u.id, name: u.name })
	}
	return list
}

const buildAdminStores = () : AdminStore[] => {
	const list : AdminStore[] = []
	const len : number = MOCK_STORES.length
	for (let i : number = 0; i < len; i++) {
		const s = MOCK_STORES[i]
		const c = coordOf(s.city, i)
		list.push({
			id: s.id,
			name: s.name,
			city: s.city,
			address: s.address,
			latitude: c.lat.toString(),
			longitude: c.lng.toString(),
			lat: c.lat,
			lng: c.lng,
			storeType: (i % 2 == 0 ? 'silent' : 'jiude') as 'silent' | 'jiude',
			status: 'active',
			currentMatchCount: 2 + (i % 3),
			totalMatchCount: 20 + i * 4,
			currentPlayerCount: 30 + i * 12,
			totalPlayerCount: 200 + i * 50,
			canEdit: true,
			canAddManager: true,
			canAddOwner: true,
			canViewBilling: true,
			managers: pickUsers(i, 1 + (i % 2)),
			admins: pickUsers(i + 3, 2 + (i % 3))
		})
	}
	return list
}

export const ADMIN_STORES : AdminStore[] = buildAdminStores()
