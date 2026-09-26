import type { StoreInfo, GameItem } from './types'

export type { StoreInfo, GameItem } from './types'

// 门店按城市顺序排列，同城门店相邻
export const MOCK_STORES : StoreInfo[] = [
	{ id: 's1', name: '上海外滩旗舰店', abbr: '外滩', branchName: '外滩旗舰店', shortName: '上海', city: '上海', province: '上海市', district: '黄浦区', address: '黄浦区中山东一路 18 号', distance: '1.2 km', x: 79.05, y: 46.17, openGames: 5 },
	{ id: 's2', name: '上海陆家嘴店', abbr: '陆家嘴', branchName: '陆家嘴店', shortName: '上海', city: '上海', province: '上海市', district: '浦东新区', address: '浦东新区世纪大道 8 号', distance: '4.6 km', x: 79.36, y: 46.21, openGames: 3 },
	{ id: 's3', name: '上海静安寺店', abbr: '静安寺', branchName: '静安寺店', shortName: '上海', city: '上海', province: '上海市', district: '静安区', address: '静安区南京西路 1618 号', distance: '6.8 km', x: 78.21, y: 46.54, openGames: 3 },
	{ id: 's4', name: '苏州金鸡湖店', abbr: '金鸡湖', branchName: '金鸡湖店', shortName: '苏州', city: '苏州', province: '江苏省', district: '工业园区', address: '工业园区星港街 1 号', distance: '78 km', x: 63.73, y: 44.42, openGames: 4 },
	{ id: 's5', name: '苏州观前街店', abbr: '观前街', branchName: '观前街店', shortName: '苏州', city: '苏州', province: '江苏省', district: '姑苏区', address: '姑苏区观前街 128 号', distance: '82 km', x: 62.62, y: 44.54, openGames: 3 },
	{ id: 's6', name: '杭州西湖店', abbr: '西湖', branchName: '西湖店', shortName: '杭州', city: '杭州', province: '浙江省', district: '西湖区', address: '西湖区延安路 288 号', distance: '165 km', x: 53.84, y: 68.90, openGames: 4 },
	{ id: 's7', name: '杭州钱江新城店', abbr: '钱江', branchName: '钱江新城店', shortName: '杭州', city: '杭州', province: '浙江省', district: '上城区', address: '上城区富春路 701 号', distance: '171 km', x: 54.92, y: 69.16, openGames: 3 },
	{ id: 's8', name: '南京新街口店', abbr: '新街口', branchName: '新街口店', shortName: '南京', city: '南京', province: '江苏省', district: '秦淮区', address: '秦淮区中山南路 1 号', distance: '268 km', x: 28.00, y: 27.38, openGames: 3 },
	{ id: 's9', name: '宁波三江口店', abbr: '三江口', branchName: '三江口店', shortName: '宁波', city: '宁波', province: '浙江省', district: '海曙区', address: '海曙区中山东路 168 号', distance: '210 km', x: 80.19, y: 77.76, openGames: 2 }
]

