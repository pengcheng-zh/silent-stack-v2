<template>
	<scroll-view
		class="page"
		direction="vertical"
		:show-scrollbar="false"
		@scrolltolower="loadMore"
	>

		<!-- ============ 顶栏：搜索 + 状态 ============ -->
		<view class="topbar">
			<view class="search-box" :class="{ 'search-box-loading': searching }">
				<view class="search-ico">
					<text class="search-ico-text">搜</text>
				</view>
				<input
					class="search-input"
					type="text"
					:value="keyword"
					placeholder="搜索昵称 / ID / 手机号"
					placeholder-class="ph"
					confirm-type="search"
					@input="onKeywordInput"
					@confirm="onSearchSubmit"
				/>
				<view v-if="searching" class="search-spinner">
					<view class="spinner-dot spinner-dot-1"></view>
					<view class="spinner-dot spinner-dot-2"></view>
					<view class="spinner-dot spinner-dot-3"></view>
				</view>
				<view v-else-if="keyword.length > 0" class="search-clear" @tap="onTapClear">
					<text class="search-clear-text">×</text>
				</view>
			</view>
		</view>

		<!-- ============ 用户统计条 ============ -->
		<view class="summary">
			<view class="summary-stat">
				<text class="summary-num">{{ visible.length }}</text>
				<text class="summary-key">当前展示</text>
			</view>
			<view class="summary-divider"></view>
			<view class="summary-stat">
				<text class="summary-num summary-num-total">{{ users.length }}</text>
				<text class="summary-key">总用户</text>
			</view>
			<view class="summary-divider"></view>
			<view class="summary-stat">
				<text class="summary-num">{{ stats.searchHits }}</text>
				<text class="summary-key">{{ keyword.length > 0 ? '匹配' : '上次搜索' }}</text>
			</view>
			<view class="summary-state">
				<text class="summary-state-text">{{ searching ? '搜索中…' : (keyword.length > 0 ? ('关键词：' + keyword) : '在线') }}</text>
			</view>
		</view>

		<!-- ============ 用户卡片列表 ============ -->
		<view
			v-for="u in visible"
			:key="u.id"
			class="ucard"
			:style="'border-left-color:' + tierColorOf(u) + ';border-left-width:6rpx;'"
		>

			<!-- 顶部身份区：头像 + 名称 + tier pill -->
			<view class="ucard-top">
				<view class="avatar" :style="'border-color:' + tierColorOf(u) + ';'">
					<text class="avatar-text">{{ avatarOf(u) }}</text>
					<view class="avatar-tier" :style="'background-color:' + tierColorOf(u) + ';'">
						<text class="avatar-tier-text">{{ tierSuitOf(u) }}</text>
					</view>
				</view>
				<view class="head">
					<view class="head-name-row">
						<text class="u-name">{{ u.name }}</text>
						<view class="tier-pill" :style="'background-color:' + tierColorOf(u) + '22;color:' + tierColorOf(u) + ';border-color:' + tierColorOf(u) + '59;'">
							<text class="tier-pill-text">{{ tierLabelOf(u) }}</text>
						</view>
					</view>
					<text class="u-id">{{ u.id }} · {{ u.city }}</text>
					<view class="head-phone">
						<view class="phone-pill">
							<text class="phone-pill-text">{{ maskPhone(u.phone) }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 核心数据 3 列：段位分 / 月票 / 直通函 -->
			<view class="stat-grid">
				<view class="stat-cell">
					<text class="stat-label">段位分</text>
					<text class="stat-val stat-val-main">{{ u.tierPoints }}</text>
				</view>
				<view class="stat-cell">
					<text class="stat-label">月票</text>
					<text class="stat-val">{{ u.monthlyTicket }}<text class="stat-suffix">张</text></text>
				</view>
				<view class="stat-cell">
					<text class="stat-label">直通函</text>
					<text class="stat-val">{{ u.directTicket }}<text class="stat-suffix">张</text></text>
				</view>
			</view>

			<!-- 资产速览：5 项高优资产横排 chip -->
			<view class="asset-row">
				<view class="asset-chip asset-chip-money">
					<text class="asset-key">金额</text>
					<text class="asset-val">¥{{ fmtNum(u.balance) }}</text>
				</view>
				<view class="asset-chip">
					<text class="asset-key">门票</text>
					<text class="asset-val">{{ u.ticketCount }}</text>
				</view>
				<view class="asset-chip">
					<text class="asset-key">积分</text>
					<text class="asset-val">{{ u.points }}</text>
				</view>
				<view class="asset-chip asset-chip-jd">
					<text class="asset-key">酒德</text>
					<text class="asset-val">{{ u.jiudeBalance }}</text>
				</view>
				<view class="asset-chip">
					<text class="asset-key">成长</text>
					<text class="asset-val">{{ u.jiudeGrowth }}</text>
				</view>
			</view>

			<!-- 套餐券 + 大师分 -->
			<view class="voucher-row">
				<view class="v-chip v-chip-a">
					<text class="v-key">券A</text>
					<text class="v-val">×{{ u.jiudeA }}</text>
				</view>
				<view class="v-chip v-chip-b">
					<text class="v-key">券B</text>
					<text class="v-val">×{{ u.jiudeB }}</text>
				</view>
				<view class="v-chip v-chip-c">
					<text class="v-key">券C</text>
					<text class="v-val">×{{ u.jiudeC }}</text>
				</view>
				<view class="master-chip" v-if="u.masterScore > 0">
					<text class="master-key">大师分</text>
					<text class="master-val">{{ u.masterScore }}</text>
				</view>
			</view>

			<!-- 操作 4 入口 -->
			<view class="actions">
				<view class="act act-primary" @tap="onTapAdjust(u)">
					<text class="act-text act-text-primary">调账</text>
				</view>
				<view class="act" @tap="onTapHonor(u)">
					<text class="act-text">荣誉</text>
				</view>
				<view class="act" @tap="onTapBill(u)">
					<text class="act-text">账单</text>
				</view>
				<view class="act" @tap="onTapPhone(u)">
					<text class="act-text">改手机号</text>
				</view>
			</view>
		</view>

		<!-- 列表脚注：加载态 / 空态 -->
		<view v-if="visible.length == 0" class="list-empty">
			<view class="list-empty-icon">
				<text class="list-empty-icon-text">?</text>
			</view>
			<text class="list-empty-title">{{ searching ? '正在搜索…' : (keyword.length > 0 ? '没有匹配的用户' : '暂无用户') }}</text>
			<text v-if="!searching && keyword.length > 0" class="list-empty-sub">试试其他关键词，或清空搜索查看全部</text>
		</view>
		<view v-else class="list-foot">
			<text class="list-foot-text">{{ loading ? '加载中…' : (noMore ? '— 到底了 —' : '上拉加载更多') }}</text>
		</view>

		<view class="footer-blank"></view>
	</scroll-view>

	<!-- ============ 调账弹层（赠送/扣减） ============ -->
	<view v-if="adj.visible" class="dlg-overlay" @tap="onTapAdjMask">
		<view class="dlg-card dlg-card-tall" @tap.stop="">
			<view class="dlg-head">
				<text class="dlg-title">调账 · {{ adj.target?.name ?? '' }}</text>
				<text class="dlg-sub">赠送/扣减后即时生效，操作不可撤销</text>
			</view>

			<view class="field">
				<text class="field-label">资产</text>
				<view class="asset-grid">
					<view
						v-for="a in ASSET_META"
						:key="a.key"
						class="asset-chip-btn"
						:class="{ 'asset-on': adj.assetKey === a.key }"
						:style="adj.assetKey === a.key ? 'border-color:' + a.color + ';background-color:' + a.color + '1a;' : ''"
						@tap="onTapAsset(a.key)"
					>
						<text class="asset-chip-btn-text" :style="adj.assetKey === a.key ? 'color:' + a.color + ';' : ''">{{ a.label }}</text>
					</view>
				</view>
			</view>

			<view class="field">
				<text class="field-label">方向</text>
				<view class="dir-row">
					<view
						class="dir-chip"
						:class="{ 'dir-on-gift': adj.direction === 'gift', 'dir-off': adj.direction !== 'gift' }"
						@tap="onTapDirection('gift')"
					>
						<text class="dir-text" :class="{ 'dir-text-on': adj.direction === 'gift' }">＋ 赠送</text>
					</view>
					<view
						class="dir-chip"
						:class="{ 'dir-on-deduct': adj.direction === 'deduct', 'dir-off': adj.direction !== 'deduct' }"
						@tap="onTapDirection('deduct')"
					>
						<text class="dir-text" :class="{ 'dir-text-on': adj.direction === 'deduct' }">－ 扣减</text>
					</view>
				</view>
			</view>

			<view v-if="adj.target != null" class="field field-current">
				<text class="field-label">当前 {{ adjMeta.label }}</text>
				<text class="field-current-val">{{ adjCurrentVal }} {{ adjMeta.unit }}</text>
			</view>

			<view class="field">
				<text class="field-label">数量（{{ adjMeta.unit }}）</text>
				<input
					class="field-input"
					type="number"
					:value="adj.amount"
					placeholder="请输入"
					placeholder-class="field-ph"
					@input="onAdjAmountInput"
				/>
			</view>

			<view class="field">
				<text class="field-label">备注</text>
				<input
					class="field-input"
					type="text"
					:value="adj.reason"
					placeholder="必填，便于追溯"
					placeholder-class="field-ph"
					@input="onAdjReasonInput"
				/>
			</view>

			<text v-if="adj.error.length > 0" class="dlg-error">{{ adj.error }}</text>

			<view class="dlg-btns">
				<view class="dlg-btn dlg-btn-cancel" @tap="onTapAdjCancel">
					<text class="dlg-btn-text dlg-btn-cancel-text">取消</text>
				</view>
				<view class="dlg-btn dlg-btn-ok" @tap="onTapAdjConfirm">
					<text class="dlg-btn-text dlg-btn-ok-text">确认{{ adj.direction == 'gift' ? '赠送' : '扣减' }}</text>
				</view>
			</view>
		</view>
	</view>

	<!-- ============ 荣誉弹层 ============ -->
	<view v-if="honor.visible" class="dlg-overlay" @tap="onTapHonorMask">
		<view class="dlg-card dlg-card-tall" @tap.stop="">
			<view class="dlg-head">
				<text class="dlg-title">荣誉 · {{ honor.target?.name ?? '' }}</text>
				<text class="dlg-sub">共 {{ honorList.length }} 项 · 含日期与级别</text>
			</view>

			<scroll-view class="honor-scroll" direction="vertical" :show-scrollbar="false">
				<view
					v-for="h in honorList"
					:key="h.id"
					class="honor-row"
				>
					<view class="honor-medal" :class="'medal-' + h.level">
						<text class="honor-medal-text">{{ medalText(h.level) }}</text>
					</view>
					<view class="honor-main">
						<text class="honor-title">{{ h.title }}</text>
						<text class="honor-sub">{{ h.subtitle }}</text>
					</view>
					<text class="honor-date">{{ h.date }}</text>
				</view>
				<view v-if="honorList.length == 0" class="honor-empty">
					<text class="honor-empty-text">暂无荣誉记录</text>
				</view>
			</scroll-view>

			<view class="dlg-btns">
				<view class="dlg-btn dlg-btn-ok dlg-btn-full" @tap="onTapHonorClose">
					<text class="dlg-btn-text dlg-btn-ok-text">关闭</text>
				</view>
			</view>
		</view>
	</view>

	<!-- ============ 账单弹层 ============ -->
	<view v-if="bill.visible" class="dlg-overlay" @tap="onTapBillMask">
		<view class="dlg-card dlg-card-tall" @tap.stop="">
			<view class="dlg-head">
				<text class="dlg-title">账单 · {{ bill.target?.name ?? '' }}</text>
				<text class="dlg-sub">近 {{ billListAll.length }} 条记录 · 含赠送/扣减/购入/兑换/退回/签到</text>
			</view>

			<scroll-view class="bill-filter" direction="horizontal" :show-scrollbar="false">
				<view
					v-for="t in BILL_FILTER_TABS"
					:key="t.key"
					class="filter-chip"
					:class="{ 'filter-on': bill.filter === t.key }"
					@tap="onTapBillFilter(t.key)"
				>
					<text class="filter-chip-text" :class="{ 'filter-chip-text-on': bill.filter === t.key }">{{ t.label }}</text>
				</view>
			</scroll-view>

			<scroll-view class="bill-scroll" direction="vertical" :show-scrollbar="false">
				<view
					v-for="b in billList"
					:key="b.id"
					class="bill-row"
				>
					<view class="bill-type" :style="'background-color:' + b.assetColor + '22;border-color:' + b.assetColor + ';'">
						<text class="bill-type-text" :style="'color:' + b.assetColor + ';'">{{ BILL_TYPE_LABEL[b.type] }}</text>
					</view>
					<view class="bill-main">
						<text class="bill-asset">{{ b.asset }} · {{ b.operator }}</text>
						<text class="bill-reason">{{ b.reason }}</text>
					</view>
					<view class="bill-right">
						<text class="bill-delta" :class="b.delta > 0 ? 'bill-delta-up' : 'bill-delta-down'">
							{{ b.delta > 0 ? '+' : '' }}{{ b.delta }}
						</text>
						<text class="bill-date">{{ b.date }}</text>
					</view>
				</view>
				<view v-if="billList.length == 0" class="bill-empty">
					<text class="bill-empty-text">该类型暂无记录</text>
				</view>
			</scroll-view>

			<view class="dlg-btns">
				<view class="dlg-btn dlg-btn-ok dlg-btn-full" @tap="onTapBillClose">
					<text class="dlg-btn-text dlg-btn-ok-text">关闭</text>
				</view>
			</view>
		</view>
	</view>

	<!-- ============ 改手机号弹层 ============ -->
	<view v-if="phone.visible" class="dlg-overlay" @tap="onTapPhoneMask">
		<view class="dlg-card" @tap.stop="">
			<view class="dlg-head">
				<text class="dlg-title">改手机号 · {{ phone.target?.name ?? '' }}</text>
				<text class="dlg-sub">修改后立即生效，记录在账单中</text>
			</view>

			<view class="field">
				<text class="field-label">当前手机号</text>
				<text class="field-static">{{ phone.target?.phone ?? '' }}</text>
			</view>

			<view class="field">
				<text class="field-label">新手机号</text>
				<input
					class="field-input"
					type="number"
					:value="phone.next"
					placeholder="11 位手机号"
					placeholder-class="field-ph"
					:maxlength="11"
					@input="onPhoneInput"
				/>
			</view>

			<view class="field">
				<text class="field-label">备注</text>
				<input
					class="field-input"
					type="text"
					:value="phone.reason"
					placeholder="可选，如：用户申诉 / 实名补录"
					placeholder-class="field-ph"
					@input="onPhoneReasonInput"
				/>
			</view>

			<text v-if="phone.error.length > 0" class="dlg-error">{{ phone.error }}</text>

			<view class="dlg-btns">
				<view class="dlg-btn dlg-btn-cancel" @tap="onTapPhoneCancel">
					<text class="dlg-btn-text dlg-btn-cancel-text">取消</text>
				</view>
				<view class="dlg-btn dlg-btn-ok" @tap="onTapPhoneConfirm">
					<text class="dlg-btn-text dlg-btn-ok-text">确认修改</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ADMIN_USERS_DETAIL, ASSET_META, BILL_TYPE_LABEL, TIER_META, getUserBills, getUserHonors, maskPhone, metaOf, tierRoman } from '@/common/admin-user-data'
