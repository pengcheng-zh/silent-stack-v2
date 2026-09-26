<template>
	<scroll-view
		class="page"
		direction="vertical"
		:show-scrollbar="false"
		@scrolltolower="onLoadMore"
	>

		<!-- ============ 时间筛选 ============ -->
		<view class="filter-bar">
			<!-- 快捷区间 -->
			<view class="chips">
				<view
					v-for="c in chips"
					:key="c.key"
					class="chip"
					:class="{ 'chip-on': activeChip == c.key }"
					@tap="onTapChip(c.key)"
				>
					<text class="chip-text" :class="{ 'chip-text-on': activeChip == c.key }">{{ c.label }}</text>
				</view>
			</view>
			<!-- 自定义日期区间 -->
			<view class="range-row">
				<picker mode="date" :value="startDate" @change="onStartChange">
					<view class="range-pick">
						<text class="range-text">{{ startDate.length > 0 ? startDate : '开始日期' }}</text>
					</view>
				</picker>
				<text class="range-sep">至</text>
				<picker mode="date" :value="endDate" @change="onEndChange">
					<view class="range-pick">
						<text class="range-text">{{ endDate.length > 0 ? endDate : '结束日期' }}</text>
					</view>
				</picker>
				<view class="range-reset" @tap="onTapReset">
					<text class="range-reset-text">重置</text>
				</view>
			</view>
		</view>

		<!-- ============ 首屏加载中 ============ -->
		<view v-if="firstLoading" class="state-box">
			<text class="state-text">加载中…</text>
		</view>

		<!-- ============ 记录列表 ============ -->
		<view v-else-if="records.length > 0" class="list">
			<view v-for="r in records" :key="r.id" class="rec">
				<view class="rec-icon" :class="r.amount >= 0 ? 'rec-icon-in' : 'rec-icon-out'">
					<text class="rec-icon-text">{{ typeIcon(r.assumeTypeName) }}</text>
				</view>
				<view class="rec-main">
					<view class="rec-title-row">
						<text class="rec-title">{{ r.balanceTypeLabel || r.balanceType }}</text>
						<view class="rec-type-pill" :class="r.amount >= 0 ? 'rec-pill-in' : 'rec-pill-out'">
							<text class="rec-type-text" :class="r.amount >= 0 ? 'rec-type-in' : 'rec-type-out'">{{ r.assumeTypeName }}</text>
						</view>
					</view>
					<text class="rec-store">{{ r.storeName }}</text>
					<text class="rec-sub">{{ r.createTime }}</text>
					<text v-if="r.remark.length > 0" class="rec-remark">{{ r.remark }}</text>
				</view>
				<view class="rec-right">
					<text class="rec-amount" :class="r.amount >= 0 ? 'rec-in' : 'rec-out'">
						{{ r.amount >= 0 ? '+' : '-' }}{{ formatNum(Math.abs(r.amount)) }}
					</text>
					<text class="rec-balance">余额 {{ formatNum(r.balanceAfter) }}</text>
				</view>
			</view>

			<!-- 加载更多 -->
			<view v-if="loadingMore" class="more">
				<text class="more-text">加载中…</text>
			</view>
			<view v-else-if="!hasMore" class="more">
				<text class="more-text">没有更多了</text>
			</view>
		</view>

		<!-- 空态 -->
		<view v-else class="empty">
			<text class="empty-icon">💸</text>
			<text class="empty-text">该时间段暂无消费记录</text>
		</view>

		<view class="footer-blank"></view>
	</scroll-view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchBalanceRecords } from '@/common/balance-api'
import type { BalanceRecord } from '@/common/balance-api'

/* ---------------- 列表状态 ---------------- */
const PAGE_LIMIT = 20
const records = ref<BalanceRecord[]>([])
const page = ref(1)
const hasMore = ref(true)
const firstLoading = ref(true)
const loadingMore = ref(false)

