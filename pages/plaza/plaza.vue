<template>
	<scroll-view
		class="page"
		direction="vertical"
		:show-scrollbar="false"
		:refresher-enabled="true"
		:refresher-triggered="refreshing"
		@refresherrefresh="onRefresh"
		@scrolltolower="tryLoadMore"
	>
		<!-- 门店地图：通铺全宽，不包卡片；标题/定位浮层在地图上方 -->
		<view class="map-wrap">
			<view class="map-body">
				<!-- #ifdef H5 -->
				<!-- 天地图 JS API 挂载容器（封装见 common/tianditu.ts） -->
				<view id="plazaTdtMap" class="tdt-map"></view>
				<!-- #endif -->
				<!-- #ifndef H5 -->
				<view class="tdt-fallback">
					<text class="tdt-fallback-text">天地图仅在 H5 端提供</text>
				</view>
				<!-- #endif -->

				<!-- 地图加载失败重试遮罩：网络抖动/T 就绪超时时出现，点击重试重新初始化 -->
				<view v-if="mapFailed" class="map-retry">
					<text class="map-retry-icon">⟳</text>
					<view class="map-retry-btn" @tap="onRetryMap">
						<text class="map-retry-btn-text">点击重试</text>
					</view>
				</view>

				<!-- 浮层：整条不拦截地图手势，只有「定位」按钮可点 -->
				<view class="map-head">
					<text class="map-title">门店地图</text>
					<view class="map-loc" @click="onLocate">
						<text class="map-loc-text">定位</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 城市选择：独立卡片，与地图区分开 -->
		<view class="city-card">
			<view class="city-card-head">
				<view class="city-card-title-wrap">
					<view class="section-bar"></view>
					<text class="city-card-title">选择城市</text>
				</view>
				<text class="city-card-sub">{{ activeCity === '' ? '当前：全部门店' : '当前：' + activeCity }}</text>
			</view>
			<scroll-view class="chip-scroll" direction="horizontal" :show-scrollbar="false">
				<view class="chip" :class="{ 'chip-active': activeCity === '' }" @tap="selectCity('')">
					<text class="chip-text" :class="{ 'chip-text-active': activeCity === '' }">全部门店</text>
				</view>
				<view
					v-for="c in cityGroups"
					:key="c.name"
					class="chip"
					:class="{ 'chip-active': activeCity === c.name }"
					@tap="selectCity(c.name)"
				>
					<text class="chip-text" :class="{ 'chip-text-active': activeCity === c.name }">{{ c.name }}</text>
					<view class="chip-num" :class="{ 'chip-num-active': activeCity === c.name }">
						<text class="chip-num-text" :class="{ 'chip-num-text-active': activeCity === c.name }">{{ c.count }}</text>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 点击地图上的城市标记后，该城市的门店在这里展开 -->
		<view v-if="activeCityGroup" class="section">
			<view class="section-head">
				<view class="section-title-wrap">
					<view class="section-bar"></view>
					<text class="section-title">{{ citySectionTitle }}</text>
				</view>
				<text class="section-count">{{ citySectionCount }}</text>
			</view>

			<!-- 门店卡片两列平铺：比单列省一半纵向空间 -->
			<view class="store-grid">
				<view
					v-for="s in activeCityStores"
					:key="s.id"
					class="store-card"
					:class="{ 'store-card-active': activeStoreId === s.id }"
					@tap="selectStore(s.id)"
				>
					<text class="store-card-name" :class="{ 'store-card-name-active': activeStoreId === s.id }">{{ s.name }}</text>
					<text class="store-card-addr">{{ s.address }}</text>
					<view class="store-card-foot">
						<text v-if="activeStoreId === s.id" class="store-card-seat">在座 {{ s.currentPlayers }} 人 · 累计 {{ s.totalPlayers }} 人</text>
						<view v-else class="store-card-open">
							<text class="store-card-num">{{ s.openGames }}</text>
							<text class="store-card-unit">桌在开</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 对局列表 -->
		<view class="section">
			<view class="tabs">
				<view class="tab" :class="{ 'tab-active': gameTab === 'live' }" @tap="switchTab('live')">
					<text class="tab-text" :class="{ 'tab-text-active': gameTab === 'live' }">进行中的对局</text>
				</view>
				<view class="tab" :class="{ 'tab-active': gameTab === 'booked' }" @tap="switchTab('booked')">
					<text class="tab-text" :class="{ 'tab-text-active': gameTab === 'booked' }">预约对局</text>
				</view>
			</view>

			<view v-if="allGames.length === 0 && !loading" class="list-empty">
				<text class="list-empty-text">{{ emptyText }}</text>
			</view>

			<view
				v-for="game in allGames"
				:key="game.id"
				class="game-card"
				@tap="onGameTap(game)"
			>
				<view class="game-top">
					<view class="game-store">
						<view class="game-store-dot"></view>
						<text class="game-store-name">{{ game.storeName }}</text>
					</view>
					<view class="game-status" :style="statusBgStyle(game.status)">
						<text class="game-status-text" :style="statusColorStyle(game.status)">{{ game.status }}</text>
					</view>
				</view>

				<text class="game-title">{{ game.title }}</text>

				<view class="game-progress">
					<view class="progress-track">
						<view class="progress-fill" :style="progressStyle(game)"></view>
					</view>
					<text class="progress-text">{{ game.players }}/{{ game.maxPlayers }} 人</text>
				</view>

				<view class="game-meta">
					<view class="meta-item">
						<text class="meta-label">起始筹码</text>
						<text class="meta-value">{{ formatChips(game.startChips) }}</text>
					</view>
					<view class="meta-divider"></view>
					<view class="meta-item">
						<text class="meta-label">当前级别</text>
						<text class="meta-value">{{ game.level }}</text>
					</view>
				</view>

				<view class="game-foot">
					<view class="foot-left">
						<text class="foot-time">{{ game.startTime }}</text>
						<text class="foot-buyin">{{ game.minChips > 0 ? ('盲注 ' + game.minChips + '/' + game.maxChips) : game.typeName }}</text>
					</view>
					<view class="foot-btn" @tap.stop="onBook(game)">
						<text class="foot-btn-text">{{ gameTab === 'live' ? '参赛' : '预约' }}</text>
					</view>
				</view>
			</view>

			<view class="list-foot" @tap="onListFootTap">
				<text v-if="filtering && noMore" class="list-foot-text">已展示该范围内全部 {{ allGames.length }} 桌</text>
				<text v-else-if="loading" class="list-foot-text">加载中…</text>
				<text v-else-if="noMore" class="list-foot-text">没有更多对局了</text>
				<text v-else class="list-foot-text">上拉或点击加载更多</text>
			</view>
		</view>

		<!-- 公告弹窗：首次进入/刷新时拉取 announcement/recent，弹出最近一条发布中的公告 -->
		<view v-if="annVisible" class="ann-overlay" @tap="closeAnnouncement">
			<view class="ann-card" @tap.stop="">
				<view class="ann-head">
					<view class="ann-badge">
						<text class="ann-badge-text">公告</text>
					</view>
					<text class="ann-title">{{ annTitle }}</text>
				</view>
				<scroll-view class="ann-body" direction="vertical" :show-scrollbar="false">
					<text class="ann-content">{{ annContent }}</text>
				</scroll-view>
				<view class="ann-btn" @tap="closeAnnouncement">
					<text class="ann-btn-text">我知道了</text>
				</view>
			</view>
		</view>
	</scroll-view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { fetchLiveStores } from '@/common/store-api'