import type { AdminUserRow, AssetKey, UserBillItem, UserHonorItem } from '@/common/admin-user-data'

/* ============== 数据层（模拟接口） ============== */
// 模拟后端的用户列表接口：返回 Promise，关键词为空时返回全量
// 真实接入时只需把这个函数换成 uni.request 即可，调用方无需改动
type SearchResult = {
	list : AdminUserRow[]
	total : number          // 服务端总命中数（包含未加载的）
	usedFallback : boolean  // 标记是否走了"未找到"兜底
}
const API_DELAY_MS : number = 380          // 模拟网络延迟
const fetchUsers = (kw : string) : Promise<SearchResult> => {
	return new Promise((resolve : (r : SearchResult) => void) : void => {
		setTimeout((): void => {
			const key : string = kw.trim().toLowerCase()
			const all : AdminUserRow[] = ADMIN_USERS_DETAIL
			const out : AdminUserRow[] = []
			const len : number = all.length
			if (key.length == 0) {
				resolve({ list: all.slice(), total: len, usedFallback: false })
				return
			}
			for (let i : number = 0; i < len; i++) {
				const u = all[i]
				if (u.name.toLowerCase().indexOf(key) >= 0
					|| u.id.toLowerCase().indexOf(key) >= 0
					|| u.phone.indexOf(key) >= 0) {
					out.push(u)
				}
			}
			resolve({ list: out, total: out.length, usedFallback: false })
		}, API_DELAY_MS)
	})
}

