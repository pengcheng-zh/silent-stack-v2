/**
 * 用户 / 登录模块接口
 *
 * 后端契约：
 *   POST /sms/login              { phone }                        发送登录验证码
 *   POST /user/login-by-phone    { phone, code }                  验证码登录
 *   POST /user/login-by-password { phone, password }              密码登录
 */
import { httpGet, httpPost } from './http'

/* ---------------- 响应模型 ---------------- */
// 登录成功返回（与后端字段一一对应）：
//   id / username / avatar / authToken / roleId / phone / expireTime
export type LoginResult = {
	id : string
	userNo: string
	username : string
	avatar : string
	authToken : string
	roleId : number
	phone : string
	expireTime : string
}

/* ---------------- 接口 ---------------- */

/** 发送登录短信验证码 */
export const sendLoginSms = (phone : string) : Promise<any> => {
	return httpPost('/sms/login', { phone: phone })
}

/** 验证码登录 */
export const loginByPhone = (phone : string, code : string) : Promise<LoginResult> => {
	return httpPost('/user/login-by-phone', { phone: phone, code: code })
}

/** 密码登录 */
export const loginByPassword = (phone : string, password : string) : Promise<LoginResult> => {
	return httpPost('/user/login-by-password', { phone: phone, password: password })
}

/** 修改密码（不需要原密码） */
export const updatePassword = (password : string) : Promise<any> => {
	return httpPost('/user/update-password', { password: password })
}

/** 更新用户资料（当前先用于改昵称；后续扩头像等字段直接加参数即可） */
export const updateProfile = (patch : { username ?: string; avatar ?: string }) : Promise<any> => {
	return httpPost('/user/profile-update', patch)
}

/* ---------------- 我的信息（GET /user/info，与后端 CustomerVO 字段一一对应） ---------------- */
export type UserBalanceVO = {
	userId : number
	storeId : number
	storeName : string
	storeType : string
	balance : number
	ticket : number
	monthTicket : number
	points : number
	amount : number
	totalAmount : number
	comboA : number
	comboB : number
	comboC : number
}

export type CustomerVO = {
	id : number
	username : string
	userNo : string
	avatar : string
	phone : string
	roleId : number
	stealth : string          // Y/N 是否隐身
	honorImage : string
	joinMatchCount : number
	rankingScore : number
	winnerCount : number
	enterFinalCount : number
	winnerRate : number
	promoter : boolean        // 是否是促销员
	openXPay : boolean
	balanceList : UserBalanceVO[]
	levelName : string
	levelImage : string
	monthTicket : number
	inviteCard : number
	createTime : string
}

/** 我的信息：GET /user/info */
export const fetchMyInfo = () : Promise<CustomerVO> => {
	return httpGet<CustomerVO>('/user/info').then((r : any) => {
		return (r && r.data ? r.data : r) as CustomerVO
	})
}

/** 设置隐身模式：POST /user/stealth（无请求体，由后端切换状态） */
export const setStealth = () : Promise<any> => {
	return httpPost('/user/stealth')
}

export type UserListRow = {
	id : number | string
	userNo : string
	username : string
}

/* ---------------- 用户列表（店长 / 管理员选人弹层用） ---------------- */
export type UserSimpleListRow = {
	id : number | string
	userNo : string
	username : string
}

/** 用户列表：GET /user/list?keyword=xxx（keyword 可选） */
export const fetchUserList = (keyword : string) : Promise<UserListRow[]> => {
	const params : Record<string, any> = { limit: 50 }
	const kw : string = keyword.trim()
	if (kw.length > 0) { params.keyword = kw }
	return httpGet<any>('/user/list', params).then((r : any) => {
		// 兼容数组 / { list } / { records } / { data } 几种返回形态
		const arr : any = Array.isArray(r) ? r : (r && (r.list || r.records || r.data)) || []
		const out : UserListRow[] = []
		for (let i = 0; i < arr.length; i++) {
			const it = arr[i]
			out.push({
				id: it.id,
				userNo: (it.userNo ?? '').toString(),
				username: (it.username ?? it.name ?? '').toString()
			})
		}
		return out
	})
}

export const fetchSimpleUserList = (keyword : string) : Promise<UserSimpleListRow[]> => {
	const params : Record<string, any> = { limit: 50 }
	const kw : string = keyword.trim()
	if (kw.length > 0) { params.keyword = kw }
	return httpGet<any>('/user/simple-list', params).then((r : any) => {
		// 兼容数组 / { list } / { records } / { data } 几种返回形态
		const arr : any = Array.isArray(r) ? r : (r && (r.list || r.records || r.data)) || []
		const out : UserSimpleListRow[] = []
		for (let i = 0; i < arr.length; i++) {
			const it = arr[i]
			out.push({
				id: it.id,
				userNo: (it.userNo ?? '').toString(),
				username: (it.username ?? it.name ?? '').toString()
			})
		}
		return out
	})
}

