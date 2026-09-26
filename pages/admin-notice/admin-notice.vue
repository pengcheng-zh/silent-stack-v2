<template>
	<scroll-view class="page" direction="vertical" :show-scrollbar="false">

		<!-- ============ 顶栏：公告数 + 发布入口 ============ -->
		<view class="topbar">
			<view class="count-wrap">
				<text class="count-num">{{ notices.length }}</text>
				<text class="count-label">条公告 · {{ onCount }} 条发布中</text>
			</view>
			<view class="add-btn" @tap="onTapAdd">
				<text class="add-btn-text">＋ 发布公告</text>
			</view>
		</view>

		<!-- ============ 公告卡片列表 ============ -->
		<view v-for="n in notices" :key="n.id" class="ncard">

			<!-- 头部：状态徽标 + 时间 -->
			<view class="n-head">
				<view class="n-badge" :class="n.status == 'on' ? 'n-badge-on' : 'n-badge-off'">
					<text class="n-badge-text" :class="n.status == 'on' ? 'n-badge-on-text' : 'n-badge-off-text'">{{ n.status == 'on' ? '发布中' : '已停止' }}</text>
				</view>
				<text class="n-date">{{ n.date }}</text>
			</view>

			<!-- 标题 + 内容 -->
			<text class="n-title">{{ n.title }}</text>
			<text class="n-content">{{ n.content }}</text>

			<!-- 操作 -->
			<view class="actions">
				<view class="act" @tap="onTapEdit(n)">
					<text class="act-text">编辑</text>
				</view>
				<view class="act" :class="n.status == 'on' ? 'act-danger' : 'act-resume'" @tap="onTapToggle(n)">
					<text class="act-text" :class="n.status == 'on' ? 'act-danger-text' : 'act-resume-text'">{{ n.status == 'on' ? '停止' : '恢复发布' }}</text>
				</view>
			</view>
		</view>

		<!-- 空态 -->
		<view v-if="notices.length == 0" class="empty">
			<view class="empty-icon">
				<text class="empty-icon-text">告</text>
			</view>
			<text class="empty-title">暂无公告</text>
			<text class="empty-sub">点击右上角「＋ 发布公告」发出第一条公告</text>
		</view>

		<!-- 脚注 -->
		<view class="foot">
			<text class="foot-text">公告发布后实时推送至所有客户端\n停止后玩家端立即下线，可随时恢复发布</text>
		</view>

		<view class="footer-blank"></view>
	</scroll-view>

	<!-- ============ 发布 / 编辑弹层 ============ -->
	<view v-if="dialog.visible" class="dlg-overlay" @tap="onTapDlgMask">
		<view class="dlg-card" @tap.stop="">
			<view class="dlg-head">
				<text class="dlg-title">{{ dialog.mode == 'create' ? '发布公告' : '编辑公告' }}</text>
				<text class="dlg-sub">保存后实时推送至所有客户端</text>
			</view>

			<!-- 公告标题 -->
			<view class="field">
				<text class="field-label">公告标题</text>
				<input
					class="field-input"
					type="text"
					:value="dialog.title"
					placeholder="如：S3 赛季积分规则调整"
					placeholder-class="field-ph"
					@input="onTitleInput"
				/>
			</view>

			<!-- 公告内容 -->
			<view class="field">
				<text class="field-label">公告内容</text>
				<textarea
					class="field-textarea"
					:value="dialog.content"
					placeholder="填写公告正文，将完整展示在玩家端"
					placeholder-class="field-ph"
					:maxlength="1000"
					@input="onContentInput"
				/>
			</view>

			<text v-if="dialog.error.length > 0" class="dlg-error">{{ dialog.error }}</text>

			<view class="dlg-btns">
				<view class="dlg-btn dlg-btn-cancel" @tap="onTapDlgCancel">
					<text class="dlg-btn-text dlg-btn-cancel-text">取消</text>
				</view>
				<view class="dlg-btn dlg-btn-ok" @tap="onTapSave">
					<text class="dlg-btn-text dlg-btn-ok-text">{{ dialog.mode == 'create' ? '发布' : '保存' }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { createAnnouncement, fetchAnnouncementList } from '@/common/notice-api'
import type { AnnouncementRow, AnnouncementSavePayload } from '@/common/notice-api'

/* ---------------- 数据 ---------------- */
// 列表来自 /announcement/list；发布/编辑/停止为本地操作（后端未提供相应接口）
type AdminNotice = AnnouncementRow

const notices = ref<AdminNotice[]>([])

onMounted((): void => {
	fetchAnnouncementList(1, 20).then((rows) => {
		notices.value = rows
	}).catch((err : Error) => {
		console.log('fetchAnnouncementList failed: ' + err.message)
	})
})

// 顶栏统计：发布中条数
const onCount = computed<number>((): number => {
	let count : number = 0
	const len : number = notices.value.length
	for (let i : number = 0; i < len; i++) {
		if (notices.value[i].status == 'on') { count++ }
	}
	return count
})

/* ---------------- 发布 / 编辑弹层 ---------------- */
type DialogMode = 'create' | 'edit'
type DialogState = {
	visible : boolean
	mode : DialogMode
	noticeId : string			// edit 时定位原行
	title : string
	content : string
	error : string
}
const dialog = ref<DialogState>({
	visible: false, mode: 'create', noticeId: '',
	title: '', content: '', error: ''
})

const onTapAdd = () : void => {
	dialog.value = {
		visible: true, mode: 'create', noticeId: '',
		title: '', content: '', error: ''
	}
}
const onTapEdit = (n : AdminNotice) : void => {
	dialog.value = {
		visible: true, mode: 'edit', noticeId: n.id,
		title: n.title, content: n.content, error: ''
	}
}

const onTapDlgCancel = () : void => { dialog.value.visible = false }
const onTapDlgMask = () : void => { dialog.value.visible = false }

/* ---------------- 输入 ---------------- */
// 改任何字段都清掉旧错误，避免红色提示一直挂着
const onTitleInput = (e : any) : void => {
	dialog.value.title = (e.detail.value || '').toString()
	if (dialog.value.error.length > 0) { dialog.value.error = '' }
}
const onContentInput = (e : any) : void => {
	dialog.value.content = (e.detail.value || '').toString()
	if (dialog.value.error.length > 0) { dialog.value.error = '' }
}

/* ---------------- 保存 ---------------- */
const onTapSave = () : void => {
	const d = dialog.value
	if (d.title.trim().length == 0) { d.error = '请填写公告标题'; return }
	if (d.content.trim().length == 0) { d.error = '请填写公告内容'; return }

	if (d.mode == 'create') {
		notices.value.unshift({
			id: 'n' + Date.now().toString(),
			title: d.title.trim(),
			content: d.content.trim(),
			status: 'on',
			date: nowLabel()
		})
		uni.showToast({ title: '已发布', icon: 'none' })
	} else {
		const len : number = notices.value.length
		for (let i : number = 0; i < len; i++) {
			if (notices.value[i].id == d.noticeId) {
				notices.value[i].title = d.title.trim()
				notices.value[i].content = d.content.trim()
				break
			}
		}
		uni.showToast({ title: '已保存', icon: 'none' })
	}
	dialog.value.visible = false
}

// 发布时间标签：月-日 时:分（接后端时换服务端时间）
const nowLabel = () : string => {
	const t = new Date()
	const p = (v : number) : string => (v < 10 ? '0' + v.toString() : v.toString())
	return p(t.getMonth() + 1) + '-' + p(t.getDate()) + ' ' + p(t.getHours()) + ':' + p(t.getMinutes())
}

/* ---------------- 停止 / 恢复 ---------------- */
const onTapToggle = (n : AdminNotice) : void => {
	if (n.status == 'off') {
		// 已停止的直接恢复发布
		const len : number = notices.value.length
		for (let i : number = 0; i < len; i++) {
			if (notices.value[i].id == n.id) {
				notices.value[i].status = 'on'
				break
			}
		}
		uni.showToast({ title: '已恢复发布', icon: 'none' })
		return
	}
	// 发布中的停止属于敏感操作，二次确认后生效
	uni.showModal({
		title: '停止公告',
		content: '停止后「' + n.title + '」将在玩家端立即下线，可随时恢复发布',
		confirmText: '停止',
		confirmColor: '#FF6255',
		success: (res : any) => {
			if (res.confirm) {
				const len : number = notices.value.length
				for (let i : number = 0; i < len; i++) {
					if (notices.value[i].id == n.id) {
						notices.value[i].status = 'off'
						break
					}
				}
				uni.showToast({ title: '已停止', icon: 'none' })
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
	background-color: #57C79A1F;
	border: 1rpx solid #57C79A59;
	border-radius: 16rpx;
}
.add-btn-text {
	font-size: 24rpx;
	color: #57C79A;
	font-weight: 600;
}

/* ============ 公告卡片 ============ */
.ncard {
	background-color: #171A19;
	border: 1rpx solid #242827;
	border-radius: 20rpx;
	padding: 24rpx 20rpx 20rpx;
	margin-bottom: 20rpx;
	box-sizing: border-box;
}
.n-head {
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 16rpx;
}
.n-badge {
	padding: 4rpx 14rpx;
	border-radius: 8rpx;
}
.n-badge-on {
	background-color: #57C79A1F;
	border: 1rpx solid #57C79A59;
}
.n-badge-off {
	background-color: #6E75731A;
	border: 1rpx solid #6E757333;
}
.n-badge-text {
	font-size: 19rpx;
	font-weight: 600;
}
.n-badge-on-text {
	color: #57C79A;
}
.n-badge-off-text {
	color: #6E7573;
}
.n-date {
	font-size: 20rpx;
	color: #6E7573;
}
.n-title {
	font-size: 28rpx;
	color: #EDEFEE;
	font-weight: 600;
	line-height: 40rpx;
}
.n-content {
	font-size: 23rpx;
	color: #9AA19E;
	line-height: 36rpx;
	margin-top: 10rpx;
}

/* 操作区 */
.actions {
	flex-direction: row;
	margin-top: 20rpx;
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
.act-resume {
	margin-right: 0;
	border-color: #57C79A33;
	background-color: #57C79A0F;
}
.act-text {
	font-size: 23rpx;
	color: #C9CFCC;
	font-weight: 500;
}
.act-danger-text {
	color: #FF6255;
}
.act-resume-text {
	color: #57C79A;
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
	background-color: #57C79A1F;
	border: 1rpx solid #57C79A59;
	align-items: center;
	justify-content: center;
}
.empty-icon-text {
	font-size: 40rpx;
	color: #57C79A;
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

/* ============ 发布 / 编辑弹层 ============ */
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
	background-color: #1A1E1D;
	border: 1rpx solid #2A2F2D;
	border-radius: 28rpx;
	padding: 36rpx 32rpx 28rpx;
	box-sizing: border-box;
	box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
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
.field-textarea {
	height: 220rpx;
	background-color: #1E2221;
	border: 1rpx solid #2A2E2D;
	border-radius: 14rpx;
	padding: 20rpx 24rpx;
	font-size: 25rpx;
	color: #EDEFEE;
	box-sizing: border-box;
}
.field-ph {
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
	background-color: #57C79A;
	margin-right: 0;
}
.dlg-btn-ok-text {
	font-size: 25rpx;
	color: #0B0D0C;
	font-weight: 700;
}
</style>