/* ============== 状态 ============== */
// 内存中的"服务端返回"全集；visible 是当前渲染的前缀；filtered 是上次搜索结果
const users = ref<AdminUserRow[]>([])
const visible = ref<AdminUserRow[]>([])
const keyword = ref<string>('')
const searching = ref(false)               // 搜索 loading
const loading = ref(false)                 // 分页 loading
const noMore = ref(true)
const PAGE_SIZE : number = 6
// 上一次搜索命中数（无关键词时 = 全量）
const stats = ref<{ searchHits : number }>({ searchHits: 0 })

/* ============== 初始化：onLoad → 调一次接口拉全量 ============== */
let reqSeq : number = 0                     // 请求序号，过期回调直接丢弃（避免回填覆盖）
const doFetch = (kw : string, resetPage : boolean) : void => {
	const seq : number = ++reqSeq
	if (kw.trim().length > 0) { searching.value = true }
	fetchUsers(kw).then((res : SearchResult) : void => {
		// 过期请求：忽略结果
		if (seq !== reqSeq) { return }
		users.value = res.list
		stats.value.searchHits = res.total
		if (resetPage) {
			visible.value = users.value.slice(0, PAGE_SIZE)
		}
		noMore.value = visible.value.length >= users.value.length
		searching.value = false
	}).catch((): void => {
		if (seq !== reqSeq) { return }
		searching.value = false
		uni.showToast({ title: '搜索失败', icon: 'none' })
	})
}

