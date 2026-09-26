<template>
	<view class="page">
		<scroll-view class="scroll" direction="vertical" :show-scrollbar="false">
			<view v-if="valid" class="wrap">

				<!-- ============ 赛事概览：状态 / 地点 / 名称 / 类型 ============ -->
				<view class="hero">
					<view class="hero-top">
						<view class="hero-store">
							<view class="store-dot"></view>
							<text class="store-name">{{ info.game.storeName }}</text>
						</view>
						<view class="status-badge" :style="statusBgStyle">
							<text class="status-text" :style="statusColorStyle">{{ info.game.status }}</text>
						</view>
					</view>

					<text class="hero-title">{{ info.game.title }}</text>

					<view class="hero-addr">
						<text class="addr-label">地点</text>
						<text class="addr-text">{{ addrText }}</text>
					</view>

					<view class="hero-tags">
						<view class="tag">
							<text class="tag-text">{{ info.type }}</text>
						</view>
						<view class="tag">
							<text class="tag-text">{{ info.game.startTime }}</text>
						</view>
						<view class="tag">
							<text class="tag-text">{{ feeText }}</text>
						</view>
					</view>
				</view>

				<!-- 已报名（本机走完流程后回看） -->
				<view v-if="info.joined" class="notice">
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
							<text class="info-card-tag">{{ info.levelLabel }}</text>
						</view>
						<view class="blinds-row">
							<view class="blind">
								<text class="blind-label">小盲 SB</text>
								<text class="blind-value">{{ info.smallBlind > 0 ? formatChips(info.smallBlind) : '—' }}</text>
							</view>
							<view class="blind-vs">
								<text class="blind-vs-text">VS</text>
							</view>
							<view class="blind blind-bb">
								<text class="blind-label">大盲 BB</text>
								<text class="blind-value">{{ info.bigBlind > 0 ? formatChips(info.bigBlind) : '—' }}</text>
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
								<text class="stack-num">{{ formatChips(info.game.startChips) }}</text>
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
								<text class="scale-num scale-num-green">{{ info.entrants }}</text>
								<text class="scale-label">参赛人数</text>
							</view>
							<view class="scale-divider"></view>
							<view class="scale-col">
								<text class="scale-num scale-num-green">{{ info.alive }}</text>
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
					</view>

					<!-- Card 5：共用蘑菇（剩余比例进度条 + 已用 / 剩余标签）-->
					<view class="info-card">
						<view class="info-card-head">
							<text class="info-card-title">共用蘑菇</text>
							<text class="info-card-sub">全桌共享 · 复活时消耗</text>
						</view>
						<view class="fungus-bar">
							<view class="fungus-bar-fill" :style="fungusBarStyle"></view>
						</view>
						<view class="fungus-info">
							<text class="fungus-info-left">已用 {{ fungusUsed }} / 共 {{ info.mushroomTotal }}</text>
							<text class="fungus-info-right">剩余 {{ info.mushroomLeft }} 个</text>
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
						<view v-for="a in info.assets" :key="a.key" class="asset">
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
						<view v-if="info.tables.length > 1" class="table-tabs">
							<view
								v-for="(t, ti) in info.tables"
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
							v-for="m in info.payMethods"
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
import { getGameSignup, emptyGameSignup } from '@/common/game-signup'
import type { GameSignupInfo, SignupSeat, SignupTable, PayMethod } from '@/common/game-signup'
import { joinedSeatOf, markJoined } from '@/common/joined-store'

/* ---------------- 牌桌几何：与样式里的 .ring / .felt 尺寸一一对应 ---------------- */
// 11 个槽位：0 号给荷官（正上方），1~10 是 10 个座位
const RING_SLOTS : number = 11
const RING_CX : number = 345      // 容器 690rpx 宽的一半
const RING_CY : number = 330      // 容器 660rpx 高的一半
const RING_RX : number = 285
const RING_RY : number = 235
const SEAT_SIZE : number = 80

const signup = ref<GameSignupInfo | null>(null)
const activeTable = ref(0)
const pickedTable = ref(-1)                 // -1 = 还没选
const pickedSeats = ref<number[]>([])       // 每桌各自记一个，避免切桌丢选择
const payKey = ref('')

const info = computed<GameSignupInfo>((): GameSignupInfo => {
	const s : GameSignupInfo | null = signup.value
	return s == null ? emptyGameSignup() : s
})

const valid = computed<boolean>((): boolean => info.value.game.id != '')

onLoad((options : any) : void => {
	// onLoad 实际入参就是普通 { id: string } 对象，直接键访问（与详情页同口径）
	const raw : string | undefined = options != null ? options.id : undefined
	const id : string = raw == null ? '' : raw
	const data : GameSignupInfo | null = getGameSignup(id)
	signup.value = data
	if (data != null) { initPicks(data) }
})

