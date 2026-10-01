<template>
	<scroll-view
		class="page"
		direction="vertical"
		:show-scrollbar="false"
		:refresher-enabled="true"
		refresher-default-style="white"
		:refresher-triggered="refreshing"
		@refresherrefresh="onRefresh"
		@scrolltolower="loadMore"
	>

		<!-- ============ 顶栏：进行中数 + 两个创建入口 ============ -->
		<view class="topbar">
			<view class="count-wrap">
				<text class="count-num">{{ activeCount }}</text>
				<text class="count-label">场进行中</text>
			</view>
			<view class="topbar-btns">
				<view class="add-btn-outline" @tap="onTapCreate('match')">
					<text class="add-btn-outline-text">＋ 创建比赛</text>
				</view>
				<view class="add-btn" @tap="onTapCreate('reservation')">
					<text class="add-btn-text">＋ 创建预约</text>
				</view>
			</view>
		</view>

		<!-- ============ 比赛列表（触底加载） ============ -->
		<view
			v-for="t in visible"
			:key="t.id"
			class="card"
			:class="statusClass(t.status)"
			@tap="onTapCard(t)"
		>
			<!-- 左侧状态色 accent bar -->
			<view class="card-accent"></view>

			<view class="card-body">
				<!-- 头部：名称 + 状态徽标 -->
				<view class="card-head">
					<text class="t-name">{{ t.name }}</text>
					<view class="status-badge" :class="statusClass(t.status)">
						<text class="status-badge-text">{{ statusLabelOf(t.status) }}</text>
					</view>
				</view>

				<!-- 店铺 pill + 类型 + 级别 + 预约标 + 开打时间 -->
				<view class="meta-row">
					<view class="store-pill">
						<text class="store-pill-text">{{ t.storeName }}</text>
					</view>
					<text class="meta-sep">·</text>
					<text class="meta-type">{{ t.typeName }}</text>
					<text class="meta-sep">·</text>
					<text class="meta-level">Lv.{{ t.currentLevel }}</text>
					<text v-if="t.scheduled == 1" class="meta-sep">·</text>
					<text v-if="t.scheduled == 1" class="meta-reserve">预约</text>
					<text class="meta-sep">·</text>
					<text class="meta-time">{{ t.startTime }}</text>
				</view>

				<!-- 核心 3 列：开桌 / 起始筹码 / 入场金额 -->
				<view class="stat-grid">
					<view class="stat-cell">
						<text class="stat-num">{{ t.deskCount }}</text>
						<text class="stat-label">开桌</text>
					</view>
					<view class="stat-cell">
						<text class="stat-num">{{ t.originChips }}</text>
						<text class="stat-label">初始筹码</text>
					</view>
					<view class="stat-cell">
						<text class="stat-num">¥{{ t.joinAmount }}</text>
						<text class="stat-label">入场金额</text>
					</view>
				</view>

				<!-- 盲注结构 + 复活/蘑菇 chips -->
				<view class="info-row">
					<view class="info-chip">
						<text class="info-chip-key">盲注</text>
						<text class="info-chip-val">{{ t.minChips }}/{{ t.maxChips }}</text>
					</view>
					<view class="info-chip">
						<text class="info-chip-key">预制分</text>
						<text class="info-chip-val">{{ t.preChips }}</text>
					</view>
					<view class="info-chip">
						<text class="info-chip-key">复活</text>
						<text class="info-chip-val">{{ t.userReliveCount }}</text>
					</view>
					<view class="info-chip">
						<text class="info-chip-key">蘑菇</text>
						<text class="info-chip-val">{{ t.mushReliveCount }}</text>
					</view>
				</view>

				<!-- 奖励摘要 -->
				<view class="prize-row">
					<view class="prize-cell">
						<text class="prize-rank prize-rank-1">1st</text>
						<text class="prize-val">{{ t.rankOneScore }}分 · {{ t.rankOneTicket }}票</text>
					</view>
					<view class="prize-cell">
						<text class="prize-rank">2nd</text>
						<text class="prize-val">{{ t.rankTwoScore }}分 · {{ t.rankTwoTicket }}票</text>
					</view>
					<view class="prize-cell">
						<text class="prize-rank">3rd</text>
						<text class="prize-val">{{ t.rankThreeScore }}分 · {{ t.rankThreeTicket }}票</text>
					</view>
				</view>

				<!-- 入场方式（至少有一个开启时才显示） -->
				<view v-if="t.joinTicket > 0 || t.joinMonthTicket > 0 || t.joinInviteCard > 0" class="entry-row">
					<text class="entry-label">入场</text>
					<view v-if="t.joinTicket > 0" class="entry-chip entry-on">
						<text class="entry-chip-text">门票</text>
					</view>
					<view v-if="t.joinMonthTicket > 0" class="entry-chip entry-on">
						<text class="entry-chip-text">月票</text>
					</view>
					<view v-if="t.joinInviteCard > 0" class="entry-chip entry-on">
						<text class="entry-chip-text">直通</text>
					</view>
				</view>

				<!-- 操作按钮栏（阻止冒泡，避免触发卡片跳转详情） -->
				<view v-if="t.status !== 'F'" class="actions" @tap.stop="">
					<view class="act act-primary" @tap.stop="onTapEdit(t)">
						<text class="act-primary-text">编辑比赛</text>
					</view>
					<view v-if="t.status == 'P'" class="act act-danger" @tap.stop="onTapEnd(t)">
						<text class="act-danger-text">结束比赛</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 加载状态脚注 -->
		<view class="list-foot">
			<text class="list-foot-text">{{ loading ? '加载中…' : (noMore ? '— 没有更多了 —' : '上拉加载更多') }}</text>
		</view>

		<view class="footer-blank"></view>
	</scroll-view>

	<!-- ============ 创建 / 编辑比赛（弹层） ============ -->
	<!-- 弹层用 height + max-height 撑高，内部 scroll-view 处理长表单 -->
	<view v-if="dialog.visible" class="dlg-overlay" @tap="onTapDlgMask">
		<view class="dlg-card" @tap.stop="">
			<!-- 顶部拖拽把手 -->
			<view class="dlg-handle">
				<view class="dlg-handle-bar"></view>
			</view>
			<view class="dlg-head">
				<view class="dlg-head-info">
					<text class="dlg-title">{{ dialog.mode == 'create' ? '创建比赛' : '编辑比赛' }}</text>
					<text class="dlg-sub">填写比赛信息 · 保存后实时同步至客户端</text>
				</view>
				<view class="dlg-close" @tap="onTapDlgCancel">
					<text class="dlg-close-text">✕</text>
				</view>
			</view>

			<scroll-view :scroll-y="true" class="dlg-body" :show-scrollbar="false">

				<!-- 类型：比赛 / 预约 -->
				<view class="seg-row">
					<view class="seg-cell" :class="{ 'seg-on': dialog.form.scheduled === 0 }" @tap="onTapSetMode('match')">
						<text class="seg-text" :class="{ 'seg-text-on': dialog.form.scheduled === 0 }">比赛</text>
					</view>
					<view class="seg-cell" :class="{ 'seg-on': dialog.form.scheduled === 1 }" @tap="onTapSetMode('reservation')">
						<text class="seg-text" :class="{ 'seg-text-on': dialog.form.scheduled === 1 }">预约</text>
					</view>
				</view>

				<!-- ============ 基本信息 ============ -->
				<view class="section">
					<view class="section-bar"></view>
					<text class="section-text">基本信息</text>
				</view>

				<view class="group">
					<!-- 比赛名称 -->
					<view class="field">
						<text class="field-label">比赛名称</text>
						<input
							class="field-input"
							type="text"
							:value="dialog.form.name"
							placeholder="如：周末深筹赛"
							placeholder-class="field-ph"
							@input="onNameInput"
						/>
					</view>

					<!-- 选择店铺 -->
					<view class="field">
						<text class="field-label">选择店铺</text>
						<view class="select-btn" @tap="onTapPickStore">
							<text
								class="select-btn-text"
								:class="{ 'select-btn-ph': dialog.form.storeName.length == 0 }"
							>{{ dialog.form.storeName.length > 0 ? dialog.form.storeName : '点击选择比赛门店' }}</text>
							<text class="select-btn-arrow">›</text>
						</view>
					</view>

					<!-- 选择比赛类型：chip 横排，flex-wrap -->
					<view class="field">
						<text class="field-label">比赛类型</text>
						<view class="chip-row">
							<view
								v-for="t in tournamentTypeNames"
								:key="t"
								class="chip-cell"
								:class="{ 'chip-on': dialog.form.typeName === t }"
								@tap="onTapSetType(t)"
							>
								<text class="chip-cell-text" :class="{ 'chip-cell-text-on': dialog.form.typeName === t }">{{ t }}</text>
							</view>
						</view>
					</view>

					<!-- 预约时间（仅预约模式显示）：uni-app x 的 picker 不支持 datetime，拆成 date + time 两个 -->
					<view v-if="dialog.form.scheduled === 1" class="field">
					<text class="field-label">预约时间</text>
					<view class="row-date-time">
						<picker
							mode="date"
							:value="dialog.reserveDate"
							:start="dateMin"
							:end="dateMax"
							@change="onReserveDateChange"
						>
							<view class="select-btn select-btn-half">
								<text
									class="select-btn-text"
									:class="{ 'select-btn-ph': dialog.reserveDate.length == 0 }"
								>{{ dialog.reserveDate.length > 0 ? dialog.reserveDate : '选择日期' }}</text>
								<text class="select-btn-arrow">›</text>
							</view>
						</picker>
						<picker
							mode="time"
							:value="dialog.reserveTime"
							@change="onReserveTimeChange"
						>
							<view class="select-btn select-btn-half">
								<text
									class="select-btn-text"
									:class="{ 'select-btn-ph': dialog.reserveTime.length == 0 }"
								>{{ dialog.reserveTime.length > 0 ? dialog.reserveTime : '选择时间' }}</text>
								<text class="select-btn-arrow">›</text>
							</view>
						</picker>
					</view>
				</view>
				</view>

				<!-- ============ 比赛参数 ============ -->
				<view class="section">
					<view class="section-bar"></view>
					<text class="section-text">比赛参数</text>
				</view>

				<view class="group">
					<!-- 开桌 / 初始筹码 / 当前级别 -->
					<view class="row3">
						<view class="row3-cell">
							<text class="field-label">开桌数量</text>
							<input class="field-input field-input-num" type="number" :value="String(dialog.form.deskCount)" @input="onNum('deskCount', $event)" />
						</view>
						<view class="row3-cell">
							<text class="field-label">初始筹码</text>
							<input class="field-input field-input-num" type="number" :value="String(dialog.form.originChips)" @input="onNum('originChips', $event)" />
						</view>
						<view class="row3-cell">
							<text class="field-label">当前级别</text>
							<picker mode="selector" :range="levelOptions" :value="levelIndex" @change="onLevelChange">
								<view class="select-btn">
									<text class="select-btn-text">Lv.{{ dialog.form.currentLevel }}</text>
									<text class="select-btn-arrow">›</text>
								</view>
							</picker>
						</view>
					</view>

					<!-- 小盲注 / 大盲注 -->
					<view class="row3">
						<view class="row3-cell">
							<text class="field-label">小盲注</text>
							<input class="field-input field-input-num" type="number" :value="String(dialog.form.minChips)" @input="onNum('minChips', $event)" />
						</view>
						<view class="row3-cell">
							<text class="field-label">大盲注</text>
							<input class="field-input field-input-num" type="number" :value="String(dialog.form.maxChips)" @input="onNum('maxChips', $event)" />
						</view>
						<view class="row3-cell"></view>
					</view>

				<!-- 预制分 / 个人复活 / 共用蘑菇 -->
				<view class="row3">
					<view class="row3-cell">
						<text class="field-label">预制分</text>
						<input class="field-input field-input-num" type="number" :value="String(dialog.form.preChips)" @input="onNum('preChips', $event)" />
					</view>
					<view class="row3-cell">
						<text class="field-label">个人复活</text>
						<input class="field-input field-input-num" type="number" :value="String(dialog.form.userReliveCount)" @input="onNum('userReliveCount', $event)" />
					</view>
					<view class="row3-cell">
						<text class="field-label">共用蘑菇</text>
						<input class="field-input field-input-num" type="number" :value="String(dialog.form.mushReliveCount)" @input="onNum('mushReliveCount', $event)" />
					</view>
				</view>

				<!-- 1~6级时间 / 7~20级时间（分钟） -->
				<view class="row3">
					<view class="row3-cell">
						<text class="field-label">1~6级时间（分）</text>
						<input class="field-input field-input-num" type="number" :value="String(dialog.form.firstHalfDuration)" @input="onNum('firstHalfDuration', $event)" />
					</view>
					<view class="row3-cell">
						<text class="field-label">7~20级时间（分）</text>
						<input class="field-input field-input-num" type="number" :value="String(dialog.form.secondHalfDuration)" @input="onNum('secondHalfDuration', $event)" />
					</view>
					<view class="row3-cell"></view>
				</view>

				<!-- 入场金额 / 入场门票 / 月票 / 直通函（同属入场参数） -->
				<view class="field">
					<text class="field-label">入场金额（元）</text>
					<input class="field-input field-input-num" type="number" :value="String(dialog.form.joinAmount)" @input="onNum('joinAmount', $event)" />
				</view>
				<view class="row3">
					<view class="row3-cell">
						<text class="field-label">入场门票</text>
						<input class="field-input field-input-num" type="number" :value="String(dialog.form.joinTicket)" @input="onNum('joinTicket', $event)" />
					</view>
					<view class="row3-cell">
						<text class="field-label">入场月票</text>
						<input class="field-input field-input-num" type="number" :value="String(dialog.form.joinMonthTicket)" @input="onNum('joinMonthTicket', $event)" />
					</view>
					<view class="row3-cell">
						<text class="field-label">直通函</text>
						<input class="field-input field-input-num" type="number" :value="String(dialog.form.joinInviteCard)" @input="onNum('joinInviteCard', $event)" />
					</view>
				</view>
				</view>

				<!-- ============ 奖励设置 ============ -->
				<view class="section">
					<view class="section-bar"></view>
					<text class="section-text">奖励设置</text>
				</view>

				<view class="group">
					<view
						v-for="p in prizeRows"
						:key="p.key"
						class="prize-edit"
					>
						<view class="prize-edit-head">
							<view class="prize-edit-tag" :class="p.tagCls">
								<text class="prize-edit-tag-text">{{ p.tag }}</text>
							</view>
							<text class="prize-edit-name">{{ p.name }}</text>
						</view>
						<view class="row3">
							<view class="row3-cell">
								<text class="field-label">积分</text>
								<input class="field-input field-input-num" type="number" :value="String(p.score)" @input="onNum(p.scoreField, $event)" />
							</view>
							<view class="row3-cell">
								<text class="field-label">{{ prizeTicketLabel }}</text>
								<input class="field-input field-input-num" type="number" :value="String(p.ticket)" @input="onNum(p.ticketField, $event)" />
							</view>
							<view class="row3-cell"></view>
						</view>
					</view>
				</view>

				<!-- 内联错误 -->
				<text v-if="dialog.error.length > 0" class="dlg-error">{{ dialog.error }}</text>

				<!-- 底部留白，防止最后一行贴底 -->
				<view class="dlg-foot-spacer"></view>
			</scroll-view>

			<view class="dlg-btns">
				<view class="dlg-btn dlg-btn-cancel" @tap="onTapDlgCancel">
					<text class="dlg-btn-text dlg-btn-cancel-text">取消</text>
				</view>
				<view class="dlg-btn dlg-btn-ok" @tap="onTapDlgSave">
					<text class="dlg-btn-text dlg-btn-ok-text">{{ saving ? '保存中…' : '保存' }}</text>
				</view>
			</view>
		</view>
	</view>

	<!-- ============ 选店铺弹层 ============ -->
	<view v-if="storePicker.visible" class="pk-overlay" @tap="onTapStorePickerMask">
		<view class="pk-card" @tap.stop="">
			<view class="pk-head">
				<text class="pk-title">选择店铺</text>
				<text class="pk-sub">从已注册的门店中选择一家作为比赛场地</text>
			</view>
			<view class="pk-search">
				<view class="pk-search-icon">
					<text class="pk-search-icon-text">搜</text>
				</view>
				<input
					class="pk-input"
					type="text"
					:value="storePicker.keyword"
					placeholder="搜索店铺名称"
					placeholder-class="field-ph"
					@input="onStoreKeywordInput"
				/>
			</view>
			<scroll-view class="pk-list" direction="vertical" :show-scrollbar="false">
				<view
					v-for="s in storeSearchResults"
					:key="s.id"
					class="pk-row"
					:class="{ 'pk-row-on': dialog.form.storeId == s.id }"
					@tap="onTapStoreRow(s)"
				>
					<view class="pk-avatar">
						<text class="pk-avatar-text">{{ s.name.substring(0, 1) }}</text>
					</view>
					<view class="pk-user">
						<text class="pk-user-name">{{ s.name }}</text>
						<text class="pk-user-id">{{ s.id }} · {{ s.address }}</text>
					</view>
					<view v-if="dialog.form.storeId == s.id" class="pk-check pk-check-on">
						<text class="pk-check-text">✓</text>
					</view>
				</view>
				<view v-if="storeSearchResults.length == 0" class="pk-empty">
					<text class="pk-empty-text">未找到匹配店铺</text>
				</view>
			</scroll-view>
			<view class="dlg-btns">
				<view class="dlg-btn dlg-btn-cancel" @tap="onTapStorePickerCancel">
					<text class="dlg-btn-text dlg-btn-cancel-text">关闭</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
	TOURNAMENT_TYPES
} from '@/common/admin-tournament-data'
import type { TournamentMode } from '@/common/admin-tournament-data'
import { fetchSimpleStores } from '@/common/store-api'
import type { SimpleStoreVO } from '@/common/store-api'
import { createMatch, endMatch, emptyMatchVO, fetchMatchManageList, fetchMatchRules, fetchMatchTypes } from '@/common/match-api'
import { statusLabelOf } from '@/common/game-detail'
import type { MatchSavePayload, MatchRuleVO, MatchTypeVO, MatchVO } from '@/common/match-api'

