import { httpGet } from './http'

/** 公告 VO（来自 /announcement/list） */
export type AnnouncementVO = {
	id : number
	title : string
	content : string
	status : string          // 后端状态串（如 A）
	createTime : string
}

/** 页面行结构：status 归一为 on/off；date 为发布时间标签 */
export type AnnouncementRow = {
	id : string
	title : string
	content : string
	status : string          // 'on' 发布中 / 'off' 已停止
	date : string
}

// 后端状态串归一：A / ON / 1 / Y 视为发布中，其余视为已停止
const normalizeStatus = (s : string) : string => {
	const v : string = (s || '').toString().toUpperCase()
	return (v == 'A' || v == 'ON' || v == '1' || v == 'Y' || v == 'T') ? 'on' : 'off'
}

// '2026-09-18 14:30:00' → '09-18 14:30'（截 月-日 时:分）
const fmtDate = (t : string) : string => {
	const s : string = (t || '').toString()
	return s.length >= 16 ? s.substring(5, 16) : s
}

/** GET /announcement/list?page=1&limit=20 —— 公告分页列表 */
export const fetchAnnouncementList = (page : number, limit : number = 20) : Promise<AnnouncementRow[]> => {
	return httpGet<any>('/announcement/list', { page: page, limit: limit }).then((r : any) => {
		// 兼容 { list } / { records } / 纯数组
		const rawList : any[] = Array.isArray(r) ? r : ((r && (r.list || r.records)) || [])
		return rawList.map((it : any) : AnnouncementRow => ({
			id: String(it.id ?? ''),
			title: (it.title ?? '').toString(),
			content: (it.content ?? '').toString(),
			status: normalizeStatus((it.status ?? '').toString()),
			date: fmtDate((it.createTime ?? '').toString())
		}))
	})
}

/** 发布/更新公告 payload（对齐后端 AnnouncementCreateRequest；id 有值 = 更新） */
export type AnnouncementSavePayload = {
	id ?: number
	title : string                   // 3~100 字
	content : string                 // 2~1000 字
}

/** POST /announcement/create —— 发布公告；payload 带 id 时为更新 */
export const createAnnouncement = (payload : AnnouncementSavePayload) : Promise<any> => {
	return httpPost('/announcement/create', payload)
}
