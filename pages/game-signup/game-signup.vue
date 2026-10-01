<template>
	<view class="page">
		<scroll-view class="scroll" direction="vertical" :show-scrollbar="false">
			<!-- ============ 加载中 ============ -->
			<view v-if="loading" class="state-box">
				<text class="state-text">加载中…</text>
			</view>

			<view v-else-if="valid" class="wrap">

				<!-- ============ 赛事概览：状态 / 地点 / 名称 / 类型 ============ -->
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

					<view class="hero-addr">
						<text class="addr-label">地点</text>
						<text class="addr-text">{{ heroStoreAddr }}</text>
					</view>

					<view class="hero-tags">
						<view class="tag">
							<text class="tag-text">{{ heroTypeName }}</text>
						</view>
						<view class="tag">
							<text class="tag-text">{{ heroStartTime }}</text>
						</view>
						<view class="tag">
							<text class="tag-text">{{ feeText }}</text>
						</view>
					</view>
				</view>

				<!-- 已报名（本机走完流程后回看） -->
				<view v-if="infoJoined" class="notice">
					<text class="notice-text">你已报名本场比赛 · {{ seatText }}</text>
				</view>

				<!-- ============ 赛事信息 ============ -->
				<view class="section">
					<view class="section-head">
						<view class="section-title-wrap">
							<view class="section-bar"></view>
							<text class="section-title">赛事信息</text>
						</view>
						<text class="section-hint">报名前请确认</text>
					</view>

					<!-- Card 1：盲注面板（核心：级别 + SB/BB 对阵）-->
					<view class="info-card">
						<view class="info-card-head">
							<view class="info-card-title-wrap">
								<text class="info-card-suit">♠</text>
								<text class="info-card-title">当前级别</text>
							</view>
							<text class="info-card-tag">{{ infoLevelText }}</text>
						</view>
						<view class="blinds-row">
							<view class="blind">
								<text class="blind-label">小盲 SB</text>
								<text class="blind-value">{{ infoMinChipsText }}</text>
							</view>
							<view class="blind-vs">
								<text class="blind-vs-text">VS</text>
							</view>
							<view class="blind blind-bb">
								<text class="blind-label">大盲 BB</text>
								<text class="blind-value">{{ infoMaxChipsText }}</text>
							</view>
						</view>
					</view>

					<!-- Card 2：起始筹码（筹码堆可视化 + 大数字）-->
					<view class="info-card">
						<view class="info-card-head">
							<text class="info-card-title">起始筹码</text>
							<text class="info-card-sub">每人起手 · 输光可复活</text>
						</view>
						<view class="stack">
							<view class="stack-viz">
								<!-- 堆叠顺序：DOM 后写先画在上面，三枚筹码俯视堆叠 -->
								<view class="chip chip-bot"></view>
								<view class="chip chip-mid"></view>
								<view class="chip chip-top"></view>
							</view>
							<view class="stack-text">
								<text class="stack-num">{{ infoOriginChipsText }}</text>
								<text class="stack-unit">CHIPS</text>
							</view>
						</view>
					</view>

					<!-- Card 3：参赛规模（参赛 / 存活 + 存活率进度条）-->
					<view class="info-card">
						<view class="info-card-head">
							<text class="info-card-title">参赛规模</text>
						</view>
						<view class="scale-row">
							<view class="scale-col">
								<text class="scale-num scale-num-green">{{ infoTotalCount }}</text>
								<text class="scale-label">参赛人数</text>
							</view>
							<view class="scale-divider"></view>
							<view class="scale-col">
								<text class="scale-num scale-num-green">{{ infoCurrentCount }}</text>
								<text class="scale-label">存活人数</text>
							</view>
						</view>
						<view class="scale-bar">
							<view class="scale-bar-fill" :style="signupAliveBarStyle"></view>
						</view>
						<text class="scale-sub">存活率 {{ signupAlivePct }}%</text>
					</view>

					<!-- Card 4：报名规则（费用 + 个人复活）-->
					<view class="info-card">
						<view class="info-card-head">
							<text class="info-card-title">报名规则</text>
						</view>
						<view class="rule-row">
							<text class="rule-label">比赛费用</text>
							<text class="rule-value rule-value-gold">{{ feeText }}</text>
						</view>
						<view class="rule-divider"></view>
						<view class="rule-row">
							<text class="rule-label">个人复活</text>
							<text class="rule-value">{{ rebuyText }}</text>
						</view>
						<view class="rule-row">
							<text class="rule-label">公用蘑菇</text>
							<text class="rule-value">{{ infoRemainMushText }}</text>
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
						<text class="section-hint">门票 / 月票 / 直通函可抵扣报名费</text>
					</view>

					<view class="asset-row">
						<view v-for="a in assets" :key="a.key" class="asset">
							<text class="asset-name">{{ a.name }}</text>
							<view class="asset-value-wrap">
								<text class="asset-value" :style="{ color: a.empty ? '#5A605E' : a.color }">{{ a.value }}</text>
								<text class="asset-unit" :style="{ color: a.empty ? '#4A504E' : '#8F9492' }">{{ a.unit }}</text>
							</view>
						</view>
					</view>
				</view>

				<!-- ============ 选择座位 ============ -->
				<view class="section">
					<view class="section-head">
						<view class="section-title-wrap">
							<view class="section-bar"></view>
							<text class="section-title">选择座位</text>
						</view>
						<text class="section-hint" :class="{ 'section-hint-on': pickedTable >= 0 }">{{ seatHintText }}</text>
					</view>

					<view class="seat-card">
						<!-- 多桌切换：每桌 10 人 -->
						<view v-if="tables.length > 1" class="table-tabs">
							<view
								v-for="(t, ti) in tables"
								:key="t.no"
								class="ttab"
								:class="{ 'ttab-on': ti === activeTable, 'ttab-gap': ti > 0 }"
								@tap="onTapTable(ti)"
							>
								<text class="ttab-text" :class="{ 'ttab-text-on': ti === activeTable }">第 {{ t.no }} 桌</text>
								<text class="ttab-sub" :class="{ 'ttab-sub-on': ti === activeTable }">{{ t.free }} 个空位</text>
							</view>
						</view>

						<!-- 牌桌：木质外圈 + 绿色台面 + 公共牌位 + 荷官筹码 + 10 个椅子 -->
					<view class="ring">
						<!-- 木质包边：深棕皮革渐变 + 内嵌高光阴影 -->
						<view class="table-rail"></view>

						<!-- 绿色台面：放射渐变 + 内描金线 -->
						<view class="felt">
							<view class="felt-info">
								<text class="felt-title">第 {{ activeTable + 1 }} 桌</text>
								<text class="felt-sub">{{ freeText }}</text>
							</view>
							<view class="felt-board">
								<!-- 5 个公共牌位：flop(3) + turn(1) + river(1) -->
								<view class="felt-cards">
									<view class="felt-card"></view>
									<view class="felt-card"></view>
									<view class="felt-card"></view>
									<view class="felt-card felt-card-mid"></view>
									<view class="felt-card"></view>
								</view>
								<text class="felt-pot">POT</text>
							</view>
						</view>

						<!-- 荷官筹码：slot 0 = 顶部中央 -->
						<view class="dealer-wrap" :style="seatStyle(0)">
							<view class="dealer">
								<text class="dealer-text">D</text>
							</view>
							<text class="dealer-label">荷官</text>
						</view>

						<view
							v-for="s in activeSeats"
							:key="s.no"
							class="seat"
							:class="{ 'seat-taken': s.taken, 'seat-picked': isPicked(s) }"
							:style="seatStyle(s.no)"
							@tap="onTapSeat(s)"
						>
							<view class="seat-ball">
								<text class="seat-no">{{ s.no }}</text>
							</view>
							<text v-if="isPicked(s)" class="seat-tag">{{ s.mine ? '我的座位' : '已选' }}</text>
							<text v-else-if="s.taken" class="seat-tag">已占</text>
						</view>
					</view>

						<view class="legend">
							<view class="legend-item">
								<view class="legend-dot legend-free"></view>
								<text class="legend-text">可选</text>
							</view>
							<view class="legend-item">
								<view class="legend-dot legend-taken"></view>
								<text class="legend-text">已占</text>
							</view>
							<view class="legend-item">
								<view class="legend-dot legend-pick"></view>
								<text class="legend-text">我的座位</text>
							</view>
						</view>
					</view>
				</view>

				<!-- ============ 支付方式 ============ -->
				<view class="section">
					<view class="section-head">
						<view class="section-title-wrap">
							<view class="section-bar"></view>
							<text class="section-title">支付方式</text>
						</view>
						<text class="section-hint">{{ payHint }}</text>
					</view>

					<view class="pay-list">
						<view
							v-for="m in payMethods"
							:key="m.key"
							class="pay-row"
							:class="{ 'pay-row-off': !m.available }"
							@tap="onTapPay(m)"
						>
							<view class="pay-bar" :style="payBarStyle(m)"></view>
							<view class="pay-main">
								<text class="pay-name" :class="{ 'pay-name-off': !m.available }">{{ m.name }}</text>
								<text class="pay-desc" :class="{ 'pay-desc-bad': !m.available }">{{ payDescOf(m) }}</text>
							</view>
							<view class="pay-radio" :class="{ 'pay-radio-on': m.key === payKey }">
								<text v-if="m.key === payKey" class="pay-radio-text">✓</text>
							</view>
						</view>
					</view>
				</view>

			</view>

			<view v-else class="empty">
				<EmptyState title="对局不存在" desc="该对局可能已结束或被移除，请返回广场重新选择" />
			</view>
		</scroll-view>

		<!-- ============ 底部：确认参赛 ============ -->
		<view v-if="valid" class="foot">
			<view class="foot-main">
				<text class="foot-seat">{{ seatText }}</text>
				<text class="foot-pay">{{ footPayText }}</text>
			</view>
			<view class="foot-btn" @tap="onConfirm">
				<text class="foot-btn-text">{{ confirmText }}</text>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { fetchGameSignup, buildTables } from '@/common/game-signup'
