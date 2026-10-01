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

		<!-- ============ 用户卡片列表 ============ -->
		<view
			v-for="u in visible"
			:key="u.id"
			class="ucard"
			:style="'border-left-width:6rpx;'"
		>

			<!-- 顶部身份区：头像 + 昵称 + 编号/手机号 -->
			<view class="ucard-top">
				<view class="avatar">
					<image v-if="u.avatar" :src="u.avatar" class="avatar-img" mode="aspectFill" />
					<text v-else class="avatar-text">{{ avatarText(u) }}</text>
				</view>
				<view class="head">
					<view class="head-name-row">
						<text class="u-name">{{ u.username }}</text>
					</view>
					<view class="u-meta-row">
						<text class="u-id">{{ u.userNo }}</text>
						<view class="phone-pill">
							<text class="phone-pill-text">手机号：{{ u.phone }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 核心数据 3 列：段位分 / 月票 / 直通函 -->
			<view class="stat-grid">
				<view class="stat-cell">
					<text class="stat-label">段位分</text>
					<text class="stat-val stat-val-main">{{ u.rankingScore }}</text>
				</view>
				<view class="stat-cell">
					<text class="stat-label">月票</text>
					<text class="stat-val">{{ u.monthTicket }}<text class="stat-suffix">张</text></text>
				</view>
				<view class="stat-cell">
					<text class="stat-label">直通函</text>
					<text class="stat-val">{{ u.inviteCard }}<text class="stat-suffix">张</text></text>
				</view>
			</view>

			<!-- 各门店资产：余额 / 门票 / 积分 / 酒德 / 成长 + 套餐券 -->
			<view class="store-block" v-for="balance in (u.balanceList ?? [])" :key="balance.storeId">
				<view class="store-head">
					<text class="store-name">{{ balance.storeName }}</text>
				</view>
				<view class="store-grid" v-if="balance.storeType == 'silent'">
					<view class="store-cell">
						<text class="store-label">余额</text>
						<text class="store-val store-val-money">{{ fmtNum(balance.balance) }}</text>
					</view>
					<view class="store-cell">
						<text class="store-label">门票</text>
						<text class="store-val">{{ balance.ticket }}</text>
					</view>
					
				</view>
				<view class="store-grid" v-if="balance.storeType == 'jiude'">
					<view class="store-cell">
						<text class="store-label">积分</text>
						<text class="store-val">{{ balance.points }}</text>
					</view>
					<view class="store-cell">
						<text class="store-label">余额</text>
						<text class="store-val store-val-jd">{{ balance.amount }}</text>
					</view>
					<view class="store-cell">
						<text class="store-label">成长值</text>
						<text class="store-val">{{ balance.totalAmount }}</text>
					</view>
					<view class="store-cell">
						<text class="store-label">套餐A</text>
						<text class="store-val">{{ balance.comboA }}</text>
					</view>
					<view class="store-cell">
						<text class="store-label">套餐B</text>
						<text class="store-val">{{ balance.comboB }}</text>
					</view>
					<view class="store-cell">
						<text class="store-label">套餐C</text>
						<text class="store-val">{{ balance.comboC }}</text>
					</view>
				</view>
			</view>
			<view class="store-empty" v-if="!u.balanceList || u.balanceList.length == 0">
				<text class="store-empty-text">暂无门店资产</text>
			</view>

			<!-- 操作 4 入口 -->
			<view class="actions">
				<view class="act act-primary" @tap="onTapAdjust(u, 'silent')">
					<text class="act-text act-text-primary">调账</text>
				</view>
				<view class="act act-primary" @tap="onTapAdjust(u, 'jiude')">
					<text class="act-text act-text-primary">酒德</text>
				</view>
				<view class="act" @tap="onTapHonor(u)">
					<text class="act-text">荣誉</text>
				</view>
				<view class="act" @tap="onTapBill(u)">
					<text class="act-text">账单</text>
				</view>
				<view class="act" @tap="onTapJiudeBill(u)">
					<text class="act-text">酒德账单</text>
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
			<text class="list-foot-text">{{ loading ? '加载中…' : (noMore ? ('— 共 ' + total + ' 人 —') : '上拉加载更多') }}</text>
		</view>

		<view class="footer-blank"></view>
	</scroll-view>

	<!-- ============ 调账弹层（赠送/扣减） ============ -->
	<view v-if="adj.visible" class="dlg-overlay" @tap="onTapAdjMask">
		<view class="dlg-card dlg-card-tall" @tap.stop="">
			<view class="dlg-head">
				<text class="dlg-title">调账 · {{ adj.target?.username ?? '' }}</text>
				<text class="dlg-sub">赠送/扣减后即时生效，操作不可撤销</text>
			</view>

			<view class="field">
				<text class="field-label">门店</text>
				<view class="picker-box" @tap="onOpenStoreSelect">
					<text class="picker-text" :class="{ 'picker-text-empty': adjStore == null }">{{ adjStore != null ? adjStore.name : '选择门店' }}</text>
					<text class="picker-arrow">▾</text>
				</view>
			</view>

			<view class="field">
				<text class="field-label">资产</text>
				<view class="asset-grid">
					<view
						v-for="a in BAL_META"
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

			<!-- 门店选择弹层（自定义，带关键词搜索） -->
			<view v-if="storeSel.visible" class="dlg-overlay dlg-overlay-top" @tap="onCloseStoreSelect">
				<view class="dlg-card store-sel-card" @tap.stop="">
					<view class="dlg-head">
						<text class="dlg-title">选择门店</text>
						<text class="dlg-sub">支持门店名称关键词搜索</text>
					</view>

					<view class="store-sel-search">
						<text class="store-sel-search-ico">🔍</text>
						<input
							class="store-sel-search-input"
							type="text"
							:value="storeSel.keyword"
							placeholder="搜索门店名称"
							placeholder-class="field-ph"
							confirm-type="search"
							@input="onStoreSearchInput"
						/>
					</view>

					<scroll-view class="store-sel-list" scroll-y>
						<view v-if="storeSel.searching" class="store-sel-state">
							<text class="store-sel-state-text">搜索中…</text>
						</view>
						<view v-else-if="storeSel.list.length == 0" class="store-sel-state">
							<text class="store-sel-state-text">未找到相关门店</text>
						</view>
						<template v-else>
							<view
								v-for="(s, i) in storeSel.list"
								:key="s.id"
								class="store-sel-row"
								:class="{ 'store-sel-row-on': adjStore != null && adjStore.id == s.id }"
								@tap="onPickStore(i)"
							>
								<view class="store-sel-main">
									<text class="store-sel-name">{{ s.name }}</text>
									<text class="store-sel-addr" v-if="s.address.length > 0">{{ s.address }}</text>
								</view>
								<text class="store-sel-check" v-if="adjStore != null && adjStore.id == s.id">✓</text>
							</view>
						</template>
					</scroll-view>
				</view>
			</view>
		</view>

	<!-- ============ 改手机号弹层 ============ -->
	<view v-if="phone.visible" class="dlg-overlay" @tap="onTapPhoneMask">
		<view class="dlg-card" @tap.stop="">
			<view class="dlg-head">
				<text class="dlg-title">改手机号 · {{ phone.target?.username ?? '' }}</text>
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
import { fetchAdminUserList, updateBalance, bindPhone } from '@/common/user-api'
import type { CustomerVO, UserBalanceVO, BalanceUpdateParams } from '@/common/user-api'
import { fetchSimpleStores } from '@/common/store-api'
import type { SimpleStoreVO } from '@/common/store-api'

/* ============== 数据层（真实接口） ============== */
// GET /user/list?keyword=&page=&limit=，返回 CustomerVO；资产在 balanceList 里按门店拆分
const fetchUsers = (kw : string, page : number, limit : number) : Promise<{ list : CustomerVO[], total : number }> => {
	return fetchAdminUserList(kw, page, limit).then((r : { list : CustomerVO[], total : number }) : { list : CustomerVO[], total : number } => {
		return { list: r.list, total: r.total }
	})
}

/* ============== 状态 ============== */
// visible 是已加载并渲染的行（服务端分页逐页追加）；total 是服务端命中总数
const visible = ref<CustomerVO[]>([])
const keyword = ref<string>('')
const searching = ref(false)               // 搜索 loading
const loading = ref(false)                 // 分页 loading
const noMore = ref(true)
const PAGE_SIZE : number = 20
const total = ref<number>(0)               // 命中总数（无关键词时 = 全量用户数）
const pageNo = ref<number>(0)              // 已加载到的页码
/* ============== 初始化：onLoad → 调一次接口拉第一页 ============== */
const doFetch = (kw : string, resetPage : boolean) : void => {
	if (kw.trim().length > 0) { searching.value = true }
	const page : number = resetPage ? 1 : pageNo.value + 1
	fetchUsers(kw, page, PAGE_SIZE).then((res : { list : CustomerVO[], total : number }) : void => {
		// 过期请求：忽略结果
		visible.value = resetPage ? res.list : visible.value.concat(res.list)
		pageNo.value = page
		total.value = res.total
		noMore.value = res.list.length < PAGE_SIZE
		searching.value = false
		loading.value = false
	}).catch((): void => {
		searching.value = false
		loading.value = false
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

/* ============== 分页：触底加载下一页（服务端翻页） ============== */
const loadMore = () : void => {
	if (loading.value || noMore.value || searching.value) { return }
	loading.value = true
	doFetch(keyword.value, false)
}

/* ============== 展示工具 ============== */
const avatarText = (u : CustomerVO) : string => (u.username || '').length > 0 ? u.username.substring(0, 1) : '?'
const fmtNum = (n : number) : string => {
	const v : number = Number(n)
	if (!Number.isFinite(v)) { return '0' }
	if (Number.isInteger(v)) { return v.toString() }
	return v.toFixed(2)
}

/* ============== 调账弹层 ============== */
type AdjDirection = 'gift' | 'deduct'
// 可调资产：storeType 为 '' 的挂在用户 CustomerVO 上（不需要选门店），
// 其余挂在门店钱包 UserBalanceVO 上，按门店类型（silent / jiude）过滤
type BalKey = 'balance' | 'ticket' | 'points' | 'amount' | 'totalAmount' | 'comboA' | 'comboB' | 'comboC' | 'monthTicket' | 'inviteCard'
type BalMeta = { key : BalKey, label : string, color : string, unit : string, intOnly : boolean }
let BAL_META : BalMeta[] = []
const SILENT_BAL_META : BalMeta[] = [
	// silent 门店：余额 / 门票
	{ key: 'balance',     label: '余额',     color: '#E8C275', unit: '元', intOnly: false },
	{ key: 'ticket',      label: '门票',     color: '#7AB6F2', unit: '张', intOnly: true },
	// 用户级：月票 / 直通函，不需要选择门店
	{ key: 'monthTicket', label: '月票',     color: '#2AA97A', unit: '张', intOnly: true },
	{ key: 'inviteCard',  label: '直通函',   color: '#2AA97A', unit: '张', intOnly: true }
]
const JIUDE_BAL_META : BalMeta[] = [
	// jiude 门店：积分 / 酒德余额 / 成长值 / 套餐券A B C
	{ key: 'amount',      label: '酒德余额', color: '#57C79A', unit: '元', intOnly: true },
	{ key: 'totalAmount', label: '成长值',   color: '#7AB6F2', unit: '点', intOnly: true },		
	{ key: 'comboA',      label: '套餐券A',  color: '#2AA97A', unit: '张', intOnly: true },
	{ key: 'comboB',      label: '套餐券B',  color: '#E8C275', unit: '张', intOnly: true },
	{ key: 'comboC',      label: '套餐券C',  color: '#B07AE8', unit: '张', intOnly: true }
]

const balMetaOf = (k : BalKey) : BalMeta => {
	const list : BalMeta[] = BAL_META
	for (let i : number = 0; i < list.length; i++) { if (list[i].key == k) { return list[i] } }
	return list[0]
}

type AdjState = {
	visible : boolean
	target : CustomerVO | null
	storeType : string
	assetKey : BalKey
	direction : AdjDirection
	amount : string
	reason : string
	error : string
}
const adj = ref<AdjState>({
	visible: false,
	target: null,
	storeType: 'silent',
	assetKey: 'balance',   // 默认调用户级资产（余额），不依赖门店
	direction: 'gift',
	amount: '',
	reason: '',
	error: ''
})
const adjMeta = computed<BalMeta>(() => balMetaOf(adj.value.assetKey))

/* 门店选择：GET /store/simple-list?keyword=&limit=10，自定义弹层 + 关键词搜索 */
const adjStore = ref<SimpleStoreVO | null>(null)
type StoreSelState = {
	visible : boolean
	keyword : string
	searching : boolean
	list : SimpleStoreVO[]
}
const storeSel = ref<StoreSelState>({ visible: false, keyword: '', searching: false, list: [] })
let storeSeq : number = 0                     // 搜索序号，过期回调丢弃
let storeSearchTimer : any = null             // 输入防抖
const loadStoreOptions = (kw : string, storeType : string) : void => {
	const seq : number = ++storeSeq
	if (kw.trim().length > 0) { storeSel.value.searching = true }
	fetchSimpleStores(kw, storeType, 10).then((list : SimpleStoreVO[]) : void => {
		if (seq !== storeSeq) { return }
		storeSel.value.list = list
		storeSel.value.searching = false
	}).catch((): void => {
		if (seq !== storeSeq) { return }
		storeSel.value.searching = false
		uni.showToast({ title: '门店查询失败', icon: 'none' })
	})
}
const onOpenStoreSelect = () : void => {
	if (storeSearchTimer != null) { clearTimeout(storeSearchTimer); storeSearchTimer = null }
	storeSel.value = { visible: true, keyword: '', searching: false, list: [] }
	loadStoreOptions('', adj.value.storeType)
}
const onStoreSearchInput = (e : any) : void => {
	storeSel.value.keyword = (e.detail.value || '').toString()
	if (storeSearchTimer != null) { clearTimeout(storeSearchTimer) }
	storeSearchTimer = setTimeout((): void => {
		loadStoreOptions(storeSel.value.keyword, adj.value.storeType)
	}, 300)
}
const onPickStore = (i : number) : void => {
	const s : SimpleStoreVO | undefined = storeSel.value.list[i]
	if (s == null) { return }
	adjStore.value = s
	storeSel.value.visible = false
	adj.value.error = ''
}
const onCloseStoreSelect = () : void => { storeSel.value.visible = false }
// 选中门店在该用户名下的钱包；门店尚未开户时为 null
const adjWallet = computed<UserBalanceVO | null>(() => {
	const t = adj.value.target
	const s = adjStore.value
	if (t == null || s == null || !t.balanceList) { return null }
	for (let i : number = 0; i < t.balanceList.length; i++) {
		if (t.balanceList[i].storeId == s.id) { return t.balanceList[i] }
	}
	return null
})
// 用户级资产（月票/直通函）读写
const userAssetVal = (u : CustomerVO, k : BalKey) : number => {
	if (k == 'monthTicket') { return Number(u.monthTicket ?? 0) }
	if (k == 'inviteCard') { return Number(u.inviteCard ?? 0) }
	return 0
}
// 当前资产值：月票/直通函挂用户身上，其余读所选门店钱包（未选门店显示 0）
const adjCurrentVal = computed((): string => {
	const k : BalKey = adj.value.assetKey
	if (k == 'monthTicket' || k == 'inviteCard') {
		const u = adj.value.target
		if (u == null) { return '0' }
		return fmtNum(userAssetVal(u, k))
	}
	const w = adjWallet.value
	if (w == null) { return '0' }
	return fmtNum(w[k])
})
const onTapAdjust = (u : CustomerVO, storeType : string) : void => {
	BAL_META = storeType == 'silent' ? SILENT_BAL_META : JIUDE_BAL_META
	adj.value = {
		visible: true, target: u, storeType: storeType,
		assetKey: BAL_META.length > 0 ? BAL_META[0].key : 'balance',   // 默认选该类型第一项
		direction: 'gift', amount: '', reason: '', error: ''
	}
	adjStore.value = null
}
const onTapAsset = (k : BalKey) : void => {
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
const onTapAdjCancel = () : void => { adj.value.visible = false }
const onTapAdjMask = () : void => { adj.value.visible = false }
const onTapAdjConfirm = () : void => {
	const u = adj.value.target
	if (u == null) { adj.value.visible = false; return }
	const a : BalMeta = adjMeta.value
	const raw : string = adj.value.amount.trim()
	if (raw.length == 0) { adj.value.error = '请输入数量'; return }
	const num : number = Number(raw)
	// 后端 BalanceUpdateRequest.amount 为 Integer，统一要求正整数
	if (!Number.isInteger(num) || num <= 0) { adj.value.error = '数量需为正整数'; return }

	if(adj.value.assetKey !== 'monthTicket' && adj.value.assetKey !== 'inviteCard') {
		if(adjStore.value == null) { adj.value.error = '请选择门店'; return }
	}
	// POST /balance/update
	const params : BalanceUpdateParams = {
		storeId: adjStore.value != null ? Number(adjStore.value.id) : 0,   // 月票/直通函等用户级资产传 0
		userId: Number(u.id),
		amount: num,
		balanceType: adj.value.assetKey,
		balanceAction: adj.value.direction
	}
	uni.showLoading({ title: '提交中' })
	updateBalance(params).then(() : void => {
		uni.hideLoading()
		uni.showToast({ title: (adj.value.direction == 'gift' ? '已赠送 ' : '已扣减 ') + num + ' ' + a.unit, icon: 'none' })
		adj.value.visible = false
		// 重新拉取列表，以服务端数据为准
		doFetch(keyword.value, true)
	}).catch((e : any) : void => {
		uni.hideLoading()
		adj.value.error = (e && e.message) ? e.message : '调账失败，请重试'
	})
}

const onTapHonor = (u : CustomerVO) : void => {
	uni.navigateTo({ url: '/pages/settings/honor-cards?userId=' + u.id })
}

const onTapBill = (u : CustomerVO) : void => {
	uni.navigateTo({ url: '/pages/settings/consume-records?userId=' + u.id })
}

const onTapJiudeBill = (u : CustomerVO) : void => {
	uni.navigateTo({ url: '/pages/jiude-billing/jiude-billing?userId=' + u.id })
}

/* ============== 改手机号弹层 ============== */
type PhoneState = { visible : boolean, target : CustomerVO | null, next : string, error : string }
const phone = ref<PhoneState>({ visible: false, target: null, next: '', error: '' })
const onTapPhone = (u : CustomerVO) : void => {
	phone.value = { visible: true, target: u, next: '', error: '' }
}
const onPhoneInput = (e : any) : void => {
	phone.value.next = (e.detail.value || '').toString()
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
	// POST /user/bind-phone
	uni.showLoading({ title: '提交中' })
	bindPhone({ userId: Number(u.id), phone: next }).then(() : void => {
		uni.hideLoading()
		uni.showToast({ title: '已修改手机号', icon: 'none' })
		phone.value.visible = false
		// 重新拉取列表，以服务端数据为准
		doFetch(keyword.value, true)
	}).catch((e : any) : void => {
		uni.hideLoading()
		phone.value.error = (e && e.message) ? e.message : '修改失败，请重试'
	})
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

/* 顶部：头像 + 昵称 + 编号/手机号 */
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
	border: 2rpx solid #2A2F2D;
	position: relative;
}
.avatar-img {
	width: 100%;
	height: 100%;
	border-radius: 40rpx;
}
.avatar-text {
	font-size: 34rpx;
	color: #EDEFEE;
	font-weight: 700;
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
.u-meta-row {
	flex-direction: row;
	align-items: center;
	margin-top: 6rpx;
}
.u-id {
	font-size: 21rpx;
	color: #8F9492;
	margin-right: 12rpx;
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

/* ============ 门店资产块 ============ */
.store-block {
	margin-top: 14rpx;
	background-color: #0F1211;
	border: 1rpx solid #242827;
	border-radius: 14rpx;
	padding: 16rpx 18rpx;
}
.store-head {
	flex-direction: row;
	align-items: center;
	margin-bottom: 12rpx;
}
.store-name {
	font-size: 23rpx;
	color: #C7CDCB;
	font-weight: 600;
}
.store-grid {
	flex-direction: row;
}
.store-cell {
	flex: 1;
	flex-direction: column;
	align-items: center;
}
.store-label {
	font-size: 19rpx;
	color: #6E7573;
}
.store-val {
	font-size: 24rpx;
	color: #EDEFEE;
	font-weight: 700;
	margin-top: 4rpx;
}
.store-val-money {
	color: #E8C275;
}
.store-val-jd {
	color: #57C79A;
}
.store-combos {
	flex-direction: row;
	align-items: center;
	margin-top: 12rpx;
}
.store-empty {
	margin-top: 14rpx;
	padding: 18rpx 0;
	align-items: center;
	background-color: #0F1211;
	border: 1rpx solid #242827;
	border-radius: 14rpx;
}
.store-empty-text {
	font-size: 21rpx;
	color: #6E7573;
}

/* 套餐券 chip（门店资产卡内复用） */
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
/* 门店选择触发框 */
.picker-box {
	flex-direction: row;
	align-items: center;
	background-color: #0F1211;
	border: 1rpx solid #242827;
	border-radius: 12rpx;
	padding: 16rpx 18rpx;
}
.picker-text {
	flex: 1;
	font-size: 26rpx;
	color: #EDEFEE;
}
.picker-text-empty {
	color: #6E7573;
}
.picker-arrow {
	font-size: 22rpx;
	color: #8F9492;
	margin-left: 10rpx;
}

/* 门店选择弹层（自定义，带搜索） */
.dlg-overlay-top {
	z-index: 120;
}
.store-sel-card {
	width: 620rpx;
}
.store-sel-search {
	flex-direction: row;
	align-items: center;
	background-color: #0F1211;
	border: 1rpx solid #242827;
	border-radius: 12rpx;
	padding: 14rpx 16rpx;
	margin-bottom: 14rpx;
}
.store-sel-search-ico {
	font-size: 24rpx;
	margin-right: 10rpx;
}
.store-sel-search-input {
	flex: 1;
	font-size: 26rpx;
	color: #EDEFEE;
}
.store-sel-list {
	max-height: 480rpx;
}
.store-sel-state {
	padding: 60rpx 0;
	align-items: center;
}
.store-sel-state-text {
	font-size: 22rpx;
	color: #6E7573;
}
.store-sel-row {
	flex-direction: row;
	align-items: center;
	padding: 20rpx 8rpx;
	border-bottom: 1rpx solid #242827;
}
.store-sel-main {
	flex: 1;
	flex-direction: column;
}
.store-sel-name {
	font-size: 26rpx;
	color: #EDEFEE;
	font-weight: 600;
}
.store-sel-addr {
	font-size: 20rpx;
	color: #8F9492;
	margin-top: 4rpx;
}
.store-sel-check {
	font-size: 26rpx;
	color: #7AB6F2;
	font-weight: 700;
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
</style>