<template>
	<view class="page">

		<!-- ============ 品牌区 ============ -->
		<view class="brand">
			<view class="brand-logo">
				<text class="brand-logo-text">♠</text>
			</view>
			<text class="brand-name">SilentStack</text>
			<text class="brand-slogan">SilentStack · 专业赛事管理</text>
		</view>

		<!-- ============ 登录卡片 ============ -->
		<view class="card">
			<!-- 登录方式切换 -->
			<view class="tabs">
				<view class="tab" :class="{ 'tab-on': mode == 'password' }" @tap="onTapTab('password')">
					<text class="tab-text" :class="{ 'tab-text-on': mode == 'password' }">密码登录</text>
					<view class="tab-line" :class="{ 'tab-line-on': mode == 'password' }"></view>
				</view>
				<view class="tab" :class="{ 'tab-on': mode == 'sms' }" @tap="onTapTab('sms')">
					<text class="tab-text" :class="{ 'tab-text-on': mode == 'sms' }">验证码登录</text>
					<view class="tab-line" :class="{ 'tab-line-on': mode == 'sms' }"></view>
				</view>
			</view>

			<!-- 手机号 -->
			<view class="field">
				<text class="field-prefix">+86</text>
				<view class="field-divider"></view>
				<input
					class="field-input"
					type="number"
					:maxlength="11"
					:value="phone"
					placeholder="请输入手机号"
					placeholder-class="ph"
					@input="onPhoneInput"
				/>
			</view>

			<!-- 密码（密码登录） -->
			<view v-if="mode == 'password'" class="field">
				<input
					class="field-input"
					password
					:value="password"
					placeholder="请输入密码"
					placeholder-class="ph"
					@input="onPasswordInput"
				/>
			</view>

			<!-- 验证码（验证码登录） -->
			<view v-if="mode == 'sms'" class="field">
				<input
					class="field-input"
					type="number"
					:maxlength="6"
					:value="smsCode"
					placeholder="请输入验证码"
					placeholder-class="ph"
					@input="onCodeInput"
				/>
				<view class="sms-btn" :class="{ 'sms-btn-disabled': countdown > 0 || sendingSms }" @tap="onTapSendSms">
					<text class="sms-btn-text">{{ smsBtnLabel }}</text>
				</view>
			</view>

			<!-- 协议勾选 -->
			<view class="agree-row">
				<view class="agree-box" :class="{ 'agree-box-on': agreed }" @tap="onTapAgree">
					<text v-if="agreed" class="agree-check">✓</text>
				</view>
				<view class="agree-text-wrap">
					<text class="agree-text">我已阅读并同意</text>
					<text class="agree-link" @tap="onTapService">《用户服务协议》</text>
					<text class="agree-text">和</text>
					<text class="agree-link" @tap="onTapPrivacy">《隐私政策》</text>
				</view>
			</view>

			<!-- 登录按钮 -->
			<view class="login-btn" :class="{ 'login-btn-disabled': submitting }" @tap="onTapLogin">
				<text class="login-btn-text">{{ submitting ? '登录中…' : '登 录' }}</text>
			</view>
		</view>

		<view class="foot-blank"></view>
	</view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { sendLoginSms, loginByPhone, loginByPassword, saveLoginResult } from '@/common/user-api'
import type { LoginResult } from '@/common/user-api'

/* ---------------- 状态 ---------------- */
type LoginMode = 'password' | 'sms'
const mode = ref<LoginMode>('password')
const phone = ref('')
const password = ref('')
const smsCode = ref('')
const agreed = ref(false)
const submitting = ref(false)

/* ---------------- 输入 ---------------- */
const onPhoneInput = (e : any) : void => { phone.value = (e.detail.value || '').toString() }
const onPasswordInput = (e : any) : void => { password.value = (e.detail.value || '').toString() }
const onCodeInput = (e : any) : void => { smsCode.value = (e.detail.value || '').toString() }

const onTapTab = (m : LoginMode) : void => { mode.value = m }

/* ---------------- 协议 ---------------- */
const onTapAgree = () : void => { agreed.value = !agreed.value }
const onTapService = () : void => { uni.navigateTo({ url: '/pages/agreement/agreement-service' }) }
const onTapPrivacy = () : void => { uni.navigateTo({ url: '/pages/agreement/agreement-privacy' }) }

/* ---------------- 验证码倒计时 ---------------- */
const countdown = ref(0)
const sendingSms = ref(false)
let countdownTimer : number | null = null

const smsBtnLabel = computed<string>((): string => {
	if (sendingSms.value) { return '发送中…' }
	if (countdown.value > 0) { return countdown.value + 's 后重发' }
	return '获取验证码'
})

const startCountdown = () : void => {
	countdown.value = 60
	countdownTimer = setInterval((): void => {
		countdown.value -= 1
		if (countdown.value <= 0 && countdownTimer != null) {
			clearInterval(countdownTimer)
			countdownTimer = null
		}
	}, 1000) as unknown as number
}

const onTapSendSms = () : void => {
	if (countdown.value > 0 || sendingSms.value) { return }
	if (!isValidPhone()) { return }
	sendingSms.value = true
	sendLoginSms(phone.value).then(() => {
		uni.showToast({ title: '验证码已发送', icon: 'none' })
		startCountdown()
	}).catch((err : Error) => {
		uni.showToast({ title: err.message || '发送失败', icon: 'none' })
	}).finally(() => {
		sendingSms.value = false
	})
}

/* ---------------- 校验 ---------------- */
const isValidPhone = () : boolean => {
	if (!/^1\d{10}$/.test(phone.value)) {
		uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
		return false
	}
	return true
}

