<template>
	<view class="page">
	<scroll-view class="scroll" direction="vertical" :show-scrollbar="false">
		<view v-if="valid" class="wrap">

			<!-- ============ 赛事概览 ============ -->
			<view class="hero">
				<view class="hero-top">
					<view class="hero-store">
						<view class="store-dot"></view>
						<text class="store-name">{{ detail.game.storeName }}</text>
					</view>
					<view class="status-badge" :style="statusBgStyle">
						<text class="status-text" :style="statusColorStyle">{{ detail.game.status }}</text>
					</view>
				</view>

				<text class="hero-title">{{ detail.game.title }}</text>

				<view class="hero-tags">
					<view class="tag">
						<text class="tag-text">{{ detail.type }}</text>
					</view>
					<view class="tag">
						<text class="tag-text">{{ detail.game.startTime }}</text>
					</view>
					<view class="tag">
						<text class="tag-text">{{ buyInText }}</text>
					</view>
				</view>

				<view class="hero-progress">
					<view class="hp-head">
						<text class="hp-label">存活 / 参赛</text>
						<text class="hp-value">{{ aliveCount }} / {{ detail.entrants }}</text>
					</view>
					<view class="hp-track">
						<view class="hp-fill" :style="aliveStyle"></view>
					</view>
					<text class="hp-sub">已淘汰 {{ bustedCount }} 人 · 剩余 {{ alivePct }}%</text>
				</view>
			</view>

			<!-- ============ 我的状态 ============ -->
			<view class="section">
				<view class="section-head">
					<view class="section-title-wrap">
						<view class="section-bar"></view>
						<text class="section-title">我的状态</text>
					</view>
				</view>

				<view class="me-card">
					<view class="me-left">
						<text class="me-state" :style="meStateStyle">{{ detail.myState }}</text>
						<text class="me-sub">{{ meSubText }}</text>
					</view>
					<view class="me-right">
						<text class="me-chips">{{ myChipsText }}</text>
						<text class="me-chips-label">{{ chipLabel }}</text>
					</view>
				</view>
			</view>

			<!-- ============ 赛事数据 ============ -->
			<view class="section">
				<view class="section-head">
					<view class="section-title-wrap">
						<view class="section-bar"></view>
						<text class="section-title">赛事数据</text>
					</view>
				</view>

				<!-- 层次结构：主带（当前级别+盲注 / 存活进度条） → 细分割线 → 四列指标带 -->
				<view class="stat-card">
					<view class="stat-hero">
						<!-- 左：当前级别大字（金色）+ 盲注副标题 -->
						<view class="stat-hero-left">
							<text class="stat-hero-label">当前级别</text>
							<text class="stat-hero-level">{{ levelText }}</text>
							<text class="stat-hero-blinds">{{ blindsText }}</text>
						</view>
						<!-- 右：存活人数 + 存活率进度条 -->
						<view class="stat-hero-right">
							<view class="stat-alive-row">
								<text class="stat-alive-label">存活</text>
								<text class="stat-alive-num">{{ aliveCount }}</text>
								<text class="stat-alive-total">/ {{ detail.entrants }} 人</text>
							</view>
							<view class="stat-alive-track">
								<view class="stat-alive-fill" :style="aliveStyle"></view>
							</view>
							<text class="stat-alive-pct">存活率 {{ alivePct }}%</text>
						</view>
					</view>

					<view class="stat-divider"></view>

					<!-- 底部四列指标：竖线分隔，颜色沿用 statColorOf 分组着色 -->
					<view class="stat-strip">
						<view v-for="s in statCells" :key="s.label" class="stat-cell">
							<text class="stat-label">{{ s.label }}</text>
							<text class="stat-value" :style="{ color: statColorOf(s.label) }">{{ s.value }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- ============ 参赛玩家 ============ -->
			<view class="section">
				<view class="section-head">
					<view class="section-title-wrap">
						<view class="section-bar"></view>
						<text class="section-title">参赛玩家</text>
					</view>
					<text class="section-count">{{ detail.entrants }} 人</text>
				</view>

				<view class="player-list">
					<view
						v-for="p in playersView"
						:key="p.rank"
						class="player-row"
						:class="{ 'player-row-me': p.isMe, 'player-row-out': !p.alive }"
					>
						<!-- 行首：排名 + 文字头像 + 名称 + 状态胶囊（筹码降级到摘要行） -->
						<view class="pr-top">
							<text class="player-rank" :class="{ 'player-rank-top': p.alive && p.rank <= 3 }">{{ p.rank }}</text>
							<view class="pr-avatar" :class="{ 'pr-avatar-out': !p.alive }">
								<image v-if="p.avatar != ''" class="pr-avatar-img" :src="p.avatar" mode="aspectFill"></image>
								<text v-else class="pr-avatar-text">{{ avatarTextOf(p) }}</text>
							</view>
							<view class="player-main">
								<view class="pr-name-line">
									<text class="player-name" :class="{ 'player-name-out': !p.alive }">{{ p.name }}</text>
								</view>
								<!-- 摘要行：桌号座位 · 筹码（接口暂无逐人筹码，显示占位符） -->
								<view class="pr-meta">
									<text class="pr-meta-item">{{ seatTextOf(p) }}</text>
									<text class="pr-meta-dot">·</text>
									<text class="pr-meta-item pr-meta-chips">{{ p.chips > 0 ? formatChips(p.chips) : '—' }}</text>
								</view>
							</view>
							<!-- 状态胶囊：淘汰 > 出桌 > 我 > 存活，一眼区分 -->
							<view class="pr-status" :class="statusClsOf(p)">
								<text class="pr-status-text" :class="statusClsOf(p) + '-text'">{{ statusTextOf(p) }}</text>
							</view>
						</view>

						<!-- 管理员行内操作：仅存活玩家可操作 -->
						<view v-if="isAdmin && p.alive" class="pr-admin">
							<view class="pr-admin-btn pr-admin-bust" @tap="onBust(p)">
								<text class="pr-admin-btn-text pr-admin-bust-text">出局</text>
							</view>
							<view class="pr-admin-btn pr-admin-off" @tap="onOffTable(p)">
								<text class="pr-admin-btn-text pr-admin-off-text">{{ p.offTable ? '回桌' : '出桌' }}</text>
							</view>
							<view class="pr-admin-btn pr-admin-fish" @tap="onOpenFish(p)">
								<text class="pr-admin-btn-text pr-admin-fish-text">摸鱼分</text>
							</view>
						</view>
					</view>
				</view>

				<view class="list-foot">
					<text class="list-foot-text">共 {{ detail.entrants }} 人参赛 · 存活 {{ aliveCount }} 人 · 已淘汰 {{ bustedCount }} 人</text>
				</view>
			</view>

		</view>

		<view v-if="loading" class="empty">
			<text class="loading-text">加载中…</text>
		</view>

		<view v-else-if="!valid" class="empty">
			<EmptyState title="对局不存在" desc="该对局可能已结束或被移除，请返回广场重新选择" />
		</view>
	</scroll-view>

	<!-- ============ 管理员操作 ============ -->
	<!-- 仅管理员可见：详情页底部新章节。复制投屏链接 / 暂停 / 重新开始 / 结束比赛 / 上一级别 / 下一级别 -->
	<view v-if="isAdmin" class="wrap">
		<view class="section admin-section">
			<view class="section-head">
				<view class="section-title-wrap">
					<view class="section-bar admin-section-bar"></view>
					<text class="section-title">管理员操作</text>
				</view>
				<view v-if="paused" class="paused-pill">
					<text class="paused-pill-text">⏸ 已暂停</text>
				</view>
			</view>

			<!-- 级别控制：现场最常用的按钮，单行两列，金色高亮 -->
			<view class="admin-row">
				<view class="admin-btn admin-btn-gold" @tap="onPrevLevel">
					<text class="admin-btn-text">上一级别</text>
				</view>
				<view class="admin-btn admin-btn-gold" @tap="onNextLevel">
					<text class="admin-btn-text">下一级别</text>
				</view>
			</view>

			<!-- 比赛控制：2x2 网格。"结束比赛"用红色突出破坏性 -->
			<view class="admin-grid">
				<view class="admin-btn admin-btn-line" @tap="onCopyScreen">
					<text class="admin-btn-text">复制投屏链接</text>
				</view>
				<view class="admin-btn admin-btn-line" @tap="onPauseToggle">
					<text class="admin-btn-text">{{ paused ? '继续比赛' : '暂停比赛' }}</text>
				</view>
				<view class="admin-btn admin-btn-line" @tap="onRestart">
					<text class="admin-btn-text">重新开始</text>
				</view>
				<view class="admin-btn admin-btn-danger" @tap="onOpenEnd">
					<text class="admin-btn-text admin-btn-text-danger">结束比赛</text>
				</view>
			</view>
		</view>
	</view>

	<!-- ============ 结束比赛：确认前三名弹层 ============ -->
	<!-- 复用 dlg-overlay 居中浮层样式（mask + card），card 内 @tap.stop 防误关闭 -->
	<view v-if="endModalVisible" class="dlg-overlay" @tap="onTapEndMask">
		<view class="dlg-card end-card" @tap.stop="">
			<view class="dlg-head">
				<text class="dlg-title">结束比赛 · 确认前三名</text>
				<text class="dlg-sub">从存活玩家中选出冠亚季军，点击行可调整顺序</text>
			</view>

			<scroll-view :scroll-y="true" class="dlg-body end-body" :show-scrollbar="false">
				<!-- 三个槽位：medal + 名次 + 玩家 + ↑↓ 调序 -->
				<view class="top3-list">
					<view
						v-for="(_, idx) in top3Slots"
						:key="idx"
						class="top3-slot"
						:class="{
							'top3-slot-active': focusedSlot === idx,
							'top3-slot-filled': top3Slots[idx] != null
						}"
						@tap="onTapSlot(idx)"
					>
						<view class="top3-medal" :class="'top3-medal-' + (idx + 1)">
							<text class="top3-medal-text">{{ idx + 1 }}</text>
						</view>
						<view class="top3-info">
							<text class="top3-rank">第 {{ idx + 1 }} 名</text>
							<text class="top3-name" :class="{'top3-name-ph': slotPlayerOf(idx) == null}">
								{{ slotNameOf(idx) }}
							</text>
							<text v-if="slotPlayerOf(idx) != null" class="top3-chips">{{ slotChipsOf(idx) }} 筹码</text>
						</view>
						<view class="top3-actions">
							<view
								class="top3-arrow"
								:class="{'top3-arrow-disabled': idx === 0 || top3Slots[idx - 1] == null}"
								@tap.stop="onSwapTop3(idx, idx - 1)"
							>
								<text class="top3-arrow-text">↑</text>
							</view>
							<view
								class="top3-arrow"
								:class="{'top3-arrow-disabled': idx === 2 || top3Slots[idx + 1] == null}"
								@tap.stop="onSwapTop3(idx, idx + 1)"
							>
								<text class="top3-arrow-text">↓</text>
							</view>
						</view>
					</view>
				</view>

				<!-- 候选玩家：可点击填入选中槽位，已选的会打"已选"标记 -->
				<text class="candidate-title">候选玩家 · 存活 {{ alivePlayersForPick.length }} 人</text>
				<view class="candidate-list">
					<view
						v-for="p in alivePlayersForPick"
						:key="p.rank"
						class="candidate-row"
						:class="{
							'candidate-row-picked': isPickedTop3(p),
							'candidate-row-focus': isFocusedTop3(p)
						}"
						@tap="onPickTop3(p)"
					>
						<text class="candidate-rank">{{ p.rank }}</text>
						<text class="candidate-name">{{ p.name }}</text>
						<text class="candidate-chips">{{ formatChips(p.chips) }}</text>
						<view v-if="isPickedTop3(p)" class="candidate-flag">
							<text class="candidate-flag-text">已选</text>
						</view>
					</view>
				</view>
			</scroll-view>

			<!-- 底部固定操作栏：mask 内预留位置 -->
			<view class="end-foot">
				<view class="end-foot-spacer"></view>
				<view class="end-btn end-btn-cancel" @tap="closeEndModal">
					<text class="end-btn-text">取消</text>
				</view>
				<view
					class="end-btn end-btn-ok"
					:class="{'end-btn-disabled': !endConfirmable}"
					@tap="onConfirmEnd"
				>
					<text class="end-btn-text">确认结束</text>
				</view>
			</view>
		</view>
	</view>

	<!-- ============ 摸鱼分调整弹层 ============ -->
	<!-- 玩家行内"摸鱼分"按钮弹出：快捷加减 + 确认写回 -->
	<view v-if="fishDlg.visible" class="dlg-overlay" @tap="onTapFishMask">
		<view class="dlg-card fish-card" @tap.stop="">
			<view class="dlg-head">
				<text class="dlg-title">摸鱼分 · {{ fishDlg.target == null ? '' : fishDlg.target.name }}</text>
				<text class="dlg-sub">现场软指标：违规扣分 / 娱乐行为加分，确认后写回</text>
			</view>

			<view class="fish-body">
				<text class="fish-value">{{ fishDlg.temp }}</text>
				<text class="fish-value-label">当前摸鱼分</text>

				<view class="fish-adjust">
					<view class="fish-adj-btn" @tap="onFishAdjust(-10)">
						<text class="fish-adj-text">-10</text>
					</view>
					<view class="fish-adj-btn" @tap="onFishAdjust(-5)">
						<text class="fish-adj-text">-5</text>
					</view>
					<view class="fish-adj-btn" @tap="onFishAdjust(-1)">
						<text class="fish-adj-text">-1</text>
					</view>
					<view class="fish-adj-btn fish-adj-plus" @tap="onFishAdjust(1)">
						<text class="fish-adj-text fish-adj-plus-text">+1</text>
					</view>
					<view class="fish-adj-btn fish-adj-plus" @tap="onFishAdjust(5)">
						<text class="fish-adj-text fish-adj-plus-text">+5</text>
					</view>
					<view class="fish-adj-btn fish-adj-plus" @tap="onFishAdjust(10)">
						<text class="fish-adj-text fish-adj-plus-text">+10</text>
					</view>
				</view>
			</view>

			<view class="end-foot">
				<view class="end-foot-spacer"></view>
				<view class="end-btn end-btn-cancel" @tap="onTapFishMask">
					<text class="end-btn-text">取消</text>
				</view>
				<view class="end-btn end-btn-ok" @tap="onFishConfirm">
					<text class="end-btn-text">确认</text>
				</view>
			</view>
		</view>
	</view>

	<!-- ============ 未参赛且可报名：底部常驻「加入比赛」 ============ -->
	<view v-if="showJoinBar" class="join-bar">
		<view class="join-info">
			<text class="join-fee">{{ joinFeeText }}</text>
			<text class="join-sub">可自选座位 · 支持门票 / 月票 / 直通函 / 余额</text>
		</view>
		<view class="join-btn" @tap="onJoin">
			<text class="join-btn-text">加入比赛</text>
		</view>
	</view>
	</view>
