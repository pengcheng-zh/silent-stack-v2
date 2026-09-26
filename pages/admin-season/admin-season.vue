<template>
	<scroll-view class="page" direction="vertical" :show-scrollbar="false">

		<!-- ============ 顶栏：赛季数 + 新增入口 ============ -->
		<view class="topbar">
			<view class="count-wrap">
				<text class="count-num">{{ seasons.length }}</text>
				<text class="count-label">个赛季 · {{ ongoingCount }} 个进行中</text>
			</view>
			<view class="add-btn" @tap="onTapAdd">
				<text class="add-btn-text">＋ 新增赛季</text>
			</view>
		</view>

		<!-- ============ 赛季卡片列表 ============ -->
		<view
			v-for="s in seasons"
			:key="s.id"
			class="scard"
			:style="'border-left-color:' + colorOf(s) + ';'"
		>
			<!-- 名称 + 状态 -->
			<view class="scard-head">
				<view class="s-icon" :style="'background-color:' + colorOf(s) + '1F;border-color:' + colorOf(s) + '59;'">
					<text class="s-icon-text" :style="'color:' + colorOf(s) + ';'">季</text>
				</view>
				<view class="s-main">
					<text class="s-name">{{ s.name }}</text>
					<text class="s-dates">{{ s.start }} → {{ s.end }}</text>
				</view>
				<view class="s-status" :style="'background-color:' + colorOf(s) + '22;color:' + colorOf(s) + ';border-color:' + colorOf(s) + '59;'">
					<text class="s-status-text">{{ labelOf(s) }}</text>
				</view>
			</view>

			<!-- 进度条：进行中 = 实时进度 / 已结束 = 满条 / 未开始 = 空条 -->
			<view class="track">
				<view class="track-fill" :style="'width:' + trackPctOf(s) + '%;background-color:' + colorOf(s) + ';'"></view>
			</view>

			<!-- 时长 / 剩余 -->
			<view class="s-meta-row">
				<text class="s-meta">时长 {{ daysBetween(s.start, s.end) }} 天</text>
				<view class="s-meta-divider"></view>
				<text v-if="statusOf(s) == 'ongoing'" class="s-meta">{{ progressOf(s) }}% · 剩余 {{ remainDays(s) }} 天</text>
				<text v-else-if="statusOf(s) == 'upcoming'" class="s-meta">{{ daysBetween(todayStr(), s.start) }} 天后开赛</text>
				<text v-else class="s-meta">已收官 {{ daysBetween(s.end, todayStr()) }} 天</text>
			</view>

			<!-- 操作 -->
			<view class="actions">
				<view class="act" @tap="onTapEdit(s)">
					<text class="act-text">编辑</text>
				</view>
				<view class="act act-danger" @tap="onTapDelete(s)">
					<text class="act-text act-danger-text">删除</text>
				</view>
			</view>
		</view>

		<!-- 空态 -->
		<view v-if="seasons.length == 0" class="empty">
			<view class="empty-icon">
				<text class="empty-icon-text">季</text>
			</view>
			<text class="empty-title">暂无赛季</text>
			<text class="empty-sub">点击右上角「＋ 新增赛季」创建第一个赛季</text>
		</view>

		<!-- 脚注 -->
		<view class="foot">
			<text class="foot-text">赛季时间不可与其他赛季重叠\n删除进行中的赛季将影响排行榜展示</text>
		</view>

		<view class="footer-blank"></view>
	</scroll-view>

	<!-- ============ 新增 / 编辑弹层 ============ -->
	<view v-if="dialog.visible" class="dlg-overlay" @tap="onTapDlgMask">
		<view class="dlg-card" @tap.stop="">
			<view class="dlg-head">
				<text class="dlg-title">{{ dialog.mode == 'create' ? '新增赛季' : '编辑赛季' }}</text>
				<text class="dlg-sub">{{ dialog.mode == 'create' ? '默认预填 90 天周期，可自行调整' : '调整名称或起止时间' }}</text>
			</view>

			<!-- 赛季名称 -->
			<view class="field">
				<text class="field-label">赛季名称</text>
				<input
					class="field-input"
					type="text"
					:value="dialog.name"
					placeholder="如：S4 · 2026 冬季赛"
					placeholder-class="field-ph"
					@input="onNameInput"
				/>
			</view>

			<!-- 开始时间 -->
			<view class="field">
				<text class="field-label">开始时间</text>
				<picker mode="date" :value="dialog.start" @change="onStartChange">
					<view class="select-btn">
						<text class="select-btn-text">{{ dialog.start }}</text>
						<text class="select-btn-arrow">›</text>
					</view>
				</picker>
			</view>

			<!-- 截止时间 -->
			<view class="field">
				<text class="field-label">截止时间</text>
				<picker mode="date" :value="dialog.end" @change="onEndChange">
					<view class="select-btn">
						<text class="select-btn-text">{{ dialog.end }}</text>
						<text class="select-btn-arrow">›</text>
					</view>
				</picker>
			</view>

			<!-- 周期预览 -->
			<view class="dur-row">
				<text class="dur-text">周期 {{ daysBetween(dialog.start, dialog.end) }} 天</text>
			</view>

			<text v-if="dialog.error.length > 0" class="dlg-error">{{ dialog.error }}</text>

			<view class="dlg-btns">
				<view class="dlg-btn dlg-btn-cancel" @tap="onTapDlgCancel">
					<text class="dlg-btn-text dlg-btn-cancel-text">取消</text>
				</view>
				<view class="dlg-btn dlg-btn-ok" @tap="onTapSave">
					<text class="dlg-btn-text dlg-btn-ok-text">{{ saving ? '保存中…' : '保存' }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
	SEASON_STATUS_META, addDays, daysBetween,
	progressOf, remainDays, statusOf, todayStr
} from '@/common/admin-season-data'
import type { AdminSeasonRow, SeasonStatus } from '@/common/admin-season-data'
import { createSeason, fetchSeasonList } from '@/common/season-api'
import type { SeasonSavePayload } from '@/common/season-api'

