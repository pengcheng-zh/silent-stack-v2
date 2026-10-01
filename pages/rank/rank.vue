<template>
	<scroll-view class="page" direction="vertical" :show-scrollbar="false" @scrolltolower="tryLoadMore">
		<!-- ============ 我的段位名片 ============ -->
		<!-- 数据直接取 summary.userRanking：仅展示排名与段位分；userRanking 为 null 时排名 300+ / 段位分 0 -->
		<view class="me-card">
			<view class="me-top">
				<view class="me-avatar-tt">
					<text class="me-avatar-tt-text">{{ meName.substring(0, 1) }}</text>
				</view>
				<view class="me-info">
					<view class="me-name-row">
						<text class="me-name">{{ meName }}</text>
					</view>
					<text class="me-city">段位分 {{ formatNum(num(summary.userRanking && summary.userRanking.rankingScore)) }}</text>
				</view>
				<view class="me-rank">
					<text class="me-rank-num">{{ meRankText }}</text>
					<text class="me-rank-label">当前排名</text>
				</view>
			</view>
		</view>

		<!-- ============ 赛季切换 ============ -->
		<!-- 选项来自 summary.seasonOptions，无进行中状态数据故不显示状态圆点 -->
		<scroll-view class="season-scroll" direction="horizontal" :show-scrollbar="false">
			<view
				v-for="s in (summary.seasonOptions || [])"
				:key="s.id"
				class="chip"
				:class="{ 'chip-active': activeSeason == String(s.id) }"
				@tap="switchSeason(String(s.id))"
			>
				<text class="chip-text" :class="{ 'chip-text-active': activeSeason == String(s.id) }">{{ s.name }}</text>
			</view>
		</scroll-view>

		<!-- ============ 排名类型切换 ============ -->
		<!-- 选项来自 summary.rankingTypeOptions，右侧指标按名称关键词匹配 -->
		<scroll-view class="ranking-scroll" direction="horizontal" :show-scrollbar="false">
			<view
				v-for="r in (summary.rankingTypeOptions || [])"
				:key="r.id"
				class="r-chip"
				:class="{ 'r-chip-active': activeRanking == String(r.id) }"
				@tap="switchRanking(String(r.id))"
			>
				<text class="r-chip-text" :class="{ 'r-chip-text-active': activeRanking == String(r.id) }">{{ r.name }}</text>
			</view>
		</scroll-view>

		<!-- ============ 赛季榜单 ============ -->
		<view class="section">
			<view class="section-head">
				<view class="section-title-wrap">
					<view class="section-bar"></view>
					<text class="section-title">{{ seasonName }}</text>
				</view>
				<text class="section-count">{{ loading ? '加载中…' : '共 ' + total + ' 人上榜' }}</text>
			</view>

			<!-- 加载中：首次进入与切换赛季 / 榜单类型时 -->
			<view v-if="loading" class="rk-loading">
				<view class="rk-spinner"></view>
				<text class="rk-loading-text">榜单加载中…</text>
			</view>

			<template v-else>
			<!-- 前三名领奖台：2-1-3 布局，底座高度差撑出颁奖台的感觉；荣誉不足 3 人时不展示 -->
			<view v-if="top3Ready" class="podium">
				<view class="podium-row">
					<!-- 亚军 -->
					<view class="podium-col">
						<view class="av av-m" :style="frameStyle()">
							<view v-for="(tickStyle, ti) in frameTicks(45)" :key="ti" class="tick" :style="tickStyle" />
							<view class="av-in av-in-m" :style="frameLineStyle()">
								<image class="av-img av-img-m" :src="avatarOf(second.avatar)" mode="aspectFill" />
							</view>
						</view>
						<text class="podium-name">{{ second.username }}</text>
						<view class="podium-base pb-2">
							<text class="podium-base-text">2</text>
						</view>
					</view>

					<!-- 冠军 -->
					<view class="podium-col">
						<text class="podium-crown">♛</text>
						<view class="av av-l" :style="frameStyle()">
							<view v-for="(tickStyle, ti) in frameTicks(58)" :key="ti" class="tick" :style="tickStyle" />
							<view class="av-in av-in-l" :style="frameLineStyle()">
								<image class="av-img av-img-l" :src="avatarOf(first.avatar)" mode="aspectFill" />
							</view>
						</view>
						<text class="podium-name">{{ first.username }}</text>
						<view class="podium-base pb-1">
							<text class="podium-base-text">1</text>
						</view>
					</view>

					<!-- 季军 -->
					<view class="podium-col">
						<view class="av av-m3" :style="frameStyle()">
							<view v-for="(tickStyle, ti) in frameTicks(42)" :key="ti" class="tick" :style="tickStyle" />
							<view class="av-in av-in-m3" :style="frameLineStyle()">
								<image class="av-img av-img-m3" :src="avatarOf(third.avatar)" mode="aspectFill" />
							</view>
						</view>
						<text class="podium-name">{{ third.username }}</text>
						<view class="podium-base pb-3">
							<text class="podium-base-text">3</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 空状态：接口无数据 / 加载失败 -->
			<view v-if="players.length == 0" class="rk-empty">
				<text class="rk-empty-text">暂无排行数据</text>
			</view>

			<!-- 完整榜单：/user-ranking/list 已按榜单类型排序，直接渲染；
			     金银铜按行位置 idx 走，切到蘑菇王 / 摸鱼榜后前三名换人徽章仍跟着位置走 -->
			<view
				v-for="(p, idx) in players"
				:key="p.userId == null ? idx : p.userId"
				class="row"
				:style="rowBgStyle(idx, isMeOf(p))"
				@tap="onRowTap(p)"
			>
				<!-- 荣誉背景图（honorImageUrl）：uvue 不支持 background-image:url，
				     用绝对定位 image 垫底 + 暗色渐变蒙层保证文字可读，后续子节点绘制在其上 -->
				<image v-if="honorBgOf(p.honorImageUrl) != ''" class="row-bg" :src="honorBgOf(p.honorImageUrl)" mode="aspectFill" />
				<view v-if="honorBgOf(p.honorImageUrl) != ''" class="row-bg-mask" />

				<view
					class="row-rank"
					:class="{ 'row-rank-1': idx == 0, 'row-rank-2': idx == 1, 'row-rank-3': idx == 2, 'row-rank-me': isMeOf(p) }"
				>
					<text
						class="row-rank-text"
						:class="{ 'row-rank-text-medal': idx < 3, 'row-rank-text-me': isMeOf(p) }"
					>{{ idx + 1 }}</text>
				</view>

				<view class="av av-s" :style="frameStyle()">
					<view v-for="(tickStyle, ti) in frameTicks(36)" :key="ti" class="tick" :style="tickStyle" />
					<view class="av-in av-in-s" :style="frameLineStyle()">
						<image class="av-img av-img-s" :src="avatarOf(p.avatar)" mode="aspectFill" />
					</view>
				</view>

				<view class="row-main">
					<view class="row-name-line">
						<text class="row-name">{{ nameOf(p) }}</text>
						<view v-if="isMeOf(p)" class="me-tag">
							<text class="me-tag-text">我</text>
						</view>
						<!-- 等级图（levelImage）：高度对齐名字行，宽度按图片比例自适应（heightFix） -->
						<image v-if="levelImgOf(p.levelImage) != ''" class="row-level-img" :src="levelImgOf(p.levelImage)" mode="heightFix" />
					</view>
					<!-- 第二行起：ID 胶囊一行 + 战绩摘要一行，纵向排列避免同行超宽被截断；
					     ID 用等宽字体 + 暗底胶囊，强化账号标识语义（与 mine 页 hero-id 一致） -->
					<view class="row-sub">
						<view v-if="p.userNo != null && p.userNo != ''" class="row-uno">
							<text class="row-uno-text">{{ p.userNo }}</text>
						</view>
						<text class="row-stats">对局 {{ formatNum(num(p.joinMatchCount)) }} · 获胜 {{ formatNum(num(p.winnerCount)) }} · 进圈 {{ formatNum(num(p.enterFinalCount)) }}</text>
					</view>
				</view>

				<view class="row-right">
					<text class="row-points" :class="{ 'row-points-medal': idx < 3, 'row-points-me': isMeOf(p) && idx >= 3 }">{{ metricDisplayOf(p) }}</text>
				</view>
			</view>

			<!-- 分页：scroll-view 触底（App）与 onReachBottom（H5）双通道触发，底部也可点击 -->
			<view v-if="players.length > 0" class="rk-more" @tap="tryLoadMore">
				<text class="rk-more-text">{{ moreText }}</text>
			</view>

			</template>

			<view class="foot-note">
				<text class="foot-note-text">{{ footNoteText }}</text>
			</view>
		</view>
	</scroll-view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { TIERS } from '@/common/rank-data'
