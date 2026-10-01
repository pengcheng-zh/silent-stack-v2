<template>
	<scroll-view
		class="page"
		direction="vertical"
		:show-scrollbar="false"
		@scrolltolower="onLoadMore"
	>

		<!-- ============ 顶部三 Tab ============ -->
		<!-- 月度榜(type=0) / 新人榜(type=1) / 总榜(type=2) -->
		<view class="tabs">
			<view
				v-for="t in tabs"
				:key="t.key"
				class="tab"
				:class="{ 'tab-active': activeTab === t.key }"
				@tap="switchTab(t.key)"
			>
				<text class="tab-text" :class="{ 'tab-text-active': activeTab === t.key }">{{ t.label }}</text>
				<text class="tab-sub" :class="{ 'tab-sub-active': activeTab === t.key }">{{ t.sub }}</text>
				<view v-if="activeTab === t.key" class="tab-bar"></view>
			</view>
		</view>

		<!-- ============ 前三名领奖台 ============ -->
		<!-- 2-1-3 布局、底座高度差撑出仪式感 -->
		<view v-if="!firstLoading && top3.length === 3" class="podium">
			<view class="podium-col">
				<view class="podium-avatar podium-avatar-silver">
					<image v-if="avatarOf(top3[1]).length > 0" class="podium-avatar-img" :src="avatarOf(top3[1])" mode="aspectFill"></image>
					<text v-else class="podium-avatar-text">{{ nameOf(top3[1]).substring(0, 1) }}</text>
				</view>
				<text class="podium-name">{{ nameOf(top3[1]) }}</text>
				<text class="podium-points">{{ formatNum(valueOf(top3[1])) }}</text>
				<view class="podium-base podium-base-silver">
					<text class="podium-base-text">2</text>
				</view>
			</view>
			<view class="podium-col">
				<view class="podium-avatar podium-avatar-gold">
					<image v-if="avatarOf(top3[0]).length > 0" class="podium-avatar-img" :src="avatarOf(top3[0])" mode="aspectFill"></image>
					<text v-else class="podium-avatar-text">{{ nameOf(top3[0]).substring(0, 1) }}</text>
				</view>
				<text class="podium-name podium-name-1">{{ nameOf(top3[0]) }}</text>
				<text class="podium-points">{{ formatNum(valueOf(top3[0])) }}</text>
				<view class="podium-base podium-base-gold">
					<text class="podium-base-text">1</text>
				</view>
			</view>
			<view class="podium-col">
				<view class="podium-avatar podium-avatar-bronze">
					<image v-if="avatarOf(top3[2]).length > 0" class="podium-avatar-img" :src="avatarOf(top3[2])" mode="aspectFill"></image>
					<text v-else class="podium-avatar-text">{{ nameOf(top3[2]).substring(0, 1) }}</text>
				</view>
				<text class="podium-name">{{ nameOf(top3[2]) }}</text>
				<text class="podium-points">{{ formatNum(valueOf(top3[2])) }}</text>
				<view class="podium-base podium-base-bronze">
					<text class="podium-base-text">3</text>
				</view>
			</view>
		</view>

		<!-- ============ 首屏加载中 ============ -->
		<view v-if="firstLoading" class="state-box">
			<text class="state-text">加载中…</text>
		</view>

		<!-- ============ 完整榜单 ============ -->
		<view v-else-if="currentList.length > 0" class="list">
			<view class="list-head">
				<text class="list-title">完整榜单</text>
				<text class="list-count">已加载 {{ currentList.length }} 人</text>
			</view>
			<view
				v-for="(p, idx) in currentList"
				:key="activeTab + '-' + p.userId"
				class="row"
			>
				<view
					class="row-rank"
					:class="{
						'row-rank-gold': rankOf(idx) === 1,
						'row-rank-silver': rankOf(idx) === 2,
						'row-rank-bronze': rankOf(idx) === 3
					}"
				>
					<text
						class="row-rank-text"
						:class="{ 'row-rank-text-medal': rankOf(idx) <= 3 }"
					>{{ rankOf(idx) }}</text>
				</view>
				<view class="row-avatar">
					<image v-if="avatarOf(p).length > 0" class="row-avatar-img" :src="avatarOf(p)" mode="aspectFill"></image>
					<text v-else class="row-avatar-text">{{ nameOf(p).substring(0, 1) }}</text>
				</view>
				<view class="row-main">
					<view class="row-name-line">
						<text class="row-name">{{ nameOf(p) }}</text>
						<text v-if="p.levelLabel.length > 0" class="row-tier" :style="jiudeTierColorStyle(p.levelLabel)">{{ p.levelLabel }}</text>
					</view>
				</view>
				<view class="row-value">
					<text class="row-value-num">{{ formatNum(valueOf(p)) }}</text>
					<text class="row-value-unit">{{ tabUnit }}</text>
				</view>
			</view>

			<view class="more">
				<text class="more-text">{{ moreText }}</text>
			</view>
		</view>

		<!-- 空态 -->
		<view v-else class="state-box">
			<text class="state-text">暂无上榜玩家</text>
		</view>

		<!-- ============ 脚注：当前榜单的口径说明 ============ -->
		<view class="foot">
			<text class="foot-text">{{ footnote }}</text>
		</view>
	</scroll-view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { fetchJiudeRank, jiudeTierColorStyle } from '@/common/jiude-api'
