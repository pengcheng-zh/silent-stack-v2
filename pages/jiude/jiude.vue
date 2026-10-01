<template>
	<scroll-view
		class="page"
		direction="vertical"
		:show-scrollbar="false"
	>

		<!-- ============ 顶部 ============ -->
		<view class="top-bar">
			<view class="top-bar-left">
				<text class="top-bar-title">酒德</text>
				<text class="top-bar-sub">WINE · VIRTUE · CLUB</text>
			</view>
			<view class="top-bar-right" @tap="onTapRules">
				<text class="top-bar-rule">规则</text>
			</view>
		</view>

		<!-- ============ 当前门店 ============ -->
		<view class="store-card">
			<view class="store-head">
				<view class="store-icon">
					<text class="store-icon-text">店</text>
				</view>
				<view class="store-info">
					<text class="store-name">{{ store.name || '酒德门店' }}</text>
					<text class="store-loc">{{ storeAddress || '--' }}</text>
				</view>
				<view class="store-switch" @tap="onTapSwitchStore">
					<text class="store-switch-text">切换</text>
				</view>
			</view>
		</view>

		<!-- ============ 我的等级与成长 ============ -->
		<view class="tier-card">
			<view class="tier-head">
				<view class="tier-emblem" :style="emblemStyle">
					<view class="tier-emblem-in" :style="emblemLineStyle">
						<text class="tier-emblem-text" :style="emblemColorStyle">{{ info.levelLabel || 'X' }}</text>
					</view>
				</view>

				<view class="tier-info">
					<view class="tier-name-row">
							<text class="tier-name">{{ info.levelLabel || 'X' }} 等级</text>
						</view>
					<text class="tier-progress-tip">{{ progressTip }}</text>
				</view>
			</view>

			<!-- 成长进度条：与 rank 页 me-progress 同款金色渐变 -->
			<view class="tier-progress">
				<view class="tier-progress-track">
					<view class="tier-progress-fill" :style="progressStyle"></view>
				</view>
				<view class="tier-progress-meta">
					<text class="tier-progress-now">{{ formatNum(info.totalAmount) }}</text>
					<text class="tier-progress-target">{{ formatNum(progressTarget) }} 满级</text>
				</view>
			</view>

			<!-- 三组核心数据：成长值 / 可用积分 / 累计积分 -->
			<view class="tier-stats">
				<template v-for="(c, ci) in tierStatCells" :key="ci">
					<view v-if="ci > 0" class="tier-stat-divider"></view>
					<view class="tier-stat">
						<text class="tier-stat-value" :style="'color:' + c.color + ';'">{{ c.value }}</text>
						<text class="tier-stat-label">{{ c.label }}</text>
					</view>
				</template>
			</view>
		</view>

		<!-- ============ 操作按钮 ============ -->
		<view class="action-row">
			<view class="action-btn action-btn-deposit" @tap="onTapDeposit">
				<text class="action-btn-icon">+</text>
				<text class="action-btn-text">存积分</text>
			</view>
			<view class="action-btn action-btn-withdraw" @tap="onTapWithdraw">
				<text class="action-btn-icon">−</text>
				<text class="action-btn-text">取积分</text>
			</view>
		</view>

		<!-- ============ 积分使用指南 ============ -->
		<!-- 与顶部「规则」相同药丸设计（背景 18rpx 圆形 + 金边 + 金字）；居中放置在存/取积分按钮下方 -->
		<view class="guide-link" @tap="onTapPointsGuide">
			<text class="guide-link-text">积分使用指南</text>
			<text class="guide-link-arrow">›</text>
		</view>

		<!-- ============ 等级权益（GET /jiu-de/level-benefit） ============ -->
		<view class="section">
			<view class="section-head">
				<view class="section-title-wrap">
					<view class="section-bar"></view>
					<text class="section-title">等级权益</text>
				</view>
				<text class="section-count">{{ benefitList.length }} 级</text>
			</view>

			<!-- 全部等级权益：横向滚动，每个等级一张卡（两端缓冲垫防止最右卡片被裁切） -->
			<scroll-view class="benefit-scroll" direction="horizontal" :show-scrollbar="false">
				<view class="benefit-scroll-pad"></view>
				<view
					v-for="(b, bi) in benefitList"
					:key="b.levelLabel"
					class="benefit-pill"
					:class="{ 'benefit-pill-current': b.levelLabel == info.levelLabel }"
					:style="benefitPillStyle(bi, b.levelLabel == info.levelLabel)"
				>
					<view class="benefit-pill-head">
						<text class="benefit-pill-label" :style="tierColorStyle(bi)">{{ b.levelLabel }}</text>
						<text class="benefit-pill-card">月卡 ×{{ b.monthCard }}</text>
					</view>
					<text class="benefit-pill-need">升级所需 {{ formatNum(b.needScore) }}</text>
					<view class="benefit-pill-row">
						<view class="benefit-pill-cell">
							<text class="benefit-pill-num" :style="tierColorStyle(bi)">{{ formatNum(b.monthACombo) }}</text>
							<text class="benefit-pill-col">A套餐</text>
						</view>
						<view class="benefit-pill-cell">
							<text class="benefit-pill-num" :style="tierColorStyle(bi)">{{ formatNum(b.monthBCombo) }}</text>
							<text class="benefit-pill-col">B套餐</text>
						</view>
						<view class="benefit-pill-cell">
							<text class="benefit-pill-num" :style="tierColorStyle(bi)">{{ formatNum(b.monthCCombo) }}</text>
							<text class="benefit-pill-col">C套餐</text>
						</view>
					</view>
					<view v-if="b.levelLabel == info.levelLabel" class="benefit-pill-tag">
						<text class="benefit-pill-tag-text">当前等级</text>
					</view>
				</view>
				<view class="benefit-scroll-pad"></view>
			</scroll-view>
		</view>

		<!-- ============ 我的套餐券 A/B/C ============ -->
		<view class="section">
			<view class="section-head">
				<view class="section-title-wrap">
					<view class="section-bar"></view>
					<text class="section-title">我的套餐券</text>
				</view>
			</view>

			<view class="voucher-row">
				<view
					v-for="v in vouchers"
					:key="v.code"
					class="voucher-card"
					:class="'voucher-card-' + v.code.toLowerCase()"
					@tap="onTapVoucher(v)"
				>
					<view class="voucher-head">
						<text class="voucher-code">{{ v.code }}</text>
						<view class="voucher-divider"></view>
						<text class="voucher-name">{{ v.name }}</text>
					</view>
					<view class="voucher-foot">
						<view class="voucher-count">
							<text class="voucher-count-num" :style="'color:' + v.color + ';'">{{ v.count }}</text>
							<text class="voucher-count-label">张</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- ============ 入口列表：存取记录 + 积分排行 ============ -->
		<view class="entry-list">
			<view class="entry-row" @tap="onTapRecords">
				<view class="entry-row-icon">
					<text class="entry-row-icon-text">录</text>
				</view>
				<view class="entry-row-mid">
					<text class="entry-row-title">我的存取记录</text>
				</view>
				<view class="entry-row-tail">
					<text class="entry-row-count">{{ records.length }}</text>
					<text class="entry-row-arrow">›</text>
				</view>
			</view>

			<view class="entry-row entry-row-last" @tap="onTapRank">
				<view class="entry-row-icon entry-row-icon-gold">
					<text class="entry-row-icon-text">榜</text>
				</view>
				<view class="entry-row-mid">
					<text class="entry-row-title">查看积分排行</text>
				</view>
				<view class="entry-row-tail">
					<text class="entry-row-arrow">›</text>
				</view>
			</view>
		</view>

		<view class="footer-blank"></view>
	</scroll-view>

	<!-- ============ 规则 / 指南 图片弹层 ============ -->
	<!-- 双图复用同一 overlay：根据 activeImage 字段渲染不同的源图片 -->
	<view v-if="imageViewer.visible" class="iv-overlay" @tap="onTapIvMask">
		<view class="iv-card" @tap.stop="">
			<view class="iv-close" @tap="onTapIvClose">
				<text class="iv-close-text">×</text>
			</view>
			<image class="iv-image" :src="imageViewer.src" mode="aspectFit" :show-menu-by-longpress="true"></image>
			<text class="iv-caption">{{ imageViewer.caption }}</text>
		</view>
	</view>

	<!-- ============ 切换门店底部弹层 ============ -->
	<!-- 全屏遮罩 + 底部 sheet：sheet 内 catch 防止冒泡关闭；点遮罩 / 关闭按钮 / 选中门店 → 关闭 -->
	<view v-if="showStoreSheet" class="ss-overlay" @tap="onTapCloseSheet">
		<view class="ss-sheet" @tap.stop="">
			<!-- 顶部小横条：iOS/Android 通用"下拉关闭"视觉提示 -->
			<view class="ss-handle"></view>

			<!-- 头部：标题 + 描述 + 关闭 X -->
			<view class="ss-head">
				<view class="ss-head-left">
					<text class="ss-head-title">切换门店</text>
					<text class="ss-head-sub">{{ allStores.length }} 家门店 · 跨店成长值同步</text>
				</view>
				<view class="ss-close" @tap="onTapCloseSheet">
					<text class="ss-close-text">×</text>
				</view>
			</view>

			<!-- 列表：GET /store/list?type=jiude 返回的酒德门店（id / name / address） -->
			<scroll-view class="ss-body" :scroll-y="true" :show-scrollbar="false">
				<view
					v-for="s in allStores"
					:key="s.id"
					class="ss-row"
					:class="{ 'ss-row-active': s.id == store.id }"
					@tap="onPickStore(s)"
				>
					<view class="ss-row-icon">
						<text class="ss-row-icon-text">{{ s.name.substring(0, 1) }}</text>
					</view>
					<view class="ss-row-main">
						<view class="ss-row-line1">
							<text class="ss-row-name">{{ s.name }}</text>
							<view v-if="s.id == store.id" class="ss-row-tag-current">
								<text class="ss-row-tag-current-text">当前</text>
							</view>
						</view>
						<text class="ss-row-addr">{{ s.address }}</text>
					</view>
					<view v-if="s.id == store.id" class="ss-row-check">
						<text class="ss-row-check-text">✓</text>
					</view>
					<view v-else class="ss-row-arrow">
						<text class="ss-row-arrow-text">›</text>
					</view>
				</view>

				<!-- 空状态：接口无数据 / 加载失败 -->
				<view v-if="allStores.length == 0" class="ss-empty">
					<text class="ss-empty-text">暂无门店数据</text>
				</view>
			</scroll-view>

			<!-- 页脚说明：跨店规则 -->
			<view class="ss-foot">
				<view class="ss-foot-icon">
					<text class="ss-foot-icon-text">提</text>
				</view>
				<text class="ss-foot-text">跨店切换后，成长值与等级权益继续累积 · 仅赛事奖励与门店活动因地而异</text>
			</view>
		</view>
	</view>

	<!-- ============ 存取积分弹层 ============ -->
	<!-- 居中卡片浮层：与 .iv-overlay 同款结构（mask + card），但用 v-if 控制可见性，
	     内部 catch 住冒泡以免点卡关闭；点遮罩或取消 → 关闭 -->
	<view v-if="pointsDialog.visible" class="po-overlay" @tap="onTapPoMask">
		<view class="po-card" @tap.stop="">
			<view class="po-head">
				<text class="po-title">{{ pointsDialog.mode == 'deposit' ? '存入积分' : '取出积分' }}</text>
				<text class="po-sub">{{ pointsDialog.mode == 'deposit' ? '从赛事奖励 / 签到累积的积分存入门店' : '将积分兑换为套餐券 / 礼物' }}</text>
			</view>

			<!-- 当前可用积分信息条：让用户先看到余额，再决定输多少（取 monthPoints） -->
			<view class="po-info">
				<text class="po-info-label">当前可用积分</text>
				<text class="po-info-value">{{ formatNum(info.monthPoints) }}</text>
			</view>

			<!-- 数字输入框：type=number 拉起数字键盘；onPoInput 过滤非法字符与长度 -->
			<view class="po-input-wrap">
				<input
					class="po-input"
					type="number"
					:value="pointsDialog.points"
					@input="onPoInput"
					placeholder="请输入积分数量"
					placeholder-class="po-input-ph"
					:maxlength="12"
					:focus="pointsDialog.visible"
				/>
				<text class="po-input-suffix">积分</text>
			</view>

			<!-- 内联错误：紧贴输入框，避免 toast 抢焦点 -->
			<view v-if="pointsDialog.error" class="po-error">
				<text class="po-error-text">{{ pointsDialog.error }}</text>
			</view>

			<!-- 底部双按钮：取消灰底深边，确定金底深字；不满足 canConfirm 时确定按钮置灰 -->
			<view class="po-actions">
				<view class="po-btn po-btn-cancel" @tap="onTapPoCancel">
					<text class="po-btn-text po-btn-text-cancel">取消</text>
				</view>
				<view
					class="po-btn po-btn-confirm"
					:class="{ 'po-btn-confirm-disabled': !canConfirm }"
					@tap="onTapPoConfirm"
				>
					<text class="po-btn-text po-btn-text-confirm">确定</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { JIUDE_MAX_THRESHOLD } from '@/common/jiude-data'
