<template>
	<scroll-view class="page" direction="vertical" :show-scrollbar="false" @scrolltolower="loadMore">

		<!-- ============ 顶栏：荣誉数 + 新增入口 ============ -->
		<view class="topbar">
			<view class="count-wrap">
				<text class="count-num">{{ honors.length }}</text>
				<text class="count-label">项荣誉</text>
			</view>
			<view class="add-btn" @tap="onTapAdd">
				<text class="add-btn-text">＋ 新增荣誉</text>
			</view>
		</view>

		<!-- ============ 荣誉卡片列表 ============ -->
		<view v-for="h in honors" :key="h.id" class="hcard">

			<!-- 背景板预览：长条图（即排行榜行内的展示效果） -->
			<view class="strip">
				<image class="strip-img" :src="h.image" mode="aspectFill"></image>
			</view>

			<!-- 荣誉名：图片下方 -->
			<view class="h-name-row">
				<text class="h-name">{{ h.name }}</text>
				<text class="h-cap">排行榜 · 荣誉背景板</text>
			</view>

			<!-- 操作 -->
			<view class="actions">
				<view class="act" @tap="onTapEdit(h)">
					<text class="act-text">编辑</text>
				</view>
				<view class="act act-danger" @tap="onTapDelete(h)">
					<text class="act-text act-danger-text">删除</text>
				</view>
			</view>
		</view>

		<!-- 空态 -->
		<view v-if="honors.length == 0" class="empty">
			<view class="empty-icon">
				<text class="empty-icon-text">荣</text>
			</view>
			<text class="empty-title">暂无荣誉</text>
			<text class="empty-sub">点击右上角「＋ 新增荣誉」创建第一项荣誉</text>
		</view>

		<!-- 脚注 -->
		<view class="foot">
			<text class="foot-text">荣誉背景板为长条图，玩家获得后\n将作为其在排行榜行内的背景板展示</text>
		</view>

		<!-- 加载状态脚注 -->
		<view class="list-foot">
			<text class="list-foot-text">{{ loading ? '加载中…' : (noMore ? '— 没有更多了 —' : '上拉加载更多') }}</text>
		</view>

		<view class="footer-blank"></view>
	</scroll-view>

	<!-- ============ 新增 / 编辑弹层 ============ -->
	<view v-if="dialog.visible" class="dlg-overlay" @tap="onTapDlgMask">
		<view class="dlg-card" @tap.stop="">
			<view class="dlg-head">
				<text class="dlg-title">{{ dialog.mode == 'create' ? '新增荣誉' : '编辑荣誉' }}</text>
				<text class="dlg-sub">选一块长条背景板，玩家将在排行榜行内展示</text>
			</view>

			<!-- 实时预览：背景板 + 荣誉名（名称在图片下方） -->
			<view class="field">
				<text class="field-label">效果预览</text>
				<view class="strip strip-mini">
					<image v-if="dialog.image.length > 0" class="strip-img" :src="dialog.image" mode="aspectFill"></image>
					<view v-else class="strip-none">
						<text class="strip-none-text">尚未选择背景板</text>
					</view>
				</view>
				<view class="h-name-row">
					<text class="h-name" :class="{ 'h-name-ph': dialog.name.length == 0 }">{{ dialog.name.length > 0 ? dialog.name : '荣誉名称' }}</text>
				</view>
			</view>

			<!-- 荣誉名称 -->
			<view class="field">
				<text class="field-label">荣誉名称</text>
				<input
					class="field-input"
					type="text"
					:value="dialog.name"
					placeholder="如：周末深筹赛冠军"
					placeholder-class="field-ph"
					@input="onNameInput"
				/>
			</view>

			<!-- 背景板：从相册选择上传 -->
			<view class="field">
				<text class="field-label">背景板（长条 5:1）</text>
				<view class="bg-grid">
					<view
						class="bg-tile bg-tile-album"
						:class="{ 'bg-tile-on': dialog.image.length > 0 }"
						@tap="onTapChooseAlbum"
					>
						<text class="bg-tile-plus">{{ uploading ? '⋯' : '＋' }}</text>
						<text class="bg-tile-label" :class="{ 'bg-tile-label-on': dialog.image.length > 0 }">{{ uploading ? '上传中…' : '从相册选择' }}</text>
					</view>
				</view>
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
import { onMounted, ref } from 'vue'
import type { AdminHonorRow } from '@/common/admin-honor-data'
import { createHonor, fetchHonorList, fromHonorVO, uploadHonorImage } from '@/common/honor-api'
import type { HonorSavePayload } from '@/common/honor-api'