</template>

<script setup lang="ts">
import { ref, computed, watch, type Ref } from 'vue'
import { emptyGameDetail, mapMatchDetail } from '@/common/game-detail'
import { fetchMatchDetail, fetchMatchUsers } from '@/common/match-api'
import type { MatchDetailVO, MatchUserVO } from '@/common/match-api'
import type { GameDetail, PlayerInfo } from '@/common/types'
import { getLoginResult } from '@/common/user-api'

type StatItem = {
	label : string
	value : string
}

const gameId = ref<string>('')
// 当前登录用户 id：用于玩家列表"我"标记与创建者（管理员）判定
const myUserId = ref<string>('')
// 接口数据 + 加载态；onShow 重新请求（报名页返回后数据会刷新）
const detailVo = ref<MatchDetailVO | null>(null)
// 参赛用户列表（GET /match-user/{id}/list）：玩家行的数据源
const usersVo = ref<MatchUserVO[]>([])
const loading = ref<boolean>(false)
let reqSeq : number = 0   // 防竞态：丢弃过期响应

const detail = computed<GameDetail>((): GameDetail => {
	const vo : MatchDetailVO | null = detailVo.value
	if (vo == null) { return emptyGameDetail() }
	return mapMatchDetail(vo, myUserId.value, usersVo.value)
})

