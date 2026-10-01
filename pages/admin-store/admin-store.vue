<template>
	<scroll-view
		class="page"
		direction="vertical"
		:show-scrollbar="false"
		@scrolltolower="loadMore"
	>

		<!-- ============ 顶栏：门店数 + 新增入口 ============ -->
		<view class="topbar">
			<view class="count-wrap">
				<text class="count-num">{{ total }}</text>
				<text class="count-label">家门店</text>
			</view>
			<view class="add-btn" @tap="onTapAdd">
				<text class="add-btn-text">＋ 新增店铺</text>
			</view>
		</view>

		<!-- ============ 店铺列表（触底加载） ============ -->
		<view
			v-for="s in visible"
			:key="s.id"
			class="card"
		>
			<!-- 名称 + 店铺类型 -->
			<view class="card-head">
				<view class="card-head-left">
					<text class="store-name">{{ s.name }}</text>
					<view class="store-type-pill" :class="s.storeType == 'jiude' ? 'store-type-jiude' : 'store-type-silent'">
						<text class="store-type-text">{{ s.storeType == 'jiude' ? '酒德' : '德州' }}</text>
					</view>
				</view>
				<view class="store-id">
					<text class="store-id-text">#{{ s.id }}</text>
				</view>
			</view>

			<!-- 地址 -->
			<view class="addr-row">
				<view class="addr-icon">
					<text class="addr-icon-text">址</text>
				</view>
				<view class="addr-main">
					<text class="addr-text">{{ s.address }}</text>
					<text v-if="s.lat != 0" class="addr-coord">纬度 {{ s.lat.toFixed(4) }} · 经度 {{ s.lng.toFixed(4) }}</text>
				</view>
			</view>

			<!-- 比赛 / 玩家统计 -->
			<view class="stat-row">
				<view class="stat-cell">
					<text class="stat-val">{{ s.currentMatchCount }}/{{ s.totalMatchCount }}</text>
					<text class="stat-label">比赛中 / 总</text>
				</view>
				<view class="stat-divider"></view>
				<view class="stat-cell">
					<text class="stat-val">{{ s.currentPlayerCount }}/{{ s.totalPlayerCount }}</text>
					<text class="stat-label">玩家 / 总</text>
				</view>
				<view class="stat-divider"></view>
				<view class="stat-cell stat-cell-right">
					<view class="status-pill" :class="s.status != 'A' ? 'status-pill-on' : 'status-pill-off'">
						<view class="status-dot" :class="s.status != 'A' ? 'status-dot-on' : 'status-dot-off'"></view>
						<text class="status-pill-text" :class="s.status != 'A' ? 'status-text-on' : 'status-text-off'">{{ statusLabel(s) }}</text>
					</view>
					<text class="stat-label">状态</text>
				</view>
			</view>

			<view class="divider"></view>

			<!-- 店长列表 -->
			<view class="mem-block">
				<view class="mem-label">
					<text class="mem-label-text">店长</text>
				</view>
				<view class="mem-chips">
					<view v-for="m in s.managers" :key="m.id" class="chip chip-manager">
						<text class="chip-name chip-manager-text">{{ m.name }}</text>
						<text class="chip-id">{{ m.userNo }}</text>
					</view>
					<text v-if="s.managers.length == 0" class="mem-empty">暂无</text>
				</view>
			</view>

			<!-- 管理员列表 -->
			<view class="mem-block">
				<view class="mem-label">
					<text class="mem-label-text">管理员</text>
				</view>
				<view class="mem-chips">
					<view v-for="m in s.admins" :key="m.id" class="chip chip-admin">
						<text class="chip-name chip-admin-text">{{ m.name }}</text>
						<text class="chip-id">{{ m.userNo }}</text>
					</view>
					<text v-if="s.admins.length == 0" class="mem-empty">暂无</text>
				</view>
			</view>

			<view class="divider"></view>

			<!-- 操作区：按后端权限字段条件渲染 -->
			<view class="actions">
				<view v-if="s.canEdit" class="act" @tap="onTapEdit(s)">
					<text class="act-text">编辑</text>
				</view>
				<view v-if="s.canViewBilling" class="act" @tap="onTapBills(s)">
					<text class="act-text">账单</text>
				</view>
				<view v-if="s.canAddOwner" class="act" @tap="onTapEditManagers(s)">
					<text class="act-text">店长</text>
				</view>
				<view v-if="s.canAddManager" class="act" @tap="onTapEditAdmins(s)">
					<text class="act-text">管理员</text>
				</view>
				<view class="act act-danger" @tap="onTapDelete(s)">
					<text class="act-text act-danger-text">删除</text>
				</view>
			</view>
		</view>

		<!-- 加载状态 / 空态脚注 -->
		<view class="list-foot">
			<text class="list-foot-text">{{ footText }}</text>
		</view>

		<view class="footer-blank"></view>
	</scroll-view>

	<!-- ============ 新增 / 编辑弹层 ============ -->
	<view v-if="dialog.visible" class="dlg-overlay" @tap="onTapDlgMask">
		<view class="dlg-card" @tap.stop="">
			<view class="dlg-head">
				<text class="dlg-title">{{ dialog.mode == 'create' ? '新增店铺' : '编辑店铺' }}</text>
				<text class="dlg-sub">填写名称 / 类型 / 从地图选择地址</text>
			</view>

			<!-- 店铺类型：德州 / 酒德 -->
			<view class="field">
				<text class="field-label">店铺类型</text>
				<view class="type-seg">
					<view
						class="type-seg-item"
						:class="{ 'type-seg-on': dialog.storeType == 'silent' }"
						@tap="dialog.storeType = 'silent'"
					>
						<text class="type-seg-text" :class="{ 'type-seg-text-on': dialog.storeType == 'silent' }">德州（Silent）</text>
					</view>
					<view
						class="type-seg-item"
						:class="{ 'type-seg-on': dialog.storeType == 'jiude' }"
						@tap="dialog.storeType = 'jiude'"
					>
						<text class="type-seg-text" :class="{ 'type-seg-text-on': dialog.storeType == 'jiude' }">酒德（Jiude）</text>
					</view>
				</view>
			</view>

			<!-- 店铺名称 -->
			<view class="field">
				<text class="field-label">店铺名称</text>
				<input
					class="field-input"
					type="text"
					:value="dialog.name"
					placeholder="请输入店铺名称"
					placeholder-class="field-ph"
					@input="onNameInput"
				/>
			</view>

			<!-- 店铺地址：从地图选点 -->
			<view class="field">
				<view class="field-head">
					<text class="field-label">店铺地址</text>
					<text class="field-count">{{ dialog.lat != 0 ? '已定位' : '必选' }}</text>
				</view>
				<view class="select-btn" @tap="onTapChooseLocation">
					<view class="loc-left">
						<text
							class="select-btn-text"
							:class="{ 'select-btn-ph': dialog.address.length == 0 }"
						>{{ dialog.address.length > 0 ? dialog.address : '点击从地图选择地址' }}</text>
						<text v-if="dialog.lat != 0" class="loc-coord">纬度 {{ dialog.lat.toFixed(4) }} · 经度 {{ dialog.lng.toFixed(4) }}</text>
					</view>
					<text class="select-btn-arrow">›</text>
				</view>
			</view>

			<!-- 加载中 / 错误 -->
			<view v-if="dialog.saving" class="dlg-saving">
				<text class="dlg-saving-text">保存中…</text>
			</view>
			<text v-else-if="dialog.error.length > 0" class="dlg-error">{{ dialog.error }}</text>

			<view class="dlg-btns">
				<view class="dlg-btn dlg-btn-cancel" @tap="onTapDlgCancel">
					<text class="dlg-btn-text dlg-btn-cancel-text">取消</text>
				</view>
				<view class="dlg-btn dlg-btn-ok" :class="{ 'dlg-btn-disabled': dialog.saving }" @tap="onTapSave">
					<text class="dlg-btn-text dlg-btn-ok-text">{{ dialog.mode == 'create' ? '创建' : '保存' }}</text>
				</view>
			</view>
		</view>
	</view>

	<!-- ============ 选人弹层 ============ -->
	<view v-if="picker.visible" class="pk-overlay" @tap="onTapPickerMask">
		<view class="pk-card" @tap.stop="">
			<view class="pk-head">
				<text class="pk-title">{{ picker.field == 'owners' ? '选择店长' : '选择管理员' }}</text>
				<text class="pk-sub">{{ pickerSub }}</text>
			</view>

			<!-- 搜索框 -->
			<view class="pk-search">
				<view class="pk-search-icon">
					<text class="pk-search-icon-text">搜</text>
				</view>
				<input
					class="pk-input"
					type="text"
					:value="picker.keyword"
					placeholder="搜索昵称 / ID"
					placeholder-class="field-ph"
					@input="onKeywordInput"
				/>
			</view>

			<!-- 已选人员 -->
			<view v-if="picker.selected.length > 0" class="pk-selected">
				<view
					v-for="(m, mi) in picker.selected"
					:key="m.id"
					class="chip chip-sel"
					@tap="onTapRemoveSelected(mi)"
				>
					<text class="chip-name chip-sel-text">{{ m.name }}</text>
					<text class="chip-id">{{ m.userNo }}</text>
					<text class="chip-x">×</text>
				</view>
			</view>

			<!-- 搜索结果（来自 /user/list） -->
			<scroll-view class="pk-list" direction="vertical" :show-scrollbar="false">
				<view v-if="pkLoading" class="pk-empty">
					<text class="pk-empty-text">加载中…</text>
				</view>
				<view
					v-for="u in pickerUsers"
					:key="u.id"
					class="pk-row"
					:class="{ 'pk-row-on': isSelected(u) }"
					@tap="onTapUser(u)"
				>
					<view class="pk-avatar">
						<text class="pk-avatar-text">{{ u.name.substring(0, 1) }}</text>
					</view>
					<view class="pk-user">
						<text class="pk-user-name">{{ u.name }}</text>
						<text class="pk-user-id">{{ u.userNo }}</text>
					</view>
					<view class="pk-check" :class="{ 'pk-check-on': isSelected(u) }">
						<text class="pk-check-text">{{ isSelected(u) ? '✓' : '＋' }}</text>
					</view>
				</view>
				<view v-if="!pkLoading && pickerUsers.length == 0" class="pk-empty">
					<text class="pk-empty-text">未找到匹配用户</text>
				</view>
			</scroll-view>

			<view class="dlg-btns">
				<view class="dlg-btn dlg-btn-cancel" @tap="onTapPickerCancel">
					<text class="dlg-btn-text dlg-btn-cancel-text">取消</text>
				</view>
				<view class="dlg-btn dlg-btn-ok" @tap="onTapPickerConfirm">
					<text class="dlg-btn-text dlg-btn-ok-text">{{ pkSaving ? '提交中…' : '确定' + (picker.selected.length > 0 ? '（' + picker.selected.length + '）' : '') }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ADMIN_STORES } from '@/common/admin-store-data'
