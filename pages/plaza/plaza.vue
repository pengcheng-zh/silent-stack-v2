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
		<!-- 门店地图 -->
		<view class="map-card">
			<view class="map-head">
				<view class="map-head-left">
					<text class="map-title">门店地图</text>
					<text class="map-sub">{{ stores.length }} 家门店 · {{ cityGroups.length }} 座城市 · 点击城市查看门店</text>
				</view>
				<view class="map-loc" @click="onLocate">
					<text class="map-loc-text">定位</text>
				</view>
			</view>

			<view
				class="map-body"
				@touchstart="onTouchStart"
				@touchmove.stop.prevent="onTouchMove"
				@touchend="onTouchEnd"
				@touchcancel="onTouchEnd"
			>
				<view class="map-stage" :style="stageStyle">
					<image class="map-img" src="/static/china-map.svg" mode="scaleToFill"></image>

					<!-- 省名标注 -->
					<view
						v-for="p in provinceLabels"
						:key="'p-' + p.name"
						class="province-label"
						:style="pinStyle(p.x, p.y, 5)"
					>
						<text class="province-label-text">{{ p.name }}</text>
					</view>

					<!-- 参照城市 -->
					<view
						v-for="c in referenceCities"
						:key="'r-' + c.name"
						class="city"
						:style="pinStyle(c.x, c.y, 6)"
					>
						<view class="city-dot"></view>
						<text class="city-label">{{ c.name }}</text>
					</view>

					<!-- 城市标记：每座城市只有一个，点击后在下方展开该城市的门店 -->
					<view
						v-for="m in mapMarkers"
						:key="m.key"
						class="marker"
						:style="pinStyle(m.x, m.y, m.z)"
						@tap="selectCity(m.label)"
					>
						<view class="marker-pin-wrap">
							<!-- 选中城市：扩散水圈（两圈相位差半程；App 端不支持 @keyframes，由定时器驱动） -->
							<view v-if="m.active" class="marker-ripple">
								<view class="ripple-ring" :style="rippleStyle(0)"></view>
								<view class="ripple-ring" :style="rippleStyle(0.5)"></view>
							</view>
							<view class="marker-pin" :class="{ 'marker-pin-active': m.active }">
								<view class="marker-dot"></view>
							</view>
							<view v-if="m.count > 1" class="marker-badge">
								<text class="marker-badge-text">{{ m.count }}</text>
							</view>
						</view>
						<view class="marker-label" :class="{ 'marker-label-active': m.active }">
							<text class="marker-label-text" :class="{ 'marker-label-text-active': m.active }">{{ m.label }}</text>
						</view>
					</view>
				</view>

				<!-- 缩放控件 -->
				<view class="zoom-bar">
					<view class="zoom-btn" @tap="zoomOut">
						<text class="zoom-btn-text">−</text>
					</view>
					<view class="zoom-btn" @tap="resetMap">
						<text class="zoom-btn-text">◎</text>
					</view>
					<view class="zoom-btn" @tap="zoomIn">
						<text class="zoom-btn-text">＋</text>
					</view>
				</view>
				<view v-if="scale > 1.05" class="zoom-tip">
					<text class="zoom-tip-text">{{ zoomText }}</text>
				</view>
			</view>

			<!-- 城市筛选 -->
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
					<text class="section-title">{{ activeCityGroup.name }}门店</text>
				</view>
				<text class="section-count">{{ activeCityGroup.count }} 家 · {{ activeCityGroup.openGames }} 桌在开</text>
			</view>

			<view
				v-for="s in activeCityStores"
				:key="s.id"
				class="store-row"
				:class="{ 'store-row-active': activeStoreId === s.id }"
				@tap="selectStore(s.id)"
			>
				<view class="store-row-main">
					<text class="store-row-name" :class="{ 'store-row-name-active': activeStoreId === s.id }">{{ s.name }}</text>
					<text class="store-row-meta">{{ s.address }}</text>
					<text v-if="activeStoreId === s.id" class="store-row-addr">在座 {{ s.currentPlayers }} 人 · 累计 {{ s.totalPlayers }} 人</text>
				</view>
				<view class="store-row-right">
					<text class="store-row-num" :class="{ 'store-row-num-active': activeStoreId === s.id }">{{ s.openGames }}</text>
					<text class="store-row-unit">桌在开</text>
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
						<text class="foot-btn-text">预约</text>
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
	</scroll-view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { fetchLiveStores } from '@/common/store-api'
