/**
 * 天地图 JS API 4.0 轻封装（仅 H5 平台使用）
 *
 * 使用前必须填入浏览器端 key（tk）：
 *   1. 打开天地图控制台 https://console.tianditu.gov.cn/
 *   2. 创建「浏览器端」应用，把当前访问域名加入白名单
 *   3. 复制 tk 填入下方 TIANDITU_TK 常量
 */

/** 天地图浏览器端 key（tk）——必填，否则底图无法加载（瓦片返回 403/白屏） */
export const TIANDITU_TK : string = '41033202abe4fd809b4d3178ea7216d8'

const TDT_API : string = 'https://api.tianditu.gov.cn/api?v=4.0&tk=' + TIANDITU_TK

/** 地图上按城市聚合的一个标记点 */
export type TdtCity = {
	name : string
	lng : number
	lat : number
	count : number        // 门店数
	openGames : number    // 进行中对局数
	storeType : string    // 'silent' | 'jiude'，决定标记颜色
}

let loadPromise : Promise<any> | null = null

/** 动态加载天地图 JS API；重复调用复用同一个 Promise */
export const loadTianditu = () : Promise<any> => {
	if (loadPromise != null) { return loadPromise }
	loadPromise = new Promise((resolve, reject) => {
		const g : any = globalThis as any
		const w : any = g.window
		if (w == null || w.document == null) {
			loadPromise = null
			reject(new Error('天地图只能在浏览器(H5)环境中加载'))
			return
		}
		if (w.T != null) { resolve(w.T); return }

		// 网络重试：脚本加载失败时最多重试 2 次，每次间隔 800ms
		let retries : number = 0
		const MAX_RETRIES : number = 2
		const injectScript = () : void => {
			const script : any = w.document.createElement('script')
			script.type = 'text/javascript'
			script.src = TDT_API
			script.async = true
			script.onerror = () => {
				if (retries < MAX_RETRIES) {
					retries++
					// 移除失败的 script 节点后重新注入
					if (script.parentNode != null) { script.parentNode.removeChild(script) }
					setTimeout(injectScript, 800)
				} else {
					loadPromise = null
					reject(new Error('天地图脚本加载失败，请检查网络或 tk 配置'))
				}
			}
			script.onload = () => {
				// onload 后 T 一般已挂载；个别情况下轮询等待（最长 15s，覆盖 API 内部子资源加载）
				let waited : number = 0
				const timer : number = setInterval(() => {
					if (w.T != null) {
						clearInterval(timer)
						resolve(w.T)
					} else if (waited++ > 150) {
						clearInterval(timer)
						loadPromise = null
						reject(new Error('天地图脚本已加载但 T 对象不可用'))
					}
				}, 100)
			}
			w.document.getElementsByTagName('head')[0].appendChild(script)
		}
		injectScript()
	})
	return loadPromise
}

/* ---------------- 标记图标（内联 SVG data URI，无需额外静态资源） ---------------- */
/** 常态配色：silent 红色，jiude 绿色；选中态统一金色高亮 */
const pinColors = (storeType : string, active : boolean) : { fill : string, stroke : string } => {
	if (active) { return { fill: '#D9A441', stroke: '#F5D98E' } }
	return storeType == 'jiude'
		? { fill: '#3E9B6C', stroke: '#DFF3E8' }
		: { fill: '#D9534F', stroke: '#FBE3E1' }
}