import { fetchMatchList } from '@/common/match-api'
import { fetchRecentAnnouncement } from '@/common/notice-api'
import type { AnnouncementRow } from '@/common/notice-api'
import type { CityGroup } from '@/common/types'
/* #ifdef H5 */
import { TiandituCityMap } from '@/common/tianditu'
import type { TdtCity } from '@/common/tianditu'
/* #endif */

/** 门店实况（/store/live-list → 广场地图 / 城市门店列表） */
type PlazaStore = {
	id : string
	name : string
	city : string
	address : string
	latitude : string        // 后端用 String 存
	longitude : string
	storeType : string       // 'silent' | 'jiude'
	openGames : number        // 进行中比赛数
	currentPlayers : number   // 在座人数
	totalPlayers : number     // 累计人数
}

/** 对局卡片（/match/list → 广场对局列表） */
type PlazaGame = {
	id : string
	storeId : string
	storeName : string
	typeName : string
	title : string
	players : number          // 当前人数
	maxPlayers : number       // 总人数
	startChips : number
	level : string
	status : string           // 中文状态标签
	startTime : string        // MM-DD HH:mm
	minChips : number
	maxChips : number
}

const PAGE_LIMIT : number = 20

const stores = ref<PlazaStore[]>([])
const activeCity = ref<string>('')
const activeStoreId = ref<string>('')

/* ---------------- 城市聚合 ---------------- */
const storesOfCity = (name : string) : PlazaStore[] => {
	const out : PlazaStore[] = []
	for (let i : number = 0; i < stores.value.length; i++) {
		if (stores.value[i].city == name) { out.push(stores.value[i]) }
	}
	return out
}

