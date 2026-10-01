<template>
	<view class="page">
	<scroll-view class="scroll" direction="vertical" :show-scrollbar="false">
		<view v-if="detailVo != null" class="wrap">

			<!-- ============ 赛事概览 ============ -->
			<view class="hero">
				<view class="hero-top">
					<view class="hero-store">
						<view class="store-dot"></view>
						<text class="store-name">{{ heroStoreName }}</text>
					</view>
					<view class="status-badge" :style="statusBgStyle">
						<text class="status-text" :style="statusColorStyle">{{ heroStatusText }}</text>
					</view>
				</view>

				<text class="hero-title">{{ heroName }}</text>

				<view class="hero-tags">
					<view class="tag">
						<text class="tag-text">{{ heroTypeName }}</text>
					</view>
					<view class="tag">
						<text class="tag-text">{{ heroStartTime }}</text>
					</view>
					<view class="tag">
						<text class="tag-text">{{ buyInText }}</text>
					</view>
				</view>

				<view class="hero-progress">
					<view class="hp-head">
						<text class="hp-label">存活 / 参赛</text>
						<text class="hp-value">{{ aliveCount }} / {{ dTotalCount }}</text>
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
						<text class="me-state" :style="meStateStyle">{{ meStateText }}</text>
						<text class="me-sub">{{ meSubText }}</text>
					</view>
					<!-- 已出局(K)且蘑菇/支付条件满足：显示复活入口 -->
					<view v-if="reliveReady" class="relive-btn" @tap="onOpenRelive">
						<text class="relive-btn-text">🍄 复活</text>
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
								<text class="stat-alive-total">/ {{ dTotalCount }} 人</text>
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
					<text class="section-count">{{ dTotalCount }} 人</text>
				</view>

				<view class="player-list">
					<view
						v-for="(p, idx) in usersVo"
						:key="p.userId"
						class="player-row"
						:class="{ 'player-row-me': String(p.userId) == myUserId, 'player-row-out': !aliveOf(p) }"
					>
						<!-- 行首：排名 + 文字头像 + 名称 + 状态胶囊（筹码降级到摘要行） -->
						<view class="pr-top">
							<text class="player-rank" :class="{ 'player-rank-top': aliveOf(p) && idx < 3 }">{{ idx + 1 }}</text>
							<view class="pr-avatar" :class="{ 'pr-avatar-out': !aliveOf(p) }">
								<image v-if="p.avatar != ''" class="pr-avatar-img" :src="avatarUrlOf(p)" mode="aspectFill"></image>
								<text v-else class="pr-avatar-text">{{ avatarTextOf(p) }}</text>
							</view>
							<view class="player-main">
									<view class="pr-name-line">
										<text class="player-name" :class="{ 'player-name-out': !aliveOf(p) }">{{ p.username }}</text>
										<text class="pr-userno">{{ p.userNo }}</text>
									</view>
									<!-- 摘要行：桌号座位 · 筹码 -->
									<view class="pr-meta">
										<text class="pr-meta-item pr-meta-chips">{{ p.currentChips > 0 ? formatChips(p.currentChips) : '—' }}</text>
										<text class="pr-meta-dot">·</text>
										<text class="pr-meta-item">买入:{{ p.userReliveCount + p.mushReliveCount }}</text>
										<text class="pr-meta-dot">·</text>
										<text class="pr-meta-item">摸鱼:{{ p.happyScore }}</text>
									</view>
							</view>
							<!-- 状态胶囊：淘汰(D) > 出局(K,可复活) > 我 > 存活，一眼区分 -->
							<view class="pr-status" :class="statusClsOf(p)">
								<text class="pr-status-text" :class="statusClsOf(p) + '-text'">{{ statusTextOf(p) }}</text>
							</view>
						</view>

						<!-- 管理员行内操作：出局(K)只是待复活不算淘汰；出桌(D)=真淘汰，误操作可回桌 -->
						<view v-if="isAdmin && detailVo != null && detailVo.status !== 'F'" class="pr-admin">
							<view class="pr-admin-btn pr-admin-bust" @tap="onBust(p)" v-if="aliveOf(p)">
								<text class="pr-admin-btn-text pr-admin-bust-text">出局</text>
							</view>
							<view class="pr-admin-btn pr-admin-off" @tap="onOffTable(p)" v-if="p.status == 'K'">
								<text class="pr-admin-btn-text pr-admin-off-text">出桌</text>
							</view>
							<view class="pr-admin-btn pr-admin-off" @tap="onOffTable(p)" v-else-if="p.status == 'D'">
								<text class="pr-admin-btn-text pr-admin-off-text">回桌</text>
							</view>
							<view class="pr-admin-btn pr-admin-fish" @tap="onOpenFish(p)">
								<text class="pr-admin-btn-text pr-admin-fish-text">摸鱼分</text>
							</view>
						</view>
					</view>
				</view>

				<view class="list-foot">
					<text class="list-foot-text">共 {{ dTotalCount }} 人参赛 · 存活 {{ aliveCount }} 人 · 已出局 {{ outCount }} 人 · 已淘汰 {{ bustedCount }} 人</text>
				</view>
			</view>

		</view>

		<view v-if="loading" class="empty">
			<text class="loading-text">加载中…</text>
		</view>

		<view v-else-if="detailVo == null" class="empty">
			<EmptyState title="对局不存在" desc="该对局可能已结束或被移除，请返回广场重新选择" />
		</view>
	</scroll-view>

	<!-- ============ 管理员操作 ============ -->
	<!-- 仅管理员可见：详情页底部新章节。复制投屏链接 / 暂停 / 重新开始 / 结束比赛 / 上一级别 / 下一级别 -->
	<view v-if="isAdmin && detailVo != null && detailVo.status !== 'F'" class="wrap">
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
						v-for="(p, idx) in top3Slots"
						:key="idx"
						class="top3-slot"
						:class="{
							'top3-slot-active': focusedSlot === idx,
							'top3-slot-filled': top3Slots[idx] != null
						}"
						@tap="onTapSlot(idx)"
					>
						<view class="top3-medal" :class="'top3-medal-' + (idx + 1)">
							<image v-if="p != null && p.avatar != ''" class="top3-medal-avatar" :src="avatarUrlOf(p)" mode="aspectFill"></image>
							<text v-else-if="p != null" class="top3-medal-text">{{ avatarTextOf(p) }}</text>
							<text v-else class="top3-medal-text">{{ idx + 1 }}</text>
						</view>
						<view class="top3-info">
							<text class="top3-rank">第 {{ idx + 1 }} 名</text>
							<text class="top3-name" :class="{'top3-name-ph': slotPlayerOf(idx) == null}">
								{{ slotNameOf(idx) }}
							</text>
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
					<view v-if="endLoading" class="candidate-loading">
						<text class="candidate-loading-text">名次加载中…</text>
					</view>
					<view v-else class="candidate-list">
						<view
							v-for="(p, idx) in alivePlayersForPick"
							:key="p.userId"
							class="candidate-row"
							:class="{
								'candidate-row-picked': isPickedTop3(p),
								'candidate-row-focus': isFocusedTop3(p)
							}"
							@tap="onPickTop3(p)"
						>
							<text class="candidate-rank">{{ idx + 1 }}</text>
							<text class="candidate-name">{{ p.username }}</text>
							<text class="candidate-chips">{{ formatChips(p.currentChips) }}</text>
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
				<text class="dlg-title">摸鱼分 · {{ fishDlg.target == null ? '' : fishDlg.target.username }}</text>
			</view>

			<view class="fish-body">
				<text class="fish-value">{{ fishDlg.temp }}</text>
				<text class="fish-value-label">当前摸鱼分</text>

				<view class="fish-adjust">
					<view v-for="n in 6" :key="n" class="fish-adj-btn" @tap="onFishSet(n)">
						<text class="fish-adj-text">{{ n }}</text>
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

	<!-- ============ 蘑菇复活弹层 ============ -->
	<!-- 已出局(K)且条件满足时从"我的状态"卡进入：展示倍数消耗 + 蘑菇存量，选支付方式后确认 -->
	<view v-if="reliveVisible" class="dlg-overlay" @tap="onTapReliveMask">
		<view class="dlg-card relive-card" @tap.stop="">
			<view class="dlg-head">
				<text class="dlg-title">蘑菇复活</text>
				<text class="dlg-sub">优先扣除个人蘑菇，不足时自动结合共用蘑菇</text>
			</view>

			<view class="relive-body">
				<!-- 消耗说明：1~4级固定1倍 / 5~6级可选单倍或双倍 -->
				<view class="relive-cost">
					<view class="relive-cost-row">
						<text class="relive-cost-label">当前级别</text>
						<text class="relive-cost-value">{{ reliveLevelText }}</text>
					</view>
					<view v-if="reliveMultSelectable" class="relive-cost-row">
						<text class="relive-cost-label">复活倍数</text>
						<view class="relive-mult-seg">
							<view class="relive-mult-opt" :class="{ 'relive-mult-active': reliveMult == 1 }" @tap="onPickReliveMult(1)">
								<text class="relive-mult-text" :class="{ 'relive-mult-text-active': reliveMult == 1 }">单倍</text>
							</view>
							<view class="relive-mult-opt" :class="{ 'relive-mult-active': reliveMult == 2 }" @tap="onPickReliveMult(2)">
								<text class="relive-mult-text" :class="{ 'relive-mult-text-active': reliveMult == 2 }">双倍</text>
							</view>
						</view>
					</view>
					<view class="relive-cost-row">
						<text class="relive-cost-label">本次复活</text>
						<text class="relive-cost-value">{{ reliveCount }} 倍买入 · 占用 1 个蘑菇</text>
					</view>
					<view class="relive-cost-row">
						<text class="relive-cost-label">需要支付</text>
						<text class="relive-cost-value">¥{{ reliveCostAmount }}（或者门票 {{ reliveCostTicket }} 张）</text>
					</view>
				</view>

				<!-- 蘑菇存量：个人优先扣，不足结合共用 -->
				<view class="relive-mush">
					<view class="relive-mush-item">
						<text class="relive-mush-num">{{ myMushroom }}</text>
						<text class="relive-mush-label">个人蘑菇</text>
					</view>
					<view class="relive-mush-div"></view>
					<view class="relive-mush-item">
						<text class="relive-mush-num">{{ shareMushroom }}</text>
						<text class="relive-mush-label">共用蘑菇</text>
					</view>
				</view>

				<text class="relive-pay-label">支付方式</text>
				<view class="relive-pays">
					<view
						class="relive-pay"
						:class="{ 'relive-pay-active': relivePay == 'balance', 'relive-pay-disabled': !reliveBalanceOk }"
						@tap="onPickRelivePay('balance')"
					>
						<text class="relive-pay-name">余额支付</text>
						<text class="relive-pay-desc">余额 ¥{{ reliveBalanceText }}</text>
					</view>
					<view
						class="relive-pay"
						:class="{ 'relive-pay-active': relivePay == 'ticket', 'relive-pay-disabled': !reliveTicketOk }"
						@tap="onPickRelivePay('ticket')"
					>
						<text class="relive-pay-name">门票支付</text>
						<text class="relive-pay-desc">门票 {{ reliveTicketText }} 张</text>
					</view>
				</view>
			</view>

			<view class="end-foot">
				<view class="end-foot-spacer"></view>
				<view class="end-btn end-btn-cancel" @tap="onTapReliveMask">
					<text class="end-btn-text">取消</text>
				</view>
				<view class="end-btn end-btn-ok" @tap="onReliveConfirm">
					<text class="end-btn-text">确认复活</text>
				</view>
			</view>
		</view>
	</view>

	<!-- ============ 通用确认弹层（替代 uni.showModal：App 端 scroll-view 内 tap 调 showModal 被吞） ============ -->
	<view v-if="confirmDlg.visible" class="dlg-overlay" @tap="onTapConfirmMask">
		<view class="dlg-card confirm-card" @tap.stop="">
			<view class="dlg-head">
				<text class="dlg-title">{{ confirmDlg.title }}</text>
				<text class="dlg-sub">{{ confirmDlg.content }}</text>
			</view>
			<view class="end-foot">
				<view class="end-btn end-btn-cancel" @tap="onTapConfirmMask">
					<text class="end-btn-text">取消</text>
				</view>
				<view class="end-btn end-btn-ok" @tap="onConfirmOk">
					<text class="end-btn-text">{{ confirmDlg.confirmText }}</text>
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
import { ref, computed, type Ref } from 'vue'
import { statusLabelOf, formatStart, myStateOfVo } from '@/common/game-detail'
import { fetchMatchDetail, fetchMatchUsers, pauseMatch, stopPauseMatch, resetMatch, matchNextLevel, matchPrevLevel, kickOutUser, leaveDesk, pullBackUser, setHappyScore, reliveUser, fetchMatchRanking, endMatchRanking } from '@/common/match-api'
import type { MatchUserRankingItem } from '@/common/match-api'
import type { MatchDetailVO, MatchUserVO } from '@/common/match-api'
import { resolveFileUrl, getAuthToken } from '@/common/http'
import { getLoginResult } from '@/common/user-api'

