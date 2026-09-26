<template>
	<view class="page">

		<!-- ============ 搜索栏 ============ -->
		<view class="search-bar">
			<view class="search-box">
				<view class="search-ico">
					<text class="search-ico-text">搜</text>
				</view>
				<input
					class="search-input"
					type="text"
					:value="keyword"
					placeholder="搜索地点 / 商圈 / 街道"
					placeholder-class="ph"
					confirm-type="search"
					@input="onKeywordInput"
					@confirm="doSearch"
				/>
				<view v-if="keyword.length > 0" class="search-clear" @tap="onTapClear">
					<text class="search-clear-text">×</text>
				</view>
			</view>
		</view>

		<!-- ============ 地图 ============ -->
		<!-- 选中地点后落 marker + callout 常显名称并居中 -->
		<map
			id="pick-map"
			class="map"
			:latitude="centerLat"
			:longitude="centerLng"
			:scale="13"
			:markers="markers"
		></map>

		<!-- ============ 结果列表 ============ -->
		<view class="list-head">
			<text class="list-head-text">{{ listHeadText }}</text>
			<text class="list-head-sub">{{ selected != null ? '已选：' + selected.name : '点击列表选择，地图同步落点' }}</text>
		</view>
		<scroll-view class="list" direction="vertical" :show-scrollbar="false">
			<view
				v-for="p in results"
				:key="p.name + p.lng.toString()"
				class="row"
				:class="{ 'row-on': selected != null && selected.name == p.name }"
				@tap="onTapRow(p)"
			>
				<view class="row-main">
					<text class="row-name">{{ p.name }}</text>
					<text class="row-addr">{{ p.address }}</text>
				</view>
				<view class="row-check" :class="{ 'row-check-on': selected != null && selected.name == p.name }">
					<text class="row-check-text">✓</text>
				</view>
			</view>
			<view v-if="results.length == 0" class="empty">
				<text class="empty-text">{{ emptyText }}</text>
			</view>
			<view class="foot-blank"></view>
		</scroll-view>

		<!-- ============ 底部按钮 ============ -->
		<view class="btns">
			<view class="btn btn-cancel" @tap="onTapCancel">
				<text class="btn-text btn-cancel-text">取消</text>
			</view>
			<view class="btn btn-ok" @tap="onTapConfirm">
				<text class="btn-text btn-ok-text">确定地址</text>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { searchNearbyPois, searchPoisByKeyword, fireLocationPicked } from '@/common/admin-location-data'
import type { AdminPoi } from '@/common/admin-location-data'

/* ---------------- 状态 ---------------- */
const keyword = ref('')
// 默认上海人民广场；支持跳转参数带初始坐标
const centerLat = ref(31.2304)
const centerLng = ref(121.4737)
const selected = ref<AdminPoi | null>(null)

const results = ref<AdminPoi[]>([])
const searching = ref(false)
const searchErr = ref('')

// 跳转参数：初始坐标（已定位过的店铺重新选点时居中到原位置）
onLoad((opt : any) : void => {
	const lat : number = parseFloat((opt && opt.lat ? opt.lat : '0').toString())
	const lng : number = parseFloat((opt && opt.lng ? opt.lng : '0').toString())
	if (lat != 0 && lng != 0) {
		centerLat.value = lat
		centerLng.value = lng
	}
	doSearch()
})

/* ---------------- 高德检索 ---------------- */
// 序号防竞态：旧请求返回时发现已有更新的请求，直接丢弃
let searchSeq : number = 0

const doSearch = () : void => {
	const mySeq : number = ++searchSeq
	searching.value = true
	searchErr.value = ''
	const done = (pois : AdminPoi[]) : void => {
		if (mySeq != searchSeq) { return }
		results.value = pois
		searching.value = false
	}
	const oops = (msg : string) : void => {
		if (mySeq != searchSeq) { return }
		results.value = []
		searchErr.value = msg
		searching.value = false
	}
	const kw : string = keyword.value.trim()
	if (kw.length > 0) {
		searchPoisByKeyword(kw, centerLat.value, centerLng.value, done, oops)
	} else {
		searchNearbyPois(centerLat.value, centerLng.value, done, oops)
	}
}

// 输入防抖 400ms；键盘「搜索」立即触发
let searchTimer : any = null
const onKeywordInput = (e : any) : void => {
	keyword.value = (e.detail.value || '').toString()
	if (searchTimer != null) { clearTimeout(searchTimer) }
	searchTimer = setTimeout((): void => { doSearch() }, 400)
}

const onTapClear = () : void => {
	keyword.value = ''
	doSearch()
}

const listHeadText = computed<string>((): string => {
	if (searching.value) { return '搜索中…' }
	return keyword.value.trim().length > 0 ? '搜索结果' : '附近地点'
})

const emptyText = computed<string>((): string => {
	if (searchErr.value.length > 0) { return searchErr.value }
	return '未找到相关地点，换个关键词试试'
})

/* ---------------- 地图 marker ---------------- */
/* ⚠️ marker 的 id 必须每次唯一且每次都要换：部分平台的 <map> 对「同 id 只改坐标」
   不生效，旧 marker/callout 不会被替换，会累积多个点。
   因此每次选择都：1) 先置空 markers 触发移除旧点；2) 下一拍再挂新 marker（新 id） */