const cityGroups = computed<CityGroup[]>((): CityGroup[] => {
	const names : string[] = []
	for (let i : number = 0; i < stores.value.length; i++) {
		const c : string = stores.value[i].city
		let found : boolean = false
		for (let j : number = 0; j < names.length; j++) {
			if (names[j] == c) { found = true; break }
		}
		if (!found) { names.push(c) }
	}
	const out : CityGroup[] = []
	for (let i : number = 0; i < names.length; i++) {
		const name : string = names[i]
		const list : PlazaStore[] = storesOfCity(name)
		const ids : string[] = []
		let games : number = 0
		for (let j : number = 0; j < list.length; j++) {
			ids.push(list[j].id)
			games += list[j].openGames
		}
		out.push({
			name: name,
			province: '',
			x: 0,
			y: 0,
			count: list.length,
			openGames: games,
			districts: '',
			storeIds: ids
		})
	}
	return out
})

const activeCityGroup = computed<CityGroup | null>((): CityGroup | null => {
	const name : string = activeCity.value
	if (name == '') { return null }
	for (let i : number = 0; i < cityGroups.value.length; i++) {
		if (cityGroups.value[i].name == name) { return cityGroups.value[i] }
	}
	return null
})

const activeCityStores = computed<PlazaStore[]>((): PlazaStore[] => {
	return storesOfCity(activeCity.value)
})

// 城市区标题/副标题：uvue 编译器对模板里 ref 的判空不做收窄，集中到 computed 里兜底
const citySectionTitle = computed<string>((): string => {
	return (activeCityGroup.value != null ? activeCityGroup.value.name : '') + '门店'
})
const citySectionCount = computed<string>((): string => {
	const g = activeCityGroup.value
	if (g == null) { return '' }
	return g.count + ' 家 · ' + g.openGames + ' 桌在开'
})

/* ---------------- 天地图（仅 H5） ---------------- */
let tdtMap : any = null
const mapFailed = ref<boolean>(false)

const doInitMap = () : void => {
	if (tdtMap == null) {
		tdtMap = new TiandituCityMap('plazaTdtMap', (cityName : string) => {
			selectCity(cityName)
		})
	}
	mapFailed.value = false
	tdtMap.init().then(() => {
		renderMap()
	}).catch(() => {
		mapFailed.value = true
	})
}

// 重试：失败遮罩上的按钮触发
const onRetryMap = () : void => {
	doInitMap()
}

onMounted(() => {
	doInitMap()
})

/* #ifdef H5 */
/** 城市中心坐标：取该城市所有有效门店经纬度的平均值 */
const cityCenter = (list : PlazaStore[]) : { lng : number, lat : number } | null => {
	let lngSum : number = 0
	let latSum : number = 0
	let n : number = 0
	for (let i : number = 0; i < list.length; i++) {
		const lng : number = Number(list[i].longitude)
		const lat : number = Number(list[i].latitude)
		if (!isNaN(lng) && !isNaN(lat) && (lng != 0 || lat != 0)) {
			lngSum += lng
			latSum += lat
			n++
		}
	}
	if (n == 0) { return null }
	return { lng: lngSum / n, lat: latSum / n }
}

const buildTdtCities = () : TdtCity[] => {
	const out : TdtCity[] = []
	for (let i : number = 0; i < cityGroups.value.length; i++) {
		const g : CityGroup = cityGroups.value[i]
		const list : PlazaStore[] = storesOfCity(g.name)
		const center : { lng : number, lat : number } | null = cityCenter(list)
		if (center == null) { continue }
		// 城市标记类型取该城市门店的类型（同城市门店类型一致；异常空串按 silent 处理）
		const type : string = (list.length > 0 && list[0].storeType == 'jiude') ? 'jiude' : 'silent'
		out.push({
			name: g.name,
			lng: center.lng,
			lat: center.lat,
			count: g.count,
			openGames: g.openGames,
			storeType: type
		})
	}
	return out
}

/** 用最新城市数据刷新地图标记，保持当前视角 */
const renderMap = () : void => {
	if (tdtMap != null) { tdtMap.render(buildTdtCities(), activeCity.value) }
}

// 选中城市变化：地图跟随平移/缩放，标记图标切换金/灰色
watch(activeCity, (v : string) => {
	if (tdtMap == null) { return }
	if (v == '') {
		tdtMap.frameAll()
	} else {
		tdtMap.focus(v)
	}
	tdtMap.setActive(v)
})
/* #endif */