import {
	fetchMyJiude, fetchLevelBenefit, rechargePoints, withdrawPoints, fetchJiudeRecords,
	JIUDE_TIER_COLORS, jiudeTierColor
} from '@/common/jiude-api'
import type { UserJiuDeVO, LevelBenefitVO, PointsRecordVO } from '@/common/jiude-api'
import { fetchJiudeStores } from '@/common/store-api'
import type { JiudeStoreVO } from '@/common/store-api'

/* ---------------- 数据（直接消费后端 VO，不做映射） ---------------- */
// 我的酒德：GET /jiu-de/info → UserJiuDeVO
const EMPTY_VO : UserJiuDeVO = {
	userId: 0, username: '', avatar: '',
	storeId: 0, storeName: '',
	points: 0, monthPoints: 0, weekPoints: 0, ranking: 0,
	amount: 0, totalAmount: 0,
	comboA: 0, comboAUsed: 0, comboB: 0, comboBUsed: 0, comboC: 0, comboCUsed: 0,
	levelLabel: '', needScore: 0
}
const info = ref<UserJiuDeVO>({ ...EMPTY_VO })
// 等级权益：GET /jiu-de/level-benefit
const benefitList = ref<LevelBenefitVO[]>([])
// 存取记录：GET /jiu-de/record-list（入口条数直接取数组长度）
const records = ref<PointsRecordVO[]>([])

