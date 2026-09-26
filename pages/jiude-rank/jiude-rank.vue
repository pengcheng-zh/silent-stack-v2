<template>
	<scroll-view class="page" direction="vertical" :show-scrollbar="false">

		<!-- ============ 顶部三 Tab ============ -->
		<!-- 月度榜 / 新人榜 / 总榜：金色下标线 + 副标题描述排序口径 -->
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

		<!-- ============ "我"的状态卡 ============ -->
		<!-- 三 Tab 共享：右侧排名随当前 Tab 变化（newbie 时显示"未上榜"） -->
		<view class="me-card">
			<view class="me-left">
				<view class="me-avatar">
					<text class="me-avatar-text">{{ me.name.substring(0, 1) }}</text>
				</view>
				<view class="me-info">
					<text class="me-name">{{ me.name }}</text>
					<text class="me-tier" :style="meTierStyle">{{ meTierText }}</text>
					<text class="me-stats">本月 {{ formatNum(me.monthPoints) }}  ·  累计 {{ formatNum(me.totalPoints) }}</text>
				</view>
			</view>
			<view class="me-right">
				<text class="me-rank-num">{{ meRankText }}</text>
				<text class="me-rank-label">{{ activeTabLabel }}排名</text>
			</view>
		</view>

		<!-- ============ 前三名领奖台 ============ -->
		<!-- 月度 / 总 / 新人 各展示前三；2-1-3 布局、底座高度差撑出仪式感 -->
		<view v-if="top3.length === 3" class="podium">
			<view class="podium-col">
				<view class="podium-avatar podium-avatar-silver">
					<text class="podium-avatar-text">{{ top3[1].name.substring(0, 1) }}</text>
				</view>
				<text class="podium-name">{{ top3[1].name }}</text>
				<text class="podium-points">{{ formatNum(valueOf(top3[1])) }}</text>
				<view class="podium-base podium-base-silver">
					<text class="podium-base-text">2</text>
				</view>
			</view>
			<view class="podium-col">
				<view class="podium-avatar podium-avatar-gold">
					<text class="podium-avatar-text">{{ top3[0].name.substring(0, 1) }}</text>
				</view>
				<text class="podium-name podium-name-1">{{ top3[0].name }}</text>
				<text class="podium-points">{{ formatNum(valueOf(top3[0])) }}</text>
				<view class="podium-base podium-base-gold">
					<text class="podium-base-text">1</text>
				</view>
			</view>
			<view class="podium-col">
				<view class="podium-avatar podium-avatar-bronze">
					<text class="podium-avatar-text">{{ top3[2].name.substring(0, 1) }}</text>
				</view>
				<text class="podium-name">{{ top3[2].name }}</text>
				<text class="podium-points">{{ formatNum(valueOf(top3[2])) }}</text>
				<view class="podium-base podium-base-bronze">
					<text class="podium-base-text">3</text>
				</view>
			</view>
		</view>

		<!-- ============ 完整榜单 ============ -->
		<!-- 包含前三（领奖台已展示头像 / 名字），这里复用同一条目便于阅读 -->
		<view class="list">
			<view class="list-head">
				<text class="list-title">完整榜单</text>
				<text class="list-count">共 {{ currentList.length }} 人</text>
			</view>
			<view
				v-for="(p, idx) in currentList"
				:key="activeTab + '-' + p.id"
				class="row"
				:class="{ 'row-me': p.isMe }"
				@tap="onRowTap(p)"
			>
				<view
					class="row-rank"
					:class="{
						'row-rank-gold': idx === 0,
						'row-rank-silver': idx === 1,
						'row-rank-bronze': idx === 2,
						'row-rank-me': p.isMe
					}"
				>
					<text
						class="row-rank-text"
						:class="{ 'row-rank-text-medal': idx < 3, 'row-rank-text-me': p.isMe }"
					>{{ idx + 1 }}</text>
				</view>
				<view class="row-avatar">
					<text class="row-avatar-text">{{ p.name.substring(0, 1) }}</text>
				</view>
				<view class="row-main">
					<view class="row-name-line">
						<text class="row-name">{{ p.name }}</text>
						<view v-if="p.isMe" class="me-tag">
							<text class="me-tag-text">我</text>
						</view>
					</view>
					<view class="row-sub-line">
						<text class="row-city">{{ p.city }}</text>
						<text class="row-tier" :style="tierStyle(p.tierKey)">{{ tierLabel(p) }}</text>
						<text v-if="activeTab === 'newbie'" class="row-join">加入 {{ p.joinDate }}</text>
					</view>
				</view>
				<view class="row-value">
					<text class="row-value-num" :class="{ 'row-value-me': p.isMe }">{{ formatNum(valueOf(p)) }}</text>
					<text class="row-value-unit">{{ tabUnit }}</text>
				</view>
			</view>
		</view>

		<!-- ============ 脚注：当前榜单的口径说明 ============ -->
		<view class="foot">
			<text class="foot-text">{{ footnote }}</text>
		</view>
	</scroll-view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
	JIUDE_RANK_MONTHLY,
	JIUDE_RANK_NEWBIE,
	JIUDE_RANK_TOTAL,
	ME_PLAYER,
	formatNum
} from '@/common/jiude-rank-data'
import type { JiudeRankPlayer } from '@/common/types'