/* ---------------- 选中逻辑 ---------------- */
const selectCity = (name : string) : void => {
	if (name == '' || activeCity.value == name) {
		activeCity.value = ''
		activeStoreId.value = ''
	} else {
		activeCity.value = name
		activeStoreId.value = ''
	}
	// 城市变化后对局列表重新拉取（city 参数交服务端过滤）
	reloadGames()
}

const selectStore = (id : string) : void => {
	if (id == '') {
		activeStoreId.value = ''
		reloadGames()   // 不带 storeId 重新拉取
		return
	}
	if (activeStoreId.value == id) {
		activeStoreId.value = ''
		reloadGames()   // 取消选中后回到城市级列表
		return
	}
	activeStoreId.value = id
	for (let i : number = 0; i < stores.value.length; i++) {
		if (stores.value[i].id == id) {
			activeCity.value = stores.value[i].city
			break
		}
	}
	// 请求带 storeId=xxx，由服务端过滤
	reloadGames()
}

/* 切换 Tab：重置列表后按对应状态重新拉取 */
const switchTab = (tab : 'live' | 'booked') : void => {
	if (gameTab.value == tab) { return }
	gameTab.value = tab
	allGames.value = []
	noMore.value = false
	reloadGames()
}

/* ---------------- 对局列表 ---------------- */
const allGames = ref<PlazaGame[]>([])
const loading = ref<boolean>(false)
const noMore = ref<boolean>(false)
const refreshing = ref<boolean>(false)
let curPage : number = 1          // 已加载到的页码
let reqSeq : number = 0           // 请求序号：切换 Tab / 城市 / 刷新时丢弃过期响应

/* 列表 Tab：进行中的对局（status=P） / 预约对局（status=B 已预约） */
const gameTab = ref<'live' | 'booked'>('live')

const filtering = computed<boolean>((): boolean => activeCity.value != '' || activeStoreId.value != '')

const emptyText = computed<string>((): string => {
	const isBooked = gameTab.value === 'booked'
	if (activeStoreId.value != '') { return '该门店暂无' + (isBooked ? '预约' : '进行中') + '的对局' }
	if (activeCity.value != '') { return '该城市暂无' + (isBooked ? '预约' : '进行中') + '的对局' }
	return isBooked ? '暂无预约对局' : '暂无进行中的对局'
})

/* MatchVO → 对局卡片 */
const mapGame = (vo : any) : PlazaGame => {
	const status : string = (vo.status ?? '').toString().toUpperCase()
	let statusLabel : string = '进行中'
	if (status == 'P') { statusLabel = '进行中' }
	else if (status == 'C') { statusLabel = '报名中' }
	else if (status == 'S') { statusLabel = '已暂停' }
	else if (status == 'F') { statusLabel = '已结束' }
	// "yyyy-MM-dd HH:mm:ss" → "MM-DD HH:mm"
	const st : string = (vo.startTime ?? '').toString()
	return {
		id: String(vo.id),
		storeId: String(vo.storeId),
		storeName: (vo.storeName ?? '').toString(),
		typeName: (vo.typeName ?? '').toString(),
		title: (vo.name ?? '').toString(),
		players: Number(vo.currentPlayerCount ?? 0),
		maxPlayers: Number(vo.playerCount ?? 0),
		startChips: Number(vo.originChips ?? 0),
		level: 'Lv.' + Number(vo.currentLevel ?? 0),
		status: statusLabel,
		startTime: st.length >= 16 ? st.slice(5, 16) : st,
		minChips: Number(vo.minChips ?? 0),
		maxChips: Number(vo.maxChips ?? 0)
	}
}

/* 拉取一页对局：city / storeId 交给服务端过滤，replace = 重置到第一页 */
const fetchGamesPage = (targetPage : number, replace : boolean) : void => {
	const seq : number = ++reqSeq
	loading.value = true
	const status : string = gameTab.value === 'live' ? 'P' : 'B'
	// 选中门店时按 storeId 精确过滤，city 置空避免双重约束
	const sid : string = activeStoreId.value
	const city : string = sid != '' ? '' : activeCity.value
	fetchMatchList(status, city, sid, targetPage, PAGE_LIMIT).then((r) => {
		if (seq != reqSeq) { return }   // 过期响应丢弃
		const pageList : PlazaGame[] = []
		for (let i : number = 0; i < r.list.length; i++) {
			pageList.push(mapGame(r.list[i]))
		}
		if (replace) {
			allGames.value = pageList
		} else {
			const next : PlazaGame[] = allGames.value.slice()
			for (let i : number = 0; i < pageList.length; i++) { next.push(pageList[i]) }
			allGames.value = next
		}
		curPage = targetPage
		noMore.value = pageList.length == 0 || allGames.value.length >= r.total
		loading.value = false
		refreshing.value = false
		uni.stopPullDownRefresh()
	}).catch(() => {
		if (seq != reqSeq) { return }
		loading.value = false
		refreshing.value = false
		uni.stopPullDownRefresh()
		uni.showToast({ title: '对局加载失败', icon: 'none' })
	})
}