/* ---------------- 状态徽标样式（status 为后端状态码：P=进行中 C=报名中 S=暂停 F=已结束） ---------------- */
const statusClass = (code : string) : string => {
	switch (code) {
		case 'P': return 'status-active'
		case 'C': return 'status-signup'
		case 'S': return 'status-paused'
		case 'F': return 'status-ended'
	}
	return 'status-active'
}

/* ---------------- 列表（直接消费 MatchVO，无中间映射） ---------------- */
const PAGE_SIZE : number = 10
const visible = ref<MatchVO[]>([])
const loading = ref(false)
const noMore = ref(false)
const total = ref(0)
const currentPage = ref(0)
const refreshing = ref(false)        // 下拉刷新圈状态

const loadMore = () : Promise<void> => {
	if (loading.value || noMore.value) { return Promise.resolve() }
	loading.value = true
	const nextPage : number = currentPage.value + 1
	return fetchMatchManageList(nextPage, PAGE_SIZE).then((page) => {
		const chunk : MatchVO[] = page.list || []
		visible.value = visible.value.concat(chunk)
		currentPage.value = nextPage
		total.value = page.total ?? visible.value.length
		// 以本页实际返回条数判断是否还有下一页
		if (chunk.length < PAGE_SIZE) { noMore.value = true }
	}).catch(() => {
		console.log('loadMore failed')
	}).finally(() => {
		loading.value = false
	})
}