import { setLocationPickCallback } from '@/common/admin-location-data'
import type { AdminStore, StaffMember } from '@/common/admin-store-data'
import type { AdminPoi } from '@/common/admin-location-data'
import type { StoreVO } from '@/common/store-api'
import { fetchManageStores, createStore, updateStore, deleteStore, addStoreOwners, addStoreManagers } from '@/common/store-api'
import { fetchSimpleUserList } from '@/common/user-api'
import { fromStoreVO } from '@/common/admin-store-data'

/* ---------------- 接口数据 ---------------- */
const PAGE_SIZE : number = 20
const total = ref<number>(0)
const currentPage = ref<number>(0)              // 已加载到的最后一页；0 表示还没开始
const visible = ref<AdminStore[]>([])
const loading = ref<boolean>(false)
const noMore = ref<boolean>(false)
const firstLoad = ref<boolean>(true)
const loadError = ref<string>('')

const footText = computed<string>((): string => {
	if (loading.value) { return '加载中…' }
	if (firstLoad.value) { return '上拉加载更多' }
	if (loadError.value.length > 0) { return loadError.value + '，下拉重试' }
	if (noMore.value) { return '— 没有更多了 —' }
	return '上拉加载更多'
})

/** 从接口加载下一页；接口挂了用本地 mock 兜底 */
const loadMore = () : void => {
	if (loading.value || noMore.value) { return }
	loading.value = true
	const nextPage : number = currentPage.value + 1
	fetchManageStores(nextPage, PAGE_SIZE).then((page) => {
		const chunk : AdminStore[] = []
		const list : StoreVO[] = (page && page.list) || []
		for (let i : number = 0; i < list.length; i++) {
			chunk.push(fromStoreVO(list[i]))
		}
		const next : AdminStore[] = visible.value.slice()
		for (let i : number = 0; i < chunk.length; i++) { next.push(chunk[i]) }
		visible.value = next
		currentPage.value = nextPage
		// total 仅用于顶部「N 家门店」展示；翻页终止判断以本页实际返回条数为准，
		// 避免 total 缺失/为 0 时第一页后误判「没有更多」导致触底加载失效
		total.value = page.total ?? visible.value.length
		if (chunk.length < PAGE_SIZE) { noMore.value = true }
		firstLoad.value = false
		loadError.value = ''
	}).catch((err : Error) => {
		if (firstLoad.value) {
			loadMockStores()
		} else {
			loadError.value = err.message || '请求失败'
		}
	}).finally(() => {
		loading.value = false
	})
}

