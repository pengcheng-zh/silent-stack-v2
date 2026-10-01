<template>
	<scroll-view class="page" direction="vertical" :show-scrollbar="false">

		<!-- ============ 资料卡：头像 + 昵称 + ID + 手机号 ============ -->
		<view class="card">
			<!-- 头像：点击从相册选择更换 -->
			<view class="row" @tap="onTapAvatar">
				<text class="row-label">头像</text>
				<view class="row-right">
					<image v-if="user.avatar.length > 0" class="avatar-img" :src="user.avatar" mode="aspectFill"></image>
					<view v-else class="avatar-ph">
						<text class="avatar-ph-text">{{ nameFallback }}</text>
					</view>
					<text class="row-arrow">›</text>
				</view>
			</view>

			<!-- 昵称：点击弹层修改 -->
			<view class="row" @tap="onTapNickname">
				<text class="row-label">昵称</text>
				<view class="row-right">
					<text class="row-value">{{ user.username }}</text>
					<text class="row-arrow">›</text>
				</view>
			</view>

			<!-- 用户 ID：只读 -->
			<view class="row">
				<text class="row-label">用户 ID</text>
				<view class="row-right">
					<text class="row-value row-value-dim">{{ user.userNo }}</text>
				</view>
			</view>

			<!-- 手机号：只读 -->
			<view class="row row-last">
				<text class="row-label">手机号</text>
				<view class="row-right">
					<text class="row-value row-value-dim">{{ maskPhone(user.phone) }}</text>
				</view>
			</view>
		</view>

		<!-- ============ 安全 ============ -->
		<view class="card">
			<view class="row row-last" @tap="onTapPassword">
				<text class="row-label">修改密码</text>
				<view class="row-right">
					<text class="row-arrow">›</text>
				</view>
			</view>
		</view>

		<!-- ============ 个人内容 ============ -->
		<view class="card">
			<view class="row" @tap="onTapHonorCards">
				<text class="row-label">我的背景卡</text>
				<view class="row-right">
					<text class="row-value row-value-dim">{{ honorCardLabel }}</text>
					<text class="row-arrow">›</text>
				</view>
			</view>
			<view class="row row-last" @tap="onTapRecords">
				<text class="row-label">消费记录</text>
				<view class="row-right">
					<text class="row-arrow">›</text>
				</view>
			</view>
		</view>

		<!-- ============ 其他 ============ -->
		<view class="card">
			<view class="row" @tap="onTapAbout">
				<text class="row-label">关于我们</text>
				<view class="row-right">
					<text class="row-arrow">›</text>
				</view>
			</view>
			<view class="row" @tap="onTapService">
				<text class="row-label">用户协议</text>
				<view class="row-right">
					<text class="row-arrow">›</text>
				</view>
			</view>
			<view class="row row-last" @tap="onTapPrivacy">
				<text class="row-label">隐私政策</text>
				<view class="row-right">
					<text class="row-arrow">›</text>
				</view>
			</view>
		</view>

		<!-- 退出登录 -->
		<view class="logout-btn" @tap="onTapLogout">
			<text class="logout-text">退出登录</text>
		</view>

		<view class="footer-blank"></view>
	</scroll-view>

	<!-- ============ 昵称修改弹层 ============ -->
	<view v-if="nickDialog" class="dlg-overlay" @tap="nickSaving ? null : nickDialog = false">
		<view class="dlg-card" @tap.stop="">
			<text class="dlg-title">修改昵称</text>
			<input
				class="dlg-input"
				type="text"
				:maxlength="20"
				:value="nickInput"
				placeholder="请输入新昵称"
				placeholder-class="dlg-ph"
				@input="onNickInput"
			/>
			<view class="dlg-btns">
				<view class="dlg-btn dlg-btn-cancel" @tap="nickSaving ? null : nickDialog = false">
					<text class="dlg-btn-text dlg-cancel-text">取消</text>
				</view>
				<view class="dlg-btn dlg-btn-ok" @tap="onTapNickSave">
					<text class="dlg-btn-text dlg-ok-text">{{ nickSaving ? '提交中…' : '保存' }}</text>
				</view>
			</view>
		</view>
	</view>

	<!-- ============ 修改密码弹层 ============ -->
	<view v-if="pwdDialog" class="dlg-overlay" @tap="onTapPwdCancel">
		<view class="dlg-card" @tap.stop="">
			<text class="dlg-title">修改密码</text>
			<input
				class="dlg-input"
				password
				:maxlength="10"
				:value="pwdNew"
				placeholder="请输入新密码（6-10 位）"
				placeholder-class="dlg-ph"
				@input="onPwdNewInput"
			/>
			<text v-if="pwdError.length > 0" class="dlg-error">{{ pwdError }}</text>
			<view class="dlg-btns">
				<view class="dlg-btn dlg-btn-cancel" @tap="onTapPwdCancel">
					<text class="dlg-btn-text dlg-cancel-text">取消</text>
				</view>
				<view class="dlg-btn dlg-btn-ok" @tap="onTapPwdSave">
					<text class="dlg-btn-text dlg-ok-text">{{ pwdSaving ? '提交中…' : '确认修改' }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getLoginResult, updateLoginResult, clearLoginResult, updatePassword, updateProfile, fetchMyInfo } from '@/common/user-api'
