<template>
	<scroll-view
		class="page"
		direction="vertical"
		:show-scrollbar="false"
		@scrolltolower="onLoadMore"
	>
		<!-- ============ 时间范围筛选 ============ -->
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

		<!-- ============ 命中条数提示 ============ -->
		<view class="result-tip">
			<text class="result-tip-text">命中 {{ records.length }} 条记录</text>
			<view v-if="range != 'all'" class="result-tip-clear" @tap="onTapClear">
				<text class="result-tip-clear-text">清空筛选</text>
			</view>
		</view>

		<!-- ============ 首屏加载中 ============ -->
		<view v-if="firstLoading" class="state-box">
			<text class="state-text">加载中…</text>
		</view>

		<!-- ============ 记录列表 ============ -->
		<view v-else class="record-card">
			<view
				v-for="(r, ri) in records"
				:key="r.id"
				class="record-row"
				:class="{ 'record-row-last': ri == records.length - 1 }"
			>
				<view class="record-bar" :class="recordBarClass(r.type)"></view>
				<view class="record-icon" :class="recordIconClass(r.type)">
					<text class="record-icon-text" :class="recordTextClass(r.type)">{{ recordSymbol(r.type) }}</text>
				</view>
				<view class="record-main">
					<text class="record-source">{{ recordLabel(r.type) }}</text>
					<text v-if="r.storeName != null && r.storeName != ''" class="record-store">{{ r.storeName }}</text>
					<text v-if="r.operatorName != null && r.operatorName != ''" class="record-operator">操作人 {{ r.operatorName }}</text>
					<text class="record-date">{{ r.createTime }}</text>
				</view>
				<view class="record-right">
					<text class="record-amount" :class="recordTextClass(r.type)">{{ recordSign(r.type) }}{{ r.points }}</text>
					<text class="record-amount-label">变动后 {{ r.pointsAfter }}</text>
				</view>
			</view>

			<view v-if="records.length == 0" class="record-empty">
				<text class="record-empty-text">该筛选下暂无记录</text>
			</view>
		</view>

		<!-- 加载更多脚注 -->
		<view v-if="!firstLoading && records.length > 0" class="more">
			<text class="more-text">{{ moreText }}</text>
		</view>

		<view class="footer-blank"></view>
	</scroll-view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { fetchJiudeBilling } from '@/common/jiude-api'
import type { PointsRecordVO } from '@/common/jiude-api'

/* ---------------- 数据（直接消费后端 PointsRecordVO，不做映射） ---------------- */
const PAGE_LIMIT : number = 20
const records = ref<PointsRecordVO[]>([])
const page = ref<number>(1)
const hasMore = ref<boolean>(true)
const firstLoading = ref<boolean>(true)
const loadingMore = ref<boolean>(false)

// 从 url 取 userId，管理端查看指定用户的酒德账单
const targetUserId = ref<number>(0)

/* ---------------- 时间范围筛选（→ startDate/endDate 传服务端） ---------------- */
type RangeKey = 'all' | 'today' | 'week' | 'month' | '30days'
type RangeCell = { key : RangeKey, label : string }
const ranges : RangeCell[] = [
	{ key: 'all',     label: '全部' },
	{ key: 'today',   label: '今日' },
	{ key: 'week',    label: '本周' },
	{ key: 'month',   label: '本月' },
	{ key: '30days',  label: '近 30 日' }
]
const range = ref<RangeKey>('all')
const startDate = ref<string>('')
const endDate = ref<string>('')

// 把 Date 转成 YYYY-MM-DD（本地时区）
const fmtDay = (d : Date) : string => {
	const p = (n : number) : string => (n < 10 ? '0' + n.toString() : n.toString())
	return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
}

const setRange = (k : RangeKey) : void => {
	range.value = k
	const now : Date = new Date()
	if (k == 'today') {
		startDate.value = fmtDay(now)
		endDate.value = fmtDay(now)
	} else if (k == 'week') {
		startDate.value = fmtDay(new Date(now.getTime() - 6 * 86400000))
		endDate.value = fmtDay(now)
	} else if (k == 'month') {
		startDate.value = fmtDay(new Date(now.getFullYear(), now.getMonth(), 1))
		endDate.value = fmtDay(now)
	} else if (k == '30days') {
		startDate.value = fmtDay(new Date(now.getTime() - 29 * 86400000))
		endDate.value = fmtDay(now)
	} else {
		startDate.value = ''
		endDate.value = ''
	}
	load(true)
}

// 一键清空筛选，回到"全量记录"视图
const onTapClear = () : void => {
	setRange('all')
}