import { fetchUserRankingSummary, fetchUserRankingList } from '@/common/ranking-api'
import type { UserRankingDTO, UserRankingListDTO, SeasonHonorVO, UserRankingSummaryVO, UserRankingPage } from '@/common/ranking-api'
import { resolveFileUrl } from '@/common/http'

/* ---------------- 接口数据（页面直接消费 VO，不做中间映射） ---------------- */
// GET /user-ranking/summary：我的排名 + 赛季/榜单类型选项 + 赛季荣誉
const summary = ref<UserRankingSummaryVO>({})

// GET /user-ranking/list：榜单成员（服务端已按榜单类型排序），分页追加
const players = ref<UserRankingListDTO[]>([])
const total = ref<number>(0)

const activeSeason = ref<string>('')
const activeRanking = ref<string>('')

/* ---------------- 数值容错 ---------------- */
// BigDecimal 容错取数：JSON 里可能是数字也可能是字符串
const num = (v : any) : number => {
	const n : number = typeof v == 'number' ? v : parseFloat(v)
	return isNaN(n) ? 0 : n
}

/* ---------------- 接口加载 ---------------- */
const PAGE_SIZE : number = 20
let page : number = 0

// 请求序号：切换赛季 / 榜单类型会连续发请求，只采纳最后一次的结果，防止旧响应覆盖新数据
let requestSeq : number = 0

