<template>
	<scroll-view class="page" direction="vertical" :show-scrollbar="false">
		<!-- ============ 我的段位名片 ============ -->
		<!-- 数据直接取接口 userRanking：仅展示排名与段位分；userRanking 为 null 时排名 300+ / 段位分 0 -->
		<view class="me-card">
			<view class="me-top">
				<view class="me-avatar-tt">
					<text class="me-avatar-tt-text">{{ meName.substring(0, 1) }}</text>
				</view>
				<view class="me-info">
					<view class="me-name-row">
						<text class="me-name">{{ meName }}</text>
					</view>
					<text class="me-city">段位分 {{ formatNum(meScore) }}</text>
				</view>
				<view class="me-rank">
					<text class="me-rank-num">{{ meRankText }}</text>
					<text class="me-rank-label">当前排名</text>
				</view>
			</view>
		</view>

		<!-- ============ 赛季切换 ============ -->
		<!-- 选项来自 /user-ranking/info 的 seasonOptions（仅 id/name），无进行中状态数据故不显示状态圆点 -->
		<scroll-view class="season-scroll" direction="horizontal" :show-scrollbar="false">
			<view
				v-for="s in seasons"
				:key="s.id"
				class="chip"
				:class="{ 'chip-active': activeSeason === s.id }"
				@tap="switchSeason(s.id)"
			>
				<text class="chip-text" :class="{ 'chip-text-active': activeSeason === s.id }">{{ s.name }}</text>
			</view>
		</scroll-view>

		<!-- ============ 排名类型切换 ============ -->
		<!-- 选项来自 /user-ranking/info 的 rankingTypeOptions（仅 id/name），排序指标按名称关键词匹配 -->
		<scroll-view class="ranking-scroll" direction="horizontal" :show-scrollbar="false">
			<view
				v-for="r in rankings"
				:key="r.id"
				class="r-chip"
				:class="{ 'r-chip-active': activeRanking === r.id }"
				@tap="switchRanking(r.id)"
			>
				<text class="r-chip-text" :class="{ 'r-chip-text-active': activeRanking === r.id }">{{ r.name }}</text>
			</view>
		</scroll-view>

		<!-- ============ 赛季榜单 ============ -->
		<view class="section">
			<view class="section-head">
				<view class="section-title-wrap">
					<view class="section-bar"></view>
					<text class="section-title">{{ season.name }}</text>
				</view>
				<text class="section-count">{{ loading ? '加载中…' : '共 ' + sortedPlayers.length + ' 人上榜' }}</text>
			</view>

			<!-- 加载中：首次进入与切换赛季 / 榜单类型时 -->
			<view v-if="loading" class="rk-loading">
				<view class="rk-spinner"></view>
				<text class="rk-loading-text">榜单加载中…</text>
			</view>

			<template v-else>
			<!-- 前三名领奖台：2-1-3 布局，底座高度差撑出颁奖台的感觉；榜单不足 3 人时不展示 -->
			<view v-if="top3Ready" class="podium">
				<view class="podium-row">
					<!-- 亚军 -->
					<view class="podium-col">
						<view class="av av-m" :style="frameStyle(second)">
							<view v-for="(tickStyle, ti) in frameTicks(second, 45)" :key="ti" class="tick" :style="tickStyle" />
							<view class="av-in av-in-m" :style="frameLineStyle(second)">
								<image class="av-img av-img-m" :src="avatarOf(second)" mode="aspectFill" />
							</view>
							<view v-if="second.tier == 'legend'" class="av-badge">
								<text class="av-badge-text">♛</text>
							</view>
						</view>
						<text class="podium-name">{{ second.name }}</text>
						<view class="podium-base pb-2">
							<text class="podium-base-text">2</text>
						</view>
					</view>

					<!-- 冠军 -->
					<view class="podium-col">
						<text class="podium-crown">♛</text>
						<view class="av av-l" :style="frameStyle(first)">
							<view v-for="(tickStyle, ti) in frameTicks(first, 58)" :key="ti" class="tick" :style="tickStyle" />
							<view class="av-in av-in-l" :style="frameLineStyle(first)">
								<image class="av-img av-img-l" :src="avatarOf(first)" mode="aspectFill" />
							</view>
							<view v-if="first.tier == 'legend'" class="av-badge">
								<text class="av-badge-text">♛</text>
							</view>
						</view>
						<text class="podium-name">{{ first.name }}</text>
						<view class="podium-base pb-1">
							<text class="podium-base-text">1</text>
						</view>
					</view>

					<!-- 季军 -->
					<view class="podium-col">
						<view class="av av-m3" :style="frameStyle(third)">
							<view v-for="(tickStyle, ti) in frameTicks(third, 42)" :key="ti" class="tick" :style="tickStyle" />
							<view class="av-in av-in-m3" :style="frameLineStyle(third)">
								<image class="av-img av-img-m3" :src="avatarOf(third)" mode="aspectFill" />
							</view>
							<view v-if="third.tier == 'legend'" class="av-badge">
								<text class="av-badge-text">♛</text>
							</view>
						</view>
						<text class="podium-name">{{ third.name }}</text>
						<view class="podium-base pb-3">
							<text class="podium-base-text">3</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 空状态：接口无数据 / 加载失败 -->
			<view v-if="sortedPlayers.length == 0" class="rk-empty">
				<text class="rk-empty-text">暂无排行数据</text>
			</view>

			<!-- 完整榜单：每行的荣誉背景与名次由"当前榜单"前 3 名（idx）决定，
			     切到蘑菇王 / 摸鱼榜后前三名可能换人，金银铜徽章仍跟着榜单位置走 -->
			<view
				v-for="(p, idx) in sortedPlayers"
				:key="activeRanking + '-' + activeSeason + '-' + idx"
				class="row"
				:style="rowBgStyle(idx, p)"
				@tap="onRowTap(p)"
			>
				<view
					class="row-rank"
					:class="{ 'row-rank-1': idx == 0, 'row-rank-2': idx == 1, 'row-rank-3': idx == 2, 'row-rank-me': p.isMe }"
				>
					<text
						class="row-rank-text"
						:class="{ 'row-rank-text-medal': idx < 3, 'row-rank-text-me': p.isMe }"
					>{{ idx + 1 }}</text>
				</view>

				<view class="av av-s" :style="frameStyle(p)">
					<view v-for="(tickStyle, ti) in frameTicks(p, 36)" :key="ti" class="tick" :style="tickStyle" />
					<view class="av-in av-in-s" :style="frameLineStyle(p)">
						<image class="av-img av-img-s" :src="avatarOf(p)" mode="aspectFill" />
					</view>
				</view>

				<view class="row-main">
					<view class="row-name-line">
						<text class="row-name">{{ p.name }}</text>
						<view v-if="p.isMe" class="me-tag">
							<text class="me-tag-text">我</text>
						</view>
						<view v-if="p.titles > 0" class="row-titles">
							<text class="row-titles-text">♛ {{ p.titles }}</text>
						</view>
					</view>
					<text class="row-tier" :style="tierTextStyle(p)">{{ rowTierText(p) }}</text>
				</view>

				<view class="row-right">
					<text class="row-points" :class="{ 'row-points-medal': idx < 3, 'row-points-me': p.isMe && idx >= 3 }">{{ metricDisplayOf(p) }}</text>
				</view>
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
import type { RankPlayer, TierInfo } from '@/common/types'
import { fetchUserRanking } from '@/common/ranking-api'
import type { UserRankingVO, UserRankingDTO, UserRankingListDTO, RankingTypeDTO, StackMatchSeasonDTO, SeasonHonorVO } from '@/common/ranking-api'
import { resolveFileUrl } from '@/common/http'