/* ---------------- 数据加载（分页） ---------------- */
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
	fetchJiudeBilling(targetUserId.value, target, PAGE_LIMIT, startDate.value, endDate.value).then((list : PointsRecordVO[]) => {
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

/* H5 端页面整体滚动，scroll-view 的 @scrolltolower 不触发，靠页面触底加载 */
onReachBottom((): void => {
	load(false)
})

const moreText = computed<string>((): string => {
	if (loadingMore.value) { return '加载中…' }
	if (!hasMore.value) { return '没有更多了' }
	return '上拉加载更多'
})

onLoad((q : any) => {
	targetUserId.value = Number((q && q.userId) || 0)
	if (targetUserId.value > 0) { uni.setNavigationBarTitle({ title: '用户酒德账单' }) }
	load(true)
})

/* ---------------- 记录：符号 / 文案 / 配色 ---------------- */
// type: 0 保存积分(+) / 1 兑换积分(−) / 2 充值(+) / 3 消费(−)
const recordSymbol = (type : number) : string => {
	if (type == 0) { return '存' }
	if (type == 1) { return '兑' }
	if (type == 2) { return '充' }
	return '消'
}

const recordSign = (type : number) : string => {
	if (type == 0 || type == 2) { return '+' }
	return '−'
}

const recordLabel = (type : number) : string => {
	if (type == 0) { return '保存积分' }
	if (type == 1) { return '兑换积分' }
	if (type == 2) { return '充值' }
	return '消费'
}

// 配色：保存积分绿 / 兑换积分金 / 充值蓝 / 消费红
const recordBarClass = (type : number) : string => {
	if (type == 0) { return 'record-bar-save' }
	if (type == 1) { return 'record-bar-redeem' }
	if (type == 2) { return 'record-bar-recharge' }
	return 'record-bar-consume'
}
const recordIconClass = (type : number) : string => {
	if (type == 0) { return 'record-icon-save' }
	if (type == 1) { return 'record-icon-redeem' }
	if (type == 2) { return 'record-icon-recharge' }
	return 'record-icon-consume'
}
const recordTextClass = (type : number) : string => {
	if (type == 0) { return 'record-text-save' }
	if (type == 1) { return 'record-text-redeem' }
	if (type == 2) { return 'record-text-recharge' }
	return 'record-text-consume'
}
</script>

<style scoped>
	/* 根 scroll-view 必须固定高度：滚动发生在内部，@scrolltolower 才能触发；
	   min-height 会让滚动冒到页面层，导致触底加载失效 */
	.page {
		box-sizing: border-box;
		background-image: linear-gradient(180deg, #0E1110 0%, #0A0C0B 40%, #0B0D0C 100%);
		height: 100vh;
		padding: 0 24rpx;
	}
	/* #ifdef H5 */
	/* H5 端 100vh 含导航栏与 tabBar，需扣除才是内容区真实高度 */
	.page {
		height: calc(100vh - var(--window-top) - var(--window-bottom));
	}
	/* #endif */

	/* ============ 筛选块：时间范围 ============ */
	.filter-block {
		margin: 20rpx 0 0;
	}
	.filter-block:first-child {
		margin-top: 8rpx;
	}
	.filter-pills {
		flex-direction: row;
		align-items: stretch;
		padding: 0 4rpx;
	}
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

	/* ============ 加载 / 更多脚注 ============ */
	.state-box {
		align-items: center;
		padding: 120rpx 0 60rpx;
	}
	.state-text { font-size: 24rpx; color: #6E7573; }
	.more {
		align-items: center;
		padding: 20rpx 0 8rpx;
	}
	.more-text { font-size: 21rpx; color: #4A4F4D; }

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

	/* 左侧色条：保存积分绿 / 兑换积分金 / 充值蓝 / 消费红 */
	.record-bar {
		width: 6rpx;
		height: 56rpx;
		border-radius: 6rpx;
		margin-right: 18rpx;
	}
	.record-bar-save { background-color: #2AA97A; }
	.record-bar-redeem { background-color: #E8C275; }
	.record-bar-recharge { background-color: #7AB6F2; }
	.record-bar-consume { background-color: #FF6255; }

	/* 类型图标圆形底：与色条同色呼应 */
	.record-icon {
		width: 56rpx;
		height: 56rpx;
		border-radius: 50%;
		align-items: center;
		justify-content: center;
		margin-right: 18rpx;
	}
	.record-icon-save { background-color: rgba(42, 169, 122, 0.18); }
	.record-icon-redeem { background-color: rgba(232, 194, 117, 0.18); }
	.record-icon-recharge { background-color: rgba(122, 182, 242, 0.18); }
	.record-icon-consume { background-color: rgba(255, 98, 85, 0.18); }
	.record-icon-text { font-size: 26rpx; font-weight: 700; line-height: 32rpx; }
	.record-text-save { color: #2AA97A; }
	.record-text-redeem { color: #E8C275; }
	.record-text-recharge { color: #7AB6F2; }
	.record-text-consume { color: #FF6255; }

	.record-main { flex: 1; flex-direction: column; }
	.record-source { font-size: 26rpx; color: #EDEFEE; font-weight: 500; }
	.record-store { font-size: 22rpx; color: #9AA19E; margin-top: 6rpx; }
	.record-operator { font-size: 20rpx; color: #7AB6F2; margin-top: 4rpx; }
	.record-date { font-size: 20rpx; color: #7E8281; margin-top: 4rpx; }

	.record-right { flex-direction: column; align-items: flex-end; }
	.record-amount { font-size: 30rpx; font-weight: 700; }
	.record-amount-label { font-size: 18rpx; color: #7E8281; margin-top: 4rpx; }

	/* 空态 */
	.record-empty {
		padding: 60rpx 0;
		align-items: center;
		justify-content: center;
	}
	.record-empty-text { font-size: 24rpx; color: #7E8281; }

	.footer-blank { height: 60rpx; }
</style>
