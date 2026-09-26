import type { TierInfo, RankPlayer, SeasonInfo } from './types'

// 段位体系（共 6 级）：以四花色 + 王座 + 传奇命名，与品牌"静默筹码"的牌桌意象一脉相承
// 等级 I 最高、V 最低；rowBg / rowBorder 是榜单行的荣誉底色，随段位递进
//
// 头像框设计（frame* 字段）：全部为正圆，统一以德州扑克筹码为原型——
// 渐变主色环（frameBg）+ 环上均匀 8 枚筹码刻度（frameTick）+ 内侧收边细环（frameLine），
// 段位差异靠用色与光晕递进：
//   ♦ 方片  淡蓝细感环 + 暗淡刻度，面额最小的入门筹码
//   ♣ 梅花  绿色渐变环，刻度转实
//   ♥ 红心  红色渐变环 + 微红光晕
//   ♠ 黑桃  银亮渐变环 + 银光晕 + 银白刻度
//   ♛ 王座  金色渐变环 + 金光晕 + 亮金刻度与内环
//   ★ 传奇  白金三段渐变环 + 强光晕 + 白金刻度 + 框顶 ♛ 皇冠徽章
// 环与刻度由页面 frameStyle() / frameTicks() 注入，尺寸走样式类
export const TIERS : TierInfo[] = [
	{
		key: 'diamond', suit: '♦', name: '方片', color: '#7AB6F2',
		rowBg: 'rgba(122,182,242,0.08)', rowBorder: 'rgba(122,182,242,0.28)',
		frameBg: 'linear-gradient(135deg,rgba(122,182,242,0.55),rgba(122,182,242,0.16))',
		frameGlow: 'none',
		frameLine: 'rgba(122,182,242,0.40)',
		frameTick: 'rgba(122,182,242,0.70)'
	},
	{
		key: 'club', suit: '♣', name: '梅花', color: '#E8C275',
		rowBg: 'rgba(232,194,117,0.10)', rowBorder: 'rgba(232,194,117,0.32)',
		frameBg: 'linear-gradient(135deg,rgba(245,217,142,0.85),rgba(200,155,60,0.30))',
		frameGlow: '0 0 12rpx rgba(232,194,117,0.35)',
		frameLine: 'rgba(232,194,117,0.60)',
		frameTick: 'rgba(245,217,142,0.95)'
	},
	{
		key: 'heart', suit: '♥', name: '红心', color: '#FF6255',
		rowBg: 'rgba(255,98,85,0.08)', rowBorder: 'rgba(255,98,85,0.30)',
		frameBg: 'linear-gradient(135deg,#FF6255,rgba(255,98,85,0.40))',
		frameGlow: '0 0 14rpx rgba(255,98,85,0.40)',
		frameLine: 'rgba(255,98,85,0.60)',
		frameTick: '#FF8577'
	},
	{
		key: 'spade', suit: '♠', name: '黑桃', color: '#C7CDCB',
		rowBg: 'rgba(199,205,203,0.08)', rowBorder: 'rgba(199,205,203,0.32)',
		frameBg: 'linear-gradient(135deg,#EDF2F0,#96A19D)',
		frameGlow: '0 0 16rpx rgba(199,205,203,0.35)',
		frameLine: '#C9D2CF',
		frameTick: '#F2F6F4'
	},
	{
		key: 'crown', suit: '♛', name: '王座', color: '#E8C275',
		rowBg: 'rgba(232,194,117,0.12)', rowBorder: 'rgba(232,194,117,0.42)',
		frameBg: 'linear-gradient(135deg,#F5D98E,#C89B3C)',
		frameGlow: '0 0 24rpx rgba(232,194,117,0.60)',
		frameLine: '#F8E3AE',
		frameTick: '#FFE9AE'
	},
	{
		key: 'legend', suit: '★', name: '传奇', color: '#FFE9B8',
		rowBg: 'rgba(255,233,184,0.14)', rowBorder: 'rgba(255,233,184,0.50)',
		frameBg: 'linear-gradient(135deg,#FFF8DE,#E8C275 50%,#FFF3C9)',
		frameGlow: '0 0 30rpx rgba(255,233,184,0.75)',
		frameLine: '#FFF6DC',
		frameTick: '#FFF8DE'
	}
]