const refreshTournaments = () : Promise<void> => {
	visible.value = []
	currentPage.value = 0
	total.value = 0
	noMore.value = false
	return loadMore()
}

/* 下拉刷新：重置分页拉第一页，完成后收起刷新圈 */
const onRefresh = () : void => {
	if (refreshing.value) { return }
	refreshing.value = true
	refreshTournaments().finally(() => {
		refreshing.value = false
	})
}

/* ---------------- 预加载：比赛类型 + 等级规则 ---------------- */
const matchTypes = ref<MatchTypeVO[]>([])
const matchRules = ref<MatchRuleVO[]>([])
const tournamentTypeNames = computed<string[]>(() => {
	if (matchTypes.value.length > 0) {
		return matchTypes.value.map((t) => t.name)
	}
	return TOURNAMENT_TYPES as unknown as string[]   // 接口未通时兜底用本地枚举
})

onMounted((): void => {
	loadMore()
	// 并行预加载类型 + 规则（失败不阻塞列表渲染，UI 走兜底）
	Promise.all([
		fetchMatchTypes().then((list) => { matchTypes.value = list }).catch(() => {}),
		fetchMatchRules().then((list) => { matchRules.value = list }).catch(() => {})
	])
})
onReachBottom((): void => { loadMore() })

/* 顶部「进行中」数：从 visible 计算（P=进行中） */
const activeCount = computed<number>((): number => {
	let n = 0
	for (let i = 0; i < visible.value.length; i++) {
		if (visible.value[i].status == 'P') { n++ }
	}
	return n
})