/** 接口挂了时的兜底：读本地 mock */
const loadMockStores = () : void => {
	visible.value = ADMIN_STORES.slice()
	currentPage.value = 1
	total.value = ADMIN_STORES.length
	noMore.value = true
	firstLoad.value = false
	loadError.value = ''
}

/** 重置分页并重新拉取第一页（人员变更等操作后刷新） */
const refreshStores = () : void => {
	visible.value = []
	currentPage.value = 0
	total.value = 0
	noMore.value = false
	firstLoad.value = true
	loadMore()
}

onMounted((): void => { loadMore() })

/* ---------------- 触底 ---------------- */
onReachBottom((): void => { loadMore() })

/* ---------------- 工具 ---------------- */
const indexOfStore = (id : number | string) : number => {
	const len : number = visible.value.length
	for (let i : number = 0; i < len; i++) {
		if (visible.value[i].id == id) { return i }
	}
	return -1
}

const statusLabel = (s : AdminStore) : string => {
	if (s.status == 'disabled') { return '已停用' }
	return '营业中'
}

/* ---------------- 新增 / 编辑弹层 ---------------- */
type DialogMode = 'create' | 'edit'
type DialogState = {
	visible : boolean
	mode : DialogMode
	storeId : number | string
	storeType : 'silent' | 'jiude'
	name : string
	address : string
	city : string
	lat : number
	lng : number
	error : string
	saving : boolean
}
const dialog = ref<DialogState>({
	visible: false, mode: 'create', storeId: '', storeType: 'silent',
	name: '', address: '', city: '', lat: 0, lng: 0, error: '', saving: false
})