const markers = ref<any[]>([])
let markerSeq : number = 0
const showMarker = (p : AdminPoi) : void => {
	markerSeq++
	markers.value = []
	nextTick((): void => {
		markers.value = [{
			id: markerSeq,
			latitude: p.lat,
			longitude: p.lng,
			iconPath: '/static/location_picker.png',
			width: 28,
			height: 28,
			title: p.name,
			callout: {
				content: p.name,
				display: 'ALWAYS',
				color: '#14100A',
				fontSize: 12,
				borderRadius: 8,
				bgColor: '#E8C275',
				padding: 6
			}
		}]
	})
}

/* ---------------- 交互 ---------------- */
// 点结果：选中并让地图居中到该点
const onTapRow = (p : AdminPoi) : void => {
	selected.value = p
	centerLat.value = p.lat
	centerLng.value = p.lng
	showMarker(p)
}

const onTapCancel = () : void => { uni.navigateBack() }

const onTapConfirm = () : void => {
	const s = selected.value
	if (s == null) {
		uni.showToast({ title: '请先选择一个地点', icon: 'none' })
		return
	}
	fireLocationPicked(s)
	uni.navigateBack()
}
</script>

<style scoped>
.page {
	flex: 1;
	background-image: linear-gradient(180deg, #0E1110 0%, #0A0C0B 40%, #0B0D0C 100%);
	flex-direction: column;
}

/* ============ 搜索栏 ============ */
.search-bar {
	padding: 20rpx 24rpx;
	background-color: #0B0D0C;
}
.search-box {
	flex-direction: row;
	align-items: center;
	height: 80rpx;
	background-color: #1A1E1D;
	border: 1rpx solid #2A2F2D;
	border-radius: 18rpx;
	padding: 0 20rpx;
	box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
}
.search-ico {
	width: 34rpx;
	height: 34rpx;
	border-radius: 50%;
	background-color: rgba(232, 194, 117, 0.14);
	align-items: center;
	justify-content: center;
	margin-right: 14rpx;
}
.search-ico-text {
	font-size: 19rpx;
	color: #E8C275;
	line-height: 19rpx;
}
.search-input {
	flex: 1;
	height: 80rpx;
	font-size: 26rpx;
	color: #EDEFEE;
}
.ph {
	color: #4A4F4D;
}
.search-clear {
	width: 44rpx;
	height: 44rpx;
	border-radius: 50%;
	background-color: #1F2322;
	align-items: center;
	justify-content: center;
}
.search-clear-text {
	font-size: 28rpx;
	color: #6E7573;
	line-height: 28rpx;
}

/* ============ 地图 ============ */
.map {
	width: 100%;
	height: 520rpx;
	margin-bottom: 16rpx;
}

/* ============ 结果列表 ============ */
.list-head {
	flex-direction: row;
	align-items: baseline;
	justify-content: space-between;
	padding: 8rpx 32rpx 12rpx;
}
.list-head-text {
	font-size: 24rpx;
	color: #8F9492;
	font-weight: 700;
}
.list-head-sub {
	font-size: 20rpx;
	color: #4A4F4D;
}
.list {
	flex: 1;
	flex-direction: column;
}
.row {
	flex-direction: row;
	align-items: center;
	padding: 20rpx 32rpx;
	border: 1rpx solid transparent;
}
.row-on {
	background-color: rgba(232, 194, 117, 0.08);
	border-bottom: 1rpx solid rgba(232, 194, 117, 0.25);
}
.row-main {
	flex: 1;
	flex-direction: column;
}
.row-name {
	font-size: 26rpx;
	color: #EDEFEE;
}
.row-addr {
	font-size: 21rpx;
	color: #6E7573;
	margin-top: 4rpx;
}
.row-check {
	width: 44rpx;
	height: 44rpx;
	border-radius: 50%;
	background-color: #1F2322;
	border: 1rpx solid #2A2F2D;
	align-items: center;
	justify-content: center;
	margin-left: 16rpx;
}
.row-check-on {
	background-color: #E8C275;
	border: 1rpx solid #E8C275;
}
.row-check-text {
	font-size: 22rpx;
	color: #4A4F4D;
	line-height: 22rpx;
}
.row-check-on .row-check-text {
	color: #14100A;
	font-weight: 700;
}
.empty {
	align-items: center;
	justify-content: center;
	padding: 80rpx 40rpx;
}
.empty-text {
	font-size: 22rpx;
	color: #FF6255;
	text-align: center;
	line-height: 34rpx;
}
.foot-blank {
	height: 40rpx;
}

/* ============ 底部按钮 ============ */
.btns {
	flex-direction: row;
	padding: 20rpx 24rpx 40rpx;
	background-color: #0B0D0C;
	border-top: 1rpx solid #1F2322;
}
.btn {
	flex: 1;
	height: 84rpx;
	align-items: center;
	justify-content: center;
	border-radius: 14rpx;
}
.btn-text {
	font-size: 27rpx;
	font-weight: 600;
}
.btn-cancel {
	background-color: #1F2322;
	border: 1rpx solid #2A2F2D;
	margin-right: 18rpx;
}
.btn-cancel-text {
	color: #C7CDCB;
}
.btn-ok {
	background-image: linear-gradient(135deg, #E8C275, #C89B3C);
}
.btn-ok-text {
	color: #14100A;
}
</style>