/* ---------------- 创建 / 编辑弹层 ---------------- */
// 深拷贝默认表单，避免污染；form 直接是 MatchVO 结构
// reserveDate / reserveTime 是 picker 用的两个本地字段（uni-app x 不支持 datetime 模式），保存时合并为 form.startTime
type DialogMode = 'create' | 'edit'
type DialogState = {
	visible : boolean
	mode : DialogMode
	form : MatchVO
	reserveDate : string             // YYYY-MM-DD
	reserveTime : string             // HH:mm
	error : string
}
const dialog = ref<DialogState>({
	visible: false,
	mode: 'create',
	form: emptyMatchVO(0),
	reserveDate: '',
	reserveTime: '',
	error: ''
})

// picker date 的可选范围：过去 30 天 → 未来 180 天（预约主要是未来，再保留历史便于补录）
const dateMin = computed<string>((): string => {
	const d : Date = new Date()
	d.setDate(d.getDate() - 30)
	return ymd(d)
})
const dateMax = computed<string>((): string => {
	const d : Date = new Date()
	d.setDate(d.getDate() + 180)
	return ymd(d)
})
// YYYY-MM-DD 拼接（避免 padStart 兼容性）
const ymd = (d : Date) : string => {
	const y : string = d.getFullYear().toString()
	const m : string = (d.getMonth() + 1).toString()
	const dd : string = d.getDate().toString()
	return y + '-' + (m.length == 1 ? '0' + m : m) + '-' + (dd.length == 1 ? '0' + dd : dd)
}
// 解析 "YYYY-MM-DD HH:mm" 为 [date, time]；空串返回 ["", ""]
const splitReserveAt = (s : string) : string[] => {
	if (!s) { return ['', ''] }
	const idx : number = s.indexOf(' ')
	if (idx < 0) { return [s, ''] }
	return [s.substring(0, idx), s.substring(idx + 1)]
}

const onTapCreate = (mode : TournamentMode) : void => {
	const tomorrow : Date = new Date()
	tomorrow.setDate(tomorrow.getDate() + 1)
	dialog.value = {
		visible: true,
		mode: 'create',
		form: emptyMatchVO(mode == 'reservation' ? 1 : 0),
		// 默认预约时间为「明天 20:00」；模式切换会在 onTapSetMode 里清掉
		reserveDate: mode == 'reservation' ? ymd(tomorrow) : '',
		reserveTime: mode == 'reservation' ? '20:00' : '',
		error: ''
	}
}

const onTapCard = (t : MatchVO) : void => {
	uni.navigateTo({ url: '/pages/game-detail/game-detail?id=' + t.id })
}

const onTapEdit = (t : MatchVO) : void => {
	// 已结束的比赛不可编辑（双重守卫：按钮已隐藏，这里兜底）
	if (t.status === 'F') {
		uni.showToast({ title: '已结束的比赛不可编辑', icon: 'none' })
		return
	}
	// 深拷贝：避免编辑中直接修改源数据
	const parts : string[] = splitReserveAt(t.startTime)
	dialog.value = {
		visible: true,
		mode: 'edit',
		form: { ...t },
		reserveDate: parts[0],
		reserveTime: parts[1],
		error: ''
	}
}

const onTapDlgCancel = () : void => { dialog.value.visible = false }
const onTapDlgMask = () : void => { dialog.value.visible = false }

/* ---------------- 模式 / 类型选择 ---------------- */
const onTapSetMode = (mode : TournamentMode) : void => {
	dialog.value.form.scheduled = mode === 'reservation' ? 1 : 0
	if (mode === 'match') {
		// 切回「比赛」时清掉预约时间，避免脏数据
		dialog.value.reserveDate = ''
		dialog.value.reserveTime = ''
		dialog.value.form.startTime = ''
	} else if (mode === 'reservation' && dialog.value.reserveDate.length == 0) {
		// 首次切到「预约」时给个默认时间（明天 20:00）
		const tomorrow : Date = new Date()
		tomorrow.setDate(tomorrow.getDate() + 1)
		dialog.value.reserveDate = ymd(tomorrow)
		dialog.value.reserveTime = '20:00'
	}
	if (dialog.value.error) { dialog.value.error = '' }
}

/**
 * 选中比赛类型 → 记录 typeId 并自动回填该类型对应的参数
 * 从预加载的 matchTypes 里按 name 匹配，找到后回填：
 *   originChips → originChips
 *   joinAmount  → joinAmount
 *   joinTicket → joinTicket（入场票数）
 *   userReliveCount → userReliveCount
 *   mushReliveCount → mushReliveCount
 *   rankOne/Two/ThreeScore → rankOne/Two/ThreeScore
 *   rankOne/Two/ThreeTicket → rankOne/Two/ThreeTicket
 */
const onTapSetType = (t : string) : void => {
	dialog.value.form.typeName = t
	// 从预加载数据查找匹配的类型配置
	const matched = matchTypes.value.find((m) => m.name === t)
	if (matched) {
		dialog.value.form.type = matched.id
		dialog.value.form.originChips = matched.originChips
		dialog.value.form.joinAmount = matched.joinAmount
		dialog.value.form.joinTicket = matched.joinTicket
		dialog.value.form.joinMonthTicket = matched.joinMonthTicket
		dialog.value.form.joinInviteCard = matched.joinInviteCard
		dialog.value.form.userReliveCount = matched.userReliveCount
		dialog.value.form.mushReliveCount = matched.mushReliveCount
		dialog.value.form.rankOneScore = matched.rankOneScore
		dialog.value.form.rankOneTicket = matched.rankOneTicket
		dialog.value.form.rankTwoScore = matched.rankTwoScore
		dialog.value.form.rankTwoTicket = matched.rankTwoTicket
		dialog.value.form.rankThreeScore = matched.rankThreeScore
		dialog.value.form.rankThreeTicket = matched.rankThreeTicket
	}
	if (dialog.value.error) { dialog.value.error = '' }
}

