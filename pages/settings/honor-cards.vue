<template>
	<scroll-view class="page" direction="vertical" :show-scrollbar="false">

		<!-- ============ 加载中 ============ -->
		<view v-if="loading" class="state-box">
			<text class="state-text">加载中…</text>
		</view>

		<!-- ============ 空态 ============ -->
		<view v-else-if="cards.length == 0" class="state-box">
			<text class="state-icon">🏅</text>
			<text class="state-text">暂无荣誉卡，赢得比赛后即可获得</text>
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

			<!-- 荣誉卡列表 -->
			<view class="section-head">
				<text class="section-title">我获得的荣誉卡（{{ cards.length }}）</text>
				<text class="section-tip">点击选用</text>
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

			<!-- 不使用 -->
			<view class="none-btn" @tap="onTapNone">
				<text class="none-btn-text">不使用背景卡</text>
			</view>
		</template>

		<view class="footer-blank"></view>
	</scroll-view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchMyHonorCards, getMyHonorCard, setMyHonorCard, useMyHonorCard, unuseAllHonorCards } from '@/common/honor-card-data'
import type { MyHonorCard } from '@/common/honor-card-data'

const cards = ref<MyHonorCard[]>([])
const currentCard = ref<MyHonorCard | null>(getMyHonorCard())
const loading = ref(true)
const submitting = ref(false)

/* ---------------- 加载列表 ---------------- */
// 服务端以 defaultActive == 'A' 标记当前展示卡
const load = () : void => {
	loading.value = true
	fetchMyHonorCards().then((list) => {
		cards.value = list
		const act = list.filter((c) => { return c.active })
		currentCard.value = act.length > 0 ? act[0] : null
		if (currentCard.value != null) { setMyHonorCard(currentCard.value) }
		loading.value = false
	}).catch((e : any) => {
		loading.value = false
		uni.showToast({ title: e && e.message ? e.message : '加载失败，请重试', icon: 'none' })
	})
}

onMounted(() => { load() })

/* ---------------- 选用 / 取消 ---------------- */
// 先调接口，成功后更新本地状态 + 缓存
const onTapCard = (c : MyHonorCard) : void => {
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

.footer-blank { height: 60rpx; }
</style>