// 页面挂载时拉一次
onLoad((): void => {
	doFetch('', true)
})

/* ============== 搜索：debounce 300ms 后调接口 ============== */
// 不在 onKeywordInput 里直接过滤，而是更新本地 keyword + 起 debounce 定时器
// debounce 触发 doFetch 调接口；输入过程中由 visible 暂留旧结果 + searching 动画反馈
let searchTimer : ReturnType<typeof setTimeout> | null = null
const SEARCH_DEBOUNCE_MS : number = 300
const onKeywordInput = (e : any) : void => {
	const v : string = (e.detail.value || '').toString()
	keyword.value = v
	// 立刻标记 searching，视觉上立刻反馈
	if (v.trim().length > 0) {
		searching.value = true
		// 立即把列表清空，防止旧结果混淆
		if (visible.value.length > 0) {
			visible.value = []
			noMore.value = true
		}
	} else {
		// 清空搜索框 → 立即回到全量（不防抖，避免"按 × 后列表还是空"的卡顿感）
		if (searchTimer != null) { clearTimeout(searchTimer); searchTimer = null }
		doFetch('', true)
		return
	}
	if (searchTimer != null) { clearTimeout(searchTimer) }
	searchTimer = setTimeout((): void => {
		searchTimer = null
		doFetch(v, true)
	}, SEARCH_DEBOUNCE_MS)
}
const onSearchSubmit = () : void => {
	// 按键盘搜索键 → 立即触发，跳过 debounce
	if (searchTimer != null) { clearTimeout(searchTimer); searchTimer = null }
	doFetch(keyword.value, true)
}
const onTapClear = () : void => {
	if (searchTimer != null) { clearTimeout(searchTimer); searchTimer = null }
	keyword.value = ''
	doFetch('', true)
}

/* ============== 分页：触底加载更多 ============== */
const loadMore = () : void => {
	if (loading.value || noMore.value || searching.value) { return }
	loading.value = true
	setTimeout((): void => {
		const start : number = visible.value.length
		const cur : AdminUserRow[] = users.value
		const chunk : AdminUserRow[] = cur.slice(start, start + PAGE_SIZE)
		const next : AdminUserRow[] = visible.value.slice()
		for (let i : number = 0; i < chunk.length; i++) { next.push(chunk[i]) }
		visible.value = next
		if (visible.value.length >= cur.length) { noMore.value = true }
		loading.value = false
	}, 220)
}
onReachBottom((): void => { loadMore() })

/* ============== 头像 / 段位 工具 ============== */
const avatarOf = (u : AdminUserRow) : string => u.name.length == 0 ? '?' : u.name.substring(0, 1)
const tierColorOf = (u : AdminUserRow) : string => TIER_META[u.tier].color
const tierSuitOf = (u : AdminUserRow) : string => TIER_META[u.tier].suit
const tierLabelOf = (u : AdminUserRow) : string => TIER_META[u.tier].suit + ' ' + TIER_META[u.tier].name + ' ' + tierRoman(u.tierLevel)

/* ============== 数字格式化 ============== */
const fmtNum = (n : number) : string => {
	if (Number.isInteger(n)) { return n.toString() }
	return n.toFixed(2)
}