import { fetchMatchList } from '@/common/match-api'
import { PROVINCE_LABELS, REFERENCE_CITIES, CITY_POINTS } from '@/common/map-data'
import type { CityGroup, MapLabel } from '@/common/types'

type MarkerItem = {
	key : string
	x : number
	y : number
	label : string
	count : number
	active : boolean
	z : number
}

/** 门店实况（/store/live-list → 广场地图 / 城市门店列表） */
type PlazaStore = {
	id : string
	name : string
	city : string
	address : string
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

// 地图容器尺寸（rpx），需与样式中的 .map-body 保持一致
const MAP_W_RPX : number = 646
const MAP_H_RPX : number = 612

// 缩放参数
const MAX_SCALE : number = 3

const stores = ref<PlazaStore[]>([])
const provinceLabels = ref<MapLabel[]>(PROVINCE_LABELS)
const referenceCities = ref<MapLabel[]>(REFERENCE_CITIES)
const activeCity = ref<string>('')
const activeStoreId = ref<string>('')

/* ---------------- 地图变换 ---------------- */
const scale = ref<number>(1)
const tx = ref<number>(0)
const ty = ref<number>(0)

// 手势状态（非响应式）
let gMode : number = 0
let gStartDist : number = 0
let gStartScale : number = 1
let gStartTx : number = 0
let gStartTy : number = 0
let gStartX : number = 0
let gStartY : number = 0
let gStartMidX : number = 0
let gStartMidY : number = 0

let mapWPx : number = 323
let mapHPx : number = 306

const invScale = computed<number>((): number => Math.round(1000 / scale.value) / 1000)

const stageStyle = computed<string>((): string => {
	const x : number = Math.round(tx.value)
	const y : number = Math.round(ty.value)
	const s : number = Math.round(scale.value * 1000) / 1000
	return 'transform: translate(' + x + 'px, ' + y + 'px) scale(' + s + ');'
})

const zoomText = computed<string>((): string => Math.round(scale.value * 100) + '%')

const clampNum = (v : number, lo : number, hi : number) : number => {
	if (v < lo) return lo
	if (v > hi) return hi
	return v
}

const shiftLimit = (s : number, sizePx : number) : number => {
	const m : number = sizePx * (s - 1) / 2
	return m > 0 ? m : 0
}

const clampTx = (v : number, s : number) : number => {
	const m : number = shiftLimit(s, mapWPx)
	return clampNum(v, -m, m)
}

const clampTy = (v : number, s : number) : number => {
	const m : number = shiftLimit(s, mapHPx)
	return clampNum(v, -m, m)
}

const touchDist = (ax : number, ay : number, bx : number, by : number) : number => {
	const dx : number = ax - bx
	const dy : number = ay - by
	return Math.sqrt(dx * dx + dy * dy)
}

const applyScale = (target : number) : void => {
	const ns : number = clampNum(target, 1, MAX_SCALE)
	scale.value = ns
	if (ns <= 1.001) {
		tx.value = 0
		ty.value = 0
		return
	}
	tx.value = clampTx(tx.value, ns)
	ty.value = clampTy(ty.value, ns)
}

const zoomIn = () : void => applyScale(scale.value * 1.5)
const zoomOut = () : void => applyScale(scale.value / 1.5)

const resetMap = () : void => {
	scale.value = 1
	tx.value = 0
	ty.value = 0
}

const onTouchStart = (e : UniTouchEvent) : void => {
	const ts = e.touches
	if (ts.length >= 2) {
		gMode = 2
		gStartDist = touchDist(ts[0].pageX, ts[0].pageY, ts[1].pageX, ts[1].pageY)
		gStartScale = scale.value
		gStartTx = tx.value
		gStartTy = ty.value
		gStartMidX = (ts[0].pageX + ts[1].pageX) / 2
		gStartMidY = (ts[0].pageY + ts[1].pageY) / 2
	} else if (ts.length == 1) {
		gMode = 1
		gStartX = ts[0].pageX
		gStartY = ts[0].pageY
		gStartTx = tx.value
		gStartTy = ty.value
	}
}

const onTouchMove = (e : UniTouchEvent) : void => {
	const ts = e.touches
	if (gMode == 2 && ts.length >= 2) {
		const d : number = touchDist(ts[0].pageX, ts[0].pageY, ts[1].pageX, ts[1].pageY)
		if (gStartDist > 0) {
			const ns : number = clampNum(gStartScale * d / gStartDist, 1, MAX_SCALE)
			const midX : number = (ts[0].pageX + ts[1].pageX) / 2
			const midY : number = (ts[0].pageY + ts[1].pageY) / 2
			scale.value = ns
			tx.value = clampTx(gStartTx + (midX - gStartMidX), ns)
			ty.value = clampTy(gStartTy + (midY - gStartMidY), ns)
		}
	} else if (gMode == 1 && ts.length == 1 && scale.value > 1.01) {
		// 未放大时不拖动地图，避免和页面滚动冲突
		const nx : number = gStartTx + (ts[0].pageX - gStartX)
		const ny : number = gStartTy + (ts[0].pageY - gStartY)
		tx.value = clampTx(nx, scale.value)
		ty.value = clampTy(ny, scale.value)
	}
}

const onTouchEnd = (e : UniTouchEvent) : void => {
	const ts = e.touches
	if (ts.length == 0) {
		gMode = 0
	} else if (ts.length == 1) {
		gMode = 1
		gStartX = ts[0].pageX
		gStartY = ts[0].pageY
		gStartTx = tx.value
		gStartTy = ty.value
	}
}

/* ---------------- 城市聚合 ---------------- */
const storesOfCity = (name : string) : PlazaStore[] => {
	const out : PlazaStore[] = []
	for (let i : number = 0; i < stores.value.length; i++) {
		if (stores.value[i].city == name) { out.push(stores.value[i]) }
	}
	return out
}

const cityPointX = (name : string) : number => {
	for (let i : number = 0; i < CITY_POINTS.length; i++) {
		if (CITY_POINTS[i].name == name) { return CITY_POINTS[i].x }
	}
	return 50
}

const cityPointY = (name : string) : number => {
	for (let i : number = 0; i < CITY_POINTS.length; i++) {
		if (CITY_POINTS[i].name == name) { return CITY_POINTS[i].y }
	}
	return 50
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
			x: cityPointX(name),
			y: cityPointY(name),
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

/* ---------------- 标记生成 ---------------- */
// 地图上每座城市只保留一个标记；门店统一放在地图下方的列表里，从根上避免标注重叠
const mapMarkers = computed<MarkerItem[]>((): MarkerItem[] => {
	const out : MarkerItem[] = []
	for (let i : number = 0; i < cityGroups.value.length; i++) {
		const c : CityGroup = cityGroups.value[i]
		const cityActive : boolean = c.name == activeCity.value
		out.push({
			key: 'c-' + c.name,
			x: c.x,
			y: c.y,
			label: c.name,
			count: c.count,
			active: cityActive,
			z: cityActive ? 30 : 10
		})
	}
	return out
})

/* ---------------- 选中城市的扩散水圈 ---------------- */
/* ⚠️ App 平台（uvue）不支持 CSS @keyframes 关键帧动画，只能用编程方式做动画。
   这里用定时器每 40ms 算出相位，写入内联 transform/opacity —— Web / 小程序 / App 三端同一套逻辑。
   两圈相位差半程，形成连续不断向外扩散的水圈 */
const RIPPLE_CYCLE_MS : number = 2200
const RIPPLE_FRAME_MS : number = 40
const ripplePhase = ref<number>(0)      // 0 ~ 1 循环推进
let rippleTimer : number | null = null
let rippleOrigin : number = 0

const stopRipple = () : void => {
	if (rippleTimer != null) {
		clearInterval(rippleTimer)
		rippleTimer = null
	}
	ripplePhase.value = 0
}

const startRipple = () : void => {
	stopRipple()
	rippleOrigin = Date.now()
	rippleTimer = setInterval((): void => {
		ripplePhase.value = ((Date.now() - rippleOrigin) % RIPPLE_CYCLE_MS) / RIPPLE_CYCLE_MS
	}, RIPPLE_FRAME_MS)
}

// offset：相位偏移（第二圈传 0.5）
// 相位 0 → 半径 0.5 倍、最亮；相位 1 → 半径 3.2 倍、完全淡出
const rippleStyle = (offset : number) : string => {
	const t : number = (ripplePhase.value + offset) % 1
	const ringScale : number = 0.5 + 2.7 * t
	const opacity : number = (1 - t) * 0.9
	return 'transform: scale(' + ringScale.toFixed(3) + ');opacity:' + opacity.toFixed(3) + ';'
}

/* ---------------- 选中逻辑 ---------------- */
const selectCity = (name : string) : void => {
	if (name == '' || activeCity.value == name) {
		activeCity.value = ''
		activeStoreId.value = ''
		stopRipple()
	} else {
		activeCity.value = name
		activeStoreId.value = ''
		startRipple()
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
	// 从门店反选城市时，地图上的水圈同步跑到该城市
	if (activeCity.value != '') { startRipple() }
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

/* 列表 Tab：进行中的对局（status=P） / 预约对局（status=C 报名中） */
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
	const status : string = gameTab.value === 'live' ? 'P' : 'C'
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

onLoad((): void => {
	try {
		const wi = uni.getWindowInfo()
		const r : number = wi.windowWidth / 750
		mapWPx = MAP_W_RPX * r
		mapHPx = MAP_H_RPX * r
	} catch (err) {
		// 取不到窗口信息时沿用默认值
	}
})

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
				openGames: it.currentMatchCount,
				currentPlayers: it.currentPlayerCount,
				totalPlayers: it.totalPlayerCount
			})
		}
		stores.value = out
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
	// 定时器只在页面可见时跑：离开页面 / 切后台都停掉，省电
	if (activeCity.value != '') { startRipple() }
})
onHide((): void => { stopRipple() })
onUnload((): void => { stopRipple() })

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
	uni.showToast({ title: '正在获取当前位置…', icon: 'none' })
}