type StatItem = {
	label : string
	value : string
}

const gameId = ref<string>('')
// 当前登录用户 id / 角色：声明时直接从登录态初始化（getLoginResult 读 storage），
// 不依赖 onLoad 时序，避免首次渲染时"我"标记 / 管理员判定短暂为默认值
const bootLogin = getLoginResult()
const myUserId = ref<string>(bootLogin != null ? bootLogin.id : '')
// 接口数据 + 加载态；onShow 重新请求（报名页返回后数据会刷新）
const detailVo = ref<MatchDetailVO | null>(null)
// 参赛用户列表（GET /match-user/{id}/list）：玩家行的数据源
const usersVo = ref<MatchUserVO[]>([])
const loading = ref<boolean>(false)
// 直接使用 MatchDetailVO 字段渲染（模板里 detailVo.xxx），不再整包转 GameDetail / 兜转接 computed。
// 仅保留真正需要换算的派生值：状态码→文案、时间截断、级别拼接、从玩家列表找"我"的名次/筹码等。

// 拉取比赛详情 + 参赛用户列表；用户列表失败不阻塞详情展示
const loadDetail = () : void => {
	if (gameId.value == '') { return }
	loading.value = true
	fetchMatchDetail(gameId.value).then((vo) => {
		detailVo.value = vo
		loading.value = false
	}).catch(() => {
		loading.value = false
		uni.showToast({ title: '对局详情加载失败', icon: 'none' })
	})
	fetchMatchUsers(gameId.value).then((list) => {
		// 页面直接消费 MatchUserVO，不做中间映射；仅按后端 ranking 排序（0=未排名置底）
		usersVo.value = list
	}).catch(() => {
		usersVo.value = []
	})
}

