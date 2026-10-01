<template>
	<scroll-view class="page" direction="vertical" :show-scrollbar="false">

		<!-- ============ 功能模块宫格 ============ -->
		<!-- 2 列布局，酒德管理（第 7 项）独占一行压底 -->
		<view class="grid">
			<view
				v-for="m in menus"
				:key="m.key"
				class="cell"
				:class="{ 'cell-full': m.full }"
				@tap="onTapMenu(m)"
			>
				<view class="cell-icon" :style="iconStyle(m)">
					<text class="cell-icon-text" :style="iconTextStyle(m)">{{ m.icon }}</text>
				</view>
				<view class="cell-main">
					<text class="cell-title">{{ m.title }}</text>
				</view>
				<text class="cell-arrow">›</text>
			</view>
		</view>

		<!-- ============ 脚注 ============ -->
		<view class="foot">
			<text class="foot-text">管理操作将实时同步至所有客户端\n敏感操作需二次确认后生效</text>
		</view>

		<view class="footer-blank"></view>
	</scroll-view>
</template>

<script setup lang="ts">
/* ---------------- 功能模块 ---------------- */
// 7 个后台模块的入口元数据；key 唯一、icon 取单字做角标
// color 沿用项目调色板：金 #E8C275 / 绿 #2AA97A / 蓝 #7AB6F2 / 紫 #B07AE8 / 红 #FF6255 / 青 #57C79A / 银 #C7CDCB
type AdminMenu = {
	key : string
	icon : string
	title : string
	sub : string
	color : string
	full ?: boolean			// 第 7 项（酒德管理）独占一行
}

const menus : AdminMenu[] = [
	{ key: 'store',   icon: '店', title: '店铺管理', sub: '9 家门店 · 2 家待审核',   color: '#E8C275' },
	{ key: 'match',   icon: '赛', title: '比赛管理', sub: '12 场进行中',             color: '#2AA97A' },
	{ key: 'user',    icon: '人', title: '用户管理', sub: '2,845 位注册玩家',        color: '#7AB6F2' },
	{ key: 'season',  icon: '季', title: '赛季管理', sub: 'S3 赛季进行中',           color: '#B07AE8' },
	{ key: 'honor',   icon: '荣', title: '荣誉管理', sub: '24 项荣誉勋章',           color: '#FF6255' },
	{ key: 'notice',  icon: '告', title: '公告管理', sub: '3 条草稿待发布',          color: '#57C79A' },
	{ key: 'jiude',   icon: '德', title: '酒德管理', sub: '酒德规则 · 存取审批',      color: '#C7CDCB', full: true }
]

/* ---------------- 样式工具 ---------------- */
const iconStyle = (m : AdminMenu) : string => {
	return 'background-color:' + m.color + '1F;border:1rpx solid ' + m.color + '59;'
}
const iconTextStyle = (m : AdminMenu) : string => 'color:' + m.color + ';'

/* ---------------- 交互 ---------------- */
// 店铺管理 / 比赛管理已建子页；其余模块先 toast 占位，接好后在此补路由即可
const onTapMenu = (m : AdminMenu) : void => {
	if (m.key == 'store') {
		uni.navigateTo({ url: '/pages/admin-store/admin-store' })
		return
	}
	if (m.key == 'match') {
		uni.navigateTo({ url: '/pages/admin-tournament/admin-tournament' })
		return
	}
	if (m.key == 'user') {
		uni.navigateTo({ url: '/pages/admin-user/admin-user' })
		return
	}
	if (m.key == 'season') {
		uni.navigateTo({ url: '/pages/admin-season/admin-season' })
		return
	}
	if (m.key == 'honor') {
		uni.navigateTo({ url: '/pages/admin-honor/admin-honor' })
		return
	}
	if (m.key == 'notice') {
		uni.navigateTo({ url: '/pages/admin-notice/admin-notice' })
		return
	}
	if (m.key == 'jiude') {
		uni.navigateTo({ url: '/pages/admin-jiude/admin-jiude' })
		return
	}
	uni.showToast({ title: m.title + ' · 即将上线', icon: 'none' })
}
</script>

<style scoped>
.page {
	min-height: 100vh;
	background-image: linear-gradient(180deg, #0E1110 0%, #0A0C0B 40%, #0B0D0C 100%);
	padding: 24rpx;
	box-sizing: border-box;
}

/* ============ 功能宫格 ============ */
.grid {
	flex-direction: row;
	flex-wrap: wrap;
	justify-content: space-between;
}
.cell {
	width: 341rpx;				/* (750 - 24*2 padding - 20 gap) / 2 */
	flex-direction: row;
	align-items: center;
	padding: 26rpx 20rpx;
	background-color: #1A1E1D;
	border-radius: 24rpx;
	border: 1rpx solid #2A2F2D;
	margin-bottom: 20rpx;
	box-sizing: border-box;
	box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
}
.cell-full {
	width: 100%;
}
.cell-icon {
	width: 76rpx;
	height: 76rpx;
	border-radius: 18rpx;
	align-items: center;
	justify-content: center;
	margin-right: 16rpx;
}
.cell-icon-text {
	font-size: 32rpx;
	font-weight: 700;
}
.cell-main {
	flex: 1;
	flex-direction: column;
}
.cell-title {
	font-size: 27rpx;
	color: #EDEFEE;
	font-weight: 600;
}
.cell-sub {
	font-size: 19rpx;
	color: #6E7573;
	margin-top: 6rpx;
}
.cell-arrow {
	font-size: 30rpx;
	color: #4A4F4D;
	margin-left: 6rpx;
}

/* ============ 脚注 ============ */
.foot {
	padding: 20rpx 8rpx 0;
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