/* ---------------- 数据 ---------------- */
// 列表来自 /match-season/list；新增/编辑走 /match-season/create（成功后回刷），按开始时间倒序
const byStartDesc = (a : AdminSeasonRow, b : AdminSeasonRow) : number => {
	if (a.start > b.start) { return -1 }
	if (a.start < b.start) { return 1 }
	return 0
}
const seasons = ref<AdminSeasonRow[]>([])

/* ---------------- 列表回刷 ---------------- */
// 以服务端数据为准回刷（新增/编辑成功后 id 由后端生成，本地不自行造 id）
const refreshSeasons = () : Promise<void> => {
	return fetchSeasonList().then((list) => {
		seasons.value = list.sort(byStartDesc)
	}).catch((err : Error) => {
		console.log('fetchSeasonList failed: ' + err.message)
	})
}

onMounted((): void => {
	refreshSeasons()
})

// 进行中赛季数（顶栏统计）
const ongoingCount = computed<number>((): number => {
	let n : number = 0
	const len : number = seasons.value.length
	for (let i : number = 0; i < len; i++) {
		if (statusOf(seasons.value[i]) == 'ongoing') { n++ }
	}
	return n
})

/* ---------------- 状态工具 ---------------- */
const colorOf = (s : AdminSeasonRow) : string => SEASON_STATUS_META[statusOf(s)].color
const labelOf = (s : AdminSeasonRow) : string => SEASON_STATUS_META[statusOf(s)].label

// 进度条宽度：进行中 = 实时进度 / 已结束 = 满条 / 未开始 = 空条
const trackPctOf = (s : AdminSeasonRow) : number => {
	const st : SeasonStatus = statusOf(s)
	if (st == 'ended') { return 100 }
	if (st == 'upcoming') { return 0 }
	return progressOf(s)
}

/* ---------------- 新增 / 编辑弹层 ---------------- */
type DialogMode = 'create' | 'edit'
type DialogState = {
	visible : boolean
	mode : DialogMode
	seasonId : string         // edit 时定位原行
	name : string
	start : string            // 始终有值（create 预填今天），picker 无需处理空串
	end : string
	error : string
}
const dialog = ref<DialogState>({
	visible: false, mode: 'create', seasonId: '',
	name: '', start: '', end: '', error: ''
})

// 新增：预填今天开赛 + 90 天周期
const onTapAdd = () : void => {
	const today : string = todayStr()
	dialog.value = {
		visible: true, mode: 'create', seasonId: '',
		name: '', start: today, end: addDays(today, 90), error: ''
	}
}
const onTapEdit = (s : AdminSeasonRow) : void => {
	dialog.value = {
		visible: true, mode: 'edit', seasonId: s.id,
		name: s.name, start: s.start, end: s.end, error: ''
	}
}

const onTapDlgCancel = () : void => { dialog.value.visible = false }
const onTapDlgMask = () : void => { dialog.value.visible = false }

/* ---------------- 输入 ---------------- */
// 改任何字段都清掉旧错误，避免红色提示一直挂着
const onNameInput = (e : any) : void => {
	dialog.value.name = (e.detail.value || '').toString()
	if (dialog.value.error.length > 0) { dialog.value.error = '' }
}
const onStartChange = (e : any) : void => {
	dialog.value.start = (e.detail.value || '').toString()
	if (dialog.value.error.length > 0) { dialog.value.error = '' }
}
const onEndChange = (e : any) : void => {
	dialog.value.end = (e.detail.value || '').toString()
	if (dialog.value.error.length > 0) { dialog.value.error = '' }
}