const pinSvg = (count : number, storeType : string, active : boolean) : string => {
	const color : { fill : string, stroke : string } = pinColors(storeType, active)
	const svg : string = '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44">'
		+ '<path d="M17 1C8.4 1 1.5 7.6 1.5 16c0 11.2 15.5 27 15.5 27s15.5-15.8 15.5-27C32.5 7.6 25.6 1 17 1z" fill="'
		+ color.fill + '" stroke="' + color.stroke + '" stroke-width="1.6"/>'
		+ '<text x="17" y="21" font-size="15" fill="#FFFFFF" text-anchor="middle" font-weight="bold" font-family="Arial">'
		+ count + '</text></svg>'
	return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

/**
 * 城市聚合地图：每座城市一个标记，点击标记通过 onPick 回调把城市名交给页面
 */
export class TiandituCityMap {
	private containerId : string = ''
	private onPick : (name : string) => void = () => {}
	private T : any = null
	private map : any = null
	private markers : any[] = []
	private cities : TdtCity[] = []
	private activeCity : string = ''
	private firstFit : boolean = true

	constructor(containerId : string, onPick : (name : string) => void) {
		this.containerId = containerId
		this.onPick = onPick
	}

	/** 创建地图实例并挂载缩放/比例尺控件 */
	init = () : Promise<void> => {
		return loadTianditu().then((T : any) => {
			this.T = T
			this.map = new T.Map(this.containerId, { projection: 'EPSG:4326' })
			// 默认视角落在长三角（当前门店集中区域）
			this.map.centerAndZoom(new T.LngLat(120.2, 31.2), 9)
			this.map.addControl(new T.Control.Zoom())
			this.map.addControl(new T.Control.Scale())
		})
	}

	private cityByName = (name : string) : TdtCity | null => {
		for (let i : number = 0; i < this.cities.length; i++) {
			if (this.cities[i].name == name) { return this.cities[i] }
		}
		return null
	}

	private buildIcon = (count : number, storeType : string, active : boolean) : any => {
		const T : any = this.T
		return new T.Icon({
			iconUrl: pinSvg(count, storeType, active),
			iconSize: new T.Point(34, 44),
			iconAnchor: new T.Point(17, 44)
		})
	}

	/**
	 * 根据最新城市数据重建标记，尽量保持当前视角不变。
	 * 首次渲染时自动缩放到能装下全部城市。
	 */
	render = (cities : TdtCity[], activeCity : string) : void => {
		if (this.map == null) { return }
		const T : any = this.T
		this.cities = cities
		this.activeCity = activeCity

		for (let i : number = 0; i < this.markers.length; i++) {
			this.map.removeOverLay(this.markers[i])
		}
		this.markers = []

		for (let i : number = 0; i < cities.length; i++) {
			const c : TdtCity = cities[i]
			const marker : any = new T.Marker(
				new T.LngLat(c.lng, c.lat),
				{ icon: this.buildIcon(c.count, c.storeType, c.name == activeCity) }
			)
			const self : TiandituCityMap = this
			marker.addEventListener('click', () => { self.onPick(c.name) })
			this.map.addOverLay(marker)
			this.markers.push(marker)
		}

		if (this.firstFit) {
			this.firstFit = false
			// 延迟到容器完成布局后再适配视野（挂载即刻执行会因容器尺寸未定而算错缩放级别）
			const self : TiandituCityMap = this
			setTimeout(() => {
				if (self.map == null) { return }
				if (self.activeCity == '') {
					self.frameAll()
				} else {
					self.focus(self.activeCity)
				}
			}, 300)
		}
	}

	/** 只切换选中态图标，不重建标记 */
	setActive = (activeCity : string) : void => {
		this.activeCity = activeCity
		for (let i : number = 0; i < this.markers.length; i++) {
			this.markers[i].setIcon(this.buildIcon(this.cities[i].count, this.cities[i].storeType, this.cities[i].name == activeCity))
		}
	}

	/** 平移并放大到指定城市，同时打开信息窗 */
	focus = (name : string) : void => {
		if (this.map == null) { return }
		const c : TdtCity | null = this.cityByName(name)
		if (c == null) { return }
		const T : any = this.T
		const zoom : number = this.map.getZoom()
		if (zoom < 11) {
			this.map.centerAndZoom(new T.LngLat(c.lng, c.lat), 11)
		} else {
			this.map.panTo(new T.LngLat(c.lng, c.lat))
		}
		const html : string = '<div style="font-size:13px;color:#333333;line-height:1.7;min-width:150px;">'
			+ '<b style="font-size:15px;">' + c.name + '</b><br/>'
			+ c.count + ' 家门店 · ' + c.openGames + ' 桌在开<br/>'
			+ '<span style="color:#C89B3C;">再次点击可取消选择</span></div>'
		// openInfoWindow 签名为 (content, lnglat)：第一参是内容，第二参才是坐标
		this.map.openInfoWindow(html, new T.LngLat(c.lng, c.lat))
	}

	/** 缩放到能装下全部城市 */
	frameAll = () : void => {
		if (this.map == null) { return }
		if (this.markers.length > 0) {
			// setViewport 只接受 LngLat 数组（传 Marker 会被忽略，导致视野计算崩溃）
			const pts : any[] = []
			for (let i : number = 0; i < this.cities.length; i++) {
				pts.push(new this.T.LngLat(this.cities[i].lng, this.cities[i].lat))
			}
			this.map.setViewport(pts)
		}
		this.map.closeInfoWindow()
	}

	/** 定位按钮：居中到指定坐标 */
	centerAt = (lng : number, lat : number, zoom : number) : void => {
		if (this.map == null) { return }
		const T : any = this.T
		this.map.centerAndZoom(new T.LngLat(lng, lat), zoom)
	}
}