const reloadGames = () : void => {
	fetchGamesPage(1, true)
}

const loadMore = () : void => {
	if (loading.value || noMore.value) { return }
	fetchGamesPage(curPage + 1, false)
}

// 门店实况列表（地图标记 + 城市门店行）
const loadStores = () : void => {
	fetchLiveStores().then((list) => {
		const out : PlazaStore[] = []
		for (let i : number = 0; i < list.length; i++) {
			const it = list[i]
			out.push({
				id: String(it.id),
				name: it.name,
				city: it.city,
				address: it.address,
				latitude: it.latitude,
				longitude: it.longitude,
				storeType: it.storeType,
				openGames: it.currentMatchCount,
				currentPlayers: it.currentPlayerCount,
				totalPlayers: it.totalPlayerCount
			})
		}
		stores.value = out
		/* #ifdef H5 */
		renderMap()
		/* #endif */
	}).catch(() => {
		stores.value = []
		uni.showToast({ title: '门店加载失败', icon: 'none' })
	})
}

// 每次进入页面都重新加载数据（onShow：首次进入 + 从其他页面返回时都会触发）
onShow((): void => {
	loadStores()
	// 重置列表回到第一页再拉取
	allGames.value = []
	noMore.value = false
	loading.value = false
	refreshing.value = false
	reloadGames()
})

// 触底加载：App 端页面本身不可滚动，只能靠 scroll-view 的 @scrolltolower
const tryLoadMore = () : void => {
	loadMore()
}

// 兜底：底部提示区也可点击加载
const onListFootTap = () : void => {
	tryLoadMore()
}

// 页面级触底：Web / 小程序端仍然可用
onReachBottom((): void => {
	tryLoadMore()
})

// scroll-view 下拉刷新：重置后重新加载第一页
const onRefresh = () : void => {
	refreshing.value = true
	if (loading.value) {
		refreshing.value = false
		return
	}
	loadStores()
	reloadGames()
}

const onLocate = () : void => {
	uni.getLocation({
		type: 'wgs84',
		success: (res) => {
			/* #ifdef H5 */
			if (tdtMap != null) { tdtMap.centerAt(res.longitude, res.latitude, 13) }
			/* #endif */
		},
		fail: () => {
			uni.showToast({ title: '定位失败，请检查定位权限', icon: 'none' })
		}
	})
}

const onGameTap = (game : PlazaGame) : void => {
	uni.navigateTo({ url: '/pages/game-detail/game-detail?id=' + game.id })
}

const onBook = (game : PlazaGame) : void => {
	const tip : string = gameTab.value === 'live' ? '已报名参赛：' : '已为您预约：'
	uni.showToast({ title: tip + game.title, icon: 'success' })
}

/* ---------------- 公告弹窗（首次进入/刷新时拉取最近一条） ---------------- */
const annVisible = ref<boolean>(false)
const annData = ref<AnnouncementRow | null>(null)
// uvue 模板对 ref 判空不做收窄，集中到 computed 里兜底
const annTitle = computed<string>((): string => annData.value != null ? annData.value.title : '')
const annContent = computed<string>((): string => annData.value != null ? annData.value.content : '')

const loadAnnouncement = () : void => {
	fetchRecentAnnouncement().then((row : AnnouncementRow | null) => {
		if (row == null) { return }
		annData.value = row
		annVisible.value = true
	}).catch(() => {
		// 公告拉取失败静默处理，不打扰用户
	})
}

const closeAnnouncement = () : void => {
	annVisible.value = false
}

// 只在首次进入/刷新时弹一次（onMounted 不随页面返回重触发）；从其他页返回（onShow）不重复弹
onMounted(() => {
	loadAnnouncement()
})

