<template>
	<view class="page">
		<!-- ============ 时间范围筛选 ============ -->
		<!-- 5 档：全部 / 今日 / 本周(近 7 日) / 本月(自然月) / 近 30 日
		     与下方"类型"筛选共同作用；命中记录数实时通过过滤体现 -->
		<view class="filter-block">
			<scroll-view class="filter-pills" :scroll-x="true" :show-scrollbar="false">
				<view
					v-for="r in ranges"
					:key="r.key"
					class="filter-pill"
					:class="{ 'filter-pill-active': range == r.key }"
					@tap="setRange(r.key)"
				>
					<text class="filter-pill-text" :class="{ 'filter-pill-text-active': range == r.key }">{{ r.label }}</text>
					<view v-if="range == r.key" class="filter-pill-bar"></view>
				</view>
			</scroll-view>
		</view>

		<!-- ============ 类型筛选 ============ -->
		<!-- 4 档：全部 / 存入 / 取出 / 转赠；与时间范围同时生效 -->
		<view class="filter-block">
			<view class="filter-label">
				<view class="filter-label-bar"></view>
				<text class="filter-label-text">类型</text>
			</view>
			<view class="filter-pills filter-pills-static">
				<view
					v-for="t in filters"
					:key="t.key"
					class="filter-pill"
					:class="{ 'filter-pill-active': filter == t.key }"
					@tap="setFilter(t.key)"
				>
					<text class="filter-pill-text" :class="{ 'filter-pill-text-active': filter == t.key }">{{ t.label }}</text>
					<view v-if="filter == t.key" class="filter-pill-bar"></view>
				</view>
			</view>
		</view>

		<!-- ============ 命中条数提示 ============ -->
		<view class="result-tip">
			<text class="result-tip-text">命中 {{ filteredRecords.length }} 条记录</text>
			<view v-if="range != 'all' || filter != 'all'" class="result-tip-clear" @tap="onTapClear">
				<text class="result-tip-clear-text">清空筛选</text>
			</view>
		</view>

		<!-- ============ 记录列表 ============ -->
		<view class="record-card">
			<view
				v-for="(r, ri) in filteredRecords"
				:key="r.id"
				class="record-row"
				:class="{ 'record-row-last': ri == filteredRecords.length - 1 }"
			>
				<view class="record-bar" :class="'record-bar-' + r.type"></view>
				<view class="record-icon">
					<text class="record-icon-text" :class="'record-icon-text-' + r.type">{{ recordSymbol(r.type) }}</text>
				</view>
				<view class="record-main">
					<text class="record-source">{{ r.source }}</text>
					<text class="record-date">{{ r.date }}</text>
				</view>
				<view class="record-right">
					<text class="record-amount" :class="'record-amount-' + r.type">{{ recordSign(r.type) }}{{ r.amount }}</text>
					<text class="record-amount-label">{{ recordLabel(r.type) }}</text>
				</view>
			</view>

			<view v-if="filteredRecords.length == 0" class="record-empty">
				<text class="record-empty-text">该筛选下暂无记录</text>
			</view>
		</view>

		<view class="footer-blank"></view>
	</view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { JIUDE_RECORDS } from '@/common/jiude-data'
import type { JiudeRecord, RecordFilter, RangeFilter } from '@/common/types'

/* ---------------- 数据 ---------------- */
const records : JiudeRecord[] = JIUDE_RECORDS

/* ---------------- 时间范围筛选 ---------------- */
// 5 档：全部 / 今日 / 本周(近 7 日) / 本月(自然月) / 近 30 日
type RangeCell = { key : RangeFilter, label : string }
const ranges : RangeCell[] = [
	{ key: 'all',     label: '全部' },
	{ key: 'today',   label: '今日' },
	{ key: 'week',    label: '本周' },
	{ key: 'month',   label: '本月' },
	{ key: '30days',  label: '近 30 日' }
]
const range = ref<RangeFilter>('all')

const setRange = (k : RangeFilter) : void => { range.value = k }

/* ---------------- 类型筛选 ---------------- */
// 4 档：全部 / 存入 / 取出 / 转赠
// label 与 jiude.vue 中的 recordLabel 共用相同语义
type FilterCell = { key : RecordFilter, label : string }
const filters : FilterCell[] = [
	{ key: 'all',      label: '全部' },
	{ key: 'deposit',  label: '存入' },
	{ key: 'withdraw', label: '取出' },
	{ key: 'transfer', label: '转赠' }
]
const filter = ref<RecordFilter>('all')

