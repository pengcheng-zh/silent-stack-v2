import type { MapLabel } from './types'

export type { MapLabel } from './types'

// 长三角区域内的省份标识（位置与 china-map.svg 投影一致）
export const PROVINCE_LABELS : MapLabel[] = [
	{ name: '安徽省', x: 12.83, y: 20.61 },
	{ name: '江苏省', x: 39.25, y: 6.42 },
	{ name: '浙江省', x: 60.75, y: 87.26 }
]

// 非门店的城市点位（仅作地理参照）
export const REFERENCE_CITIES : MapLabel[] = [
	{ name: '常州', x: 50.45, y: 32.80 },
	{ name: '南通', x: 67.82, y: 28.84 },
	{ name: '嘉兴', x: 65.20, y: 57.64 },
	{ name: '湖州', x: 52.58, y: 54.21 },
	{ name: '金华', x: 44.33, y: 95.97 },
	{ name: '黄山', x: 19.58, y: 81.43 }
]

// 有门店的城市聚合点：一个城市只落一个标记，角标显示门店数
export const CITY_POINTS : MapLabel[] = [
	{ name: '上海', x: 78.75, y: 46.39 },
	{ name: '苏州', x: 61.99, y: 44.79 },
	{ name: '杭州', x: 53.87, y: 68.56 },
	{ name: '南京', x: 28.24, y: 26.96 },
	{ name: '宁波', x: 80.18, y: 77.90 }
]