<template>
	<view class="wrap">

		<!-- ============ 顶栏 Tab：固定，不随列表滚动 ============ -->
		<view class="topbar">
			<view class="tab-row">
				<view
					class="tab-cell"
					:class="{ 'tab-cell-on': tab == 'deposit' }"
					@tap="tab = 'deposit'"
				>
					<text class="tab-text" :class="{ 'tab-text-on': tab == 'deposit' }">存积分申请</text>
					<view class="tab-badge" :class="{ 'tab-badge-on': tab == 'deposit' }">
						<text class="tab-badge-text" :class="{ 'tab-badge-on-text': tab == 'deposit' }">{{ depositList.length }}</text>
					</view>
				</view>
				<view
					class="tab-cell"
					:class="{ 'tab-cell-on': tab == 'withdraw' }"
					@tap="tab = 'withdraw'"
				>
					<text class="tab-text" :class="{ 'tab-text-on': tab == 'withdraw' }">取积分申请</text>
					<view class="tab-badge" :class="{ 'tab-badge-on': tab == 'withdraw' }">
						<text class="tab-badge-text" :class="{ 'tab-badge-on-text': tab == 'withdraw' }">{{ withdrawList.length }}</text>
					</view>
				</view>
			</view>
		</view>

		<scroll-view class="page" direction="vertical" :show-scrollbar="false" @scrolltolower="onLoadMore">

		<!-- ============ 当前列表 ============ -->
		<view v-for="row in currentList" :key="row.id" class="acard">

			<!-- 顶部：头像 + 名称/ID + 状态徽标 -->
			<view class="acard-top">
				<view class="avatar">
					<image class="avatar-img" :src="resolveFileUrl(row.avatar)" mode="aspectFill" />
				</view>
				<view class="head">
					<text class="a-name">{{ row.username }}</text>
					<text class="a-id">{{ row.userNo }}</text>
				</view>
				<view class="a-badge" :class="statusClass(row)">
					<text class="a-badge-text" :class="statusTextClass(row)">{{ statusLabel(row) }}</text>
				</view>
			</view>

			<!-- 申请信息：店铺 / 时间 / 积分 -->
			<view class="a-info">
				<view class="a-info-cell">
					<text class="a-info-key">店铺</text>
					<text class="a-info-val">{{ row.storeName }}</text>
				</view>
				<view class="a-info-divider"></view>
				<view class="a-info-cell">
					<text class="a-info-key">申请时间</text>
					<text class="a-info-val">{{ fmtDate(row.createTime) }}</text>
				</view>
				<view class="a-info-divider"></view>
				<view class="a-info-cell a-info-cell-amt">
					<text class="a-info-key">申请积分</text>
					<text class="a-info-val a-info-amt">{{ row.points }}</text>
				</view>
			</view>
			<!-- 操作：仅待审核状态可操作 -->
			<view v-if="isPending(row)" class="actions">
				<view class="act act-reject" @tap="onTapReject(row)">
					<text class="act-text act-reject-text">拒绝</text>
				</view>
				<view class="act act-approve" @tap="onTapApprove(row)">
					<text class="act-text act-approve-text">审核通过</text>
				</view>
			</view>
			<!-- 已处理：展示处理时间（接口未返回审核人，仅本地审核时展示） -->
			<view v-else class="a-handled">
				<text class="a-handled-text">{{ row.status == 'P' ? '已通过' : '已拒绝' }}{{ row.handledAt ? ' · ' + (row.handledBy ? row.handledBy + ' · ' : '') + row.handledAt : '' }}</text>
			</view>
		</view>

		<!-- 加载更多状态：触底自动加载，也可点击手动加载 -->
		<view v-if="currentList.length > 0" class="more" @tap="onLoadMore">
			<text class="more-text">{{ loadingMore ? '加载中…' : (currentHasMore ? '上拉加载更多' : '没有更多了') }}</text>
		</view>

		<!-- 空态 -->
		<view v-if="currentList.length == 0" class="empty">
			<view class="empty-icon">
				<text class="empty-icon-text">{{ tab == 'deposit' ? '存' : '取' }}</text>
			</view>
			<text class="empty-title">暂无{{ tab == 'deposit' ? '存' : '取' }}积分申请</text>
			<text class="empty-sub">所有申请将实时出现在此，待您审核</text>
		</view>

		<!-- 脚注 -->
		<view class="foot">
			<text class="foot-text">审核通过后酒德积分将实时入账\n拒绝需填写原因，玩家可查看并重新申请</text>
		</view>

		<view class="footer-blank"></view>
	</scroll-view>
	</view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchJiudeRequests, approveJiudeRequest, fmtDate } from '@/common/jiude-api'
