<template>
	<scroll-view
		class="page"
		direction="vertical"
		:show-scrollbar="false"
		@scrolltolower="onLoadMore"
	>

		<!-- ============ 店铺头：名称 + ID ============ -->
		<view class="store-head">
			<text class="store-name">{{ storeName }}</text>
			<view class="store-id">
				<text class="store-id-text">#{{ storeId }}</text>
			</view>
		</view>

		<!-- ============ 账单汇总 ============ -->
		<view class="sum-card">
			<view class="sum-hero">
				<text class="sum-hero-label">今日充值</text>
				<view class="sum-hero-row">
					<text class="sum-hero-unit">¥</text>
					<text class="sum-hero-value">{{ fmtMoney(sumToday) }}</text>
				</view>
			</view>
			<view class="sum-divider"></view>
			<view class="sum-grid">
				<view class="sum-cell">
					<text class="sum-label">本月充值</text>
					<text class="sum-value">¥{{ fmtMoney(sumMonth) }}</text>
				</view>
				<view class="sum-cell-v"></view>
				<view class="sum-cell">
					<text class="sum-label">总充值</text>
					<text class="sum-value">¥{{ fmtMoney(sumTotal) }}</text>
				</view>
			</view>
			<view class="sum-grid sum-grid-line">
				<view class="sum-cell">
					<text class="sum-label">今日赠金</text>
					<text class="sum-value sum-value-gift">¥{{ fmtMoney(sumGiftBalance) }}</text>
				</view>
				<view class="sum-cell-v"></view>
				<view class="sum-cell">
					<text class="sum-label">今日赠票</text>
					<text class="sum-value sum-value-gift">{{ sumGiftTicket }} 张</text>
				</view>
			</view>
		</view>

		<!-- ============ 时间筛选（作用于充值记录列表） ============ -->
		<view class="filter-bar">
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

		<!-- ============ 账单记录列表 ============ -->
		<view v-else-if="records.length > 0" class="list">
			<view v-for="r in records" :key="r.id" class="rec">
				<view class="rec-icon" :class="isIncome(r.assumeType) ? 'rec-icon-in' : 'rec-icon-out'">
					<text class="rec-icon-text" :class="isIncome(r.assumeType) ? 'rec-type-in' : 'rec-type-out'">{{ isIncome(r.assumeType) ? '+' : '-' }}</text>
				</view>
				<view class="rec-main">
					<view class="rec-title-row">
						<text class="rec-title">{{ r.balanceTypeLabel || r.balanceType }}</text>
						<view class="rec-type-pill" :class="isIncome(r.assumeType) ? 'rec-pill-in' : 'rec-pill-out'">
							<text class="rec-type-text" :class="isIncome(r.assumeType) ? 'rec-type-in' : 'rec-type-out'">{{ r.assumeTypeName }}{{ r.operatorName ? '(' + r.operatorName + ')' : '' }}</text>
						</view>
					</view>
					<text class="rec-sub-name">{{ r.username }} #{{ r.userNo }}</text>
					<text class="rec-time">{{ r.createTime }}</text>
					<text v-if="r.remark && r.remark.length > 0" class="rec-remark">{{ r.remark }}</text>
				</view>
				<view class="rec-right">
					<text class="rec-amount" :class="isIncome(r.assumeType) ? 'rec-in' : 'rec-out'">
						{{ isIncome(r.assumeType) ? '+' : '-' }}{{ fmtMoney(Math.abs(numOf(r.amount))) }}
					</text>
					<text class="rec-balance">余额 {{ fmtMoney(numOf(r.balanceAfter)) }}</text>
				</view>
			</view>

			<view v-if="loadingMore" class="more">
				<text class="more-text">加载中…</text>
			</view>
			<view v-else-if="!hasMore" class="more">
				<text class="more-text">没有更多了</text>
			</view>
		</view>

		<!-- 空态 -->
		<view v-else class="empty">
			<text class="empty-text">该时间段暂无账单记录</text>
		</view>

		<view class="footer-blank"></view>
	</scroll-view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { fetchStoreBillingSummary } from '@/common/store-api'
