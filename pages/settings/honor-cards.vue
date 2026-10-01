<template>
	<scroll-view class="page" direction="vertical" :show-scrollbar="false">

		<!-- ============ 加载中 ============ -->
		<view v-if="loading" class="state-box">
			<text class="state-text">加载中…</text>
		</view>

		<!-- ============ 空态 ============ -->
		<view v-else-if="cards.length == 0" class="state-box">
			<text class="state-icon">🏅</text>
			<text class="state-text">{{ adminUserId > 0 ? '该用户暂无荣誉卡' : '暂无荣誉卡，赢得比赛后即可获得' }}</text>
			<view v-if="adminUserId > 0" class="add-btn add-btn-empty" @tap="onTapAddHonor">
				<text class="add-btn-text">＋ 添加荣誉</text>
			</view>
		</view>

		<!-- ============ 内容 ============ -->
		<template v-else>
			<!-- 当前展示中的卡片预览 -->
			<view class="preview-card">
				<text class="preview-label">当前展示</text>
				<image
					v-if="currentCard != null"
					class="preview-strip"
					:src="currentCard.image"
					mode="aspectFill"
				></image>
				<view v-else class="preview-strip preview-strip-empty">
					<text class="preview-strip-empty-text">暂未选用背景卡</text>
				</view>
				<text class="preview-name">{{ currentCard ? currentCard.name : '未使用背景卡' }}</text>
			</view>

			<!-- 管理员：给该用户添加荣誉 -->
			<view v-if="adminUserId > 0" class="add-btn" @tap="onTapAddHonor">
				<text class="add-btn-text">＋ 添加荣誉</text>
			</view>

			<!-- 荣誉卡列表 -->
			<view class="section-head">
				<text class="section-title">{{ adminUserId > 0 ? '该用户的荣誉卡' : '我获得的荣誉卡' }}（{{ cards.length }}）</text>
				<text v-if="adminUserId == 0" class="section-tip">点击选用</text>
			</view>

			<view class="card-list">
				<view
					v-for="c in cards"
					:key="c.id"
					class="card-item"
					:class="{ 'card-item-active': c.active }"
					@tap="onTapCard(c)"
				>
					<image class="card-strip" :src="c.image" mode="aspectFill"></image>
					<view class="card-info">
						<text class="card-name">{{ c.name }}</text>
					</view>
					<view class="card-check" :class="{ 'card-check-on': c.active }">
						<text v-if="c.active" class="card-check-text">✓</text>
					</view>
				</view>
			</view>

			<!-- 不使用（仅本人模式） -->
			<view v-if="adminUserId == 0" class="none-btn" @tap="onTapNone">
				<text class="none-btn-text">不使用背景卡</text>
			</view>
		</template>

		<!-- ============ 管理员：添加荣誉弹层 ============ -->
		<view v-if="dlg.visible" class="dlg-overlay" @tap="onTapDlgMask">
			<view class="dlg-card" @tap.stop="">
				<view class="dlg-head">
					<text class="dlg-title">添加荣誉</text>
					<text class="dlg-sub">从荣誉列表中选择一项授予该用户</text>
				</view>

				<scroll-view class="dlg-honor-list" scroll-y>
					<view v-if="dlgLoading" class="dlg-state">
						<text class="dlg-state-text">荣誉加载中…</text>
					</view>
					<view v-else-if="honorDefs.length == 0" class="dlg-state">
						<text class="dlg-state-text">暂无可选荣誉</text>
					</view>
					<view
						v-for="h in honorDefs"
						:key="h.id"
						class="dlg-honor-row"
						:class="{ 'dlg-honor-row-on': dlg.honorId == h.id }"
						@tap="onPickHonorDef(h)"
					>
						<image v-if="h.imageUrl.length > 0" class="dlg-honor-img" :src="h.imageUrl" mode="aspectFill"></image>
						<view v-else class="dlg-honor-img dlg-honor-img-empty">
							<text class="dlg-honor-img-text">🏅</text>
						</view>
						<text class="dlg-honor-name">{{ h.honorName }}</text>
						<view class="dlg-honor-check" :class="{ 'dlg-honor-check-on': dlg.honorId == h.id }">
							<text v-if="dlg.honorId == h.id" class="dlg-check-text">✓</text>
						</view>
					</view>
				</scroll-view>

				<view class="dlg-btns">
					<view class="dlg-btn dlg-btn-cancel" @tap="onTapDlgCancel">
						<text class="dlg-btn-text dlg-btn-cancel-text">取消</text>
					</view>
					<view class="dlg-btn dlg-btn-ok" @tap="onTapDlgConfirm">
						<text class="dlg-btn-text dlg-btn-ok-text">确认添加</text>
					</view>
				</view>
			</view>
		</view>

		<view class="footer-blank"></view>
	</scroll-view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { fetchMyHonorCards, fetchUserHonorCards, grantUserHonor, getMyHonorCard, setMyHonorCard, useMyHonorCard, unuseAllHonorCards } from '@/common/honor-card-data'