// 首次进入与切换赛季 / 榜单类型时，榜单区展示 loading 卡片
const loading = ref<boolean>(true)
const loadingMore = ref<boolean>(false)
const noMore = ref<boolean>(false)

// 首次进入 / 切换：重拉 summary 与 list 第一页
const reload = () : void => {
	const seq : number = ++requestSeq
	loading.value = true
	players.value = []
	total.value = 0
	page = 0
	noMore.value = false
	fetchUserRankingSummary(activeSeason.value, activeRanking.value).then((vo : UserRankingSummaryVO) => {
		if (seq != requestSeq) { return }
		summary.value = vo || {}

		// 默认选中第一项（仅首次 active 为空时）
		const so = (vo && vo.seasonOptions) || []
		if (activeSeason.value == '' && so.length > 0) { activeSeason.value = String(so[0].id) }
		const ro = (vo && vo.rankingTypeOptions) || []
		if (activeRanking.value == '' && ro.length > 0) { activeRanking.value = String(ro[0].id) }

		return fetchUserRankingList(activeSeason.value, activeRanking.value, 1, PAGE_SIZE)
	}).then((pg : UserRankingPage | undefined) => {
		if (seq != requestSeq || pg == null) { return }
		players.value = pg.list
		total.value = pg.total
		page = 1
		noMore.value = pg.list.length < PAGE_SIZE
		loading.value = false
	}).catch((err : any) => {
		if (seq != requestSeq) { return }
		console.error('[排行] 加载失败:', err)
		players.value = []
		uni.showToast({ title: '排行榜加载失败', icon: 'none' })
		loading.value = false
	})
}

// 触底加载下一页：追加而非替换
const loadMore = () : void => {
	if (loading.value || loadingMore.value || noMore.value) { return }
	const seq : number = requestSeq
	loadingMore.value = true
	fetchUserRankingList(activeSeason.value, activeRanking.value, page + 1, PAGE_SIZE).then((pg : UserRankingPage) => {
		if (seq != requestSeq) { return }
		const chunk : UserRankingListDTO[] = pg.list
		const next : UserRankingListDTO[] = players.value.slice()
		for (let i : number = 0; i < chunk.length; i++) { next.push(chunk[i]) }
		players.value = next
		total.value = pg.total
		page = page + 1
		noMore.value = chunk.length < PAGE_SIZE
		loadingMore.value = false
	}).catch((err : any) => {
		if (seq != requestSeq) { return }
		console.error('[排行] 加载更多失败:', err)
		loadingMore.value = false
		uni.showToast({ title: '加载失败，请重试', icon: 'none' })
	})
}

const tryLoadMore = () : void => { loadMore() }

// 页面级触底：H5 端可用（App 端走 scroll-view 的 @scrolltolower）
onReachBottom((): void => { tryLoadMore() })

const moreText = computed<string>((): string => {
	if (loadingMore.value) { return '加载中…' }
	if (noMore.value) { return '没有更多了' }
	return '上拉加载更多'
})

// 切换赛季 / 榜单类型：更新选中项后 summary + list 一起重拉
const switchSeason = (id : string) : void => {
	if (activeSeason.value == id) { return }
	activeSeason.value = id
	reload()
}