import type { StoreBillingSummaryVO } from '@/common/store-api'
import { fetchStoreBalanceRecords } from '@/common/balance-api'
import type { BalanceRecord } from '@/common/balance-api'

/* ---------------- 页面参数（admin-store 账单按钮带入） ---------------- */
const storeId = ref<string>('')
const storeName = ref<string>('')
const storeType = ref<string>('')

/* ---------------- 账单汇总 ---------------- */
const summary = ref<StoreBillingSummaryVO | null>(null)
// uvue 模板对可空 ref 不收窄，集中到 computed 里做数字兜底（BigDecimal 可能序列化为 null）
const numOf = (v : any) : number => {
	const n : number = Number(v)
	return Number.isFinite(n) ? n : 0
}
const sumToday = computed<number>(() => summary.value != null ? numOf(summary.value.todayRecharge) : 0)
const sumMonth = computed<number>(() => summary.value != null ? numOf(summary.value.monthRecharge) : 0)
const sumTotal = computed<number>(() => summary.value != null ? numOf(summary.value.totalRecharge) : 0)
const sumGiftBalance = computed<number>(() => summary.value != null ? numOf(summary.value.todayGiftBalance) : 0)
const sumGiftTicket = computed<number>(() => summary.value != null ? numOf(summary.value.todayGiftTicket) : 0)

const loadSummary = () : void => {
	if (storeId.value.length == 0) { return }
	fetchStoreBillingSummary(storeId.value).then((vo : StoreBillingSummaryVO) => {
		summary.value = vo
	}).catch((e : any) => {
		uni.showToast({ title: e && e.message ? e.message : '汇总加载失败', icon: 'none' })
	})
}

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

/* ---------------- 账单记录列表（分页） ---------------- */
const PAGE_LIMIT = 20
const records = ref<BalanceRecord[]>([])
const page = ref(1)
const hasMore = ref(true)
const firstLoading = ref(true)
const loadingMore = ref(false)

const load = (reset : boolean) : void => {
	if (storeId.value.length == 0) { return }
	if (reset) {
		page.value = 1
		hasMore.value = true
		firstLoading.value = true
	} else {
		if (loadingMore.value || !hasMore.value) { return }
		loadingMore.value = true
	}
	const target : number = reset ? 1 : page.value + 1
	fetchStoreBalanceRecords(storeId.value, target, PAGE_LIMIT, startDate.value, endDate.value).then((list : BalanceRecord[]) => {
		records.value = reset ? list : records.value.concat(list)
		page.value = target
		// 以本页实际返回条数判断是否还有下一页
		hasMore.value = list.length >= PAGE_LIMIT
		firstLoading.value = false
		loadingMore.value = false
	}).catch((e : any) => {
		firstLoading.value = false
		loadingMore.value = false
		uni.showToast({ title: e && e.message ? e.message : '加载失败，请重试', icon: 'none' })
	})
}

const onLoadMore = () : void => {
	load(false)
}

/* H5 端页面整体滚动，scroll-view 的 @scrolltolower 不触发，靠页面触底加载（与 plaza/admin-store 同做法） */
onReachBottom((): void => {
	load(false)
})

