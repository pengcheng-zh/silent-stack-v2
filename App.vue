<script setup lang="ts">
	import { redirectSplashIfNeeded } from '@/common/splash-guard'
	import { installAuthGuard } from '@/common/auth-guard'

	// #ifdef APP-ANDROID || APP-HARMONY
	let firstBackTime = 0
	// #endif

	onLaunch(() => {
		console.log('App onLaunch')
		// 全局路由守卫：必须先于 splash 中间件安装，
		// 这样 splash 播完 reLaunch(入口页) 时，未登录会被拦截到登录页
		installAuthGuard()
		// 全局 splash 中间件：onLaunch 只在"整包重载"时触发（App 冷启动 / H5 刷新 / H5 直链），
		// 程序内部跳转不会触发，所以这里重定向 = 用户自己进来就播一次 splash
		redirectSplashIfNeeded()
	})

	onAppShow(() => {
		console.log('App Show')
	})

	onAppHide(() => {
		console.log('App Hide')
	})

	// #ifdef APP-ANDROID || APP-HARMONY
	onLastPageBackPress(() => {
		console.log('App LastPageBackPress')
		if (firstBackTime == 0) {
			uni.showToast({
				title: '再按一次退出应用',
				position: 'bottom',
			})
			firstBackTime = Date.now()
			setTimeout(() => {
				firstBackTime = 0
			}, 2000)
		} else if (Date.now() - firstBackTime < 2000) {
			firstBackTime = Date.now()
			uni.exit()
		}
	})

	onExit(() => {
		console.log('App Exit')
	})
	// #endif
</script>

<style>
	/*每个页面公共css */
	.uni-row {
		flex-direction: row;
	}

	.uni-column {
		flex-direction: column;
	}

	/* .page 公共基线：box-sizing + 背景渐变 + 左右 24rpx 页内边距；
	   各页面自己的高/上下内边距等由各 page 的 scoped 样式控制。
	   页面内的 section / card 不应再重复带 24rpx 横向 margin，否则会与边距叠加 */
	.page {
		box-sizing: border-box;
		background-image: linear-gradient(180deg, #0E1110 0%, #0A0C0B 40%, #0B0D0C 100%);
		padding: 0 24rpx;
	}

	/* #ifdef H5 */
	/* uni-page-refresh 是 H5 页面外壳里的固定结构节点，
	   enablePullDownRefresh: false 只让它不响应下拉手势，并不会把它从 DOM 移除。
	   本项目的下拉刷新已由 plaza 页 scroll-view 的 refresher 承担，这里隐藏即可 */
	uni-page-refresh {
		display: none !important;
	}
	/* #endif */
</style>