/* ============== 调账弹层 ============== */
type AdjDirection = 'gift' | 'deduct'
type AdjState = {
	visible : boolean
	target : AdminUserRow | null
	assetKey : AssetKey
	direction : AdjDirection
	amount : string
	reason : string
	error : string
}
const adj = ref<AdjState>({
	visible: false,
	target: null,
	assetKey: 'balance',
	direction: 'gift',
	amount: '',
	reason: '',
	error: ''
})
const adjMeta = computed(() => metaOf(adj.value.assetKey))
const adjCurrentVal = computed((): string => {
	const u = adj.value.target
	if (u == null) { return '0' }
	return fmtNum(u[adj.value.assetKey])
})
const onTapAdjust = (u : AdminUserRow) : void => {
	adj.value = {
		visible: true, target: u, assetKey: 'balance',
		direction: 'gift', amount: '', reason: '', error: ''
	}
}
const onTapAsset = (k : AssetKey) : void => {
	adj.value.assetKey = k
	adj.value.error = ''
}
const onTapDirection = (d : AdjDirection) : void => {
	adj.value.direction = d
	adj.value.error = ''
}
const onAdjAmountInput = (e : any) : void => {
	adj.value.amount = (e.detail.value || '').toString()
	adj.value.error = ''
}
const onAdjReasonInput = (e : any) : void => {
	adj.value.reason = (e.detail.value || '').toString()
	adj.value.error = ''
}
const onTapAdjCancel = () : void => { adj.value.visible = false }
const onTapAdjMask = () : void => { adj.value.visible = false }
const onTapAdjConfirm = () : void => {
	const u = adj.value.target
	if (u == null) { adj.value.visible = false; return }
	const raw : string = adj.value.amount.trim()
	if (raw.length == 0) { adj.value.error = '请输入数量'; return }
	const num : number = Number(raw)
	if (!Number.isFinite(num) || num <= 0) { adj.value.error = '数量需大于 0'; return }
	if (adjMeta.value.intOnly && !Number.isInteger(num)) { adj.value.error = '该资产必须为整数'; return }
	if (adj.value.reason.trim().length == 0) { adj.value.error = '请填写备注'; return }

	// 调账接口（演示用本地直接改，真实接入时这里走 uni.request + 成功后才关闭弹层）
	const key : AssetKey = adj.value.assetKey
	const before : number = u[key]
	if (adj.value.direction == 'deduct' && before < num) {
		adj.value.error = '扣减失败：' + adjMeta.value.label + '当前仅 ' + fmtNum(before) + ' ' + adjMeta.value.unit
		return
	}
	const after : number = adj.value.direction == 'gift' ? before + num : before - num
	const finalVal : number = adjMeta.value.intOnly ? Math.round(after) : Math.round(after * 100) / 100
	u[key] = finalVal
	uni.showToast({ title: (adj.value.direction == 'gift' ? '已赠送' : '已扣减') + ' ' + num + ' ' + adjMeta.value.unit, icon: 'none' })
	adj.value.visible = false
}

/* ============== 荣誉弹层 ============== */
type HonorState = { visible : boolean, target : AdminUserRow | null }
const honor = ref<HonorState>({ visible: false, target: null })
const honorList = computed<UserHonorItem[]>((): UserHonorItem[] => {
	if (honor.value.target == null) { return [] }
	return getUserHonors(honor.value.target.id)
})
const medalText = (lvl : UserHonorItem['level']) : string => {
	if (lvl == 'gold') { return '金' }
	if (lvl == 'silver') { return '银' }
	return '铜'
}
const onTapHonor = (u : AdminUserRow) : void => { honor.value = { visible: true, target: u } }
const onTapHonorMask = () : void => { honor.value.visible = false }
const onTapHonorClose = () : void => { honor.value.visible = false }

/* ============== 账单弹层 ============== */
type BillFilter = 'all' | 'gift' | 'deduct' | 'buy' | 'redeem' | 'refund' | 'sign'
const BILL_FILTER_TABS : { key : BillFilter, label : string }[] = [
	{ key: 'all',    label: '全部' },
	{ key: 'gift',   label: '赠送' },
	{ key: 'deduct', label: '扣减' },
	{ key: 'buy',    label: '购入' },
	{ key: 'redeem', label: '兑换' },
	{ key: 'refund', label: '退回' },
	{ key: 'sign',   label: '签到' }
]
type BillState = { visible : boolean, target : AdminUserRow | null, filter : BillFilter }
const bill = ref<BillState>({ visible: false, target: null, filter: 'all' })
const billListAll = computed<UserBillItem[]>((): UserBillItem[] => {
	if (bill.value.target == null) { return [] }
	return getUserBills(bill.value.target.id)
})
const billList = computed<UserBillItem[]>((): UserBillItem[] => {
	const f = bill.value.filter
	const all = billListAll.value
	if (f == 'all') { return all }
	const out : UserBillItem[] = []
	const len : number = all.length
	for (let i : number = 0; i < len; i++) {
		if (all[i].type == f) { out.push(all[i]) }
	}
	return out
})
const onTapBill = (u : AdminUserRow) : void => { bill.value = { visible: true, target: u, filter: 'all' } }
const onTapBillMask = () : void => { bill.value.visible = false }
const onTapBillClose = () : void => { bill.value.visible = false }
const onTapBillFilter = (k : BillFilter) : void => { bill.value.filter = k }

/* ============== 改手机号弹层 ============== */
type PhoneState = { visible : boolean, target : AdminUserRow | null, next : string, reason : string, error : string }
const phone = ref<PhoneState>({ visible: false, target: null, next: '', reason: '', error: '' })
const onTapPhone = (u : AdminUserRow) : void => {
	phone.value = { visible: true, target: u, next: '', reason: '', error: '' }
}
const onPhoneInput = (e : any) : void => {
	phone.value.next = (e.detail.value || '').toString()
	phone.value.error = ''
}
const onPhoneReasonInput = (e : any) : void => {
	phone.value.reason = (e.detail.value || '').toString()
	phone.value.error = ''
}
const onTapPhoneCancel = () : void => { phone.value.visible = false }
const onTapPhoneMask = () : void => { phone.value.visible = false }
const onTapPhoneConfirm = () : void => {
	const u = phone.value.target
	if (u == null) { phone.value.visible = false; return }
	const next : string = phone.value.next.trim()
	if (next.length != 11) { phone.value.error = '手机号需 11 位'; return }
	if (!/^1[3-9]\d{9}$/.test(next)) { phone.value.error = '手机号格式不正确'; return }
	if (next == u.phone) { phone.value.error = '新手机号与当前一致'; return }
	// 真实接入：走修改手机号接口 → 成功才更新本地
	u.phone = next
	uni.showToast({ title: '已修改手机号', icon: 'none' })
	phone.value.visible = false
}
</script>