import type { MyHonorCard } from '@/common/honor-card-data'
import { fetchHonorList } from '@/common/honor-api'
import type { HonorVO } from '@/common/honor-api'

const cards = ref<MyHonorCard[]>([])
const currentCard = ref<MyHonorCard | null>(getMyHonorCard())
const loading = ref(true)
const submitting = ref(false)

// 管理员模式：url 带 userId 时查看/管理该用户的荣誉（普通入口不带此参数）
const adminUserId = ref<number>(0)

/* ---------------- 加载列表 ---------------- */
// 本人模式：GET /user-honor/my-list；管理员模式：GET /user-honor/list?userId=
const load = () : void => {
	loading.value = true
	const req = adminUserId.value > 0 ? fetchUserHonorCards(adminUserId.value) : fetchMyHonorCards()
	req.then((list) => {
		cards.value = list
		const act = list.filter((c) => { return c.active })
		currentCard.value = act.length > 0 ? act[0] : null
		// 本地缓存仅用于本人模式"我的背景卡"即时展示，管理员模式不动缓存
		if (adminUserId.value == 0 && currentCard.value != null) { setMyHonorCard(currentCard.value) }
		loading.value = false
	}).catch((e : any) => {
		loading.value = false
		uni.showToast({ title: e && e.message ? e.message : '加载失败，请重试', icon: 'none' })
	})
}

onLoad((q : any) => {
	adminUserId.value = Number((q && q.userId) || 0)
	if (adminUserId.value > 0) { uni.setNavigationBarTitle({ title: '用户荣誉卡' }) }
	load()
})

/* ---------------- 选用 / 取消（仅本人模式） ---------------- */
// 先调接口，成功后更新本地状态 + 缓存
const onTapCard = (c : MyHonorCard) : void => {
	if (adminUserId.value > 0) { return }	// 管理员查看模式：use 接口只对登录本人生效，不开放
	if (submitting.value) { return }
	if (c.active) { return }		// 已是展示中的卡，重复点击不处理
	submitting.value = true
	useMyHonorCard(c.id).then(() => {
		submitting.value = false
		for (let i = 0; i < cards.value.length; i++) {
			cards.value[i].active = cards.value[i].id == c.id
		}
		currentCard.value = c
		setMyHonorCard(c)
		uni.showToast({ title: '已选用「' + c.name + '」', icon: 'none' })
	}).catch((e : any) => {
		submitting.value = false
		uni.showToast({ title: e && e.message ? e.message : '操作失败，请重试', icon: 'none' })
	})
}

const onTapNone = () : void => {
	if (adminUserId.value > 0) { return }
	if (submitting.value) { return }
	if (currentCard.value == null) { return }
	submitting.value = true
	unuseAllHonorCards().then(() => {
		submitting.value = false
		for (let i = 0; i < cards.value.length; i++) {
			cards.value[i].active = false
		}
		currentCard.value = null
		setMyHonorCard(null)
		uni.showToast({ title: '已取消使用', icon: 'none' })
	}).catch((e : any) => {
		submitting.value = false
		uni.showToast({ title: e && e.message ? e.message : '操作失败，请重试', icon: 'none' })
	})
}