// 三个赛季是同一批玩家的沉浮史："我"的名次 13 → 12 → 8，一路爬升
// 每位玩家补 5 个统计字段（games 总场、itm 进圈次数、mushroom 蘑菇数、
// masterScore 大师积分、fishScore 摸鱼积分），支撑 6 种排名类型
// 注意：rank 页榜单已改为 /user-ranking/info 接口数据；SEASONS 仅作为
// mine / record 页统计字段的演示数据源保留
export const SEASONS : SeasonInfo[] = [
	{
		id: 's3', label: 'S3 · 当前', name: 'S3 · 2026 秋季赛',
		status: '进行中', endsIn: '距结束 27 天', myNextPoints: 3800,
		players: [
			{ rank: 1,  name: '河圈艺术家',   city: '杭州', points: 4620, tier: 'legend',   tierLevel: 1, titles: 8, wins: 63, games: 198, itm: 70,  mushroom: 215, masterScore: 2380, fishScore: 80,  isMe: false },
			{ rank: 2,  name: '深海老鲨',     city: '上海', points: 4415, tier: 'crown',    tierLevel: 1, titles: 6, wins: 58, games: 215, itm: 73,  mushroom: 198, masterScore: 2210, fishScore: 95,  isMe: false },
			{ rank: 3,  name: 'GTO七号',      city: '上海', points: 4238, tier: 'crown',    tierLevel: 2, titles: 5, wins: 61, games: 220, itm: 80,  mushroom: 186, masterScore: 2080, fishScore: 110, isMe: false },
			{ rank: 4,  name: '老K不浪',      city: '苏州', points: 4085, tier: 'spade',    tierLevel: 1, titles: 4, wins: 52, games: 210, itm: 65,  mushroom: 172, masterScore: 1960, fishScore: 125, isMe: false },
			{ rank: 5,  name: '西装暴徒',     city: '南京', points: 3960, tier: 'spade',    tierLevel: 2, titles: 3, wins: 49, games: 232, itm: 72,  mushroom: 188, masterScore: 1860, fishScore: 130, isMe: false },
			{ rank: 6,  name: '天黑请闭眼',   city: '上海', points: 3890, tier: 'spade',    tierLevel: 2, titles: 3, wins: 47, games: 245, itm: 70,  mushroom: 165, masterScore: 1740, fishScore: 145, isMe: false },
			{ rank: 7,  name: '咖啡因选手',   city: '杭州', points: 3745, tier: 'spade',    tierLevel: 3, titles: 2, wins: 44, games: 238, itm: 68,  mushroom: 152, masterScore: 1620, fishScore: 160, isMe: false },
			{ rank: 8,  name: '低调的深筹',   city: '上海', points: 3640, tier: 'spade',    tierLevel: 3, titles: 2, wins: 41, games: 256, itm: 75,  mushroom: 148, masterScore: 1540, fishScore: 175, isMe: true  },
			{ rank: 9,  name: '短码刺客',     city: '苏州', points: 3520, tier: 'spade',    tierLevel: 4, titles: 1, wins: 39, games: 222, itm: 60,  mushroom: 140, masterScore: 1480, fishScore: 180, isMe: false },
			{ rank: 10, name: '翻牌圈诗人',   city: '宁波', points: 3395, tier: 'heart',    tierLevel: 1, titles: 1, wins: 38, games: 210, itm: 58,  mushroom: 132, masterScore: 0,    fishScore: 195, isMe: false },
			{ rank: 11, name: '冷面下注',     city: '上海', points: 3318, tier: 'heart',    tierLevel: 2, titles: 1, wins: 36, games: 235, itm: 65,  mushroom: 128, masterScore: 0,    fishScore: 210, isMe: false },
			{ rank: 12, name: '河底抽花侠',   city: '杭州', points: 3240, tier: 'heart',    tierLevel: 2, titles: 0, wins: 35, games: 248, itm: 62,  mushroom: 122, masterScore: 0,    fishScore: 240, isMe: false },
			{ rank: 13, name: '柠檬味筹码',   city: '上海', points: 3162, tier: 'heart',    tierLevel: 3, titles: 0, wins: 33, games: 224, itm: 56,  mushroom: 118, masterScore: 0,    fishScore: 260, isMe: false },
			{ rank: 14, name: '波动率玩家',   city: '苏州', points: 3085, tier: 'heart',    tierLevel: 3, titles: 0, wins: 32, games: 240, itm: 60,  mushroom: 112, masterScore: 0,    fishScore: 285, isMe: false },
			{ rank: 15, name: '松凶小熊猫',   city: '杭州', points: 2998, tier: 'heart',    tierLevel: 4, titles: 0, wins: 30, games: 260, itm: 55,  mushroom: 108, masterScore: 0,    fishScore: 310, isMe: false },
			{ rank: 16, name: '紧凶橘猫',     city: '南京', points: 2904, tier: 'heart',    tierLevel: 4, titles: 0, wins: 29, games: 255, itm: 53,  mushroom: 102, masterScore: 0,    fishScore: 335, isMe: false },
			{ rank: 17, name: '平跟之王',     city: '上海', points: 2810, tier: 'heart',    tierLevel: 5, titles: 0, wins: 27, games: 280, itm: 58,  mushroom: 95,  masterScore: 0,    fishScore: 360, isMe: false },
			{ rank: 18, name: '三条街故事',   city: '宁波', points: 2732, tier: 'heart',    tierLevel: 5, titles: 0, wins: 26, games: 268, itm: 52,  mushroom: 88,  masterScore: 0,    fishScore: 385, isMe: false },
			{ rank: 19, name: '弃牌的艺术',   city: '苏州', points: 2605, tier: 'club',     tierLevel: 1, titles: 0, wins: 25, games: 244, itm: 50,  mushroom: 82,  masterScore: 0,    fishScore: 410, isMe: false },
			{ rank: 20, name: '盲注收割机',   city: '上海', points: 2528, tier: 'club',     tierLevel: 1, titles: 0, wins: 24, games: 272, itm: 55,  mushroom: 76,  masterScore: 0,    fishScore: 445, isMe: false },
			{ rank: 21, name: '周末战士',     city: '杭州', points: 2450, tier: 'club',     tierLevel: 2, titles: 0, wins: 23, games: 290, itm: 52,  mushroom: 70,  masterScore: 0,    fishScore: 480, isMe: false },
			{ rank: 22, name: '睡不醒的A',    city: '上海', points: 2366, tier: 'club',     tierLevel: 2, titles: 0, wins: 21, games: 305, itm: 48,  mushroom: 64,  masterScore: 0,    fishScore: 525, isMe: false },
			{ rank: 23, name: '新手村村长',   city: '南京', points: 2280, tier: 'club',     tierLevel: 3, titles: 0, wins: 20, games: 280, itm: 45,  mushroom: 58,  masterScore: 0,    fishScore: 570, isMe: false },
			{ rank: 24, name: '运气守恒律',   city: '苏州', points: 2195, tier: 'club',     tierLevel: 3, titles: 0, wins: 18, games: 295, itm: 42,  mushroom: 52,  masterScore: 0,    fishScore: 620, isMe: false },
			{ rank: 25, name: '输赢都微笑',   city: '宁波', points: 2074, tier: 'club',     tierLevel: 4, titles: 0, wins: 16, games: 312, itm: 40,  mushroom: 48,  masterScore: 0,    fishScore: 685, isMe: false },
			{ rank: 26, name: '摸鱼选手',     city: '上海', points: 1930, tier: 'club',     tierLevel: 4, titles: 0, wins: 14, games: 258, itm: 35,  mushroom: 42,  masterScore: 0,    fishScore: 740, isMe: false },
			{ rank: 27, name: '昨天刚学会',   city: '杭州', points: 1768, tier: 'diamond',  tierLevel: 1, titles: 0, wins: 12, games: 245, itm: 30,  mushroom: 36,  masterScore: 0,    fishScore: 820, isMe: false },
			{ rank: 28, name: '空气筹码',     city: '上海', points: 1602, tier: 'diamond',  tierLevel: 2, titles: 0, wins: 10, games: 230, itm: 26,  mushroom: 30,  masterScore: 0,    fishScore: 920, isMe: false }
		]
	},
	{
		id: 's2', label: 'S2 · 上季', name: 'S2 · 2026 夏季赛',
		status: '已结束', endsIn: '2026-08-31 收官', myNextPoints: 0,
		players: [
			{ rank: 1,  name: '深海老鲨',     city: '上海', points: 3885, tier: 'legend',   tierLevel: 1, titles: 6, wins: 55, games: 192, itm: 68, mushroom: 175, masterScore: 1880, fishScore: 90,  isMe: false },
			{ rank: 2,  name: 'GTO七号',      city: '上海', points: 3702, tier: 'crown',    tierLevel: 1, titles: 4, wins: 53, games: 198, itm: 72, mushroom: 162, masterScore: 1760, fishScore: 105, isMe: false },
			{ rank: 3,  name: '老K不浪',      city: '苏州', points: 3540, tier: 'crown',    tierLevel: 2, titles: 3, wins: 48, games: 185, itm: 60, mushroom: 148, masterScore: 1620, fishScore: 115, isMe: false },
			{ rank: 4,  name: '河圈艺术家',   city: '杭州', points: 3486, tier: 'spade',    tierLevel: 1, titles: 3, wins: 47, games: 178, itm: 56, mushroom: 140, masterScore: 1520, fishScore: 130, isMe: false },
			{ rank: 5,  name: '天黑请闭眼',   city: '上海', points: 3320, tier: 'spade',    tierLevel: 3, titles: 2, wins: 45, games: 200, itm: 62, mushroom: 132, masterScore: 1430, fishScore: 150, isMe: false },
			{ rank: 6,  name: '西装暴徒',     city: '南京', points: 3215, tier: 'spade',    tierLevel: 3, titles: 1, wins: 43, games: 212, itm: 60, mushroom: 125, masterScore: 1340, fishScore: 165, isMe: false },
			{ rank: 7,  name: '咖啡因选手',   city: '杭州', points: 3088, tier: 'heart',    tierLevel: 1, titles: 1, wins: 40, games: 188, itm: 52, mushroom: 115, masterScore: 0,    fishScore: 180, isMe: false },
			{ rank: 8,  name: '冷面下注',     city: '上海', points: 2995, tier: 'heart',    tierLevel: 2, titles: 1, wins: 38, games: 195, itm: 50, mushroom: 108, masterScore: 0,    fishScore: 200, isMe: false },
			{ rank: 9,  name: '短码刺客',     city: '苏州', points: 2902, tier: 'heart',    tierLevel: 2, titles: 0, wins: 36, games: 182, itm: 46, mushroom: 100, masterScore: 0,    fishScore: 220, isMe: false },
			{ rank: 10, name: '翻牌圈诗人',   city: '宁波', points: 2810, tier: 'heart',    tierLevel: 3, titles: 0, wins: 34, games: 205, itm: 52, mushroom: 95,  masterScore: 0,    fishScore: 250, isMe: false },
			{ rank: 11, name: '松凶小熊猫',   city: '杭州', points: 2724, tier: 'heart',    tierLevel: 3, titles: 0, wins: 32, games: 218, itm: 48, mushroom: 88,  masterScore: 0,    fishScore: 285, isMe: false },
			{ rank: 12, name: '低调的深筹',   city: '上海', points: 2540, tier: 'heart',    tierLevel: 4, titles: 0, wins: 30, games: 230, itm: 50, mushroom: 82,  masterScore: 0,    fishScore: 310, isMe: true  },
			{ rank: 13, name: '河底抽花侠',   city: '杭州', points: 2468, tier: 'club',     tierLevel: 1, titles: 0, wins: 28, games: 195, itm: 40, mushroom: 75,  masterScore: 0,    fishScore: 340, isMe: false },
			{ rank: 14, name: '波动率玩家',   city: '苏州', points: 2380, tier: 'club',     tierLevel: 1, titles: 0, wins: 27, games: 208, itm: 42, mushroom: 68,  masterScore: 0,    fishScore: 375, isMe: false },
			{ rank: 15, name: '紧凶橘猫',     city: '南京', points: 2295, tier: 'club',     tierLevel: 2, titles: 0, wins: 25, games: 220, itm: 38, mushroom: 62,  masterScore: 0,    fishScore: 410, isMe: false },
			{ rank: 16, name: '盲注收割机',   city: '上海', points: 2208, tier: 'club',     tierLevel: 2, titles: 0, wins: 23, games: 235, itm: 40, mushroom: 56,  masterScore: 0,    fishScore: 450, isMe: false },
			{ rank: 17, name: '平跟之王',     city: '上海', points: 2110, tier: 'club',     tierLevel: 3, titles: 0, wins: 22, games: 248, itm: 42, mushroom: 50,  masterScore: 0,    fishScore: 490, isMe: false },
			{ rank: 18, name: '周末战士',     city: '杭州', points: 2024, tier: 'club',     tierLevel: 3, titles: 0, wins: 20, games: 262, itm: 38, mushroom: 45,  masterScore: 0,    fishScore: 530, isMe: false },
			{ rank: 19, name: '睡不醒的A',    city: '上海', points: 1866, tier: 'club',     tierLevel: 4, titles: 0, wins: 18, games: 275, itm: 35, mushroom: 40,  masterScore: 0,    fishScore: 580, isMe: false },
			{ rank: 20, name: '柠檬味筹码',   city: '上海', points: 1742, tier: 'diamond',  tierLevel: 1, titles: 0, wins: 16, games: 240, itm: 28, mushroom: 35,  masterScore: 0,    fishScore: 650, isMe: false }
		]
	},
	{
		id: 's1', label: 'S1 · 元季', name: 'S1 · 2026 春季赛',
		status: '已结束', endsIn: '2026-05-31 收官', myNextPoints: 0,
		players: [
			{ rank: 1,  name: '西装暴徒',     city: '南京', points: 3120, tier: 'legend',   tierLevel: 1, titles: 5, wins: 50, games: 175, itm: 60, mushroom: 125, masterScore: 1480, fishScore: 95,  isMe: false },
			{ rank: 2,  name: '深海老鲨',     city: '上海', points: 2955, tier: 'crown',    tierLevel: 1, titles: 3, wins: 46, games: 168, itm: 55, mushroom: 110, masterScore: 1380, fishScore: 110, isMe: false },
			{ rank: 3,  name: '老K不浪',      city: '苏州', points: 2801, tier: 'crown',    tierLevel: 2, titles: 2, wins: 44, games: 162, itm: 52, mushroom: 98,  masterScore: 1280, fishScore: 120, isMe: false },
			{ rank: 4,  name: '冷面下注',     city: '上海', points: 2688, tier: 'spade',    tierLevel: 2, titles: 1, wins: 41, games: 158, itm: 46, mushroom: 86,  masterScore: 1180, fishScore: 135, isMe: false },
			{ rank: 5,  name: '天黑请闭眼',   city: '上海', points: 2572, tier: 'spade',    tierLevel: 4, titles: 1, wins: 39, games: 175, itm: 48, mushroom: 80,  masterScore: 1080, fishScore: 150, isMe: false },
			{ rank: 6,  name: 'GTO七号',      city: '上海', points: 2450, tier: 'heart',    tierLevel: 1, titles: 1, wins: 37, games: 165, itm: 40, mushroom: 72,  masterScore: 0,    fishScore: 170, isMe: false },
			{ rank: 7,  name: '平跟之王',     city: '上海', points: 2330, tier: 'heart',    tierLevel: 2, titles: 0, wins: 35, games: 180, itm: 42, mushroom: 65,  masterScore: 0,    fishScore: 195, isMe: false },
			{ rank: 8,  name: '河底抽花侠',   city: '杭州', points: 2215, tier: 'heart',    tierLevel: 2, titles: 0, wins: 33, games: 188, itm: 40, mushroom: 58,  masterScore: 0,    fishScore: 220, isMe: false },
			{ rank: 9,  name: '咖啡因选手',   city: '杭州', points: 2098, tier: 'heart',    tierLevel: 3, titles: 0, wins: 31, games: 195, itm: 42, mushroom: 52,  masterScore: 0,    fishScore: 250, isMe: false },
			{ rank: 10, name: '紧凶橘猫',     city: '南京', points: 1980, tier: 'heart',    tierLevel: 4, titles: 0, wins: 29, games: 205, itm: 38, mushroom: 48,  masterScore: 0,    fishScore: 285, isMe: false },
			{ rank: 11, name: '翻牌圈诗人',   city: '宁波', points: 1862, tier: 'club',     tierLevel: 1, titles: 0, wins: 27, games: 175, itm: 32, mushroom: 42,  masterScore: 0,    fishScore: 320, isMe: false },
			{ rank: 12, name: '盲注收割机',   city: '上海', points: 1745, tier: 'club',     tierLevel: 2, titles: 0, wins: 25, games: 190, itm: 35, mushroom: 38,  masterScore: 0,    fishScore: 360, isMe: false },
			{ rank: 13, name: '低调的深筹',   city: '上海', points: 1520, tier: 'diamond',  tierLevel: 1, titles: 0, wins: 22, games: 165, itm: 26, mushroom: 32,  masterScore: 0,    fishScore: 410, isMe: true  },
			{ rank: 14, name: '周末战士',     city: '杭州', points: 1388, tier: 'diamond',  tierLevel: 2, titles: 0, wins: 20, games: 180, itm: 28, mushroom: 28,  masterScore: 0,    fishScore: 460, isMe: false },
			{ rank: 15, name: '昨天刚学会',   city: '杭州', points: 1150, tier: 'diamond',  tierLevel: 3, titles: 0, wins: 18, games: 195, itm: 25, mushroom: 24,  masterScore: 0,    fishScore: 520, isMe: false }
		]
	}
]