/* ---------------- 后台用户列表（管理员页用，CustomerVO 全量字段） ---------------- */
export type AdminUserPage = {
	list : CustomerVO[]
	total : number          // 命中总数（无关键词时 = 全量用户数）
}

/** 后台用户列表：GET /user/list?keyword=&page=&limit= */
export const fetchAdminUserList = (keyword : string, page : number, limit : number) : Promise<AdminUserPage> => {
	const params : Record<string, any> = { page: page, limit: limit }
	const kw : string = keyword.trim()
	if (kw.length > 0) { params.keyword = kw }
	return httpGet<any>('/user/list', params).then((r : any) => {
		// 兼容数组 / { list, total } / { records, total } 几种返回形态
		const body : any = Array.isArray(r) ? r : (r || {})
		const arr : any = Array.isArray(body) ? body : (body.list || body.records || [])
		const list : CustomerVO[] = []
		for (let i = 0; i < arr.length; i++) { list.push(arr[i] as CustomerVO) }
		const total : number = Array.isArray(body)
			? list.length
			: (Number(body.total ?? body.totalCount ?? 0) || list.length)
		return { list: list, total: total }
	})
}

/* ---------------- 余额调账（后台用户页用） ---------------- */
/** POST /balance/update 入参 */
export type BalanceUpdateParams = {
	storeId : number           // 门店 id（月票/直通函等用户级资产传 0）
	userId : number            // 用户 id
	amount : number            // 变动数量（正整数）
	balanceType : string       // 资产类型：balance / ticket / points / amount / totalAmount / comboA / comboB / comboC / monthTicket / inviteCard
	balanceAction : string     // 动作：gift（赠送）/ deduct（扣减）
}

/** 余额调账：POST /balance/update */
export const updateBalance = (data : BalanceUpdateParams) : Promise<void> => {
	return httpPost<void>('/balance/update', data)
}

/* ---------------- 绑定手机号（后台用户页用） ---------------- */
/** POST /user/bind-phone 入参 */
export type PhoneBindParams = {
	userId : number            // 用户 id
	phone : string             // 新手机号
}

/** 绑定/修改手机号：POST /user/bind-phone */
export const bindPhone = (data : PhoneBindParams) : Promise<void> => {
	return httpPost<void>('/user/bind-phone', data)
}

/* ---------------- 登录态存取 ---------------- */
// 用户信息整包存 LOGIN_KEY；authToken 单独存 AUTH_TOKEN_KEY（http.ts 请求时读取注入 header）
const LOGIN_KEY : string = 'login_result'
const AUTH_TOKEN_KEY : string = 'auth_token'

export const saveLoginResult = (r : LoginResult) : void => {
	uni.setStorageSync(LOGIN_KEY, r)
	if (r && r.authToken) {
		uni.setStorageSync(AUTH_TOKEN_KEY, r.authToken)
	}
}

export const getLoginResult = () : LoginResult | null => {
	const v = uni.getStorageSync(LOGIN_KEY)
	return v ? (v as LoginResult) : null
}

/** 本地资料更新：改头像 / 改昵称后把补丁合回 storage（接后端后同时调资料更新接口） */
export const updateLoginResult = (patch : Partial<LoginResult>) : void => {
	const cur = getLoginResult()
	if (cur == null) { return }
	const next : LoginResult = {
		id: patch.id !== undefined ? patch.id : cur.id,
		userNo: patch.userNo !== undefined ? patch.userNo : cur.userNo,
		username: patch.username !== undefined ? patch.username : cur.username,
		avatar: patch.avatar !== undefined ? patch.avatar : cur.avatar,
		authToken: patch.authToken !== undefined ? patch.authToken : cur.authToken,
		roleId: patch.roleId !== undefined ? patch.roleId : cur.roleId,
		phone: patch.phone !== undefined ? patch.phone : cur.phone,
		expireTime: patch.expireTime !== undefined ? patch.expireTime : cur.expireTime
	}
	uni.setStorageSync(LOGIN_KEY, next)
}

export const clearLoginResult = () : void => {
	uni.removeStorageSync(LOGIN_KEY)
	uni.removeStorageSync(AUTH_TOKEN_KEY)
}
