/**
 * 全局 splash 中间件（在 App.vue 的 onLaunch 中调用一次即可，业务页面无需接入）。
 *
 * 判定口径是"这次启动是不是用户自己进来 / 刷新的"，而不是"以前看过没看过"：
 *   - 整包重载（App 冷启动、H5 刷新、H5 直链分享）会重新走一次 App.onLaunch → 播一遍 splash
 *   - 程序内部跳转（navigateTo / redirectTo / reLaunch / navigateBack）复用同一个运行时，
 *     不会再触发 onLaunch → 不会重播
 *
 * 所以这里不写 storage 标记，只用运行时内存记住"入口页"：
 * 内存随整包重载而清空，语义正好等于"每次重载都播一次，内部跳转不播"。
 *
 * 播放结束后由 splashGoNext() 落地：tab 主页直接回入口页；二级页先落主页（广场）
 * 再把入口页压栈，保证刷新后原生返回键可回主页；拿不到入口页时回广场。
 */

/** 兜底落地页：没有可用入口时回广场 */
export const SPLASH_FALLBACK_URL : string = '/pages/plaza/plaza'

/** 必须由上一步带参跳入、不适合单独作为落地页的页面 → 播完兜底回广场 */
const NO_RETURN_PAGES : string[] = [
	'pages/location-picker/location-picker'
]

/** tab 主页路由：这些页本身就是主页，直接落地即可 */
const TAB_ROUTES : string[] = [
	'pages/plaza/plaza',
	'pages/jiude/jiude',
	'pages/rank/rank',
	'pages/record/record',
	'pages/mine/mine'
]

/** 本次启动的入口页（运行时内存，整包重载才会重置），形如 'pages/rank/rank?tab=1' */
let entry : string = ''

/**
 * 读取本次启动的入口页；'' 表示拿不到（按"默认首页"处理）。
 * H5 优先取 location.hash：刷新时它保存着用户刷新前所在的那一页，且自带 query。
 */
function readEntry () : string {
	// #ifdef H5
	try {
		const hash : string = window.location.hash
		if (hash.length > 1) { return hash.substring(1) }
	} catch (e) {
		// 极端情况下取不到 window → 落到下面的 launchOptions 兜底
	}
	// #endif

	const path = uni.getLaunchOptionsSync().path
	if (path == null) { return '' }
	return path.toString()
}

/** 从入口串里取出纯页面路径（去 query、去前导斜杠）；'' 表示没有有效路径 */
function routeOf (entryStr : string) : string {
	let p : string = entryStr.trim()
	const q : number = p.indexOf('?')
	if (q >= 0) { p = p.substring(0, q) }
	if (p == '/') { return '' }
	return p.indexOf('/') == 0 ? p.substring(1) : p
}

/** 入口串拼回可跳转的完整地址（补前导斜杠、保留 query） */
function fullUrlOf (entryStr : string) : string {
	const route : string = routeOf(entryStr)
	if (route.length == 0) { return SPLASH_FALLBACK_URL }
	const q : number = entryStr.indexOf('?')
	const query : string = q >= 0 ? entryStr.substring(q) : ''
	return '/' + route + query
}

/**
 * 检查本次启动是否需要先展示 splash：入口页不是 splash 时重定向过去。
 * 入口页本就是 splash（App 冷启动的默认首页、在 splash 上刷新、hash 只有 '/'）时
 * 不做任何事，交给 splash.vue 自己播放，避免重复加载。
 */
export function redirectSplashIfNeeded () : void {
	const raw : string = readEntry()
	if (raw.length == 0) { return }
	const route : string = routeOf(raw)
	if (route.length == 0) { return }
	entry = raw
	if (route == 'pages/splash/splash') { return }
	uni.reLaunch({ url: '/pages/splash/splash' })
}

/**
 * splash 播放结束后的落地动作：
 *  - tab 主页 / 入口未知 / 必须带参跳入的页面：直接 reLaunch 落地（原行为）
 *  - 其余二级页面：先 reLaunch 到主页（广场），再 navigateTo 入口页，
 *    让页面栈变成 [主页, 二级页] —— 修复 H5 刷新二级页后原生返回键消失、
 *    回不到主页的问题（刷新 → reLaunch 单页落地时栈里只有它自己，无页可回）。
 *  - 未登录时 reLaunch(广场) 会被 auth-guard 拦截转去登录页，与原先行为一致。
 */
export function splashGoNext () : void {
	const route : string = routeOf(entry)
	// 入口未知或入口就是 splash：回兜底主页
	if (route.length == 0 || route == 'pages/splash/splash') {
		uni.reLaunch({ url: SPLASH_FALLBACK_URL })
		return
	}
	// 必须由上一步带参跳入的页面：不适合单独落地，回兜底主页
	const nl : number = NO_RETURN_PAGES.length
	for (let i : number = 0; i < nl; i++) {
		if (route == NO_RETURN_PAGES[i]) {
			uni.reLaunch({ url: SPLASH_FALLBACK_URL })
			return
		}
	}
	// tab 主页：直接落地（保留原 query）
	if (TAB_ROUTES.indexOf(route) >= 0) {
		uni.reLaunch({ url: fullUrlOf(entry) })
		return
	}
	// 二级页面：先落主页，再把入口页压栈，保证返回键可回主页
	uni.reLaunch({
		url: SPLASH_FALLBACK_URL,
		success: () => {
			uni.navigateTo({ url: fullUrlOf(entry) })
		}
	})
}