/* ---------------- 接口数据 ---------------- */
// GET /user-ranking/info 的一次性返回：我的排名 + 榜单 + 赛季/榜单类型选项
const rankInfo = ref<UserRankingVO>({})

// 赛季选项（接口仅给 id/name）
type SeasonOpt = { id : string, name : string }
const seasons = ref<SeasonOpt[]>([])

// 榜单类型选项（接口仅给 id/name）：排序指标由名称关键词匹配
type RankOpt = { id : string, name : string, metric : string, unit : string }
const rankings = ref<RankOpt[]>([])

// 榜单成员：userListRanking 映射为 RankPlayer
const players = ref<RankPlayer[]>([])

const activeSeason = ref<string>('')
const activeRanking = ref<string>('')

/* ---------------- 数据映射 ---------------- */
// BigDecimal 容错取数：JSON 里可能是数字也可能是字符串
const num = (v : any) : number => {
	const n : number = typeof v == 'number' ? v : parseFloat(v)
	return isNaN(n) ? 0 : n
}

// 接口无段位花色数据：头像框 / 行底色统一走"梅花"金色系，与整体金黄主题协调
const DEFAULT_TIER : string = 'club'

// 榜单成员映射：UserRankingListDTO → RankPlayer
const mapPlayer = (it : UserRankingListDTO, meId : number) : RankPlayer => {
	return {
		rank: 0,
		name: it.username || it.userNo || '--',
		city: it.levelName || '',
		avatar: it.avatar,
		levelName: it.levelName || '',
		points: num(it.rankingScore),
		tier: DEFAULT_TIER,
		tierLevel: 1,
		titles: 0,
		wins: num(it.winnerCount),
		games: num(it.joinMatchCount),
		itm: num(it.enterFinalCount),
		mushroom: num(it.mushReliveCount),
		masterScore: num(it.rankingScore),
		fishScore: num(it.happyScore),
		isMe: meId > 0 && it.userId != null && it.userId == meId
	}
}