import type { SignupAsset, SignupSeat, SignupTable, PayMethod } from '@/common/game-signup'
import { statusLabelOf, formatStart } from '@/common/game-detail'
import { getLoginResult } from '@/common/user-api'
import { joinedSeatOf, markJoined } from '@/common/joined-store'
import { joinMatch } from '@/common/match-api'
import type { MatchDetailVO } from '@/common/match-api'

/* ---------------- 牌桌几何：与样式里的 .ring / .felt 尺寸一一对应 ---------------- */
// 11 个槽位：0 号给荷官（正上方），1~10 是 10 个座位
const RING_SLOTS : number = 11
const RING_CX : number = 345      // 容器 690rpx 宽的一半
const RING_CY : number = 330      // 容器 660rpx 高的一半
const RING_RX : number = 285
const RING_RY : number = 235
const SEAT_SIZE : number = 80

// 当前登录用户 id：桌位里标记"我的座位"用
const bootLogin = getLoginResult()
const myUserId : string = bootLogin != null ? String(bootLogin.id) : ''

const activeTable = ref(0)
const pickedTable = ref(-1)                 // -1 = 还没选
const pickedSeats = ref<number[]>([])       // 每桌各自记一个，避免切桌丢选择
const payKey = ref('')
const joining = ref(false)                  // 报名提交中，防连点
const loading = ref(true)
const info = ref<MatchDetailVO | null>(null)

