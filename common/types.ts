export type StoreInfo = {
	id : string
	name : string
	abbr : string
	branchName : string
	shortName : string
	city : string
	province : string
	district : string
	address : string
	distance : string
	x : number
	y : number
	openGames : number
}

// 同一城市的多家门店在地图上距离过近（仅 2~8rpx），因此按城市聚合展示
export type CityGroup = {
	name : string
	province : string
	x : number
	y : number
	count : number
	openGames : number
	districts : string
	storeIds : string[]
}

export type GameItem = {
	id : string
	storeId : string
	storeName : string
	city : string
	title : string
	players : number
	maxPlayers : number
	startChips : number
	level : string
	status : string
	startTime : string
	buyIn : number
}

export type MapLabel = {
	name : string
	x : number
	y : number
}

// ---- 对局详情 ----

// 参赛玩家：rank 为按筹码降序后的名次，已淘汰玩家筹码为 0
export type PlayerInfo = {
	rank : number
	name : string
	chips : number
	alive : boolean
	isMe : boolean
	buyIns : number         // 买入次数（含重购 / Re-entry）
	fishScore : number      // 摸鱼分：现场记录的软指标，管理员可加减
	tableNo : number        // 桌号（0 = 未分桌 / 已离桌）
	seatNo : number         // 座位号（0 = 未分配）
	offTable : boolean      // 已出桌：人还在赛场但暂离牌桌，可回桌
}
// 列表卡片只需要摘要字段，详情页要展示完整赛事数据，单独定义避免 GameItem 被撑胖
export type GameDetail = {
	game : GameItem
	type : string
	entrants : number
	alive : number
	busted : number
	joined : boolean
	myState : string
	myChips : number
	myRank : number
	smallBlind : number
	bigBlind : number
	avgChips : number
	totalChips : number
	players : PlayerInfo[]
}

// ---- 排行榜 ----

// 段位定义：key 供数据引用，suit/name 组成称号，color 为段位主色，
// rowBg / rowBorder 是榜单行的"荣誉背景"，段位越高底色与描边越醒目
// frame* 四个字段描述该段位的专属头像框（全部正圆、以德扑筹码为原型）：
// frameBg 渐变主色环、frameGlow 光晕、frameLine 内侧收边细环、frameTick 环上筹码刻度色
export type TierInfo = {
	key : string
	suit : string
	name : string
	color : string
	rowBg : string
	rowBorder : string
	frameBg : string
	frameGlow : string
	frameLine : string
	frameTick : string
}

// 榜上玩家：tier 对应 TierInfo.key，tierLevel 用罗马数字显示（I 最高，V 最低）
// avatar 为可选字段：不填时前端回落到默认头像，等真实用户体系接入后逐人替换
// 五个统计字段支撑 6 种榜单：
//   games    总场次        —— 胜率 / 进圈率分母
//   itm      进圈次数      —— 进圈率分子
//   mushroom 蘑菇数        —— 蘑菇王榜单
//   masterScore 大师积分   —— 大师榜（仅黑桃及以上有有效分）
//   fishScore 摸鱼积分     —— 摸鱼积分榜（段位越低分越高，反向趣味榜）
export type RankPlayer = {
	rank : number
	name : string
	city : string
	avatar ?: string
	levelName ?: string    // 接口返回的等级名（如"黑桃 III"），存在时优先于花色段位展示
	points : number
	tier : string
	tierLevel : number
	titles : number
	wins : number
	games : number
	itm : number
	mushroom : number
	masterScore : number
	fishScore : number
	isMe : boolean
}

// 赛季：myNextPoints 是"我"升入下一等级的分数门槛，仅当前赛季会用到
export type SeasonInfo = {
	id : string
	label : string
	name : string
	status : string
	endsIn : string
	myNextPoints : number
	players : RankPlayer[]
}

// ---- 战绩 ----

// 趋势图单根柱：heightPct 为可视化高度百分比（0~100），名次越靠前越高
// kind 决定配色：win(冠军) / itm(进圈) / out(未进圈)
export type TrendBar = {
	rank : number
	heightPct : number
	kind : string
}

// ---- 酒德 ----

// "我"的酒德状态：tierKey + tierLevel 定位当前等级
// growthValue 是当前成长值，nextThreshold 是下一级门槛（同 6 级时为满级）
// availablePoints 是可消费酒德币，totalPoints 是累计酒德币（含已消费的）
export type MyJiude = {
	tierKey : string
	tierLevel : number
	growthValue : number
	nextThreshold : number
	availablePoints : number
	totalPoints : number
	monthPoints : number     // 本月累积（与 mine 页 jiude-card 一致）
	rank : number             // 酒德榜排名（与 mine 页 jiude-card 一致）
}

// 套餐券：A / B / C 三档，按 code 区分；count 为剩余张数，expireAt 为到期日
// color 用于卡片主色块（A=绿/B=金/C=紫 的语义与按钮"存/取/转"形成三角）
export type JiudeVoucher = {
	code : string          // 'A' | 'B' | 'C'
	name : string
	count : number
	color : string         // 主色
}

// 存取记录：type 决定语义色（存=绿/取=金/转=紫），amount 可正可负
// source 是简短的来源/去向描述，date 是 YYYY-MM-DD HH:mm 形式
export type JiudeRecord = {
	id : string
	type : string          // 'deposit' | 'withdraw' | 'transfer'
	amount : number
	source : string
	date : string
}

// 记录筛选枚举
export type RecordFilter = 'all' | 'deposit' | 'withdraw' | 'transfer'

// 时间范围筛选枚举：'all' 不限定；其他值都从今天回溯
export type RangeFilter = 'all' | 'today' | 'week' | 'month' | '30days'

// ---- 酒德积分排行 ----

// 酒德榜玩家：tierKey + tierLevel 定位酒德 6 级
// totalPoints 累计酒德币（总榜排序键）；monthPoints 本月新增（月度/新人榜排序键）
// isNew 用于新人榜筛选（注册 30 天内）；joinDate 仅新人榜展示
// isMe 与 jiude 页 MY_JIUDE 同口径（monthPoints=184 / totalPoints=12480 / tier=spade）
export type JiudeRankPlayer = {
	rank : number
	id : string
	name : string
	city : string
	avatar ?: string
	totalPoints : number
	monthPoints : number
	tierKey : string			// diamond | club | heart | spade | crown | legend
	tierLevel : number
	isNew : boolean
	joinDate : string			// YYYY-MM-DD；仅新人榜展示
	isMe : boolean
}