// 当前门店：切换门店时本地即时更新；地址由 storeAddress 从门店列表匹配
const store = ref<{ id : number, name : string }>({ id: 0, name: '' })
// 当前门店地址：从门店列表按 storeId 匹配
const storeAddress = computed<string>((): string => {
	for (let i : number = 0; i < allStores.value.length; i++) {
		if (allStores.value[i].id == store.value.id) { return allStores.value[i].address }
	}
	return ''
})
// 进度条入场动画开关：初始 false（渲染 0%），页面挂载后置 true，触发从 0 到目标值的过渡
const progressAnimated = ref<boolean>(false)

// 套餐券：静态 meta（code/name/color）+ 数量直接取 info 的 comboX - comboXUsed
const vouchers = computed(() => [
	{ code: 'A', name: '套餐', color: '#2AA97A', count: info.value.comboA },
	{ code: 'B', name: '套餐', color: '#E8C275', count: info.value.comboB },
	{ code: 'C', name: '套餐', color: '#B07AE8', count: info.value.comboC }
])

// 全部门店列表：GET /store/list?type=jiude（仅 id / name / address）
const allStores = ref<JiudeStoreVO[]>([])

// 加载酒德门店列表
const loadStoreList = () : void => {
	fetchJiudeStores().then((list : JiudeStoreVO[]) => {
		allStores.value = list || []
	}).catch((err : any) => {
		console.error('[酒德] 门店列表加载失败:', err)
		allStores.value = []
	})
}

/* ---------------- 数据加载 ---------------- */
// 加载我的酒德：GET /jiu-de/info → GET /jiu-de/level-benefit；记录单独拉取
const loadMyJiude = () : void => {
	fetchMyJiude().then((vo : UserJiuDeVO) => {
		info.value = vo
		store.value = { id: vo.storeId, name: vo.storeName }
		return fetchLevelBenefit()
	}).then((list : LevelBenefitVO[]) => {
		benefitList.value = list || []
	}).catch((err : any) => {
		console.error('[酒德] 数据加载失败:', err)
		uni.showToast({ title: err && err.message ? err.message : '加载失败，请重试', icon: 'none' })
	})
	fetchJiudeRecords(1, 20).then((list : PointsRecordVO[]) => {
		records.value = list || []
	}).catch((err : any) => {
		console.error('[酒德] 记录加载失败:', err)
	})
}

// 每次进入页面都重新加载数据（onShow：首次进入 + 从其他页面返回时都会触发）
onShow(() => {
	// 重置进度条动画：先回到 0% 渲染上屏，再切到目标百分比触发过渡
	progressAnimated.value = false
	loadMyJiude()
	loadStoreList()
	setTimeout(() => { progressAnimated.value = true }, 300)
})

// 当前弹层是否打开
const showStoreSheet = ref<boolean>(false)

/* ---------------- 当前等级主色 ---------------- */
const tierColor = computed<string>((): string => jiudeTierColor(info.value.levelLabel))

// 与 mine / rank 页同款"段位主色环"：渐变背景 + 边框
const emblemStyle = computed<string>((): string => {
	const c : string = tierColor.value
	return 'background-image:linear-gradient(135deg,' + c + ',' + c + 'AA 60%,' + c + '40);border-color:' + c + '99;'
})

const emblemLineStyle = computed<string>((): string => {
	return 'border-color:' + tierColor.value + ';'
})

const emblemColorStyle = computed<string>((): string => 'color:' + tierColor.value + ';')

// 权益列表按返回顺序（等级由低到高）取色，保证每张卡颜色不同、不依赖 levelLabel 的具体格式
const tierColorAt = (idx : number) : string => {
	return JIUDE_TIER_COLORS[idx >= 0 && idx < JIUDE_TIER_COLORS.length ? idx : 0]
}

// 文字颜色样式：在 script 内拼好完整样式串，模板直接绑定，避免引号转义问题
const tierColorStyle = (idx : number) : string => {
	return 'color:' + tierColorAt(idx) + ';'
}

// 每个等级权益卡的专属配色：边框 + 背景渐变都带该等级色；当前等级边框全色加亮
const benefitPillStyle = (idx : number, isCurrent : boolean) : string => {
	const c : string = tierColorAt(idx)
	const border : string = isCurrent ? c : c + '88'
	const tint : string = isCurrent ? '3D' : '26'
	return 'border-color:' + border + ';background-image:linear-gradient(150deg,' + c + tint + ',' + c + '11 55%,rgba(0,0,0,0));'
}

/* ---------------- 进度条 ---------------- */
// 进度目标：未满级用 info.needScore；满级（needScore=0）用 JIUDE_MAX_THRESHOLD 锁住上限
const progressTarget = computed<number>((): number => {
	if (info.value.needScore > 0) { return info.value.needScore + info.value.totalAmount - 1 }
	return JIUDE_MAX_THRESHOLD
})

const progressPct = computed<number>((): number => {
	const target : number = progressTarget.value
	if (target <= 0) { return 100 }
	const pct : number = Math.round(info.value.totalAmount * 100 / target)
	return pct
})

// 进度条样式：入场动画触发前渲染 0%，触发后切到目标百分比，由 CSS transition 完成增长动效
const progressStyle = computed<string>((): string => {
	const w : number = progressAnimated.value ? progressPct.value : 0
	return 'width:' + w + '%;'
})

// 进度提示文案：满级时切到「已抵达顶级」，未满级时给出剩余成长值
const progressTip = computed<string>((): string => {
	if (info.value.needScore <= 0) { return '已抵达顶级 · 享受传奇终身荣誉席' }
	const gap : number = info.value.needScore
	if (gap <= 0) { return '已满足下一级门槛 · 等待赛季结算' }
	return '距下一级还差 ' + formatNum(gap) + ' 成长值'
})