const valid = computed<boolean>((): boolean => info.value != null)

onLoad((options : any) : void => {
	// onLoad 实际入参就是普通 { id: string } 对象，直接键访问（与详情页同口径）
	const raw : string | undefined = options != null ? options.id : undefined
	const id : string = raw == null ? '' : raw
	// GET /match/detail-to-join/{id}：详情 + 我的资产 + 桌位占座一并返回
	fetchGameSignup(id).then((vo : MatchDetailVO | null) : void => {
		loading.value = false
		if (vo == null) {
			uni.showToast({ title: '对局不存在或已结束', icon: 'none' })
			return
		}
		info.value = vo
		initPicks()
	}).catch((e : any) : void => {
		loading.value = false
		uni.showToast({ title: e && e.message ? e.message : '加载失败，请重试', icon: 'none' })
	})
})

/* ---------------- 视图数据：直接消费 MatchDetailVO，只保留视图必需的派生 ---------------- */

// 桌位：deskCount 张桌 × 10 座；deskPositionList 标出已占座位（含我自己）
const tables = computed<SignupTable[]>((): SignupTable[] => {
	const v : MatchDetailVO | null = info.value
	if (v == null) { return [] }
	return buildTables(v.deskCount, v.deskPositionList || [], myUserId)
})

// 我的资产：门票 / 月票 / 直通函 / 余额
const assets = computed<SignupAsset[]>((): SignupAsset[] => {
	const v : MatchDetailVO = info.value as MatchDetailVO
	return [
		{ key: 'ticket', name: '门票', value: String(v.userTicket), unit: '张', color: '#7AB6F2', empty: v.userTicket <= 0 },
		{ key: 'monthly', name: '月票', value: String(v.userMonthTicket), unit: '张', color: '#2AA97A', empty: v.userMonthTicket <= 0 },
		{ key: 'direct', name: '直通函', value: String(v.userInviteCard), unit: '张', color: '#B07AE8', empty: v.userInviteCard <= 0 },
		{ key: 'balance', name: '余额', value: String(v.userBalance), unit: '元', color: '#E8C275', empty: v.userBalance <= 0 }
	]
})

// 支付方式：join* > 0 表示本场支持该方式；available = 支持 且 我的资产足够
const payMethods = computed<PayMethod[]>((): PayMethod[] => {
	const v : MatchDetailVO = info.value as MatchDetailVO
	const fee : number = v.joinAmount
	return [
		{ key: 'ticket', name: '比赛门票', desc: v.joinTicket > 0 ? ('消耗门票 ×' + v.joinTicket + '（剩 ' + v.userTicket + ' 张）') : '本场免门票', available: v.joinTicket > 0 && v.userTicket >= v.joinTicket, reason: v.joinTicket > 0 ? '门票不足，先去酒德存一张' : '本场不支持门票入场', color: '#7AB6F2' },
		{ key: 'monthly', name: '比赛月票', desc: v.joinMonthTicket > 0 ? ('消耗月票 ×' + v.joinMonthTicket + '（剩 ' + v.userMonthTicket + ' 张）') : '本场免月票', available: v.joinMonthTicket > 0 && v.userMonthTicket >= v.joinMonthTicket, reason: v.joinMonthTicket > 0 ? '月票不足' : '本场不支持月票入场', color: '#2AA97A' },
		{ key: 'direct', name: '比赛直通函', desc: v.joinInviteCard > 0 ? ('消耗直通函 ×' + v.joinInviteCard + '（剩 ' + v.userInviteCard + ' 张）') : '本场免直通函', available: v.joinInviteCard > 0 && v.userInviteCard >= v.joinInviteCard, reason: v.joinInviteCard > 0 ? '直通函不足' : '本场不支持直通函入场', color: '#B07AE8' },
		{ key: 'balance', name: '门店余额', desc: fee > 0 ? ('扣款 ¥' + fee + '（余额 ¥' + v.userBalance + '）') : '本场免报名费', available: v.userBalance >= fee, reason: '余额不足，还差 ¥' + Math.max(fee - v.userBalance, 0), color: '#E8C275' }
	]
})

/* ---------------- 初始化：座位回填 + 默认支付方式 ---------------- */
const initPicks = () : void => {
	const ts : SignupTable[] = tables.value
	const seats : number[] = []
	for (let i : number = 0; i < ts.length; i++) { seats.push(0) }

	// 默认停在第一张有空位的桌（buildTables 已按占座算好空位，满桌不可选）
	for (let i : number = 0; i < ts.length; i++) {
		if (ts[i].free > 0) { activeTable.value = i; break }
	}

	// 已报名回看：接口桌位里标记的"我的座位"回填高亮；接口没带再退回本地报名记录
	const mine : number[] = mineSeatOf(ts)
	if (mine[0] < 0 && (info.value as MatchDetailVO).joined) {
		const local : number[] = joinedSeatOf(String((info.value as MatchDetailVO).id))
		mine[0] = local[0] - 1
		mine[1] = local[1]
	}
	if (mine[0] >= 0 && mine[0] < seats.length && mine[1] > 0) {
		seats[mine[0]] = mine[1]
		pickedTable.value = mine[0]
		activeTable.value = mine[0]
	}

	pickedSeats.value = seats
	payKey.value = firstAvailablePay(payMethods.value)
}

// 接口桌位里找"我的座位"：返回 [桌下标, 座位号]，没找到返回 [-1, 0]
const mineSeatOf = (ts : SignupTable[]) : number[] => {
	for (let i : number = 0; i < ts.length; i++) {
		const ss : SignupSeat[] = ts[i].seats
		for (let j : number = 0; j < ss.length; j++) {
			if (ss[j].mine) { return [i, ss[j].no] }
		}
	}
	return [-1, 0]
}

