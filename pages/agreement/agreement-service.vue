<template>
	<scroll-view class="page" direction="vertical" :show-scrollbar="false">
		<view class="doc">
			<text class="doc-title">用户服务协议</text>
			<text class="doc-updated">更新日期：2026-09-20 · 生效日期：2026-09-20</text>

			<text class="doc-p">欢迎您使用静默筹码（以下简称"本产品"）。本协议是您与本产品运营方之间就使用本产品服务所订立的契约。请您仔细阅读本协议，您勾选同意或实际使用本产品服务，即表示您已充分阅读、理解并接受本协议的全部内容。</text>

			<text class="doc-h">一、服务内容</text>
			<text class="doc-p">本产品为德州扑克、酒德等俱乐部赛事提供门店管理、赛事报名、积分排行、酒德积分存取等信息管理与展示服务。本产品仅提供信息管理工具，不参与任何资金往来，也不组织任何形式的赌博活动。</text>

			<text class="doc-h">二、账号与使用规范</text>
			<text class="doc-p">1. 您应使用真实、准确的手机号注册账号，并妥善保管账号密码及验证码；\n2. 不得将账号出借、转让给他人使用；\n3. 不得利用本产品从事任何违反法律法规或公序良俗的行为；\n4. 若发现账号存在违规使用情形，运营方有权视情节采取警告、限制功能、封禁账号等措施。</text>

			<text class="doc-h">三、用户权利与义务</text>
			<text class="doc-p">您有权在本产品内使用赛事报名、积分查询、门店信息浏览等功能；您在使用过程中应遵守门店现场规则，服从赛事工作人员安排。因您个人原因产生的纠纷，由您与相关方自行协商解决。</text>

			<text class="doc-h">四、服务的变更与终止</text>
			<text class="doc-p">运营方有权根据业务发展需要对本产品服务内容进行调整、中断或终止，并将通过公告等合理方式通知您。若您不同意变更后的内容，应停止使用本产品。</text>

			<text class="doc-h">五、免责声明</text>
			<text class="doc-p">因不可抗力、网络故障、系统维护等原因导致服务中断或数据延迟的，运营方不承担由此产生的直接或间接损失。本产品展示的赛事与积分信息以门店实际为准。</text>

			<text class="doc-h">六、其他</text>
			<text class="doc-p">本协议适用中华人民共和国法律。本协议条款无论因何种原因部分无效，其余条款仍有效。协议未尽事宜，双方可另行补充约定。</text>
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