/* ---------------- 保存（校验 + 写入） ---------------- */
// 与其他赛季（不含自己）的时间重叠判断：端点相接允许复用（开始时间可等于上一赛季的截止时间），
// 仅当 (end <= o.start || start >= o.end) 不成立即区间真重叠时拦截
const overlaps = (start : string, end : string, selfId : string) : AdminSeasonRow | null => {
	const len : number = seasons.value.length
	for (let i : number = 0; i < len; i++) {
		const o = seasons.value[i]
		if (o.id == selfId) { continue }
		if (!(end <= o.start || start >= o.end)) { return o }
	}
	return null
}

const saving = ref(false)            // 防止重复提交

const onTapSave = () : void => {
	if (saving.value) { return }
	const d = dialog.value

	// ---- 校验（对齐后端 DTO 校验提示） ----
	const name : string = d.name.trim()
	if (name.length == 0) { d.error = '请输入赛季名称'; return }
	if (name.length < 2 || name.length > 10) { d.error = '名称长度不符合'; return }
	if (d.start.length == 0) { d.error = '请输入开始时间'; return }
	if (d.end.length == 0) { d.error = '请输入结束时间'; return }
	if (d.end < d.start) { d.error = '截止时间不能早于开始时间'; return }
	const clash : AdminSeasonRow | null = overlaps(d.start, d.end, d.seasonId)
	if (clash != null) { d.error = '与「' + clash.name + '」时间重叠'; return }

	// ---- 组 payload：id 有值 = 更新；时间补全为后端存储格式 YYYY-MM-DD 00:00:00 ----
	const payload : SeasonSavePayload = {
		name: name,
		startTime: d.start + ' 00:00:00',
		endTime: d.end + ' 00:00:00'
	}
	const isCreate : boolean = d.mode == 'create'
	if (!isCreate) {
		const idNum : number = Number(d.seasonId)
		if (idNum > 0) { payload.id = idNum }
	}

	saving.value = true
	createSeason(payload).then(() => {
		dialog.value.visible = false
		uni.showToast({ title: isCreate ? '已新增' : '已保存', icon: 'none' })
		refreshSeasons()
	}).catch((err : Error) => {
		d.error = err.message || '保存失败'
	}).finally(() => {
		saving.value = false
	})
}

/* ---------------- 删除 ---------------- */
const onTapDelete = (s : AdminSeasonRow) : void => {
	// 进行中的赛季删除时给出更强的提示
	const ongoing : boolean = statusOf(s) == 'ongoing'
	uni.showModal({
		title: ongoing ? '删除当前赛季' : '删除赛季',
		content: ongoing
			? '「' + s.name + '」正在进行中，删除将影响排行榜展示，确定删除吗？'
			: '确定删除「' + s.name + '」吗？删除后不可恢复',
		confirmText: '删除',
		confirmColor: '#FF6255',
		success: (res : any) => {
			if (res.confirm) {
				const len : number = seasons.value.length
				for (let i : number = 0; i < len; i++) {
					if (seasons.value[i].id == s.id) {
						seasons.value.splice(i, 1)
						break
					}
				}
				uni.showToast({ title: '已删除', icon: 'none' })
			}
		}
	})
}
</script>