export const MOCK_GAMES : GameItem[] = [
	// ---- 上海 · 外滩旗舰店 (5) ----
	{ id: 'g1',  storeId: 's1', storeName: '上海外滩旗舰店',   city: '上海', title: '深筹争霸赛 · 周三例行',    players: 18, maxPlayers: 27, startChips: 20000, level: 'Lv.6 400/800',  status: '进行中',   startTime: '今晚 20:00',     buyIn: 500  },
	{ id: 'g2',  storeId: 's1', storeName: '上海外滩旗舰店',   city: '上海', title: '新手友好常规桌',          players: 9,  maxPlayers: 9,  startChips: 10000, level: 'Lv.3 200/400',  status: '已满员',   startTime: '今晚 19:30',     buyIn: 200  },
	{ id: 'g3',  storeId: 's1', storeName: '上海外滩旗舰店',   city: '上海', title: '高额猎人赛 · 8-Max',      players: 12, maxPlayers: 24, startChips: 50000, level: 'Lv.8 1k/2k',    status: '报名中',   startTime: '今晚 21:00',     buyIn: 2000 },
	{ id: 'g4',  storeId: 's1', storeName: '上海外滩旗舰店',   city: '上海', title: '周三底池限注赛',          players: 6,  maxPlayers: 18, startChips: 15000, level: 'Lv.4 300/600',  status: '报名中',   startTime: '今晚 20:30',     buyIn: 300  },
	{ id: 'g5',  storeId: 's1', storeName: '上海外滩旗舰店',   city: '上海', title: '怪兽堆 · Mystery Bounty', players: 14, maxPlayers: 36, startChips: 25000, level: 'Lv.5 500/1k',   status: '进行中',   startTime: '今晚 19:00',     buyIn: 600  },

	// ---- 上海 · 陆家嘴店 (3) ----
	{ id: 'g6',  storeId: 's2', storeName: '上海陆家嘴店',     city: '上海', title: '女神之夜 · 女性专享',     players: 11, maxPlayers: 18, startChips: 12000, level: 'Lv.4 300/600',  status: '即将开始', startTime: '今晚 19:45',     buyIn: 250  },
	{ id: 'g7',  storeId: 's2', storeName: '上海陆家嘴店',     city: '上海', title: '现金桌 · 1/3 NLH',        players: 7,  maxPlayers: 9,  startChips: 8000,  level: '现金桌',         status: '进行中',   startTime: '随时开局',       buyIn: 0    },
	{ id: 'g8',  storeId: 's2', storeName: '上海陆家嘴店',     city: '上海', title: '周日重头戏',              players: 22, maxPlayers: 27, startChips: 30000, level: 'Lv.7 600/1.2k', status: '进行中',   startTime: '今晚 20:15',     buyIn: 800  },

	// ---- 上海 · 静安寺店 (3) ----
	{ id: 'g9',  storeId: 's3', storeName: '上海静安寺店',     city: '上海', title: '热身 6-Max 快速赛',        players: 16, maxPlayers: 18, startChips: 10000, level: 'Lv.3 200/400',  status: '即将开始', startTime: '今晚 19:00',     buyIn: 150  },
	{ id: 'g10', storeId: 's3', storeName: '上海静安寺店',     city: '上海', title: '赏金赛 · Bounty Hunter',   players: 19, maxPlayers: 30, startChips: 18000, level: 'Lv.5 500/1k',   status: '进行中',   startTime: '今晚 20:00',     buyIn: 400  },
	{ id: 'g11', storeId: 's3', storeName: '上海静安寺店',     city: '上海', title: '大师赛资格赛 · 门票赛',    players: 24, maxPlayers: 27, startChips: 25000, level: 'Lv.6 400/800',  status: '进行中',   startTime: '今晚 20:45',     buyIn: 1200 },

	// ---- 苏州 · 金鸡湖店 (4) ----
	{ id: 'g12', storeId: 's4', storeName: '苏州金鸡湖店',     city: '苏州', title: '深码 PK 桌',              players: 8,  maxPlayers: 9,  startChips: 40000, level: 'Lv.9 1.5k/3k',  status: '进行中',   startTime: '今晚 20:00',     buyIn: 1500 },
	{ id: 'g13', storeId: 's4', storeName: '苏州金鸡湖店',     city: '苏州', title: '卫星赛 · 赢门票',          players: 30, maxPlayers: 45, startChips: 5000,  level: 'Lv.2 100/200',  status: '报名中',   startTime: '今晚 21:30',     buyIn: 80   },
	{ id: 'g14', storeId: 's4', storeName: '苏州金鸡湖店',     city: '苏州', title: 'Turbo 涡轮赛',            players: 9,  maxPlayers: 18, startChips: 10000, level: 'Lv.3 200/400',  status: '即将开始', startTime: '今晚 19:30',     buyIn: 150  },
	{ id: 'g15', storeId: 's4', storeName: '苏州金鸡湖店',     city: '苏州', title: '幸运 7 短牌',             players: 15, maxPlayers: 24, startChips: 12000, level: 'Lv.4 300/600',  status: '进行中',   startTime: '今晚 20:30',     buyIn: 300  },

	// ---- 苏州 · 观前街店 (3) ----
	{ id: 'g16', storeId: 's5', storeName: '苏州观前街店',     city: '苏州', title: '周末明星赛',              players: 27, maxPlayers: 27, startChips: 30000, level: 'Lv.7 600/1.2k', status: '已满员',   startTime: '今晚 21:00',     buyIn: 1000 },
	{ id: 'g17', storeId: 's5', storeName: '苏州观前街店',     city: '苏州', title: '超级月亮扑克夜',          players: 13, maxPlayers: 27, startChips: 20000, level: 'Lv.5 500/1k',   status: '报名中',   startTime: '今晚 20:30',     buyIn: 500  },
	{ id: 'g18', storeId: 's5', storeName: '苏州观前街店',     city: '苏州', title: '现金桌 · 2/5 NLH',        players: 9,  maxPlayers: 9,  startChips: 10000, level: '现金桌',         status: '进行中',   startTime: '随时开局',       buyIn: 0    },

	// ---- 杭州 · 西湖店 (4) ----
	{ id: 'g19', storeId: 's6', storeName: '杭州西湖店',       city: '杭州', title: '情侣双打挑战赛',          players: 4,  maxPlayers: 16, startChips: 10000, level: 'Lv.3 200/400',  status: '报名中',   startTime: '今晚 20:00',     buyIn: 200  },
	{ id: 'g20', storeId: 's6', storeName: '杭州西湖店',       city: '杭州', title: 'OML · 奥马哈狂热',        players: 10, maxPlayers: 18, startChips: 15000, level: 'Lv.4 300/600',  status: '进行中',   startTime: '今晚 20:00',     buyIn: 350  },
	{ id: 'g21', storeId: 's6', storeName: '杭州西湖店',       city: '杭州', title: '招牌深码 10/25',          players: 5,  maxPlayers: 9,  startChips: 80000, level: 'Lv.10 2k/4k',   status: '进行中',   startTime: '随时开局',       buyIn: 0    },
	{ id: 'g22', storeId: 's6', storeName: '杭州西湖店',       city: '杭州', title: '黄金时段常规赛',          players: 20, maxPlayers: 27, startChips: 15000, level: 'Lv.5 500/1k',   status: '进行中',   startTime: '今晚 20:00',     buyIn: 300  },

	// ---- 杭州 · 钱江新城店 (3) ----
	{ id: 'g23', storeId: 's7', storeName: '杭州钱江新城店',   city: '杭州', title: '钱塘夜战 · 深筹赛',        players: 20, maxPlayers: 27, startChips: 25000, level: 'Lv.6 400/800',  status: '进行中',   startTime: '今晚 20:30',     buyIn: 500  },
	{ id: 'g24', storeId: 's7', storeName: '杭州钱江新城店',   city: '杭州', title: '晚高峰快速赛',            players: 12, maxPlayers: 18, startChips: 10000, level: 'Lv.3 200/400',  status: '即将开始', startTime: '今晚 19:15',     buyIn: 150  },
	{ id: 'g25', storeId: 's7', storeName: '杭州钱江新城店',   city: '杭州', title: '凌晨 3 点深码',           players: 6,  maxPlayers: 18, startChips: 30000, level: 'Lv.6 400/800',  status: '即将开始', startTime: '次日凌晨 03:00', buyIn: 600  },

	// ---- 南京 · 新街口店 (3) ----
	{ id: 'g26', storeId: 's8', storeName: '南京新街口店',     city: '南京', title: '学生友好 · 低买入门',      players: 27, maxPlayers: 36, startChips: 8000,  level: 'Lv.2 100/200',  status: '报名中',   startTime: '今晚 19:30',     buyIn: 80   },
	{ id: 'g27', storeId: 's8', storeName: '南京新街口店',     city: '南京', title: '金陵杯 · 月度主赛 D1',     players: 15, maxPlayers: 30, startChips: 30000, level: 'Lv.5 500/1k',   status: '进行中',   startTime: '今晚 20:00',     buyIn: 800  },
	{ id: 'g28', storeId: 's8', storeName: '南京新街口店',     city: '南京', title: '现金桌 · 5/10 NLH',       players: 6,  maxPlayers: 9,  startChips: 20000, level: '现金桌',         status: '进行中',   startTime: '随时开局',       buyIn: 0    },

	// ---- 宁波 · 三江口店 (2) ----
	{ id: 'g29', storeId: 's9', storeName: '宁波三江口店',     city: '宁波', title: '甬城夜赛 · 6-Max',        players: 11, maxPlayers: 18, startChips: 15000, level: 'Lv.4 300/600',  status: '进行中',   startTime: '今晚 20:30',     buyIn: 300  },
	{ id: 'g30', storeId: 's9', storeName: '宁波三江口店',     city: '宁波', title: '新手体验局',              players: 8,  maxPlayers: 9,  startChips: 5000,  level: 'Lv.1 50/100',   status: '即将开始', startTime: '今晚 19:00',     buyIn: 50   }
]