<template>
	<scroll-view
		class="page"
		direction="vertical"
		:show-scrollbar="false"
		:refresher-enabled="true"
		:refresher-triggered="refreshing"
		@refresherrefresh="onRefresh"
		@scrolltolower="loadMore"
	>
		<!-- ============ 战绩总览 ============ -->
		<view class="hero-card">
			<view class="hero-top">
				<view class="hero-emblem" :style="emblemStyle">
					<view class="hero-emblem-in">
						<text class="hero-emblem-text" :style="goldStyle">{{ heroEmblemText }}</text>
					</view>
				</view>
				<view class="hero-info">
					<view class="hero-name-row">
						<text class="hero-name">{{ heroName }}</text>
						<view class="me-tag">
							<text class="me-tag-text">我</text>
						</view>
					</view>
					<text class="hero-tier" :style="goldStyle">{{ heroRankText }}</text>
					<text class="hero-city">{{ heroSubText }}</text>
				</view>
				<view class="hero-points">
					<text class="hero-points-num">{{ formatNum(heroPoints) }}</text>
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

		<!-- ============ 筛选条件 ============ -->
		<view class="filter-card">
			<view class="filter-row">
				<text class="filter-label">时间</text>
				<view class="filter-chips">
					<view
						v-for="t in timeOptions"
						:key="t.value"
						class="chip"
						:class="{ 'chip-on': timeRange == t.value }"
						@tap="onTimeRange(t.value)"
					>
						<text class="chip-text" :class="{ 'chip-text-on': timeRange == t.value }">{{ t.label }}</text>
					</view>
				</view>
			</view>
			<view class="filter-row">
				<text class="filter-label">类型</text>
				<view class="filter-chips">
					<view
						v-for="m in typeOptions"
						:key="m.value"
						class="chip"
						:class="{ 'chip-on': matchType == m.value }"
						@tap="onMatchType(m.value)"
					>
						<text class="chip-text" :class="{ 'chip-text-on': matchType == m.value }">{{ m.label }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- ============ 近 20 场排名趋势 ============ -->
		<view class="section">
			<view class="section-head">
				<view class="section-title-wrap">
					<view class="section-bar"></view>
					<text class="section-title">近 20 场排名趋势</text>
				</view>
				<text class="section-count">{{ trend.length }} 场</text>
			</view>

			<view class="chart-card">
				<view class="chart-head">
					<text class="chart-caption">{{ trendCaption }}</text>
					<view class="chart-legend">
						<view class="lg-item">
							<view class="lg-dot lg-win"></view>
							<text class="lg-text">冠军</text>
						</view>
						<view class="lg-item">
							<view class="lg-dot lg-itm"></view>
							<text class="lg-text">进圈</text>
						</view>
						<view class="lg-item">
							<view class="lg-dot lg-out"></view>
							<text class="lg-text">未进圈</text>
						</view>
					</view>
				</view>

				<view class="chart-canvas">
					<!--
						纯 SVG 方案：跨端稳定，不需要 createCanvasContext / 等待布局 / 走 draw 流程
						viewBox="0 0 100 100" 让坐标与内部点 x/y 百分比一致；preserveAspectRatio="none" 横向拉伸
						vector-effect="non-scaling-stroke" 保证线宽不被 viewBox 拉伸影响
					-->
					<svg
						class="trend-svg"
						viewBox="0 0 100 100"
						preserveAspectRatio="none"
					>
						<!-- 渐变定义：折线下方的填充，从折线色渐隐到完全透明 -->
						<defs>
							<linearGradient
								id="trendAreaGrad"
								x1="0"
								y1="0"
								x2="0"
								y2="1"
							>
								<stop
									offset="0%"
									:stop-color="C_LINE"
									stop-opacity="0.45"
								></stop>
								<stop
									offset="60%"
									:stop-color="C_LINE"
									stop-opacity="0.15"
								></stop>
								<stop
									offset="100%"
									:stop-color="C_LINE"
									stop-opacity="0"
								></stop>
							</linearGradient>
						</defs>

						<!-- 三条横向参考线：辅助视觉对齐，理解名次高低 -->
						<line
							v-for="g in gridLines"
							:key="'g' + g.y"
							:x1="0"
							:y1="g.y"
							:x2="100"
							:y2="g.y"
							:stroke="C_GRID"
							stroke-width="0.5"
							vector-effect="non-scaling-stroke"
						></line>

						<!-- 折线下方填充：闭合到 baseline 的 path，配 linearGradient 渐隐 -->
						<path
							:d="trendAreaPath"
							fill="url(#trendAreaGrad)"
						></path>

						<!-- 折线：单条 polyline，单色 -->
					<polyline
						:points="trendChart"
						fill="none"
						:stroke="C_LINE"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						vector-effect="non-scaling-stroke"
					></polyline>
					</svg>
				</view>
			</view>
		</view>

		<!-- ============ 全部战绩 ============ -->
		<view class="section">
			<view class="section-head">
				<view class="section-title-wrap">
					<view class="section-bar"></view>
					<text class="section-title">全部战绩</text>
				</view>
				<text class="section-count">{{ records.length }} 场</text>
			</view>

			<view
				v-for="r in records"
				:key="r.id"
				class="rec-row"
				@tap="onRecordTap(r)"
			>
				<view class="rec-rank" :class="rankClassOf(r.rank)">
					<text class="rec-rank-text" :class="rankTextClassOf(r.rank)">{{ r.rank }}</text>
				</view>
				<view class="rec-main">
					<text class="rec-title">{{ r.title }}</text>
					<text class="rec-sub">{{ recSubText(r) }}</text>
				</view>
				<view class="rec-right">
					<text class="rec-score">{{ scoreText(r.finalScore) }}</text>
					<text class="rec-score-label">积分</text>
				</view>
			</view>

			<view v-if="loading && records.length == 0" class="list-foot">
				<text class="list-foot-text">加载中…</text>
			</view>
			<view v-else-if="records.length == 0" class="rec-empty">
				<text class="rec-empty-text">暂无战绩</text>
				<text class="rec-empty-sub">当前筛选条件下没有对局记录</text>
			</view>
			<view v-else class="list-foot" @tap="loadMore">
				<text v-if="loading" class="list-foot-text">加载中…</text>
				<text v-else-if="noMore" class="list-foot-text">已展示全部 {{ records.length }} 场战绩</text>
				<text v-else class="list-foot-text">上拉或点击加载更多</text>
			</view>
		</view>
	</scroll-view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { fetchMatchSummary, fetchMatchRecords } from '@/common/match-api'
import type { MatchRecordVO, MatchRecordPage } from '@/common/match-api'
import type { UserRankingDTO } from '@/common/ranking-api'
import type { TrendBar } from '@/common/types'

// 每页条数：首屏一次拉 20 条，恰好填满"近 20 场"趋势窗口
const LIMIT : number = 20

/* ---------------- 筛选条件 ---------------- */
const timeRange = ref<string>('all')
const matchType = ref<string>('')

const timeOptions : { value : string, label : string }[] = [
	{ value: 'all',   label: '全部时间' },
	{ value: 'week',  label: '最近一周' },
	{ value: 'month', label: '最近一月' },
	{ value: 'year',  label: '最近一年' }
]

const typeOptions : { value : string, label : string }[] = [
	{ value: '',       label: '全部对局' },
	{ value: 'win',    label: '仅获胜' },
	{ value: 'reward', label: '奖励圈' }
]

/* ---------------- 数据 ---------------- */
const summaryData = ref<UserRankingDTO>({})
const records = ref<MatchRecordVO[]>([])
const loading = ref<boolean>(false)
const noMore = ref<boolean>(false)
const refreshing = ref<boolean>(false)
const pageIndex = ref<number>(1)

const num = (v : any) : number => {
	const n : number = Number(v)
	return isFinite(n) ? n : 0
}

/* ---------------- 总览展示（UserRankingDTO → 页面文案） ---------------- */
const heroName = computed<string>((): string => {
	const n : string = (summaryData.value.username ?? '').toString()
	return n.length > 0 ? n : '我'
})

const heroRanking = computed<number>((): number => num(summaryData.value.ranking))

// 徽章里放总排名名次，没有排名时退回"我"
const heroEmblemText = computed<string>((): string => heroRanking.value > 0 ? String(heroRanking.value) : '我')

const heroRankText = computed<string>((): string =>
	heroRanking.value > 0 ? '总排名 第 ' + heroRanking.value + ' 名' : '暂无排名'
)

const heroSubText = computed<string>((): string => {
	const no : string = (summaryData.value.userNo ?? '').toString()
	return (no.length > 0 ? 'NO.' + no + ' · ' : '') + 'S3 · 2026 秋季赛'
})

const heroPoints = computed<number>((): number => num(summaryData.value.rankingScore))

// 金色主视觉：徽章外环 + 名次文案，统一用段位分同款金黄
const goldStyle : string = 'color:#E8C275;'
const emblemStyle : string = 'background-image:linear-gradient(135deg, #F5D98E, #C89B3C);border:2rpx solid rgba(245, 217, 142, 0.55);'

/* ---------------- 总览三栏文案 ---------------- */
type StatCell = { value : string, label : string, color : string }

// 胜率：后端 BigDecimal 可能是 0~1 的小数或已是百分数，统一归一成百分比文案
const rateTextOf = (d : UserRankingDTO) : string => {
	const raw : number = num(d.winnerRate)
	const pct : number = raw > 0 && raw <= 1 ? raw * 100 : raw
	if (pct > 0) { return pct.toFixed(1) + '%' }
	// 后端没给胜率时按次数兜底计算
	const games : number = num(d.joinMatchCount)
	if (games > 0) { return (num(d.winnerCount) * 100 / games).toFixed(1) + '%' }
	return '—'
}

// 白/黄/绿三色分层：基础（白）、冠军奖杯（黄）、积极指标（绿）
const statCells = computed<StatCell[]>((): StatCell[] => {
	const d : UserRankingDTO = summaryData.value
	return [
		{ value: num(d.joinMatchCount).toString(), label: '总对局',   color: '#EDEFEE' },
		{ value: num(d.winnerCount).toString(),    label: '获胜场次', color: '#E8C275' },
		{ value: rateTextOf(d),                    label: '胜率',     color: '#2AA97A' },
		{ value: num(d.enterFinalCount).toString(), label: '进圈场次', color: '#2AA97A' }
	]
})

/* ---------------- 趋势图：由筛选后的战绩派生 ---------------- */
const TREND_SIZE : number = 20
const MIN_BAR : number = 16
const MAX_BAR : number = 100

// 用窗口内最大名次做归一化：第 1 名 → 最高，末名 → 最低（接口无参赛人数字段）
const barOf = (r : MatchRecordVO, maxRank : number) : TrendBar => {
	let perf : number = 1
	if (maxRank > 1) {
		perf = r.rank > 0 ? (maxRank - r.rank) / (maxRank - 1) : 0
		if (perf < 0) { perf = 0 }
		if (perf > 1) { perf = 1 }
	}
	let h : number = Math.round(MIN_BAR + perf * (MAX_BAR - MIN_BAR))
	if (h < MIN_BAR) { h = MIN_BAR }
	if (h > MAX_BAR) { h = MAX_BAR }
	let kind : string = 'out'
	if (r.rank == 1) { kind = 'win' }
	else if (r.rank > 0 && r.rank <= 3) { kind = 'itm' }
	return { rank: r.rank, heightPct: h, kind: kind }
}

// records 是"新 → 旧"，趋势图要"旧 → 新"，所以倒序取最近 20 场
const trend = computed<TrendBar[]>((): TrendBar[] => {
	const src : MatchRecordVO[] = records.value
	const out : TrendBar[] = []
	const n : number = src.length < TREND_SIZE ? src.length : TREND_SIZE
	if (n == 0) { return out }
	let maxRank : number = 0
	for (let i : number = 0; i < n; i++) {
		if (src[i].rank > maxRank) { maxRank = src[i].rank }
	}
	for (let i : number = n - 1; i >= 0; i--) { out.push(barOf(src[i], maxRank)) }
	return out
})

const trendCaption = computed<string>((): string => {
	const t : TrendBar[] = trend.value
	if (t.length == 0) { return '暂无对局' }
	let itmCount : number = 0
	let sumRank : number = 0
	for (let i : number = 0; i < t.length; i++) {
		if (t[i].rank <= 3) { itmCount++ }
		sumRank = sumRank + t[i].rank
	}
	const avg : string = (sumRank / t.length).toFixed(1)
	return '场均 ' + avg + ' 名 · 进圈 ' + itmCount + ' 次'
})

/* ---------------- 折线图（SVG 绘制） ---------------- */
// 颜色集中在一处，与其他卡片调色保持一致
const C_LINE : string = '#57C79A'    // 折线单色：与 hero 中"胜率 / 进圈场次"同色，强化"战绩趋势"语义
const C_GRID : string = 'rgba(36, 40, 39, 0.6)'

// 三条横向参考线 y 坐标，与 SVG 0~100 viewBox 对齐
const gridLines : { y : number }[] = [
	{ y : 8 },
	{ y : 50 },
	{ y : 92 }
]

// 单条 polyline：把所有点连成 "x1,y1 x2,y2 ... x20,y20"
const trendChart = computed<string>((): string => {
	const t : TrendBar[] = trend.value
	if (t.length < 2) { return '' }
	const parts : string[] = []
	for (let i : number = 0; i < t.length; i++) {
		const x : number = 4 + (i / (t.length - 1)) * 92
		const y : number = 100 - 8 - ((t[i].heightPct - 16) / 84) * 84
		parts.push(x.toFixed(2) + ',' + y.toFixed(2))
	}
	return parts.join(' ')
})

// 折线下方的填充区域：把 trendChart 的点按 SVG path 语法串起来，再回到右下、左下，闭合到 baseline
const trendAreaPath = computed<string>((): string => {
	const t : TrendBar[] = trend.value
	if (t.length < 2) { return '' }
	const baselineY : number = 92  // 与 trendChart 的最低点对齐
	const parts : string[] = []
	for (let i : number = 0; i < t.length; i++) {
		const x : number = 4 + (i / (t.length - 1)) * 92
		const y : number = 100 - 8 - ((t[i].heightPct - 16) / 84) * 84
		parts.push((i == 0 ? 'M' : 'L') + x.toFixed(2) + ',' + y.toFixed(2))
	}
	return parts.join(' ') + ' L96.00,' + baselineY.toFixed(2) + ' L4.00,' + baselineY.toFixed(2) + ' Z'
})

/* ---------------- 数据加载（服务端分页） ---------------- */
// 请求序号：筛选/翻页连续触发时丢弃过期响应，避免旧数据覆盖新数据
let reqSeq : number = 0

const loadSummary = () : Promise<void> => {
	return fetchMatchSummary().then((dto : UserRankingDTO) => {
		summaryData.value = dto || {}
	}).catch(() => {
		uni.showToast({ title: '战绩总览加载失败', icon: 'none' })
	})
}

const loadRecords = () : Promise<void> => {
	const seq : number = ++reqSeq
	loading.value = true
	return fetchMatchRecords(timeRange.value, matchType.value, pageIndex.value, LIMIT).then((p : MatchRecordPage) => {
		if (seq != reqSeq) { return }
		if (pageIndex.value <= 1) {
			records.value = p.list
		} else {
			const next : MatchRecordVO[] = records.value.slice()
			for (let i : number = 0; i < p.list.length; i++) { next.push(p.list[i]) }
			records.value = next
		}
		// total 缺失时以"返回空页"作为加载结束信号
		noMore.value = p.list.length == 0 || (p.total > 0 && records.value.length >= p.total)
		loading.value = false
	}).catch(() => {
		if (seq != reqSeq) { return }
		// 翻页失败回退页码，下次触底可重试本页；首页失败清空走空态
		if (pageIndex.value > 1) {
			pageIndex.value = pageIndex.value - 1
		} else {
			records.value = []
		}
		loading.value = false
		uni.showToast({ title: '战绩列表加载失败', icon: 'none' })
	})
}

// 首次进入：总览 + 默认筛选（全部时间 / 全部对局）第一页
loadSummary()
loadRecords()

/* ---------------- 筛选切换 ---------------- */
const onTimeRange = (v : string) : void => {
	if (timeRange.value == v) { return }
	timeRange.value = v
	pageIndex.value = 1
	loadRecords()
}

const onMatchType = (v : string) : void => {
	if (matchType.value == v) { return }
	matchType.value = v
	pageIndex.value = 1
	loadRecords()
}

/* ---------------- 列表样式辅助 ---------------- */
const rankClassOf = (rank : number) : string => {
	if (rank == 1) { return 'rec-rank-1' }
	if (rank == 2) { return 'rec-rank-2' }
	if (rank == 3) { return 'rec-rank-3' }
	return ''
}

const rankTextClassOf = (rank : number) : string => rank > 0 && rank <= 3 ? 'rec-rank-text-medal' : ''

// 副标题：门店 · 日期（字段可能为空，跳过空段避免出现孤立的分隔点）
const recSubText = (r : MatchRecordVO) : string => {
	const parts : string[] = []
	if (r.storeName.length > 0) { parts.push(r.storeName) }
	if (r.date.length > 0) { parts.push(r.date) }
	return parts.join(' · ')
}

// 积分：整数走千分位，小数保留至多 2 位
const scoreText = (v : number) : string => {
	if (Number.isInteger(v)) { return formatNum(v) }
	return (Math.round(v * 100) / 100).toString()
}

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

/* ---------------- 上拉加载更多（服务端分页） ---------------- */
const loadMore = () : void => {
	if (loading.value || noMore.value) { return }
	pageIndex.value = pageIndex.value + 1
	loadRecords()
}

/* ---------------- 下拉刷新 ---------------- */
// 回到第一页，总览 + 当前筛选的列表一起重拉
const onRefresh = () : void => {
	refreshing.value = true
	pageIndex.value = 1
	loadSummary()
	loadRecords().then((): void => { refreshing.value = false })
}

const onRecordTap = (r : MatchRecordVO) : void => {
	uni.showToast({ title: r.title + ' · 第 ' + r.rank + ' 名', icon: 'none' })
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

	/* ============ 战绩总览 ============ */
	.hero-card {
		background-color: #1A1E1D;
		margin: 24rpx 0 0;
		/* 左上角一抹金黄斜向光，延续排行榜"我的主场"名片观感 */
		background-image: linear-gradient(150deg, rgba(232, 194, 117, 0.18), rgba(232, 194, 117, 0.03) 55%);
		border-radius: 32rpx;
		padding: 30rpx 30rpx;
		border: 1rpx solid rgba(232, 194, 117, 0.40);
		box-shadow: 0 10rpx 28rpx rgba(0, 0, 0, 0.40), inset 0 1rpx 0 rgba(255, 255, 255, 0.05);
	}
	.hero-top { flex-direction: row; align-items: center; }
	.hero-emblem {
		width: 96rpx;
		height: 96rpx;
		border-radius: 50%;
		align-items: center;
		justify-content: center;
		padding: 6rpx;
	}
	.hero-emblem-in {
		width: 84rpx;
		height: 84rpx;
		border-radius: 50%;
		background-color: #12100A;
		align-items: center;
		justify-content: center;
	}
	.hero-emblem-text { font-size: 36rpx; font-weight: 700; line-height: 44rpx; }

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
	.hero-tier { font-size: 26rpx; font-weight: 600; margin-top: 8rpx; }
	.hero-city { font-size: 22rpx; color: #7E8281; margin-top: 6rpx; }

	.hero-points { flex-direction: column; align-items: flex-end; margin-left: 12rpx; }
	/* 段位分 = 名片上的核心奖杯数值，用金黄压场 */
	.hero-points-num { font-size: 52rpx; color: #E8C275; font-weight: 700; line-height: 56rpx; }
	.hero-points-label { font-size: 20rpx; color: #7E8281; margin-top: 4rpx; }

	.hero-stats {
		flex-direction: row;
		align-items: stretch;
		margin-top: 26rpx;
		padding-top: 22rpx;
		border-top: 1rpx solid #2A2F2D;
	}
	.hero-stat { flex: 1; flex-direction: column; align-items: center; }
	.hero-stat-value { font-size: 34rpx; font-weight: 700; }
	.hero-stat-label { font-size: 22rpx; color: #7E8281; margin-top: 6rpx; }
	.hero-stat-divider { width: 1rpx; background-color: #2A2F2D; }

	/* ============ 筛选条件 ============ */
	.filter-card {
		background-color: #1A1E1D;
		border: 1rpx solid #2A2F2D;
		border-radius: 28rpx;
		padding: 20rpx 24rpx;
		margin: 24rpx 0 0;
		box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.40);
	}
	.filter-row { flex-direction: row; align-items: center; }
	.filter-row + .filter-row { margin-top: 16rpx; }
	.filter-label {
		width: 64rpx;
		font-size: 22rpx;
		color: #7E8281;
		flex-shrink: 0;
	}
	.filter-chips { flex: 1; flex-direction: row; flex-wrap: wrap; }
	.chip {
		padding: 8rpx 22rpx;
		border-radius: 999rpx;
		background-color: #242927;
		border: 1rpx solid #2A2F2D;
		margin: 0 12rpx 8rpx 0;
	}
	.chip-on {
		background-image: linear-gradient(135deg, #F5D98E, #C89B3C);
		border-color: rgba(245, 217, 142, 0.60);
	}
	.chip-text { font-size: 22rpx; color: #A0A5A3; line-height: 30rpx; }
	.chip-text-on { color: #14100A; font-weight: 700; }

	/* ============ 通用 section ============ */
	.section { margin: 32rpx 0 0; }
	.section-head {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16rpx;
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
	/* 右侧计数 = 活跃类数据，统一绿色 */
	.section-count { font-size: 24rpx; color: #2AA97A; font-weight: 600; }

	/* ============ 近 20 场趋势图 ============ */
	.chart-card {
		background-color: #1A1E1D;
		border-radius: 28rpx;
		border: 1rpx solid #2A2F2D;
		padding: 24rpx 24rpx 18rpx;
		box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.40);
	}
	.chart-head { flex-direction: row; align-items: center; justify-content: space-between; }
	.chart-caption { font-size: 22rpx; color: #2AA97A; font-weight: 600; }
	.chart-legend { flex-direction: row; align-items: center; }
	.lg-item { flex-direction: row; align-items: center; margin-left: 18rpx; }
	.lg-dot { width: 14rpx; height: 14rpx; border-radius: 4rpx; margin-right: 8rpx; }
	.lg-win { background-image: linear-gradient(180deg, #F5D98E, #C89B3C); }
	.lg-itm { background-image: linear-gradient(180deg, #57C79A, #1F8B62); }
	.lg-out { background-color: #39423F; }
	.lg-text { font-size: 20rpx; color: #8F9492; }

	/* 折线画布：SVG 容器，绝对定位 SVG 让 viewBox 坐标系生效 */
	.chart-canvas {
		position: relative;
		width: 100%;
		height: 220rpx;
		margin-top: 22rpx;
	}
	.trend-svg {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	/* ============ 战绩列表 ============ */
	.rec-row {
		flex-direction: row;
		align-items: center;
		background-color: #1A1E1D;
		border: 1rpx solid #2A2F2D;
		border-radius: 24rpx;
		padding: 20rpx 24rpx;
		margin-bottom: 14rpx;
	}
	.rec-rank {
		width: 60rpx;
		height: 60rpx;
		border-radius: 50%;
		background-color: #2A2F2D;
		align-items: center;
		justify-content: center;
		margin-right: 18rpx;
	}
	/* 前三名 = 金 / 银 / 铜实底徽章，与排行榜的荣誉色一致 */
	.rec-rank-1 { background-image: linear-gradient(135deg, #F5D98E, #C89B3C); }
	.rec-rank-2 { background-color: #AEBCC4; }
	.rec-rank-3 { background-color: #CD8454; }
	.rec-rank-text { font-size: 26rpx; color: #A0A5A3; font-weight: 700; line-height: 30rpx; }
	/* 金银铜是实底徽章，文字要用深色才压得住 */
	.rec-rank-text-medal { color: #14100A; }

	.rec-main { flex: 1; flex-direction: column; }
	.rec-title { font-size: 28rpx; color: #EDEFEE; font-weight: 600; }
	.rec-sub { font-size: 22rpx; color: #8F9492; margin-top: 8rpx; }

	.rec-right { flex-direction: column; align-items: flex-end; margin-left: 12rpx; }
	/* 积分 = 该场最终得分，用金黄与总览段位分同源 */
	.rec-score { font-size: 30rpx; color: #E8C275; font-weight: 700; }
	.rec-score-label { font-size: 20rpx; color: #7E8281; margin-top: 4rpx; }

	/* 空态：整块卡片居中提示 */
	.rec-empty {
		background-color: #1A1E1D;
		border: 1rpx solid #2A2F2D;
		border-radius: 24rpx;
		padding: 56rpx 24rpx;
		align-items: center;
	}
	.rec-empty-text { font-size: 28rpx; color: #EDEFEE; font-weight: 600; }
	.rec-empty-sub { font-size: 22rpx; color: #7E8281; margin-top: 10rpx; }

	.list-foot { padding: 24rpx 0 48rpx; align-items: center; }
	.list-foot-text { font-size: 22rpx; color: #2AA97A; font-weight: 500; }
</style>