/* ---------------- 等级核心数据 ---------------- */
// 三栏：成长值(白) / 可用积分(绿·正向) / 累计积分(金·成就)
// 颜色语义：白=中性数值 / 绿=可消费的活跃值 / 金=长期累计的成就
type StatCell = { value : string, label : string, color : string }
const tierStatCells = computed<StatCell[]>((): StatCell[] => {
	return [
		{ value: formatNum(info.value.amount),  label: '当前余额', color: '#EDEFEE' },
		{ value: formatNum(info.value.monthPoints), label: '当前积分', color: '#2AA97A' },
		{ value: formatNum(info.value.totalAmount),  label: '成长值', color: '#E8C275' }
	]
})

/* ---------------- 工具 ---------------- */
const formatNum = (n : number) : string => {
	const v : number = Number(n)
	if (!isFinite(v) || v == 0) { return '0' }
	const neg : boolean = v < 0
	const s : string = Math.abs(v).toString()
	let res : string = ''
	let c : number = 0
	for (let i : number = s.length - 1; i >= 0; i--) {
		res = s.charAt(i) + res
		c++
		if (c % 3 == 0 && i > 0) { res = ',' + res }
	}
	return neg ? '-' + res : res
}

/* ---------------- 交互 ---------------- */
// 图片弹层：单一控制源，避免 onTapRules / onTapPointsGuide 各自维护状态
// key 决定图片源和标题，visible 控制显隐；点击遮罩 / 关闭按钮 / 物理返回 都会隐藏
type ImageViewer = { visible : boolean, key : 'rules' | 'points' | null, src : string, caption : string }

const imageViewer = ref<ImageViewer>({
	visible: false,
	key: null,
	src: '',
	caption: ''
})

const openImageViewer = (key : 'rules' | 'points') : void => {
	if (key == 'rules') {
		imageViewer.value = {
			visible: true,
			key: 'rules',
			src: '/static/rules.jpg',
			caption: '酒德规则 · 6 级等级权益与存取约束'
		}
		return
	}
	imageViewer.value = {
		visible: true,
		key: 'points',
		src: '/static/points.png',
		caption: '积分使用指南 · 酒德币的获取与消耗场景'
	}
}

const onTapIvClose = () : void => {
	imageViewer.value.visible = false
}

const onTapIvMask = () : void => {
	imageViewer.value.visible = false
}

const onTapRules = () : void => {
	openImageViewer('rules')
}

const onTapPointsGuide = () : void => {
	openImageViewer('points')
}

const onTapSwitchStore = () : void => {
	showStoreSheet.value = true
}

const onTapCloseSheet = () : void => {
	showStoreSheet.value = false
}

// 从门店列表挑一家：仅保存 id / name，地址由 storeAddress 按列表匹配
const onPickStore = (s : JiudeStoreVO) : void => {
	store.value = { id: s.id, name: s.name }
	showStoreSheet.value = false
	uni.showToast({ title: '已切换至 ' + s.name, icon: 'none' })
}

/* ---------------- 存取积分弹层 ---------------- */
// 复用一个 dialog 对象：mode 切换标题与校验口径、amount 即输入框内容、error 内联展示
type PointsDialog = {
	visible : boolean
	mode : 'deposit' | 'withdraw'
	points : string  // 字符串保存以便判空 + 字符过滤
	error : string  // 空串 = 不展示
}

const pointsDialog = ref<PointsDialog>({
	visible: false,
	mode: 'deposit',
	points: '',
	error: ''
})

// 打开弹层并重置状态：避免上一次的输入 / 错误提示残留
const openPointsDialog = (mode : 'deposit' | 'withdraw') : void => {
	pointsDialog.value = {
		visible: true,
		mode: mode,
		points: '',
		error: ''
	}
}

// 输入过滤：仅保留非负整数，去掉前导 0，最多 12 位（够 999,999,999,999）
const onPoInput = (e : any) : void => {
	let v : string = (e.detail.value || '').toString()
	v = v.replace(/\D/g, '').replace(/^0+(\d)/, '$1')
	if (v.length > 12) { v = v.substring(0, 12) }
	pointsDialog.value.points = v
	// 用户在改 → 清掉旧错误，让红色字不要一直挂着
	if (pointsDialog.value.error) { pointsDialog.value.error = '' }
}

// 是否允许提交：金额 > 0；取积分时不能超过可用积分（monthPoints）
const canConfirm = computed<boolean>((): boolean => {
	const n : number = parseInt(pointsDialog.value.points, 10)
	if (!isFinite(n) || n <= 0) { return false }
	if (pointsDialog.value.mode == 'withdraw' && n > info.value.monthPoints) { return false }
	return true
})

const onTapPoCancel = () : void => {
	pointsDialog.value.visible = false
}

const onTapPoMask = () : void => {
	pointsDialog.value.visible = false
}

const onTapPoConfirm = () : void => {
	const n : number = parseInt(pointsDialog.value.points, 10)
	if (!isFinite(n) || n <= 0) {
		pointsDialog.value.error = '请输入大于 0 的整数'
		return
	}
	if (pointsDialog.value.mode == 'withdraw' && n > info.value.monthPoints) {
		pointsDialog.value.error = '超过可用积分（' + formatNum(info.value.monthPoints) + '）'
		return
	}

	// 存/取积分都走接口（storeId 取当前选中门店，未选传 0），成功后重新拉取（不做本地同步）
	const isDeposit : boolean = pointsDialog.value.mode == 'deposit'
	const req : Promise<void> = isDeposit ? rechargePoints(store.value.id, n) : withdrawPoints(store.value.id, n)
	req.then((): void => {
		pointsDialog.value.visible = false
		uni.showToast({ title: (isDeposit ? '已申请存入 ' : '已申请取出 ') + formatNum(n) + ' 积分', icon: 'none' })
		loadMyJiude()
	}).catch((err : any) => {
		console.error(isDeposit ? '[酒德] 存积分失败:' : '[酒德] 取积分失败:', err)
		pointsDialog.value.error = (isDeposit ? '存积分失败：' : '取积分失败：') + (err.message || '未知错误')
	})
}

const onTapDeposit = () : void => {
	openPointsDialog('deposit')
}

const onTapWithdraw = () : void => {
	openPointsDialog('withdraw')
}

const onTapVoucher = (v : { code : string, name : string, count : number }) : void => {
	if (v.count <= 0) {
		uni.showToast({ title: v.code + ' 券暂无可用', icon: 'none' })
		return
	}
	uni.showToast({ title: v.name + ' · 即将上线', icon: 'none' })
}

const onTapRank = () : void => {
	// 跳转酒德积分排行（独立页面，非 tabBar 的段位赛季榜）
	uni.navigateTo({ url: '/pages/jiude-rank/jiude-rank' })
}