// 我的兜底映射已移除：名片直接读 userRanking，不再构造 RankPlayer

// 榜单类型名称 → 排序指标：按中文名关键词匹配，匹配不到回落积分
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

const unitOfMetric = (m : string) : string => {
	switch (m) {
		case 'winrate': case 'itmrate': return '%'
		case 'wins': case 'games': return '场'
		case 'itm': return '次'
		case 'mushroom': return '🍄'
		case 'fish': return '🐟'
		default: return '分'
	}
}

/* ---------------- 接口加载 ---------------- */
// 请求序号：切换赛季 / 榜单类型会连续发请求，只采纳最后一次的结果，防止旧响应覆盖新数据
let requestSeq : number = 0

// 加载状态：首次进入与切换赛季 / 榜单类型时，榜单区展示 loading 卡片
const loading = ref<boolean>(true)

const loadRanking = () : void => {
	const seq : number = ++requestSeq
	loading.value = true
	fetchUserRanking(activeSeason.value, activeRanking.value).then((vo : UserRankingVO) => {
		if (seq != requestSeq) { return }
		rankInfo.value = vo || {}

		// 赛季 / 类型选项：id 统一转字符串，便于模板比对
		const so : StackMatchSeasonDTO[] = (vo && vo.seasonOptions) || []
		seasons.value = so.map((s : StackMatchSeasonDTO) : SeasonOpt => ({ id: s.id == null ? '' : String(s.id), name: s.name || '' }))

		const ro : RankingTypeDTO[] = (vo && vo.rankingTypeOptions) || []
		rankings.value = ro.map((r : RankingTypeDTO) : RankOpt => {
			const m : string = metricOfName(r.name)
			return { id: r.id == null ? '' : String(r.id), name: r.name || '', metric: m, unit: unitOfMetric(m) }
		})

		// 榜单成员
		const meId : number = num(vo && vo.userRanking && vo.userRanking.userId)
		const list : UserRankingListDTO[] = (vo && vo.userListRanking) || []
		players.value = list.map((it : UserRankingListDTO) => mapPlayer(it, meId))

		// 默认选中第一项（首次加载时 active 为空）
		if (seasons.value.length > 0 && activeSeason.value == '') { activeSeason.value = seasons.value[0].id }
		if (rankings.value.length > 0 && activeRanking.value == '') { activeRanking.value = rankings.value[0].id }

		console.log('[排行] 加载完成:', { seasons: seasons.value.length, rankings: rankings.value.length, players: players.value.length })
		loading.value = false
	}).catch((err : any) => {
		if (seq != requestSeq) { return }
		console.error('[排行] 加载失败:', err)
		players.value = []
		uni.showToast({ title: '排行榜加载失败', icon: 'none' })
		loading.value = false
	})
}