const firstAvailablePay = (list : PayMethod[]) : string => {
	for (let i : number = 0; i < list.length; i++) {
		if (list[i].available) { return list[i].key }
	}
	return ''
}

const payOf = (list : PayMethod[], key : string) : PayMethod | null => {
	for (let i : number = 0; i < list.length; i++) {
		if (list[i].key == key) { return list[i] }
	}
	return null
}

/* ---------------- 样式工具 ---------------- */
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

const statusColor = (code : string) : string => {
	if (code == 'P') { return '#D9A441' }		// 进行中
	if (code == 'C') { return '#E8C275' }		// 报名中
	return '#A0A5A3'
}

const statusBg = (code : string) : string => {
	if (code == 'P') { return 'rgba(217,164,65,0.20)' }
	if (code == 'C') { return 'rgba(232,194,117,0.22)' }
	return 'rgba(255,255,255,0.08)'
}

const statusBgStyle = computed<string>((): string => 'background-color:' + statusBg((info.value as MatchDetailVO).status) + ';')
const statusColorStyle = computed<string>((): string => 'color:' + statusColor((info.value as MatchDetailVO).status) + ';')

/* ---------------- 头部信息展示 ---------------- */
// uvue 编译器对模板里 ref 的判空不做 TS 收窄（即使外层 v-if 已判空），
// 模板统一改为消费这些兜底 computed，消除 "possibly null" 编译警告
const heroStoreName = computed<string>((): string => info.value == null ? '' : info.value.storeName)
const heroStatusText = computed<string>((): string => info.value == null ? '' : statusLabelOf(info.value.status))
const heroName = computed<string>((): string => info.value == null ? '' : info.value.name)
const heroStoreAddr = computed<string>((): string => info.value == null ? '' : info.value.storeAddress)
const heroTypeName = computed<string>((): string => info.value == null ? '' : info.value.typeName)
const heroStartTime = computed<string>((): string => info.value == null ? '' : formatStart(info.value.startTime))
const infoJoined = computed<boolean>((): boolean => info.value != null && info.value.joined == true)
const infoLevelText = computed<string>((): string => info.value == null ? '' : 'Lv.' + info.value.currentLevel)
const infoMinChipsText = computed<string>((): string => {
	const vo = info.value
	return vo == null || Number(vo.minChips) <= 0 ? '—' : formatChips(vo.minChips)
})
const infoMaxChipsText = computed<string>((): string => {
	const vo = info.value
	return vo == null || Number(vo.maxChips) <= 0 ? '—' : formatChips(vo.maxChips)
})
const infoOriginChipsText = computed<string>((): string => info.value == null ? '—' : formatChips(info.value.originChips))
const infoTotalCount = computed<number>((): number => info.value == null ? 0 : Number(info.value.totalPlayerCount ?? 0))
const infoCurrentCount = computed<number>((): number => info.value == null ? 0 : Number(info.value.currentPlayerCount ?? 0))
const infoRemainMushText = computed<string>((): string => info.value == null ? '—' : info.value.remainReliveCount + ' / ' + info.value.mushReliveCount)

// 座位坐标：椭圆环上均匀分布，0 号槽位在正上方（荷官）
const seatStyle = (slot : number) : string => {
	const deg : number = -90 + slot * (360 / RING_SLOTS)
	const rad : number = deg * Math.PI / 180
	const x : number = RING_CX + RING_RX * Math.cos(rad) - SEAT_SIZE / 2
	const y : number = RING_CY + RING_RY * Math.sin(rad) - SEAT_SIZE / 2
	return 'left:' + Math.round(x).toString() + 'rpx;top:' + Math.round(y).toString() + 'rpx;'
}

/* ---------------- 概览 / 信息 ---------------- */
const feeText = computed<string>((): string => {
	const v : MatchDetailVO = info.value as MatchDetailVO
	if (v.joinInviteCard > 0) { return v.joinInviteCard.toString() + ' 张直通函' }
	if (v.joinMonthTicket > 0) { return v.joinMonthTicket.toString() + ' 月票' }
	return '¥' + v.joinAmount + '(' + v.joinTicket + '张门票)'
})

// 存活率 = 存活人数 / 参赛人数
const signupAlivePct = computed<number>((): number => {
	const v : MatchDetailVO = info.value as MatchDetailVO
	if (v.totalPlayerCount <= 0) { return 0 }
	return Math.round(v.currentPlayerCount / v.totalPlayerCount * 100)
})
const signupAliveBarStyle = computed<string>((): string => 'width:' + signupAlivePct.value.toString() + '%;')

const rebuyText = computed<string>((): string => {
	const n : number = (info.value as MatchDetailVO).userReliveCount
	return n > 0 ? (n.toString() + ' 次') : '不支持'
})

/* ---------------- 座位 ---------------- */
const activeTableInfo = computed<SignupTable>((): SignupTable => {
	const list : SignupTable[] = tables.value
	const idx : number = activeTable.value
	if (idx < 0 || idx >= list.length) {
		return { no: 0, seats: [], takenCount: 0, free: 0 }
	}
	return list[idx]
})

const activeSeats = computed<SignupSeat[]>((): SignupSeat[] => activeTableInfo.value.seats)

const freeText = computed<string>((): string => '剩 ' + activeTableInfo.value.free + ' 个空位')

const pickedNoOf = (tableIdx : number) : number => {
	const arr : number[] = pickedSeats.value
	return tableIdx >= 0 && tableIdx < arr.length ? arr[tableIdx] : 0
}