/* ============== 管理员：添加荣誉弹层 ============== */
type AddHonorState = { visible : boolean, honorId : number }
const dlg = ref<AddHonorState>({ visible: false, honorId: 0 })
const dlgLoading = ref(false)
const honorDefs = ref<HonorVO[]>([])
const onTapAddHonor = () : void => {
	dlg.value = { visible: true, honorId: 0 }
	if (honorDefs.value.length > 0) { return }	// 定义列表全局复用，拉一次即可
	dlgLoading.value = true
	fetchHonorList(1, 100).then((p) => {
		honorDefs.value = p.list
		dlgLoading.value = false
	}).catch(() => {
		dlgLoading.value = false
		uni.showToast({ title: '荣誉列表加载失败', icon: 'none' })
	})
}
const onPickHonorDef = (h : HonorVO) : void => { dlg.value.honorId = h.id }
const onTapDlgMask = () : void => { dlg.value.visible = false }
const onTapDlgCancel = () : void => { dlg.value.visible = false }
const onTapDlgConfirm = () : void => {
	if (submitting.value) { return }
	if (dlg.value.honorId == 0) { uni.showToast({ title: '请先选择荣誉', icon: 'none' }); return }
	submitting.value = true
	// POST /user-honor/grant；成功后重新拉取，以服务端为准
	grantUserHonor(adminUserId.value, dlg.value.honorId).then(() => {
		submitting.value = false
		dlg.value.visible = false
		uni.showToast({ title: '已添加荣誉', icon: 'none' })
		load()
	}).catch((e : any) => {
		submitting.value = false
		uni.showToast({ title: e && e.message ? e.message : '添加失败，请重试', icon: 'none' })
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

/* ============ 加载 / 空态 ============ */
.state-box {
	align-items: center;
	padding: 160rpx 0 80rpx;
}
.state-icon { font-size: 64rpx; }
.state-text {
	font-size: 24rpx;
	color: #6E7573;
	margin-top: 20rpx;
}

/* ============ 当前展示预览 ============ */
.preview-card {
	background-color: #171A19;
	border: 1rpx solid #E8C27540;
	border-radius: 20rpx;
	padding: 24rpx;
	margin-bottom: 30rpx;
	align-items: center;
}
.preview-label {
	font-size: 20rpx;
	color: #6E7573;
	letter-spacing: 2rpx;
}
.preview-strip {
	width: 100%;
	height: 128rpx;
	border-radius: 14rpx;
	margin-top: 16rpx;
}
.preview-strip-empty {
	background-color: #0F1211;
	border: 1rpx dashed #2A2F2D;
	align-items: center;
	justify-content: center;
}
.preview-strip-empty-text {
	font-size: 22rpx;
	color: #4A4F4D;
}
.preview-name {
	font-size: 25rpx;
	color: #E8C275;
	font-weight: 600;
	margin-top: 16rpx;
}

/* ============ 列表 ============ */
.section-head {
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	padding: 0 4rpx;
	margin-bottom: 16rpx;
}
.section-title {
	font-size: 27rpx;
	color: #EDEFEE;
	font-weight: 600;
}
.section-tip {
	font-size: 21rpx;
	color: #6E7573;
}
.card-list {
	flex-direction: column;
}
.card-item {
	flex-direction: row;
	align-items: center;
	background-color: #171A19;
	border: 1rpx solid #242827;
	border-radius: 18rpx;
	padding: 18rpx 20rpx;
	margin-bottom: 16rpx;
}
/* 选中态：金色描边 */
.card-item-active {
	border-color: #E8C27599;
	background-color: #1D1C15;
}
.card-strip {
	width: 260rpx;
	height: 96rpx;
	border-radius: 10rpx;
	flex-shrink: 0;
}
.card-info {
	flex: 1;
	flex-direction: column;
	margin-left: 20rpx;
}
.card-name {
	font-size: 27rpx;
	color: #EDEFEE;
	font-weight: 600;
}
.card-check {
	width: 44rpx;
	height: 44rpx;
	border-radius: 22rpx;
	border: 2rpx solid #3A3E3D;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.card-check-on {
	border-color: #E8C275;
	background-color: #E8C275;
}
.card-check-text {
	font-size: 26rpx;
	color: #14100A;
	font-weight: 700;
	line-height: 30rpx;
}

/* ============ 不使用 ============ */
.none-btn {
	margin-top: 8rpx;
	height: 92rpx;
	background-color: #1A1E1D;
	border: 1rpx solid #2A2F2D;
	border-radius: 22rpx;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.30);
}
.none-btn-text {
	font-size: 25rpx;
	color: #9AA19E;
}

/* ============ 管理员：添加荣誉按钮 ============ */
.add-btn {
	height: 88rpx;
	background-color: #E8C275;
	border-radius: 22rpx;
	align-items: center;
	justify-content: center;
	margin-bottom: 30rpx;
	box-shadow: 0 6rpx 18rpx rgba(232, 194, 117, 0.22);
}
.add-btn-text {
	font-size: 27rpx;
	color: #14100A;
	font-weight: 700;
}
.add-btn-empty {
	margin-top: 30rpx;
	margin-bottom: 0;
	padding: 0 48rpx;
}

/* ============ 添加荣誉弹层 ============ */
.dlg-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(5, 6, 6, 0.72);
	z-index: 100;
	justify-content: center;
	align-items: center;
}
.dlg-card {
	width: 620rpx;
	background-color: #171A19;
	border: 1rpx solid #242827;
	border-radius: 20rpx;
	padding: 28rpx;
}
.dlg-title {
	font-size: 30rpx;
	color: #EDEFEE;
	font-weight: 700;
}
.dlg-sub {
	font-size: 21rpx;
	color: #6E7573;
	margin-top: 6rpx;
}
.dlg-honor-list {
	max-height: 560rpx;
	margin-top: 20rpx;
}
.dlg-state {
	padding: 60rpx 0;
	align-items: center;
}
.dlg-state-text {
	font-size: 22rpx;
	color: #6E7573;
}
.dlg-honor-row {
	flex-direction: row;
	align-items: center;
	padding: 16rpx 8rpx;
	border-bottom: 1rpx solid #242827;
}
.dlg-honor-row-on {
	background-color: #1D1C15;
}
.dlg-honor-img {
	width: 150rpx;
	height: 56rpx;
	border-radius: 8rpx;
	background-color: #0F1211;
	flex-shrink: 0;
}
.dlg-honor-img-empty {
	align-items: center;
	justify-content: center;
}
.dlg-honor-img-text {
	font-size: 26rpx;
}
.dlg-honor-name {
	flex: 1;
	font-size: 26rpx;
	color: #EDEFEE;
	font-weight: 600;
	margin-left: 16rpx;
}
.dlg-honor-check {
	width: 40rpx;
	height: 40rpx;
	border-radius: 20rpx;
	border: 2rpx solid #3A3E3D;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.dlg-honor-check-on {
	border-color: #E8C275;
	background-color: #E8C275;
}
.dlg-check-text {
	font-size: 24rpx;
	color: #14100A;
	font-weight: 700;
}
.dlg-btns {
	flex-direction: row;
	margin-top: 24rpx;
}
.dlg-btn {
	flex: 1;
	height: 84rpx;
	border-radius: 18rpx;
	align-items: center;
	justify-content: center;
}
.dlg-btn-cancel {
	background-color: #1A1E1D;
	border: 1rpx solid #2A2F2D;
	margin-right: 20rpx;
}
.dlg-btn-ok {
	background-color: #E8C275;
}
.dlg-btn-text {
	font-size: 26rpx;
}
.dlg-btn-cancel-text {
	color: #9AA19E;
}
.dlg-btn-ok-text {
	color: #14100A;
	font-weight: 700;
}

.footer-blank { height: 60rpx; }
</style>