/* ---------------- 展示工具（直接消费 VO，null 兜底） ---------------- */
const fmtMoney = (n : number) : string => {
	const abs : number = Math.abs(n)
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

// 解码 query 中的 storeName（H5 端有 decodeURIComponent；App/uvue 端可能不存在，降级返回原值）
const safeDecode = (v : string) : string => {
	// #ifdef H5
	try {
		const d : string | null = decodeURIComponent(v)
		return d != null ? d : v
	} catch (e) { return v }
	// #endif
	// #ifndef H5
	return v
	// #endif
}

// 收入类型：0-系统赠送 1-充值 3-店主赠送 4-管理员赠送 8-获奖
// 支出类型：2-参赛 5-店主扣除 6-管理员扣除 7-复活
const incomeTypes = new Set([0, 1, 3, 4, 8])
const isIncome = (assumeType : number) : boolean => incomeTypes.has(assumeType)

onLoad((q : any) => {
	storeId.value = ((q && q.storeId) || '').toString()
	storeName.value = safeDecode(((q && q.storeName) || '').toString())
	storeType.value = ((q && q.storeType) || '').toString()
	if (storeName.value.length > 0) { uni.setNavigationBarTitle({ title: storeName.value }) }
	loadSummary()
	load(true)
})
</script>

<style scoped>
.page {
	/* 固定高度：滚动限定在 scroll-view 内部，@scrolltolower 才能触发；
	   min-height 会让滚动冒到页面层，导致触底加载失效 */
	height: 100vh;
	background-color: #0B0D0C;
	padding: 24rpx;
	box-sizing: border-box;
}
/* #ifdef H5 */
/* H5 端 100vh 含导航栏与 tabBar，需扣除才是内容区真实高度 */
.page {
	height: calc(100vh - var(--window-top) - var(--window-bottom));
}
/* #endif */

/* ============ 店铺头 ============ */
.store-head {
	flex-direction: row;
	align-items: center;
	padding: 6rpx 8rpx 20rpx;
}
.store-name {
	font-size: 34rpx;
	color: #EDEFEE;
	font-weight: 700;
	margin-right: 14rpx;
}
.store-id {
	padding: 4rpx 12rpx;
	background-color: #1F2322;
	border-radius: 8rpx;
	border: 1rpx solid #2A2F2D;
}
.store-id-text {
	font-size: 18rpx;
	color: #6E7573;
}

/* ============ 账单汇总 ============ */
.sum-card {
	background-color: #1A1E1D;
	border: 1rpx solid #2A2F2D;
	border-radius: 24rpx;
	padding: 30rpx 26rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
}
.sum-hero {
	align-items: center;
}
.sum-hero-label {
	font-size: 22rpx;
	color: #6E7573;
}
.sum-hero-row {
	flex-direction: row;
	align-items: baseline;
	margin-top: 8rpx;
}
.sum-hero-unit {
	font-size: 26rpx;
	color: #E8C275;
	font-weight: 600;
	margin-right: 6rpx;
}
.sum-hero-value {
	font-size: 56rpx;
	color: #E8C275;
	font-weight: 700;
	line-height: 62rpx;
}
.sum-divider {
	height: 1rpx;
	background-color: #242827;
	margin: 26rpx 0;
}
.sum-grid {
	flex-direction: row;
	align-items: center;
}
.sum-grid-line {
	margin-top: 22rpx;
	padding-top: 22rpx;
	border-top: 1rpx solid #242827;
}
.sum-cell {
	flex: 1;
	align-items: center;
}
.sum-cell-v {
	width: 1rpx;
	height: 52rpx;
	background-color: #242827;
}
.sum-label {
	font-size: 21rpx;
	color: #6E7573;
}
.sum-value {
	font-size: 28rpx;
	color: #EDEFEE;
	font-weight: 700;
	margin-top: 8rpx;
}
.sum-value-gift { color: #2AA97A; }

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

/* ============ 加载 / 空态 ============ */
.state-box {
	align-items: center;
	padding: 120rpx 0 60rpx;
}
.state-text { font-size: 24rpx; color: #6E7573; }

/* ============ 充值记录列表 ============ */
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
.rec-title-row {
	flex-direction: row;
	align-items: center;
}
.rec-title {
	font-size: 26rpx;
	color: #EDEFEE;
	font-weight: 600;
}
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
.rec-sub-name {
	font-size: 22rpx;
	color: #9AA19E;
	margin-top: 6rpx;
}
.rec-time {
	font-size: 20rpx;
	color: #6E7573;
	margin-top: 4rpx;
}
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
.rec-amount {
	font-size: 28rpx;
	font-weight: 700;
}
.rec-in { color: #2AA97A; }
.rec-out { color: #FF6255; }
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
.empty-text { font-size: 24rpx; color: #6E7573; }

.footer-blank { height: 60rpx; }
</style>