/* ---------------- 样式辅助 ---------------- */
// 状态色：与整体品牌色统一为金黄系（渐变黄主色 + 深金强调 + 半透明金黄背景），
// 整体观感更贴近"比赛奖牌 / 奖杯"的视觉语言
const statusColor = (status : string) : string => {
	if (status == '进行中') return '#D9A441'
	if (status == '报名中') return '#E8C275'
	// 已暂停 / 已结束等兜底为灰色
	return '#A0A5A3'
}
const statusBg = (status : string) : string => {
	if (status == '进行中') return 'rgba(217,164,65,0.20)'
	if (status == '报名中') return 'rgba(232,194,117,0.22)'
	return 'rgba(255,255,255,0.08)'
}
const statusBgStyle = (s : string) : string => 'background-color:' + statusBg(s) + ';'
const statusColorStyle = (s : string) : string => 'color:' + statusColor(s) + ';'

const progressStyle = (g : PlazaGame) : string => {
	const pct : number = g.maxPlayers > 0 ? Math.round(g.players / g.maxPlayers * 100) : 0
	return 'width:' + pct + '%;'
}

const formatChips = (n : number) : string => {
	const s : string = n.toString()
	let out : string = ''
	let c : number = 0
	for (let i : number = s.length - 1; i >= 0; i--) {
		out = s.charAt(i) + out
		c++
		if (c % 3 == 0 && i > 0) { out = ',' + out }
	}
	return out
}
</script>