// 未参赛且后端允许加入（joinValid），才给报名入口
const showJoinBar = computed<boolean>((): boolean => {
	const vo = detailVo.value
	if (vo == null || vo.joined) { return false }
	return vo.joinValid
})

const joinFeeText = computed<string>((): string => {
	const b : number = detailVo.value == null ? 0 : detailVo.value.joinAmount
	return b > 0 ? ('报名费 ¥' + b) : '免报名费'
})

const onJoin = () : void => {
	uni.navigateTo({ url: '/pages/game-signup/game-signup?id=' + gameId.value })
}

onShow((): void => {
	// 每次进入/返回页面都重新拉取，报名页返回后数据会自动刷新
	if (gameId.value != '') { loadDetail() }
})

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

const statusBgStyle = computed<string>((): string => {
	const s : string = detailVo.value == null ? '进行中' : statusLabelOf(detailVo.value.status)
	return 'background-color:' + statusBg(s) + ';'
})
const statusColorStyle = computed<string>((): string => {
	const s : string = detailVo.value == null ? '进行中' : statusLabelOf(detailVo.value.status)
	return 'color:' + statusColor(s) + ';'
})

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
	if (detailVo.value == null) { return '' }
	else if (detailVo.value.joinInviteCard) {
		return '报名 ' + detailVo.value.joinInviteCard + '张邀请函'
	} else if (detailVo.value.joinMonthTicket) {
		return '报名 ' + detailVo.value.joinMonthTicket + '张月票'
	} else {
		return '报名 ' + detailVo.value.joinAmount + ' 元(' + detailVo.value.joinTicket + '张票)'
	}
})