// 切换赛季 / 榜单类型：更新选中项后带参重新请求
const switchSeason = (id : string) : void => {
	if (activeSeason.value == id) { return }
	activeSeason.value = id
	loadRanking()
}

const switchRanking = (id : string) : void => {
	if (activeRanking.value == id) { return }
	activeRanking.value = id
	loadRanking()
}

onMounted(() => { loadRanking() })

/* ---------------- 派生数据 ---------------- */
const season = computed<SeasonOpt>((): SeasonOpt => {
	for (let i : number = 0; i < seasons.value.length; i++) {
		if (seasons.value[i].id == activeSeason.value) { return seasons.value[i] }
	}
	return seasons.value[0] || { id: '', name: '' }
})

const curRanking = computed<RankOpt>((): RankOpt => {
	for (let i : number = 0; i < rankings.value.length; i++) {
		if (rankings.value[i].id == activeRanking.value) { return rankings.value[i] }
	}
	return rankings.value[0] || { id: '', name: '积分榜', metric: 'points', unit: '分' }
})

// 当前榜单排序值：按类型匹配到的指标降序
const metricValueOf = (p : RankPlayer) : number => {
	switch (curRanking.value.metric) {
		case 'winrate': return p.games == 0 ? 0 : p.wins * 100 / p.games
		case 'itmrate': return p.games == 0 ? 0 : p.itm * 100 / p.games
		case 'wins': return p.wins
		case 'itm': return p.itm
		case 'games': return p.games
		case 'mushroom': return p.mushroom
		case 'fish': return p.fishScore
		default: return p.points
	}
}

// 行内右侧指标列文案
const metricDisplayOf = (p : RankPlayer) : string => {
	switch (curRanking.value.metric) {
		case 'winrate': return p.games == 0 ? '—' : (p.wins * 100 / p.games).toFixed(1) + '%'
		case 'itmrate': return p.games == 0 ? '—' : (p.itm * 100 / p.games).toFixed(1) + '%'
		case 'wins': return formatNum(p.wins) + ' 场'
		case 'itm': return formatNum(p.itm) + ' 次'
		case 'games': return formatNum(p.games) + ' 场'
		case 'mushroom': return p.mushroom + ' 🍄'
		case 'fish': return p.fishScore + ' 🐟'
		default: return formatNum(p.points) + ' 分'
	}
}

const sortedPlayers = computed<RankPlayer[]>((): RankPlayer[] => {
	const copy : RankPlayer[] = players.value.slice()
	copy.sort((a : RankPlayer, b : RankPlayer) : number => metricValueOf(b) - metricValueOf(a))
	return copy
})

// 我的卡片：直接取接口 userRanking，仅展示排名 + 段位分
// userRanking 为 null 时：排名显示 300+、段位分显示 0
const meName = computed<string>((): string => {
	const u : UserRankingDTO | undefined = rankInfo.value.userRanking
	return (u && u.username) || (u && u.userNo) || '我'
})

const meScore = computed<number>((): number => {
	const u : UserRankingDTO | undefined = rankInfo.value.userRanking
	return num(u && u.rankingScore)
})

const meRankText = computed<string>((): string => {
	const u : UserRankingDTO | undefined = rankInfo.value.userRanking
	if (u == null || u.ranking == null || u.ranking <= 0) { return '300+' }
	return u.ranking.toString()
})

// 赛季前三名：来自接口 seasonHonorList（id/seasonId/userId/username/avatar/ranking），
// 按 ranking 升序取前三（ranking 缺失时保持列表顺序），映射为领奖台可用的 RankPlayer
const overallTop3 = computed<RankPlayer[]>((): RankPlayer[] => {
	const honors : SeasonHonorVO[] = (rankInfo.value && rankInfo.value.seasonHonorList) || []
	const copy : SeasonHonorVO[] = honors.slice()
	copy.sort((a : SeasonHonorVO, b : SeasonHonorVO) : number => num(a.ranking) - num(b.ranking))
	const meId : number = num(rankInfo.value.userRanking && rankInfo.value.userRanking.userId)
	return copy.slice(0, 3).map((h : SeasonHonorVO) : RankPlayer => ({
		rank: num(h.ranking),
		name: h.username || '--',
		city: '',
		avatar: h.avatar,
		levelName: '',
		points: 0,
		tier: DEFAULT_TIER,
		tierLevel: 1,
		titles: 0,
		wins: 0,
		games: 0,
		itm: 0,
		mushroom: 0,
		masterScore: 0,
		fishScore: 0,
		isMe: meId > 0 && h.userId != null && h.userId == meId
	}))
})