import type { UserJiuDeVO } from '@/common/jiude-api'

/* ---------------- 三 Tab 元数据 ---------------- */
// 月度榜 type=0 / 新人榜 type=1 / 总榜 type=2
type TabKey = 'monthly' | 'newbie' | 'total'
type TabCell = { key : TabKey, label : string, sub : string, type : number }
const tabs : TabCell[] = [
	{ key: 'monthly', label: '月度榜', sub: '本月新增',     type: 0 },
	{ key: 'newbie',  label: '新人榜', sub: '注册7天内', 	type: 1 },
	{ key: 'total',   label: '总榜',   sub: '累计酒德币',   type: 2 }
]

const activeTab = ref<TabKey>('monthly')
const switchTab = (k : TabKey) : void => {
	if (activeTab.value == k) { return }
	activeTab.value = k
	load(true)
}

/* ---------------- 榜单数据（直接消费 UserJiuDeVO，不做映射） ---------------- */
const PAGE_LIMIT : number = 20
const currentList = ref<UserJiuDeVO[]>([])
const page = ref<number>(1)
const hasMore = ref<boolean>(true)
const firstLoading = ref<boolean>(true)
const loadingMore = ref<boolean>(false)

const typeOfTab = (k : TabKey) : number => {
	if (k == 'monthly') { return 0 }
	if (k == 'newbie') { return 1 }
	return 2
}

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
	fetchJiudeRank(typeOfTab(activeTab.value), target, PAGE_LIMIT).then((list : UserJiuDeVO[]) => {
		currentList.value = reset ? list : currentList.value.concat(list)
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

/* ---------------- 排序口径 / 文案 ---------------- */
// 月度榜 / 新人榜 展示月积分；总榜展示累计积分
const valueOf = (p : UserJiuDeVO) : number => {
	if (activeTab.value == 'total') { return p.points }
	if (activeTab.value == 'newbie') { return p.weekPoints }
	return p.monthPoints
}

const tabUnit = computed<string>((): string => {
	if (activeTab.value == 'total') { return '积分' }
	if (activeTab.value == 'newbie') { return '本周积分' }
	return '本月积分'
})

const footnote = computed<string>((): string => {
	if (activeTab.value == 'monthly') {
		return '月度榜按本月新增酒德币降序\n每月 1 日 00:00 重置'
	}
	if (activeTab.value == 'newbie') {
		return '新人榜仅展示注册 7 天内的玩家\n按本月新增酒德币降序'
	}
	return '总榜按累计酒德币降序，永久有效'
})

/* ---------------- 前三领奖台 ---------------- */
const top3 = computed<UserJiuDeVO[]>((): UserJiuDeVO[] => currentList.value.slice(0, 3))

/* ---------------- 展示工具 ---------------- */
const formatNum = (n : number) : string => {
	const s : string = (Number.isFinite(n) ? n : 0).toString()
	let out : string = ''
	let c : number = 0
	for (let i : number = s.length - 1; i >= 0; i--) {
		out = s.charAt(i) + out
		c++
		if (c % 3 == 0 && i > 0) { out = ',' + out }
	}
	return out
}

const nameOf = (p : UserJiuDeVO) : string => {
	const n : string = (p.username || '').toString()
	return n.length > 0 ? n : '玩家' + p.userId
}
const avatarOf = (p : UserJiuDeVO) : string => (p.avatar || '').toString()

// 行内名次：全局名次 = 已翻页偏移 + 行号
const rankOf = (idx : number) : number => idx + 1

onLoad((): void => {
	load(true)
})
</script>

<style scoped>
.page {
	min-height: 100vh;
	background-image: linear-gradient(180deg, #0E1110 0%, #0A0C0B 40%, #0B0D0C 100%);
	padding-bottom: 60rpx;
}

/* ============ 三 Tab ============ */
.tabs {
	flex-direction: row;
	background-color: #171A19;
	border-bottom: 1rpx solid #2A2F2D;
	padding: 0 16rpx;
}
.tab {
	flex: 1;
	flex-direction: column;
	align-items: center;
	padding: 22rpx 0 18rpx;
	position: relative;
}
.tab-text {
	font-size: 30rpx;
	color: #8F9492;
	font-weight: 600;
}
.tab-text-active {
	color: #EDEFEE;
}
.tab-sub {
	font-size: 20rpx;
	color: #4A4F4D;
	margin-top: 4rpx;
}
.tab-sub-active {
	color: #E8C275;
}
.tab-bar {
	position: absolute;
	left: 50%;
	bottom: 0;
	width: 56rpx;
	height: 4rpx;
	margin-left: -28rpx;
	background-color: #E8C275;
	border-radius: 2rpx;
}

/* ============ 领奖台 ============ */
.podium {
	flex-direction: row;
	align-items: flex-end;
	justify-content: space-between;
	padding: 20rpx 24rpx 24rpx;
	margin: 0 24rpx 16rpx;
	background-color: #1A1E1D;
	border-radius: 24rpx;
	border: 1rpx solid #2A2F2D;
	box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
}
.podium-col {
	flex: 1;
	flex-direction: column;
	align-items: center;
}
.podium-avatar {
	width: 96rpx;
	height: 96rpx;
	border-radius: 50%;
	background-color: #2A2F2D;
	align-items: center;
	justify-content: center;
	border-width: 4rpx;
	border-style: solid;
	overflow: hidden;
}
.podium-avatar-img {
	width: 96rpx;
	height: 96rpx;
	border-radius: 50%;
}
.podium-avatar-silver {
	border-color: #C7CDCB;
}
.podium-avatar-gold {
	border-color: #E8C275;
	box-shadow: 0 0 16rpx rgba(232, 194, 117, 0.35);
}
.podium-avatar-bronze {
	border-color: #B07AE8;
}
.podium-avatar-text {
	color: #EDEFEE;
	font-size: 36rpx;
	font-weight: 700;
}
.podium-name {
	font-size: 22rpx;
	color: #C7CDCB;
	margin-top: 10rpx;
	max-width: 140rpx;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}
.podium-name-1 {
	color: #EDEFEE;
	font-size: 24rpx;
	font-weight: 600;
}
.podium-points {
	font-size: 22rpx;
	color: #E8C275;
	font-weight: 600;
	margin-top: 2rpx;
}
.podium-base {
	width: 110rpx;
	height: 56rpx;
	border-top-left-radius: 12rpx;
	border-top-right-radius: 12rpx;
	margin-top: 12rpx;
	align-items: center;
	justify-content: center;
}
.podium-base-gold {
	background-image: linear-gradient(180deg, #F5D98E, #C89B3C);
}
.podium-base-silver {
	background-color: rgba(199, 205, 203, 0.18);
	border: 1rpx solid #C7CDCB;
}
.podium-base-bronze {
	background-color: rgba(176, 122, 232, 0.15);
	border: 1rpx solid #B07AE8;
}
.podium-base-text {
	font-size: 28rpx;
	font-weight: 700;
	color: #14100A;
}
.podium-base-silver .podium-base-text {
	color: #C7CDCB;
}
.podium-base-bronze .podium-base-text {
	color: #B07AE8;
}

/* ============ 加载 / 空态 ============ */
.state-box {
	align-items: center;
	padding: 120rpx 0 60rpx;
}
.state-text { font-size: 24rpx; color: #6E7573; }

/* ============ 完整榜单 ============ */
.list {
	margin: 0 24rpx;
}
.list-head {
	flex-direction: row;
	align-items: baseline;
	justify-content: space-between;
	padding: 16rpx 4rpx;
}
.list-title {
	font-size: 24rpx;
	color: #EDEFEE;
	font-weight: 700;
}
.list-count {
	font-size: 20rpx;
	color: #6E7573;
}

.row {
	flex-direction: row;
	align-items: center;
	padding: 18rpx 16rpx;
	background-color: #171A19;
	border-radius: 16rpx;
	border: 1rpx solid #2A2F2D;
	margin-bottom: 10rpx;
}
.row-rank {
	width: 56rpx;
	height: 56rpx;
	border-radius: 50%;
	background-color: #1F2322;
	align-items: center;
	justify-content: center;
	margin-right: 14rpx;
	flex-shrink: 0;
}
.row-rank-gold {
	background-color: rgba(232, 194, 117, 0.18);
}
.row-rank-silver {
	background-color: rgba(199, 205, 203, 0.15);
}
.row-rank-bronze {
	background-color: rgba(176, 122, 232, 0.15);
}
.row-rank-text {
	font-size: 24rpx;
	color: #8F9492;
	font-weight: 600;
}
.row-rank-text-medal {
	color: #EDEFEE;
	font-weight: 700;
}
.row-avatar {
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
	background-color: #2A2F2D;
	align-items: center;
	justify-content: center;
	margin-right: 14rpx;
	flex-shrink: 0;
	overflow: hidden;
}
.row-avatar-img {
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
}
.row-avatar-text {
	color: #C7CDCB;
	font-size: 26rpx;
	font-weight: 600;
}
.row-main {
	flex: 1;
	flex-direction: column;
	margin-right: 10rpx;
}
.row-name-line {
	flex-direction: row;
	align-items: center;
}
.row-name {
	font-size: 26rpx;
	color: #EDEFEE;
	font-weight: 600;
}
/* 等级标签：紧跟名字后，颜色与 jiude.vue 等级权益的 TIER_COLORS 保持一致 */
.row-tier {
	font-size: 20rpx;
	font-weight: 700;
	margin-left: 12rpx;
}
.row-value {
	flex-direction: column;
	align-items: flex-end;
}
.row-value-num {
	font-size: 26rpx;
	color: #EDEFEE;
	font-weight: 600;
}
.row-value-unit {
	font-size: 18rpx;
	color: #6E7573;
	margin-top: 2rpx;
}

/* 加载更多 */
.more {
	align-items: center;
	padding: 20rpx 0 8rpx;
}
.more-text { font-size: 21rpx; color: #4A4F4D; }

/* ============ 脚注 ============ */
.foot {
	padding: 32rpx 24rpx 16rpx;
}
.foot-text {
	font-size: 20rpx;
	color: #6E7573;
	line-height: 30rpx;
}
</style>