import type { CustomerVO } from '@/common/user-api'
import { getMyHonorCard } from '@/common/honor-card-data'

/* ---------------- 用户信息（来自登录态） ---------------- */
// 未登录（守卫失效等极端情况）兜底空资料，页面仍可渲染
const user = ref({
	id: '',
	userNo: '',
	username: '',
	avatar: '',
	phone: ''
})

const init = getLoginResult()
if (init != null) {
	user.value = {
		id: init.id || '',
		userNo: init.userNo || '',
		username: init.username || '',
		avatar: init.avatar || '',
		phone: init.phone || ''
	}
}

const nameFallback = computed<string>((): string => {
	return user.value.username.length > 0 ? user.value.username.substring(0, 1) : '?'
})

const maskPhone = (p : string) : string => {
	if (p.length == 11) { return p.substring(0, 3) + '****' + p.substring(7) }
	return p
}

/* ---------------- 头像 ---------------- */
// 相册选图 → 后端头像上传接口（TODO：头像上传接口待提供，暂用本地路径 + updateProfile）
const onTapAvatar = () : void => {
	uni.chooseImage({
		count: 1,
		sizeType: ['compressed'],
		success: (res : any) => {
			const paths : string[] = (res.tempFilePaths || []) as string[]
			if (paths.length > 0) {
				// TODO 接后端：先调上传接口拿到 URL，再把 URL 传给 updateProfile
				user.value.avatar = paths[0]
				updateProfile({ avatar: paths[0] }).then(() : Promise<CustomerVO> => {
					return fetchMyInfo()
				}).then((profile : CustomerVO) => {
					const avatar : string = profile.avatar || paths[0]
					user.value.avatar = avatar
					updateLoginResult({ avatar: avatar })
					uni.showToast({ title: '头像已更新', icon: 'none' })
				}).catch((e : any) => {
					uni.showToast({ title: e && e.message ? e.message : '头像更新失败', icon: 'none' })
				})
				updateLoginResult({ avatar: paths[0] })
			}
		}
	})
}

/* ---------------- 昵称 ---------------- */
const nickDialog = ref(false)
const nickInput = ref('')
const nickSaving = ref(false)

const onTapNickname = () : void => {
	nickInput.value = user.value.username
	nickSaving.value = false
	nickDialog.value = true
}
const onNickInput = (e : any) : void => { nickInput.value = (e.detail.value || '').toString() }
const onTapNickSave = () : void => {
	if (nickSaving.value) { return }
	const name = nickInput.value.trim()
	if (name.length == 0) {
		uni.showToast({ title: '昵称不能为空', icon: 'none' })
		return
	}
	nickSaving.value = true
	updateProfile({ username: name }).then((): Promise<CustomerVO> => {
		// 成功后重新拉 /user/info，保证页面与 storage 和服务端一致
		return fetchMyInfo()
	}).then((profile : CustomerVO) => {
		nickSaving.value = false
		user.value.username = profile.username
		updateLoginResult({ username: profile.username })
		nickDialog.value = false
		uni.showToast({ title: '昵称已更新', icon: 'none' })
	}).catch((e : any) => {
		nickSaving.value = false
		uni.showToast({ title: e && e.message ? e.message : '更新失败，请重试', icon: 'none' })
	})
}

/* ---------------- 修改密码 ---------------- */
const pwdDialog = ref(false)
const pwdNew = ref('')
const pwdError = ref('')
const pwdSaving = ref(false)

const onTapPassword = () : void => {
	pwdNew.value = ''; pwdError.value = ''; pwdSaving.value = false
	pwdDialog.value = true
}
const onTapPwdCancel = () : void => {
	if (pwdSaving.value) { return }
	pwdDialog.value = false
}
const onPwdNewInput = (e : any) : void => { pwdNew.value = (e.detail.value || '').toString() }

const onTapPwdSave = () : void => {
	if (pwdSaving.value) { return }
	if (pwdNew.value.length < 6 || pwdNew.value.length > 10) { pwdError.value = '新密码需为 6-10 位'; return }
	pwdError.value = ''
	pwdSaving.value = true
	updatePassword(pwdNew.value).then(() => {
		pwdSaving.value = false
		pwdDialog.value = false
		uni.showToast({ title: '密码已修改', icon: 'none' })
	}).catch((e : any) => {
		pwdSaving.value = false
		pwdError.value = (e && e.message ? e.message : '修改失败，请重试').toString()
	})
}

/* ---------------- 背景卡 / 消费记录 / 协议 ---------------- */
const honorCardLabel = computed<string>((): string => {
	const c = getMyHonorCard()
	if (c == null) { return '未选择' }
	return c.name
})