// 榜单不足 3 人时不展示领奖台
const top3Ready = computed<boolean>((): boolean => overallTop3.value.length === 3)

const first = computed<RankPlayer>((): RankPlayer => overallTop3.value[0])
const second = computed<RankPlayer>((): RankPlayer => overallTop3.value[1])
const third = computed<RankPlayer>((): RankPlayer => overallTop3.value[2])

/* ---------------- 展示辅助 ---------------- */
// 段位查找用函数而不是对象下标：uvue 的 TS 严格模式对动态键访问不友好
const tierOf = (key : string) : TierInfo => {
	for (let i : number = 0; i < TIERS.length; i++) {
		if (TIERS[i].key == key) { return TIERS[i] }
	}
	return TIERS[0]
}

const roman = (n : number) : string => {
	if (n == 1) { return 'I' }
	if (n == 2) { return 'II' }
	if (n == 3) { return 'III' }
	if (n == 4) { return 'IV' }
	return 'V'
}

const tierText = (p : RankPlayer) : string => {
	const t : TierInfo = tierOf(p.tier)
	return t.suit + ' ' + t.name + ' · ' + roman(p.tierLevel)
}

// 行内等级文案：接口的 levelName 优先，缺失时回落花色段位
const rowTierText = (p : RankPlayer) : string => {
	if (p.levelName != null && p.levelName != '') { return p.levelName }
	return tierText(p)
}

const tierTextStyle = (p : RankPlayer) : string => 'color:' + tierOf(p.tier).color + ';'

/* ---------------- 头像与段位头像框 ---------------- */
// mock 阶段所有用户共用默认头像；avatar 字段留给真实用户数据，空值回落
const DEFAULT_AVATAR : string = 'https://image.silentstack.cn/2026-04-01/ef06d926-2ae3-49f5-ba6a-222308b3f5ff.jpg'

const avatarOf = (p : RankPlayer) : string => {
	if (p.avatar != null && p.avatar != '') { return resolveFileUrl(p.avatar) }
	return DEFAULT_AVATAR
}

// 头像框的外层：渐变主色环与光晕由段位数据注入（background-image + box-shadow），
// 尺寸与结构走样式类 —— 动态的走 JS、静态的走 CSS，职责分开
const frameStyle = (p : RankPlayer) : string => {
	const t : TierInfo = tierOf(p.tier)
	return 'background-image:' + t.frameBg + ';box-shadow:' + t.frameGlow + ';'
}

// 内侧收边细环：色环内侧的 2rpx 细描边，呼应筹码内圈压线
const frameLineStyle = (p : RankPlayer) : string => {
	const t : TierInfo = tierOf(p.tier)
	return 'border:2rpx solid ' + t.frameLine + ';'
}

// 筹码嵌块：logo 式白色矩形嵌块，在主色环上均匀排 8 枚；
// 每枚用 rotate(角度) translateY(-半径) 钉到圆周上，半径随场景尺寸而异，
// 由调用处传入（列表 36 / 季军 42 / 我的卡片与亚军 45 / 冠军 58）
const frameTicks = (_p : RankPlayer, radius : number) : string[] => {
	const styles : string[] = []
	for (let i = 0; i < 8; i++) {
		const deg : number = i * 45
		styles.push('transform:rotate(' + deg + 'deg) translateY(-' + radius + 'rpx);background-color:rgba(255,255,255,0.92);')
	}
	return styles
}