const alivePct = computed<number>((): number => {
	const total : number = detailVo.value == null ? 0 : detailVo.value.totalPlayerCount
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
// 我的参赛行：从玩家列表找"我"，复活资格以列表状态为准（K=出局可复活）
const myRow = computed<MatchUserVO | null>((): MatchUserVO | null => {
	for (let i : number = 0; i < usersVo.value.length; i++) {
		if (String(usersVo.value[i].userId) == myUserId.value) { return usersVo.value[i] }
	}
	return null
})

// 状态文案：我已出局(K)时优先显示"已出局"，其余沿用通用映射
const meStateText = computed<string>((): string => {
	const vo = detailVo.value
	if (vo == null) { return '' }
	if (vo.joinedStatus == 'D') { return '已出局' }
	return myStateOfVo(vo)
})

const meStateStyle = computed<string>((): string => {
	const s : string = meStateText.value
	if (s == '在局中') { return 'color:#D9A441;' }
	if (s == '已报名' || s == '候补中') { return 'color:#E8C275;' }
	if (s == '可报名') { return 'color:#7AB6F2;' }
	if (s == '已出局') { return 'color:#7AB6F2;' }
	return 'color:#A0A5A3;'
})

/* ---------------- 蘑菇复活 ---------------- */
// 复活规则：1~4 级固定 1 倍；5~6 级可选单倍（1）或双倍（2）；超出 1~6 级不支持复活
// 蘑菇固定消耗 1 个（双倍买入也只占用 1 个蘑菇），倍数仅影响买入金额（余额/门票支付翻倍）
const reliveMult : Ref<number> = ref(1)
const reliveMultSelectable = computed<boolean>((): boolean => {
	const lv : number = detailVo.value == null ? 0 : Number(detailVo.value.currentLevel ?? 0)
	return lv >= 5 && lv <= 6
})
const reliveCount = computed<number>((): number => {
	const lv : number = detailVo.value == null ? 0 : Number(detailVo.value.currentLevel ?? 0)
	if (lv >= 1 && lv <= 4) { return 1 }
	if (lv >= 5 && lv <= 6) { return reliveMult.value }
	return 0
})

// 蘑菇存量：个人剩余（userRemainReliveCount）+ 共用剩余（remainReliveCount）
const myMushroom = computed<number>((): number => detailVo.value == null ? 0 : Number(detailVo.value.userRemainReliveCount ?? 0))
const shareMushroom = computed<number>((): number => detailVo.value == null ? 0 : Number(detailVo.value.remainReliveCount ?? 0))

// 复活资格：已出局(K) + 比赛进行中(P) + 级别 1~6 + 蘑菇至少 1 个 + 余额或门票可用
const reliveReady = computed<boolean>((): boolean => {
	const vo = detailVo.value
	if (vo == null || vo.status != 'P') { return false }
	const row = myRow.value
	if (row == null || row.status != 'K') { return false }
	if (reliveCount.value <= 0) { return false }
	if (myMushroom.value + shareMushroom.value < 1) { return false }
	if (Number(vo.userBalance ?? 0) <= 0 && Number(vo.userTicket ?? 0) <= 0) { return false }
	return true
})

const meSubText = computed<string>((): string => {
	const vo = detailVo.value
	if (vo == null) { return '' }
	const row = myRow.value
	// 已出局：按复活条件给出对应提示
	if (row != null && row.status == 'K') {
		if (vo.status != 'P') { return '比赛进行中方可复活' }
		if (reliveCount.value <= 0) { return '当前级别超出可复活范围（1~6 级）' }
		if (myMushroom.value + shareMushroom.value < 1) { return '蘑菇不足，无法复活' }
		if (Number(vo.userBalance ?? 0) <= 0 && Number(vo.userTicket ?? 0) <= 0) { return '余额或门票不足，无法复活' }
		return '消耗 1 个蘑菇复活（个人优先）'
	}
	if (vo.joined) {
		return '已占座(' + vo.deskNum + '桌 ' + vo.position + '号)'
	}
	const st : string = myStateOfVo(vo)
	if (st == '可报名') { return '尚未报名，可向门店咨询占座' }
	return '你没有参加这场对局'
})

// 复活弹层：relivePay 为支付方式（BALANCE / TICKET），确认后提交 /match-user/{matchId}/relive
const reliveVisible : Ref<boolean> = ref(false)
const relivePay : Ref<string> = ref('')
const reliveSubmitting : Ref<boolean> = ref(false)

const reliveLevelText = computed<string>((): string => detailVo.value == null ? '' : 'Lv.' + detailVo.value.currentLevel)
const reliveBalanceOk = computed<boolean>((): boolean => detailVo.value != null && Number(detailVo.value.userBalance ?? 0) > 0)
const reliveTicketOk = computed<boolean>((): boolean => detailVo.value != null && Number(detailVo.value.userTicket ?? 0) > 0)
const reliveBalanceText = computed<string>((): string => detailVo.value == null ? '0' : String(Number(detailVo.value.userBalance ?? 0)))
const reliveTicketText = computed<string>((): string => detailVo.value == null ? '0' : String(Number(detailVo.value.userTicket ?? 0)))

/* ---------------- 头部信息展示 ---------------- */
// uvue 编译器对模板里 ref 的判空不做 TS 收窄（即使外层 v-if 已判空），
// 模板统一改为消费这些兜底 computed，消除 "possibly null" 编译警告
const heroStoreName = computed<string>((): string => detailVo.value == null ? '' : detailVo.value.storeName)
const heroStatusText = computed<string>((): string => detailVo.value == null ? '' : statusLabelOf(detailVo.value.status))
const heroName = computed<string>((): string => detailVo.value == null ? '' : detailVo.value.name)
const heroTypeName = computed<string>((): string => detailVo.value == null ? '' : detailVo.value.typeName)
const heroStartTime = computed<string>((): string => detailVo.value == null ? '' : formatStart(detailVo.value.startTime))
const dTotalCount = computed<number>((): number => detailVo.value == null ? 0 : Number(detailVo.value.totalPlayerCount ?? 0))
const reliveCostAmount = computed<number>((): number => detailVo.value == null ? 0 : Number(detailVo.value.joinAmount ?? 0) * reliveCount.value)
const reliveCostTicket = computed<number>((): number => detailVo.value == null ? 0 : Number(detailVo.value.joinTicket ?? 0) * reliveCount.value)

const onOpenRelive = () : void => {
	// 默认单倍复活；默认支付方式：余额优先，其次门票
	reliveMult.value = 1
	relivePay.value = reliveBalanceOk.value ? 'balance' : 'ticket'
	reliveVisible.value = true
}

const onTapReliveMask = () : void => {
	if (!reliveSubmitting.value) { reliveVisible.value = false }
}

const onPickReliveMult = (m : number) : void => {
	reliveMult.value = m
}

const onPickRelivePay = (k : string) : void => {
	if (k == 'balance' && !reliveBalanceOk.value) { uni.showToast({ title: '余额不足', icon: 'none' }); return }
	if (k == 'ticket' && !reliveTicketOk.value) { uni.showToast({ title: '门票不足', icon: 'none' }); return }
	relivePay.value = k
}

const onReliveConfirm = () : void => {
	if (reliveSubmitting.value) { return }
	if (relivePay.value == '') {
		uni.showToast({ title: '请选择支付方式', icon: 'none' })
		return
	}
	reliveSubmitting.value = true
	reliveUser(gameId.value, relivePay.value, reliveCount.value).then((): void => {
		reliveSubmitting.value = false
		reliveVisible.value = false
		uni.showToast({ title: '复活成功，欢迎回到牌桌', icon: 'success' })
		loadDetail()
	}).catch((e : any) : void => {
		reliveSubmitting.value = false
		uni.showToast({ title: e && e.message ? e.message : '复活失败，请重试', icon: 'none' })
	})
}

/* ---------------- 赛事数据 ---------------- */
// 级别显示：直接以服务端 currentLevel 为准（上一/下一级别走接口后 loadDetail 刷新）
const levelText = computed<string>((): string => {
	const vo = detailVo.value
	return vo == null ? '' : 'Lv.' + vo.currentLevel
})

// 盲注摘要：主带副标题；现金桌没有盲注结构时给提示文案
const blindsText = computed<string>((): string => {
	const vo = detailVo.value
	if (vo == null) { return '' }
	return '小盲 ' + formatChips(vo.minChips) + ' / 大盲 ' + formatChips(vo.maxChips)
})

// 底部指标带四列：起始筹码 / 平均筹码 / 总筹码 / 参赛人数（级别、盲注、存活已上移主带）
const statCells = computed<StatItem[]>((): StatItem[] => {
	const vo = detailVo.value
	if (vo == null) { return [] }
	return [
		{ label: '起始筹码', value: formatChips(vo.originChips) },
		{ label: '平均筹码', value: formatChips(vo.avgChips) },
		{ label: '总筹码', value: formatChips(vo.totalChips) },
		{ label: '参赛人数', value: vo.totalPlayerCount.toString() + ' 人' }
	]
})

/* ---------------- 参赛玩家（usersVo） ---------------- */
// 玩家列表直接是 /match-user/{id}/list 的 MatchUserVO[]，接口回来时按 ranking 排序。
// 管理员操作（出局 / 出桌回桌 / 摸鱼分 / 结束比赛）全部走接口，成功后 loadDetail() 重新拉取，
// 本地不做写回；展示名次 = 排序后的行序号（模板 idx+1），ranking 仅作接口排序键。

// 存活判定：A=已加入 / L=已复活（在局）；出局（K）可复活不算淘汰；出桌（D）才是真淘汰
const aliveOf = (p : MatchUserVO) : boolean => p.status == 'A' || p.status == 'L'

// 存活 / 淘汰统计：存活 = 在局(A/L)；出局(K)可复活单独计；淘汰 = 已出桌(D)
const aliveCount = computed<number>((): number => {
	let n : number = 0
	for (let i : number = 0; i < usersVo.value.length; i++) {
		if (aliveOf(usersVo.value[i])) { n++ }
	}
	return n
})
const outCount = computed<number>((): number => {
	let n : number = 0
	for (let i : number = 0; i < usersVo.value.length; i++) {
		if (usersVo.value[i].status == 'K') { n++ }
	}
	return n
})
const bustedCount = computed<number>((): number => {
	let n : number = 0
	for (let i : number = 0; i < usersVo.value.length; i++) {
		if (usersVo.value[i].status == 'D') { n++ }
	}
	return n
})

/* ---------------- 管理员操作 ---------------- */
// 管理员由当前用户角色判定：roleId == 1 视为管理员（后端角色约定）
const isAdmin = computed<boolean>((): boolean => detailVo.value?.userRole !== 'user')

// 暂停态直接从比赛状态派生（S = 已暂停），接口 pause 切换后 loadDetail 刷新即可
const paused = computed<boolean>((): boolean => detailVo.value != null && detailVo.value.status == 'S')

// "结束比赛"弹层：top3Slots 三个槽位；focusedSlot 是当前待填充的槽位下标
// 用 (MatchUserVO | null)[] 而不是 MatchUserVO[]：空槽位语义明确，避免哨兵对象
const endModalVisible : Ref<boolean> = ref(false)
const top3Slots : Ref<(MatchUserVO | null)[]> = ref<[null, null, null]>([null, null, null])
const focusedSlot : Ref<number> = ref(0)

// 候选玩家：本地工作副本里取存活（管理员出局的人不会再出现在结束比赛候选里）
const alivePlayersForPick = computed<MatchUserVO[]>((): MatchUserVO[] => {
	const out : MatchUserVO[] = []
	for (let i : number = 0; i < usersVo.value.length; i++) {
		const p : MatchUserVO = usersVo.value[i]
		if (aliveOf(p)) { out.push(p) }
	}
	return out
})

// 三个槽位都选满且互不重复时，"确认结束"才允许点（按 userId 判重）
const endConfirmable = computed<boolean>((): boolean => {
	const s : (MatchUserVO | null)[] = top3Slots.value
	if (s[0] == null || s[1] == null || s[2] == null) { return false }
	const a : string = String(s[0].userId)
	const b : string = String(s[1].userId)
	const c : string = String(s[2].userId)
	return a != b && a != c && b != c
})

// 投屏链接：TV/大屏打开 cast.html，携带 matchId 与登录 token（后端校验）
const screenLink = computed<string>((): string => `https://silentstack.cn/cast.html?matchId=${gameId.value}&token=${encodeURIComponent(getAuthToken())}`)

const onCopyScreen = () : void => {
	uni.setClipboardData({
		data: screenLink.value,
		success: () : void => { uni.showToast({ title: '投屏链接已复制', icon: 'success' }) },
		fail: () : void => { uni.showToast({ title: '复制失败', icon: 'none' }) }
	})
}

// 暂停 / 恢复：暂停中调 stop-pause，进行中调 pause；成功后重新拉取
const onPauseToggle = () : void => {
	if (gameId.value == '') { return }
	const call : Promise<void> = paused.value ? stopPauseMatch(gameId.value) : pauseMatch(gameId.value)
	call.then((): void => {
		loadDetail()
	}).catch((e : any) : void => {
		uni.showToast({ title: e && e.message ? e.message : '操作失败，请重试', icon: 'none' })
	})
}

/* ---------- 通用确认弹层 ---------- */
// App 端 scroll-view 内 tap 回调里调 uni.showModal 会被吞（延迟也无效），改用页面内确认弹层
// （与摸鱼分 / 复活弹层同模式）：kind 标记确认后执行的动作（bust=出局 / offtable=出桌回桌 / restart=重新开始）
const confirmDlg : Ref<{ visible : boolean, title : string, content : string, confirmText : string, kind : string, target : MatchUserVO | null }> =
	ref({ visible: false, title: '', content: '', confirmText: '确认', kind: '', target: null })

const showConfirm = (title : string, content : string, confirmText : string, kind : string, target : MatchUserVO | null) : void => {
	confirmDlg.value = { visible: true, title: title, content: content, confirmText: confirmText, kind: kind, target: target }
}

const onTapConfirmMask = () : void => { confirmDlg.value.visible = false }

const onConfirmOk = () : void => {
	const c = confirmDlg.value
	c.visible = false
	const p : MatchUserVO | null = c.target
	if (c.kind == 'bust' && p != null) {
		// 出局：POST /match-user/{matchId}/kick-out/{userId}
		kickOutUser(gameId.value, p.userId).then((): void => {
			loadDetail()
		}).catch((e : any) : void => {
			uni.showToast({ title: e && e.message ? e.message : '操作失败，请重试', icon: 'none' })
		})
	} else if (c.kind == 'offtable' && p != null) {
		// 出桌（leave-desk）可能误操作，回桌（pull-back）随时可拉回
		const call : Promise<void> = p.status == 'D' ? pullBackUser(gameId.value, p.userId) : leaveDesk(gameId.value, p.userId)
		call.then((): void => {
			loadDetail()
		}).catch((e : any) : void => {
			uni.showToast({ title: e && e.message ? e.message : '操作失败，请重试', icon: 'none' })
		})
	} else if (c.kind == 'restart') {
		// 重新开始：POST /match/{id}/reset（暂停 / 级别等状态以服务端为准）
		resetMatch(gameId.value).then((): void => {
			loadDetail()
			uni.showToast({ title: '已重新开始', icon: 'success' })
		}).catch((e : any) : void => {
			uni.showToast({ title: e && e.message ? e.message : '操作失败，请重试', icon: 'none' })
		})
	}
}

// 重新开始：确认后重置对局
const onRestart = () : void => {
	showConfirm('重新开始', '确认重置本对局状态？暂停 / 级别调整将清空', '重新开始', 'restart', null)
}

// 上一级别：POST /match/{matchId}/previous-level，成功后重新拉取（当前级别 / 盲注随之刷新）
const onPrevLevel = () : void => {
	if (gameId.value == '') { return }
	matchPrevLevel(gameId.value).then((): void => {
		loadDetail()
	}).catch((e : any) : void => {
		uni.showToast({ title: e && e.message ? e.message : '操作失败，请重试', icon: 'none' })
	})
}

// 下一级别：POST /match/{matchId}/next-level，成功后重新拉取
const onNextLevel = () : void => {
	if (gameId.value == '') { return }
	matchNextLevel(gameId.value).then((): void => {
		loadDetail()
	}).catch((e : any) : void => {
		uni.showToast({ title: e && e.message ? e.message : '操作失败，请重试', icon: 'none' })
	})
}

/* ---------- 玩家级管理操作：出局 / 出桌 / 摸鱼分 ---------- */
// 文字头像：名字首字，与 admin-* 系列 picker 头像同款
const avatarTextOf = (p : MatchUserVO) : string => p.username.length == 0 ? '?' : p.username.substring(0, 1)

// 网络图片地址补全（相对路径 → 完整 URL）
const avatarUrlOf = (p : MatchUserVO) : string => resolveFileUrl(p.avatar)

// 桌号 / 座位摘要：待入座（E/C）显示待入座；出桌（D）=已淘汰；出局（K）待复活
const seatTextOf = (p : MatchUserVO) : string => {
	if (p.status == 'E' || p.status == 'C') { return '待入座' }
	if (p.status == 'D') { return '已淘汰' }
	if (p.status == 'K') { return '已出局' }
	return p.deskNum + ' 桌 ' + p.position + ' 号'
}

// 右侧状态胶囊文案：已报名 > 已淘汰(出桌) > 已出局(可复活) > 我 > 存活（取优先级最高的一档）
const statusTextOf = (p : MatchUserVO) : string => {
	if (p.status == 'E' || p.status == 'C') { return '已报名' }
	if (p.status == 'D') { return '已淘汰' }
	if (p.status == 'K') { return '已出局' }
	if (String(p.userId) == myUserId.value) { return '我' }
	return '存活'
}

// 状态胶囊样式类（同名 + '-text' 组合文字色）：淘汰灰 / 出局蓝（区别于淘汰，提示可复活）
const statusClsOf = (p : MatchUserVO) : string => {
	if (p.status == 'E' || p.status == 'C') { return 'pr-status-enroll' }
	if (p.status == 'D') { return 'pr-status-out' }
	if (p.status == 'K') { return 'pr-status-off' }
	if (String(p.userId) == myUserId.value) { return 'pr-status-me' }
	return 'pr-status-live'
}

// 出局：确认后 POST /match-user/{matchId}/kick-out/{userId}，成功后重新拉取
const onBust = (p : MatchUserVO) : void => {
	showConfirm('确认出局', '将「' + p.username + '」标记为出局？', '出局', 'bust', p)
}

// 出桌 / 回桌：出桌（leave-desk）可能误操作，回桌（pull-back）随时可拉回；确认后执行，成功后重新拉取
const onOffTable = (p : MatchUserVO) : void => {
	if (p.status == 'D') {
		showConfirm('提示', '确认让 ' + p.username + ' 回桌吗？', '回桌', 'offtable', p)
	} else {
		showConfirm('提示', '确认让 ' + p.username + ' 出桌吗？', '出桌', 'offtable', p)
	}
}

// 摸鱼分弹层：target 是待调整的玩家，temp 是弹层内暂存的分值（确认才提交 happy-score）
const fishDlg : Ref<{ visible : boolean, target : MatchUserVO | null, temp : number }> = ref({ visible: false, target: null, temp: 0 })

const onOpenFish = (p : MatchUserVO) : void => {
	fishDlg.value = { visible: true, target: p, temp: p.happyScore }
}

const onTapFishMask = () : void => { fishDlg.value.visible = false }

// 快捷分值：直接设为 1~6
const onFishSet = (v : number) : void => {
	fishDlg.value.temp = v
}

const onFishConfirm = () : void => {
	const t : { visible : boolean, target : MatchUserVO | null, temp : number } = fishDlg.value
	if (t.target == null) { t.visible = false; return }
	// POST /match-user/{matchId}/happy-score：body { userId, score }；失败保留弹层可重试
	setHappyScore(gameId.value, t.target.userId, t.temp).then((): void => {
		t.visible = false
		loadDetail()
	}).catch((e : any) : void => {
		uni.showToast({ title: e && e.message ? e.message : '保存失败，请重试', icon: 'none' })
	})
}

/* ---------- 结束比赛：弹层 + 前三名 ---------- */
// 进入弹层：先调 /match-user/{matchId}/ranking 取服务端当前名次列表，再按存活玩家预填前三
const endLoading : Ref<boolean> = ref(false)
const onOpenEnd = () : void => {
	if (endLoading.value) { return }
	top3Slots.value = [null, null, null]
	focusedSlot.value = 0
	endModalVisible.value = true
	endLoading.value = true
	fetchMatchRanking(gameId.value).then((list) => {
		// 服务端名次即候选顺序：同步进本地列表（排序规则与详情页一致），前三预填存活头部
		top3Slots.value = [list[0] || null, list[1] || null, list[2] || null]
		focusedSlot.value = 0
		endLoading.value = false
	}).catch((e : any) : void => {
		// 名次接口可能有异常提示（如比赛状态不对），toast 后端 message 并关闭弹层
		endLoading.value = false
		endModalVisible.value = false
		uni.showToast({ title: e && e.message ? e.message : '名次加载失败，请重试', icon: 'none' })
	})
}

const closeEndModal = () : void => { endModalVisible.value = false }
const onTapEndMask = () : void => { closeEndModal() }

// 点击槽位：把焦点切过去，等下面"候选玩家"行点击时填入该槽
const onTapSlot = (idx : number) : void => { focusedSlot.value = idx }

// 是否已被选入前三（用于候选行打"已选"标记 + 阻止重复选同一人，按 userId 比对）
const isPickedTop3 = (p : MatchUserVO) : boolean => {
	const s : (MatchUserVO | null)[] = top3Slots.value
	for (let i : number = 0; i < s.length; i++) {
		const v : MatchUserVO | null = s[i]
		if (v != null && String(v.userId) == String(p.userId)) { return true }
	}
	return false
}

// 槽位玩家：模板里 top3Slots[idx] 二次索引无法做 null 收窄（TS 报 possibly null），统一走函数
const slotPlayerOf = (idx : number) : MatchUserVO | null => top3Slots.value[idx]

// 槽位玩家名：空槽位返回占位文案
const slotNameOf = (idx : number) : string => {
	const p : MatchUserVO | null = top3Slots.value[idx]
	if (p == null) { return '点击候选区选择玩家' }
	return p.username
}

// 候选行是否为当前焦点槽位上的玩家（用于行高亮）
const isFocusedTop3 = (p : MatchUserVO) : boolean => {
	const cur : MatchUserVO | null = top3Slots.value[focusedSlot.value]
	return isPickedTop3(p) && cur != null && String(cur.userId) == String(p.userId)
}

// 候选玩家点击：已选 → 反选（从对应槽位移出 + 聚焦该槽）；未选 → 填入 focusedSlot（自动跳到下一个空槽）
const onPickTop3 = (p : MatchUserVO) : void => {
	const s : (MatchUserVO | null)[] = top3Slots.value.slice()
	if (isPickedTop3(p)) {
		for (let i : number = 0; i < s.length; i++) {
			const v : MatchUserVO | null = s[i]
			if (v != null && String(v.userId) == String(p.userId)) {
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
	const s : (MatchUserVO | null)[] = top3Slots.value.slice()
	const tmp : MatchUserVO | null = s[a]
	s[a] = s[b]
	s[b] = tmp
	top3Slots.value = s
}

// 确认结束：仅提交前三名（槽位顺序：冠军/亚军/季军），其余名次由后端处理
const onConfirmEnd = () : void => {
	if (!endConfirmable.value) {
		uni.showToast({ title: '请选满前三名且不重复', icon: 'none' })
		return
	}
	const s : (MatchUserVO | null)[] = top3Slots.value
	if (s[0] == null || s[1] == null || s[2] == null) { return }
	const champion : MatchUserVO = s[0]   // 先落局部变量，异步回调里 TS 不会保留 s[0] 的非空收窄
	const rankingList : MatchUserRankingItem[] = [
		{ userId: s[0].userId, ranking: 1 },
		{ userId: s[1].userId, ranking: 2 },
		{ userId: s[2].userId, ranking: 3 }
	]
	endMatchRanking(gameId.value, rankingList).then((): void => {
		endModalVisible.value = false
		uni.showToast({
			title: '已结束 · 冠军 ' + champion.username,
			icon: 'none',
			duration: 2500
		})
		loadDetail()
	}).catch((e : any) : void => {
		uni.showToast({ title: e && e.message ? e.message : '结束失败，请重试', icon: 'none' })
	})
}

onLoad((options : any) : void => {
	// 不用 OnLoadOptions.getString()：本项目 ambient 类型里没有它，TS 解析为 String，编译报 not-callable
	// onLoad 实际入参就是普通 { id: string } 对象，直接键访问
	const raw : string | undefined = options != null ? options.id : undefined
	gameId.value = raw == null ? '' : raw
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

	/* 复活入口：出局(K)可复活时显示在状态卡右侧，绿色系象征"回到牌桌" */
	.relive-btn {
		height: 72rpx;
		padding: 0 30rpx;
		border-radius: 999rpx;
		align-items: center;
		justify-content: center;
		background-image: linear-gradient(135deg, #4FC08D, #2AA97A);
		margin-left: 20rpx;
	}
	.relive-btn-text { font-size: 26rpx; color: #FFFFFF; font-weight: 700; }

	/* ============ 蘑菇复活弹层 ============ */
	.relive-body { flex-direction: column; padding: 30rpx 30rpx 10rpx; }
	.relive-cost { flex-direction: column; gap: 12rpx; }
	.relive-cost-row { flex-direction: row; align-items: center; justify-content: space-between; }
	.relive-cost-label { font-size: 24rpx; color: #8F9492; }
	.relive-cost-value { font-size: 24rpx; color: #EDEFEE; font-weight: 600; }
	.relive-mult-seg { flex-direction: row; background-color: #1C211F; border-radius: 12rpx; padding: 4rpx; }
	.relive-mult-opt { padding: 8rpx 24rpx; border-radius: 8rpx; background-color: #1C211F; }
	.relive-mult-active { background-color: rgba(217, 164, 65, 0.18); }
	.relive-mult-text { font-size: 24rpx; color: #8F9492; }
	.relive-mult-text-active { color: #E8C275; font-weight: 600; }
	/* 蘑菇存量：个人/共用两栏对照，中间竖线分隔 */
	.relive-mush {
		flex-direction: row;
		align-items: center;
		background-color: #1D201F;
		border: 1rpx solid #2A2F2D;
		border-radius: 16rpx;
		padding: 24rpx 0;
		margin-top: 22rpx;
	}
	.relive-mush-item { flex: 1; flex-direction: column; align-items: center; }
	.relive-mush-num { font-size: 40rpx; color: #E8C275; font-weight: 800; }
	.relive-mush-label { font-size: 20rpx; color: #8F9492; margin-top: 6rpx; }
	.relive-mush-div { width: 1rpx; height: 56rpx; background-color: #2A2F2D; }
	/* 支付方式：余额 / 门票 双卡单选，金色描边为选中态 */
	.relive-pay-label { font-size: 22rpx; color: #8F9492; margin-top: 24rpx; }
	.relive-pays { flex-direction: row; gap: 16rpx; margin-top: 12rpx; }
	.relive-pay {
		flex: 1;
		flex-direction: column;
		align-items: center;
		padding: 20rpx 0;
		border-radius: 14rpx;
		background-color: #1D201F;
		border: 1rpx solid #2A2F2D;
	}
	.relive-pay-active { border-color: rgba(217, 164, 65, 0.85); background-color: rgba(217, 164, 65, 0.10); }
	.relive-pay-disabled { opacity: 0.45; }
	.relive-pay-name { font-size: 26rpx; color: #EDEFEE; font-weight: 600; }
	.relive-pay-desc { font-size: 20rpx; color: #8F9492; margin-top: 6rpx; }

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
	.pr-userno { font-size: 20rpx; color: #8F9492; margin-left: 12rpx; }
	/* 摘要行：买入 / 摸鱼分 / 桌号座位 / 筹码（筹码降级到小字，不再是主角） */
	.pr-meta { flex-direction: row; align-items: center; flex-wrap: wrap; margin-top: 8rpx; }
	.pr-meta-item { font-size: 20rpx; color: #8F9492; }
	.pr-meta-fish { color: #C9A06A; }
	.pr-meta-chips { color: #A7ACA9; font-weight: 600; }
	.pr-meta-dot { font-size: 20rpx; color: #4A4F4D; margin: 0 8rpx; }

	/* 右侧状态胶囊：存活绿 / 我金 / 已出局蓝(可复活) / 已淘汰灰，颜色即状态 */
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
	/* 复活弹层卡片：高度随内容自适应（必须放在 .dlg-card 之后才能覆盖其固定高度） */
	.relive-card { height: auto; min-height: 520rpx; max-height: 70vh; }
	/* 通用确认弹层卡片：小卡片，高度随内容自适应 */
	.confirm-card { height: auto; }
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
	.top3-medal-avatar { width: 72rpx; height: 72rpx; border-radius: 50%; }
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
	.candidate-loading {
		align-items: center;
		padding: 36rpx 0;
	}
	.candidate-loading-text {
		font-size: 23rpx;
		color: #6E7573;
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
