import { httpGet, httpPost, httpUpload, resolveFileUrl } from './http'
import type { AdminHonorRow } from './admin-honor-data'

/** 荣誉列表 VO（来自 /honor/list） */
export type HonorVO = {
	id : number
	honorName : string
	imageUrl : string
	createTime : string
}

export type HonorPage = {
	list : HonorVO[]
	total : number
	page : number
	limit : number
}

/** HonorVO → AdminHonorRow（字段名与后端对齐，仅做类型归一化） */
export const fromHonorVO = (vo : HonorVO) : AdminHonorRow => {
	return {
		id: String(vo.id),
		name: vo.honorName,
		image: vo.imageUrl
	}
}

/** GET /honor/list?page=1&limit=10 —— 荣誉分页列表 */
export const fetchHonorList = (page : number, limit : number = 10) : Promise<HonorPage> => {
	return httpGet<any>('/honor/list', { page: page, limit: limit }).then((r : any) => {
		// 兼容 { list, total } / { records, total } / 纯数组
		const rawList : any[] = Array.isArray(r) ? r : ((r && (r.list || r.records)) || [])
		const total : number = Number((r && r.total) ?? rawList.length)
		const out : HonorVO[] = rawList.map((it : any) => ({
			id: Number(it.id ?? 0),
			honorName: (it.honorName ?? '').toString(),
			imageUrl: (it.imageUrl ?? '').toString(),
			createTime: (it.createTime ?? '').toString()
		}))
		return { list: out, total: total, page: page, limit: limit }
	})
}

/** 新增/更新荣誉 payload（对齐后端 HonorCreateRequest；id 有值 = 更新） */
export type HonorSavePayload = {
	id ?: number
	name : string
	imageUrl : string
}

/** POST /honor/create —— 创建荣誉；payload 带 id 时为更新 */
export const createHonor = (payload : HonorSavePayload) : Promise<any> => {
	return httpPost('/honor/create', payload)
}

/** POST /file/upload —— 上传荣誉背景板图片，返回图片 URL */
export const uploadHonorImage = (filePath : string) : Promise<string> => {
	return httpUpload<any>('/upload/image', filePath, 'file').then((obj : any) => {
		// 兼容 object 为字符串或 { url } / { imageUrl } 两种返回
		if (typeof obj === 'string') { return obj }
		return ((obj && (obj.url || obj.imageUrl)) || '').toString()
	})
}