const onTapHonorCards = () : void => { uni.navigateTo({ url: '/pages/settings/honor-cards' }) }
const onTapRecords = () : void => { uni.navigateTo({ url: '/pages/settings/consume-records' }) }
const onTapService = () : void => { uni.navigateTo({ url: '/pages/agreement/agreement-service' }) }
const onTapPrivacy = () : void => { uni.navigateTo({ url: '/pages/agreement/agreement-privacy' }) }
const onTapAbout = () : void => { uni.navigateTo({ url: '/pages/settings/about' }) }

/* ---------------- 退出登录 ---------------- */
const onTapLogout = () : void => {
	uni.showModal({
		title: '退出登录',
		content: '确定退出当前账号吗？',
		confirmText: '退出',
		confirmColor: '#FF6255',
		success: (res : any) => {
			if (res.confirm) {
				clearLoginResult()
				// 清栈回登录页；路由守卫也会兜底
				uni.reLaunch({ url: '/pages/login/login' })
			}
		}
	})
}
</script>

<style scoped>
.page {
	min-height: 100vh;
	background-image: linear-gradient(180deg, #0E1110 0%, #0A0C0B 40%, #0B0D0C 100%);
	padding: 24rpx;
	box-sizing: border-box;
}

/* ============ 行式卡片 ============ */
.card {
	background-color: #1A1E1D;
	border: 1rpx solid #2A2F2D;
	border-radius: 24rpx;
	padding: 0 28rpx;
	margin-bottom: 24rpx;
	overflow: hidden;
	box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
}
.row {
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	padding: 28rpx 0;
	border-bottom: 1rpx solid rgba(42, 47, 45, 0.6);
}
.row-last { border-bottom-width: 0; }
.row-label {
	font-size: 27rpx;
	color: #EDEFEE;
	font-weight: 500;
}
.row-right {
	flex-direction: row;
	align-items: center;
}
.row-value {
	font-size: 25rpx;
	color: #C9CFCC;
	margin-right: 8rpx;
}
.row-value-dim { color: #7E8281; }
.row-arrow {
	font-size: 34rpx;
	color: #4A4F4D;
	line-height: 34rpx;
}

/* 头像 */
.avatar-img {
	width: 92rpx;
	height: 92rpx;
	border-radius: 46rpx;
	margin-right: 10rpx;
}
.avatar-ph {
	width: 92rpx;
	height: 92rpx;
	border-radius: 46rpx;
	background-color: #242827;
	border: 2rpx solid #3A3E3D;
	align-items: center;
	justify-content: center;
	margin-right: 10rpx;
}
.avatar-ph-text {
	font-size: 36rpx;
	color: #E8C275;
	font-weight: 700;
}

/* ============ 退出登录 ============ */
.logout-btn {
	margin-top: 10rpx;
	height: 96rpx;
	background-color: #1A1E1D;
	border: 1rpx solid #FF625533;
	border-radius: 24rpx;
	align-items: center;
	justify-content: center;
	box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
}
.logout-text {
	font-size: 27rpx;
	color: #FF6255;
	font-weight: 600;
}

.footer-blank { height: 60rpx; }

/* ============ 弹层通用 ============ */
.dlg-overlay {
	position: fixed;
	left: 0; right: 0; top: 0; bottom: 0;
	background-color: rgba(0, 0, 0, 0.65);
	align-items: center;
	justify-content: center;
	z-index: 999;
	padding: 24rpx;
}
.dlg-card {
	flex-direction: column;
	width: 624rpx;
	max-width: 100%;
	background-color: #1A1E1D;
	border-radius: 28rpx;
	border: 1rpx solid #2A2F2D;
	padding: 34rpx 30rpx 28rpx;
	box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.55);
}
.dlg-title {
	font-size: 32rpx;
	color: #EDEFEE;
	font-weight: 700;
	margin-bottom: 24rpx;
}
.dlg-input {
	height: 88rpx;
	background-color: #0F1211;
	border: 1rpx solid #2A2F2D;
	border-radius: 14rpx;
	padding: 0 22rpx;
	font-size: 26rpx;
	color: #EDEFEE;
	margin-bottom: 20rpx;
}
.dlg-ph { color: #4A4F4D; }
.dlg-error {
	font-size: 21rpx;
	color: #FF6255;
	margin-bottom: 14rpx;
}
.dlg-btns {
	flex-direction: row;
	margin-top: 8rpx;
}
.dlg-btn {
	flex: 1;
	height: 84rpx;
	align-items: center;
	justify-content: center;
	border-radius: 14rpx;
}
.dlg-btn-cancel {
	background-color: #1F2322;
	border: 1rpx solid #2A2F2D;
	margin-right: 18rpx;
}
.dlg-btn-ok {
	background-image: linear-gradient(135deg, #E8C275, #C89B3C);
}
.dlg-btn-text {
	font-size: 26rpx;
	font-weight: 600;
}
.dlg-cancel-text { color: #C7CDCB; }
.dlg-ok-text { color: #14100A; }
</style>