/* ---------------- 数据 ---------------- */
// 列表来自 /honor/list（分页），保存走 /honor/create（成功后回刷）
const PAGE_SIZE : number = 10
const honors = ref<AdminHonorRow[]>([])
const loading = ref(false)
const noMore = ref(false)
const currentPage = ref(0)
const saving = ref(false)            // 防止重复提交
const uploading = ref(false)         // 图片上传中

const loadMore = () : Promise<void> => {
	if (loading.value || noMore.value) { return Promise.resolve() }
	loading.value = true
	const nextPage : number = currentPage.value + 1
	return fetchHonorList(nextPage, PAGE_SIZE).then((page) => {
		const chunk : AdminHonorRow[] = []
		const list = page.list || []
		for (let i = 0; i < list.length; i++) { chunk.push(fromHonorVO(list[i])) }
		const next = honors.value.slice()
		for (let i = 0; i < chunk.length; i++) { next.push(chunk[i]) }
		honors.value = next
		currentPage.value = nextPage
		if (chunk.length == 0 || next.length < PAGE_SIZE) { noMore.value = true }
	}).catch(() => {
		console.log('loadHonorList failed')
	}).finally(() => {
		loading.value = false
	})
}

// 重置分页 + 回刷列表（新增/编辑成功后调用）
const resetAndReload = () : Promise<void> => {
	currentPage.value = 0
	noMore.value = false
	honors.value = []
	return loadMore()
}

onMounted((): void => {
	loadMore()
})

/* ---------------- 新增 / 编辑弹层 ---------------- */
type DialogMode = 'create' | 'edit'
type DialogState = {
	visible : boolean
	mode : DialogMode
	honorId : string          // edit 时定位原行
	name : string
	image : string            // '' = 尚未选择
	error : string
}
const dialog = ref<DialogState>({
	visible: false, mode: 'create', honorId: '',
	name: '', image: '', error: ''
})

const onTapAdd = () : void => {
	dialog.value = {
		visible: true, mode: 'create', honorId: '',
		name: '', image: '', error: ''
	}
}
const onTapEdit = (h : AdminHonorRow) : void => {
	dialog.value = {
		visible: true, mode: 'edit', honorId: h.id,
		name: h.name, image: h.image, error: ''
	}
}

const onTapDlgCancel = () : void => { dialog.value.visible = false }
const onTapDlgMask = () : void => { dialog.value.visible = false }

/* ---------------- 输入 / 选板 ---------------- */
// 改任何字段都清掉旧错误，避免红色提示一直挂着
const onNameInput = (e : any) : void => {
	dialog.value.name = (e.detail.value || '').toString()
	if (dialog.value.error.length > 0) { dialog.value.error = '' }
}

// 相册选图：先选本地临时图，再调上传接口换取 URL，URL 进预览与保存
const onTapChooseAlbum = () : void => {
	if (uploading.value) { return }
	uni.chooseImage({
		count: 1,
		sizeType: ['compressed'],
		success: (res : any) => {
			const paths : string[] = (res.tempFilePaths || []) as string[]
			if (paths.length == 0) { return }
			uploading.value = true
			uploadHonorImage(paths[0]).then((url : string) => {
				dialog.value.image = url
				if (dialog.value.error.length > 0) { dialog.value.error = '' }
			}).catch((err : Error) => {
				dialog.value.error = err.message || '图片上传失败'
			}).finally(() => {
				uploading.value = false
			})
		}
	})
}

/* ---------------- 保存（校验 + 接口 + 回刷） ---------------- */
const onTapSave = () : void => {
	if (saving.value) { return }
	if (uploading.value) { dialog.value.error = '图片上传中，请稍候'; return }
	const d = dialog.value

	// ---- 校验（对齐后端 HonorCreateRequest 提示） ----
	const name : string = d.name.trim()
	if (name.length == 0) { d.error = '请输入名称'; return }
	if (d.image.length == 0) { d.error = '请选择图片'; return }

	// ---- 组 payload：id 有值 = 更新；dialog.image → 后端 imageUrl ----
	const payload : HonorSavePayload = {
		name: name,
		imageUrl: d.image
	}
	const isCreate : boolean = d.mode == 'create'
	if (!isCreate) {
		const idNum : number = Number(d.honorId)
		if (idNum > 0) { payload.id = idNum }
	}

	saving.value = true
	createHonor(payload).then(() => {
		dialog.value.visible = false
		uni.showToast({ title: isCreate ? '已新增' : '已保存', icon: 'none' })
		resetAndReload()
	}).catch((err : Error) => {
		d.error = err.message || '保存失败'
	}).finally(() => {
		saving.value = false
	})
}

