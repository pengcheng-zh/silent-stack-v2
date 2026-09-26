/* ---------------- 我的背景卡 ---------------- */
// 数据来源：GET /user-honor/my-list，返回我获得的荣誉卡列表
// defaultActive == 'A' 表示该卡当前展示中
import { httpGet, httpPost } from './http'

export type MyHonorCard = {
	id : number
	honorId : number
	name : string
	image : string
	active : boolean		// defaultActive == 'A'
}

/* ---------------- 后端行结构 ---------------- */
type UserHonorRow = {
	id : number
	userId : number
	honorId : number
	honorName : string
	imageUrl : string
	defaultActive : string
	createTime : string
}

/** 拉取我获得的荣誉卡列表（active = defaultActive == 'A'） */
export const fetchMyHonorCards = () : Promise<MyHonorCard[]> => {
	return httpGet<UserHonorRow[]>('/user-honor/my-list').then((object : any) => {
		const arr : any = object && object.list || object.list || []
		const list : MyHonorCard[] = []
		for (let i = 0; i < arr.length; i++) {
			const r = arr[i] as UserHonorRow
			list.push({
				id: r.id,
				honorId: r.honorId,
				name: r.honorName || '',
				image: r.imageUrl || '',
				active: r.defaultActive == 'A'
			})
		}
		return list
	})
}

/** 选用某张荣誉卡作为展示中（POST /user-honor/{honorId}/use） */
export const useMyHonorCard = (honorId : number) : Promise<any> => {
	return httpPost('/user-honor/' + honorId + '/use')
}

/** 取消所有展示中（POST /user-honor/unuse-all） */
export const unuseAllHonorCards = () : Promise<any> => {
	return httpPost('/user-honor/unuse-all')
}

/* ---------------- 当前展示卡的本地缓存 ---------------- */
// 供设置页"我的背景卡"标签即时显示；服务端仍以后端为准
const CARD_KEY : string = 'my_honor_card'

/** 当前选中的展示卡；未选过返回 null */
export const getMyHonorCard = () : MyHonorCard | null => {
	const v = uni.getStorageSync(CARD_KEY)
	if (!v || !v.id) { return null }
	return v as MyHonorCard
}

/** 记录当前展示的荣誉卡（card 传 null = 不使用背景卡） */
export const setMyHonorCard = (card : MyHonorCard | null) : void => {
	if (card == null) {
		uni.removeStorageSync(CARD_KEY)
		return
	}
	uni.setStorageSync(CARD_KEY, card)
}