/* ---------------- 三 Tab 元数据 ---------------- */
// 三个榜单对应的 key；切换 tab 时 currentList / valueOf / footnote / tabUnit 都跟着变
type TabKey = 'monthly' | 'newbie' | 'total'
const tabs : { key : TabKey, label : string, sub : string }[] = [
	{ key: 'monthly', label: '月度榜', sub: '本月新增' },
	{ key: 'newbie',  label: '新人榜', sub: '注册 30 天内' },
	{ key: 'total',   label: '总榜',   sub: '累计酒德币' }
]

const activeTab = ref<TabKey>('monthly')
const switchTab = (k : TabKey) : void => { activeTab.value = k }

/* ---------------- 当前榜单 / 排序口径 ---------------- */
// 月度榜 / 新人榜 排序键 = monthPoints；总榜 = totalPoints
const valueOf = (p : JiudeRankPlayer) : number => {
	if (activeTab.value == 'total') { return p.totalPoints }
	return p.monthPoints
}

const tabUnit = computed<string>(() : string => {
	if (activeTab.value == 'total') { return '积分' }
	return '本月积分'
})

const activeTabLabel = computed<string>(() : string => {
	const t : { key : TabKey, label : string, sub : string } | undefined
		= tabs.find((x : { key : TabKey, label : string, sub : string }) : boolean => x.key === activeTab.value)
	return t ? t.label : ''
})

const footnote = computed<string>(() : string => {
	if (activeTab.value == 'monthly') {
		return '月度榜按本月新增酒德币降序\n每月 1 日 00:00 重置'
	}
	if (activeTab.value == 'newbie') {
		return '新人榜仅展示注册 30 天内的玩家\n按本月新增酒德币降序'
	}
	return '总榜按累计酒德币降序，永久有效'
})

const currentList = computed<JiudeRankPlayer[]>(() : JiudeRankPlayer[] => {
	if (activeTab.value == 'monthly') { return JIUDE_RANK_MONTHLY }
	if (activeTab.value == 'newbie')  { return JIUDE_RANK_NEWBIE }
	return JIUDE_RANK_TOTAL
})

/* ---------------- 前三 / "我"派生数据 ---------------- */
// 领奖台恒取当前 Tab 的前 3 位
const top3 = computed<JiudeRankPlayer[]>(() : JiudeRankPlayer[] => currentList.value.slice(0, 3))

// 从 jiude-rank-data 直接复用，与 ME 在数据数组里的对象是同一份引用
const me : JiudeRankPlayer = ME_PLAYER

// 我在当前榜单的名次（找不到 = 未上榜，多用于新人榜）
const myRankInTab = computed<number | null>(() : number | null => {
	const list : JiudeRankPlayer[] = currentList.value
	for (let i : number = 0; i < list.length; i++) {
		if (list[i].isMe) { return i + 1 }
	}
	return null
})

const meRankText = computed<string>(() : string => {
	const r : number | null = myRankInTab.value
	return r == null ? '未上榜' : ('No.' + r.toString())
})

