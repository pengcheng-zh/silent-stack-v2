/* ---------------- 荣誉管理（后台 CRUD 数据源） ---------------- */
// 荣誉 = 排行榜行的"背景板"素材：长条图（5:1）+ 名称
// 背景板两种来源：预置 SVG 模板 / 用户从相册上传（临时路径）

export type AdminHonorRow = {
	id : string
	name : string
	image : string        // 长条背景板路径：/static/honor-bg/*.svg 或相册临时路径
}

/* ---------------- 预置背景板模板 ---------------- */
// 金/银/铜对应榜单前三名，传奇紫用于特殊成就（蘑菇王 / 摸鱼王等）
export type HonorBgPreset = {
	key : string
	label : string
	image : string
}

export const HONOR_BG_PRESETS : HonorBgPreset[] = [
	{ key: 'gold',   label: '金色 · 冠军', image: '/static/honor-bg/honor-gold.svg' },
	{ key: 'silver', label: '银色 · 亚军', image: '/static/honor-bg/honor-silver.svg' },
	{ key: 'bronze', label: '铜色 · 季军', image: '/static/honor-bg/honor-bronze.svg' },
	{ key: 'legend', label: '紫色 · 传奇', image: '/static/honor-bg/honor-legend.svg' }
]

// 由图片路径反查预置模板（相册上传的临时路径查不到 → null）
export const presetOf = (image : string) : HonorBgPreset | null => {
	const len : number = HONOR_BG_PRESETS.length
	for (let i : number = 0; i < len; i++) {
		if (HONOR_BG_PRESETS[i].image == image) { return HONOR_BG_PRESETS[i] }
	}
	return null
}