// 改数组元素要整份替换，保证视图一定刷新
const setSeatAt = (arr : number[], idx : number, val : number) : number[] => {
	const out : number[] = []
	for (let i : number = 0; i < arr.length; i++) {
		out.push(i == idx ? val : arr[i])
	}
	return out
}

const isPicked = (s : SignupSeat) : boolean => pickedNoOf(activeTable.value) == s.no

const seatText = computed<string>((): string => {
	const t : number = pickedTable.value
	if (t < 0) { return '未选择座位' }
	return '第 ' + (t + 1).toString() + ' 桌 · ' + pickedNoOf(t).toString() + ' 号位'
})

const seatHintText = computed<string>((): string => pickedTable.value < 0 ? '点击座位号锁定位置' : seatText.value)

const onTapTable = (ti : number) : void => { activeTable.value = ti }

const onTapSeat = (s : SignupSeat) : void => {
	if ((info.value as MatchDetailVO).joined) {
		uni.showToast({ title: '你已报名本场比赛', icon: 'none' })
		return
	}
	if (s.taken) {
		uni.showToast({ title: '该座位已被占用，换一个吧', icon: 'none' })
		return
	}
	pickedSeats.value = setSeatAt(pickedSeats.value, activeTable.value, s.no)
	pickedTable.value = activeTable.value
}

/* ---------------- 支付 ---------------- */
const payDescOf = (m : PayMethod) : string => m.available ? m.desc : m.reason

const payBarStyle = (m : PayMethod) : string => 'background-color:' + m.color + ';'

const payHint = computed<string>((): string => {
	const pay : PayMethod | null = payOf(payMethods.value, payKey.value)
	return pay == null ? '暂无可用支付方式' : ('已选：' + pay.name)
})

const footPayText = computed<string>((): string => {
	const pay : PayMethod | null = payOf(payMethods.value, payKey.value)
	if (pay == null) { return '未选择支付方式' }
	const tail : string = pay.available ? '' : ('（' + pay.reason + '）')
	return '支付：' + pay.name + tail
})

const confirmText = computed<string>((): string => (info.value as MatchDetailVO).joined ? '已报名' : '确认参赛')

const onTapPay = (m : PayMethod) : void => {
	if ((info.value as MatchDetailVO).joined) {
		uni.showToast({ title: '你已报名本场比赛', icon: 'none' })
		return
	}
	if (!m.available) {
		uni.showToast({ title: m.reason, icon: 'none' })
		return
	}
	payKey.value = m.key
}

/* ---------------- 确认参赛 ---------------- */
// 前端支付方式 key → 后端 payType 取值（若与后端枚举不一致只需改这张表）
const PAY_TYPES : Record<string, string> = {
	ticket: 'ticket',
	monthly: 'month-ticket',
	direct: 'invite-card',
	balance: 'balance'
}

const onConfirm = () : void => {
	if ((info.value as MatchDetailVO).joined) {
		uni.showToast({ title: '你已报名本场比赛，座位已锁定', icon: 'none' })
		return
	}
	const t : number = pickedTable.value
	const seatNo : number = pickedNoOf(t)
	if (t < 0 || seatNo <= 0) {
		uni.showToast({ title: '请先点击选择一个座位', icon: 'none' })
		return
	}
	const pay : PayMethod | null = payOf(payMethods.value, payKey.value)
	if (pay == null) {
		uni.showToast({ title: '请选择支付方式', icon: 'none' })
		return
	}
	if (!pay.available) {
		uni.showToast({ title: pay.reason, icon: 'none' })
		return
	}
	if (joining.value) { return }

	// POST /match-user/{matchId}/join：payType + 桌号(1 起) + 座位(1~10)
	joining.value = true
	const matchId : string = String((info.value as MatchDetailVO).id)
	joinMatch(matchId, PAY_TYPES[pay.key] || pay.key, t + 1, seatNo).then((): void => {
		joining.value = false
		markJoined(matchId, t + 1, seatNo)
		uni.showToast({ title: '报名成功 · 座位已锁定', icon: 'success' })
		uni.redirectTo({ url: '/pages/game-detail/game-detail?id=' + matchId })
	}).catch((e : any) : void => {
		joining.value = false
		uni.showToast({ title: e && e.message ? e.message : '报名失败，请重试', icon: 'none' })
	})
}
</script>

