<template>
    <view class="splash" :class="splashClass">
        <!-- ===== 星空背景：三团星云柔光 + 星点（普通 view 绘制，各端渲染一致） ===== -->
        <view class="sky">
            <view class="sky-nebula neb-red"></view>
            <view class="sky-nebula neb-blue"></view>
            <view class="sky-nebula neb-halo"></view>
            <view class="sky-stars">
                <view
                    v-for="(s, i) in SKY_STARS"
                    :key="'sky' + i"
                    class="sky-star"
                    :class="s.bright ? 'is-twinkle' : ''"
                    :style="skyStarStyle(s)"
                ></view>
            </view>
        </view>

        <view class="stage">
            <view class="field" :class="fieldClass">
                <!-- ===== 旋转外层：红环 + 红点圈 + 双A + 红星 =====
                     整层绕中心慢速旋转；牌与星通过内层反向旋转保持直立 -->
                <view class="orbit" :style="orbitStyle">
                    <!-- 红色圆环：左上/右下各 30° 缺口 -->
                    <view class="ring"></view>
                    <!-- 红点圈：与圆环同样留出缺口 -->
                    <view
                        v-for="(d, i) in TOP_DOTS"
                        :key="'td' + i"
                        class="dot"
                        :style="dotStyle(d, dotStates[i])"
                    ></view>
                    <view
                        v-for="(d, i) in BOTTOM_DOTS"
                        :key="'bd' + i"
                        class="dot"
                        :style="dotStyle(d, dotStates[DOTS_PER_ARC + i])"
                    ></view>

                    <!-- 左上：黑桃A -->
                    <view class="keeper k-tl-card">
                        <view class="card-undo">
                            <view class="a-card" :style="cardStyle(false)">
                                <text class="a-center ink-navy">♠</text>
                                <text class="a-corner a-tl-rank ink-navy">A</text>
                                <text class="a-corner a-tl-suit ink-navy">♠</text>
                                <text class="a-corner a-br-rank ink-navy">A</text>
                                <text class="a-corner a-br-suit ink-navy">♠</text>
                            </view>
                        </view>
                    </view>
                    <!-- 右下：红桃A -->
                    <view class="keeper k-br-card">
                        <view class="card-undo">
                            <view class="a-card" :style="cardStyle(true)">
                                <text class="a-center ink-red">♥</text>
                                <text class="a-corner a-tl-rank ink-red">A</text>
                                <text class="a-corner a-tl-suit ink-red">♥</text>
                                <text class="a-corner a-br-rank ink-red">A</text>
                                <text class="a-corner a-br-suit ink-red">♥</text>
                            </view>
                        </view>
                    </view>
                    <!-- 两颗红色四角星（尖锐长芒） -->
                    <view class="keeper k-tl-star">
                        <view class="star-undo">
                            <view class="star" :style="starStyle(0)">
                                <view class="star-core"></view>
                            </view>
                        </view>
                    </view>
                    <view class="keeper k-br-star">
                        <view class="star-undo">
                            <view class="star" :style="starStyle(1)">
                                <view class="star-core"></view>
                            </view>
                        </view>
                    </view>
                </view>

                <!-- ===== 德州筹码（红点内侧的中心内容） ===== -->
                <view class="chip" :style="chipStyle">
                    <view class="chip-body">
                        <!-- 外圈：白色弧形梯形块，贴着藏青底 -->
                        <view class="chip-edge"></view>
                        <!-- 中圈：红白相间圆环 -->
                        <view class="chip-stripes"></view>
                        <!-- 细红环：与红白环内侧间隔 4px -->
                        <view class="chip-fine"></view>
                        <!-- 中心藏青圆 + 细红环 + $ -->
                        <view class="chip-inner">
                            <view class="chip-pulse">
                                <text class="chip-sign" :style="signStyle">$</text>
                            </view>
                        </view>
                    </view>
                </view>
            </view>

            <view class="brand" :style="brandWrapStyle">
                <text class="brand-name" :style="brandStyle">SILENT STACK</text>
            </view>
        </view>

        <view class="track" :style="trackStyle">
            <view class="track-fill" :style="fillStyle"></view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { splashGoNext } from '@/common/splash-guard'