const onTapAdd = () : void => {
	dialog.value = {
		visible: true, mode: 'create', storeId: '', storeType: 'silent',
		name: '', address: '', city: '', lat: 0, lng: 0, error: '', saving: false
	}
}
const onTapEdit = (s : AdminStore) : void => {
	dialog.value = {
		visible: true, mode: 'edit', storeId: s.id, storeType: s.storeType,
		name: s.name, address: s.address, city: s.city, lat: s.lat, lng: s.lng, error: '', saving: false
	}
}

const onTapDlgCancel = () : void => {
	if (dialog.value.saving) { return }
	dialog.value.visible = false
}
const onTapDlgMask = () : void => {
	if (dialog.value.saving) { return }
	dialog.value.visible = false
}

/* ---------------- 输入 / 地图选点 ---------------- */
const onNameInput = (e : any) : void => {
	dialog.value.name = (e.detail.value || '').toString()
	if (dialog.value.error) { dialog.value.error = '' }
}

const onTapChooseLocation = () : void => {
	setLocationPickCallback((poi : AdminPoi) : void => {
		dialog.value.address = poi.address.length > 0 ? poi.address : poi.name
		dialog.value.city = poi.city
		dialog.value.lat = poi.lat
		dialog.value.lng = poi.lng
		if (dialog.value.error) { dialog.value.error = '' }
	})
	const parts : string[] = []
	if (dialog.value.lat != 0) {
		parts.push('lat=' + dialog.value.lat.toString())
		parts.push('lng=' + dialog.value.lng.toString())
	}
	let url : string = '/pages/location-picker/location-picker'
	if (parts.length > 0) { url += '?' + parts.join('&') }
	uni.navigateTo({ url: url })
}

/* ---------------- 保存（调 store/create 接口） ---------------- */
const onTapSave = () : void => {
	const d = dialog.value
	if (d.name.trim().length == 0) { d.error = '请填写店铺名称'; return }
	if (d.lat == 0) { d.error = '请从地图选择地址'; return }

	dialog.value.saving = true
	dialog.value.error = ''

	const latStr : string = d.lat.toString()
	const lngStr : string = d.lng.toString()
	const type : 'silent' | 'jiude' = d.storeType

	const task : Promise<any> = d.mode == 'create'
		? createStore(d.name.trim(), d.city, d.address, type, latStr, lngStr)
		: updateStore(d.storeId, d.name.trim(), d.city, d.address, type, latStr, lngStr)

	task.then((res : any) => {
		// 更新本地列表：edit 原地替换；create 插头部 + 总量 +1
		if (d.mode == 'edit') {
			const i : number = indexOfStore(d.storeId)
			if (i >= 0) {
				visible.value[i].name = d.name.trim()
				visible.value[i].address = d.address
				visible.value[i].city = d.city
				visible.value[i].storeType = type
				visible.value[i].latitude = latStr
				visible.value[i].longitude = lngStr
				visible.value[i].lat = d.lat
				visible.value[i].lng = d.lng
			}
			uni.showToast({ title: '已保存', icon: 'none' })
		} else {
			// create：优先取后端返回的 id（兼容直接返回 id 或返回含 id 的对象）；
			// 拿不到时用 Date.now 临时占位，重新拉列表后自动覆盖
			const newId : number | string = res == null ? Date.now()
				: (typeof res == 'object' && res.id != null ? res.id : (typeof res != 'object' ? res : Date.now()))
			const newItem : AdminStore = {
				id: newId,
				name: d.name.trim(),
				city: d.city,
				address: d.address,
				latitude: latStr,
				longitude: lngStr,
				lat: d.lat,
				lng: d.lng,
				storeType: type,
				status: 'active',
				currentMatchCount: 0,
				totalMatchCount: 0,
				currentPlayerCount: 0,
				totalPlayerCount: 0,
				canEdit: true,
				canAddManager: true,
				canAddOwner: true,
				canViewBilling: true,
				managers: [],
				admins: []
			}
			visible.value.unshift(newItem)
			total.value += 1
			uni.showToast({ title: '已创建', icon: 'none' })
		}
		dialog.value.visible = false
	}).catch((err : Error) => {
		dialog.value.error = err.message || '保存失败'
	}).finally(() => {
		dialog.value.saving = false
	})
}