const switchRanking = (id : string) : void => {
	if (activeRanking.value == id) { return }
	activeRanking.value = id
	reload()
}

onMounted(() => { reload() })

/* ---------------- 派生数据 ---------------- */
const seasonName = computed<string>((): string => {
	const list = summary.value.seasonOptions || []
	for (let i : number = 0; i < list.length; i++) {
		if (String(list[i].id) == activeSeason.value) { return list[i].name || '' }
	}
	return ''
})

// 榜单类型名称 → 右侧展示指标：按中文名关键词匹配，匹配不到回落积分
const metricOfName = (name : string) : string => {
	const s : string = (name || '').trim()
	if (!s) { return 'points' }
	if (s.indexOf('胜率') >= 0) { return 'winrate' }
	if (s.indexOf('进圈') >= 0) { return 'itm' }
	if (s.indexOf('蘑菇') >= 0) { return 'mushroom' }
	if (s.indexOf('摸鱼') >= 0 || s.indexOf('开心') >= 0 || s.indexOf('快乐') >= 0) { return 'fish' }
	if (s.indexOf('场') >= 0 || s.indexOf('参与') >= 0) { return 'games' }
	if (s.indexOf('胜') >= 0 || s.indexOf('冠军') >= 0) { return 'wins' }
	return 'points'
}

const activeMetric = computed<string>((): string => {
	const list = summary.value.rankingTypeOptions || []
	for (let i : number = 0; i < list.length; i++) {
		if (String(list[i].id) == activeRanking.value) { return metricOfName(list[i].name || '') }
	}
	return 'points'
})

// 行内右侧指标列文案：直接取 UserRankingListDTO 字段
const metricDisplayOf = (p : UserRankingListDTO) : string => {
	switch (activeMetric.value) {
		case 'winrate': return p.winnerRate == null ? '—' : num(p.winnerRate).toFixed(1) + '%'
		case 'wins': return formatNum(num(p.winnerCount)) + ' 场'
		case 'itm': return formatNum(num(p.enterFinalCount)) + ' 次'
		case 'games': return formatNum(num(p.joinMatchCount)) + ' 场'
		case 'mushroom': return num(p.mushReliveCount) + ' 🍄'
		case 'fish': return num(p.happyScore) + ' 🐟'
		default: return formatNum(num(p.rankingScore)) + ' 分'
	}
}

// 我的卡片：直接取 summary.userRanking，仅展示排名 + 段位分
// userRanking 为 null 时：排名显示 300+、名字显示"我"
const meName = computed<string>((): string => {
	const u : UserRankingDTO | undefined = summary.value.userRanking
	return (u && u.username) || (u && u.userNo) || '我'
})

const meRankText = computed<string>((): string => {
	const u : UserRankingDTO | undefined = summary.value.userRanking
	if (u == null || u.ranking == null || u.ranking <= 0) { return '300+' }
	return u.ranking.toString()
})

// 列表行高亮"我"：userId 与 summary.userRanking.userId 比对
const isMeOf = (p : UserRankingListDTO) : boolean => {
	const u : UserRankingDTO | undefined = summary.value.userRanking
	const meId : number = num(u && u.userId)
	return meId > 0 && p.userId != null && p.userId == meId
}

const nameOf = (p : UserRankingListDTO) : string => p.username || p.userNo || '--'

// 赛季前三名：直接取 summary.seasonHonorList（后端按 ranking 1/2/3 返回）
const honors = computed<SeasonHonorVO[]>((): SeasonHonorVO[] => summary.value.seasonHonorList || [])
const top3Ready = computed<boolean>((): boolean => honors.value.length === 3)
const first = computed<SeasonHonorVO>((): SeasonHonorVO => honors.value[0])
const second = computed<SeasonHonorVO>((): SeasonHonorVO => honors.value[1])
const third = computed<SeasonHonorVO>((): SeasonHonorVO => honors.value[2])

/* ---------------- 头像与段位头像框 ---------------- */
const DEFAULT_AVATAR : string = 'https://image.silentstack.cn/2026-04-01/ef06d926-2ae3-49f5-ba6a-222308b3f5ff.jpg'

const avatarOf = (avatar : string | undefined) : string => {
	if (avatar != null && avatar != '') { return resolveFileUrl(avatar) }
	return DEFAULT_AVATAR
}