/* ================= 几何常量（rpx，750 基准，1px ≈ 2rpx） =================
   红环：外径 640，厚 20rpx(≈10px)，左上/右下各留 70° 缺口给双A和星
   红点：轨道半径 276（环内侧让 20rpx≈10px），直径 8rpx（半径≈2px）
   内容：德州筹码直径 420，与红点内侧间隔约 24rpx(≈12px) */
const RING_D = 640
const DOT_ORBIT = 276
const CHIP_D = 420
const DOTS_PER_ARC = 15

/* 圆点角度范围：避开左上(280°~350°)与右下(100°~170°)两个 70° 缺口 */
const TOP_DOTS = makeDots(-4, 94, DOTS_PER_ARC)
const BOTTOM_DOTS = makeDots(176, 274, DOTS_PER_ARC)

function makeDots (start: number, end: number, count: number): number[] {
    const dots: number[] = []
    const step = (end - start) / (count - 1)
    for (let i = 0; i < count; i++) { dots.push(start + i * step) }
    return dots
}

/* ================= 星空背景 =================
   星点用绝对定位的小圆 view 绘制（不依赖位图与背景渐变铺底，各端表现一致）。
   位置由「固定种子的线性同余」生成：每次刷新星图完全相同，避免重载后星点乱跳 */
type SkyStar = {
    left : number       // 横向位置（%）
    top : number        // 纵向位置（%）
    size : number       // 直径（rpx）
    dim : number        // 静态透明度
    bright : boolean    // 亮星：带外发光并呼吸闪烁
    delay : number      // 闪烁相位（s，负值让各星错开）
}

function makeStars (count : number, seed : number): SkyStar[] {
    const stars : SkyStar[] = []
    let s : number = seed
    const rnd = (): number => {
        s = (s * 9301 + 49297) % 233280
        return s / 233280
    }
    for (let i = 0; i < count; i++) {
        const bright : boolean = i % 4 == 0
        const r : number = rnd()
        stars.push({
            // 星点层比屏幕四周各外扩 40rpx（做平移视差），落点收在 6%~94% / 3%~97%，
            // 保证每颗星都落在可视区内
            left: 6 + Math.round(rnd() * 880) / 10,
            top: 3 + Math.round(rnd() * 940) / 10,
            size: bright ? (r > 0.6 ? 6 : 5) : (r > 0.55 ? 4 : 3),
            dim: bright ? 1 : (Math.round((0.30 + rnd() * 0.40) * 100) / 100),
            bright: bright,
            delay: -Math.round(rnd() * 340) / 100
        })
    }
    return stars
}

const SKY_STARS : SkyStar[] = makeStars(48, 20240517)

/* UTS 的 Array 构造与 fill 都按 number 处理（new Array(n) 推出 number[]），
   布尔数组只能手动 push，否则编译告警 */
function makeFlags (count : number, value : boolean): boolean[] {
    const arr : boolean[] = []
    for (let i = 0; i < count; i++) { arr.push(value) }
    return arr
}

function skyStarStyle (s : SkyStar): string {
    return 'left:' + s.left + '%;top:' + s.top + '%;' +
        'width:' + s.size + 'rpx;height:' + s.size + 'rpx;' +
        'opacity:' + s.dim + ';animation-delay:' + s.delay + 's;'
}

/* ================= 入场状态 ================= */
const loaded = ref(false)
const orbitIn = ref(false)
const dotStates = ref<boolean[]>(makeFlags(DOTS_PER_ARC * 2, false))
const chipIn = ref(false)
const dollarIn = ref(false)
const cardsIn = ref<boolean[]>([false, false])
const starsIn = ref<boolean[]>([false, false])
const brandIn = ref(false)
const trackIn = ref(false)
const fillIn = ref(false)
const leaving = ref(false)
const loopStarted = ref(false)
const reduced = ref(false)

const timers: number[] = []

const at = (delay: number, task: () => void): void => {
    timers.push(setTimeout(task, delay))
}

// 播放结束后的落地：由 splash-guard 统一决策 —— tab 页直接落地；
// 二级页先落主页再压栈，保证刷新后原生返回键可回主页（入口未知时兜底回广场）
const goNext = (): void => {
    splashGoNext()
}