// 榜单行的荣誉背景：金银铜按"当前榜单"前 3 名（idx），而非原 rank 字段，
// 切到蘑菇王/摸鱼榜后前三名可能换人，但金银铜徽章仍跟着榜单位置走
// "我自己"那一行的强调色由品牌绿改为金黄系，与整体比赛观感统一
const rowBgStyle = (idx : number, p : RankPlayer) : string => {
	if (idx == 0) {
		return 'background-image:linear-gradient(135deg,rgba(232,194,117,0.22),rgba(232,194,117,0.04));border-color:rgba(232,194,117,0.60);'
	}
	if (idx == 1) {
		return 'background-image:linear-gradient(135deg,rgba(176,188,196,0.18),rgba(176,188,196,0.04));border-color:rgba(196,208,216,0.45);'
	}
	if (idx == 2) {
		return 'background-image:linear-gradient(135deg,rgba(205,132,84,0.18),rgba(205,132,84,0.04));border-color:rgba(214,145,98,0.45);'
	}
	if (p.isMe) {
		return 'background-image:linear-gradient(135deg,rgba(232,194,117,0.18),rgba(232,194,117,0.04));border-color:rgba(232,194,117,0.60);'
	}
	const t : TierInfo = tierOf(p.tier)
	return 'background-color:' + t.rowBg + ';border-color:' + t.rowBorder + ';'
}

/* ---------------- 脚注文案 ---------------- */
// 每种榜单的口径说明：按类型名称匹配到的指标给出规则文案
const footNoteText = computed<string>((): string => {
	switch (curRanking.value.metric) {
		case 'points':   return '按赛季积分降序排列\n赛季结束后按名次发放荣誉与奖励'
		case 'winrate':  return '胜率 = 胜场 / 参赛场次 × 100%'
		case 'itmrate':  return '进圈率 = 进圈次数 / 参赛场次 × 100%\n进圈即打至前三名结算圈'
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

const onRowTap = (p : RankPlayer) : void => {
	uni.showToast({ title: p.name + ' · ' + rowTierText(p), icon: 'none' })
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
	/* 首字圆形头像占位：userRanking 无 avatar 字段 */
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
	.me-tier { font-size: 26rpx; font-weight: 600; margin-top: 8rpx; }
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

	/* ============ 赛季切换 ============ */
	/* chip 是横向 scroll-view 的 flex item，必须 flex-shrink: 0 才能溢出滚动 */
	.season-scroll {
		flex-direction: row;
		align-items: center;
		width: 750rpx;
		margin: 24rpx 0 0;
		padding-left: 24rpx;
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
	   段位差异靠环色 / stripe 色 / 光晕 / 皇冠徽章递进
	   尺寸四档：s = 列表行 104，m3 = 季军 116，m = 我的卡片与亚军 124，l = 冠军 148 */
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

	/* 传奇段位专属：框顶的皇冠小徽章，配合白金渐变框形成"加冕"感 */
	.av-badge {
		position: absolute;
		top: -14rpx;
		left: 50%;
		margin-left: -18rpx;
		width: 36rpx;
		height: 36rpx;
		border-radius: 50%;
		background-image: linear-gradient(135deg, #FFF8DE, #E8C275);
		align-items: center;
		justify-content: center;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.45);
		z-index: 3;
	}
	.av-badge-text { font-size: 20rpx; color: #14100A; font-weight: 700; line-height: 22rpx; }

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
	.row-titles {
		padding: 2rpx 12rpx;
		border-radius: 999rpx;
		background-color: rgba(232, 194, 117, 0.16);
		border: 1rpx solid rgba(232, 194, 117, 0.35);
		margin-left: 12rpx;
	}
	.row-titles-text { font-size: 18rpx; color: #E8C275; font-weight: 600; line-height: 26rpx; }
	.row-tier { font-size: 22rpx; font-weight: 500; margin-top: 8rpx; }

	.row-right { flex-direction: column; align-items: flex-end; }
	.row-points { font-size: 30rpx; color: #EDEFEE; font-weight: 700; }
	.row-points-medal { color: #E8C275; }
	/* 我自己的数值 = 绿色的「在场」高亮，区别于金黄奖牌与白色基础 */
	.row-points-me { color: #2AA97A; }
	.row-points-label { font-size: 20rpx; color: #7E8281; margin-top: 4rpx; }

	/* ---- 底部说明 ---- */
	.foot-note { padding: 28rpx 8rpx 48rpx; align-items: center; }
	.foot-note-text { font-size: 22rpx; color: #7E8281; line-height: 36rpx; text-align: center; }
</style>
