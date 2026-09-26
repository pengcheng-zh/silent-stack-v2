<template>
	<scroll-view class="page" direction="vertical" :show-scrollbar="false">

		<!-- ============ 品牌 Hero ============ -->
		<view class="hero">
			<view class="hero-glow"></view>
			<view class="hero-logo">
				<view class="hero-logo-in">
					<text class="hero-logo-text">♠</text>
				</view>
			</view>
			<text class="hero-name">沉默的筹码</text>
			<text class="hero-slogan">SILENT STACK · 专业德州扑克比赛管理平台</text>
			<view class="hero-ver-pill">
				<text class="hero-ver-text">Version 2.0.0</text>
			</view>
		</view>

		<!-- ============ 产品介绍 ============ -->
		<view class="card">
			<view class="card-head">
				<view class="card-bar"></view>
				<text class="card-title">关于我们</text>
			</view>
			<text class="para">「沉默的筹码」是一款专业的德州扑克比赛管理平台，致力于为德州扑克爱好者提供便捷、公正、专业的比赛服务。</text>
			<text class="para para-vision">我们的愿景是打造一个公平竞技、社交互动的德州扑克社区，让每一位玩家都能享受到纯粹的扑克乐趣。</text>
		</view>

		<!-- ============ 核心功能 ============ -->
		<view class="card">
			<view class="card-head">
				<view class="card-bar"></view>
				<text class="card-title">核心功能</text>
			</view>
			<view
				v-for="(f, i) in features"
				:key="f.title"
				class="feat"
				:class="{ 'feat-last': i == features.length - 1 }"
			>
				<view class="feat-icon" :style="iconBgStyle(f.color)">
					<text class="feat-icon-text" :style="'color:' + f.color + ';'">{{ f.icon }}</text>
				</view>
				<view class="feat-main">
					<text class="feat-title">{{ f.title }}</text>
					<text class="feat-desc">{{ f.desc }}</text>
				</view>
			</view>
		</view>

		<!-- ============ 版权 ============ -->
		<view class="foot">
			<view class="foot-divider"></view>
			<text class="foot-text">© 2026 沉默的筹码 版权所有</text>
		</view>

		<view class="footer-blank"></view>
	</scroll-view>
</template>

<script setup lang="ts">
/* ---------------- 核心功能 ---------------- */
// icon 取单字角标，color 沿用项目调色板
type Feature = {
	icon : string
	title : string
	desc : string
	color : string
}

const features : Feature[] = [
	{ icon: '赛', title: '专业赛事管理', desc: '支持多种比赛模式',     color: '#E8C275' },
	{ icon: '统', title: '实时数据统计', desc: '记录每场对局',         color: '#2AA97A' },
	{ icon: '段', title: '段位积分系统', desc: '公平竞技排名',         color: '#7AB6F2' },
	{ icon: '店', title: '多店铺支持',   desc: '就近参与比赛',         color: '#B07AE8' }
]

const iconBgStyle = (color : string) : string => {
	return 'background-color:' + color + '1F;border:1rpx solid ' + color + '59;'
}
</script>

<style scoped>
.page {
	min-height: 100vh;
	background-color: #0B0D0C;
	padding: 24rpx;
	box-sizing: border-box;
}

/* ============ 品牌 Hero ============ */
.hero {
	align-items: center;
	padding: 80rpx 0 60rpx;
	position: relative;
}
/* 顶部金色氛围光 */
.hero-glow {
	position: absolute;
	left: 0; right: 0; top: -24rpx;
	height: 360rpx;
	background-image: radial-gradient(ellipse at center top, rgba(232, 194, 117, 0.14), rgba(232, 194, 117, 0) 70%);
}
.hero-logo {
	width: 152rpx;
	height: 152rpx;
	border-radius: 38rpx;
	background-image: linear-gradient(160deg, #2A2415, #171A19 70%);
	border: 1rpx solid #E8C27559;
	align-items: center;
	justify-content: center;
	box-shadow: 0 12rpx 32rpx rgba(232, 194, 117, 0.12);
}
.hero-logo-in {
	width: 116rpx;
	height: 116rpx;
	border-radius: 30rpx;
	background-color: #E8C2751F;
	align-items: center;
	justify-content: center;
}
.hero-logo-text {
	font-size: 76rpx;
	color: #E8C275;
	font-weight: 700;
	line-height: 84rpx;
}
.hero-name {
	font-size: 42rpx;
	color: #EDEFEE;
	font-weight: 700;
	margin-top: 30rpx;
	letter-spacing: 2rpx;
}
.hero-slogan {
	font-size: 21rpx;
	color: #6E7573;
	margin-top: 12rpx;
	letter-spacing: 3rpx;
}
.hero-ver-pill {
	margin-top: 24rpx;
	padding: 6rpx 22rpx;
	border-radius: 999rpx;
	background-color: #171A19;
	border: 1rpx solid #242827;
}
.hero-ver-text {
	font-size: 20rpx;
	color: #9AA19E;
	letter-spacing: 1rpx;
}

/* ============ 卡片通用 ============ */
.card {
	background-color: #171A19;
	border: 1rpx solid #242827;
	border-radius: 24rpx;
	padding: 30rpx 28rpx;
	margin-bottom: 22rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.30);
}
.card-head {
	flex-direction: row;
	align-items: center;
	margin-bottom: 20rpx;
}
.card-bar {
	width: 6rpx;
	height: 28rpx;
	background-image: linear-gradient(180deg, #F5D98E, #C89B3C);
	border-radius: 6rpx;
	margin-right: 12rpx;
	box-shadow: 0 2rpx 8rpx rgba(232, 194, 117, 0.30);
}
.card-title {
	font-size: 30rpx;
	color: #EDEFEE;
	font-weight: 700;
}

/* 介绍段落 */
.para {
	font-size: 25rpx;
	color: #B4BAB7;
	line-height: 44rpx;
}
.para-vision {
	margin-top: 18rpx;
	padding-top: 18rpx;
	border-top: 1rpx solid #242827;
}

/* ============ 功能行 ============ */
.feat {
	flex-direction: row;
	align-items: center;
	padding: 20rpx 0;
	border-bottom: 1rpx solid rgba(36, 40, 39, 0.6);
}
.feat-last { border-bottom-width: 0; }
.feat-icon {
	width: 72rpx;
	height: 72rpx;
	border-radius: 18rpx;
	align-items: center;
	justify-content: center;
	margin-right: 18rpx;
}
.feat-icon-text {
	font-size: 30rpx;
	font-weight: 700;
}
.feat-main {
	flex: 1;
	flex-direction: column;
}
.feat-title {
	font-size: 27rpx;
	color: #EDEFEE;
	font-weight: 600;
}
.feat-desc {
	font-size: 21rpx;
	color: #6E7573;
	margin-top: 6rpx;
}

/* ============ 版权 ============ */
.foot {
	align-items: center;
	padding-top: 36rpx;
}
.foot-divider {
	width: 88rpx;
	height: 2rpx;
	background-color: #242827;
	margin-bottom: 20rpx;
}
.foot-text {
	font-size: 20rpx;
	color: #4A4F4D;
	letter-spacing: 1rpx;
}
.footer-blank { height: 60rpx; }
</style>