const setFilter = (k : RecordFilter) : void => { filter.value = k }

// 一键清空两个筛选维度，回到"全量记录"视图
const onTapClear = () : void => {
	range.value = 'all'
	filter.value = 'all'
}

/* ---------------- 时间解析 ---------------- */
// 把记录里的 "今天 HH:mm" / "昨天 HH:mm" / "MM-DD HH:mm" 解析为时间戳
// 当前时间通过 new Date() 取（uni-app / H5 / 小程序都支持）
const parseRecordTime = (date : string) : number => {
	const now : Date = new Date()
	const today : Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
	const todayMs : number = today.getTime()

	if (date.indexOf('今天') == 0) {
		const time : string = date.substring(2).trim()
		const parts : string[] = time.split(':')
		const hh : number = Number(parts[0]) || 0
		const mm : number = Number(parts[1]) || 0
		return todayMs + hh * 3600000 + mm * 60000
	}
	if (date.indexOf('昨天') == 0) {
		const time : string = date.substring(2).trim()
		const parts : string[] = time.split(':')
		const hh : number = Number(parts[0]) || 0
		const mm : number = Number(parts[1]) || 0
		return todayMs - 86400000 + hh * 3600000 + mm * 60000
	}
	// MM-DD HH:mm
	const m : RegExpMatchArray | null = date.match(/^(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/)
	if (m) {
		const mo : number = Number(m[1]) || 1
		const d  : number = Number(m[2]) || 1
		const hh : number = Number(m[3]) || 0
		const mm : number = Number(m[4]) || 0
		return new Date(now.getFullYear(), mo - 1, d, hh, mm).getTime()
	}
	return 0
}

/* ---------------- 过滤 ---------------- */
// 二维联动：先按时间范围过一遍，再按类型过一遍；任一维度=all 表示该维度不限定
const filteredRecords = computed<JiudeRecord[]>((): JiudeRecord[] => {
	let list : JiudeRecord[] = records

	if (range.value != 'all') {
		const now : Date = new Date()
		const todayMs : number = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime()
		let lower : number = 0
		let upper : number = 0
		switch (range.value) {
			case 'today':
				lower = todayMs
				upper = todayMs + 86400000
				break
			case 'week':
				// "近 7 日" = 今日往前 6 天到今天结束
				lower = todayMs - 6 * 86400000
				upper = todayMs + 86400000
				break
			case 'month':
				lower = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0).getTime()
				upper = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0).getTime()
				break
			case '30days':
				lower = todayMs - 29 * 86400000
				upper = todayMs + 86400000
				break
		}
		list = list.filter((r : JiudeRecord) : boolean => {
			const t : number = parseRecordTime(r.date)
			return t >= lower && t < upper
		})
	}

	if (filter.value != 'all') {
		list = list.filter((r : JiudeRecord) : boolean => r.type == filter.value)
	}

	return list
})

/* ---------------- 记录：符号与文案 ---------------- */
const recordSymbol = (type : string) : string => {
	if (type == 'deposit') { return '+' }
	if (type == 'withdraw') { return '−' }
	return '⇄'
}

const recordSign = (type : string) : string => {
	if (type == 'deposit') { return '+' }
	if (type == 'withdraw') { return '−' }
	return ''
}

const recordLabel = (type : string) : string => {
	if (type == 'deposit') { return '存入' }
	if (type == 'withdraw') { return '取出' }
	return '转赠'
}
</script>