/* ---------------- 删除 ---------------- */
const onTapDelete = (s : AdminStore) : void => {
	uni.showModal({
		title: '删除店铺',
		content: '确定删除「' + s.name + '」吗？删除后不可恢复',
		confirmText: '删除',
		confirmColor: '#FF6255',
		success: (res : any) => {
			if (res.confirm) {
				deleteStore(s.id).then(() => {
					uni.showToast({ title: '已删除', icon: 'none' })
					refreshStores()
				}).catch((err : Error) => {
					uni.showToast({ title: err.message || '删除失败', icon: 'none' })
				})
			}
		}
	})
}

/* ---------------- 账单（跳转门店账单页） ---------------- */
const onTapBills = (s : AdminStore) : void => {
	let name : string = s.name
	// #ifdef H5
	const enc : string | null = encodeURIComponent(s.name)
	if (enc != null) { name = enc }
	// #endif
	uni.navigateTo({
		url: '/pages/admin-store/billing?storeId=' + s.id
			+ '&storeName=' + name
			+ '&storeType=' + s.storeType
	})
}

/* ---------------- 选人弹层 ---------------- */
// 字段名与后端语义对齐：owners=店长（ownerList）、managers=管理员（managerList）
type PickerField = 'owners' | 'managers'
type PickerState = {
	visible : boolean
	field : PickerField
	storeId : number | string
	storeName : string
	keyword : string
	selected : StaffMember[]
}
const picker = ref<PickerState>({
	visible: false, field: 'owners', storeId: '', storeName: '',
	keyword: '', selected: []
})
const pkSaving = ref(false)

const pickerSub = computed<string>((): string => {
	const role : string = picker.value.field == 'owners' ? '店长' : '管理员'
	return '搜索并选择用户，成为「' + picker.value.storeName + '」的' + role
})

/* 用户列表：来自 GET /user/list（keyword 搜索，300ms 防抖） */
type PickerUser = { id : number | string, name : string, userNo : string }
const pickerUsers = ref<PickerUser[]>([])
const pkLoading = ref(false)
let kwTimer : any = null

const loadPickerUsers = (keyword : string) : void => {
	pkLoading.value = true
	fetchSimpleUserList(keyword).then((rows) => {
		const out : PickerUser[] = []
		for (let i = 0; i < rows.length; i++) {
			out.push({
				id: rows[i].id,
				name: rows[i].username.length > 0 ? rows[i].username : '用户' + rows[i].id,
				userNo: rows[i].userNo
			})
		}
		pickerUsers.value = out
		pkLoading.value = false
	}).catch((e : any) => {
		pkLoading.value = false
		uni.showToast({ title: e && e.message ? e.message : '用户列表加载失败', icon: 'none' })
	})
}

const openPicker = (field : PickerField, storeId : number | string, storeName : string, current : StaffMember[]) : void => {
	picker.value = {
		visible: true, field: field, storeId: storeId, storeName: storeName,
		keyword: '', selected: current.slice()
	}
	loadPickerUsers('')
}

const onTapEditManagers = (s : AdminStore) : void => { openPicker('owners', s.id, s.name, s.managers) }
const onTapEditAdmins = (s : AdminStore) : void => { openPicker('managers', s.id, s.name, s.admins) }

const onTapPickerCancel = () : void => {
	if (pkSaving.value) { return }
	if (kwTimer != null) { clearTimeout(kwTimer); kwTimer = null }
	picker.value.visible = false
}
const onTapPickerMask = () : void => { onTapPickerCancel() }

const onKeywordInput = (e : any) : void => {
	picker.value.keyword = (e.detail.value || '').toString()
	// 输入防抖：停顿 300ms 后再请求 /user/list?keyword=xxx
	if (kwTimer != null) { clearTimeout(kwTimer) }
	kwTimer = setTimeout(() => {
		kwTimer = null
		loadPickerUsers(picker.value.keyword)
	}, 300)
}

/* ---------------- 选人交互 ---------------- */
const indexOfMember = (list : StaffMember[], id : number | string) : number => {
	const len : number = list.length
	for (let i : number = 0; i < len; i++) {
		if (list[i].id == id) { return i }
	}
	return -1
}

