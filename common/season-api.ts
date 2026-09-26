import { httpGet, httpPost } from './http'
import type { AdminSeasonRow } from './admin-season-data'

/** 赛季管理列表 VO（来自 /match-season/list） */
export type SeasonVO = {
	id : number
	name : string
	startTime : string              // YYYY-MM-DD HH:mm:ss
	endTime : string                // YYYY-MM-DD HH:mm:ss
	status : string                 // A=进行中
	createTime : string
}

/** GET /match-season/list —— 赛季列表（VO → AdminSeasonRow，日期截取到 YYYY-MM-DD） */
export const fetchSeasonList = () : Promise<AdminSeasonRow[]> => {
	return httpGet<any>('/match-season/list').then((r : any) => {
		// 兼容纯数组 / { list } / { records } 三种返回结构
		const raw : any[] = Array.isArray(r) ? r : ((r && (r.list || r.records)) || [])
		return raw.map((it : any) => ({
			id: String(it.id ?? ''),
			name: (it.name ?? '').toString(),
			start: (it.startTime ?? '').toString().substring(0, 10),
			end: (it.endTime ?? '').toString().substring(0, 10)
		}))
	})
}

/** 创建/更新赛季 payload（对齐后端 DTO；id 有值 = 更新） */
export type SeasonSavePayload = {
	id ?: number
	name : string                   // 2~10 字
	startTime : string              // YYYY-MM-DD 00:00:00
	endTime : string                // YYYY-MM-DD 00:00:00
}

/** POST /match-season/create —— 创建赛季；payload 带 id 时为更新 */
export const createSeason = (payload : SeasonSavePayload) : Promise<any> => {
	return httpPost('/match-season/create', payload)
}