// 行荣誉背景图：honorImageUrl（用户已获得的荣誉卡图），空则不渲染背景图层
const honorBgOf = (u : string | undefined) : string => (u != null && u != '') ? resolveFileUrl(u) : ''

// 行等级图：levelImage，空则不渲染
const levelImgOf = (u : string | undefined) : string => (u != null && u != '') ? resolveFileUrl(u) : ''

// 接口无段位花色数据：头像框 / 行底色统一走"梅花"金色系，与整体金黄主题协调
let clubTier = TIERS[0]
for (let i : number = 0; i < TIERS.length; i++) {
	if (TIERS[i].key == 'club') { clubTier = TIERS[i] }
}

// 头像框的外层：渐变主色环与光晕（background-image + box-shadow）
const frameStyle = () : string => {
	return 'background-image:' + clubTier.frameBg + ';box-shadow:' + clubTier.frameGlow + ';'
}

// 内侧收边细环：色环内侧的 2rpx 细描边，呼应筹码内圈压线
const frameLineStyle = () : string => {
	return 'border:2rpx solid ' + clubTier.frameLine + ';'
}

// 筹码嵌块：logo 式白色矩形嵌块，在主色环上均匀排 8 枚；
// 每枚用 rotate(角度) translateY(-半径) 钉到圆周上，半径随场景尺寸而异，
// 由调用处传入（列表 36 / 季军 42 / 亚军 45 / 冠军 58）
const frameTicks = (radius : number) : string[] => {
	const styles : string[] = []
	for (let i = 0; i < 8; i++) {
		const deg : number = i * 45
		styles.push('transform:rotate(' + deg + 'deg) translateY(-' + radius + 'rpx);background-color:rgba(255,255,255,0.92);')
	}
	return styles
}

// 榜单行的荣誉背景：金银铜按行位置 idx；"我自己"那一行用金黄系强调
const rowBgStyle = (idx : number, isMe : boolean) : string => {
	if (idx == 0) {
		return 'background-image:linear-gradient(135deg,rgba(232,194,117,0.22),rgba(232,194,117,0.04));border-color:rgba(232,194,117,0.60);'
	}
	if (idx == 1) {
		return 'background-image:linear-gradient(135deg,rgba(176,188,196,0.18),rgba(176,188,196,0.04));border-color:rgba(196,208,216,0.45);'
	}
	if (idx == 2) {
		return 'background-image:linear-gradient(135deg,rgba(205,132,84,0.18),rgba(205,132,84,0.04));border-color:rgba(214,145,98,0.45);'
	}
	if (isMe) {
		return 'background-image:linear-gradient(135deg,rgba(232,194,117,0.18),rgba(232,194,117,0.04));border-color:rgba(232,194,117,0.60);'
	}
	return 'background-color:' + clubTier.rowBg + ';border-color:' + clubTier.rowBorder + ';'
}

/* ---------------- 脚注文案 ---------------- */
// 每种榜单的口径说明：按类型名称匹配到的指标给出规则文案
const footNoteText = computed<string>((): string => {
	switch (activeMetric.value) {
		case 'points':   return '按赛季积分降序排列\n赛季结束后按名次发放荣誉与奖励'
		case 'winrate':  return '胜率 = 胜场 / 参赛场次 × 100%'
		case 'itm':      return '按进圈次数（打进前三结算圈）降序排列'
		case 'mushroom': return '按蘑菇复活次数降序排列\n来自牌局内的特殊奖励事件，娱乐向榜单'
		case 'fish':     return '按开心分降序排列'
		case 'games':    return '按参与场次降序排列'
		case 'wins':     return '按赛季胜场数降序排列'
		default:         return '按赛季积分降序排列'
	}
})

/* ---------------- 其他 ---------------- */
const formatNum = (n : number) : string => {
	const s : string = n.toString()
	let out : string = ''
	let c : number = 0
	for (let i : number = s.length - 1; i >= 0; i--) {
		out = s.charAt(i) + out
		c++
		if (c % 3 == 0 && i > 0) { out = ',' + out }
	}
	return out
}

const onRowTap = (p : UserRankingListDTO) : void => {
	const tail : string = (p.levelName != null && p.levelName != '') ? ' · ' + p.levelName : ''
	uni.showToast({ title: nameOf(p) + tail, icon: 'none' })
}
</script>