const isSelected = (u : PickerUser) : boolean => indexOfMember(picker.value.selected, u.id) >= 0

const onTapUser = (u : PickerUser) : void => {
	const i : number = indexOfMember(picker.value.selected, u.id)
	if (i >= 0) {
		picker.value.selected.splice(i, 1)
	} else {
		picker.value.selected.push({ id: u.id, name: u.name })
	}
}
const onTapRemoveSelected = (mi : number) : void => {
	picker.value.selected.splice(mi, 1)
}

const onTapPickerConfirm = () : void => {
	if (pkSaving.value) { return }
	if (picker.value.selected.length == 0) {
		uni.showToast({ title: '请至少选择一位', icon: 'none' })
		return
	}
	// ownerIds 提交全量成员 id（原成员 + 新增），由后端整体覆盖
	const allIds : (number | string)[] = []
	for (let i = 0; i < picker.value.selected.length; i++) {
		allIds.push(picker.value.selected[i].id)
	}
	const storeId = picker.value.storeId
	// owners=店长 → add-owner；managers=管理员 → add-manager
	const isOwnerField : boolean = picker.value.field == 'owners'
	pkSaving.value = true
	const req = isOwnerField
		? addStoreOwners(storeId, allIds)
		: addStoreManagers(storeId, allIds)
	req.then(() => {
		pkSaving.value = false
		picker.value.visible = false
		uni.showToast({ title: isOwnerField ? '店长已更新' : '管理员已更新', icon: 'none' })
		// 以服务端数据为准，重置分页重新拉取列表
		refreshStores()
	}).catch((e : any) => {
		pkSaving.value = false
		uni.showToast({ title: e && e.message ? e.message : '保存失败，请重试', icon: 'none' })
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
.add-btn {
	padding: 16rpx 28rpx;
	background-image: linear-gradient(135deg, #E8C275, #C89B3C);
	border-radius: 999rpx;
}
.add-btn-text {
	font-size: 24rpx;
	color: #14100A;
	font-weight: 700;
}

/* ============ 店铺卡片 ============ */
.card {
	flex-direction: column;
	background-color: #1A1E1D;
	border-radius: 24rpx;
	border: 1rpx solid #2A2F2D;
	padding: 26rpx 24rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
}
.card-head {
	flex-direction: row;
	align-items: flex-start;
	justify-content: space-between;
}
.card-head-left {
	flex-direction: row;
	align-items: center;
	flex: 1;
	flex-wrap: wrap;
}
.store-name {
	font-size: 30rpx;
	color: #EDEFEE;
	font-weight: 700;
	margin-right: 14rpx;
	flex-shrink: 1;
}
.store-type-pill {
	padding: 3rpx 12rpx;
	border-radius: 8rpx;
	border: 1rpx solid;
}
.store-type-silent {
	background-color: #E8C2751F;
	border-color: #E8C27559;
}
.store-type-jiude {
	background-color: #57C79A1F;
	border-color: #57C79A59;
}
.store-type-text {
	font-size: 18rpx;
	font-weight: 600;
}
.store-type-silent .store-type-text { color: #E8C275; }
.store-type-jiude .store-type-text { color: #57C79A; }
.store-id {
	flex-shrink: 0;
	padding: 4rpx 12rpx;
	background-color: #1F2322;
	border-radius: 8rpx;
	border: 1rpx solid #2A2F2D;
}
.store-id-text {
	font-size: 18rpx;
	color: #6E7573;
}

/* 地址行 */
.addr-row {
	flex-direction: row;
	align-items: center;
	margin-top: 14rpx;
}
.addr-icon {
	width: 30rpx;
	height: 30rpx;
	border-radius: 50%;
	background-color: rgba(232, 194, 117, 0.14);
	align-items: center;
	justify-content: center;
	margin-right: 10rpx;
}
.addr-icon-text {
	font-size: 18rpx;
	color: #E8C275;
	line-height: 18rpx;
}
.addr-main {
	flex: 1;
	flex-direction: column;
}
.addr-text {
	font-size: 22rpx;
	color: #8F9492;
}
.addr-coord {
	font-size: 19rpx;
	color: #4A4F4D;
	margin-top: 4rpx;
}

/* 比赛 / 玩家统计 */
.stat-row {
	flex-direction: row;
	align-items: center;
	margin-top: 18rpx;
	padding: 14rpx 18rpx;
	background-color: #1F2322;
	border: 1rpx solid #2A2F2D;
	border-radius: 12rpx;
}
.stat-cell {
	flex: 1;
	flex-direction: column;
}
.stat-cell-right {
	align-items: flex-end;
}
.stat-val {
	font-size: 26rpx;
	color: #EDEFEE;
	font-weight: 700;
}
.stat-val-on { color: #57C79A; }
.stat-val-off { color: #FF6255; }
/* 状态胶囊：营业中=青绿底+光点；已停用=暗红底+红点 */
.status-pill {
	flex-direction: row;
	align-items: center;
	padding: 4rpx 14rpx;
	border-radius: 999rpx;
}
.status-pill-on {
	background-color: rgba(87, 199, 154, 0.14);
	border: 1rpx solid rgba(87, 199, 154, 0.45);
}
.status-pill-off {
	background-color: rgba(255, 98, 85, 0.12);
	border: 1rpx solid rgba(255, 98, 85, 0.40);
}
.status-dot {
	width: 12rpx;
	height: 12rpx;
	border-radius: 6rpx;
	margin-right: 8rpx;
}
.status-dot-on {
	background-color: #57C79A;
	box-shadow: 0 0 8rpx rgba(87, 199, 154, 0.8);
}
.status-dot-off {
	background-color: #FF6255;
}
.status-pill-text {
	font-size: 22rpx;
	font-weight: 600;
}
.status-text-on { color: #57C79A; }
.status-text-off { color: #FF6255; }
.stat-label {
	font-size: 18rpx;
	color: #6E7573;
	margin-top: 4rpx;
}
.stat-divider {
	width: 1rpx;
	height: 40rpx;
	background-color: #343836;
	margin: 0 16rpx;
}

.divider {
	height: 1rpx;
	background-color: #242827;
	margin: 20rpx 0;
}

/* ============ 人员列表 ============ */
.mem-block {
	flex-direction: row;
	align-items: flex-start;
	margin-bottom: 14rpx;
}
.mem-block:last-of-type {
	margin-bottom: 0;
}
.mem-label {
	width: 84rpx;
	padding-top: 8rpx;
}
.mem-label-text {
	font-size: 22rpx;
	color: #6E7573;
}
.mem-chips {
	flex: 1;
	flex-direction: row;
	flex-wrap: wrap;
}
.chip {
	flex-direction: row;
	align-items: center;
	padding: 8rpx 20rpx;
	border-radius: 999rpx;
	margin-right: 12rpx;
	margin-bottom: 10rpx;
}
.chip-name {
	font-size: 22rpx;
}
.chip-id {
	font-size: 18rpx;
	color: rgba(237, 239, 238, 0.45);
	margin-left: 10rpx;
}
.chip-x {
	font-size: 24rpx;
	color: #6E7573;
	margin-left: 10rpx;
}
.chip-manager {
	background-color: rgba(232, 194, 117, 0.12);
	border: 1rpx solid rgba(232, 194, 117, 0.35);
}
.chip-manager-text {
	color: #E8C275;
}
.chip-admin {
	background-color: rgba(122, 182, 242, 0.12);
	border: 1rpx solid rgba(122, 182, 242, 0.35);
}
.chip-admin-text {
	color: #7AB6F2;
}
.chip-sel {
	background-color: #1F2322;
	border: 1rpx solid #2A2F2D;
}
.chip-sel-text {
	color: #C7CDCB;
}
.mem-empty {
	font-size: 22rpx;
	color: #4A4F4D;
	padding-top: 8rpx;
}

/* ============ 操作区 ============ */
.actions {
	flex-direction: row;
	flex-wrap: wrap;
}
.act {
	padding: 10rpx 22rpx;
	background-color: #1F2322;
	border: 1rpx solid #2A2F2D;
	border-radius: 999rpx;
	margin-right: 12rpx;
}
.act-text {
	font-size: 21rpx;
	color: #C7CDCB;
}
.act-danger {
	background-color: rgba(255, 98, 85, 0.1);
	border: 1rpx solid rgba(255, 98, 85, 0.35);
}
.act-danger-text {
	color: #FF6255;
}

/* ============ 加载脚注 ============ */
.list-foot {
	align-items: center;
	justify-content: center;
	padding: 16rpx 0 8rpx;
}
.list-foot-text {
	font-size: 22rpx;
	color: #4A4F4D;
}

/* ============ 弹层 ============ */
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
	flex-direction: column;
	width: 624rpx;
	max-width: 100%;
	background-color: #1A1E1D;
	border-radius: 28rpx;
	border: 1rpx solid #2A2F2D;
	padding: 34rpx 30rpx 28rpx;
	box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
}
.dlg-head {
	flex-direction: column;
	margin-bottom: 26rpx;
}
.dlg-title {
	font-size: 32rpx;
	color: #EDEFEE;
	font-weight: 700;
}
.dlg-sub {
	font-size: 21rpx;
	color: #8F9492;
	margin-top: 8rpx;
}

.field {
	flex-direction: column;
	margin-bottom: 22rpx;
}
.field-head {
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
}
.field-label {
	font-size: 22rpx;
	color: #8F9492;
	margin-bottom: 10rpx;
}
.field-count {
	font-size: 20rpx;
	color: #6E7573;
	margin-bottom: 10rpx;
}
.field-input {
	height: 84rpx;
	background-color: #0F1211;
	border: 1rpx solid #2A2F2D;
	border-radius: 14rpx;
	padding: 0 22rpx;
	font-size: 26rpx;
	color: #EDEFEE;
}
.field-ph {
	color: #4A4F4D;
}

/* 类型选择段 */
.type-seg {
	flex-direction: row;
	background-color: #0F1211;
	border: 1rpx solid #2A2F2D;
	border-radius: 14rpx;
	padding: 4rpx;
}
.type-seg-item {
	flex: 1;
	height: 76rpx;
	align-items: center;
	justify-content: center;
	border-radius: 10rpx;
}
.type-seg-on {
	background-color: #1E2221;
}
.type-seg-text {
	font-size: 24rpx;
	color: #6E7573;
	font-weight: 500;
}
.type-seg-text-on {
	color: #EDEFEE;
	font-weight: 700;
}

.select-btn {
	flex-direction: row;
	align-items: center;
	min-height: 84rpx;
	background-color: #0F1211;
	border: 1rpx solid #2A2F2D;
	border-radius: 14rpx;
	padding: 16rpx 22rpx;
}
.loc-left {
	flex: 1;
	flex-direction: column;
}
.select-btn-text {
	flex-wrap: wrap;
	font-size: 24rpx;
	color: #EDEFEE;
	line-height: 34rpx;
}
.select-btn-ph {
	color: #4A4F4D;
}
.loc-coord {
	font-size: 19rpx;
	color: #4A4F4D;
	margin-top: 6rpx;
}
.select-btn-arrow {
	font-size: 30rpx;
	color: #4A4F4D;
	margin-left: 12rpx;
}

.dlg-error {
	font-size: 21rpx;
	color: #FF6255;
	margin-bottom: 16rpx;
}
.dlg-saving {
	padding: 10rpx 0;
	align-items: center;
}
.dlg-saving-text {
	font-size: 21rpx;
	color: #E8C275;
}

.dlg-btns {
	flex-direction: row;
	margin-top: 8rpx;
}
.dlg-btn {
	flex: 1;
	height: 84rpx;
	align-items: center;
	justify-content: center;
	border-radius: 14rpx;
}
.dlg-btn-text {
	font-size: 27rpx;
	font-weight: 600;
}
.dlg-btn-cancel {
	background-color: #1F2322;
	border: 1rpx solid #2A2F2D;
	margin-right: 18rpx;
}
.dlg-btn-cancel-text {
	color: #C7CDCB;
}
.dlg-btn-ok {
	background-image: linear-gradient(135deg, #E8C275, #C89B3C);
}
.dlg-btn-ok-text {
	color: #14100A;
}
.dlg-btn-disabled {
	opacity: 0.5;
}

/* ============ 选人弹层 ============ */
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
	flex-direction: column;
	width: 624rpx;
	max-width: 100%;
	background-color: #1A1E1D;
	border-radius: 28rpx;
	border: 1rpx solid #2A2F2D;
	padding: 34rpx 30rpx 28rpx;
	box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
}
.pk-head {
	flex-direction: column;
	margin-bottom: 22rpx;
}
.pk-title {
	font-size: 32rpx;
	color: #EDEFEE;
	font-weight: 700;
}
.pk-sub {
	font-size: 21rpx;
	color: #8F9492;
	margin-top: 8rpx;
}

.pk-search {
	flex-direction: row;
	align-items: center;
	height: 80rpx;
	background-color: #0F1211;
	border: 1rpx solid #2A2F2D;
	border-radius: 14rpx;
	padding: 0 20rpx;
	margin-bottom: 20rpx;
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
	height: 80rpx;
	font-size: 26rpx;
	color: #EDEFEE;
}

.pk-selected {
	flex-direction: row;
	flex-wrap: wrap;
	margin-bottom: 6rpx;
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
	width: 68rpx;
	height: 68rpx;
	border-radius: 50%;
	background-color: #1F2322;
	border: 1rpx solid #2A2F2D;
	align-items: center;
	justify-content: center;
	margin-right: 16rpx;
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
	width: 48rpx;
	height: 48rpx;
	border-radius: 50%;
	background-color: #1F2322;
	border: 1rpx solid #2A2F2D;
	align-items: center;
	justify-content: center;
}
.pk-check-on {
	background-color: #E8C275;
	border: 1rpx solid #E8C275;
}
.pk-check-text {
	font-size: 24rpx;
	color: #6E7573;
	line-height: 24rpx;
}
.pk-check-on .pk-check-text {
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