/* ---------------- 段位色 / 文案 ---------------- */
// 本页面段位色直接走静态映射，避免额外依赖
const TIER_COLORS : { [k : string] : string } = {
	diamond: '#7AB6F2',
	club:    '#7AC79A',
	heart:   '#FF6255',
	spade:   '#C7CDCB',
	crown:   '#E8C275',
	legend:  '#FFE9B8'
}
const TIER_NAMES : { [k : string] : string } = {
	diamond: '方片',
	club:    '梅花',
	heart:   '红心',
	spade:   '黑桃',
	crown:   '王座',
	legend:  '传奇'
}

// tierLevel 1=I 最高 / 6=V 最低：转罗马数字 I ~ VI
const ROMAN : string[] = ['I', 'II', 'III', 'IV', 'V', 'VI']

const tierStyle = (key : string) : string => 'color:' + (TIER_COLORS[key] || '#C7CDCB') + ';'

const tierLabel = (p : JiudeRankPlayer) : string => {
	const suit : string = (TIER_NAMES[p.tierKey] || '方片')
	const roman : string = ROMAN[p.tierLevel - 1] || p.tierLevel.toString()
	return suit + ' ' + roman
}

const meTierText = computed<string>(() : string => tierLabel(me))
const meTierStyle = computed<string>(() : string => tierStyle(me.tierKey))

/* ---------------- 交互 ---------------- */
// 点击其他玩家暂时占位；详情页接好后只换这一处
const onRowTap = (p : JiudeRankPlayer) : void => {
	if (p.isMe) { return }
	uni.showToast({ title: p.name + ' · 即将上线', icon: 'none' })
}
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

/* ============ 我 ============ */
.me-card {
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	margin: 24rpx 24rpx 16rpx;
	padding: 22rpx 24rpx;
	background-color: #171A19;
	border-radius: 20rpx;
	border: 1rpx solid #2A2F2D;
}
.me-left {
	flex: 1;
	flex-direction: row;
	align-items: center;
}
.me-avatar {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	background-image: linear-gradient(135deg, #E8C275, #C89B3C);
	align-items: center;
	justify-content: center;
	margin-right: 18rpx;
}
.me-avatar-text {
	color: #14100A;
	font-size: 32rpx;
	font-weight: 700;
}
.me-info {
	flex: 1;
	flex-direction: column;
}
.me-name {
	font-size: 28rpx;
	color: #EDEFEE;
	font-weight: 700;
}
.me-tier {
	font-size: 22rpx;
	margin-top: 4rpx;
	font-weight: 600;
}
.me-stats {
	font-size: 22rpx;
	color: #8F9492;
	margin-top: 6rpx;
}
.me-right {
	flex-direction: column;
	align-items: flex-end;
	min-width: 140rpx;
}
.me-rank-num {
	font-size: 30rpx;
	color: #E8C275;
	font-weight: 700;
}
.me-rank-label {
	font-size: 20rpx;
	color: #8F9492;
	margin-top: 2rpx;
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
	text-overflow: ellipsis;
	lines: 1;
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
.row-me {
	background-color: rgba(232, 194, 117, 0.08);
	border-color: rgba(232, 194, 117, 0.4);
}
.row-rank {
	width: 56rpx;
	height: 56rpx;
	border-radius: 50%;
	background-color: #1F2322;
	align-items: center;
	justify-content: center;
	margin-right: 14rpx;
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
.row-rank-me {
	background-color: rgba(232, 194, 117, 0.25);
	border: 2rpx solid #E8C275;
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
.row-rank-text-me {
	color: #E8C275;
}
.row-avatar {
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
	background-color: #2A2F2D;
	align-items: center;
	justify-content: center;
	margin-right: 14rpx;
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
.me-tag {
	margin-left: 10rpx;
	padding: 0 8rpx;
	background-color: rgba(232, 194, 117, 0.18);
	border-radius: 6rpx;
}
.me-tag-text {
	font-size: 18rpx;
	color: #E8C275;
	font-weight: 600;
}
.row-sub-line {
	flex-direction: row;
	align-items: center;
	margin-top: 4rpx;
}
.row-city {
	font-size: 20rpx;
	color: #6E7573;
}
.row-tier {
	font-size: 20rpx;
	margin-left: 10rpx;
	font-weight: 600;
}
.row-join {
	font-size: 20rpx;
	color: #6E7573;
	margin-left: 10rpx;
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
.row-value-me {
	color: #E8C275;
}
.row-value-unit {
	font-size: 18rpx;
	color: #6E7573;
	margin-top: 2rpx;
}

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