/* ---------------- 时间筛选 ---------------- */
const chips = [
	{ key: 'all', label: '全部' },
	{ key: '7d',  label: '近 7 天' },
	{ key: '30d', label: '近 30 天' }
]
const activeChip = ref('all')
const startDate = ref('')
const endDate = ref('')

// 把 Date 转成 YYYY-MM-DD（本地时区）
const fmtDay = (d : Date) : string => {
	const p = (n : number) : string => (n < 10 ? '0' + n.toString() : n.toString())
	return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
}

const onTapChip = (key : string) : void => {
	activeChip.value = key
	if (key == '7d') {
		const end = new Date()
		startDate.value = fmtDay(new Date(end.getTime() - 7 * 86400000))
		endDate.value = fmtDay(end)
	} else if (key == '30d') {
		const end = new Date()
		startDate.value = fmtDay(new Date(end.getTime() - 30 * 86400000))
		endDate.value = fmtDay(end)
	} else {
		startDate.value = ''
		endDate.value = ''
	}
	load(true)
}

const onStartChange = (e : any) : void => {
	startDate.value = (e.detail.value || '').toString()
	activeChip.value = 'all'
	load(true)
}
const onEndChange = (e : any) : void => {
	endDate.value = (e.detail.value || '').toString()
	activeChip.value = 'all'
	load(true)
}
const onTapReset = () : void => {
	if (activeChip.value == 'all' && startDate.value.length == 0 && endDate.value.length == 0) { return }
	activeChip.value = 'all'
	startDate.value = ''
	endDate.value = ''
	load(true)
}

/* ---------------- 数据加载 ---------------- */
const load = (reset : boolean) : void => {
	if (reset) {
		page.value = 1
		hasMore.value = true
		firstLoading.value = true
	} else {
		if (loadingMore.value || !hasMore.value) { return }
		loadingMore.value = true
	}
	const target : number = reset ? 1 : page.value + 1
	fetchBalanceRecords(target, PAGE_LIMIT, startDate.value, endDate.value).then((list) => {
		if (reset) {
			records.value = list
		} else {
			records.value = records.value.concat(list)
		}
		page.value = target
		hasMore.value = list.length >= PAGE_LIMIT
		firstLoading.value = false
		loadingMore.value = false
	}).catch((e : any) => {
		firstLoading.value = false
		loadingMore.value = false
		uni.showToast({ title: e && e.message ? e.message : '加载失败，请重试', icon: 'none' })
	})
}

onMounted(() => { load(true) })

const onLoadMore = () : void => {
	load(false)
}

/* ---------------- 工具 ---------------- */
const typeIcon = (typeName : string) : string => {
	return typeName.length > 0 ? typeName.substring(0, 1) : '账'
}

const formatNum = (n : number) : string => {
	const v : number = Number(n) || 0
	const abs : number = Math.abs(v)
	const fixed : string = Number.isInteger(abs) ? abs.toString() : abs.toFixed(2)
	const s : string = fixed
	let out : string = ''
	let c : number = 0
	for (let i : number = s.length - 1; i >= 0; i--) {
		out = s.charAt(i) + out
		c++
		if (c % 3 == 0 && i > 0 && s.charAt(i - 1) != '.') { out = ',' + out }
	}
	return out
}
</script>

<style scoped>
.page {
	min-height: 100vh;
	background-color: #0B0D0C;
	padding: 24rpx;
	box-sizing: border-box;
}