import { resolveFileUrl } from '@/common/http'
import type { PointsRequestVO } from '@/common/jiude-api'

/* ---------------- 数据 ---------------- */
// 行数据直接使用后端 VO 字段；handledBy/handledAt 为本地审核辅助（审核暂无接口，status 直接本地更新）
type JiudeApply = PointsRequestVO & {
	handledBy ?: string
	handledAt ?: string
}

const PAGE_LIMIT = 20

// 存积分申请：玩家在门店将现金/门票存入酒德余额（type=0）
const depositList = ref<JiudeApply[]>([])
// 取积分申请：玩家将酒德余额提现或兑换门票/券（type=1）
const withdrawList = ref<JiudeApply[]>([])

// 分页状态（存/取各自维护）
const depositPage = ref(1)
const withdrawPage = ref(1)
const depositHasMore = ref(true)
const withdrawHasMore = ref(true)
const loadingMore = ref(false)

// 拉取对应类型的申请列表；page>1 时为追加加载（审核暂无接口，本地更新状态）
const loadList = (type : 0 | 1, page : number = 1) : void => {
	const isMore : boolean = page > 1
	if (isMore) {
		if (loadingMore.value) { return }
		loadingMore.value = true
	}
	fetchJiudeRequests(type, page, PAGE_LIMIT).then((rows) => {
		if (type == 0) {
			depositList.value = isMore ? depositList.value.concat(rows) : rows
			depositPage.value = page
			depositHasMore.value = rows.length >= PAGE_LIMIT
		} else {
			withdrawList.value = isMore ? withdrawList.value.concat(rows) : rows
			withdrawPage.value = page
			withdrawHasMore.value = rows.length >= PAGE_LIMIT
		}
		loadingMore.value = false
	}).catch((err : Error) => {
		loadingMore.value = false
		console.log('fetchJiudeRequests(' + type + ') failed: ' + err.message)
	})
}

onMounted((): void => {
	loadList(0)
	loadList(1)
})

/* ---------------- Tab ---------------- */
type TabKey = 'deposit' | 'withdraw'
const tab = ref<TabKey>('deposit')
const currentList = computed<JiudeApply[]>((): JiudeApply[] => {
	return tab.value == 'deposit' ? depositList.value : withdrawList.value
})
const currentHasMore = computed<boolean>((): boolean => {
	return tab.value == 'deposit' ? depositHasMore.value : withdrawHasMore.value
})

// 滚动到底部：加载当前 Tab 的下一页
const onLoadMore = () : void => {
	if (loadingMore.value) { return }
	if (tab.value == 'deposit') {
		if (depositHasMore.value) { loadList(0, depositPage.value + 1) }
	} else {
		if (withdrawHasMore.value) { loadList(1, withdrawPage.value + 1) }
	}
}

/* ---------------- 工具 ---------------- */

// 行状态：后端 status 取值 A 待审核 / P 已通过 / R 已拒绝
const isPending = (row : JiudeApply) : boolean => row.status == 'A'

const statusLabel = (row : JiudeApply) : string => {
	if (row.status == 'A') { return '待审核' }
	if (row.status == 'P') { return '已通过' }
	return '已拒绝'
}
const statusClass = (row : JiudeApply) : string => {
	if (row.status == 'A') { return 'a-badge-pending' }
	if (row.status == 'P') { return 'a-badge-approved' }
	return 'a-badge-rejected'
}
const statusTextClass = (row : JiudeApply) : string => {
	if (row.status == 'A') { return 'a-badge-pending-text' }
	if (row.status == 'P') { return 'a-badge-approved-text' }
	return 'a-badge-rejected-text'
}

// 找到某条申请所在的 list ref（存/取复用）
const listOf = (row : JiudeApply) : JiudeApply[] => {
	const len = depositList.value.length
	for (let i : number = 0; i < len; i++) {
		if (depositList.value[i].id == row.id) { return depositList.value }
	}
	return withdrawList.value
}