/* ---------------- 删除（本地操作，后端未提供接口） ---------------- */
const onTapDelete = (h : AdminHonorRow) : void => {
	uni.showModal({
		title: '删除荣誉',
		content: '确定删除「' + h.name + '」吗？已获得的玩家将失去该背景板',
		confirmText: '删除',
		confirmColor: '#FF6255',
		success: (res : any) => {
			if (res.confirm) {
				const len : number = honors.value.length
				for (let i : number = 0; i < len; i++) {
					if (honors.value[i].id == h.id) {
						honors.value.splice(i, 1)
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
	background-color: #0B0D0C;
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
	background-color: #FF62551F;
	border: 1rpx solid #FF625559;
	border-radius: 16rpx;
}
.add-btn-text {
	font-size: 24rpx;
	color: #FF6255;
	font-weight: 600;
}

/* ============ 荣誉卡片 ============ */
.hcard {
	background-color: #1A1E1D;
	border: 1rpx solid #2A2F2D;
	border-radius: 24rpx;
	padding: 20rpx;
	margin-bottom: 20rpx;
	box-sizing: border-box;
	box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
}

/* 背景板预览：长条图（约 3.4:1 展示） */
.strip {
	height: 190rpx;
	border-radius: 16rpx;
	overflow: hidden;
}
.strip-img {
	width: 100%;
	height: 190rpx;
}
/* 荣誉名：图片下方一行 */
.h-name-row {
	flex-direction: row;
	align-items: center;
	margin-top: 14rpx;
	padding: 0 6rpx;
}
.h-name {
	font-size: 26rpx;
	color: #EDEFEE;
	font-weight: 600;
}
.h-name-ph {
	color: #6E7573;
	font-weight: 500;
}
.h-cap {
	font-size: 18rpx;
	color: #6E7573;
	margin-left: auto;
}
.strip-none {
	width: 100%;
	height: 190rpx;
	align-items: center;
	justify-content: center;
	border: 1rpx dashed #3A3E3D;
	border-radius: 16rpx;
	box-sizing: border-box;
}
.strip-none-text {
	font-size: 22rpx;
	color: #6E7573;
}
.strip-mini {
	height: 150rpx;
}
.strip-mini .strip-img {
	height: 150rpx;
}
.strip-mini .strip-none {
	height: 150rpx;
}

/* 操作区 */
.actions {
	flex-direction: row;
	margin-top: 18rpx;
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
	background-color: #FF62551F;
	border: 1rpx solid #FF625559;
	align-items: center;
	justify-content: center;
}
.empty-icon-text {
	font-size: 40rpx;
	color: #FF6255;
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
/* 加载脚注 */
.list-foot {
	align-items: center;
	justify-content: center;
	padding: 16rpx 0 8rpx;
}
.list-foot-text {
	font-size: 22rpx;
	color: #4A4F4D;
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

/* 背景板：相册选择 */
.bg-grid {
	flex-direction: row;
	flex-wrap: wrap;
	justify-content: space-between;
}
.bg-tile {
	width: 276rpx;
	border: 2rpx solid #2A2E2D;
	border-radius: 14rpx;
	padding: 10rpx;
	margin-bottom: 16rpx;
	box-sizing: border-box;
}
.bg-tile-on {
	border-color: #FF6255;
}
.bg-tile-album {
	height: 138rpx;
	align-items: center;
	justify-content: center;
}
.bg-tile-plus {
	font-size: 40rpx;
	color: #6E7573;
	font-weight: 600;
}
.bg-tile-label {
	font-size: 19rpx;
	color: #9AA19E;
	margin-top: 8rpx;
	text-align: center;
}
.bg-tile-label-on {
	color: #FF6255;
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
	background-color: #FF6255;
	margin-right: 0;
}
.dlg-btn-ok-text {
	font-size: 25rpx;
	color: #0B0D0C;
	font-weight: 700;
}
</style>