<style scoped>
.page {
	min-height: 100vh;
	background-image: linear-gradient(180deg, #0E1110 0%, #0A0C0B 40%, #0B0D0C 100%);
	padding: 20rpx 24rpx 24rpx;
	box-sizing: border-box;
}

/* ============ 顶栏：搜索框 ============ */
.topbar {
	padding: 6rpx 4rpx 16rpx;
}
.search-box {
	flex-direction: row;
	align-items: center;
	background-color: #171A19;
	border: 1rpx solid #242827;
	border-radius: 999rpx;
	padding: 10rpx 18rpx;
}
.search-box-loading {
	border-color: rgba(122, 182, 242, 0.55);
	background-color: rgba(122, 182, 242, 0.06);
}
.search-ico {
	width: 32rpx;
	height: 32rpx;
	border-radius: 16rpx;
	background-color: rgba(122, 182, 242, 0.18);
	align-items: center;
	justify-content: center;
	margin-right: 10rpx;
}
.search-ico-text {
	font-size: 20rpx;
	color: #7AB6F2;
	font-weight: 700;
}
.search-input {
	flex: 1;
	font-size: 25rpx;
	color: #EDEFEE;
	background-color: transparent;
}
.ph {
	color: #6E7573;
}
.search-clear {
	width: 32rpx;
	height: 32rpx;
	align-items: center;
	justify-content: center;
}
.search-clear-text {
	font-size: 28rpx;
	color: #8F9492;
	font-weight: 700;
}

/* 搜索 spinner：3 个跳动小点 */
.search-spinner {
	flex-direction: row;
	align-items: center;
	justify-content: center;
	margin-right: 4rpx;
}
.spinner-dot {
	width: 8rpx;
	height: 8rpx;
	border-radius: 4rpx;
	background-color: #7AB6F2;
	margin: 0 2rpx;
	opacity: 0.4;
}
.search-box-loading .spinner-dot {
	animation: spinner-bounce 1.2s infinite ease-in-out;
}
.spinner-dot-2 { animation-delay: 0.15s; }
.spinner-dot-3 { animation-delay: 0.3s; }
@keyframes spinner-bounce {
	0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
	40% { transform: scale(1); opacity: 1; }
}

/* ============ 统计条 ============ */
.summary {
	flex-direction: row;
	align-items: center;
	background-color: #131615;
	border: 1rpx solid #242827;
	border-radius: 16rpx;
	padding: 18rpx 22rpx;
	margin-bottom: 18rpx;
}
.summary-stat {
	flex-direction: row;
	align-items: baseline;
}
.summary-num {
	font-size: 30rpx;
	color: #7AB6F2;
	font-weight: 700;
	margin-right: 8rpx;
}
.summary-num-total {
	color: #EDEFEE;
}
.summary-key {
	font-size: 21rpx;
	color: #8F9492;
}
.summary-divider {
	width: 1rpx;
	height: 28rpx;
	background-color: #242827;
	margin: 0 22rpx;
}
.summary-state {
	flex: 1;
	align-items: flex-end;
}
.summary-state-text {
	font-size: 20rpx;
	color: #6E7573;
	max-width: 360rpx;
}

/* ============ 用户卡片（重设计） ============ */
.ucard {
	flex-direction: column;
	background-color: #1A1E1D;
	border-radius: 24rpx;
	border: 1rpx solid #2A2F2D;
	border-left-width: 6rpx;
	padding: 22rpx 24rpx;
	margin-bottom: 18rpx;
	box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
}

/* 顶部：头像 + 名称 + tier pill + phone */
.ucard-top {
	flex-direction: row;
	align-items: center;
	padding-bottom: 18rpx;
	border-bottom: 1rpx solid #242827;
}
.avatar {
	width: 84rpx;
	height: 84rpx;
	border-radius: 42rpx;
	background-color: #242827;
	align-items: center;
	justify-content: center;
	margin-right: 18rpx;
	border: 2rpx solid;
	position: relative;
}
.avatar-text {
	font-size: 34rpx;
	color: #EDEFEE;
	font-weight: 700;
}
.avatar-tier {
	position: absolute;
	right: -4rpx;
	bottom: -4rpx;
	width: 30rpx;
	height: 30rpx;
	border-radius: 15rpx;
	align-items: center;
	justify-content: center;
	border: 2rpx solid #171A19;
}
.avatar-tier-text {
	font-size: 17rpx;
	color: #0B0D0C;
	font-weight: 800;
}
.head {
	flex: 1;
	flex-direction: column;
}
.head-name-row {
	flex-direction: row;
	align-items: center;
}
.u-name {
	font-size: 31rpx;
	color: #EDEFEE;
	font-weight: 700;
	margin-right: 12rpx;
}
.tier-pill {
	padding: 4rpx 12rpx;
	border-radius: 999rpx;
	border: 1rpx solid;
}
.tier-pill-text {
	font-size: 19rpx;
	font-weight: 600;
}
.u-id {
	font-size: 21rpx;
	color: #8F9492;
	margin-top: 6rpx;
}
.head-phone {
	flex-direction: row;
	margin-top: 8rpx;
}
.phone-pill {
	padding: 4rpx 14rpx;
	background-color: rgba(122, 182, 242, 0.10);
	border: 1rpx solid rgba(122, 182, 242, 0.30);
	border-radius: 999rpx;
}
.phone-pill-text {
	font-size: 20rpx;
	color: #7AB6F2;
	font-weight: 600;
}

/* 核心数据 3 列 */
.stat-grid {
	flex-direction: row;
	margin-top: 16rpx;
	background-color: #0F1211;
	border: 1rpx solid #242827;
	border-radius: 14rpx;
	padding: 18rpx 0;
}
.stat-cell {
	flex: 1;
	flex-direction: column;
	align-items: center;
}
.stat-label {
	font-size: 19rpx;
	color: #6E7573;
}
.stat-val {
	font-size: 28rpx;
	color: #EDEFEE;
	font-weight: 700;
	margin-top: 6rpx;
}
.stat-val-main {
	color: #E8C275;
}
.stat-suffix {
	font-size: 18rpx;
	color: #8F9492;
	font-weight: 400;
	margin-left: 4rpx;
}

/* 资产 chip 行 */
.asset-row {
	flex-direction: row;
	margin-top: 14rpx;
	flex-wrap: wrap;
	justify-content: space-between;
}
.asset-chip {
	width: 18.4%;
	min-width: 110rpx;
	flex-direction: column;
	align-items: center;
	padding: 12rpx 4rpx;
	background-color: #0F1211;
	border: 1rpx solid #242827;
	border-radius: 12rpx;
	margin-bottom: 8rpx;
}
.asset-key {
	font-size: 19rpx;
	color: #8F9492;
}
.asset-val {
	font-size: 23rpx;
	color: #EDEFEE;
	font-weight: 700;
	margin-top: 4rpx;
}
.asset-chip-money .asset-val {
	color: #E8C275;
}
.asset-chip-jd .asset-val {
	color: #57C79A;
}

/* 套餐券 + 大师分 */
.voucher-row {
	flex-direction: row;
	align-items: center;
	margin-top: 10rpx;
}
.v-chip {
	flex-direction: row;
	align-items: center;
	justify-content: center;
	padding: 8rpx 14rpx;
	border-radius: 999rpx;
	border: 1rpx solid;
	margin-right: 8rpx;
}
.v-chip-a {
	background-color: rgba(42, 169, 122, 0.10);
	border-color: rgba(42, 169, 122, 0.35);
}
.v-chip-b {
	background-color: rgba(232, 194, 117, 0.10);
	border-color: rgba(232, 194, 117, 0.35);
}
.v-chip-c {
	background-color: rgba(176, 122, 232, 0.10);
	border-color: rgba(176, 122, 232, 0.35);
}
.v-key {
	font-size: 18rpx;
	color: #8F9492;
	margin-right: 6rpx;
}
.v-chip-a .v-val { color: #57C79A; }
.v-chip-b .v-val { color: #E8C275; }
.v-chip-c .v-val { color: #B07AE8; }
.v-val {
	font-size: 20rpx;
	font-weight: 700;
}
.master-chip {
	margin-left: auto;
	flex-direction: row;
	align-items: center;
	padding: 8rpx 14rpx;
	border-radius: 999rpx;
	background-color: rgba(255, 233, 184, 0.10);
	border: 1rpx solid rgba(255, 233, 184, 0.35);
}
.master-key {
	font-size: 18rpx;
	color: #8F9492;
	margin-right: 6rpx;
}
.master-val {
	font-size: 20rpx;
	color: #FFE9B8;
	font-weight: 700;
}

/* 操作 */
.actions {
	flex-direction: row;
	margin-top: 16rpx;
	padding-top: 14rpx;
	border-top: 1rpx solid #242827;
}
.act {
	flex: 1;
	align-items: center;
	padding: 14rpx 0;
	border-radius: 12rpx;
	background-color: #0F1211;
	margin-right: 10rpx;
}
.act:last-child {
	margin-right: 0;
}
.act-primary {
	background-image: linear-gradient(135deg, rgba(232, 194, 117, 0.18), rgba(232, 194, 117, 0.08));
	border: 1rpx solid rgba(232, 194, 117, 0.45);
}
.act-text {
	font-size: 23rpx;
	color: #C7CDCB;
	font-weight: 600;
}
.act-text-primary {
	color: #E8C275;
}

/* ============ 列表脚注 / 空态 ============ */
.list-foot {
	padding: 14rpx 0;
	align-items: center;
}
.list-foot-text {
	font-size: 21rpx;
	color: #6E7573;
}
.footer-blank {
	height: 40rpx;
}
.list-empty {
	flex-direction: column;
	align-items: center;
	padding: 120rpx 0;
}
.list-empty-icon {
	width: 100rpx;
	height: 100rpx;
	border-radius: 50rpx;
	background-color: #171A19;
	border: 1rpx solid #242827;
	align-items: center;
	justify-content: center;
	margin-bottom: 20rpx;
}
.list-empty-icon-text {
	font-size: 44rpx;
	color: #6E7573;
	font-weight: 600;
}
.list-empty-title {
	font-size: 26rpx;
	color: #C7CDCB;
	font-weight: 600;
}
.list-empty-sub {
	font-size: 21rpx;
	color: #6E7573;
	margin-top: 8rpx;
}

/* ============ 弹层通用 ============ */
.dlg-overlay {
	position: fixed;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.6);
	align-items: center;
	justify-content: center;
	z-index: 100;
}
.dlg-card {
	width: 660rpx;
	max-height: 80vh;
	background-color: #1A1E1D;
	border-radius: 28rpx;
	border: 1rpx solid #2A2F2D;
	padding: 24rpx 26rpx;
	box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
}
.dlg-card-tall {
	max-height: 86vh;
}
.dlg-head {
	padding-bottom: 18rpx;
	border-bottom: 1rpx solid #242827;
	margin-bottom: 16rpx;
}
.dlg-title {
	font-size: 30rpx;
	color: #EDEFEE;
	font-weight: 700;
}
.dlg-sub {
	font-size: 20rpx;
	color: #8F9492;
	margin-top: 6rpx;
}
.field {
	margin-bottom: 18rpx;
}
.field-label {
	font-size: 22rpx;
	color: #C7CDCB;
	margin-bottom: 10rpx;
}
.field-input {
	background-color: #0F1211;
	border: 1rpx solid #242827;
	border-radius: 12rpx;
	padding: 16rpx 18rpx;
	font-size: 26rpx;
	color: #EDEFEE;
}
.field-ph {
	color: #4A4F4D;
}
.field-static {
	font-size: 26rpx;
	color: #EDEFEE;
	font-weight: 600;
	padding: 14rpx 0;
}
.field-current-val {
	font-size: 26rpx;
	color: #E8C275;
	font-weight: 600;
}
.dlg-error {
	font-size: 22rpx;
	color: #FF6255;
	margin-bottom: 12rpx;
}
.dlg-btns {
	flex-direction: row;
	margin-top: 8rpx;
}
.dlg-btn {
	flex: 1;
	align-items: center;
	padding: 18rpx 0;
	border-radius: 14rpx;
	margin-right: 14rpx;
}
.dlg-btn:last-child {
	margin-right: 0;
}
.dlg-btn-cancel {
	background-color: #0F1211;
	border: 1rpx solid #2A2F2D;
}
.dlg-btn-ok {
	background-image: linear-gradient(135deg, #7AB6F2, #4E8CC9);
}
.dlg-btn-full {
	margin-right: 0;
}
.dlg-btn-text {
	font-size: 26rpx;
	font-weight: 700;
}
.dlg-btn-cancel-text {
	color: #C7CDCB;
}
.dlg-btn-ok-text {
	color: #14100A;
}

/* ============ 调账弹层：资产 + 方向 ============ */
.asset-grid {
	flex-direction: row;
	flex-wrap: wrap;
}
.asset-chip-btn {
	padding: 10rpx 18rpx;
	border-radius: 12rpx;
	background-color: #0F1211;
	border: 1rpx solid #2A2F2D;
	margin-right: 12rpx;
	margin-bottom: 12rpx;
}
.asset-on {
	border-width: 1rpx;
}
.asset-chip-btn-text {
	font-size: 22rpx;
	color: #C7CDCB;
	font-weight: 600;
}

.dir-row {
	flex-direction: row;
}
.dir-chip {
	flex: 1;
	align-items: center;
	padding: 16rpx 0;
	border-radius: 14rpx;
	margin-right: 12rpx;
	border: 1rpx solid #2A2F2D;
}
.dir-chip:last-child {
	margin-right: 0;
}
.dir-off {
	background-color: #0F1211;
}
.dir-on-gift {
	background-color: rgba(42, 169, 122, 0.18);
	border-color: rgba(42, 169, 122, 0.55);
}
.dir-on-deduct {
	background-color: rgba(255, 98, 85, 0.18);
	border-color: rgba(255, 98, 85, 0.55);
}
.dir-text {
	font-size: 26rpx;
	color: #C7CDCB;
	font-weight: 600;
}
.dir-text-on {
	color: #EDEFEE;
}

/* ============ 荣誉弹层 ============ */
.honor-scroll {
	max-height: 60vh;
}
.honor-row {
	flex-direction: row;
	align-items: center;
	padding: 18rpx 6rpx;
	border-bottom: 1rpx solid #242827;
}
.honor-row:last-child {
	border-bottom: 0;
}
.honor-medal {
	width: 64rpx;
	height: 64rpx;
	border-radius: 32rpx;
	align-items: center;
	justify-content: center;
	margin-right: 16rpx;
}
.medal-gold {
	background-color: rgba(232, 194, 117, 0.22);
	border: 1rpx solid rgba(232, 194, 117, 0.55);
}
.medal-silver {
	background-color: rgba(199, 205, 203, 0.22);
	border: 1rpx solid rgba(199, 205, 203, 0.55);
}
.medal-bronze {
	background-color: rgba(176, 122, 91, 0.22);
	border: 1rpx solid rgba(176, 122, 91, 0.55);
}
.honor-medal-text {
	font-size: 26rpx;
	font-weight: 700;
	color: #EDEFEE;
}
.honor-main {
	flex: 1;
	flex-direction: column;
}
.honor-title {
	font-size: 25rpx;
	color: #EDEFEE;
	font-weight: 600;
}
.honor-sub {
	font-size: 20rpx;
	color: #8F9492;
	margin-top: 4rpx;
}
.honor-date {
	font-size: 20rpx;
	color: #6E7573;
}
.honor-empty {
	padding: 80rpx 0;
	align-items: center;
}
.honor-empty-text {
	font-size: 22rpx;
	color: #6E7573;
}

/* ============ 账单弹层 ============ */
.bill-filter {
	flex-direction: row;
	margin-bottom: 12rpx;
}
.filter-chip {
	padding: 8rpx 18rpx;
	border-radius: 999rpx;
	background-color: #0F1211;
	border: 1rpx solid #2A2F2D;
	margin-right: 10rpx;
}
.filter-on {
	background-color: rgba(122, 182, 242, 0.18);
	border-color: rgba(122, 182, 242, 0.55);
}
.filter-chip-text {
	font-size: 21rpx;
	color: #C7CDCB;
	font-weight: 600;
}
.filter-chip-text-on {
	color: #7AB6F2;
}

.bill-scroll {
	max-height: 56vh;
}
.bill-row {
	flex-direction: row;
	align-items: center;
	padding: 16rpx 4rpx;
	border-bottom: 1rpx solid #242827;
}
.bill-row:last-child {
	border-bottom: 0;
}
.bill-type {
	padding: 6rpx 12rpx;
	border-radius: 999rpx;
	border-width: 1rpx;
	margin-right: 14rpx;
}
.bill-type-text {
	font-size: 19rpx;
	font-weight: 700;
}
.bill-main {
	flex: 1;
	flex-direction: column;
}
.bill-asset {
	font-size: 22rpx;
	color: #EDEFEE;
	font-weight: 600;
}
.bill-reason {
	font-size: 19rpx;
	color: #8F9492;
	margin-top: 4rpx;
}
.bill-right {
	align-items: flex-end;
}
.bill-delta {
	font-size: 26rpx;
	font-weight: 700;
}
.bill-delta-up {
	color: #57C79A;
}
.bill-delta-down {
	color: #FF6255;
}
.bill-date {
	font-size: 19rpx;
	color: #6E7573;
	margin-top: 4rpx;
}
.bill-empty {
	padding: 80rpx 0;
	align-items: center;
}
.bill-empty-text {
	font-size: 22rpx;
	color: #6E7573;
}
</style>