const onGameTap = (game : PlazaGame) : void => {
	uni.navigateTo({ url: '/pages/game-detail/game-detail?id=' + game.id })
}

const onBook = (game : PlazaGame) : void => {
	uni.showToast({ title: '已为您预约：' + game.title, icon: 'success' })
}

/* ---------------- 样式辅助 ---------------- */
const pinStyle = (x : number, y : number, z : number) : string => {
	return 'left:' + x + '%;top:' + y + '%;z-index:' + z + ';transform: translate(-50%, -50%) scale(' + invScale.value + ');'
}

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
	.map-stage {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
	}
	.map-img { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }

	/* 缩放控件 */
	.zoom-bar {
		position: absolute;
		right: 16rpx;
		bottom: 16rpx;
		flex-direction: column;
		border-radius: 16rpx;
		overflow: hidden;
		background-color: rgba(23, 26, 25, 0.94);
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.5);
	}
	.zoom-btn { width: 60rpx; height: 60rpx; align-items: center; justify-content: center; }
	.zoom-btn-text { font-size: 32rpx; color: #E8C275; font-weight: 700; line-height: 36rpx; }
	.zoom-tip {
		position: absolute;
		left: 16rpx;
		bottom: 16rpx;
		padding: 6rpx 16rpx;
		border-radius: 999rpx;
		background-image: linear-gradient(135deg, #F5D98E, #C89B3C);
	}
	.zoom-tip-text { font-size: 20rpx; color: #FFFFFF; font-weight: 600; }

	/* 省名标注 */
	.province-label { position: absolute; }
	.province-label-text {
		font-size: 22rpx;
		color: #5C605F;
		letter-spacing: 6rpx;
		font-weight: 600;
	}

	/* 参照城市 */
	.city { position: absolute; flex-direction: row; align-items: center; }
	.city-dot { width: 10rpx; height: 10rpx; border-radius: 50%; background-color: #7E8281; margin-right: 6rpx; }
	.city-label {
		font-size: 20rpx;
		color: #A0A5A3;
		background-color: rgba(11, 13, 12, 0.80);
		padding: 2rpx 10rpx;
		border-radius: 999rpx;
	}

	/* 城市标记 */
	/* ⚠️ uvue（App 端）overflow 默认是 hidden（不是 W3C 的 visible），
	   marker / pin-wrap / 水圈容器三层都要显式放开，否则扩散到 3.2 倍的环会被整片裁掉 */
	.marker { position: absolute; flex-direction: column; align-items: center; overflow: visible; }
	.marker-pin-wrap {
		position: relative;
		width: 40rpx;
		height: 40rpx;
		align-items: center;
		justify-content: center;
		overflow: visible;
	}
	/* 选中态水圈：以 pin 圆心向外扩散，不占位、不拦截点击。
	   半径 / 透明度由 rippleStyle() 每帧写内联样式（App 端不支持 @keyframes） */
	.marker-ripple {
		position: absolute;
		left: 0;
		top: 0;
		width: 40rpx;
		height: 40rpx;
		overflow: visible;
		z-index: 1;
	}
	.ripple-ring {
		position: absolute;
		left: 0;
		top: 0;
		width: 40rpx;
		height: 40rpx;
		border-radius: 50%;
		background-color: rgba(232, 194, 117, 0.26);
		border: 2rpx solid rgba(232, 194, 117, 0.9);
		transform: scale(0.5);
		opacity: 0.9;
	}

	.marker-pin {
		width: 40rpx;
		height: 40rpx;
		border-radius: 50% 50% 50% 0;
		background-color: #7E8281;
		transform: rotate(-45deg);
		align-items: center;
		justify-content: center;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.4);
		/* 抬到水圈之上，避免扩散环盖住 pin */
		position: relative;
		z-index: 2;
	}
	.marker-pin-active {
		background-image: linear-gradient(135deg, #F5D98E, #C89B3C);
		box-shadow: 0 4rpx 14rpx rgba(217, 164, 65, 0.55);
	}
	.marker-dot { width: 14rpx; height: 14rpx; border-radius: 50%; background-color: #FFFFFF; }
	.marker-badge {
		position: absolute;
		right: -12rpx;
		top: -8rpx;
		min-width: 26rpx;
		height: 26rpx;
		padding: 0 6rpx;
		border-radius: 999rpx;
		background-image: linear-gradient(135deg, #F5D98E, #C89B3C);
		border: 2rpx solid #FFFFFF;
		align-items: center;
		justify-content: center;
	}
	.marker-badge-text { font-size: 18rpx; color: #FFFFFF; font-weight: 700; line-height: 24rpx; }
	.marker-label {
		margin-top: 6rpx;
		padding: 4rpx 12rpx;
		border-radius: 999rpx;
		background-color: rgba(23, 26, 25, 0.95);
		border: 1rpx solid #272B2A;
	}
	.marker-label-active {
		background-image: linear-gradient(135deg, #F5D98E, #C89B3C);
		border-color: #C89B3C;
	}
	.marker-label-text { font-size: 20rpx; color: #A0A5A3; font-weight: 600; }
	.marker-label-text-active { color: #FFFFFF; }

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

	/* ============ 城市门店列表 ============ */
	.store-row {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		background-color: #1A1E1D;
		border-radius: 24rpx;
		padding: 24rpx 28rpx;
		margin-bottom: 16rpx;
		border: 1rpx solid #2A2F2D;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.30);
	}
	.store-row-active {
		border-color: #D9A441;
		background-image: linear-gradient(135deg, rgba(232,194,117,0.18), rgba(232,194,117,0.05));
		box-shadow: 0 6rpx 20rpx rgba(232, 194, 117, 0.25);
	}
	.store-row-main { flex: 1; flex-direction: column; }
	.store-row-name { font-size: 28rpx; color: #EDEFEE; font-weight: 600; }
	.store-row-name-active { color: #E8C275; }
	.store-row-meta { font-size: 22rpx; color: #8F9492; margin-top: 6rpx; }
	.store-row-addr { font-size: 22rpx; color: #E8C275; margin-top: 6rpx; }
	.store-row-right { flex-direction: column; align-items: center; margin-left: 20rpx; }
	.store-row-num { font-size: 30rpx; color: #EDEFEE; font-weight: 700; }
	.store-row-num-active { color: #E8C275; }
	.store-row-unit { font-size: 20rpx; color: #7E8281; margin-top: 2rpx; }

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
</style>