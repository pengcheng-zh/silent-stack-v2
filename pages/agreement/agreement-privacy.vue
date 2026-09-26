<template>
	<scroll-view class="page" direction="vertical" :show-scrollbar="false">
		<view class="doc">
			<text class="doc-title">隐私政策</text>
			<text class="doc-updated">更新日期：2026-09-20 · 生效日期：2026-09-20</text>

			<text class="doc-p">SilentStack（以下简称"本产品"）非常重视您的个人信息保护。本政策向您说明我们如何收集、使用、存储和保护您的个人信息，以及您享有的相关权利。请您在使用本产品前仔细阅读本政策。</text>

			<text class="doc-h">一、我们收集的信息</text>
			<text class="doc-p">1. 账号信息：注册时提供的手机号，用于创建与登录账号；\n2. 设备信息：设备型号、操作系统版本，用于保障服务稳定运行；\n3. 位置信息：仅在您主动使用"附近门店""地图选点"等功能时获取，用于展示门店距离与定位地址；\n4. 赛事数据：您的报名记录、积分战绩、酒德积分存取记录等，用于赛事管理与排行展示。</text>

			<text class="doc-h">二、信息的使用</text>
			<text class="doc-p">我们收集的信息仅用于：提供登录与账号服务、赛事报名与积分管理、门店信息展示、发送与账号及赛事相关的短信通知。我们不会将您的个人信息用于上述目的之外的用途。</text>

			<text class="doc-h">三、信息的共享与披露</text>
			<text class="doc-p">我们不会向任何第三方出售您的个人信息。仅在以下情形下可能共享必要信息：\n1. 获得您的明确同意；\n2. 为完成短信验证码发送，向电信运营商提交必要的手机号；\n3. 依据法律法规或有权机关的强制要求。</text>

			<text class="doc-h">四、信息的存储与保护</text>
			<text class="doc-p">您的个人信息存储于中华人民共和国境内的服务器。我们采取加密传输、访问控制等安全措施防止信息被未经授权地访问、篡改或泄露。存储期限为实现本政策所述目的所必需的最短时间。</text>

			<text class="doc-h">五、您的权利</text>
			<text class="doc-p">1. 您可以随时在"我的"页面查看、更正您的个人资料；\n2. 您可以注销账号，注销后我们将删除或匿名化处理您的个人信息；\n3. 您可以撤回授权同意，撤回不影响此前基于授权已进行的数据处理。</text>

			<text class="doc-h">六、未成年人保护</text>
			<text class="doc-p">本产品面向成年人提供服务。若我们发现误收集了未成年人的信息，将尽快删除相关数据。</text>

			<text class="doc-h">七、政策更新</text>
			<text class="doc-p">本政策可能适时更新，更新后将通过公告等方式通知您。重大变更将以更显著的方式提示。</text>
		</view>

		<view class="footer-blank"></view>
	</scroll-view>
</template>

<script setup lang="ts">
</script>

<style scoped>
.page {
	min-height: 100vh;
	background-image: linear-gradient(180deg, #0E1110 0%, #0A0C0B 40%, #0B0D0C 100%);
	padding: 24rpx;
	box-sizing: border-box;
}
.doc {
	background-color: #1A1E1D;
	border: 1rpx solid #2A2F2D;
	border-radius: 24rpx;
	padding: 38rpx 32rpx;
	box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
}
.doc-title {
	font-size: 34rpx;
	color: #EDEFEE;
	font-weight: 700;
}
.doc-updated {
	display: block;
	font-size: 20rpx;
	color: #6E7573;
	margin-top: 12rpx;
	margin-bottom: 28rpx;
}
.doc-h {
	display: block;
	font-size: 26rpx;
	color: #E8C275;
	font-weight: 600;
	margin-top: 30rpx;
	margin-bottom: 12rpx;
}
.doc-p {
	display: block;
	font-size: 24rpx;
	color: #9AA19E;
	line-height: 42rpx;
}
.footer-blank {
	height: 60rpx;
}
</style>
