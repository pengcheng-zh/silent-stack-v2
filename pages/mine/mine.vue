<template>
	<scroll-view
		class="page"
		direction="vertical"
		:show-scrollbar="false"
	>

		<!-- ============ 个人名片 ============ -->
		<view class="hero-card">
			<view class="hero-top">
				<view class="hero-emblem">
					<image v-if="heroEmblemImg.length > 0" class="hero-emblem-img" :src="heroEmblemImg" mode="aspectFill" />
					<image v-else-if="heroFallbackImg.length > 0" class="hero-emblem-img" :src="heroFallbackImg" mode="aspectFill" />
					<view v-else class="hero-emblem-in">
						<text class="hero-emblem-text">{{ heroName.length > 0 ? heroName.substring(0, 1) : '我' }}</text>
					</view>
				</view>

				<view class="hero-info">
					<view class="hero-name-row">
						<text class="hero-name">{{ heroName }}</text>
						<view class="me-tag">
							<text class="me-tag-text">我</text>
						</view>
						<!-- 隐身生效时，紧贴名字右侧显示灰底胶囊，作为全局状态指示 -->
						<view v-if="stealthOn" class="stealth-badge">
							<text class="stealth-badge-text">隐身中</text>
						</view>
					</view>
					<image v-if="heroLevelImg.length > 0" class="hero-tier-img" :src="heroLevelImg" mode="heightFix" />
					<text v-else class="hero-tier">{{ heroTierText }}</text>
					<text class="hero-id">{{ heroId }}</text>
				</view>

				<view class="hero-points">
					<text class="hero-points-num">{{ heroPointsNum }}</text>
					<text class="hero-points-label">当前段位分</text>
				</view>
			</view>

			<view class="hero-stats">
				<template v-for="(c, ci) in statCells" :key="ci">
					<view v-if="ci > 0" class="hero-stat-divider"></view>
					<view class="hero-stat">
						<text class="hero-stat-value" :style="'color:' + c.color + ';'">{{ c.value }}</text>
						<text class="hero-stat-label">{{ c.label }}</text>
					</view>
				</template>
			</view>
		</view>

		<!-- ============ 我的酒德 ============ -->
		<view class="section">
			<view class="section-head">
				<view class="section-title-wrap">
					<view class="section-bar"></view>
					<text class="section-title">我的酒德</text>
				</view>
				<text class="section-count">S3 · 2026 秋</text>
			</view>

			<view class="jiude-card">
				<view class="jiude-cell">
					<text class="jiude-num" style="color:#2AA97A;">{{ jiudeMonthPoints }}</text>
					<text class="jiude-label">本月积分</text>
				</view>
				<view class="jiude-cell">
					<text class="jiude-num" style="color:#E8C275;">No.{{ jiudeRank }}</text>
					<text class="jiude-label">酒德排名</text>
				</view>
				<view class="jiude-cell">
					<text class="jiude-num" style="color:#EDEFEE;">{{ formatNum(jiudeBalance) }}</text>
					<text class="jiude-label">酒德余额</text>
				</view>
			</view>
		</view>

		<!-- ============ 我的资产 ============ -->
		<view class="section">
			<view class="section-head">
				<view class="section-title-wrap">
					<view class="section-bar"></view>
					<text class="section-title">我的资产</text>
				</view>
				<text class="section-count">通用 + {{ storeAssets.length }} 店</text>
			</view>

			<!-- 通用资产：月票 + 直通函 -->
			<view class="global-assets">
				<view class="ga-card ga-card-ticket">
					<view class="ga-icon">
						<text class="ga-icon-text">月</text>
					</view>
					<view class="ga-info">
						<text class="ga-name">月票</text>
						<text class="ga-sub">本月剩余</text>
					</view>
					<text class="ga-num">{{ globalMonthTicket }}</text>
				</view>

				<view class="ga-card ga-card-letter">
					<view class="ga-icon">
						<text class="ga-icon-text">通</text>
					</view>
					<view class="ga-info">
						<text class="ga-name">直通函</text>
						<text class="ga-sub">免资格入场</text>
					</view>
					<text class="ga-num">{{ globalInviteCard }}</text>
				</view>
			</view>

			<!-- 门店资产列表 -->
			<view class="store-assets">
				<view
					v-for="s in storeAssets"
					:key="s.storeId"
					class="sa-row"
				>
					<view class="sa-name-wrap">
						<text class="sa-name">{{ s.storeName }}</text>
					</view>
					<view class="sa-meta">
						<view class="sa-meta-item">
							<text class="sa-meta-label">余额</text>
							<text class="sa-meta-val" style="color:#EDEFEE;">¥ {{ formatNum(s.balance) }}</text>
						</view>
						<view class="sa-meta-divider"></view>
						<view class="sa-meta-item">
							<text class="sa-meta-label">门票</text>
							<text class="sa-meta-val" style="color:#2AA97A;">{{ s.ticket }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- ============ 设置 / 管理 ============ -->
		<view class="section">
			<view class="section-head">
				<view class="section-title-wrap">
					<view class="section-bar"></view>
					<text class="section-title">设置</text>
				</view>
			</view>

			<view class="entry-card">
				<!-- 隐身开关：开启后排行榜不展示我、对局中隐藏头像 -->
				<view class="entry-row entry-row-switch">
					<view class="entry-left">
						<view class="entry-icon entry-icon-stealth">隐</view>
						<view class="entry-text-wrap">
							<text class="entry-text">隐身模式</text>
							<text class="entry-sub">开启后对他人不可见</text>
						</view>
					</view>
					<switch
						class="entry-switch"
						:checked="stealthOn"
						color="#2AA97A"
						@change="onStealthChange"
					></switch>
				</view>

				<view class="entry-row" @tap="onTapSettings">
					<view class="entry-left">
						<view class="entry-icon entry-icon-default">⚙</view>
						<view class="entry-text-wrap">
							<text class="entry-text">账号设置</text>
						</view>
					</view>
					<text class="entry-arrow">›</text>
				</view>

				<view v-if="isAdmin" class="entry-row" @tap="onTapAdmin">
					<view class="entry-left">
						<view class="entry-icon entry-icon-admin">管</view>
						<view class="entry-text-wrap">
							<text class="entry-text">管理后台</text>
						</view>
					</view>
					<view class="entry-right">
						<view class="admin-badge">
							<text class="admin-badge-text">ADMIN</text>
						</view>
						<text class="entry-arrow">›</text>
					</view>
				</view>
			</view>
		</view>

		<view class="footer-blank"></view>
	</scroll-view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { fetchMyInfo, setStealth } from '@/common/user-api'
import type { CustomerVO, UserBalanceVO } from '@/common/user-api'
import { fetchMyJiude } from '@/common/jiude-api'
import type { UserJiuDeVO } from '@/common/jiude-api'
import { resolveFileUrl } from '@/common/http'

/* ---------------- 数据（接口直出，字段与后端 VO 一致） ---------------- */
// 我的信息：GET /user/info → CustomerVO
const profile = ref<CustomerVO | null>(null)
// 我的酒德：GET /jiu-de/info → UserJiuDeVO
const jiude = ref<UserJiuDeVO | null>(null)
// 门店资产：profile.balanceList
const storeAssets = ref<UserBalanceVO[]>([])

const loadAll = () : void => {
	fetchMyInfo().then((vo) => {
		profile.value = vo
		storeAssets.value = vo.balanceList || []
		stealthOn.value = vo.stealth == 'A'
	}).catch((err : Error) => {
		console.log('fetchMyInfo failed: ' + err.message)
	})
	fetchMyJiude().then((vo) => {
		jiude.value = vo
	}).catch((err : Error) => {
		console.log('fetchMyJiude failed: ' + err.message)
	})
}

// 每次进入页面都重新加载数据（onShow：首次进入 + 从其他页面返回时都会触发）
onShow((): void => { loadAll() })

/* ---------------- 工具 ---------------- */
const formatNum = (n : number) : string => {
	const s : string = Math.round(n).toString()
	let out : string = ''
	let c : number = 0
	for (let i : number = s.length - 1; i >= 0; i--) {
		out = s.charAt(i) + out
		c++
		if (c % 3 == 0 && i > 0) { out = ',' + out }
	}
	return out
}

/* ---------------- 展示映射（VO → 页面文案） ---------------- */
const heroName = computed<string>(() : string => profile.value ? (profile.value.username ?? '') : '')
const heroId = computed<string>(() : string => profile.value ? (profile.value.userNo ?? '') : '')
const heroPointsNum = computed<string>(() : string => formatNum(Number(profile.value ? (profile.value.rankingScore ?? 0) : 0)))
const heroTierText = computed<string>(() : string => {
	if (profile.value && profile.value.levelName && profile.value.levelName.length > 0) { return profile.value.levelName }
	return '暂无段位'
})
// 头像：优先 avatar，其次 hero 图（honorImage），都无则回退昵称首字
const heroEmblemImg = computed<string>(() : string => {
	if (profile.value && profile.value.avatar && profile.value.avatar.length > 0) { return resolveFileUrl(profile.value.avatar) }
	return ''
})
const heroFallbackImg = computed<string>(() : string => {
	if (profile.value && profile.value.honorImage && profile.value.honorImage.length > 0) { return resolveFileUrl(profile.value.honorImage) }
	return ''
})
// 段位图：有 levelImage 显示图，否则回退 levelName 文本
const heroLevelImg = computed<string>(() : string => {
	if (profile.value && profile.value.levelImage && profile.value.levelImage.length > 0) { return resolveFileUrl(profile.value.levelImage) }
	return ''
})

/* ---------------- 战绩统计 ---------------- */
const winrate = computed<string>(() : string => {
	const games : number = profile.value ? (profile.value.joinMatchCount ?? 0) : 0
	const wins : number = profile.value ? (profile.value.winnerCount ?? 0) : 0
	if (games == 0) { return '—' }
	return (wins * 100 / games).toFixed(1) + '%'
})

const statCells = computed<{ value : string, label : string, color : string }[]>((): { value : string, label : string, color : string }[] => {
	const games : number = profile.value ? (profile.value.joinMatchCount ?? 0) : 0
	const wins : number = profile.value ? (profile.value.winnerCount ?? 0) : 0
	const itm : number = profile.value ? (profile.value.enterFinalCount ?? 0) : 0
	return [
		{ value: games.toString(),    label: '总对局',   color: '#EDEFEE' },
		{ value: wins.toString(),    label: '获胜',     color: '#E8C275' },
		{ value: winrate.value,              label: '胜率',     color: '#2AA97A' },
		{ value: itm.toString(),     label: '进圈',     color: '#57C79A' }
	]
})

/* ---------------- 我的酒德 ---------------- */
const jiudeMonthPoints = computed<number>(() : number => jiude.value ? (jiude.value.monthPoints ?? 0) : 0)
const jiudeRank = computed<number>(() : number => jiude.value ? (jiude.value.ranking ?? 0) : 0)
const jiudeBalance = computed<number>(() : number => jiude.value ? (jiude.value.amount ?? 0) : 0)

/* ---------------- 我的资产 ---------------- */
const globalMonthTicket = computed<number>(() : number => profile.value ? (profile.value.monthTicket ?? 0) : 0)
const globalInviteCard = computed<number>(() : number => profile.value ? (profile.value.inviteCard ?? 0) : 0)

/* ---------------- 入口 ---------------- */
// 隐身开关：初始值取 /user/info 的 stealth（Y/N）；切换调 POST /user/stealth，失败回滚
const stealthOn = ref<boolean>(false)

const onStealthChange = (e : any) : void => {
	const next : boolean = e.detail.value
	stealthOn.value = next
	// 调用隐身接口（无请求体，后端自行切换），失败回滚开关状态
	setStealth().catch(() => {
		stealthOn.value = !next
		uni.showToast({ title: '设置失败，请重试', icon: 'none' })
	})
}

// 管理员：roleId == 1 视为管理员（后端角色约定）
const isAdmin = computed<boolean>(() : boolean => profile.value != null && profile.value.roleId == 1)

const onTapSettings = () : void => {
	uni.navigateTo({ url: '/pages/settings/settings' })
}
const onTapAdmin = () : void => {
	// 管理员专属入口；非管理员该入口本身不渲染（v-if="isAdmin"）
	uni.navigateTo({ url: '/pages/admin/admin' })
}
</script>

<style scoped>
	.page {
		box-sizing: border-box;
		background-image: linear-gradient(180deg, #0E1110 0%, #0A0C0B 40%, #0B0D0C 100%);
		height: 100vh;
	}
	/* #ifdef H5 */
	.page { height: calc(100vh - var(--window-top) - var(--window-bottom)); }
	/* #endif */

	/* ============ 个人名片 ============ */
	.hero-card {
		background-color: #1A1E1D;
		/* 左上角金黄斜光，强化"我的主场"语义 */
		background-image: linear-gradient(150deg, rgba(232, 194, 117, 0.22), rgba(232, 194, 117, 0.04) 55%);
		margin: 24rpx 0 0;
		border-radius: 32rpx;
		padding: 32rpx 30rpx;
		border: 1rpx solid rgba(232, 194, 117, 0.45);
		box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.40), inset 0 1rpx 0 rgba(255, 255, 255, 0.05);
	}
	.hero-top { flex-direction: row; align-items: center; }
	.hero-emblem { width: 112rpx; height: 112rpx; border-radius: 50%; align-items: center; justify-content: center; padding: 6rpx; }
	/* 段位徽章图/荣誉图/头像：100rpx 圆形，与文字回退版内圆尺寸一致 */
	.hero-emblem-img { width: 100rpx; height: 100rpx; border-radius: 50%; }
	.hero-emblem-in {
		width: 100rpx;
		height: 100rpx;
		border-radius: 50%;
		background-color: #12100A;
		align-items: center;
		justify-content: center;
	}
	.hero-emblem-text { font-size: 46rpx; font-weight: 700; line-height: 50rpx; }

	.hero-info { flex: 1; flex-direction: column; margin-left: 20rpx; }
	.hero-name-row { flex-direction: row; align-items: center; }
	.hero-name { font-size: 32rpx; color: #EDEFEE; font-weight: 700; }
	.me-tag {
		padding: 2rpx 14rpx;
		border-radius: 999rpx;
		background-image: linear-gradient(135deg, #F5D98E, #C89B3C);
		margin-left: 12rpx;
	}
	.me-tag-text { font-size: 18rpx; color: #FFFFFF; font-weight: 700; line-height: 26rpx; }
	/* 隐身中徽章：紧跟"我"徽章之后，颜色用冷灰而非彩色，与默认强调色拉开距离，传达"已关闭状态" */
	.stealth-badge {
		padding: 2rpx 12rpx;
		border-radius: 999rpx;
		background-color: rgba(126, 130, 129, 0.28);
		border: 1rpx solid rgba(199, 205, 203, 0.35);
		margin-left: 8rpx;
	}
	.stealth-badge-text { font-size: 18rpx; color: #C7CDCB; font-weight: 600; line-height: 26rpx; }
	.hero-tier { font-size: 26rpx; font-weight: 600; margin-top: 8rpx; }
	/* 段位图（levelImage）：高度对齐文本行，宽度按图片比例自适应（heightFix） */
	.hero-tier-img { height: 36rpx; margin-top: 8rpx; }
	/* ID 单独成行，用等宽字体 + 灰底，强化"账号标识"的语义，不与段位色争 */
	.hero-id {
		font-size: 22rpx;
		color: #7E8281;
		margin-top: 8rpx;
		font-family: monospace;
	}

	.hero-points { flex-direction: column; align-items: flex-end; margin-left: 12rpx; }
	.hero-points-num { font-size: 52rpx; color: #E8C275; font-weight: 700; line-height: 56rpx; }
	.hero-points-label { font-size: 20rpx; color: #7E8281; margin-top: 4rpx; }

	.hero-stats {
		flex-direction: row;
		align-items: stretch;
		margin-top: 26rpx;
		padding-top: 22rpx;
		border-top: 1rpx solid #242827;
	}
	.hero-stat { flex: 1; flex-direction: column; align-items: center; }
	.hero-stat-value { font-size: 34rpx; font-weight: 700; }
	.hero-stat-label { font-size: 22rpx; color: #7E8281; margin-top: 6rpx; }
	.hero-stat-divider { width: 1rpx; background-color: #242827; }

	/* ============ 通用 section ============ */
	.section { margin: 32rpx 0 0; }
	.section-head {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 18rpx;
		padding: 0 4rpx;
	}
	.section-title-wrap { flex-direction: row; align-items: center; }
	.section-bar {
		width: 6rpx;
		height: 28rpx;
		background-image: linear-gradient(180deg, #F5D98E, #C89B3C);
		border-radius: 6rpx;
		margin-right: 12rpx;
		box-shadow: 0 2rpx 8rpx rgba(232, 194, 117, 0.30);
	}
	.section-title { font-size: 30rpx; color: #EDEFEE; font-weight: 700; }
	.section-count { font-size: 24rpx; color: #2AA97A; font-weight: 600; }

	/* ============ 我的酒德 ============ */
	.jiude-card {
		flex-direction: row;
		align-items: stretch;
		background-color: #1A1E1D;
		border-radius: 28rpx;
		border: 1rpx solid #2A2F2D;
		padding: 28rpx 14rpx;
		box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.38);
	}
	.jiude-cell {
		flex: 1;
		flex-direction: column;
		align-items: center;
	}
	/* 三组数据用不同语义色：积分=绿（正向累积），排名=金（榜单地位），余额=白（中性数值） */
	.jiude-num { font-size: 36rpx; font-weight: 700; }
	.jiude-label { font-size: 22rpx; color: #7E8281; margin-top: 6rpx; }

	/* ============ 我的资产 · 通用 ============ */
	.global-assets { flex-direction: row; }
	.ga-card {
		flex: 1;
		flex-direction: row;
		align-items: center;
		background-color: #1A1E1D;
		border-radius: 24rpx;
		border: 1rpx solid #2A2F2D;
		padding: 24rpx 24rpx;
		box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
	}
	/* 月票左侧一道绿光，直通函左侧一道金光，靠色彩区分语义而不靠图标 */
	.ga-card-ticket {
		margin-right: 14rpx;
		border-left: 4rpx solid #57C79A;
	}
	.ga-card-letter {
		border-left: 4rpx solid #E8C275;
	}
	.ga-icon {
		width: 56rpx;
		height: 56rpx;
		border-radius: 16rpx;
		align-items: center;
		justify-content: center;
	}
	.ga-card-ticket .ga-icon { background-color: rgba(87, 199, 154, 0.18); }
	.ga-card-letter .ga-icon { background-color: rgba(232, 194, 117, 0.18); }
	.ga-icon-text { font-size: 28rpx; font-weight: 700; color: #EDEFEE; }
	.ga-card-ticket .ga-icon-text { color: #57C79A; }
	.ga-card-letter .ga-icon-text { color: #E8C275; }

	.ga-info { flex: 1; flex-direction: column; margin-left: 16rpx; }
	.ga-name { font-size: 26rpx; color: #EDEFEE; font-weight: 600; }
	.ga-sub { font-size: 20rpx; color: #7E8281; margin-top: 4rpx; }
	.ga-num { font-size: 44rpx; color: #EDEFEE; font-weight: 700; line-height: 48rpx; }

	/* ============ 我的资产 · 门店 ============ */
	.store-assets {
		margin-top: 18rpx;
		background-color: #1A1E1D;
		border-radius: 28rpx;
		border: 1rpx solid #2A2F2D;
		padding: 4rpx 0;
		box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
		overflow: hidden;
	}
	.sa-row {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 24rpx 28rpx;
		border-bottom: 1rpx solid rgba(42, 47, 45, 0.6);
	}
	.sa-row:last-child { border-bottom-width: 0; }
	.sa-name-wrap { flex: 1; }
	.sa-name { font-size: 26rpx; color: #EDEFEE; font-weight: 500; }
	.sa-meta { flex-direction: row; align-items: center; }
	.sa-meta-item { flex-direction: row; align-items: center; }
	.sa-meta-label { font-size: 20rpx; color: #7E8281; margin-right: 8rpx; }
	.sa-meta-val { font-size: 26rpx; font-weight: 700; }
	.sa-meta-divider {
		width: 1rpx;
		height: 28rpx;
		background-color: #2A2F2D;
		margin: 0 22rpx;
	}

	/* ============ 设置入口 ============ */
	.entry-card {
		background-color: #1A1E1D;
		border-radius: 28rpx;
		border: 1rpx solid #2A2F2D;
		overflow: hidden;
		box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
	}
	.entry-row {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 28rpx 28rpx;
		border-bottom: 1rpx solid rgba(42, 47, 45, 0.6);
	}
	.entry-row:last-child { border-bottom-width: 0; }
	.entry-left { flex-direction: row; align-items: center; }
	.entry-icon {
		width: 56rpx;
		height: 56rpx;
		border-radius: 16rpx;
		align-items: center;
		justify-content: center;
		background-color: rgba(126, 130, 129, 0.18);
	}
	.entry-icon-default { color: #EDEFEE; }
	.entry-icon-admin {
		background-color: rgba(232, 194, 117, 0.20);
		color: #E8C275;
	}
	/* 隐身图标：偏冷的中性灰，与"我"徽章的金黄、"管"的金底形成三角语义：我是谁 / 隐身 / 后台 */
	.entry-icon-stealth {
		background-color: rgba(126, 130, 129, 0.25);
		color: #C7CDCB;
	}
	.entry-icon text, .entry-icon-default { font-size: 28rpx; font-weight: 700; color: #EDEFEE; }
	.entry-icon-admin { font-size: 26rpx; }
	/* 文字块统一通过 .entry-text-wrap 提供左间距，避免在 .entry-text 上再写一遍导致双重 margin */
	.entry-text { font-size: 28rpx; color: #EDEFEE; font-weight: 500; }
	.entry-text-wrap { flex-direction: column; margin-left: 18rpx; }
	.entry-sub { font-size: 20rpx; color: #7E8281; margin-top: 4rpx; }
	/* 整行可点区域只到文字末尾就停，让开关独占右侧——非整行点击 */
	.entry-row-switch { align-items: center; }
	.entry-switch { transform: scale(0.9); }
	.entry-arrow { font-size: 36rpx; color: #7E8281; margin-left: 12rpx; line-height: 36rpx; }
	.entry-right { flex-direction: row; align-items: center; }
	.admin-badge {
		padding: 4rpx 14rpx;
		border-radius: 999rpx;
		background-color: rgba(232, 194, 117, 0.20);
		border: 1rpx solid rgba(232, 194, 117, 0.45);
	}
	.admin-badge-text { font-size: 18rpx; color: #E8C275; font-weight: 700; letter-spacing: 1rpx; }

	.footer-blank { height: 60rpx; }
</style>