const nowLabel = () : string => {
	const t = new Date()
	const p = (v : number) : string => (v < 10 ? '0' + v.toString() : v.toString())
	return p(t.getMonth() + 1) + '-' + p(t.getDate()) + ' ' + p(t.getHours()) + ':' + p(t.getMinutes())
}

/* ---------------- 审核 ---------------- */
const saving = ref(false)

// 调用审核接口（POST /jiu-de/approve），成功后本地更新状态
const doApprove = (row : JiudeApply, status : 'P' | 'R') : void => {
	if (saving.value) { return }
	saving.value = true
	approveJiudeRequest(row.id, status).then(() => {
		saving.value = false
		const list = listOf(row)
		const len = list.length
		for (let i : number = 0; i < len; i++) {
			if (list[i].id == row.id) {
				list[i].status = status
				list[i].handledBy = '管理员'
				list[i].handledAt = nowLabel()
				break
			}
		}
		uni.showToast({ title: status == 'P' ? '已通过' : '已拒绝', icon: 'none' })
	}).catch((e : any) => {
		saving.value = false
		uni.showToast({ title: e && e.message ? e.message : '操作失败，请重试', icon: 'none' })
	})
}

const onTapApprove = (row : JiudeApply) : void => {
	const typeLabel = tab.value == 'deposit' ? '存积分' : '取积分'
	uni.showModal({
		title: '审核通过',
		content: '确认通过 ' + row.username + ' 的「' + typeLabel + ' 申请」，' + row.points + ' 积分将实时' + (tab.value == 'deposit' ? '入账' : '扣减') + '？',
		confirmText: '通过',
		confirmColor: '#57C79A',
		success: (res : any) => {
			if (res.confirm) { doApprove(row, 'P') }
		}
	})
}

const onTapReject = (row : JiudeApply) : void => {
	const typeLabel = tab.value == 'deposit' ? '存积分' : '取积分'
	uni.showModal({
		title: '审核拒绝',
		content: '确认拒绝 ' + row.username + ' 的「' + typeLabel + ' 申请」？积分不会变动，玩家可查看原因后重新申请。',
		confirmText: '拒绝',
		confirmColor: '#FF6255',
		success: (res : any) => {
			if (res.confirm) { doApprove(row, 'R') }
		}
	})
}
</script>

<style scoped>
.wrap {
	flex-direction: column;
	background-color: #0B0D0C;
	height: 100vh;
}
/* #ifdef H5 */
/* H5 端 100vh 含导航栏和 tabBar，需减去，否则底部内容被裁 */
.wrap {
	height: calc(100vh - var(--window-top) - var(--window-bottom));
}
/* #endif */

/* ============ 顶栏 Tab（固定，不随列表滚动） ============ */
.topbar {
	padding: 24rpx 24rpx 0;
	margin-bottom: 24rpx;
}
.page {
	box-sizing: border-box;
	background-color: #0B0D0C;
	padding: 0 24rpx 24rpx;
	/* 占满剩余高度的确定高度，保证 scroll-view 滚动与触底加载触发 */
	flex: 1;
}
.tab-row {
	flex-direction: row;
	background-color: #171A19;
	border: 1rpx solid #242827;
	border-radius: 20rpx;
	padding: 6rpx;
}
.tab-cell {
	flex: 1;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	height: 72rpx;
	border-radius: 16rpx;
	margin: 0 2rpx;
}
.tab-cell-on {
	background-color: #1E2221;
}
.tab-text {
	font-size: 25rpx;
	color: #6E7573;
	font-weight: 500;
}
.tab-text-on {
	color: #EDEFEE;
	font-weight: 700;
}
.tab-badge {
	margin-left: 10rpx;
	padding: 2rpx 14rpx;
	border-radius: 999rpx;
	background-color: #242827;
}
.tab-badge-on {
	background-color: #57C79A1F;
}
.tab-badge-text {
	font-size: 20rpx;
	color: #6E7573;
	font-weight: 600;
}
.tab-badge-on-text {
	color: #57C79A;
}