/* ---------------- 登录 ---------------- */
const onTapLogin = () : void => {
	if (submitting.value) { return }
	if (!isValidPhone()) { return }
	if (!agreed.value) {
		uni.showToast({ title: '请先阅读并同意用户服务协议和隐私政策', icon: 'none' })
		return
	}

	if (mode.value == 'password') {
		if (password.value.length == 0) {
			uni.showToast({ title: '请输入密码', icon: 'none' })
			return
		}
	} else {
		if (smsCode.value.length < 4) {
			uni.showToast({ title: '请输入验证码', icon: 'none' })
			return
		}
	}

	submitting.value = true
	const task = mode.value == 'password'
		? loginByPassword(phone.value, password.value)
		: loginByPhone(phone.value, smsCode.value)

	task.then((r) => {
		saveLoginResult((r || {}) as LoginResult)
		uni.showToast({ title: '登录成功', icon: 'success' })
		// 登录是独立入口：清栈进广场
		setTimeout((): void => {
			uni.switchTab({ url: '/pages/plaza/plaza' })
		}, 600)
	}).catch((err : Error) => {
		uni.showToast({ title: err.message || '登录失败', icon: 'none' })
	}).finally(() => {
		submitting.value = false
	})
}
</script>

<style scoped>
.page {
	min-height: 100vh;
	background-color: #0B0D0C;
	padding: 0 48rpx;
	box-sizing: border-box;
	flex-direction: column;
}

/* ============ 品牌区 ============ */
.brand {
	align-items: center;
	padding: 140rpx 0 70rpx;
}
.brand-logo {
	width: 140rpx;
	height: 140rpx;
	border-radius: 36rpx;
	background-color: #E8C2751F;
	border: 1rpx solid #E8C27559;
	align-items: center;
	justify-content: center;
}
.brand-logo-text {
	font-size: 72rpx;
	color: #E8C275;
	font-weight: 700;
	line-height: 80rpx;
}
.brand-name {
	font-size: 40rpx;
	color: #EDEFEE;
	font-weight: 700;
	margin-top: 30rpx;
}
.brand-slogan {
	font-size: 21rpx;
	color: #6E7573;
	margin-top: 12rpx;
	letter-spacing: 4rpx;
}

/* ============ 登录卡片 ============ */
.card {
	background-color: #171A19;
	border: 1rpx solid #242827;
	border-radius: 24rpx;
	padding: 10rpx 32rpx 40rpx;
}

/* 切换 Tab */
.tabs {
	flex-direction: row;
	margin-bottom: 36rpx;
}
.tab {
	flex: 1;
	align-items: center;
	padding: 26rpx 0 18rpx;
}
.tab-text {
	font-size: 28rpx;
	color: #6E7573;
	font-weight: 500;
}
.tab-text-on {
	color: #EDEFEE;
	font-weight: 700;
}
.tab-line {
	width: 48rpx;
	height: 6rpx;
	border-radius: 3rpx;
	background-color: transparent;
	margin-top: 12rpx;
}
.tab-line-on {
	background-color: #E8C275;
}

/* 输入行 */
.field {
	flex-direction: row;
	align-items: center;
	height: 96rpx;
	background-color: #0F1211;
	border: 1rpx solid #2A2F2D;
	border-radius: 16rpx;
	padding: 0 24rpx;
	margin-bottom: 24rpx;
}
.field-prefix {
	font-size: 28rpx;
	color: #EDEFEE;
	font-weight: 600;
}
.field-divider {
	width: 1rpx;
	height: 40rpx;
	background-color: #2A2F2D;
	margin: 0 20rpx;
}
.field-input {
	flex: 1;
	height: 96rpx;
	font-size: 28rpx;
	color: #EDEFEE;
}
.ph {
	color: #4A4F4D;
}

/* 验证码按钮 */
.sms-btn {
	padding: 12rpx 20rpx;
	background-color: #E8C2751F;
	border: 1rpx solid #E8C27559;
	border-radius: 12rpx;
	margin-left: 16rpx;
}
.sms-btn-text {
	font-size: 22rpx;
	color: #E8C275;
	font-weight: 600;
}
.sms-btn-disabled {
	opacity: 0.45;
}

/* ============ 协议 ============ */
.agree-row {
	flex-direction: row;
	align-items: flex-start;
	margin-top: 8rpx;
	margin-bottom: 30rpx;
}
.agree-box {
	width: 32rpx;
	height: 32rpx;
	border-radius: 8rpx;
	border: 2rpx solid #4A4F4D;
	align-items: center;
	justify-content: center;
	margin-right: 14rpx;
	margin-top: 2rpx;
}
.agree-box-on {
	background-color: #E8C275;
	border-color: #E8C275;
}
.agree-check {
	font-size: 22rpx;
	color: #14100A;
	font-weight: 800;
	line-height: 26rpx;
}
.agree-text-wrap {
	flex: 1;
	flex-direction: row;
	flex-wrap: wrap;
	align-items: center;
}
.agree-text {
	font-size: 22rpx;
	color: #6E7573;
	line-height: 34rpx;
}
.agree-link {
	font-size: 22rpx;
	color: #E8C275;
	line-height: 34rpx;
}

/* ============ 登录按钮 ============ */
.login-btn {
	height: 96rpx;
	border-radius: 999rpx;
	background-image: linear-gradient(135deg, #E8C275, #C89B3C);
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 24rpx rgba(232, 194, 117, 0.35);
}
.login-btn-text {
	font-size: 30rpx;
	color: #14100A;
	font-weight: 700;
}
.login-btn-disabled {
	opacity: 0.55;
}

.foot-blank {
	height: 80rpx;
}
</style>