/* ---------------- 表单输入 ---------------- */
// 奖励设置三行（1st/2nd/3rd）数据驱动：模板 v-for 渲染，输入走 onNum(field)
type PrizeRow = {
	key : string
	tag : string
	name : string
	tagCls : string
	score : number
	ticket : number
	scoreField : string
	ticketField : string
}
// 名次奖励第二列标签：随比赛类型联动（周赛→月票，月赛→直通函，其余→门票）
const prizeTicketLabel = computed<string>((): string => {
	const t : string = dialog.value.form.typeName
	if (t.indexOf('周赛') >= 0) { return '月票' }
	if (t.indexOf('月赛') >= 0) { return '直通函' }
	return '门票'
})

const prizeRows = computed<PrizeRow[]>((): PrizeRow[] => {
	const f : any = dialog.value.form
	return [
		{ key: 'one', tag: '1st', name: '第一名', tagCls: 'prize-edit-tag-1', score: f.rankOneScore, ticket: f.rankOneTicket, scoreField: 'rankOneScore', ticketField: 'rankOneTicket' },
		{ key: 'two', tag: '2nd', name: '第二名', tagCls: 'prize-edit-tag-2', score: f.rankTwoScore, ticket: f.rankTwoTicket, scoreField: 'rankTwoScore', ticketField: 'rankTwoTicket' },
		{ key: 'three', tag: '3rd', name: '第三名', tagCls: 'prize-edit-tag-3', score: f.rankThreeScore, ticket: f.rankThreeTicket, scoreField: 'rankThreeScore', ticketField: 'rankThreeTicket' }
	]
})

const onNameInput = (e : any) : void => {
	dialog.value.form.name = (e.detail.value || '').toString()
	if (dialog.value.error) { dialog.value.error = '' }
}

// 通用数值字段：数字输入框，兼容空字符串（→ 0）
const onNum = (field : string, e : any) : void => {
	const s : string = (e.detail.value || '').toString()
	const n : number = parseInt(s, 10)
	;(dialog.value.form as any)[field] = isNaN(n) ? 0 : n
	if (dialog.value.error) { dialog.value.error = '' }
}

/* ---------------- 当前级别：从 /match/rule 等级规则中选择，选中后同步盲注/预制分 ---------------- */
const levelOptions = computed<string[]>((): string[] => {
	if (matchRules.value.length > 0) {
		return matchRules.value.map((r) => 'Lv.' + r.matchLevel)
	}
	// 规则接口未通时兜底 1~20 级
	const out : string[] = []
	for (let i = 1; i <= 20; i++) { out.push('Lv.' + i) }
	return out
})

const levelIndex = computed<number>((): number => {
	const lv : number = dialog.value.form.currentLevel
	for (let i = 0; i < matchRules.value.length; i++) {
		if (matchRules.value[i].matchLevel === lv) { return i }
	}
	return 0
})

const onLevelChange = (e : any) : void => {
	const idx : number = parseInt((e.detail.value ?? '0').toString(), 10)
	if (isNaN(idx) || idx < 0) { return }
	if (matchRules.value.length > 0) {
		const r = matchRules.value[idx]
		if (!r) { return }
		dialog.value.form.currentLevel = r.matchLevel
		// 同步该等级对应的盲注与预制分
		dialog.value.form.minChips = r.minChips
		dialog.value.form.maxChips = r.maxChips
		dialog.value.form.preChips = r.preChips
	} else {
		dialog.value.form.currentLevel = idx + 1
	}
	if (dialog.value.error) { dialog.value.error = '' }
}

// 两个 picker 各自回填：date + time，保存时合并为 form.startTime
const onReserveDateChange = (e : any) : void => {
	dialog.value.reserveDate = (e.detail.value || '').toString()
	if (dialog.value.error) { dialog.value.error = '' }
}
const onReserveTimeChange = (e : any) : void => {
	dialog.value.reserveTime = (e.detail.value || '').toString()
	if (dialog.value.error) { dialog.value.error = '' }
}

/* ---------------- 选店铺弹层 ---------------- */
type StorePickerState = {
	visible : boolean
	keyword : string
}
const storePicker = ref<StorePickerState>({ visible: false, keyword: '' })
// 精简店铺列表（store/simple-list），打开弹层时拉取
const simpleStores = ref<SimpleStoreVO[]>([])

const onTapPickStore = () : void => {
	storePicker.value = { visible: true, keyword: '' }
	// 每次打开都拉最新；失败不阻塞弹层（列表为空展示「未找到匹配店铺」）
	fetchSimpleStores().then((list) => {
		simpleStores.value = list
	}).catch(() => {})
}

const onTapStorePickerMask = () : void => { storePicker.value.visible = false }
const onTapStorePickerCancel = () : void => { storePicker.value.visible = false }

const onStoreKeywordInput = (e : any) : void => {
	storePicker.value.keyword = (e.detail.value || '').toString()
}

// 搜索结果：空关键词展示全量；否则按店名过滤（接口已返回全量，本地过滤即可）
const storeSearchResults = computed<SimpleStoreVO[]>((): SimpleStoreVO[] => {
	const kw : string = storePicker.value.keyword.trim().toLowerCase()
	const all : SimpleStoreVO[] = simpleStores.value
	if (kw.length == 0) { return all }
	const out : SimpleStoreVO[] = []
	for (let i : number = 0; i < all.length; i++) {
		const s = all[i]
		if (s.name.toLowerCase().indexOf(kw) >= 0) { out.push(s) }
	}
	return out
})

const onTapStoreRow = (s : SimpleStoreVO) : void => {
	dialog.value.form.storeId = String(s.id)
	dialog.value.form.storeName = s.name
	if (dialog.value.error) { dialog.value.error = '' }
	storePicker.value.visible = false
}

/* ---------------- 保存 ---------------- */
const saving = ref(false)            // 防止重复提交

const onTapDlgSave = () : void => {
	if (saving.value) { return }
	const f = dialog.value.form

	// ---- 校验（对齐后端 DTO 校验提示） ----
	const name : string = f.name.trim()
	if (name.length == 0) { dialog.value.error = '请输入比赛名称'; return }
	if (name.length < 3 || name.length > 20) { dialog.value.error = '名称长度在3～20个字'; return }
	const storeIdNum : number = Number(f.storeId)
	if (!storeIdNum || storeIdNum < 1) { dialog.value.error = '请选择店铺'; return }
	if (f.type <= 0) { dialog.value.error = '请选择比赛类型'; return }
	if (f.deskCount < 1) { dialog.value.error = '最低开启一张桌'; return }
	if (f.scheduled == 1) {
		const combined : string = dialog.value.reserveDate + ' ' + dialog.value.reserveTime
		if (combined.trim().length < 6) { dialog.value.error = '请选择预约日期与时间'; return }
		f.startTime = combined
	} else {
		f.startTime = ''
	}

	// ---- 组 payload：form 字段名与后端 DTO 一致，直接同名字段拷贝 ----
	const payload : MatchSavePayload = {
		storeId: storeIdNum,
		matchName: name,
		typeId: f.type,
		scheduled: f.scheduled,
		currentLevel: f.currentLevel,
		firstHalfDuration: f.firstHalfDuration,
		secondHalfDuration: f.secondHalfDuration,
		minChips: f.minChips,
		maxChips: f.maxChips,
		preChips: f.preChips,
		originChips: f.originChips,
		userReliveCount: f.userReliveCount,
		mushReliveCount: f.mushReliveCount,
		joinAmount: f.joinAmount,
		joinTicket: f.joinTicket,
		joinMonthTicket: f.joinMonthTicket,
		joinInviteCard: f.joinInviteCard,
		deskCount: f.deskCount,
		rankOneScore: f.rankOneScore,
		rankTwoScore: f.rankTwoScore,
		rankThreeScore: f.rankThreeScore,
		rankOneTicket: f.rankOneTicket,
		rankTwoTicket: f.rankTwoTicket,
		rankThreeTicket: f.rankThreeTicket
	}
	const isCreate : boolean = dialog.value.mode == 'create'
	if (!isCreate) { payload.id = Number(f.id) }

	saving.value = true
	createMatch(payload).then(() => {
		dialog.value.visible = false
		uni.showToast({ title: isCreate ? '已创建' : '已保存', icon: 'none' })
		refreshTournaments()
	}).catch((err : Error) => {
		dialog.value.error = err.message || '保存失败'
	}).finally(() => {
		saving.value = false
	})
}