/* ============ 申请卡片 ============ */
.acard {
	background-color: #1A1E1D;
	border: 1rpx solid #2A2F2D;
	border-radius: 24rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	box-sizing: border-box;
	box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
}
.acard-top {
	flex-direction: row;
	align-items: center;
	padding-bottom: 20rpx;
	border-bottom: 1rpx solid #242827;
}
.avatar {
	width: 80rpx;
	height: 80rpx;
	border-radius: 40rpx;
	background-color: #242827;
	border: 2rpx solid #3A3E3D;
	align-items: center;
	justify-content: center;
	margin-right: 16rpx;
}
.avatar-img {
	width: 80rpx;
	height: 80rpx;
	border-radius: 40rpx;
}
.avatar-text {
	font-size: 34rpx;
	color: #E8C275;
	font-weight: 700;
}
.head {
	flex: 1;
	flex-direction: column;
}
.a-name {
	font-size: 30rpx;
	color: #EDEFEE;
	font-weight: 600;
}
.a-id {
	font-size: 21rpx;
	color: #6E7573;
	margin-top: 6rpx;
}

/* 状态徽标 */
.a-badge {
	padding: 6rpx 16rpx;
	border-radius: 10rpx;
}
.a-badge-pending {
	background-color: #E8C2751F;
	border: 1rpx solid #E8C27559;
}
.a-badge-approved {
	background-color: #57C79A1F;
	border: 1rpx solid #57C79A59;
}
.a-badge-rejected {
	background-color: #FF62551F;
	border: 1rpx solid #FF625559;
}
.a-badge-text {
	font-size: 21rpx;
	font-weight: 600;
}
.a-badge-pending-text {
	color: #E8C275;
}
.a-badge-approved-text {
	color: #57C79A;
}
.a-badge-rejected-text {
	color: #FF6255;
}

/* 申请信息三列 */
.a-info {
	flex-direction: row;
	align-items: center;
	margin-top: 20rpx;
	padding: 0 4rpx;
}
.a-info-cell {
	flex: 1;
	flex-direction: column;
}
.a-info-cell-amt {
	align-items: flex-end;
}
.a-info-key {
	font-size: 19rpx;
	color: #6E7573;
}
.a-info-val {
	font-size: 24rpx;
	color: #C9CFCC;
	margin-top: 6rpx;
}
.a-info-amt {
	font-size: 30rpx;
	color: #E8C275;
	font-weight: 700;
}
.a-info-divider {
	width: 1rpx;
	height: 48rpx;
	background-color: #2A2E2D;
}

/* 操作区 */
.actions {
	flex-direction: row;
	margin-top: 22rpx;
}
.act {
	flex: 1;
	height: 72rpx;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	border-radius: 14rpx;
	margin-right: 18rpx;
}
.act-reject {
	background-color: #FF62550F;
	border: 1rpx solid #FF625533;
}
.act-approve {
	background-color: #57C79A;
	margin-right: 0;
}
.act-text {
	font-size: 25rpx;
	font-weight: 600;
}
.act-reject-text {
	color: #FF6255;
}
.act-approve-text {
	color: #0B0D0C;
}

/* 已处理状态：只展示 */
.a-handled {
	margin-top: 22rpx;
	padding: 16rpx 20rpx;
	background-color: #1E2221;
	border: 1rpx solid #2A2E2D;
	border-radius: 12rpx;
}
.a-handled-text {
	font-size: 21rpx;
	color: #6E7573;
}

/* ============ 空态 ============ */
.empty {
	align-items: center;
	padding: 120rpx 0;
}
.empty-icon {
	width: 100rpx;
	height: 100rpx;
	border-radius: 28rpx;
	background-color: #E8C2751F;
	border: 1rpx solid #E8C27559;
	align-items: center;
	justify-content: center;
}
.empty-icon-text {
	font-size: 40rpx;
	color: #E8C275;
	font-weight: 700;
}
.empty-title {
	font-size: 26rpx;
	color: #EDEFEE;
	font-weight: 600;
	margin-top: 26rpx;
}
.empty-sub {
	font-size: 20rpx;
	color: #6E7573;
	margin-top: 10rpx;
}

/* ============ 加载更多 ============ */
.more {
	align-items: center;
	padding: 8rpx 0 4rpx;
}
.more-text {
	font-size: 20rpx;
	color: #6E7573;
}

/* ============ 脚注 ============ */
.foot {
	padding: 10rpx 8rpx 0;
}
.foot-text {
	font-size: 20rpx;
	color: #6E7573;
	line-height: 30rpx;
}
.footer-blank {
	height: 60rpx;
}
</style>
