/**
 * uni-app x 全局类型补充声明。
 *
 * uni-app x 由 HBuilderX 编译器注入这些全局能力，npm 上的 @dcloudio/types
 * 只覆盖了 uni API 与 PageInstance 成员，并未提供下面这些全局生命周期函数
 * 和 uni-app x 专有的事件类型，因此在此手动补齐，供 Volar / TS 校验使用。
 */

/* ---------------- 页面生命周期（全局函数形式） ---------------- */

/** 监听页面加载，回调参数为页面路由参数 */
declare function onLoad(callback : (query ?: Record<string, string | undefined>) => void) : void

/** 监听页面显示 */
declare function onShow(callback : () => void) : void

/** 监听页面隐藏 */
declare function onHide(callback : () => void) : void

/** 监听页面卸载 */
declare function onUnload(callback : () => void) : void

/** 监听用户下拉动作 */
declare function onPullDownRefresh(callback : () => void) : void

/** 监听页面触底 */
declare function onReachBottom(callback : () => void) : void

/** 监听页面滚动 */
declare function onPageScroll(callback : (options : { scrollTop : number }) => void) : void

/* ---------------- App 生命周期（全局函数形式，uni-app x 编译器注入） ---------------- */

/** App 启动，回调参数为启动选项 */
declare function onLaunch(callback : (options ?: Record<string, any>) => void) : void

/** App 进入前台 */
declare function onAppShow(callback : (options ?: Record<string, any>) => void) : void

/** App 进入后台 */
declare function onAppHide(callback : () => void) : void

/** Android 实体返回键：最后一个页面再按返回时触发 */
declare function onLastPageBackPress(callback : (event ?: { from : string }) => void) : void

/** App 退出前触发 */
declare function onExit(callback : () => void) : void

/* ---------------- uni API 补充（uni-app x 专有，@dcloudio/types 未覆盖） ---------------- */

/* @dcloudio/types 中 uni 的类型链为：declare const uni: UniNamespace.Uni
   → namespace 内 type Uni = UniInterface → 全局 type UniInterface = Uni
   → 全局 interface Uni（真正的成员所在）。
   因此这里在全局作用域合并 interface Uni，为 uni.exit 补充声明。 */
interface Uni {
	/**
	 * 退出应用（仅 Android App 生效，鸿蒙会结束当前 Ability）。
	 * 文档：https://doc.dcloud.net.cn/uni-app-x/api/exit.html
	 */
	exit(options ?: { success ?: () => void, fail ?: () => void, complete ?: () => void }) : void
}

/* ---------------- 事件类型 ---------------- */

/** 屏幕触点信息 */
type UniTouch = {
	identifier : number
	pageX : number
	pageY : number
	clientX : number
	clientY : number
	screenX : number
	screenY : number
}

/** 原生事件基类字段 */
type UniEventBase = {
	type : string
	timeStamp : number
	target : any
	currentTarget : any
	detail : any
}

/** uni-app x 触摸事件（touchstart / touchmove / touchend / touchcancel） */
type UniTouchEvent = UniEventBase & {
	touches : UniTouch[]
	changedTouches : UniTouch[]
}

/** uni-app x 通用事件 */
type UniEvent = UniEventBase