/* ---------------- 结束比赛 ---------------- */
const onTapEnd = (t : MatchVO) : void => {
	uni.showModal({
		title: '结束比赛',
		content: '确定结束「' + t.name + '」吗？结束后将停止报名与开打',
		confirmText: '结束',
		confirmColor: '#FF6255',
		success: (res : any) : void => {
			if (res.confirm) {
				endMatch(t.id).then(() => {
					uni.showToast({ title: '已结束', icon: 'none' })
					refreshTournaments()
				}).catch((err : Error) => {
					uni.showToast({ title: err.message || '操作失败', icon: 'none' })
				})
			}
		}
	})
}
</script>

<style scoped>
.page {
	min-height: 100vh;
	background-image: linear-gradient(180deg, #0E1110 0%, #0A0C0B 40%, #0B0D0C 100%);
	padding: 24rpx;
	box-sizing: border-box;
}

/* ============ 顶栏 ============ */
.topbar {
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	padding: 6rpx 8rpx 24rpx;
}
.count-wrap {
	flex-direction: row;
	align-items: baseline;
}
.count-num {
	font-size: 40rpx;
	color: #E8C275;
	font-weight: 700;
	margin-right: 8rpx;
}
.count-label {
	font-size: 24rpx;
	color: #6E7573;
}
.topbar-btns {
	flex-direction: row;
	align-items: center;
}
.add-btn-outline {
	padding: 14rpx 22rpx;
	border-radius: 999rpx;
	border: 1rpx solid rgba(232, 194, 117, 0.6);
	background-color: rgba(232, 194, 117, 0.08);
	margin-right: 14rpx;
}
.add-btn-outline-text {
	font-size: 22rpx;
	color: #E8C275;
	font-weight: 600;
}
.add-btn {
	padding: 14rpx 22rpx;
	background-image: linear-gradient(135deg, #E8C275, #C89B3C);
	border-radius: 999rpx;
}
.add-btn-text {
	font-size: 22rpx;
	color: #14100A;
	font-weight: 700;
}

/* ============ 比赛卡片 ============ */
.card {
	flex-direction: row;
	background-color: #1A1E1D;
	border-radius: 20rpx;
	border: 1rpx solid #2A2F2D;
	margin-bottom: 20rpx;
	overflow: hidden;
	box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
}
/* 左侧状态色 accent bar —— 一眼识别比赛状态 */
.card-accent {
	width: 6rpx;
	flex-shrink: 0;
}
.card.status-active .card-accent  { background-color: #2AA97A; }
.card.status-signup .card-accent  { background-color: #7AB6F2; }
.card.status-paused .card-accent  { background-color: #E8C275; }
.card.status-ended .card-accent   { background-color: #6E7573; }

.card-body {
	flex: 1;
	flex-direction: column;
	padding: 24rpx 22rpx;
}
.card-head {
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
}
.t-name {
	font-size: 30rpx;
	color: #EDEFEE;
	font-weight: 700;
	flex: 1;
}
.status-badge {
	padding: 6rpx 16rpx;
	border-radius: 999rpx;
	margin-left: 14rpx;
}
.status-active {
	background-color: rgba(42, 169, 122, 0.16);
	border: 1rpx solid rgba(42, 169, 122, 0.45);
}
.status-signup {
	background-color: rgba(122, 182, 242, 0.16);
	border: 1rpx solid rgba(122, 182, 242, 0.45);
}
.status-paused {
	background-color: rgba(232, 194, 117, 0.14);
	border: 1rpx solid rgba(232, 194, 117, 0.35);
}
.status-ended {
	background-color: rgba(110, 117, 115, 0.16);
	border: 1rpx solid rgba(110, 117, 115, 0.35);
}
.status-badge-text {
	font-size: 20rpx;
	color: #C7CDCB;
}
.status-active .status-badge-text { color: #57C79A; }
.status-signup .status-badge-text { color: #7AB6F2; }
.status-paused .status-badge-text { color: #E8C275; }
.status-ended .status-badge-text { color: #6E7573; }

/* 店铺 + 类型 + 级别 */
.meta-row {
	flex-direction: row;
	align-items: center;
	flex-wrap: wrap;
	margin-top: 12rpx;
}
.store-pill {
	padding: 4rpx 14rpx;
	background-color: rgba(232, 194, 117, 0.1);
	border: 1rpx solid rgba(232, 194, 117, 0.3);
	border-radius: 999rpx;
}
.store-pill-text {
	font-size: 21rpx;
	color: #E8C275;
}
.meta-sep {
	font-size: 21rpx;
	color: #4A4F4D;
	margin: 0 8rpx;
}
.meta-type {
	font-size: 22rpx;
	color: #C7CDCB;
}
.meta-level {
	font-size: 22rpx;
	color: #8F9492;
}
.meta-reserve {
	font-size: 20rpx;
	color: #B07AE8;
	font-weight: 600;
}
.meta-time {
	font-size: 19rpx;
	color: #4A4F4D;
	margin-left: auto;
}

/* 核心 3 列数据 */
.stat-grid {
	flex-direction: row;
	margin-top: 18rpx;
	background-color: #0F1211;
	border: 1rpx solid #242827;
	border-radius: 14rpx;
	padding: 16rpx 0;
}
.stat-cell {
	flex: 1;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}
.stat-num {
	font-size: 30rpx;
	color: #EDEFEE;
	font-weight: 700;
}
.stat-label {
	font-size: 19rpx;
	color: #6E7573;
	margin-top: 4rpx;
}

/* 信息 chips：盲注 / 前注 / 复活 / 蘑菇 / 预制分 */
.info-row {
	flex-direction: row;
	flex-wrap: wrap;
	margin-top: 16rpx;
}
.info-chip {
	flex-direction: row;
	align-items: center;
	padding: 6rpx 14rpx;
	background-color: #1F2322;
	border: 1rpx solid #2A2F2D;
	border-radius: 999rpx;
	margin-right: 10rpx;
	margin-bottom: 8rpx;
}
.info-chip-key {
	font-size: 19rpx;
	color: #6E7573;
}
.info-chip-val {
	font-size: 21rpx;
	color: #EDEFEE;
	font-weight: 600;
	margin-left: 6rpx;
}

/* 入场方式 */
.entry-row {
	flex-direction: row;
	align-items: center;
	flex-wrap: wrap;
	margin-top: 4rpx;
}
.entry-label {
	font-size: 21rpx;
	color: #6E7573;
	margin-right: 10rpx;
}
.entry-chip {
	padding: 4rpx 14rpx;
	border-radius: 999rpx;
	margin-right: 8rpx;
	margin-bottom: 6rpx;
}
.entry-on {
	background-color: rgba(122, 182, 242, 0.12);
	border: 1rpx solid rgba(122, 182, 242, 0.4);
}
.entry-off {
	background-color: #1A1D1C;
	border: 1rpx solid #242827;
}
.entry-chip-text {
	font-size: 19rpx;
	color: #8F9492;
}
.entry-on .entry-chip-text {
	color: #7AB6F2;
}

/* 奖励摘要 */
.prize-row {
	flex-direction: row;
	align-items: stretch;
	margin-top: 16rpx;
	background-color: #1F2322;
	border: 1rpx solid #2A2F2D;
	border-radius: 14rpx;
	padding: 12rpx 0;
}
.prize-cell {
	flex: 1;
	flex-direction: column;
	align-items: center;
}
.prize-rank {
	font-size: 21rpx;
	color: #E8C275;
	font-weight: 700;
}
.prize-rank-1 {
	font-size: 23rpx;
	color: #F4D595;
}
.prize-val {
	font-size: 20rpx;
	color: #C7CDCB;
	margin-top: 4rpx;
}

/* 操作区：全宽实心按钮栏 */
.actions {
	flex-direction: row;
	align-items: center;
	margin-top: 20rpx;
}
.act {
	flex: 1;
	padding: 22rpx 0;
	border-radius: 12rpx;
	margin-right: 16rpx;
	align-items: center;
	justify-content: center;
}
.act:last-child {
	margin-right: 0;
}
.act-primary {
	background-color: #E8C275;
}
.act-primary-text {
	font-size: 26rpx;
	color: #14100A;
	font-weight: 700;
}
.act-danger {
	background-color: #FF6255;
}
.act-danger-text {
	font-size: 26rpx;
	color: #FFFFFF;
	font-weight: 700;
}

/* 加载脚注 */
.list-foot {
	align-items: center;
	justify-content: center;
	padding: 16rpx 0 8rpx;
}
.list-foot-text {
	font-size: 22rpx;
	color: #4A4F4D;
}

/* ============ 弹层（创建 / 编辑）：长表单用 scroll-view 滚动 ============ */
.dlg-overlay {
	position: fixed;
	left: 0; right: 0; top: 0; bottom: 0;
	background-color: rgba(0, 0, 0, 0.65);
	align-items: flex-end;
	justify-content: flex-end;
	z-index: 999;
}
.dlg-card {
	width: 750rpx;
	height: 1100rpx;
	max-height: 90vh;
	background-color: #1A1E1D;
	border-radius: 32rpx 32rpx 0 0;
	border: 1rpx solid #2A2F2D;
	flex-direction: column;
	overflow: hidden;
	box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
}
/* 顶部拖拽把手 */
.dlg-handle {
	align-items: center;
	justify-content: center;
	padding-top: 14rpx;
}
.dlg-handle-bar {
	width: 72rpx;
	height: 8rpx;
	border-radius: 999rpx;
	background-color: #2A2F2D;
}
.dlg-head {
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	padding: 16rpx 30rpx 20rpx;
	border-bottom: 1rpx solid #242827;
}
.dlg-head-info {
	flex-direction: column;
}
.dlg-title {
	font-size: 32rpx;
	color: #EDEFEE;
	font-weight: 700;
}
.dlg-sub {
	font-size: 21rpx;
	color: #8F9492;
	margin-top: 6rpx;
}
.dlg-close {
	width: 56rpx;
	height: 56rpx;
	border-radius: 999rpx;
	background-color: #1F2322;
	align-items: center;
	justify-content: center;
}
.dlg-close-text {
	font-size: 26rpx;
	color: #8F9492;
}
.dlg-body {
	flex: 1;
	flex-direction: column;
	padding: 22rpx 24rpx 0;
}

/* 模式分段控件（比赛 / 预约） */
.seg-row {
	flex-direction: row;
	background-color: #0F1211;
	border: 1rpx solid #2A2F2D;
	border-radius: 14rpx;
	padding: 4rpx;
	margin-bottom: 20rpx;
}
.seg-cell {
	flex: 1;
	height: 64rpx;
	align-items: center;
	justify-content: center;
	border-radius: 10rpx;
}
.seg-on {
	background-image: linear-gradient(135deg, #E8C275, #C89B3C);
}
.seg-text {
	font-size: 24rpx;
	color: #8F9492;
	font-weight: 600;
}
.seg-text-on {
	color: #14100A;
}

/* 分节标题：金色竖条 + 文字 */
.section {
	flex-direction: row;
	align-items: center;
	margin: 10rpx 4rpx 14rpx;
}
.section-bar {
	width: 6rpx;
	height: 26rpx;
	border-radius: 3rpx;
	background-image: linear-gradient(180deg, #E8C275, #C89B3C);
	margin-right: 12rpx;
	box-shadow: 0 2rpx 8rpx rgba(232, 194, 117, 0.30);
}
.section-text {
	font-size: 23rpx;
	color: #C7CDCB;
	font-weight: 700;
	letter-spacing: 1rpx;
}

/* 分组卡片：同组字段包在一张浅卡里 */
.group {
	background-color: #121514;
	border: 1rpx solid #222625;
	border-radius: 18rpx;
	padding: 18rpx 20rpx;
	margin-bottom: 18rpx;
}

/* 通用字段 */
.field {
	flex-direction: column;
	margin-bottom: 18rpx;
}
.field-label {
	font-size: 21rpx;
	color: #8F9492;
	margin-bottom: 8rpx;
}
.field-input {
	height: 78rpx;
	background-color: #0F1211;
	border: 1rpx solid #2A2F2D;
	border-radius: 12rpx;
	padding: 0 20rpx;
	font-size: 26rpx;
	color: #EDEFEE;
}
.field-input-num {
	text-align: left;
}
.field-ph {
	color: #4A4F4D;
}

/* 选择按钮（店铺 / 预约时间） */
.select-btn {
	flex-direction: row;
	align-items: center;
	height: 78rpx;
	background-color: #0F1211;
	border: 1rpx solid #2A2F2D;
	border-radius: 12rpx;
	padding: 0 20rpx;
}
.select-btn-text {
	flex: 1;
	font-size: 25rpx;
	color: #EDEFEE;
}
.select-btn-ph {
	color: #4A4F4D;
}
.select-btn-arrow {
	font-size: 28rpx;
	color: #4A4F4D;
	margin-left: 12rpx;
}

/* 预约时间：日期 + 时间 两个 picker 横向排列 */
.row-date-time {
	flex-direction: row;
}
.select-btn-half {
	flex: 1;
	margin-right: 12rpx;
}
.select-btn-half:last-child {
	margin-right: 0;
}

/* chip 行（比赛类型） */
.chip-row {
	flex-direction: row;
	flex-wrap: wrap;
}
.chip-cell {
	padding: 12rpx 22rpx;
	background-color: #1F2322;
	border: 1rpx solid #2A2F2D;
	border-radius: 999rpx;
	margin-right: 10rpx;
	margin-bottom: 10rpx;
}
.chip-on {
	background-color: rgba(232, 194, 117, 0.18);
	border: 1rpx solid rgba(232, 194, 117, 0.55);
}
.chip-cell-text {
	font-size: 22rpx;
	color: #C7CDCB;
}
.chip-cell-text-on {
	color: #E8C275;
	font-weight: 600;
}

/* 3 列输入行 */
.row3 {
	flex-direction: row;
	margin-bottom: 18rpx;
}
.row3-cell {
	flex: 1;
	flex-direction: column;
	margin-right: 12rpx;
}
.row3-cell:last-of-type {
	margin-right: 0;
}

/* 奖励编辑块 */
.prize-edit {
	flex-direction: column;
	background-color: #1F2322;
	border: 1rpx solid #2A2F2D;
	border-radius: 14rpx;
	padding: 14rpx 18rpx 4rpx;
	margin-bottom: 14rpx;
}
.prize-edit-head {
	flex-direction: row;
	align-items: center;
	margin-bottom: 6rpx;
}
.prize-edit-tag {
	width: 60rpx;
	height: 36rpx;
	border-radius: 10rpx;
	align-items: center;
	justify-content: center;
	margin-right: 12rpx;
}
.prize-edit-tag-1 {
	background-color: rgba(232, 194, 117, 0.18);
}
.prize-edit-tag-2 {
	background-color: rgba(199, 205, 203, 0.16);
}
.prize-edit-tag-3 {
	background-color: rgba(176, 122, 232, 0.18);
}
.prize-edit-tag-text {
	font-size: 20rpx;
	color: #EDEFEE;
	font-weight: 700;
}
.prize-edit-name {
	font-size: 23rpx;
	color: #EDEFEE;
	font-weight: 600;
}

/* 内联错误 */
.dlg-error {
	font-size: 21rpx;
	color: #FF6255;
	margin-bottom: 12rpx;
}

.dlg-foot-spacer {
	height: 32rpx;
}

/* 底部双按钮 */
.dlg-btns {
	flex-direction: row;
	padding: 18rpx 30rpx 22rpx;
	border-top: 1rpx solid #242827;
}
.dlg-btn {
	flex: 1;
	height: 78rpx;
	align-items: center;
	justify-content: center;
	border-radius: 12rpx;
}
.dlg-btn-text {
	font-size: 27rpx;
	font-weight: 600;
}
.dlg-btn-cancel {
	background-color: #1F2322;
	border: 1rpx solid #2A2F2D;
	margin-right: 16rpx;
	flex: 1;
}
.dlg-btn-cancel-text {
	color: #C7CDCB;
}
.dlg-btn-ok {
	background-image: linear-gradient(135deg, #E8C275, #C89B3C);
	flex: 2;
}
.dlg-btn-ok-text {
	color: #14100A;
}

/* ============ 选店铺弹层（共用 .pk-* 风格） ============ */
.pk-overlay {
	position: fixed;
	left: 0; right: 0; top: 0; bottom: 0;
	background-color: rgba(0, 0, 0, 0.65);
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: 24rpx;
}
.pk-card {
	width: 624rpx;
	max-width: 100%;
	background-color: #1A1E1D;
	border-radius: 28rpx;
	border: 1rpx solid #2A2F2D;
	flex-direction: column;
	padding: 30rpx 30rpx 24rpx;
	box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
}
.pk-head {
	flex-direction: column;
	margin-bottom: 20rpx;
}
.pk-title {
	font-size: 32rpx;
	color: #EDEFEE;
	font-weight: 700;
}
.pk-sub {
	font-size: 21rpx;
	color: #8F9492;
	margin-top: 6rpx;
}
.pk-search {
	flex-direction: row;
	align-items: center;
	height: 76rpx;
	background-color: #0F1211;
	border: 1rpx solid #2A2F2D;
	border-radius: 12rpx;
	padding: 0 20rpx;
	margin-bottom: 16rpx;
}
.pk-search-icon {
	width: 34rpx;
	height: 34rpx;
	border-radius: 50%;
	background-color: rgba(232, 194, 117, 0.14);
	align-items: center;
	justify-content: center;
	margin-right: 14rpx;
}
.pk-search-icon-text {
	font-size: 19rpx;
	color: #E8C275;
	line-height: 19rpx;
}
.pk-input {
	flex: 1;
	height: 76rpx;
	font-size: 26rpx;
	color: #EDEFEE;
}
.pk-list {
	height: 440rpx;
	flex-direction: column;
}
.pk-row {
	flex-direction: row;
	align-items: center;
	padding: 18rpx 16rpx;
	border-radius: 14rpx;
	border: 1rpx solid transparent;
}
.pk-row-on {
	background-color: rgba(232, 194, 117, 0.08);
	border: 1rpx solid rgba(232, 194, 117, 0.3);
}
.pk-avatar {
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
	background-color: #1F2322;
	border: 1rpx solid #2A2F2D;
	align-items: center;
	justify-content: center;
	margin-right: 14rpx;
}
.pk-avatar-text {
	font-size: 26rpx;
	color: #C7CDCB;
}
.pk-user {
	flex: 1;
	flex-direction: column;
}
.pk-user-name {
	font-size: 25rpx;
	color: #EDEFEE;
}
.pk-user-id {
	font-size: 19rpx;
	color: #6E7573;
	margin-top: 4rpx;
}
.pk-check {
	width: 44rpx;
	height: 44rpx;
	border-radius: 50%;
	align-items: center;
	justify-content: center;
}
.pk-check-on {
	background-color: #E8C275;
}
.pk-check-text {
	font-size: 24rpx;
	color: #14100A;
	font-weight: 700;
}
.pk-empty {
	align-items: center;
	justify-content: center;
	padding: 60rpx 0;
}
.pk-empty-text {
	font-size: 22rpx;
	color: #4A4F4D;
}

.footer-blank {
	height: 60rpx;
}
</style>