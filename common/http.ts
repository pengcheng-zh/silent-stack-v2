/**
 * 后端统一请求封装
 *
 * 项目内所有业务接口（store / user / tournament …）走此模块发出。
 * 已登录时自动把 authToken 注入 Authorization 请求头（token 由登录模块写入 storage）。
 */

/** 后端服务地址：开发/生产各一套，接后端后改成真实域名 */
export const BASE_URL : string = 'https://api.silentstack.cn'
// export const BASE_URL : string = 'http://localhost:8088'

/** 登录令牌单独存的 storage key；登录模块写、这里读 */
const AUTH_TOKEN_KEY : string = 'auth_token'

/** 读取 authToken（未登录返回空串） */
export const getAuthToken = () : string => {
	const v = uni.getStorageSync(AUTH_TOKEN_KEY)
	return v ? v.toString() : ''
}

/** 通用响应结构：code=0 成功，msg 错误信息，data 业务载荷 */
export type ApiResp<T> = {
	messageId: string
	message: string
	result: boolean
	object: T
}

/**
 * 统一请求
 * @param path  接口路径，如 "/store/list"（自动拼 BASE_URL）
 * @param method GET / POST / PUT / DELETE
 * @param params URL 查询参数（GET / DELETE 时生效）
 * @param data   请求体（POST / PUT 时序列化为 JSON）
 * @returns Promise<data> 业务载荷；code != 0 时 reject(msg)
 */
export const request = <T>(
	path : string,
	method : 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
	params : Record<string, any> | null = null,
	data : any = null
) : Promise<T> => {
	return new Promise<T>((resolve, reject) => {
		// 拼 query 字符串：page=1&limit=20&foo=bar
		let url : string = BASE_URL + path
		if (params != null && Object.keys(params).length > 0) {
			const qs = Object.keys(params)
				.filter(k => params[k] !== undefined && params[k] !== null)
				.map(k => encodeURIComponent(k) + '=' + encodeURIComponent(String(params[k])))
				.join('&')
			url += (url.indexOf('?') >= 0 ? '&' : '?') + qs
		}

		uni.request({
			url: url,
			method: method,
			data: data,
			header: {
				'Content-Type': 'application/json',
				// 已登录时注入 authToken；未登录不带此 header
				'Authorization': getAuthToken()
			},
			success: (res : any) => {
				// 网络层 OK，业务层再判 code
				const body = res.data as ApiResp<T>
				if (body && body.result) {
					resolve(body.object)
				} else {
					reject(new Error(body && body.message ? body.message : '请求失败'))
				}
			},
			fail: (err : any) => {
				reject(new Error(err && err.errMsg ? err.errMsg : '网络异常'))
			}
		})
	})
}

export const httpGet = <T>(path : string, params : Record<string, any> | null = null) : Promise<T> =>
	request<T>(path, 'GET', params)

export const httpPost = <T>(path : string, data : any = null) : Promise<T> =>
	request<T>(path, 'POST', null, data)

export const httpPut = <T>(path : string, data : any = null) : Promise<T> =>
	request<T>(path, 'PUT', null, data)

export const httpDelete = <T>(path : string, params : Record<string, any> | null = null) : Promise<T> =>
	request<T>(path, 'DELETE', params)

/**
 * 相对路径文件 URL 补全为绝对地址（基于 BASE_URL 的域名）
 * 后端返回 /profile/xxx 之类的相对路径时，<image> 在 H5 下会解析到前端域名导致 404
 */
export const resolveFileUrl = (u : string) : string => {
	const s : string = (u || '').toString()
	if (s.length == 0 || s.indexOf('http://') == 0 || s.indexOf('https://') == 0) { return s }
	const m = BASE_URL.match(/^https?:\/\/[^\/]+/)
	const origin : string = m ? m[0] : ''
	return origin + (s.indexOf('/') == 0 ? s : '/' + s)
}

/**
 * 统一文件上传（multipart/form-data），自动注入 authToken，按 ApiResp 结构解包
 * @param path     接口路径，如 "/file/upload"
 * @param filePath 本地临时文件路径（chooseImage 返回的 tempFilePath）
 * @param name     文件字段名，默认 file
 * @returns Promise<object> 业务载荷；result != true 时 reject(message)
 */
export const httpUpload = <T>(path : string, filePath : string, name : string = 'file') : Promise<T> => {
	return new Promise<T>((resolve, reject) => {
		uni.uploadFile({
			url: BASE_URL + path,
			filePath: filePath,
			name: name,
			header: {
				'Authorization': getAuthToken()
			},
			success: (res : any) => {
				// uploadFile 返回的是字符串，手动解析 JSON
				let body : ApiResp<T> | null = null
				try { body = JSON.parse(res.data) } catch (e) { body = null }
				if (body && body.result) {
					resolve(body.object)
				} else {
					reject(new Error(body && body.message ? body.message : '上传失败'))
				}
			},
			fail: (err : any) => {
				reject(new Error(err && err.errMsg ? err.errMsg : '网络异常'))
			}
		})
	})
}
