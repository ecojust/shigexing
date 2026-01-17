/**
 * 时间轴配置模块
 * 管理时间轴的基本配置和常量
 */

export const timelineConfig = {
  minYear: 600,
  maxYear: 1300,
  width: (window.innerWidth - 200) * 2,
  height: (window.innerHeight - 100) * 2,
  margin: { top: 50, right: 100, bottom: 50, left: 100 },
  poetBarWidth: 80,
  poetBarSpacing: 60,
};

// 朝代数据配置
export const dynasties = [
  { name: "唐朝", start: 618, end: 907, color: 0xff6b9d },
  { name: "五代十国", start: 907, end: 960, color: 0x6c5ce7 },
  { name: "北宋", start: 960, end: 1127, color: 0x0fb9b1 },
  { name: "南宋", start: 1127, end: 1279, color: 0x3867d6 },
];

// 诗人类别颜色映射
export const poetColorMap = {
  初唐四杰: 0xff9999,
  诗歌革新派: 0xff6666,
  浪漫主义: 0xff3333,
  现实主义: 0xcc3333,
  山水田园派: 0x66cc66,
  边塞诗派: 0x996633,
  古文运动: 0x6699cc,
  新乐府运动: 0x3366cc,
  咏史怀古: 0x9966cc,
  象征派: 0x663399,
  咏史抒怀: 0x996699,
  花间派: 0xcc6699,
  婉约派: 0xff99cc,
  豪放派: 0xff6600,
  政治诗派: 0x666666,
  江西诗派: 0x669999,
  爱国诗派: 0xcc0000,
  诚斋体: 0x99cc99,
  田园诗派: 0x66cc99,
};

// 更新配置的方法
export const updateTimelineConfig = () => {
  timelineConfig.width = (window.innerWidth - 200) * 2;
  timelineConfig.height = (window.innerHeight - 100) * 2;
};