// 拉取比赛详情 + 参赛用户列表；用户列表失败不阻塞详情展示
const loadDetail = () : void => {
	if (gameId.value == '') { return }
	const seq : number = ++reqSeq
	loading.value = true
	fetchMatchDetail(gameId.value).then((vo) => {
		if (seq != reqSeq) { return }
		detailVo.value = vo
		loading.value = false
	}).catch(() => {
		if (seq != reqSeq) { return }
		loading.value = false
		uni.showToast({ title: '对局详情加载失败', icon: 'none' })
	})
	fetchMatchUsers(gameId.value).then((list) => {
		if (seq != reqSeq) { return }
		usersVo.value = list
	}).catch(() => {
		if (seq != reqSeq) { return }
		usersVo.value = []
	})
}

// 未参赛且后端允许加入（joinValid），才给报名入口
const showJoinBar = computed<boolean>((): boolean => {
	const d : GameDetail = detail.value
	if (d.game.id == '' || d.joined) { return false }
	return d.joinValid
})

const joinFeeText = computed<string>((): string => {
	const d : GameDetail = detail.value
	return d.game.buyIn > 0 ? ('报名费 ¥' + d.game.buyIn) : '免报名费'
})

const onJoin = () : void => {
	uni.navigateTo({ url: '/pages/game-signup/game-signup?id=' + gameId.value })
}

onShow((): void => {
	// 每次进入/返回页面都重新拉取，报名页返回后数据会自动刷新
	if (gameId.value != '') { loadDetail() }
})

const valid = computed<boolean>((): boolean => detail.value.game.id != '')

/* ---------------- 样式辅助 ---------------- */
const statusColor = (status : string) : string => {
	if (status == '进行中') return '#D9A441'
	if (status == '报名中') return '#E8C275'
	if (status == '即将开始') return '#7AB6F2'
	return '#A0A5A3'
}

const statusBg = (status : string) : string => {
	if (status == '进行中') return 'rgba(217,164,65,0.20)'
	if (status == '报名中') return 'rgba(232,194,117,0.22)'
	if (status == '即将开始') return 'rgba(96,160,210,0.20)'
	return 'rgba(255,255,255,0.08)'
}

const statusBgStyle = computed<string>((): string => 'background-color:' + statusBg(detail.value.game.status) + ';')
const statusColorStyle = computed<string>((): string => 'color:' + statusColor(detail.value.game.status) + ';')