<style scoped>
	.page {
		box-sizing: border-box;
		background-image: linear-gradient(180deg, #0E1110 0%, #0A0C0B 40%, #0B0D0C 100%);
		height: 100vh;
	}
	/* #ifdef H5 */
	/* H5 端 100vh 含导航栏与 tabBar，需扣除才是内容区真实高度 */
	.page {
		height: calc(100vh - var(--window-top) - var(--window-bottom));
	}
	/* #endif */

	/* ============ 我的段位名片 ============ */
	.me-card {
		background-color: #1A1E1D;
		margin: 24rpx 0 0;
		/* 左上角一抹金黄斜向光，让名片比普通卡片更有"我的主场"感；配合整体奖杯黄观感 */
		background-image: linear-gradient(150deg, rgba(232, 194, 117, 0.18), rgba(232, 194, 117, 0.03) 55%);
		border-radius: 32rpx;
		padding: 30rpx 30rpx;
		border: 1rpx solid rgba(232, 194, 117, 0.40);
		box-shadow: 0 10rpx 28rpx rgba(0, 0, 0, 0.45), inset 0 1rpx 0 rgba(255, 255, 255, 0.05);
	}
	.me-top { flex-direction: row; align-items: center; }
	/* 首字圆形头像占位：summary.userRanking 无 avatar 字段 */
	.me-avatar-tt {
		width: 96rpx;
		height: 96rpx;
		border-radius: 50%;
		background-color: #2A2F2D;
		border: 2rpx solid #3A403E;
		align-items: center;
		justify-content: center;
	}
	.me-avatar-tt-text { font-size: 40rpx; color: #E8C275; font-weight: 700; }
	.me-info { flex: 1; flex-direction: column; margin-left: 22rpx; }
	.me-name-row { flex-direction: row; align-items: center; }
	.me-name { font-size: 32rpx; color: #EDEFEE; font-weight: 700; }
	.me-tag {
		padding: 2rpx 14rpx;
		border-radius: 999rpx;
		background-image: linear-gradient(135deg, #F5D98E, #C89B3C);
		margin-left: 12rpx;
	}
	.me-tag-text { font-size: 18rpx; color: #FFFFFF; font-weight: 700; line-height: 26rpx; }
	.me-city { font-size: 22rpx; color: #7E8281; margin-top: 6rpx; }
	.me-rank { flex-direction: column; align-items: center; margin-left: 16rpx; }
	/* 我的当前/最终名次 = 活跃向上的数据，绿色作为「在场」的强调色；与金黄奖牌形成层次 */
	.me-rank-num {
		font-size: 64rpx;
		color: #2AA97A;
		font-weight: 700;
		line-height: 68rpx;
		text-shadow: 0 0 18rpx rgba(42, 169, 122, 0.35);
	}
	.me-rank-label { font-size: 20rpx; color: #7E8281; margin-top: 2rpx; }

	/* ---- 加载中：金色转圈 + 提示文案 ---- */
	.rk-loading {
		background-color: #1A1E1D;
		border: 1rpx solid #2A2F2D;
		border-radius: 24rpx;
		padding: 80rpx 24rpx;
		align-items: center;
		margin-bottom: 14rpx;
	}
	.rk-spinner {
		width: 44rpx;
		height: 44rpx;
		border-radius: 50%;
		border: 4rpx solid rgba(232, 194, 117, 0.18);
		border-top-color: #E8C275;
		animation: rk-spin 0.8s linear infinite;
	}
	.rk-loading-text { font-size: 24rpx; color: #7E8281; margin-top: 18rpx; }
	@keyframes rk-spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	/* ---- 空状态（接口无数据 / 加载失败） ---- */
	.rk-empty {
		background-color: #1A1E1D;
		border: 1rpx solid #2A2F2D;
		border-radius: 24rpx;
		padding: 60rpx 24rpx;
		align-items: center;
		margin-bottom: 14rpx;
	}
	.rk-empty-text { font-size: 24rpx; color: #7E8281; }

	/* ---- 分页加载更多 ---- */
	.rk-more { padding: 20rpx 0 8rpx; align-items: center; }
	.rk-more-text { font-size: 22rpx; color: #7E8281; }

	/* ============ 赛季切换 ============ */
	/* chip 是横向 scroll-view 的 flex item，必须 flex-shrink: 0 才能溢出滚动 */
	.season-scroll {
		flex-direction: row;
		align-items: center;
		width: 750rpx;
		margin: 24rpx 0 0;
		padding-left: 24rpx;
		padding-right: 24rpx;
	}
	.chip {
		flex-direction: row;
		align-items: center;
		flex-shrink: 0;
		padding: 12rpx 24rpx;
		border-radius: 999rpx;
		background-color: #1A1E1D;
		border: 1rpx solid #2A2F2D;
		margin-right: 16rpx;
	}
	.chip-active {
		background-image: linear-gradient(135deg, #F5D98E, #C89B3C);
		border-color: #C89B3C;
	}
	.chip-text { font-size: 24rpx; color: #A0A5A3; font-weight: 500; }
	.chip-text-active { color: #FFFFFF; font-weight: 600; }

	/* ============ 排名类型切换 ============ */
	/* 与赛季 chip 同款胶囊但更暗，强调"上层 = 赛季，下层 = 看什么榜单"的层级感 */
	.ranking-scroll {
		flex-direction: row;
		align-items: center;
		width: 750rpx;
		margin-top: 18rpx;
		padding-left: 24rpx;
		padding-right: 24rpx;
	}
	.r-chip {
		flex-direction: row;
		align-items: center;
		flex-shrink: 0;
		padding: 10rpx 22rpx;
		border-radius: 999rpx;
		background-color: #131614;
		border: 1rpx solid #2A2F2D;
		margin-right: 14rpx;
	}
	.r-chip-active {
		background-color: #1F1B0F;
		border-color: rgba(232,194,117,0.55);
	}
	.r-chip-text { font-size: 22rpx; color: #8F9492; font-weight: 500; }
	.r-chip-text-active { color: #FFE9AE; font-weight: 600; }

	/* ============ 赛季榜单 ============ */
	.section { margin: 32rpx 0 0; }
	.section-head { flex-direction: row; align-items: center; justify-content: space-between; margin-bottom: 16rpx; padding: 0 4rpx; }
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
	.section-count { font-size: 24rpx; color: #8F9492; }

	/* ---- 领奖台 ---- */
	.podium {
		background-color: #1A1E1D;
		border-radius: 28rpx;
		border: 1rpx solid #2A2F2D;
		padding: 44rpx 18rpx 0;
		margin-bottom: 20rpx;
		box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.45), inset 0 1rpx 0 rgba(255, 255, 255, 0.05);
	}
	.podium-row { flex-direction: row; align-items: flex-end; }
	.podium-col { flex: 1; flex-direction: column; align-items: center; }

	.podium-crown {
		font-size: 44rpx;
		color: #E8C275;
		line-height: 48rpx;
		margin-bottom: 6rpx;
	}

	/* ---- 段位头像框（德扑筹码式，全部正圆）----
	   结构由外向内参考品牌 logo：
	   外圈白边压线 → 渐变主色环（.av 的 background-image，frameStyle 注入）
	   → 环上 8 枚宽方块 stripe（.tick，frameTicks 注入颜色与圆周位置）
	   → 内侧收边细环（.av-in 的 border，frameLineStyle 注入）
	   → image 头像本体
	   尺寸四档：s = 列表行 104，m3 = 季军 116，m = 亚军 124，l = 冠军 148 */
	.av {
		position: relative;
		padding: 8rpx;
		align-items: center;
		justify-content: center;
		background-color: #2A2F2D;
		border: 2rpx solid rgba(255, 255, 255, 0.14);
	}
	.av-s { width: 104rpx; height: 104rpx; border-radius: 50%; margin-right: 20rpx; }
	.av-m3 { width: 116rpx; height: 116rpx; border-radius: 50%; }
	.av-m { width: 124rpx; height: 124rpx; border-radius: 50%; }
	.av-l { width: 148rpx; height: 148rpx; border-radius: 50%; }

	/* 筹码 stripe：logo 式宽方块刻度，先绝对居中，再由 rotate + translateY 钉到圆周上 */
	.tick {
		position: absolute;
		left: 50%;
		top: 50%;
		margin-left: -5rpx;
		margin-top: -9rpx;
		width: 10rpx;
		height: 18rpx;
		border-radius: 2rpx;
	}

	/* 内侧收边细环 + 头像：尺寸 = 外层 - 2×8(padding)，再减 border 得 image */
	.av-in {
		border-radius: 50%;
		align-items: center;
		justify-content: center;
		/* logo 筹码中心的藏青底盘 */
		background-color: #1F2A3D;
	}
	.av-in-s { width: 88rpx; height: 88rpx; }
	.av-in-m3 { width: 100rpx; height: 100rpx; }
	.av-in-m { width: 108rpx; height: 108rpx; }
	.av-in-l { width: 132rpx; height: 132rpx; }
	.av-img-s { width: 84rpx; height: 84rpx; border-radius: 50%; }
	.av-img-m3 { width: 96rpx; height: 96rpx; border-radius: 50%; }
	.av-img-m { width: 104rpx; height: 104rpx; border-radius: 50%; }
	.av-img-l { width: 128rpx; height: 128rpx; border-radius: 50%; }

	.podium-name {
		font-size: 26rpx;
		color: #EDEFEE;
		font-weight: 600;
		margin-top: 14rpx;
	}

	.podium-base {
		width: 100%;
		align-items: center;
		padding-top: 14rpx;
		border-radius: 12rpx 12rpx 0 0;
	}
	.pb-1 {
		height: 190rpx;
		background-image: linear-gradient(180deg, rgba(232, 194, 117, 0.55), rgba(232, 194, 117, 0.08));
	}
	.pb-2 {
		height: 145rpx;
		background-image: linear-gradient(180deg, rgba(176, 188, 196, 0.40), rgba(176, 188, 196, 0.06));
	}
	.pb-3 {
		height: 115rpx;
		background-image: linear-gradient(180deg, rgba(205, 132, 84, 0.40), rgba(205, 132, 84, 0.06));
	}
	.podium-base-text { font-size: 44rpx; color: rgba(255, 255, 255, 0.88); font-weight: 700; line-height: 48rpx; }

	/* ---- 榜单行 ---- */
	.row {
		flex-direction: row;
		align-items: center;
		background-color: #1A1E1D;
		border: 1rpx solid #2A2F2D;
		border-radius: 24rpx;
		padding: 18rpx 24rpx;
		margin-bottom: 14rpx;
		overflow: hidden;
	}

	/* 荣誉背景图层：绝对定位铺满整行（uvue 的 background-image 不支持 url），蒙层压暗保证文字可读 */
	.row-bg { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
	.row-bg-mask {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		background-image: linear-gradient(90deg, rgba(10, 12, 11, 0.85), rgba(10, 12, 11, 0.30));
	}

	.row-rank {
		width: 52rpx;
		height: 52rpx;
		border-radius: 50%;
		background-color: #2A2F2D;
		align-items: center;
		justify-content: center;
		margin-right: 18rpx;
	}
	.row-rank-1 { background-color: #E8C275; }
	.row-rank-2 { background-color: #AEBCC4; }
	.row-rank-3 { background-color: #CD8454; }
	.row-rank-me {
		background-image: linear-gradient(135deg, #F5D98E, #C89B3C);
	}
	.row-rank-text { font-size: 24rpx; color: #8F9492; font-weight: 700; line-height: 28rpx; }
	/* 金银铜是实底徽章，文字要用深色才压得住 */
	.row-rank-text-medal { color: #14100A; }
	.row-rank-text-me { color: #FFFFFF; }

	.row-main { flex: 1; flex-direction: column; }
	.row-name-line { flex-direction: row; align-items: center; }
	.row-name { font-size: 28rpx; color: #EDEFEE; font-weight: 600; }
	/* 等级图（levelImage）：高度对齐名字行文本，宽度按图片比例自适应（heightFix） */
	.row-level-img { height: 40rpx; margin-left: 12rpx; }
	/* 第二行起：ID 胶囊一行，战绩摘要一行（纵向排列，uvue 下字体样式需挂在 text 上） */
	.row-sub { flex-direction: column; align-items: flex-start; margin-top: 8rpx; }
	.row-uno {
		background-color: rgba(255, 255, 255, 0.06);
		border-radius: 6rpx;
		padding: 2rpx 10rpx;
	}
	.row-uno-text {
		font-size: 20rpx;
		color: #A0A5A3;
		font-family: monospace;
		line-height: 28rpx;
	}
	.row-stats { font-size: 22rpx; color: #7E8281; margin-top: 6rpx; }

	.row-right { flex-direction: column; align-items: flex-end; }
	.row-points { font-size: 30rpx; color: #EDEFEE; font-weight: 700; }
	.row-points-medal { color: #E8C275; }
	/* 我自己的数值 = 绿色的「在场」高亮，区别于金黄奖牌与白色基础 */
	.row-points-me { color: #2AA97A; }

	/* ---- 底部说明 ---- */
	.foot-note { padding: 28rpx 8rpx 48rpx; align-items: center; }
	.foot-note-text { font-size: 22rpx; color: #7E8281; line-height: 36rpx; text-align: center; }
</style>
