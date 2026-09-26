/**
 * 全局路由守卫：未登录强制跳登录页
 *
 * 原理：拦截 uni.navigateTo / redirectTo / reLaunch / switchTab 四个导航 API。
 *  - 目标页在白名单内（splash / 登录 / 协议页）→ 放行
 *  - 未登录访问受保护页 → 阻断本次跳转，reLaunch 到登录页
 *
 * 接入点：App.vue onLaunch 中调用一次 installAuthGuard()（必须在 redirectSplashIfNeeded 之前）。
 * 冷启动 / H5 刷新 / H5 直链的落地链路是 splash → reLaunch(入口页)，
 * 入口页受保护且未登录时会被这里接管到登录页，业务页面无需任何接入。
 */
import { getLoginResult } from './user-api'

/** 登录页地址（守卫与登录跳转统一从这里取） */
export const LOGIN_URL : string = '/pages/login/login'

/** 无需登录即可访问的页面（去 query、不带前导斜杠的路径） */
const WHITE_ROUTES : string[] = [
	'pages/splash/splash',
	'pages/login/login',
	'pages/agreement/agreement-service',
	'pages/agreement/agreement-privacy'
]

/** 是否已登录：login_result 里存过任意内容即视为已登录 */
export const isLoggedIn = () : boolean => {
	return getLoginResult() != null
}

/** 取 url 的纯路径：去 query、统一去掉前导斜杠，便于与白名单比对 */
const routeOf = (url : string) : string => {
	let p : string = (url || '').trim()
	const q : number = p.indexOf('?')
	if (q >= 0) { p = p.substring(0, q) }
	if (p.length > 0 && p.charAt(0) == '/') { p = p.substring(1) }
	return p
}

/** 目标页是否在免登录白名单内 */
const isWhiteUrl = (url : string) : boolean => {
	const route : string = routeOf(url)
	const len : number = WHITE_ROUTES.length
	for (let i : number = 0; i < len; i++) {
		if (route == WHITE_ROUTES[i]) { return true }
	}
	return false
}

let installed : boolean = false

/** 安装导航拦截器；onLaunch 里调一次即可，重复调用被忽略 */
export function installAuthGuard () : void {
	if (installed) { return }
	installed = true

	const apis : ('navigateTo' | 'redirectTo' | 'reLaunch' | 'switchTab')[] = [
		'navigateTo', 'redirectTo', 'reLaunch', 'switchTab'
	]
	for (let i : number = 0; i < apis.length; i++) {
		uni.addInterceptor(apis[i], {
			invoke: (args : any) => {
				const url : string = (args && args.url ? args.url : '').toString()
				// 白名单页放行（登录页自身跳转也走这里，不会死循环）
				if (isWhiteUrl(url)) { return args }
				// 已登录放行
				if (isLoggedIn()) { return args }
				// 未登录：阻断本次跳转，转去登录页
				uni.reLaunch({ url: LOGIN_URL })
				return false
			}
		})
	}
}