<style scoped>
	.page {
		box-sizing: border-box;
		background-image: linear-gradient(180deg, #0E1110 0%, #0A0C0B 40%, #0B0D0C 100%);
		min-height: 100vh;
		padding: 0 24rpx;
	}

	/* ============ 筛选块：时间范围 / 类型 ============ */
	/* 两个维度都用同一个 filter-block 容器 + filter-label 标题 + filter-pills 行
	   时间范围使用横向 scroll-view（5 个 chip 可能溢出）；类型用 flex row 4 个 chip 直接展示 */
	.filter-block {
		margin: 20rpx 0 0;
	}
	/* 第一个筛选块（时间范围 pill 行，无 label）紧贴导航栏一些；
	   第二个 filter-block 上方有 label，节奏由后者 20rpx 保持 */
	.filter-block:first-child {
		margin-top: 8rpx;
	}
	.filter-label {
		flex-direction: row;
		align-items: center;
		margin-bottom: 14rpx;
	}
	.filter-label-bar {
		width: 6rpx;
		height: 24rpx;
		background-image: linear-gradient(180deg, #F5D98E, #C89B3C);
		border-radius: 6rpx;
		margin-right: 12rpx;
	}
	.filter-label-text { font-size: 26rpx; color: #EDEFEE; font-weight: 700; }

	/* filter-pills：默认 = 横向 scroll-view；filter-pills-static = 横向 flex 排版，不滚动 */
	.filter-pills {
		flex-direction: row;
		align-items: stretch;
		padding: 0 4rpx;
	}
	.filter-pills-static { flex-direction: row; }
	/* 单个 pill：上文字、下小金条；选中态用主色文字 */
	.filter-pill {
		flex-direction: column;
		align-items: center;
		padding: 0 22rpx 12rpx;
		margin-right: 12rpx;
		flex-shrink: 0;
	}
	.filter-pill-text { font-size: 26rpx; color: #8F9492; font-weight: 500; line-height: 38rpx; }
	.filter-pill-text-active { color: #EDEFEE; font-weight: 700; }
	.filter-pill-bar {
		width: 36rpx;
		height: 6rpx;
		border-radius: 6rpx;
		background-image: linear-gradient(90deg, #F5D98E, #C89B3C);
		margin-top: 8rpx;
	}

	/* ============ 命中条数提示 ============ */
	/* 用户每次切换筛选维度时实时显示命中数；任意维度非全部时显示"清空筛选"按钮 */
	.result-tip {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		margin: 18rpx 0 0;
		padding: 0 6rpx;
	}
	.result-tip-text { font-size: 22rpx; color: #8F9492; }
	.result-tip-clear {
		padding: 6rpx 16rpx;
		border-radius: 999rpx;
		background-color: rgba(232, 194, 117, 0.10);
		border: 1rpx solid rgba(232, 194, 117, 0.30);
	}
	.result-tip-clear-text { font-size: 20rpx; color: #E8C275; font-weight: 600; }

	/* ============ 记录列表 ============ */
	.record-card {
		background-color: #1A1E1D;
		border-radius: 28rpx;
		border: 1rpx solid #2A2F2D;
		margin-top: 16rpx;
		box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
		overflow: hidden;
	}
	.record-row {
		flex-direction: row;
		align-items: center;
		padding: 24rpx 26rpx;
		border-bottom: 1rpx solid rgba(36, 40, 39, 0.6);
		position: relative;
	}
	.record-row-last { border-bottom-width: 0; }

	/* 左侧色条：与 jiude 主页面同款"靠色彩区分语义"思路 */
	.record-bar {
		width: 6rpx;
		height: 56rpx;
		border-radius: 6rpx;
		margin-right: 18rpx;
	}
	.record-bar-deposit { background-color: #2AA97A; }
	.record-bar-withdraw { background-color: #E8C275; }
	.record-bar-transfer { background-color: #B07AE8; }

	/* 类型图标圆形底：与色条同色呼应 */
	.record-icon {
		width: 56rpx;
		height: 56rpx;
		border-radius: 50%;
		align-items: center;
		justify-content: center;
		margin-right: 18rpx;
	}
	.record-icon-text { font-size: 30rpx; font-weight: 700; line-height: 36rpx; }
	.record-bar-deposit + .record-icon { background-color: rgba(42, 169, 122, 0.18); }
	.record-bar-withdraw + .record-icon { background-color: rgba(232, 194, 117, 0.18); }
	.record-bar-transfer + .record-icon { background-color: rgba(176, 122, 232, 0.18); }
	.record-icon-text-deposit { color: #2AA97A; }
	.record-icon-text-withdraw { color: #E8C275; }
	.record-icon-text-transfer { color: #B07AE8; }

	.record-main { flex: 1; flex-direction: column; }
	.record-source { font-size: 26rpx; color: #EDEFEE; font-weight: 500; }
	.record-date { font-size: 20rpx; color: #7E8281; margin-top: 6rpx; }

	.record-right { flex-direction: column; align-items: flex-end; }
	.record-amount { font-size: 30rpx; font-weight: 700; }
	.record-amount-deposit { color: #2AA97A; }
	.record-amount-withdraw { color: #E8C275; }
	.record-amount-transfer { color: #B07AE8; }
	.record-amount-label { font-size: 18rpx; color: #7E8281; margin-top: 4rpx; }

	/* 空态：filter 命中 0 条时的占位 */
	.record-empty {
		padding: 60rpx 0;
		align-items: center;
		justify-content: center;
	}
	.record-empty-text { font-size: 24rpx; color: #7E8281; }

	.footer-blank { height: 60rpx; }
</style>