/* ============ 加载 / 空态 ============ */
.state-box {
	align-items: center;
	padding: 160rpx 0 80rpx;
}
.state-text { font-size: 24rpx; color: #6E7573; }

/* ============ 筛选 ============ */
.filter-bar {
	background-color: #171A19;
	border: 1rpx solid #242827;
	border-radius: 20rpx;
	padding: 20rpx;
	margin-bottom: 20rpx;
}
.chips { flex-direction: row; }
.chip {
	padding: 10rpx 24rpx;
	border-radius: 999rpx;
	background-color: #0F1211;
	border: 1rpx solid #2A2F2D;
	margin-right: 14rpx;
}
.chip-on {
	background-color: #E8C2751F;
	border-color: #E8C27580;
}
.chip-text { font-size: 22rpx; color: #9AA19E; }
.chip-text-on { color: #E8C275; font-weight: 600; }

.range-row {
	flex-direction: row;
	align-items: center;
	margin-top: 18rpx;
}
.range-pick {
	height: 64rpx;
	background-color: #0F1211;
	border: 1rpx solid #2A2F2D;
	border-radius: 12rpx;
	padding: 0 20rpx;
	align-items: center;
	justify-content: center;
}
.range-text { font-size: 23rpx; color: #C9CFCC; line-height: 64rpx; }
.range-sep { font-size: 22rpx; color: #6E7573; margin: 0 14rpx; }
.range-reset { margin-left: auto; padding: 8rpx 10rpx; }
.range-reset-text { font-size: 23rpx; color: #6E7573; }

/* ============ 记录列表 ============ */
.list {
	background-color: #1A1E1D;
	border: 1rpx solid #2A2F2D;
	border-radius: 24rpx;
	padding: 0 26rpx;
	overflow: hidden;
	box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
}
.rec {
	flex-direction: row;
	align-items: flex-start;
	padding: 24rpx 0;
	border-bottom: 1rpx solid rgba(36, 40, 39, 0.6);
}
.rec:last-child { border-bottom-width: 0; }
.rec-icon {
	width: 64rpx;
	height: 64rpx;
	border-radius: 16rpx;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.rec-icon-out { background-color: rgba(255, 98, 85, 0.14); }
.rec-icon-in { background-color: rgba(42, 169, 122, 0.14); }
.rec-icon-text { font-size: 26rpx; font-weight: 700; color: #EDEFEE; }
.rec-main { flex: 1; flex-direction: column; margin-left: 18rpx; }
.rec-title-row { flex-direction: row; align-items: center; }
.rec-title { font-size: 26rpx; color: #EDEFEE; font-weight: 600; }
.rec-type-pill {
	margin-left: 12rpx;
	padding: 2rpx 12rpx;
	border-radius: 999rpx;
	background-color: rgba(126, 130, 129, 0.18);
}
.rec-pill-in { background-color: rgba(42, 169, 122, 0.14); }
.rec-pill-out { background-color: rgba(255, 98, 85, 0.14); }
.rec-type-text { font-size: 18rpx; color: #9AA19E; line-height: 26rpx; }
.rec-type-in { color: #2AA97A; }
.rec-type-out { color: #FF6255; }
.rec-store { font-size: 22rpx; color: #9AA19E; margin-top: 6rpx; }
.rec-sub { font-size: 20rpx; color: #6E7573; margin-top: 4rpx; }
.rec-remark {
	font-size: 20rpx;
	color: #9AA19E;
	margin-top: 8rpx;
	padding: 6rpx 14rpx;
	background-color: #0F1211;
	border-radius: 8rpx;
}
.rec-right {
	flex-direction: column;
	align-items: flex-end;
	margin-left: 14rpx;
	flex-shrink: 0;
}
.rec-amount { font-size: 28rpx; font-weight: 700; }
.rec-out { color: #FF6255; }
.rec-in { color: #2AA97A; }
.rec-balance { font-size: 19rpx; color: #4A4F4D; margin-top: 6rpx; }

/* 加载更多 */
.more {
	align-items: center;
	padding: 20rpx 0 24rpx;
}
.more-text { font-size: 21rpx; color: #4A4F4D; }

/* ============ 空态 ============ */
.empty {
	align-items: center;
	padding: 120rpx 0 60rpx;
}
.empty-icon { font-size: 64rpx; }
.empty-text { font-size: 24rpx; color: #6E7573; margin-top: 20rpx; }

.footer-blank { height: 60rpx; }
</style>