<style scoped>
	.page {
		background-image: linear-gradient(180deg, #0E1110 0%, #0A0C0B 40%, #0B0D0C 100%);
		/* 上下结构：滚动区 + 底部固定操作栏，scroll-view 必须有确定高度才能滚动 */
		height: 100vh;
		box-sizing: border-box;
		flex-direction: column;
	}
	/* #ifdef H5 */
	/* H5 端 100vh 含导航栏，直接用它底部操作栏会被裁 */
	.page {
		height: calc(100vh - var(--window-top) - var(--window-bottom));
	}
	/* #endif */

	.scroll { flex: 1; }
	.wrap { padding: 24rpx 0 40rpx; }

	/* 加载 / 失败占位 */
	.state-box { align-items: center; padding: 160rpx 0 80rpx; }
	.state-text { font-size: 24rpx; color: #6E7573; }

	/* ============ 赛事概览 ============ */
	.hero {
		background-color: #1A1E1D;
		border-radius: 32rpx;
		padding: 28rpx;
		box-shadow: 0 12rpx 28rpx rgba(0, 0, 0, 0.40);
	}
	.hero-top { flex-direction: row; align-items: center; justify-content: space-between; }
	.hero-store { flex-direction: row; align-items: center; }
	.store-dot { width: 12rpx; height: 12rpx; border-radius: 50%; background-color: #E8C275; margin-right: 10rpx; }
	.store-name { font-size: 26rpx; color: #A0A5A3; }
	.status-badge { padding: 8rpx 20rpx; border-radius: 999rpx; }
	.status-text { font-size: 24rpx; font-weight: 600; }

	.hero-title { font-size: 40rpx; color: #EDEFEE; font-weight: 700; margin-top: 18rpx; }

	.hero-addr { flex-direction: row; align-items: flex-start; margin-top: 16rpx; }
	.addr-label { width: 64rpx; font-size: 22rpx; color: #7E8281; }
	.addr-text { flex: 1; font-size: 24rpx; color: #C7CDCB; line-height: 36rpx; }

	.hero-tags { flex-direction: row; align-items: center; flex-wrap: wrap; margin-top: 18rpx; }
	.tag {
		padding: 6rpx 18rpx;
		border-radius: 999rpx;
		background-color: #1D201F;
		margin-right: 12rpx;
	}
	.tag-text { font-size: 22rpx; color: #A0A5A3; }

	/* ============ 已报名提示 ============ */
	.notice {
		flex-direction: row;
		align-items: center;
		background-color: rgba(232, 194, 117, 0.12);
		border: 1rpx solid rgba(232, 194, 117, 0.32);
		border-radius: 20rpx;
		padding: 20rpx 24rpx;
		margin-top: 24rpx;
	}
	.notice-text { font-size: 24rpx; color: #E8C275; font-weight: 600; }

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
	}
	.section-title { font-size: 30rpx; color: #EDEFEE; font-weight: 700; }
	.section-hint { font-size: 22rpx; color: #8F9492; }
	/* 已选座位时提示改为金色，让"选好了"一眼可见 */
	.section-hint-on { color: #E8C275; font-weight: 600; }

	/* ============ 赛事信息：5 张主题卡（盲注 / 筹码 / 规模 / 规则 / 蘑菇）============ */
			.info-card {
				background-color: #171A19;
				border-radius: 24rpx;
				padding: 26rpx 28rpx;
			}
			/* 卡片之间留 20rpx；只有相邻的 info-card 才有上间距 */
			.info-card + .info-card { margin-top: 20rpx; }

			.info-card-head {
				flex-direction: row;
				align-items: center;
				justify-content: space-between;
				margin-bottom: 22rpx;
			}
			.info-card-title-wrap { flex-direction: row; align-items: center; }
			.info-card-title { font-size: 26rpx; color: #EDEFEE; font-weight: 700; }
			.info-card-suit { font-size: 28rpx; color: #E8C275; margin-right: 10rpx; font-weight: bold; }
			.info-card-tag {
				font-size: 22rpx;
				color: #E8C275;
				font-weight: 700;
				background-color: rgba(232, 194, 117, 0.12);
				padding: 4rpx 14rpx;
				border-radius: 999rpx;
			}
			.info-card-sub { font-size: 20rpx; color: #8F9492; }

			/* Card 1：盲注面板 —— SB / VS / BB 三段式 */
			.blinds-row { flex-direction: row; align-items: stretch; }
			.blind {
		flex: 1;
		background-color: #1D201F;
		border: 1rpx solid #2A2F2D;
		border-radius: 20rpx;
		padding: 24rpx 0;
		align-items: center;
	}
			/* 大盲用金色高亮，呼应"BB > SB"的视觉层级 */
			.blind-bb {
				background-color: rgba(232, 194, 117, 0.10);
				border-color: rgba(232, 194, 117, 0.40);
			}
			.blind-label { font-size: 20rpx; color: #8F9492; }
			.blind-value {
				font-size: 38rpx;
				color: #E8C275;
				font-weight: 800;
				margin-top: 10rpx;
				letter-spacing: 1rpx;
			}
			.blind-vs {
				width: 76rpx;
				align-items: center;
				justify-content: center;
			}
			.blind-vs-text {
				font-size: 22rpx;
				color: #6E7573;
				font-weight: 800;
				font-style: italic;
				letter-spacing: 2rpx;
			}

			/* Card 2：起始筹码 —— 三枚堆叠筹码 + 大数字 */
			.stack { flex-direction: row; align-items: center; }
			.stack-viz {
				width: 140rpx;
				height: 84rpx;
				position: relative;
			}
			.chip {
				position: absolute;
				width: 100rpx;
				height: 28rpx;
				border-radius: 14rpx;
				left: 50%;
				margin-left: -50rpx;
				/* 上下嵌阴影：模拟筹码圆边的 3D 立体感 */
				box-shadow:
					inset 0 2rpx 0 rgba(255, 255, 255, 0.22),
					inset 0 -3rpx 0 rgba(0, 0, 0, 0.45);
			}
			.chip-bot { bottom: 0;     background-image: linear-gradient(180deg, #E84A4A 0%, #A52020 100%); }
			.chip-mid { bottom: 26rpx; background-image: linear-gradient(180deg, #2AA97A 0%, #156848 100%); }
			.chip-top { bottom: 52rpx; background-image: linear-gradient(180deg, #F5D98E 0%, #A07C2E 100%); }
			.stack-text { flex: 1; align-items: flex-end; }
			.stack-num {
				font-size: 48rpx;
				color: #E8C275;
				font-weight: 800;
				letter-spacing: 2rpx;
			}
			.stack-unit {
				font-size: 18rpx;
				color: #8F9492;
				letter-spacing: 6rpx;
				margin-top: 6rpx;
			}

			/* Card 3：参赛规模 —— 左右两列 + 存活率绿色进度条 */
			.scale-row { flex-direction: row; align-items: center; }
			.scale-col { flex: 1; align-items: center; }
			.scale-num {
				font-size: 44rpx;
				font-weight: 800;
				color: #EDEFEE;
			}
			.scale-num-green { color: #2AA97A; }
			.scale-label { font-size: 22rpx; color: #8F9492; margin-top: 8rpx; }
			.scale-divider { width: 1rpx; height: 56rpx; background-color: #2A2F2D; }
			.scale-bar {
				height: 10rpx;
				background-color: #2A2F2D;
				border-radius: 999rpx;
				margin-top: 22rpx;
				overflow: hidden;
			}
			.scale-bar-fill {
				height: 10rpx;
				background-image: linear-gradient(90deg, #2AA97A, #4FCFA0);
				border-radius: 999rpx;
			}
			.scale-sub {
				font-size: 20rpx;
				color: #8F9492;
				margin-top: 12rpx;
			}

			/* Card 4：报名规则 —— 左 label / 右 value */
			.rule-row {
				flex-direction: row;
				align-items: center;
				justify-content: space-between;
				padding: 16rpx 0;
			}
			.rule-label { font-size: 24rpx; color: #8F9492; }
			.rule-value { font-size: 28rpx; color: #EDEFEE; font-weight: 700; }
			.rule-value-gold { color: #E8C275; }
			.rule-divider { height: 1rpx; background-color: #2A2F2D; }

			/* Card 5：共用蘑菇 —— 金色进度条 + 已用 / 剩余标签 */
			.fungus-bar {
				height: 14rpx;
				background-color: #2A2F2D;
				border-radius: 999rpx;
				overflow: hidden;
			}
			.fungus-bar-fill {
				height: 14rpx;
				background-image: linear-gradient(90deg, #E8C275, #C89B3C);
				border-radius: 999rpx;
			}
			.fungus-info {
				flex-direction: row;
				align-items: center;
				justify-content: space-between;
				margin-top: 14rpx;
			}
			.fungus-info-left { font-size: 20rpx; color: #8F9492; }
			.fungus-info-right { font-size: 22rpx; color: #E8C275; font-weight: 700; }

	/* ============ 我的资产 ============ */
	.asset-row {
		flex-direction: row;
		background-color: #171A19;
		border-radius: 24rpx;
		padding: 26rpx 12rpx;
	}
	.asset { flex: 1; align-items: center; }
	.asset-name { font-size: 22rpx; color: #8F9492; }
	.asset-value-wrap { flex-direction: row; align-items: baseline; margin-top: 10rpx; }
	.asset-value { font-size: 34rpx; font-weight: 700; }
	.asset-unit { font-size: 20rpx; color: #8F9492; margin-left: 4rpx; }

	/* ============ 选择座位 ============ */
	.seat-card {
		background-color: #171A19;
		border-radius: 24rpx;
		/* 左右 30rpx：内宽正好 690rpx，与 .ring 的宽度一致 */
		padding: 24rpx 30rpx 26rpx;
	}

	.table-tabs { flex-direction: row; margin-bottom: 20rpx; }
	.ttab {
		flex: 1;
		align-items: center;
		background-color: #1D201F;
		border: 1rpx solid #2A2F2D;
		border-radius: 16rpx;
		padding: 14rpx 0;
	}
	.ttab-gap { margin-left: 16rpx; }
	.ttab-on { background-color: rgba(232, 194, 117, 0.10); border-color: rgba(232, 194, 117, 0.45); }
	.ttab-text { font-size: 26rpx; color: #A0A5A3; font-weight: 600; }
	.ttab-text-on { color: #E8C275; }
	.ttab-sub { font-size: 19rpx; color: #6E7573; margin-top: 4rpx; }
	.ttab-sub-on { color: #C7CDCB; }

	/* 牌桌：690 × 660，11 个槽位（0 = 荷官，1-10 = 椅子）由脚本按椭圆算坐标 */
			.ring {
				position: relative;
				width: 690rpx;
				height: 660rpx;
			}

			/* 木质外圈：仿真实桌的皮革包边，深棕 + 高光/阴影立体感 */
			.table-rail {
				position: absolute;
				left: 50%;
				top: 50%;
				width: 600rpx;
				height: 460rpx;
				margin-left: -300rpx;
				margin-top: -230rpx;
				border-radius: 240rpx;
				background-color: #5C3A1E;
				background-image:
					linear-gradient(135deg, rgba(255, 220, 170, 0.12) 0%, rgba(0, 0, 0, 0) 50%),
					linear-gradient(180deg, #7A4F2A 0%, #5C3A1E 50%, #3D2614 100%);
				box-shadow:
					inset 0 4rpx 0 rgba(255, 220, 170, 0.14),
					inset 0 -4rpx 0 rgba(0, 0, 0, 0.45),
					0 14rpx 36rpx rgba(0, 0, 0, 0.55);
			}

			/* 绿色台面：放射渐变中心亮 / 边缘暗，模拟真实毛毡的视觉衰减 */
			.felt {
				position: absolute;
				left: 50%;
				top: 50%;
				width: 540rpx;
				height: 400rpx;
				margin-left: -270rpx;
				margin-top: -200rpx;
				border-radius: 220rpx;
				background-color: #0E3324;
				background-image: radial-gradient(ellipse at center, #1F5840 0%, #143E2A 65%, #0B2A1B 100%);
				box-shadow:
					inset 0 0 0 3rpx rgba(232, 194, 117, 0.20),
					inset 0 0 32rpx rgba(0, 0, 0, 0.5);
				align-items: center;
				justify-content: center;
				flex-direction: column;
			}
			.felt-info { align-items: center; }
			.felt-title { font-size: 28rpx; color: #E8C275; font-weight: 700; }
			.felt-sub { font-size: 20rpx; color: #7E8281; margin-top: 8rpx; }

			/* 台面中央：5 个公共牌位（flop×3 + turn + river）+ 奖池标签 */
			.felt-board { align-items: center; margin-top: 16rpx; }
			.felt-cards { flex-direction: row; align-items: center; }
			.felt-card {
				width: 50rpx;
				height: 68rpx;
				border-radius: 8rpx;
				background-color: rgba(255, 255, 255, 0.05);
				border: 1rpx dashed rgba(232, 194, 117, 0.22);
				margin: 0 5rpx;
			}
			/* 第四张（turn）和第五张（river）之间留空，模拟真实荷官的牌间距 */
			.felt-card-mid { margin: 0 14rpx; }
			.felt-pot {
				font-size: 18rpx;
				color: #E8C275;
				font-weight: 700;
				margin-top: 10rpx;
				letter-spacing: 6rpx;
			}

			/* 荷官筹码（slot 0）：仿真实桌的金属 D 筹码 + 文字标签 */
			.dealer-wrap { position: absolute; width: 80rpx; align-items: center; }
			.dealer {
				width: 60rpx;
				height: 60rpx;
				border-radius: 50%;
				background-image: radial-gradient(circle at 30% 30%, #FFE08A 0%, #E8C275 55%, #A07C2E 100%);
				border: 2rpx solid rgba(255, 255, 255, 0.20);
				align-items: center;
				justify-content: center;
				box-shadow:
					0 4rpx 12rpx rgba(0, 0, 0, 0.5),
					inset 0 1rpx 0 rgba(255, 255, 255, 0.25);
			}
			.dealer-text {
				font-size: 30rpx;
				color: #5C3A1E;
				font-weight: 800;
				font-style: italic;
				line-height: 30rpx;
			}
			.dealer-label { font-size: 18rpx; color: #8F9492; font-weight: 500; margin-top: 4rpx; }

			/* 椅子 */
			.seat { position: absolute; width: 80rpx; align-items: center; }
			.seat-ball {
				width: 80rpx;
				height: 80rpx;
				border-radius: 50%;
				background-color: #1E2422;
				background-image: radial-gradient(circle at 30% 30%, #2A302E 0%, #1E2422 70%, #161A18 100%);
				border: 2rpx solid #2E3533;
				align-items: center;
				justify-content: center;
				box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.45);
			}
			.seat-no { font-size: 26rpx; color: #C7CDCB; font-weight: 700; }
			.seat-tag { font-size: 18rpx; color: #E8C275; font-weight: 600; margin-top: 6rpx; }

			.seat-taken .seat-ball {
				background-color: #151917;
				background-image: none;
				border-color: #2A2F2D;
				box-shadow: none;
			}
			.seat-taken .seat-no { color: #4E5452; }
			.seat-taken .seat-tag { color: #6E7573; }

			.seat-picked .seat-ball {
				background-image: linear-gradient(135deg, #F5D98E, #C89B3C);
				border-color: #FFE7AE;
				box-shadow:
					0 0 0 4rpx rgba(232, 194, 117, 0.22),
					0 4rpx 16rpx rgba(232, 194, 117, 0.45);
			}
			.seat-picked .seat-no { color: #14100A; }

	.legend { flex-direction: row; align-items: center; justify-content: center; margin-top: 10rpx; }
	.legend-item { flex-direction: row; align-items: center; margin: 0 18rpx; }
	.legend-dot { width: 22rpx; height: 22rpx; border-radius: 50%; margin-right: 8rpx; }
	.legend-free { background-color: #1E2422; border: 2rpx solid #2E3533; }
	.legend-taken { background-color: #151917; border: 2rpx solid #2A2F2D; }
	.legend-pick { background-image: linear-gradient(135deg, #F5D98E, #C89B3C); }
	.legend-text { font-size: 20rpx; color: #7E8281; }

	/* ============ 支付方式 ============ */
	.pay-list {
		background-color: #1A1E1D;
		border-radius: 28rpx;
		padding: 6rpx 24rpx;
		box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
	}
	.pay-row {
		flex-direction: row;
		align-items: center;
		padding: 24rpx 0;
		border-bottom: 1rpx solid #2A2F2D;
	}
	.pay-row-off { opacity: 0.62; }
	.pay-bar { width: 6rpx; height: 48rpx; border-radius: 6rpx; margin-right: 18rpx; }
	.pay-main { flex: 1; flex-direction: column; }
	.pay-name { font-size: 28rpx; color: #EDEFEE; font-weight: 600; }
	.pay-name-off { color: #8F9492; }
	.pay-desc { font-size: 21rpx; color: #8F9492; margin-top: 6rpx; }
	.pay-desc-bad { color: #FF6255; }
	.pay-radio {
		width: 44rpx;
		height: 44rpx;
		border-radius: 50%;
		background-color: #1F2322;
		border: 1rpx solid #2A2F2D;
		align-items: center;
		justify-content: center;
		margin-left: 16rpx;
	}
	.pay-radio-on { background-color: #E8C275; border-color: #E8C275; }
	.pay-radio-text { font-size: 22rpx; color: #14100A; font-weight: 700; line-height: 22rpx; }

	/* ============ 底部操作栏 ============ */
	.foot {
		flex-direction: row;
		align-items: center;
		padding: 20rpx 24rpx 40rpx;
		background-color: #0B0D0C;
		border-top: 1rpx solid #1F2322;
	}
	.foot-main { flex: 1; flex-direction: column; }
	.foot-seat { font-size: 28rpx; color: #EDEFEE; font-weight: 700; }
	.foot-pay { font-size: 21rpx; color: #8F9492; margin-top: 6rpx; }
	.foot-btn {
		height: 84rpx;
		padding: 0 44rpx;
		border-radius: 14rpx;
		align-items: center;
		justify-content: center;
		background-image: linear-gradient(135deg, #E8D08E, #C89B3C);
	}
	.foot-btn-text { font-size: 28rpx; color: #14100A; font-weight: 700; }

	.empty { padding-top: 160rpx; }
</style>