<style scoped>
.page {
	min-height: 100vh;
	background-image: linear-gradient(180deg, #0E1110 0%, #0A0C0B 40%, #0B0D0C 100%);
	padding: 24rpx;
	box-sizing: border-box;
}

/* ============ 顶栏 ============ */
.topbar {
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24rpx;
}
.count-wrap {
	flex-direction: row;
	align-items: baseline;
}
.count-num {
	font-size: 44rpx;
	font-weight: 700;
	color: #EDEFEE;
}
.count-label {
	font-size: 21rpx;
	color: #6E7573;
	margin-left: 10rpx;
}
.add-btn {
	padding: 16rpx 28rpx;
	background-color: #B07AE81F;
	border: 1rpx solid #B07AE859;
	border-radius: 16rpx;
}
.add-btn-text {
	font-size: 24rpx;
	color: #B07AE8;
	font-weight: 600;
}

/* ============ 赛季卡片 ============ */
.scard {
	background-color: #171A19;
	border: 1rpx solid #242827;
	border-left-width: 6rpx;
	border-left-color: #6E7573;
	border-radius: 20rpx;
	padding: 26rpx 24rpx;
	margin-bottom: 20rpx;
	box-sizing: border-box;
}
.scard-head {
	flex-direction: row;
	align-items: center;
}
.s-icon {
	width: 76rpx;
	height: 76rpx;
	border-radius: 18rpx;
	border: 1rpx solid #242827;
	align-items: center;
	justify-content: center;
	margin-right: 18rpx;
}
.s-icon-text {
	font-size: 32rpx;
	font-weight: 700;
}
.s-main {
	flex: 1;
	flex-direction: column;
}
.s-name {
	font-size: 28rpx;
	color: #EDEFEE;
	font-weight: 600;
}
.s-dates {
	font-size: 20rpx;
	color: #6E7573;
	margin-top: 6rpx;
}
.s-status {
	padding: 8rpx 18rpx;
	border: 1rpx solid #242827;
	border-radius: 999rpx;
}
.s-status-text {
	font-size: 20rpx;
	font-weight: 600;
}

/* 进度条 */
.track {
	height: 12rpx;
	background-color: #222524;
	border-radius: 999rpx;
	margin-top: 22rpx;
	overflow: hidden;
}
.track-fill {
	height: 12rpx;
	border-radius: 999rpx;
}

/* 时长 / 剩余 */
.s-meta-row {
	flex-direction: row;
	align-items: center;
	margin-top: 14rpx;
}
.s-meta {
	font-size: 20rpx;
	color: #9AA19E;
}
.s-meta-divider {
	width: 4rpx;
	height: 4rpx;
	border-radius: 2rpx;
	background-color: #4A4F4D;
	margin: 0 14rpx;
}

/* 操作区 */
.actions {
	flex-direction: row;
	margin-top: 22rpx;
}
.act {
	flex: 1;
	height: 64rpx;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	background-color: #1E2221;
	border: 1rpx solid #2A2E2D;
	border-radius: 14rpx;
	margin-right: 16rpx;
}
.act-danger {
	margin-right: 0;
	border-color: #FF625533;
	background-color: #FF62550F;
}
.act-text {
	font-size: 23rpx;
	color: #C9CFCC;
	font-weight: 500;
}
.act-danger-text {
	color: #FF6255;
}

/* ============ 空态 ============ */
.empty {
	align-items: center;
	padding: 100rpx 0;
}
.empty-icon {
	width: 100rpx;
	height: 100rpx;
	border-radius: 28rpx;
	background-color: #B07AE81F;
	border: 1rpx solid #B07AE859;
	align-items: center;
	justify-content: center;
}
.empty-icon-text {
	font-size: 40rpx;
	color: #B07AE8;
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

/* ============ 新增 / 编辑弹层 ============ */
.dlg-overlay {
	position: fixed;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.65);
	z-index: 999;
	align-items: center;
	justify-content: center;
}
.dlg-card {
	width: 640rpx;
	background-color: #171A19;
	border: 1rpx solid #2A2E2D;
	border-radius: 24rpx;
	padding: 36rpx 32rpx 28rpx;
	box-sizing: border-box;
}
.dlg-head {
	margin-bottom: 26rpx;
}
.dlg-title {
	font-size: 30rpx;
	color: #EDEFEE;
	font-weight: 700;
}
.dlg-sub {
	font-size: 20rpx;
	color: #6E7573;
	margin-top: 8rpx;
}

.field {
	margin-bottom: 22rpx;
}
.field-label {
	font-size: 22rpx;
	color: #9AA19E;
	margin-bottom: 12rpx;
}
.field-input {
	height: 84rpx;
	background-color: #1E2221;
	border: 1rpx solid #2A2E2D;
	border-radius: 14rpx;
	padding: 0 24rpx;
	font-size: 26rpx;
	color: #EDEFEE;
	box-sizing: border-box;
}

/* 日期选择按钮（picker 触发器） */
.select-btn {
	height: 84rpx;
	background-color: #1E2221;
	border: 1rpx solid #2A2E2D;
	border-radius: 14rpx;
	padding: 0 24rpx;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	box-sizing: border-box;
}
.select-btn-text {
	font-size: 26rpx;
	color: #EDEFEE;
}
.select-btn-arrow {
	font-size: 30rpx;
	color: #4A4F4D;
}

/* 周期预览 */
.dur-row {
	flex-direction: row;
	justify-content: flex-end;
	margin-top: -6rpx;
	margin-bottom: 14rpx;
}
.dur-text {
	font-size: 20rpx;
	color: #6E7573;
}

.dlg-error {
	font-size: 21rpx;
	color: #FF6255;
	margin-bottom: 14rpx;
}

.dlg-btns {
	flex-direction: row;
	margin-top: 6rpx;
}
.dlg-btn {
	flex: 1;
	height: 84rpx;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	border-radius: 14rpx;
	margin-right: 18rpx;
}
.dlg-btn-cancel {
	background-color: #1E2221;
	border: 1rpx solid #2A2E2D;
}
.dlg-btn-cancel-text {
	font-size: 25rpx;
	color: #9AA19E;
}
.dlg-btn-ok {
	background-color: #B07AE8;
	margin-right: 0;
}
.dlg-btn-ok-text {
	font-size: 25rpx;
	color: #0B0D0C;
	font-weight: 700;
}
</style>
