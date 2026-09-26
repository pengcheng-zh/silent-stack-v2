/**
 * 地图选点页数据：高德 Web 服务检索 + 选点结果回传
 *
 * Key 获取：lbs.amap.com → 控制台 → 创建应用 → 添加 Key → 类型选「Web服务」
 * ⚠️ 与 manifest.json → web → sdkConfigs → maps → amap 的「Web端(JS API)」Key 是两种类型，
 *    且 manifest 是编译期配置，运行时代码无法读取，只能在此填写
 *
 * （若在高德后台同一应用下同时绑了 JS API Key 和 Web服务 Key，两个都从高德控制台管理）
 */

/* ---------------- POI 模型 ---------------- */
export type AdminPoi = {
	city : string
	name : string
	address : string
	lat : number
	lng : number
}

/** 高德 Web 服务 Key（「Web服务」类型）：填入后搜索走真实接口 */
export const AMAP_WEB_SERVICE_KEY : string = 'b53eae26f5751ad4c98d27631f844827'

/* ---------------- 高德返回转换 ---------------- */
// poi.location 格式为 "lng,lat"；address 为空/[]" 时用省市区回落
const fromAmapPoi = (poi : any) : AdminPoi => {
	console.log('fromAmapPoi', poi)
	const loc : string[] = (poi.location || '0,0').toString().split(',')
	const region : string = (poi.pname || '').toString() + (poi.cityname || '').toString() + (poi.adname || '').toString()
	let addr : string = (poi.address || '').toString()
	if (addr.length == 0 || addr == '[]') { addr = region }
	return {
		city: (poi.cityname || '').toString(),
		name: (poi.name || '').toString(),
		address: addr.length > 0 ? addr : region,
		lat: loc.length > 1 ? parseFloat(loc[1]) : 0,
		lng: parseFloat(loc[0])
	}
}

/* ---------------- 请求公共 ---------------- */
// status != 1 时把高德的 info 透出给调用方展示
const requestPois = (
	url : string,
	cb : (pois : AdminPoi[]) => void,
	fail : (msg : string) => void
) : void => {
	if (AMAP_WEB_SERVICE_KEY.length == 0) {
		fail('未配置高德 Key：请到 lbs.amap.com 申请「Web服务」Key，填入 common/admin-location-data.ts 的 AMAP_WEB_SERVICE_KEY')
		return
	}
	uni.request({
		url: url,
		method: 'GET',
		success: (res : any) => {
			const data = res.data as any
			if (data == null || (data.status || '').toString() != '1') {
				fail('高德接口：' + (data == null ? '无返回' : (data.info || '未知错误').toString()))
				return
			}
			const pois : AdminPoi[] = []
			const list : any[] = (data.pois || []) as any[]
			for (let i : number = 0; i < list.length; i++) {
				pois.push(fromAmapPoi(list[i]))
			}
			cb(pois)
		},
		fail: (err : any) => {
			fail('网络请求失败：' + (err && err.errMsg ? err.errMsg.toString() : ''))
		}
	})
}

/* ---------------- 关键词搜索 ---------------- */
// 带坐标倾向：同名词优先返回中心点附近的结果
export const searchPoisByKeyword = (
	kw : string,
	lat : number,
	lng : number,
	cb : (pois : AdminPoi[]) => void,
	fail : (msg : string) => void
) : void => {
	const url : string = 'https://restapi.amap.com/v3/place/text?key=' + AMAP_WEB_SERVICE_KEY
		+ '&keywords=' + encodeURIComponent(kw)
		+ '&location=' + lng.toString() + ',' + lat.toString()
		+ '&offset=20&page=1&extensions=base'
	requestPois(url, cb, fail)
}

/* ---------------- 周边搜索 ---------------- */
// 空关键词：中心点 10km 内的 POI
export const searchNearbyPois = (
	lat : number,
	lng : number,
	cb : (pois : AdminPoi[]) => void,
	fail : (msg : string) => void
) : void => {
	const url : string = 'https://restapi.amap.com/v3/place/around?key=' + AMAP_WEB_SERVICE_KEY
		+ '&location=' + lng.toString() + ',' + lat.toString()
		+ '&radius=10000&offset=20&page=1&extensions=base'
	requestPois(url, cb, fail)
}

/* ---------------- 选点结果回传 ---------------- */
// 跨页回调：admin-store 跳转前注册，选点页确定时触发并自动注销
let pickCallback : ((poi : AdminPoi) => void) | null = null

export const setLocationPickCallback = (cb : (poi : AdminPoi) => void) : void => {
	pickCallback = cb
}

export const fireLocationPicked = (poi : AdminPoi) : void => {
	if (pickCallback != null) {
		pickCallback(poi)
		pickCallback = null
	}
}