const formatChips = (n : number) : string => {
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

/* ---------------- 概览 ---------------- */
const buyInText = computed<string>((): string => {
	const b : number = detail.value.game.buyIn
	return b > 0 ? ('报名 ' + b + ' 元起') : '现金桌 · 随时开局'
})

const alivePct = computed<number>((): number => {
	const total : number = detail.value.entrants
	if (total <= 0) { return 0 }
	return Math.round(aliveCount.value / total * 100)
})

const aliveStyle = computed<string>((): string => 'width:' + alivePct.value + '%;')

/* ---------------- 赛事数据按字段分组着色 ---------------- */
// 白/黄/绿三色展示：基础（白）、奖池量（黄）、活跃参与（绿）
// 让关键指标一眼能识别：活跃度看绿色，金池量看金色，普通数据看白色
const statColorOf = (label : string) : string => {
	switch (label) {
		case '参赛人数':
			return '#2AA97A'                  // 活跃参与 = 绿色
		case '平均筹码':
		case '总筹码':
			return '#E8C275'                  // 奖池金币感 = 金黄
		default:
			return '#EDEFEE'                  // 基础数据 = 白色
	}
}

/* ---------------- 我的状态 ---------------- */
const meStateStyle = computed<string>((): string => {
	const s : string = detail.value.myState
	if (s == '在局中') { return 'color:#D9A441;' }
	if (s == '已报名' || s == '候补中') { return 'color:#E8C275;' }
	if (s == '可报名') { return 'color:#7AB6F2;' }
	return 'color:#A0A5A3;'
})

const meSubText = computed<string>((): string => {
	const d : GameDetail = detail.value
	if (d.joined) {
		if (d.myRank > 0) { return '当前第 ' + d.myRank + ' 名 · ' + formatChips(d.myChips) + ' 筹码' }
		return '已占座，等待开赛'
	}
	if (d.myState == '可报名') { return '尚未报名，可向门店咨询占座' }
	return '你没有参加这场对局'
})

const chipLabel = computed<string>((): string => detail.value.joined ? '我的筹码' : '起始筹码')

const myChipsText = computed<string>((): string => {
	const d : GameDetail = detail.value
	const v : number = d.joined && d.myChips > 0 ? d.myChips : d.game.startChips
	return formatChips(v)
})

/* ---------------- 赛事数据 ---------------- */
// 级别显示：管理员"上一/下一级别"通过 levelBoost 平移 Lv. 编号，按一下就立刻看到变化
// 现金桌没有 Lv 段，level 字段直接就是"现金桌"，原样返回
const levelText = computed<string>((): string => {
	const lv : string = detail.value.game.level
	if (lv == '现金桌') { return lv }
	const segs : string[] = lv.split(' ')
	if (segs.length < 2) { return lv }
	const m : RegExpMatchArray | null = segs[0].match(/^Lv\.(\d+)$/)
	if (m == null) { return lv }
	const num : number = parseInt(m[1]) + levelBoost.value
	const safeNum : number = num < 1 ? 1 : num
	return 'Lv.' + safeNum + ' ' + segs[1]
})

// 盲注摘要：主带副标题；现金桌没有盲注结构时给提示文案
const blindsText = computed<string>((): string => {
	const d : GameDetail = detail.value
	if (d.smallBlind <= 0 || d.bigBlind <= 0) { return '现金桌 · 无盲注结构' }
	return '小盲 ' + formatChips(d.smallBlind) + ' / 大盲 ' + formatChips(d.bigBlind)
})

// 底部指标带四列：起始筹码 / 平均筹码 / 总筹码 / 参赛人数（级别、盲注、存活已上移主带）
const statCells = computed<StatItem[]>((): StatItem[] => {
	const d : GameDetail = detail.value
	return [
		{ label: '起始筹码', value: formatChips(d.game.startChips) },
		{ label: '平均筹码', value: formatChips(d.avgChips) },
		{ label: '总筹码', value: formatChips(d.totalChips) },
		{ label: '参赛人数', value: d.entrants.toString() + ' 人' }
	]
})

/* ---------------- 参赛玩家（本地工作副本） ---------------- */
// detail.players 由 /match-user/{id}/list 映射而来；管理员的"出局 / 出桌 / 摸鱼分"要写回，
// 所以用 watch 拷一份本地副本。detail 重算（onShow / 重新开始）时副本自动重建。
const playersView : Ref<PlayerInfo[]> = ref([])

watch((): PlayerInfo[] => detail.value.players, (list : PlayerInfo[]) : void => {
	// 显式逐字段拷贝（UTS 下不用对象展开），避免 admin 改动写穿到 mock 派生层
	const copy : PlayerInfo[] = []
	for (let i : number = 0; i < list.length; i++) {
		const p : PlayerInfo = list[i]
		copy.push({
			rank: p.rank,
			name: p.name,
			avatar: p.avatar,
			chips: p.chips,
			alive: p.alive,
			isMe: p.isMe,
			buyIns: p.buyIns,
			fishScore: p.fishScore,
			tableNo: p.tableNo,
			seatNo: p.seatNo,
			offTable: p.offTable,
			userStatus: p.userStatus
		})
	}
	playersView.value = copy
}, { immediate: true })

// 存活 / 淘汰从本地副本实时派生：管理员标记出局后 hero 进度条、列表尾注立刻跟着变
const aliveCount = computed<number>((): number => {
	let n : number = 0
	for (let i : number = 0; i < playersView.value.length; i++) {
		if (playersView.value[i].alive) { n++ }
	}
	return n
})
const bustedCount = computed<number>((): number => detail.value.entrants - aliveCount.value)

/* ---------------- 管理员操作 ---------------- */
// 当前用户是否为该场比赛创建者：只有创建者可见管理员操作区
// （creatorId 由接口返回；未登录或非创建者都不渲染管理按钮）
const isAdmin = computed<boolean>((): boolean => {
	const d : GameDetail = detail.value
	return myUserId.value != '' && d.creatorId > 0 && String(d.creatorId) == myUserId.value
})

// 暂停：本机 UI 状态，不影响 mock 数据本身；hero 上挂个"⏸ 已暂停"标识牌给现场看
const paused : Ref<boolean> = ref(false)

// 级别偏离：0 = 原始；按一下"下一级别"+1，按一下"上一级别"-1（钳制到 ≥ 0）
// 上一级别按钮的可用性 = levelBoost > 0
const levelBoost : Ref<number> = ref(0)

// "结束比赛"弹层：top3Slots 三个槽位；focusedSlot 是当前待填充的槽位下标
// 用 (PlayerInfo | null)[] 而不是 PlayerInfo[]：空槽位语义明确，避免哨兵对象
const endModalVisible : Ref<boolean> = ref(false)
const top3Slots : Ref<(PlayerInfo | null)[]> = ref<[null, null, null]>([null, null, null])
const focusedSlot : Ref<number> = ref(0)

// 候选玩家：本地工作副本里取存活（管理员出局的人不会再出现在结束比赛候选里）
const alivePlayersForPick = computed<PlayerInfo[]>((): PlayerInfo[] => {
	const out : PlayerInfo[] = []
	for (let i : number = 0; i < playersView.value.length; i++) {
		const p : PlayerInfo = playersView.value[i]
		if (p.alive) { out.push(p) }
	}
	return out
})

// 三个槽位都选满且互不重复时，"确认结束"才允许点
const endConfirmable = computed<boolean>((): boolean => {
	const s : (PlayerInfo | null)[] = top3Slots.value
	if (s[0] == null || s[1] == null || s[2] == null) { return false }
	return s[0].rank != s[1].rank && s[0].rank != s[2].rank && s[1].rank != s[2].rank
})

// 投屏链接：mock 简化成"https://screen.silentstack.app/{gameId}"；
// 真实场景可换成小程序码 / TV 端鉴权 token
const screenLink = computed<string>((): string => 'https://screen.silentstack.app/' + gameId.value)

const onCopyScreen = () : void => {
	uni.setClipboardData({
		data: screenLink.value,
		success: () : void => { uni.showToast({ title: '投屏链接已复制', icon: 'success' }) },
		fail: () : void => { uni.showToast({ title: '复制失败', icon: 'none' }) }
	})
}

const onPauseToggle = () : void => {
	paused.value = !paused.value
	uni.showToast({ title: paused.value ? '已暂停比赛' : '已继续比赛', icon: 'none' })
}

// 重新开始：清掉本机状态（暂停/级别），并重新拉取接口数据
const onRestart = () : void => {
	uni.showModal({
		title: '重新开始',
		content: '确认重置本对局状态？暂停 / 级别调整将清空',
		confirmText: '重新开始',
		cancelText: '取消',
		success: (res : any) : void => {
			if (!res.confirm) { return }
			paused.value = false
			levelBoost.value = 0
			loadDetail()
			uni.showToast({ title: '已重新开始', icon: 'success' })
		}
	})
}

const onPrevLevel = () : void => {
	if (detail.value.game.level == '现金桌') { return }
	if (levelBoost.value <= 0) {
		uni.showToast({ title: '已是最低级别', icon: 'none' })
		return
	}
	levelBoost.value = levelBoost.value - 1
	uni.showToast({ title: '已切换到上一级别', icon: 'none' })
}

const onNextLevel = () : void => {
	if (detail.value.game.level == '现金桌') { return }
	levelBoost.value = levelBoost.value + 1
	uni.showToast({ title: '已切换到下一级别', icon: 'none' })
}

/* ---------- 玩家级管理操作：出局 / 出桌 / 摸鱼分 ---------- */
// 文字头像：名字首字，与 admin-* 系列 picker 头像同款
const avatarTextOf = (p : PlayerInfo) : string => p.name.length == 0 ? '?' : p.name.substring(0, 1)

// 桌号 / 座位摘要：未入座（已报名）显示待入座；淘汰显示已离桌；出桌保留座位但带"暂离"
const seatTextOf = (p : PlayerInfo) : string => {
	if (p.userStatus == 'E' || p.userStatus == 'C') { return '待入座' }
	if (!p.alive) { return '已离桌' }
	if (p.offTable) { return p.tableNo + ' 桌 ' + p.seatNo + ' 号 · 暂离' }
	return p.tableNo + ' 桌 ' + p.seatNo + ' 号'
}

// 右侧状态胶囊文案：已报名 > 淘汰 > 出桌 > 我 > 存活（取优先级最高的一档）
const statusTextOf = (p : PlayerInfo) : string => {
	if (p.userStatus == 'E' || p.userStatus == 'C') { return '已报名' }
	if (!p.alive) { return '已淘汰' }
	if (p.offTable) { return '已出桌' }
	if (p.isMe) { return '我' }
	return '存活'
}

// 状态胶囊样式类（同名 + '-text' 组合文字色）
const statusClsOf = (p : PlayerInfo) : string => {
	if (p.userStatus == 'E' || p.userStatus == 'C') { return 'pr-status-enroll' }
	if (!p.alive) { return 'pr-status-out' }
	if (p.offTable) { return 'pr-status-off' }
	if (p.isMe) { return 'pr-status-me' }
	return 'pr-status-live'
}

// 筹码降序重排 + 重排名次（与 game-detail.ts 的 sortByChipsDesc 同款选择排序）
const resortPlayers = () : void => {
	const list : PlayerInfo[] = playersView.value.slice()
	for (let i : number = 0; i < list.length; i++) {
		let maxIdx : number = i
		for (let j : number = i + 1; j < list.length; j++) {
			if (list[j].chips > list[maxIdx].chips) { maxIdx = j }
		}
		if (maxIdx != i) {
			const tmp : PlayerInfo = list[i]
			list[i] = list[maxIdx]
			list[maxIdx] = tmp
		}
	}
	for (let i : number = 0; i < list.length; i++) { list[i].rank = i + 1 }
	playersView.value = list
}

// 出局：确认后筹码清零 + 释放座位，自然沉到列表底部；存活数随之 -1
const onBust = (p : PlayerInfo) : void => {
	uni.showModal({
		title: '确认出局',
		content: '将「' + p.name + '」标记为出局？筹码清零并释放桌位',
		confirmText: '出局',
		cancelText: '取消',
		success: (res : any) : void => {
			if (!res.confirm) { return }
			const list : PlayerInfo[] = playersView.value
			for (let i : number = 0; i < list.length; i++) {
				if (list[i].rank == p.rank) {
					list[i].alive = false
					list[i].chips = 0
					list[i].tableNo = 0
					list[i].seatNo = 0
					list[i].offTable = false
					break
				}
			}
			resortPlayers()
			uni.showToast({ title: '已标记出局', icon: 'none' })
		}
	})
}

// 出桌 / 回桌：只切 offTable 标记，座位保留（现场暂离：接电话 / 买水 / 上洗手间）
const onOffTable = (p : PlayerInfo) : void => {
	const list : PlayerInfo[] = playersView.value
	for (let i : number = 0; i < list.length; i++) {
		if (list[i].rank == p.rank) {
			list[i].offTable = !list[i].offTable
			uni.showToast({ title: list[i].offTable ? '已出桌' : '已回桌', icon: 'none' })
			break
		}
	}
}

// 摸鱼分弹层：target 是待调整的玩家，temp 是弹层内暂存的分值（确认才写回）
const fishDlg : Ref<{ visible : boolean, target : PlayerInfo | null, temp : number }> = ref({ visible: false, target: null, temp: 0 })

const onOpenFish = (p : PlayerInfo) : void => {
	fishDlg.value = { visible: true, target: p, temp: p.fishScore }
}

const onTapFishMask = () : void => { fishDlg.value.visible = false }

// 快捷加减：-10/-5/-1/+1/+5/+10，钳制到 [0, 999]
const onFishAdjust = (delta : number) : void => {
	const t : { visible : boolean, target : PlayerInfo | null, temp : number } = fishDlg.value
	let v : number = t.temp + delta
	if (v < 0) { v = 0 }
	if (v > 999) { v = 999 }
	t.temp = v
}

const onFishConfirm = () : void => {
	const t : { visible : boolean, target : PlayerInfo | null, temp : number } = fishDlg.value
	if (t.target != null) {
		const list : PlayerInfo[] = playersView.value
		for (let i : number = 0; i < list.length; i++) {
			if (list[i].rank == t.target.rank) {
				list[i].fishScore = t.temp
				break
			}
		}
	}
	t.visible = false
	uni.showToast({ title: '摸鱼分已更新', icon: 'none' })
}

/* ---------- 结束比赛：弹层 + 前三名 ---------- */
// 进入弹层：按当前存活玩家预填前三，让管理员只需调整顺序即可
const onOpenEnd = () : void => {
	const alive : PlayerInfo[] = alivePlayersForPick.value
	top3Slots.value = [alive[0] || null, alive[1] || null, alive[2] || null]
	focusedSlot.value = 0
	endModalVisible.value = true
}

const closeEndModal = () : void => { endModalVisible.value = false }
const onTapEndMask = () : void => { closeEndModal() }

// 点击槽位：把焦点切过去，等下面"候选玩家"行点击时填入该槽
const onTapSlot = (idx : number) : void => { focusedSlot.value = idx }

// 是否已被选入前三（用于候选行打"已选"标记 + 阻止重复选同一人）
const isPickedTop3 = (p : PlayerInfo) : boolean => {
	const s : (PlayerInfo | null)[] = top3Slots.value
	for (let i : number = 0; i < s.length; i++) {
		const v : PlayerInfo | null = s[i]
		if (v != null && v.rank == p.rank) { return true }
	}
	return false
}

// 槽位玩家：模板里 top3Slots[idx] 二次索引无法做 null 收窄（TS 报 possibly null），统一走函数
const slotPlayerOf = (idx : number) : PlayerInfo | null => top3Slots.value[idx]

// 槽位玩家名：空槽位返回占位文案
const slotNameOf = (idx : number) : string => {
	const p : PlayerInfo | null = top3Slots.value[idx]
	if (p == null) { return '点击候选区选择玩家' }
	return p.name
}

// 槽位筹码摘要：空槽位返回空串（外层 v-if 已控制显示）
const slotChipsOf = (idx : number) : string => {
	const p : PlayerInfo | null = top3Slots.value[idx]
	if (p == null) { return '' }
	return formatChips(p.chips)
}

// 候选行是否为当前焦点槽位上的玩家（用于行高亮）
const isFocusedTop3 = (p : PlayerInfo) : boolean => {
	const cur : PlayerInfo | null = top3Slots.value[focusedSlot.value]
	return isPickedTop3(p) && cur != null && cur.rank == p.rank
}

// 候选玩家点击：已选 → 反选（从对应槽位移出 + 聚焦该槽）；未选 → 填入 focusedSlot（自动跳到下一个空槽）
// 反选路径用 rank 比对，避免 PlayerInfo 对象引用不稳定的潜在问题
const onPickTop3 = (p : PlayerInfo) : void => {
	const s : (PlayerInfo | null)[] = top3Slots.value.slice()
	if (isPickedTop3(p)) {
		for (let i : number = 0; i < s.length; i++) {
			const v : PlayerInfo | null = s[i]
			if (v != null && v.rank == p.rank) {
				s[i] = null
				focusedSlot.value = i
				break
			}
		}
	} else {
		s[focusedSlot.value] = p
		for (let i : number = 0; i < s.length; i++) {
			if (s[i] == null) { focusedSlot.value = i; break }
		}
	}
	top3Slots.value = s
}

// 上下箭头：交换两个相邻槽位（a 与 b）。b 越界直接 return，模板里同时按可用性切灰态
const onSwapTop3 = (a : number, b : number) : void => {
	if (b < 0 || b > 2) { return }
	const s : (PlayerInfo | null)[] = top3Slots.value.slice()
	const tmp : PlayerInfo | null = s[a]
	s[a] = s[b]
	s[b] = tmp
	top3Slots.value = s
}

// 确认结束：取三名玩家名字弹 toast。状态未真改（mock 限制），但接口预留，后续接服务端即可
const onConfirmEnd = () : void => {
	if (!endConfirmable.value) {
		uni.showToast({ title: '请选满前三名且不重复', icon: 'none' })
		return
	}
	const s : (PlayerInfo | null)[] = top3Slots.value
	endModalVisible.value = false
	uni.showToast({
		title: '已结束 · 冠军 ' + (s[0] == null ? '?' : s[0].name),
		icon: 'none',
		duration: 2500
	})
}

onLoad((options : any) : void => {
	// 不用 OnLoadOptions.getString()：本项目 ambient 类型里没有它，TS 解析为 String，编译报 not-callable
	// onLoad 实际入参就是普通 { id: string } 对象，直接键访问
	const raw : string | undefined = options != null ? options.id : undefined
	gameId.value = raw == null ? '' : raw
	// 登录信息里取当前用户 id（"我"标记 / 创建者判定）；首次加载由随后的 onShow 触发
	const login = getLoginResult()
	myUserId.value = login != null ? login.id : ''
})
</script>

<style scoped>
	/* 上下结构：滚动区（flex） + 底部「加入比赛」常驻栏 */
	.page {
		background-image: linear-gradient(180deg, #0E1110 0%, #0A0C0B 40%, #0B0D0C 100%);
		height: 100vh;
		box-sizing: border-box;
		flex-direction: column;
	}
	.scroll { flex: 1; }
	/* #ifdef H5 */
	/* H5 端 100vh 是浏览器视口高度，其中还包含导航栏，直接用它会让底部内容被裁 */
	.page {
		height: calc(100vh - var(--window-top) - var(--window-bottom));
	}
	/* #endif */

	.wrap { padding: 24rpx 0 40rpx; }

	/* ============ 赛事概览 ============ */
	.hero {
		background-color: #171A19;
		border-radius: 28rpx;
		padding: 28rpx;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.35);
	}
	.hero-top { flex-direction: row; align-items: center; justify-content: space-between; }
	.hero-store { flex-direction: row; align-items: center; }
	.store-dot { width: 12rpx; height: 12rpx; border-radius: 50%; background-color: #E8C275; margin-right: 10rpx; }
	.store-name { font-size: 26rpx; color: #A0A5A3; }
	.status-badge { padding: 8rpx 20rpx; border-radius: 999rpx; }
	.status-text { font-size: 24rpx; font-weight: 600; }

	.hero-title { font-size: 40rpx; color: #EDEFEE; font-weight: 700; margin-top: 18rpx; }

	.hero-tags { flex-direction: row; align-items: center; flex-wrap: wrap; margin-top: 18rpx; }
	.tag {
		padding: 6rpx 18rpx;
		border-radius: 999rpx;
		background-color: #1D201F;
		margin-right: 12rpx;
	}
	.tag-text { font-size: 22rpx; color: #A0A5A3; }

	.hero-progress { margin-top: 26rpx; }
	.hp-head { flex-direction: row; align-items: center; justify-content: space-between; }
	.hp-label { font-size: 24rpx; color: #8F9492; }
	/* 存活/参赛的右侧数字：活跃参与 = 绿色，与下方奖池（黄）形成对比 */
	.hp-value { font-size: 28rpx; color: #2AA97A; font-weight: 700; }
	.hp-track {
		height: 10rpx;
		background-color: #2A2F2D;
		border-radius: 999rpx;
		margin-top: 14rpx;
		overflow: hidden;
	}
	.hp-fill {
		height: 10rpx;
		background-image: linear-gradient(90deg, #F5D98E, #C89B3C);
		border-radius: 999rpx;
	}
	.hp-sub { font-size: 22rpx; color: #7E8281; margin-top: 12rpx; }

	/* ============ 分组 ============ */
	.section { margin-top: 32rpx; }
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
	/* 「参赛人 X」类计数 = 绿色，区别于灰色辅助文字 */
	.section-count { font-size: 24rpx; color: #2AA97A; font-weight: 600; }

	/* ============ 我的状态 ============ */
	.me-card {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		background-color: #171A19;
		border: 1rpx solid #2A2F2D;
		border-radius: 24rpx;
		padding: 26rpx 28rpx;
	}
	.me-left { flex-direction: column; flex: 1; }
	.me-state { font-size: 32rpx; font-weight: 700; }
	.me-sub { font-size: 22rpx; color: #8F9492; margin-top: 10rpx; }
	.me-right { flex-direction: column; align-items: flex-end; margin-left: 20rpx; }
	.me-chips { font-size: 34rpx; color: #E8C275; font-weight: 700; }
	.me-chips-label { font-size: 20rpx; color: #7E8281; margin-top: 6rpx; }

	/* ============ 赛事数据 ============ */
	/* 结构：主带（级别+盲注 / 存活进度条） → 细分割线 → 四列指标带 */
	.stat-card {
		flex-direction: column;
		background-color: #171A19;
		border: 1rpx solid #2A2F2D;
		border-radius: 24rpx;
		padding: 26rpx 30rpx 22rpx;
	}
	.stat-hero { flex-direction: row; align-items: center; }
	/* 左：当前级别大字（金色主视觉） */
	.stat-hero-left { flex: 1; flex-direction: column; align-items: flex-start; }
	.stat-hero-label { font-size: 20rpx; color: #8F9492; }
	.stat-hero-level { font-size: 44rpx; color: #E8C275; font-weight: 800; margin-top: 6rpx; }
	.stat-hero-blinds { font-size: 21rpx; color: #8F9492; margin-top: 10rpx; }
	/* 右：存活人数 + 绿色存活率进度条 */
	.stat-hero-right { flex-direction: column; align-items: flex-end; margin-left: 24rpx; }
	.stat-alive-row { flex-direction: row; align-items: baseline; }
	.stat-alive-label { font-size: 20rpx; color: #8F9492; margin-right: 8rpx; }
	.stat-alive-num { font-size: 34rpx; color: #2AA97A; font-weight: 800; }
	.stat-alive-total { font-size: 20rpx; color: #7E8281; margin-left: 6rpx; }
	.stat-alive-track {
		width: 190rpx;
		height: 12rpx;
		border-radius: 999rpx;
		background-color: #2A2F2D;
		overflow: hidden;
		margin-top: 14rpx;
	}
	.stat-alive-fill {
		height: 12rpx;
		border-radius: 999rpx;
		background-image: linear-gradient(90deg, #2AA97A, #4FC08D);
	}
	.stat-alive-pct { font-size: 18rpx; color: #7E8281; margin-top: 10rpx; }
	.stat-divider { height: 1rpx; background-color: #2A2F2D; margin: 24rpx 0 20rpx; }
	/* 底部四列指标：竖线分隔，第一列无线 */
	.stat-strip { flex-direction: row; }
	.stat-cell { flex: 1; flex-direction: column; align-items: center; border-left: 1rpx solid #2A2F2D; }
	.stat-cell:first-child { border-left-width: 0; }
	.stat-label { font-size: 20rpx; color: #8F9492; }
	.stat-value { font-size: 26rpx; font-weight: 700; margin-top: 8rpx; }

	/* ============ 参赛玩家 ============ */
	/* 每个玩家独立成卡：背景 + 边框 + 圆角 + 间距，行与行界限一眼可辨，避免误操作 */
	.player-list { flex-direction: column; gap: 16rpx; background-color: #1A1E1D; border-radius: 28rpx; padding: 24rpx; box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35); }
	/* 行纵向两段：pr-top（主信息） + pr-admin（管理员行内操作） */
	.player-row {
		flex-direction: column;
		padding: 22rpx 20rpx;
		background-color: #1D201F;
		border: 1rpx solid #2A2F2D;
		border-radius: 20rpx;
	}
	.player-row-me {
		background-image: linear-gradient(135deg, rgba(232,194,117,0.16), rgba(232,194,117,0.04));
		border-color: rgba(232,194,117,0.35);
	}
	.player-row-out { opacity: 0.72; }
	.pr-top { flex-direction: row; align-items: center; }
	.player-rank { width: 48rpx; font-size: 24rpx; color: #7E8281; font-weight: 700; }
	.player-rank-top { color: #D9A441; }
	/* 文字头像：名字首字圆形底，出局玩家整体变灰 */
	.pr-avatar {
		width: 68rpx;
		height: 68rpx;
		border-radius: 50%;
		background-color: #2A2F2D;
		border: 1rpx solid #3A403E;
		align-items: center;
		justify-content: center;
		margin-right: 16rpx;
	}
	.pr-avatar-text { font-size: 28rpx; color: #E8C275; font-weight: 700; }
	.pr-avatar-img { width: 66rpx; height: 66rpx; border-radius: 50%; background-color: #202423; }
	.pr-avatar-out { background-color: #202423; border-color: #2A2F2D; }
	.pr-avatar-out .pr-avatar-text { color: #6E7573; }
	/* 主信息列：名称行 + 摘要行 */
	.player-main { flex: 1; flex-direction: column; align-items: flex-start; }
	.pr-name-line { flex-direction: row; align-items: center; }
	.player-name { font-size: 27rpx; color: #EDEFEE; font-weight: 700; }
	.player-name-out { color: #7E8281; }
	/* 摘要行：买入 / 摸鱼分 / 桌号座位 / 筹码（筹码降级到小字，不再是主角） */
	.pr-meta { flex-direction: row; align-items: center; flex-wrap: wrap; margin-top: 8rpx; }
	.pr-meta-item { font-size: 20rpx; color: #8F9492; }
	.pr-meta-fish { color: #C9A06A; }
	.pr-meta-chips { color: #A7ACA9; font-weight: 600; }
	.pr-meta-dot { font-size: 20rpx; color: #4A4F4D; margin: 0 8rpx; }

	/* 右侧状态胶囊：存活绿 / 我金 / 已出桌蓝 / 已淘汰灰，颜色即状态 */
	.pr-status {
		padding: 6rpx 18rpx;
		border-radius: 999rpx;
		margin-left: 12rpx;
		align-items: center;
		justify-content: center;
	}
	.pr-status-text { font-size: 21rpx; font-weight: 700; }
	.pr-status-live { background-color: rgba(42,169,122,0.14); border: 1rpx solid rgba(42,169,122,0.45); }
	.pr-status-live-text { color: #2AA97A; }
	.pr-status-enroll { background-color: rgba(178,150,242,0.12); border: 1rpx solid rgba(178,150,242,0.40); }
	.pr-status-enroll-text { color: #B296F2; }
	.pr-status-me { background-color: rgba(232,194,117,0.16); border: 1rpx solid rgba(232,194,117,0.50); }
	.pr-status-me-text { color: #E8C275; }
	.pr-status-off { background-color: rgba(122,182,242,0.12); border: 1rpx solid rgba(122,182,242,0.40); }
	.pr-status-off-text { color: #7AB6F2; }
	.pr-status-out { background-color: #202423; border: 1rpx solid #2A2F2D; }
	.pr-status-out-text { color: #7E8281; }

	/* 管理员行内操作：三个小 chip 按钮，破坏性（出局）红、出桌蓝、摸鱼金 */
	.pr-admin {
		flex-direction: row;
		align-items: center;
		margin-top: 16rpx;
		padding-top: 16rpx;
		border-top: 1rpx dashed #2A2F2D;
	}
	.pr-admin-btn {
		height: 60rpx;
		padding: 0 28rpx;
		border-radius: 999rpx;
		align-items: center;
		justify-content: center;
		margin-right: 16rpx;
		background-color: #202423;
		border: 1rpx solid #2A2F2D;
	}
	.pr-admin-btn-text { font-size: 22rpx; font-weight: 600; }
	.pr-admin-bust { background-color: rgba(220,90,90,0.14); border-color: rgba(220,90,90,0.45); }
	.pr-admin-bust-text { color: #FF8A8A; }
	.pr-admin-off { background-color: rgba(122,182,242,0.12); border-color: rgba(122,182,242,0.40); }
	.pr-admin-off-text { color: #7AB6F2; }
	.pr-admin-fish { background-color: rgba(217,164,65,0.12); border-color: rgba(217,164,65,0.40); }
	.pr-admin-fish-text { color: #D9A441; }

	.list-foot { padding: 24rpx 0 8rpx; align-items: center; }
	/* 底部「共 X 人参赛」：绿色，活跃参与指标统一 */
	.list-foot-text { font-size: 22rpx; color: #2AA97A; font-weight: 500; }

	/* ============ 管理员操作 ============ */
	/* 区分标识：用金色边条与普通"白边"形成对比（与 admin-tournament 的高级感一致） */
	.admin-section-bar {
		background-image: linear-gradient(180deg, #F5D98E, #C89B3C);
	}
	.paused-pill {
		padding: 6rpx 18rpx;
		border-radius: 999rpx;
		background-color: rgba(217,164,65,0.18);
		border: 1rpx solid rgba(217,164,65,0.40);
	}
	.paused-pill-text { font-size: 22rpx; color: #D9A441; font-weight: 700; }

	/* 通用按钮基类：圆角 + 居中文本；高度统一便于排版 */
	.admin-btn {
		height: 84rpx;
		border-radius: 14rpx;
		align-items: center;
		justify-content: center;
		flex-direction: row;
		box-sizing: border-box;
	}
	.admin-btn-text {
		font-size: 28rpx;
		font-weight: 700;
	}
	/* 上一/下一级别：金色高亮，最常用的现场操作 */
	.admin-btn-gold {
		flex: 1;
		background-image: linear-gradient(135deg, #E8D08E, #C89B3C);
	}
	.admin-btn-gold .admin-btn-text { color: #14100A; }

	/* 4 个比赛操作按钮：深底白字 */
	.admin-btn-line {
		flex: 1;
		background-color: #1D201F;
		border: 1rpx solid #2A2F2D;
	}
	.admin-btn-line .admin-btn-text { color: #EDEFEE; }

	/* 破坏性操作（结束比赛）：红色描边突出 */
	.admin-btn-danger {
		flex: 1;
		background-color: rgba(220,90,90,0.18);
		border: 1rpx solid rgba(220,90,90,0.50);
	}
	.admin-btn-text-danger { color: #FF8A8A; }

	/* 上一/下一级别 容器：左右等分 + 16rpx 间距 */
	.admin-row {
		flex-direction: row;
		gap: 16rpx;
	}
	/* 比赛操作网格：2 列 + 行间距 */
	.admin-grid {
		flex-direction: row;
		flex-wrap: wrap;
		gap: 16rpx;
		margin-top: 16rpx;
	}
	.admin-grid .admin-btn { min-width: calc(50% - 8rpx); }

	/* ============ 居中弹层基础（dlg-*） ============ */
	/* 与 admin-tournament 同款结构；此前结束比赛弹层只借了类名没落样式，这里补齐 */
	.dlg-overlay {
		position: fixed;
		left: 0; right: 0; top: 0; bottom: 0;
		background-color: rgba(0, 0, 0, 0.65);
		align-items: center;
		justify-content: center;
		z-index: 999;
		padding: 24rpx;
	}
	.dlg-card {
		width: 624rpx;
		height: 1100rpx;
		max-height: 84vh;
		background-color: #171A19;
		border-radius: 24rpx;
		border: 1rpx solid #2A2F2D;
		flex-direction: column;
		overflow: hidden;
	}
	.dlg-head {
		flex-direction: column;
		padding: 28rpx 30rpx 16rpx;
		border-bottom: 1rpx solid #2A2F2D;
	}
	.dlg-title { font-size: 32rpx; color: #EDEFEE; font-weight: 700; }
	.dlg-sub { font-size: 21rpx; color: #8F9492; margin-top: 6rpx; }
	/* 弹层主体：flex:1 吃掉 head/foot 之外的剩余高度，scroll-view 拿到确定约束才能内部滚动 */
	.dlg-body {
		flex: 1;
		flex-direction: column;
		min-height: 0;
	}

	/* ============ 结束比赛弹层 ============ */
	/* 弹层整体：定高卡片（flex:1 的 scroll-view 才有边界），小屏用 84vh 封顶 */
	.end-card {
		height: 1000rpx;
		min-height: 620rpx;
		max-height: 84vh;
	}
	.end-body {
		padding: 22rpx 30rpx 0;
	}
	.end-body .top3-list + .candidate-title { margin-top: 26rpx; }
	.end-foot {
		flex-direction: row;
		padding: 20rpx 30rpx 28rpx;
		border-top: 1rpx solid #2A2F2D;
		gap: 16rpx;
		background-color: #171A19;
	}
	/* spacer 用来把按钮挤到右侧；如果想要左对齐，删掉这条规则即可 */
	.end-foot-spacer { flex: 1; }
	.end-btn {
		flex: 1;
		height: 84rpx;
		border-radius: 14rpx;
		align-items: center;
		justify-content: center;
	}
	.end-btn-text { font-size: 28rpx; font-weight: 700; }
	.end-btn-cancel {
		background-color: #1D201F;
		border: 1rpx solid #2A2F2D;
	}
	.end-btn-cancel .end-btn-text { color: #A0A5A3; }
	.end-btn-ok {
		background-image: linear-gradient(135deg, #E8D08E, #C89B3C);
	}
	.end-btn-ok .end-btn-text { color: #14100A; }
	.end-btn-disabled { opacity: 0.45; }

	/* 前三槽位列表 */
	.top3-list {
		flex-direction: column;
		gap: 14rpx;
	}
	.top3-slot {
		flex-direction: row;
		align-items: center;
		padding: 18rpx 18rpx 18rpx 16rpx;
		background-color: #1D201F;
		border: 1rpx solid #2A2F2D;
		border-radius: 16rpx;
	}
	/* 当前聚焦槽位：金色描边 + 微弱金色底色，明确告诉用户"下一个点候选会进这里" */
	.top3-slot-active {
		border-color: rgba(217,164,65,0.65);
		background-color: rgba(217,164,65,0.08);
	}
	.top3-slot-filled .top3-name { color: #EDEFEE; font-weight: 700; }

	/* 奖牌：三个等级对应金/银/铜渐变 */
	.top3-medal {
		width: 72rpx;
		height: 72rpx;
		border-radius: 50%;
		align-items: center;
		justify-content: center;
		margin-right: 18rpx;
	}
	.top3-medal-text { font-size: 30rpx; font-weight: 800; color: #14100A; }
	.top3-medal-1 { background-image: linear-gradient(135deg, #F5D98E, #C89B3C); }
	.top3-medal-2 {
		background-color: #1D201F;
		border: 2rpx solid #A0A5A3;
	}
	.top3-medal-2 .top3-medal-text { color: #C9CDCB; }
	.top3-medal-3 {
		background-color: #1D201F;
		border: 2rpx solid #B87333;
	}
	.top3-medal-3 .top3-medal-text { color: #D49A6A; }

	.top3-info { flex: 1; flex-direction: column; }
	.top3-rank { font-size: 20rpx; color: #8F9492; font-weight: 600; }
	.top3-name { font-size: 28rpx; color: #A0A5A3; margin-top: 4rpx; }
	.top3-name-ph { color: #7E8281; font-weight: 400; }
	.top3-chips { font-size: 20rpx; color: #8F9492; margin-top: 4rpx; }

	/* ↑↓ 调序箭头 */
	.top3-actions { flex-direction: column; gap: 6rpx; margin-left: 12rpx; }
	.top3-arrow {
		width: 52rpx;
		height: 52rpx;
		border-radius: 12rpx;
		background-color: #2A2F2D;
		align-items: center;
		justify-content: center;
	}
	.top3-arrow-text { font-size: 28rpx; color: #EDEFEE; font-weight: 700; }
	.top3-arrow-disabled { opacity: 0.30; }

	/* 候选玩家列表 */
	.candidate-title {
		font-size: 22rpx;
		color: #8F9492;
		font-weight: 600;
		margin-bottom: 12rpx;
	}
	.candidate-list {
		flex-direction: column;
		gap: 10rpx;
		padding-bottom: 12rpx;
	}
	.candidate-row {
		flex-direction: row;
		align-items: center;
		padding: 16rpx 18rpx;
		background-color: #1D201F;
		border: 1rpx solid #2A2F2D;
		border-radius: 16rpx;
	}
	.candidate-row-picked { border-color: rgba(217,164,65,0.45); }
	/* 选中槽位的玩家：金色描边强调"是这里" */
	.candidate-row-focus {
		border-color: rgba(217,164,65,0.85);
		background-color: rgba(217,164,65,0.10);
	}
	.candidate-rank { width: 56rpx; font-size: 24rpx; color: #7E8281; font-weight: 700; }
	.candidate-name { flex: 1; font-size: 26rpx; color: #EDEFEE; }
	.candidate-chips { font-size: 24rpx; color: #A0A5A3; font-weight: 600; margin-right: 12rpx; }
	.candidate-flag {
		padding: 4rpx 12rpx;
		border-radius: 999rpx;
		background-color: rgba(217,164,65,0.20);
		border: 1rpx solid rgba(217,164,65,0.40);
	}
	.candidate-flag-text { font-size: 20rpx; color: #D9A441; font-weight: 700; }

	/* ============ 摸鱼分弹层 ============ */
	/* 比结束比赛弹层矮：不滚动，居中大数字 + 快捷加减 */
	.fish-card {
		height: auto;
		min-height: 520rpx;
		max-height: 70vh;
	}
	.fish-body {
		flex-direction: column;
		align-items: center;
		padding: 44rpx 30rpx 36rpx;
	}
	.fish-value { font-size: 96rpx; color: #D9A441; font-weight: 800; }
	.fish-value-label { font-size: 22rpx; color: #8F9492; margin-top: 4rpx; }
	/* 快捷加减：2 行 3 列，减号灰底、加号金底 */
	.fish-adjust {
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: center;
		margin-top: 40rpx;
		gap: 16rpx;
	}
	.fish-adj-btn {
		width: 156rpx;
		height: 76rpx;
		border-radius: 14rpx;
		align-items: center;
		justify-content: center;
		background-color: #202423;
		border: 1rpx solid #2A2F2D;
	}
	.fish-adj-text { font-size: 26rpx; color: #A0A5A3; font-weight: 700; }
	.fish-adj-plus { background-color: rgba(217,164,65,0.14); border-color: rgba(217,164,65,0.45); }
	.fish-adj-plus-text { color: #D9A441; }

	/* ============ 底部报名入口 ============ */
	.join-bar {
		flex-direction: row;
		align-items: center;
		padding: 20rpx 24rpx 40rpx;
		background-color: #0B0D0C;
		border-top: 1rpx solid #1F2322;
	}
	.join-info { flex: 1; flex-direction: column; }
	.join-fee { font-size: 28rpx; color: #EDEFEE; font-weight: 700; }
	.join-sub { font-size: 20rpx; color: #8F9492; margin-top: 6rpx; }
	.join-btn {
		height: 84rpx;
		padding: 0 44rpx;
		border-radius: 14rpx;
		align-items: center;
		justify-content: center;
		background-image: linear-gradient(135deg, #E8D08E, #C89B3C);
	}
	.join-btn-text { font-size: 28rpx; color: #14100A; font-weight: 700; }

	.empty { padding-top: 160rpx; align-items: center; }
	.loading-text { font-size: 26rpx; color: #8F9492; }
</style>