const onTapRecords = () : void => {
	uni.navigateTo({ url: '/pages/jiude-records/jiude-records' })
}
</script>

<style scoped>
	.page {
		box-sizing: border-box;
		background-image: linear-gradient(180deg, #0E1110 0%, #0A0C0B 40%, #0B0D0C 100%);
		min-height: 100vh;
	}
	/* #ifdef H5 */
	.page { min-height: calc(100vh - var(--window-top) - var(--window-bottom)); }
	/* #endif */

	/* ============ 顶部 ============ */
	.top-bar {
		flex-direction: row;
		align-items: flex-end;
		justify-content: space-between;
		padding: 28rpx 0 16rpx;
	}
	.top-bar-left { flex-direction: column; }
	.top-bar-title { font-size: 44rpx; color: #EDEFEE; font-weight: 700; letter-spacing: 4rpx; }
	.top-bar-sub { font-size: 18rpx; color: #7E8281; letter-spacing: 4rpx; margin-top: 6rpx; }
	/* "规则"按钮：右上角圆角小药丸，与主色卡片拉开距离，保持克制 */
	.top-bar-right {
		padding: 10rpx 22rpx;
		border-radius: 999rpx;
		background-color: rgba(232, 194, 117, 0.10);
		border: 1rpx solid rgba(232, 194, 117, 0.30);
	}
	.top-bar-rule { font-size: 22rpx; color: #E8C275; font-weight: 600; }

	/* ============ 当前门店 ============ */
	.store-card {
		background-color: #1A1E1D;
		margin: 12rpx 0 0;
		border-radius: 28rpx;
		border: 1rpx solid #2A2F2D;
		padding: 22rpx 26rpx;
		box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
	}
	.store-head { flex-direction: row; align-items: center; }
	.store-icon {
		width: 56rpx;
		height: 56rpx;
		border-radius: 16rpx;
		background-image: linear-gradient(135deg, rgba(232, 194, 117, 0.30), rgba(200, 155, 60, 0.20));
		align-items: center;
		justify-content: center;
	}
	.store-icon-text { font-size: 28rpx; color: #E8C275; font-weight: 700; }
	.store-info { flex: 1; flex-direction: column; margin-left: 18rpx; }
	.store-name { font-size: 28rpx; color: #EDEFEE; font-weight: 700; }
	.store-loc { font-size: 20rpx; color: #7E8281; margin-top: 6rpx; }
	/* "切换"按钮：细线胶囊，靠右侧，与 store-icon 主色块呼应 */
	.store-switch {
		padding: 8rpx 18rpx;
		border-radius: 999rpx;
		background-color: rgba(126, 130, 129, 0.18);
		border: 1rpx solid rgba(126, 130, 129, 0.32);
		margin-left: 12rpx;
	}
	.store-switch-text { font-size: 20rpx; color: #C7CDCB; font-weight: 500; }

	/* ============ 我的等级与成长 ============ */
	.tier-card {
		background-color: #1A1E1D;
		/* 左上角一抹金黄斜向光，与 mine / rank 页的"主场卡片"形成同款语言 */
		background-image: linear-gradient(150deg, rgba(232, 194, 117, 0.18), rgba(232, 194, 117, 0.03) 55%);
		margin: 18rpx 0 0;
		border-radius: 32rpx;
		padding: 28rpx 28rpx;
		border: 1rpx solid rgba(232, 194, 117, 0.40);
		box-shadow: 0 10rpx 28rpx rgba(0, 0, 0, 0.40), inset 0 1rpx 0 rgba(255, 255, 255, 0.05);
	}
	.tier-head { flex-direction: row; align-items: center; }
	.tier-emblem {
		width: 104rpx;
		height: 104rpx;
		border-radius: 50%;
		align-items: center;
		justify-content: center;
		padding: 6rpx;
		border-width: 2rpx;
		border-style: solid;
	}
	.tier-emblem-in {
		width: 92rpx;
		height: 92rpx;
		border-radius: 50%;
		background-color: #12100A;
		align-items: center;
		justify-content: center;
		border-width: 2rpx;
		border-style: solid;
	}
	.tier-emblem-text { font-size: 44rpx; font-weight: 700; line-height: 48rpx; }

	.tier-info { flex: 1; flex-direction: column; margin-left: 20rpx; }
	.tier-name-row { flex-direction: row; align-items: center; }
	.tier-name { font-size: 32rpx; color: #EDEFEE; font-weight: 700; }
	.tier-progress-tip { font-size: 22rpx; color: #8F9492; margin-top: 8rpx; }

	/* 成长进度条 */
	.tier-progress { margin-top: 26rpx; }
	.tier-progress-track {
		height: 10rpx;
		background-color: #242827;
		border-radius: 999rpx;
		overflow: hidden;
	}
	.tier-progress-fill {
		height: 10rpx;
		background-image: linear-gradient(90deg, #F5D98E, #C89B3C);
		border-radius: 999rpx;
		/* 入场动画：宽度变化时平滑过渡（先快后慢的增长曲线） */
		transition: width 1.2s cubic-bezier(0.22, 1, 0.36, 1);
	}
	.tier-progress-meta {
		flex-direction: row;
		justify-content: space-between;
		margin-top: 10rpx;
	}
	.tier-progress-now { font-size: 22rpx; color: #E8C275; font-weight: 700; }
	.tier-progress-target { font-size: 20rpx; color: #7E8281; }

	/* 三组数据：成长值(白) / 可用积分(绿) / 累计积分(金) */
	.tier-stats {
		flex-direction: row;
		align-items: stretch;
		margin-top: 24rpx;
		padding-top: 22rpx;
		border-top: 1rpx solid #242827;
	}
	.tier-stat { flex: 1; flex-direction: column; align-items: center; }
	.tier-stat-value { font-size: 32rpx; font-weight: 700; }
	.tier-stat-label { font-size: 22rpx; color: #7E8281; margin-top: 6rpx; }
	.tier-stat-divider { width: 1rpx; background-color: #242827; }

	/* ============ 操作按钮 ============ */
	.action-row {
		flex-direction: row;
		margin: 24rpx 0 0;
	}
	.action-btn {
		flex: 1;
		flex-direction: column;
		align-items: center;
		padding: 26rpx 0 26rpx;
		border-radius: 28rpx;
		border-width: 1rpx;
		border-style: solid;
		box-shadow: 0 8rpx 22rpx rgba(0, 0, 0, 0.35);
	}
	.action-btn-deposit {
		margin-right: 14rpx;
		background-image: linear-gradient(135deg, rgba(42, 169, 122, 0.30), rgba(42, 169, 122, 0.08));
		border-color: rgba(42, 169, 122, 0.55);
	}
	.action-btn-withdraw {
		margin-left: 0;
		background-image: linear-gradient(135deg, rgba(232, 194, 117, 0.28), rgba(232, 194, 117, 0.06));
		border-color: rgba(232, 194, 117, 0.50);
	}
	/* 操作按钮上的"+" "−"圆徽：与主色卡片呼应，靠尺寸与位置形成"操作感" */
	.action-btn-icon {
		width: 64rpx;
		height: 64rpx;
		border-radius: 50%;
		font-size: 40rpx;
		font-weight: 700;
		line-height: 64rpx;
		text-align: center;
		margin-bottom: 14rpx;
	}
	.action-btn-deposit .action-btn-icon {
		color: #2AA97A;
		background-color: rgba(42, 169, 122, 0.18);
	}
	.action-btn-withdraw .action-btn-icon {
		color: #E8C275;
		background-color: rgba(232, 194, 117, 0.18);
	}
	.action-btn-text { font-size: 30rpx; color: #EDEFEE; font-weight: 700; }
	.action-btn-sub { font-size: 20rpx; color: #8F9492; margin-top: 6rpx; }

	/* ============ 积分使用指南 ============ */
	/* 与顶部「规则」相同药丸设计：背景淡金 + 金边 + 金字；居中放在存/取积分按钮下方 */
	.guide-link {
		flex-direction: row;
		align-items: center;
		align-self: center;
		padding: 12rpx 26rpx;
		margin: 18rpx 0 0;
		border-radius: 999rpx;
		background-color: rgba(232, 194, 117, 0.10);
		border: 1rpx solid rgba(232, 194, 117, 0.30);
	}
	.guide-link-text { font-size: 22rpx; color: #E8C275; font-weight: 600; }
	.guide-link-arrow { font-size: 24rpx; color: #E8C275; margin-left: 10rpx; line-height: 24rpx; font-weight: 600; }

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
	.section-count { font-size: 24rpx; color: #8F9492; }

	/* ============ 等级权益（/jiu-de/level-benefit） ============ */
	/* 权益卡：上半为分数概览三栏，下半为月卡 + A/B/C 套餐数量网格 */
	.benefit-card {
		padding: 24rpx;
		border-radius: 26rpx;
		background-color: #1A1E1D;
		border: 1rpx solid #2A2F2D;
		box-shadow: 0 6rpx 18rpx rgba(0, 0, 0, 0.35);
	}
	/* 分数概览：三栏均分 + 竖分隔线 */
	.benefit-row { flex-direction: row; align-items: center; }
	.benefit-cell {
		flex: 1;
		flex-direction: column;
		align-items: center;
	}
	.benefit-cell-divider { width: 1rpx; height: 48rpx; background-color: #2A2F2D; }
	.benefit-cell-num { font-size: 32rpx; color: #EDEFEE; font-weight: 700; line-height: 44rpx; }
	.benefit-cell-label { font-size: 20rpx; color: #7E8281; margin-top: 6rpx; }

	/* 权益网格：A/B/C 套餐一行三列，用 gap 占位隔开 */
	.benefit-grid {
		flex-direction: row;
		align-items: stretch;
		margin-top: 20rpx;
		padding-top: 20rpx;
		border-top: 1rpx solid #2A2F2D;
	}
	.benefit-item {
		flex: 1;
		flex-direction: column;
		align-items: center;
		padding: 16rpx 0;
		border-radius: 18rpx;
		background-color: #141817;
		border: 1rpx solid #2A2F2D;
	}
	.benefit-gap { width: 12rpx; }
	.benefit-item-num { font-size: 34rpx; color: #E8C275; font-weight: 700; line-height: 44rpx; }
	.benefit-item-label { font-size: 20rpx; color: #8F9492; margin-top: 4rpx; }

	/* 全部等级权益：横向滚动卡片列表 */
	/* 不固定 750rpx 宽度：固定宽度可能超出实际视口，导致滑到最右时最后一张卡被屏幕边缘裁切 */
	.benefit-scroll {
		flex-direction: row;
		align-items: stretch;
		margin-top: 16rpx;
	}
	/* 两端缓冲垫：首尾与屏幕边缘留出小间距，保证最后一张卡的边框/阴影完整显示 */
	.benefit-scroll-pad { width: 12rpx; flex-shrink: 0; }
	.benefit-pill {
		flex-shrink: 0;
		width: 300rpx;
		flex-direction: column;
		padding: 20rpx 22rpx;
		border-radius: 22rpx;
		background-color: #1A1E1D;
		border: 1rpx solid #2A2F2D;
		margin-right: 14rpx;
		box-shadow: 0 6rpx 18rpx rgba(0, 0, 0, 0.35);
		position: relative;
	}
	/* 当前等级高亮：金色边框 + 暖底 */
	.benefit-pill-current {
		border-color: rgba(232, 194, 117, 0.55);
		background-color: #1D1812;
	}
	.benefit-pill-head { flex-direction: row; align-items: center; justify-content: space-between; }
	.benefit-pill-label { font-size: 30rpx; font-weight: 700; }
	.benefit-pill-card { font-size: 18rpx; color: #8F9492; }
	.benefit-pill-need { font-size: 20rpx; color: #7E8281; margin-top: 8rpx; }
	.benefit-pill-row {
		flex-direction: row;
		margin-top: 16rpx;
		padding-top: 14rpx;
		border-top: 1rpx solid #2A2F2D;
	}
	.benefit-pill-cell { flex: 1; flex-direction: column; align-items: center; }
	.benefit-pill-num { font-size: 26rpx; color: #EDEFEE; font-weight: 700; line-height: 34rpx; }
	.benefit-pill-col { font-size: 18rpx; color: #8F9492; margin-top: 2rpx; }

	/* "当前等级"标记：卡片右上角小标签 */
	.benefit-pill-tag {
		position: absolute;
		top: -10rpx;
		right: 14rpx;
		padding: 4rpx 14rpx;
		border-radius: 999rpx;
		background-image: linear-gradient(135deg, #F5D98E, #C89B3C);
	}
	.benefit-pill-tag-text { font-size: 18rpx; color: #14100A; font-weight: 700; }

	/* ============ 我的套餐券 A/B/C ============ */
	.voucher-row { flex-direction: row; }
	.voucher-card {
		flex: 1;
		flex-direction: column;
		background-color: #1A1E1D;
		border-radius: 24rpx;
		border: 1rpx solid #2A2F2D;
		padding: 20rpx 20rpx;
		box-shadow: 0 6rpx 18rpx rgba(0, 0, 0, 0.33);
		position: relative;
		overflow: hidden;
	}
	/* 三张卡之间留 12rpx 间距：左中右用 margin-right 控制，
	   最后一张 :last-child 清零 */
	.voucher-card-a { margin-right: 12rpx; }
	.voucher-card-b { margin-right: 12rpx; }
	/* 三档主色靠左侧 6rpx 色条区分，与 mine 页 ga-card 视觉同源 */
	.voucher-card-a { border-left: 6rpx solid #2AA97A; }
	.voucher-card-b { border-left: 6rpx solid #E8C275; }
	.voucher-card-c { border-left: 6rpx solid #B07AE8; }

	.voucher-head { flex-direction: row; align-items: center; }
	.voucher-code {
		font-size: 36rpx;
		color: #EDEFEE;
		font-weight: 700;
		font-family: monospace;
	}
	.voucher-divider {
		width: 1rpx;
		height: 28rpx;
		background-color: #242827;
		margin: 0 12rpx;
	}
	.voucher-name { font-size: 24rpx; color: #EDEFEE; font-weight: 600; flex: 1; }
	.voucher-desc { font-size: 20rpx; color: #7E8281; margin-top: 12rpx; line-height: 28rpx; }

	.voucher-foot {
		flex-direction: row;
		align-items: flex-end;
		justify-content: space-between;
		margin-top: 18rpx;
		padding-top: 14rpx;
		border-top: 1rpx solid rgba(36, 40, 39, 0.6);
	}
	.voucher-count { flex-direction: row; align-items: baseline; }
	.voucher-count-num { font-size: 36rpx; font-weight: 700; line-height: 40rpx; }
	.voucher-count-label { font-size: 20rpx; color: #7E8281; margin-left: 4rpx; }
	.voucher-expire { font-size: 18rpx; color: #7E8281; }

	/* ============ 入口列表 ============ */
	.entry-list {
		margin: 32rpx 0 0;
		background-color: #1A1E1D;
		border-radius: 28rpx;
		border: 1rpx solid #2A2F2D;
		box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
		overflow: hidden;
	}
	.entry-row {
		flex-direction: row;
		align-items: center;
		padding: 26rpx 26rpx;
		border-bottom: 1rpx solid rgba(36, 40, 39, 0.6);
	}
	.entry-row-last { border-bottom-width: 0; }
	.entry-row-icon {
		width: 56rpx;
		height: 56rpx;
		border-radius: 16rpx;
		background-color: rgba(42, 169, 122, 0.18);
		align-items: center;
		justify-content: center;
	}
	/* "积分排行"用金色图标底，与"存取记录"的绿色图标底形成语义对比 */
	.entry-row-icon-gold { background-color: rgba(232, 194, 117, 0.20); }
	.entry-row-icon-text { font-size: 26rpx; color: #2AA97A; font-weight: 700; }
	.entry-row-icon-gold .entry-row-icon-text { color: #E8C275; }
	.entry-row-mid { flex: 1; flex-direction: column; margin-left: 18rpx; }
	.entry-row-title { font-size: 28rpx; color: #EDEFEE; font-weight: 600; }
	.entry-row-sub { font-size: 20rpx; color: #7E8281; margin-top: 4rpx; }
	.entry-row-tail { flex-direction: row; align-items: center; }
	.entry-row-count { font-size: 24rpx; color: #8F9492; margin-right: 14rpx; }
	.entry-row-arrow { font-size: 36rpx; color: #7E8281; line-height: 36rpx; }

	.footer-blank { height: 60rpx; }

	/* ============ 图片弹层 ============ */
	/* 黑色 75% 半透明遮罩铺满全屏，挡住主页面交互 */
	.iv-overlay {
		position: fixed;
		left: 0; right: 0; top: 0; bottom: 0;
		background-color: rgba(0, 0, 0, 0.75);
		align-items: center;
		justify-content: center;
		z-index: 999;
		padding: 12rpx;
	}
	.iv-card {
		flex-direction: column;
		width: 720rpx;
		max-width: 100%;
		background-color: #1A1E1D;
		border-radius: 24rpx;
		border: 1rpx solid #2A2F2D;
		padding: 12rpx;
		position: relative;
		box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.55);
	}
	/* 右上角圆形关闭按钮 */
	.iv-close {
		position: absolute;
		top: -36rpx;
		right: -36rpx;
		width: 72rpx;
		height: 72rpx;
		border-radius: 50%;
		background-color: #EDEFEE;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.45);
	}
	.iv-close-text { font-size: 48rpx; color: #0B0D0C; font-weight: 700; line-height: 48rpx; }
	/* 图片本身：aspectFit 保持原图比例不拉伸；宽度 93% 屏宽、高度 74% 屏高，视觉上占据约 80% 屏幕 */
	.iv-image {
		width: 696rpx;
		max-width: 100%;
		height: 980rpx;
		border-radius: 16rpx;
		background-color: #0B0D0C;
	}
	.iv-caption {
		font-size: 22rpx;
		color: #8F9492;
		text-align: center;
		margin-top: 18rpx;
	}

	/* ============ 切换门店底部弹层 ============ */
	/* 全屏遮罩 + 底部 sheet：sheet 紧贴底部，最大高度 78% 屏高，留出 22% 看主页面 */
	.ss-overlay {
		position: fixed;
		left: 0; right: 0; top: 0; bottom: 0;
		background-color: rgba(0, 0, 0, 0.65);
		align-items: flex-end;
		justify-content: center;
		z-index: 998;
		padding: 0 24rpx 24rpx;
	}
	.ss-sheet {
		flex-direction: column;
		width: 100%;
		max-height: 1080rpx;
		background-color: #1A1E1D;
		border-radius: 32rpx 32rpx 0 0;
		border: 1rpx solid #2A2F2D;
		border-bottom-width: 0;
		padding: 12rpx 0 0;
		box-shadow: 0 -16rpx 48rpx rgba(0, 0, 0, 0.55);
	}

	/* 顶部小横条：iOS / Android 通用"可下拉关闭"视觉提示 */
	.ss-handle {
		width: 80rpx;
		height: 8rpx;
		border-radius: 8rpx;
		background-color: #3A3F3D;
		align-self: center;
		margin: 8rpx 0 18rpx;
	}

	/* 头部：标题 + 副标题 + 关闭 X */
	.ss-head {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 0 28rpx 16rpx;
		border-bottom: 1rpx solid #242827;
	}
	.ss-head-left { flex: 1; flex-direction: column; }
	.ss-head-title { font-size: 32rpx; color: #EDEFEE; font-weight: 700; }
	.ss-head-sub { font-size: 22rpx; color: #8F9492; margin-top: 6rpx; }
	.ss-close {
		width: 56rpx;
		height: 56rpx;
		border-radius: 50%;
		background-color: rgba(255, 255, 255, 0.05);
		border: 1rpx solid #2A2F2D;
		align-items: center;
		justify-content: center;
	}
	.ss-close-text { font-size: 36rpx; color: #EDEFEE; line-height: 36rpx; font-weight: 500; }

	/* 列表滚动区域：固定最大高度，scroll-view 内嵌 */
	.ss-body {
		flex: 1;
		max-height: 800rpx;
		padding: 12rpx 24rpx 24rpx;
	}

	/* 门店行：图标 + 名称/地址 + 右侧状态（列表为接口返回的平铺数据，无城市分组） */
	.ss-row {
		flex-direction: row;
		align-items: center;
		padding: 22rpx 16rpx;
		border-radius: 18rpx;
		background-color: #1F2322;
		border: 1rpx solid #2A2F2D;
		margin-top: 10rpx;
	}
	/* 当前选中行：金色细边 + 淡金底 */
	.ss-row-active {
		background-color: rgba(232, 194, 117, 0.10);
		border: 1rpx solid rgba(232, 194, 117, 0.55);
	}
	.ss-row-icon {
		width: 72rpx;
		height: 72rpx;
		border-radius: 18rpx;
		background-color: rgba(232, 194, 117, 0.18);
		align-items: center;
		justify-content: center;
		margin-right: 18rpx;
	}
	.ss-row-icon-text { font-size: 32rpx; color: #E8C275; font-weight: 700; }
	.ss-row-main { flex: 1; flex-direction: column; }
	.ss-row-line1 { flex-direction: row; align-items: center; }
	.ss-row-name { font-size: 28rpx; color: #EDEFEE; font-weight: 600; }
	/* "当前"小药丸：金色细边、金字、半透明金底 */
	.ss-row-tag-current {
		margin-left: 12rpx;
		padding: 4rpx 14rpx;
		border-radius: 999rpx;
		background-color: rgba(232, 194, 117, 0.18);
		border: 1rpx solid rgba(232, 194, 117, 0.45);
	}
	.ss-row-tag-current-text { font-size: 18rpx; color: #E8C275; font-weight: 700; }
	.ss-row-addr { font-size: 22rpx; color: #8F9492; margin-top: 6rpx; }

	/* 空状态：接口无数据 / 加载失败时的占位提示 */
	.ss-empty {
		padding: 60rpx 0;
		align-items: center;
	}
	.ss-empty-text { font-size: 24rpx; color: #7E8281; }
	.ss-row-check {
		width: 56rpx;
		height: 56rpx;
		border-radius: 50%;
		background-color: #E8C275;
		align-items: center;
		justify-content: center;
		margin-left: 14rpx;
	}
	.ss-row-check-text { font-size: 32rpx; color: #0B0D0C; font-weight: 700; line-height: 32rpx; }
	.ss-row-arrow {
		padding: 0 8rpx;
		margin-left: 14rpx;
	}
	.ss-row-arrow-text { font-size: 40rpx; color: #4A4F4D; line-height: 40rpx; font-weight: 500; }

	/* 页脚提示：金色小图标 + 解释文案 */
	.ss-foot {
		flex-direction: row;
		align-items: center;
		padding: 18rpx 28rpx 28rpx;
		border-top: 1rpx solid #242827;
	}
	.ss-foot-icon {
		width: 36rpx;
		height: 36rpx;
		border-radius: 50%;
		background-color: rgba(232, 194, 117, 0.18);
		align-items: center;
		justify-content: center;
		margin-right: 12rpx;
	}
	.ss-foot-icon-text { font-size: 22rpx; color: #E8C275; font-weight: 700; line-height: 22rpx; }
	.ss-foot-text { flex: 1; font-size: 22rpx; color: #8F9492; line-height: 32rpx; }

	/* ============ 存取积分弹层 ============ */
	/* 居中浮层结构：与 .iv-overlay 同款（mask + card），
	   card 内部 @tap.stop 防止冒泡到 mask 触发关闭 */
	.po-overlay {
		position: fixed;
		left: 0; right: 0; top: 0; bottom: 0;
		background-color: rgba(0, 0, 0, 0.65);
		align-items: center;
		justify-content: center;
		z-index: 999;
		padding: 24rpx;
	}
	.po-card {
		flex-direction: column;
		width: 624rpx;
		max-width: 100%;
		background-color: #1A1E1D;
		border-radius: 24rpx;
		border: 1rpx solid #2A2F2D;
		padding: 32rpx 32rpx 24rpx;
		box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.55);
	}
	.po-head { margin-bottom: 24rpx; }
	.po-title { font-size: 34rpx; color: #EDEFEE; font-weight: 700; }
	.po-sub { font-size: 22rpx; color: #8F9492; margin-top: 8rpx; line-height: 30rpx; }

	/* 当前可用积分信息条：先让用户看到余额，再决定输多少 */
	.po-info {
		flex-direction: row;
		align-items: baseline;
		justify-content: space-between;
		padding: 18rpx 22rpx;
		background-color: #1F2322;
		border-radius: 16rpx;
		border: 1rpx solid #2A2F2D;
		margin-bottom: 18rpx;
	}
	.po-info-label { font-size: 22rpx; color: #8F9492; }
	.po-info-value { font-size: 26rpx; color: #E8C275; font-weight: 700; }

	/* 输入框：圆角深色胶囊 + 右侧"积分"单位；input 自身样式由 .po-input 重置 */
	.po-input-wrap {
		flex-direction: row;
		align-items: center;
		padding: 0 22rpx;
		background-color: #1F2322;
		border-radius: 16rpx;
		border: 1rpx solid #2A2F2D;
		height: 88rpx;
	}
	.po-input {
		flex: 1;
		font-size: 32rpx;
		color: #EDEFEE;
		font-weight: 600;
		padding: 0;
	}
	.po-input-ph {
		color: #4A4F4D;
		font-size: 28rpx;
		font-weight: 400;
	}
	.po-input-suffix { font-size: 24rpx; color: #7E8281; margin-left: 12rpx; }

	/* 内联错误：紧贴输入框，避免 toast 抢焦点 */
	.po-error { margin-top: 14rpx; padding: 0 4rpx; }
	.po-error-text { font-size: 22rpx; color: #E55858; }

	/* 底部双按钮：取消灰底深边，确定金底深字；不满足 canConfirm 时确定按钮置灰 */
	.po-actions { flex-direction: row; margin-top: 28rpx; }
	.po-btn {
		flex: 1;
		height: 88rpx;
		border-radius: 16rpx;
		align-items: center;
		justify-content: center;
		border-width: 1rpx;
		border-style: solid;
	}
	.po-btn-cancel {
		margin-right: 18rpx;
		background-color: rgba(255, 255, 255, 0.04);
		border-color: #2A2F2D;
	}
	.po-btn-confirm {
		background-image: linear-gradient(135deg, #F5D98E, #C89B3C);
		border-color: rgba(232, 194, 117, 0.55);
	}
	.po-btn-confirm-disabled {
		background-color: #2A2F2D;
		background-image: none;
		border-color: #2A2F2D;
	}
	.po-btn-text { font-size: 28rpx; font-weight: 600; }
	.po-btn-text-cancel { color: #C7CDCB; }
	.po-btn-text-confirm { color: #14100A; }
</style>