/* ---------------- 初始化：座位回填 + 默认支付方式 ---------------- */
const initPicks = (data : GameSignupInfo) : void => {
	const seats : number[] = []
	for (let i : number = 0; i < data.tables.length; i++) { seats.push(0) }

	// 默认停在第一张有空位的桌：满桌切过去也选不了座位
	let firstFree : number = 0
	for (let i : number = 0; i < data.tables.length; i++) {
		if (data.tables[i].free > 0) { firstFree = i; break }
	}
	activeTable.value = firstFree

	// 已报名的人回看本页：把当时锁定的座位回填高亮
	const mine : number[] = joinedSeatOf(data.game.id)
	if (mine[0] > 0 && mine[0] <= seats.length) {
		seats[mine[0] - 1] = mine[1]
		pickedTable.value = mine[0] - 1
		activeTable.value = mine[0] - 1
	}

	pickedSeats.value = seats
	payKey.value = firstAvailablePay(data.payMethods)
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

const statusColor = (status : string) : string => {
	if (status == '进行中') { return '#D9A441' }
	if (status == '报名中') { return '#E8C275' }
	if (status == '即将开始') { return '#7AB6F2' }
	return '#A0A5A3'
}

const statusBg = (status : string) : string => {
	if (status == '进行中') { return 'rgba(217,164,65,0.20)' }
	if (status == '报名中') { return 'rgba(232,194,117,0.22)' }
	if (status == '即将开始') { return 'rgba(96,160,210,0.20)' }
	return 'rgba(255,255,255,0.08)'
}

const statusBgStyle = computed<string>((): string => 'background-color:' + statusBg(info.value.game.status) + ';')
const statusColorStyle = computed<string>((): string => 'color:' + statusColor(info.value.game.status) + ';')

// 座位坐标：椭圆环上均匀分布，0 号槽位在正上方（荷官）
const seatStyle = (slot : number) : string => {
	const deg : number = -90 + slot * (360 / RING_SLOTS)
	const rad : number = deg * Math.PI / 180
	const x : number = RING_CX + RING_RX * Math.cos(rad) - SEAT_SIZE / 2
	const y : number = RING_CY + RING_RY * Math.sin(rad) - SEAT_SIZE / 2
	return 'left:' + Math.round(x).toString() + 'rpx;top:' + Math.round(y).toString() + 'rpx;'
}

/* ---------------- 概览 / 信息 ---------------- */
const addrText = computed<string>((): string => {
	const i : GameSignupInfo = info.value
	return i.address.length > 0 ? (i.city + ' · ' + i.address) : i.city
})

const feeText = computed<string>((): string => info.value.fee > 0 ? ('报名费 ¥' + info.value.fee) : '免报名费')

// 「赛事信息」5 张主题卡需要的派生数据：进度条宽度 + 复活文案
// 旧的 stats 数组已废弃（stat-grid 被 info-card 整体替代）
const signupAlivePct = computed<number>((): number => {
	const i : GameSignupInfo = info.value
	if (i.entrants <= 0) { return 0 }
	return Math.round(i.alive / i.entrants * 100)
})
const signupAliveBarStyle = computed<string>((): string => 'width:' + signupAlivePct.value.toString() + '%;')

// 蘑菇条按"剩余"比例填充金色：让"还有几个能拿"一眼可见
const fungusUsed = computed<number>((): number => {
	const i : GameSignupInfo = info.value
	const used : number = i.mushroomTotal - i.mushroomLeft
	return used < 0 ? 0 : used
})
const fungusBarStyle = computed<string>((): string => {
	const i : GameSignupInfo = info.value
	if (i.mushroomTotal <= 0) { return 'width:0%;' }
	const left : number = i.mushroomLeft < 0 ? 0 : i.mushroomLeft
	const pct : number = Math.round(left / i.mushroomTotal * 100)
	return 'width:' + pct.toString() + '%;'
})

const rebuyText = computed<string>((): string => {
	const n : number = info.value.rebuyCount
	return n > 0 ? (n.toString() + ' 次') : '不支持'
})

/* ---------------- 座位 ---------------- */
const activeTableInfo = computed<SignupTable>((): SignupTable => {
	const list : SignupTable[] = info.value.tables
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
	if (info.value.joined) {
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
	const pay : PayMethod | null = payOf(info.value.payMethods, payKey.value)
	return pay == null ? '暂无可用支付方式' : ('已选：' + pay.name)
})

const footPayText = computed<string>((): string => {
	const pay : PayMethod | null = payOf(info.value.payMethods, payKey.value)
	if (pay == null) { return '未选择支付方式' }
	const tail : string = pay.available ? '' : ('（' + pay.reason + '）')
	return '支付：' + pay.name + tail
})

const confirmText = computed<string>((): string => info.value.joined ? '已报名' : '确认参赛')

const onTapPay = (m : PayMethod) : void => {
	if (info.value.joined) {
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
const onConfirm = () : void => {
	const i : GameSignupInfo = info.value
	if (i.joined) {
		uni.showToast({ title: '你已报名本场比赛，座位已锁定', icon: 'none' })
		return
	}
	const t : number = pickedTable.value
	const seatNo : number = pickedNoOf(t)
	if (t < 0 || seatNo <= 0) {
		uni.showToast({ title: '请先点击选择一个座位', icon: 'none' })
		return
	}
	const pay : PayMethod | null = payOf(i.payMethods, payKey.value)
	if (pay == null) {
		uni.showToast({ title: '请选择支付方式', icon: 'none' })
		return
	}
	if (!pay.available) {
		uni.showToast({ title: pay.reason, icon: 'none' })
		return
	}

	markJoined(i.game.id, t + 1, seatNo)
	uni.showToast({ title: '报名成功 · 座位已锁定', icon: 'success' })
	setTimeout((): void => { uni.navigateBack() }, 900)
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