const play = (): void => {
    if (reduced.value) {
        // 减弱动效：不做逐帧入场，只留静态满帧 + 进度条走完；
        // 但同样必须回跳，否则会永远停在 splash 上
        loaded.value = true
        orbitIn.value = true
        dotStates.value = makeFlags(DOTS_PER_ARC * 2, true)
        chipIn.value = true
        dollarIn.value = true
        cardsIn.value = [true, true]
        starsIn.value = [true, true]
        brandIn.value = true
        trackIn.value = true
        fillIn.value = true
        loopStarted.value = false
        at(600, () => { leaving.value = true })
        at(1000, goNext)
        return
    }

    at(60, () => { loaded.value = true })
    at(120, () => { orbitIn.value = true })

    // 红点沿环逐个点亮
    for (let i = 0; i < DOTS_PER_ARC * 2; i++) {
        at(300 + i * 28, () => { dotStates.value[i] = true })
    }

    at(560, () => { chipIn.value = true })
    at(900, () => { dollarIn.value = true })
    at(1100, () => { cardsIn.value = [true, true] })
    at(1400, () => { starsIn.value[0] = true })
    at(1560, () => { starsIn.value[1] = true })
    at(1750, () => { brandIn.value = true })
    at(2100, () => { trackIn.value = true })
    at(2300, () => { fillIn.value = true })

    // 循环阶段：CSS keyframes 接管所有旋转
    at(2600, () => { loopStarted.value = true })

    at(3450, () => { leaving.value = true })
    at(3950, goNext)
}

const stopAll = (): void => {
    for (const t of timers) { clearTimeout(t) }
}

/* ================= class 绑定 ================= */
const splashClass = computed<string>(() => {
    let c = ''
    if (loaded.value) c += ' is-loaded'
    if (leaving.value) c += ' splash-leave'
    return c
})
const fieldClass = computed<string>(() => loopStarted.value ? ' is-loop' : '')

/* ================= 外层（环 + 点 + 牌 + 星） ================= */
const orbitStyle = computed(() => orbitIn.value
    ? 'opacity:1;transform:rotate(0deg) scale(1);'
    : 'opacity:0;transform:rotate(-24deg) scale(0.82);')

function dotStyle (deg: number, on: boolean): string {
    const rot = 'rotate(' + deg + 'deg)'
    const undo = ' rotate(-' + deg + 'deg)'
    const scale = on ? 1 : 0
    return 'opacity:' + (on ? 1 : 0) + ';' +
        'transform:' + rot + ' translateY(-' + DOT_ORBIT + 'rpx)' + undo + ' scale(' + scale + ');'
}

/* ================= 筹码 ================= */
const chipStyle = computed(() => {
    const scale = chipIn.value ? 1 : 0.3
    const rot = chipIn.value ? 0 : -180
    return 'transform:scale(' + scale + ') rotate(' + rot + 'deg);' +
        'opacity:' + (chipIn.value ? 1 : 0) + ';'
})

const signStyle = computed(() => {
    const on = dollarIn.value
    return 'opacity:' + (on ? 1 : 0) + ';' +
        'transform:translateY(' + (on ? '0rpx' : '18rpx') + ') scale(' + (on ? 1 : 0.85) + ');'
})

/* ================= 双 A 牌 / 红星 ================= */
function cardStyle (isBR: boolean): string {
    const idx = isBR ? 1 : 0
    // 两张牌都沿左上-右下对角线方向倾斜（"\"），贴合圆环缺口走向
    const tilt = 22
    if (!cardsIn.value[idx]) {
        const d = isBR ? '130rpx' : '-130rpx'
        return 'opacity:0;transform:translate(' + d + ',' + d + ') rotate(' + (tilt * 2) + 'deg);'
    }
    return 'opacity:1;transform:translate(0rpx,0rpx) rotate(' + tilt + 'deg);'
}

function starStyle (idx: number): string {
    return starsIn.value[idx]
        ? 'opacity:1;transform:scale(1);'
        : 'opacity:0;transform:scale(0);'
}

