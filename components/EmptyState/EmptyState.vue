<template>
	<view class="empty">
		<view class="empty-card">
			<view class="empty-diamond"></view>
		</view>
		<text class="empty-title">{{ title }}</text>
		<text v-if="desc != ''" class="empty-desc">{{ desc }}</text>
	</view>
</template>

<script setup lang="ts">
const props = defineProps({
	title: { type: String, required: true },
	desc:  { type: String, default: '' }
})
</script>

<style>
	.empty {
		flex: 1;
		align-items: center;
		justify-content: center;
		padding: 80rpx 48rpx;
	}
	.empty-card {
		width: 156rpx;
		height: 208rpx;
		border-radius: 24rpx;
		background-color: #1D1B14;
		border: 4rpx solid rgba(232, 194, 117, 0.35);
		align-items: center;
		justify-content: center;
		transform: rotate(-6deg);
		box-shadow: 0 6rpx 18rpx rgba(217, 164, 65, 0.18);
	}
	.empty-diamond {
		width: 56rpx;
		height: 56rpx;
		border-radius: 12rpx;
		background-image: linear-gradient(135deg, #F5D98E, #C89B3C);
		transform: rotate(45deg);
	}
	.empty-title {
		font-size: 32rpx;
		color: #EDEFEE;
		font-weight: 700;
		margin-top: 44rpx;
	}
	.empty-desc {
		font-size: 24rpx;
		color: #8F9492;
		margin-top: 12rpx;
		text-align: center;
	}
</style>