<style scoped>
	.page {
		/* padding 参与高度计算，避免超出容器被裁 */
		box-sizing: border-box;
		background-image: linear-gradient(180deg, #0E1110 0%, #0A0C0B 40%, #0B0D0C 100%);
		/* scroll-view 必须有确定高度才能滚动 */
		height: 100vh;
	}
	/* #ifdef H5 */
	/* H5 端 100vh 是浏览器视口高度，其中还包含导航栏和 tabBar，
	   直接用它会让 scroll-view 超出页面内容区，底部内容被裁掉。
	   --window-top = 导航栏高度，--window-bottom = tabBar 高度（App 端均为 0） */
	.page {
		height: calc(100vh - var(--window-top) - var(--window-bottom));
	}
	/* #endif */

	/* ============ 地图卡片 ============ */
	.map-card {
		background-color: #1A1E1D;
		margin: 24rpx 0 0;
		border-radius: 32rpx;
		padding: 30rpx 30rpx 26rpx;
		box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.40), inset 0 1rpx 0 rgba(255, 255, 255, 0.05);
	}
	.map-head { flex-direction: row; align-items: center; justify-content: space-between; margin-bottom: 20rpx; }
	.map-head-left { flex-direction: column; }
	.map-title { font-size: 32rpx; color: #EDEFEE; font-weight: 700; }
	.map-sub { font-size: 22rpx; color: #8F9492; margin-top: 4rpx; }
	.map-loc { padding: 10rpx 22rpx; border-radius: 999rpx; background-color: #1D201F; }
	.map-loc-text { font-size: 24rpx; color: #E8C275; font-weight: 600; }

	.map-body {
		position: relative;
		width: 100%;
		height: 612rpx;
		border-radius: 20rpx;
		overflow: hidden;
		background-color: #111413;
	}

	/* 天地图挂载容器：position 相对定位，内部 div 由天地图 SDK 填充 */
	.tdt-map {
		position: relative;
		width: 100%;
		height: 100%;
	}

	/* 非 H5 端占位 */
	.tdt-fallback { flex: 1; align-items: center; justify-content: center; }
	.tdt-fallback-text { font-size: 24rpx; color: #7E8281; }

	/* 地图加载失败重试遮罩：覆盖在地图容器之上，提供手动重试入口 */
	.map-retry {
		position: absolute;
		left: 0; right: 0; top: 0; bottom: 0;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background-color: rgba(11, 13, 12, 0.82);
		z-index: 5;
	}
	.map-retry-icon {
		font-size: 56rpx;
		color: #E8C275;
		margin-bottom: 16rpx;
	}
	.map-retry-text {
		font-size: 24rpx;
		color: #9AA19E;
		margin-bottom: 28rpx;
	}
	.map-retry-btn {
		padding: 16rpx 44rpx;
		background-image: linear-gradient(135deg, #E8C275, #C89B3C);
		border-radius: 999rpx;
	}
	.map-retry-btn-text {
		font-size: 26rpx;
		color: #14100A;
		font-weight: 700;
	}

	/* 城市筛选 */
	/* 横向滚动：chip 直接作为 scroll-view 的 flex item，必须 flex-shrink: 0，否则会被压回容器宽度导致不溢出、滚不动 */
	.chip-scroll {
		flex-direction: row;
		align-items: center;
		width: 100%;
		white-space: nowrap;
		margin-top: 20rpx;
	}
	.chip {
		flex-direction: row;
		align-items: center;
		flex-shrink: 0;
		padding: 12rpx 22rpx;
		border-radius: 999rpx;
		background-color: #1D201F;
		margin-right: 16rpx;
	}
	.chip-active {
		background-image: linear-gradient(135deg, #F5D98E, #C89B3C);
	}
	.chip-text { font-size: 24rpx; color: #A0A5A3; font-weight: 500; }
	.chip-text-active { color: #FFFFFF; font-weight: 600; }
	.chip-num {
		margin-left: 8rpx;
		min-width: 30rpx;
		height: 30rpx;
		padding: 0 6rpx;
		border-radius: 999rpx;
		background-color: #242827;
		align-items: center;
		justify-content: center;
	}
	.chip-num-active { background-color: rgba(255, 255, 255, 0.22); }
	.chip-num-text { font-size: 18rpx; color: #8F9492; font-weight: 700; line-height: 28rpx; }
	.chip-num-text-active { color: #FFFFFF; }

	/* ============ 城市门店列表（两列平铺） ============ */
	.store-grid {
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: space-between;
		margin-top: 4rpx;
	}
	.store-card {
		box-sizing: border-box;
		width: 48.5%;
		min-height: 180rpx;
		flex-direction: column;
		justify-content: space-between;
		background-color: #1A1E1D;
		border-radius: 20rpx;
		padding: 20rpx 24rpx;
		margin-bottom: 16rpx;
		border: 1rpx solid #2A2F2D;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.30);
	}
	.store-card-active {
		border-color: #D9A441;
		background-image: linear-gradient(135deg, rgba(232,194,117,0.18), rgba(232,194,117,0.05));
		box-shadow: 0 6rpx 20rpx rgba(232, 194, 117, 0.25);
	}
	.store-card-name { font-size: 28rpx; color: #EDEFEE; font-weight: 600; }
	.store-card-name-active { color: #E8C275; }
	.store-card-addr { font-size: 22rpx; color: #8F9492; margin-top: 8rpx; }
	.store-card-foot { flex-direction: row; align-items: flex-end; }
	.store-card-open { flex-direction: row; align-items: flex-end; }
	.store-card-num { font-size: 32rpx; color: #EDEFEE; font-weight: 700; line-height: 36rpx; }
	.store-card-unit { font-size: 20rpx; color: #7E8281; margin-left: 6rpx; line-height: 32rpx; }
	.store-card-seat { font-size: 22rpx; color: #E8C275; line-height: 36rpx; }

	/* ============ 对局列表 ============ */
	.section { margin: 32rpx 0 0; }

	/* 双 Tab：进行中的对局 / 预约对局 */
	.tabs {
		flex-direction: row;
		align-items: center;
		background-color: #1A1E1D;
		border-radius: 999rpx;
		padding: 8rpx;
		margin-bottom: 22rpx;
		border: 1rpx solid #2A2F2D;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.30);
	}
	.tab {
		flex: 1;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		padding: 14rpx 0;
		border-radius: 999rpx;
	}
	.tab-active {
		background-image: linear-gradient(135deg, #F5D98E, #C89B3C);
		box-shadow: 0 4rpx 12rpx rgba(217, 164, 65, 0.35);
	}
	.tab-text { font-size: 26rpx; color: #A0A5A3; font-weight: 600; }
	.tab-text-active { color: #FFFFFF; font-weight: 700; }

	.section-head { flex-direction: row; align-items: center; justify-content: space-between; margin-bottom: 18rpx; padding: 0 4rpx; }
	.section-title-wrap { flex-direction: row; align-items: center; }
	.section-bar {
		width: 6rpx;
		height: 28rpx;
		background-image: linear-gradient(180deg, #F5D98E, #C89B3C);
		border-radius: 6rpx;
		margin-right: 12rpx;
		box-shadow: 0 2rpx 8rpx rgba(232, 194, 117, 0.30);
	}
	.section-title { font-size: 30rpx; color: #EDEFEE; font-weight: 700; }
	.section-count { font-size: 24rpx; color: #8F9492; }

	.list-empty { padding: 80rpx 0; align-items: center; }
	.list-empty-text { font-size: 24rpx; color: #7E8281; }

	.game-card {
		background-color: #1A1E1D;
		border-radius: 28rpx;
		padding: 26rpx 30rpx;
		margin-bottom: 22rpx;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.38), inset 0 1rpx 0 rgba(255, 255, 255, 0.05);
	}
	.game-top { flex-direction: row; align-items: center; justify-content: space-between; margin-bottom: 12rpx; }
	.game-store { flex-direction: row; align-items: center; }
	.game-store-dot { width: 10rpx; height: 10rpx; border-radius: 50%; background-color: #E8C275; margin-right: 10rpx; }
	.game-store-name { font-size: 24rpx; color: #A0A5A3; }
	.game-status { padding: 6rpx 16rpx; border-radius: 999rpx; }
	.game-status-text { font-size: 22rpx; font-weight: 600; }
	.game-title { font-size: 30rpx; color: #EDEFEE; font-weight: 700; }
	.game-progress { flex-direction: row; align-items: center; margin-top: 18rpx; }
	.progress-track { flex: 1; height: 8rpx; background-color: #242827; border-radius: 999rpx; overflow: hidden; margin-right: 16rpx; }
	.progress-fill {
		height: 8rpx;
		background-image: linear-gradient(90deg, #F5D98E, #C89B3C);
		border-radius: 999rpx;
	}
	.progress-text { font-size: 22rpx; color: #E8C275; font-weight: 600; }

	.game-meta { flex-direction: row; align-items: stretch; margin-top: 18rpx; padding: 16rpx 0; border-top: 1rpx solid #242827; border-bottom: 1rpx solid #242827; }
	.meta-item { flex: 1; flex-direction: column; align-items: center; }
	.meta-label { font-size: 22rpx; color: #7E8281; }
	.meta-value { font-size: 26rpx; color: #EDEFEE; font-weight: 700; margin-top: 4rpx; }
	.meta-divider { width: 1rpx; background-color: #242827; }

	.game-foot { flex-direction: row; align-items: center; justify-content: space-between; margin-top: 18rpx; }
	.foot-left { flex-direction: column; }
	/* 开赛时间：绿色 = 「今晚 20:00 / 即将开始 / 随时开局」都是时效性强的「在场」语义 */
	.foot-time { font-size: 24rpx; color: #2AA97A; font-weight: 700; }
	.foot-buyin { font-size: 22rpx; color: #8F9492; margin-top: 2rpx; }
	.foot-btn {
		padding: 12rpx 30rpx;
		background-image: linear-gradient(135deg, #F5D98E, #C89B3C);
		border-radius: 999rpx;
		box-shadow: 0 4rpx 12rpx rgba(217, 164, 65, 0.35);
	}
	.foot-btn-text { font-size: 24rpx; color: #FFFFFF; font-weight: 700; }

	.list-foot { padding: 32rpx 0 8rpx; align-items: center; }
	.list-foot-text { font-size: 24rpx; color: #7E8281; }

	/* ============ 公告弹窗 ============ */
	.ann-overlay {
		position: fixed;
		left: 0; right: 0; top: 0; bottom: 0;
		background-color: rgba(0, 0, 0, 0.65);
		align-items: center;
		justify-content: center;
		/* 天地图 CSS 内有 z-index:99999 的图层，弹窗必须压过它 */
		z-index: 100000;
		padding: 48rpx;
	}
	.ann-card {
		width: 620rpx;
		max-height: 72vh;
		background-color: #171A19;
		border-radius: 24rpx;
		border: 1rpx solid #2A2F2D;
		flex-direction: column;
		padding: 30rpx 30rpx 24rpx;
	}
	.ann-head { flex-direction: row; align-items: center; }
	.ann-badge {
		padding: 6rpx 16rpx;
		border-radius: 8rpx;
		background-image: linear-gradient(135deg, #F5D98E, #C89B3C);
		margin-right: 14rpx;
	}
	.ann-badge-text { font-size: 22rpx; color: #FFFFFF; font-weight: 700; }
	.ann-title { flex: 1; font-size: 30rpx; color: #EDEFEE; font-weight: 700; }
	.ann-date { font-size: 22rpx; color: #7E8281; margin-top: 10rpx; }
	.ann-body {
		/* 固定高度：避免从其他页面返回时布局未就绪导致测量高度异常；
		   短内容留白、长内容在该区域内滚动 */
		height: 480rpx;
		margin-top: 18rpx;
	}
	.ann-content { font-size: 26rpx; color: #C6CBC9; line-height: 44rpx; }
	.ann-btn {
		margin-top: 24rpx;
		padding: 18rpx 0;
		border-radius: 999rpx;
		align-items: center;
		justify-content: center;
		background-image: linear-gradient(135deg, #F5D98E, #C89B3C);
		box-shadow: 0 4rpx 12rpx rgba(217, 164, 65, 0.35);
	}
	.ann-btn-text { font-size: 26rpx; color: #FFFFFF; font-weight: 700; }
</style>
