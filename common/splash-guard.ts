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
 * 播放结束后回到入口页（在排行榜刷新 → 播完仍回排行榜），拿不到入口页时回广场。
 */

/** 兜底落地页：没有可用入口时回广场 */
export const SPLASH_FALLBACK_URL : string = '/pages/plaza/plaza'

/** 必须由上一步带参跳入、不适合单独作为落地页的页面 → 播完兜底回广场 */
const NO_RETURN_PAGES : string[] = [
	'pages/location-picker/location-picker'
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

/** splash 播放结束后调用：回到入口页；入口未知或不该落地时回广场 */
export function splashReturnUrl () : string {
	const route : string = routeOf(entry)
	if (route.length == 0) { return SPLASH_FALLBACK_URL }
	if (route == 'pages/splash/splash') { return SPLASH_FALLBACK_URL }
	const len : number = NO_RETURN_PAGES.length
	for (let i : number = 0; i < len; i++) {
		if (route == NO_RETURN_PAGES[i]) { return SPLASH_FALLBACK_URL }
	}
	return entry.indexOf('/') == 0 ? entry : '/' + entry
}