/* ================= 品牌文字 / 进度条 ================= */
const brandWrapStyle = computed(() => fadeUp(brandIn.value, '36rpx'))
const brandStyle = computed(() => {
    const on = brandIn.value
    return 'opacity:' + (on ? 1 : 0) + ';' +
        'transform:translateY(' + (on ? '0rpx' : '32rpx') + ') scale(' + (on ? 1 : 0.94) + ');'
})
const trackStyle = computed(() => 'opacity:' + (trackIn.value ? 1 : 0) + ';')
const fillStyle = computed(() => 'width:' + (fillIn.value ? '220rpx' : '0rpx') + ';')

function fadeUp (on: boolean, distance: string): string {
    return on
        ? 'opacity:1;transform:translateY(0rpx);'
        : ('opacity:0;transform:translateY(' + distance + ');')
}

/* ================= 生命周期 ================= */
onLoad(() => {
    // 检测系统"减弱动态效果"偏好
    // #ifdef H5
    try {
        reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch (e) {
        reduced.value = false
    }
    // #endif

    // 是否需要展示，已由 App.vue 的 splash 中间件决定：只有整包重载（冷启动 / H5 刷新 /
    // 直链）才会走到这个页面，程序内部跳转不会进来，因此这里直接播放即可
    play()
})

onUnload(() => {
    stopAll()
})
</script>

<style scoped>
/* ==================================================================
   配色：夜空 #05070C → #17233A / #1F2A3D 藏青 / #C8102E 正红 / #FFFFFF 白
   背景为星空夜色，前景文字与进度条随之翻亮（见下文 .brand-name / .track）
   ================================================================== */
.splash {
    position: relative;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    /* 夜空底色：顶部近黑、向下过渡到品牌藏青，与其余页面的 #0B0D0C 衔接。
       注意：App 端只认 linear-gradient(方向, 起色, 止色) 三参数格式 */
    background-color: #05070C;
    background-image: linear-gradient(to bottom, #05070C, #17233A);
    overflow: hidden;
    opacity: 0.96;
    transition-property: opacity;
    transition-duration: 0.5s;
    transition-timing-function: ease-out;
}
.splash.is-loaded { opacity: 1; }
.splash.splash-leave {
    opacity: 0;
    transition-duration: 0.5s;
    transition-timing-function: ease-in;
}

/* ---------------- 星空背景 ----------------
   底色在 .splash 上；这里只叠星云柔光与星点，随主视觉一起淡入 */
.sky {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
    opacity: 0;
    transition-property: opacity;
    transition-duration: 1.4s;
    transition-timing-function: ease-out;
}
.splash.is-loaded .sky { opacity: 1; }

/* 星云：左下正红、右上深蓝（呼应品牌红与藏青），中心再垫一层冷白柔光托住主视觉。
   外发光用 box-shadow 打底（App / H5 都支持），radial-gradient 是 H5 上更细腻的加强层，
   App 端会忽略无法识别的 background-image，只留外发光 */
.sky-nebula { position: absolute; border-radius: 50%; }
.neb-red {
    left: -260rpx;
    bottom: -220rpx;
    width: 1040rpx;
    height: 1040rpx;
    box-shadow: 0 0 220rpx 90rpx rgba(200, 16, 46, 0.14);
    background-image: radial-gradient(circle, rgba(200, 16, 46, 0.22) 0%, rgba(200, 16, 46, 0.09) 40%, rgba(200, 16, 46, 0) 72%);
}
.neb-blue {
    right: -300rpx;
    top: -240rpx;
    width: 1160rpx;
    height: 1160rpx;
    box-shadow: 0 0 240rpx 100rpx rgba(70, 120, 205, 0.16);
    background-image: radial-gradient(circle, rgba(70, 120, 205, 0.26) 0%, rgba(70, 120, 205, 0.09) 42%, rgba(70, 120, 205, 0) 74%);
}
.neb-halo {
    left: 50%;
    top: 42%;
    width: 1320rpx;
    height: 1320rpx;
    margin-left: -660rpx;
    margin-top: -660rpx;
    box-shadow: 0 0 260rpx 120rpx rgba(120, 160, 230, 0.10);
    background-image: radial-gradient(circle, rgba(158, 190, 255, 0.16) 0%, rgba(120, 160, 230, 0.05) 46%, rgba(0, 0, 0, 0) 74%);
}

/* 星点层：四周各外扩 40rpx，缓慢平移时不会露出空白边缘 */
.sky-stars {
    position: absolute;
    left: -40rpx;
    top: -40rpx;
    right: -40rpx;
    bottom: -40rpx;
    animation: sky-drift 36s ease-in-out infinite alternate;
}
.sky-star {
    position: absolute;
    border-radius: 50%;
    background-color: #FFFFFF;
}
/* 亮星：外发光 + 呼吸闪烁，相位由行内 animation-delay 各自错开
   （不写扩散半径：HarmonyOS 不支持 box-shadow 的第四个长度值） */
.sky-star.is-twinkle {
    box-shadow: 0 0 16rpx rgba(206, 226, 255, 0.70);
    animation: sky-twinkle 3s ease-in-out infinite;
}

.stage {
    position: relative;
    z-index: 2;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    /* uvue 默认 overflow: hidden：这里不能裁，否则牌从环外飞入时会被切出直边 */
    overflow: visible;
}

/* ---------------- 舞台 ---------------- */
.field {
    position: relative;
    width: 720rpx;
    height: 720rpx;
    align-items: center;
    justify-content: center;
    /* 同上：牌在入场动画里会飞出 720×720 的舞台，不能被裁 */
    overflow: visible;
}

/* ---------------- 旋转外层 ---------------- */
.orbit {
    position: absolute;
    left: 0;
    top: 0;
    width: 720rpx;
    height: 720rpx;
    z-index: 1;
    /* 同上：不裁子元素，牌/星旋转与飞入时都要完整 */
    overflow: visible;
    transition-property: transform, opacity;
    transition-duration: 1.1s;
    transition-timing-function: cubic-bezier(0.45, 0, 0.55, 1);
}

/* 红环：conic-gradient 留出左上(280°~350°)/右下(100°~170°)各 70° 缺口，
   mask 裁成 20rpx(≈10px) 厚的圆环 */
.ring {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 640rpx;
    height: 640rpx;
    margin-left: -320rpx;
    margin-top: -320rpx;
    border-radius: 50%;
    background: conic-gradient(from 0deg,
        #C8102E 0deg, #C8102E 100deg,
        transparent 100deg, transparent 170deg,
        #C8102E 170deg, #C8102E 280deg,
        transparent 280deg, transparent 350deg,
        #C8102E 350deg, #C8102E 360deg);
    -webkit-mask: radial-gradient(circle, transparent 300rpx, #000 300rpx, #000 320rpx, transparent 320rpx);
    mask: radial-gradient(circle, transparent 300rpx, #000 300rpx, #000 320rpx, transparent 320rpx);
}

/* 红点：直径 8rpx(半径≈2px)，轨道半径 276rpx（环内侧让 10px） */
.dot {
    position: absolute;
    left: 50%;
    top: 50%;
    margin-left: -4rpx;
    margin-top: -4rpx;
    width: 8rpx;
    height: 8rpx;
    border-radius: 50%;
    background-color: #C8102E;
    transition-property: opacity, transform;
    transition-duration: 0.4s;
    transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 牌/星锚点：随 orbit 公转，均落在圆环轨道（半径 310rpx）上
   牌居缺口中心（对角线 315°/135°），星靠缺口另一端（342°/162°）

   ⚠️ 牌会被 rotate(22deg)，旋转后的外接矩形约 174×201rpx，比牌本身（120×168）大一圈。
   uni-app x（uvue）的 overflow 默认是 hidden（与 Web 相反），锚点盒若仍按 120×168，
   牌的四个角连同角上的 A/花色都会被裁掉——浅色背景下看不出，换深色夜空后就很明显。
   因此锚点盒按外接矩形放宽到 180×206，中心保持 141,141 / 579,579 不变 */
.keeper { position: absolute; z-index: 5; overflow: visible; }
.k-tl-card { left: 51rpx; top: 38rpx; width: 180rpx; height: 206rpx; }
.k-br-card { right: 51rpx; bottom: 38rpx; width: 180rpx; height: 206rpx; }
.k-tl-star { left: 220rpx; top: 21rpx; width: 88rpx; height: 88rpx; }
.k-br-star { right: 220rpx; bottom: 21rpx; width: 88rpx; height: 88rpx; }

/* 反向补偿层：抵消 orbit 的公转，让牌面/星形保持直立。
   overflow: visible —— 牌旋转后必然超出盒子，不能被裁掉 */
.card-undo,
.star-undo {
    width: 100%;
    height: 100%;
    overflow: visible;
}
/* 牌在放宽后的锚点盒里居中，旋转中心仍与原位置一致 */
.card-undo {
    align-items: center;
    justify-content: center;
}

/* ---------------- 对角双 A 牌 ---------------- */
.a-card {
    position: relative;
    width: 120rpx;
    height: 168rpx;
    border-radius: 16rpx;
    background-color: #FFFFFF;
    border: 2rpx solid #D0D0D0;
    align-items: center;
    justify-content: center;
    transition-property: opacity, transform;
    transition-duration: 0.8s;
    transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}
.a-center { font-size: 64rpx; line-height: 1; }
.a-corner { position: absolute; font-weight: 700; line-height: 1; }
.a-tl-rank { left: 10rpx; top: 10rpx; font-size: 26rpx; }
.a-tl-suit { left: 10rpx; top: 36rpx; font-size: 24rpx; }
.a-br-rank { right: 10rpx; bottom: 10rpx; font-size: 26rpx; transform: rotate(180deg); }
.a-br-suit { right: 10rpx; bottom: 36rpx; font-size: 24rpx; transform: rotate(180deg); }
.ink-navy { color: #1F2A3D; }
.ink-red { color: #C8102E; }

/* ---------------- 红色四角星（尖锐长芒） ---------------- */
.star {
    position: relative;
    width: 88rpx;
    height: 88rpx;
    transition-property: opacity, transform;
    transition-duration: 0.5s;
    transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}
/* clip-path 四尖星：四芒顶到边界、腰部内收，形成细长尖角 */
.star-core {
    position: relative;
    width: 88rpx;
    height: 88rpx;
    background-color: #C8102E;
    -webkit-clip-path: polygon(50% 0%, 58% 42%, 100% 50%, 58% 58%, 50% 100%, 42% 58%, 0% 50%, 42% 42%);
    clip-path: polygon(50% 0%, 58% 42%, 100% 50%, 58% 58%, 50% 100%, 42% 58%, 0% 50%, 42% 42%);
}

/* ---------------- 德州筹码 ---------------- */
.chip {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 420rpx;
    height: 420rpx;
    margin-left: -210rpx;
    margin-top: -210rpx;
    z-index: 4;
    transform-origin: 50% 50%;
    transition-property: transform, opacity;
    transition-duration: 0.9s;
    transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}
.chip-body {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    border-radius: 50%;
    /* 平铺的 #1F2A3D 在夜空里会糊成一片：底色整体提亮一档保证 App 端也能看清，
       再叠一层受光渐变（H5 生效）做出立体感 */
    background-color: #2E3F68;
    background-image: radial-gradient(circle at 36% 28%, #3E5482 0%, #2A3A61 44%, #16213A 100%);
}

/* 外圈：白色弧形梯形块（扇环），6 块，与藏青底边缘留 12rpx 内间隔 */
.chip-edge {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 420rpx;
    height: 420rpx;
    margin-left: -210rpx;
    margin-top: -210rpx;
    border-radius: 50%;
    background: repeating-conic-gradient(#FFFFFF 0deg 36deg, transparent 36deg 60deg);
    -webkit-mask: radial-gradient(circle, transparent 158rpx, #000 158rpx, #000 198rpx, transparent 198rpx);
    mask: radial-gradient(circle, transparent 158rpx, #000 158rpx, #000 198rpx, transparent 198rpx);
}

/* 中圈：红白相间圆环，厚 12rpx(≈6px)，红白各 8 段 */
.chip-stripes {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 420rpx;
    height: 420rpx;
    margin-left: -210rpx;
    margin-top: -210rpx;
    border-radius: 50%;
    background: repeating-conic-gradient(#C8102E 0deg 22.5deg, #FFFFFF 22.5deg 45deg);
    -webkit-mask: radial-gradient(circle, transparent 133rpx, #000 133rpx, #000 145rpx, transparent 145rpx);
    mask: radial-gradient(circle, transparent 133rpx, #000 133rpx, #000 145rpx, transparent 145rpx);
}

/* 细红环：位于红白环内侧，间隔 8rpx(≈4px)，厚 2rpx(≈1px) */
.chip-fine {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 420rpx;
    height: 420rpx;
    margin-left: -210rpx;
    margin-top: -210rpx;
    border-radius: 50%;
    background-color: #C8102E;
    -webkit-mask: radial-gradient(circle, transparent 123rpx, #000 123rpx, #000 125rpx, transparent 125rpx);
    mask: radial-gradient(circle, transparent 123rpx, #000 123rpx, #000 125rpx, transparent 125rpx);
}

/* 中心藏青圆 */
.chip-inner {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 170rpx;
    height: 170rpx;
    margin-left: -85rpx;
    margin-top: -85rpx;
    border-radius: 50%;
    /* 比受光的筹码本体再暗一档，让中心圆凹进去 */
    background-color: #131D33;
    align-items: center;
    justify-content: center;
}
.chip-pulse {
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
}
.chip-sign {
    font-size: 200rpx;
    line-height: 208rpx;
    font-weight: 900;
    color: #FFFFFF;
    transition-property: opacity, transform;
    transition-duration: 0.55s;
    transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

/* ---------------- 品牌文字 ---------------- */
.brand {
    flex-direction: column;
    align-items: center;
    margin-top: 44rpx;
    transition-property: opacity, transform;
    transition-duration: 0.8s;
    transition-timing-function: ease-out;
}
.brand-name {
    font-size: 72rpx;
    font-weight: 900;
    /* 夜空底上藏青字不可见，翻白 */
    color: #FFFFFF;
    letter-spacing: 8rpx;
    transition-property: opacity, transform;
    transition-duration: 0.9s;
    transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

/* ---------------- 底部进度条 ---------------- */
.track {
    position: absolute;
    z-index: 3;
    left: 50%;
    bottom: 96rpx;
    width: 220rpx;
    height: 3rpx;
    margin-left: -110rpx;
    background-color: rgba(255, 255, 255, 0.16);
    transition-property: opacity;
    transition-duration: 0.5s;
    transition-timing-function: ease-out;
}
.track-fill {
    height: 3rpx;
    background-color: #C8102E;
    transition-property: width;
    transition-duration: 1.5s;
    transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

/* ================= 循环旋转动画（CSS keyframes 接管） ================= */
@keyframes orbit-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
@keyframes orbit-spin-rev {
    from { transform: rotate(0deg); }
    to { transform: rotate(-360deg); }
}
@keyframes star-twinkle {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.55; transform: scale(0.8); }
}

/* 星空：星点层极缓平移（视差）+ 亮星呼吸 */
@keyframes sky-drift {
    from { transform: translateY(0rpx); }
    to { transform: translateY(-34rpx); }
}
@keyframes sky-twinkle {
    0%, 100% { opacity: 0.28; }
    50% { opacity: 1; }
}

/* 外层整体 40s/圈；牌/星反向补偿保持直立 */
.field.is-loop .orbit { animation: orbit-spin 40s linear infinite; }
.field.is-loop .card-undo,
.field.is-loop .star-undo { animation: orbit-spin-rev 40s linear infinite; }

/* 筹码反向慢转 26s/圈，$ 再反向补偿保持直立 */
.field.is-loop .chip { animation: orbit-spin-rev 26s linear infinite; }
.field.is-loop .chip-pulse { animation: orbit-spin 26s linear infinite; }

/* 星星错相闪烁 */
.field.is-loop .star-core { animation: star-twinkle 2.2s ease-in-out infinite; }
.field.is-loop .k-br-star .star-core { animation-delay: -1.1s; }

/* 减弱动效：H5 端把过渡压到瞬时、关闭循环动画 */
@media (prefers-reduced-motion: reduce) {
    .splash,
    .sky,
    .orbit,
    .dot,
    .chip,
    .chip-sign,
    .a-card,
    .star,
    .brand,
    .brand-name,
    .track,
    .track-fill {
        transition-duration: 0.001s !important;
    }
    .orbit,
    .card-undo,
    .star-undo,
    .chip,
    .chip-pulse,
    .star-core,
    .sky-stars,
    .sky-star.is-twinkle {
        animation: none !important;
    }
}
</style>
