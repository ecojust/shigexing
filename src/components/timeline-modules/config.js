/**
 * 时间轴配置模块
 * 管理时间轴的基本配置和常量
 * 横轴: 时间（年份），纵轴: 诗人
 */

export const timelineConfig = {
  minYear: 600,
  maxYear: 1300,
  // 横向布局：宽度是时间轴，高度是诗人列表
  width: (window.innerWidth - 200) * 2, // 时间轴宽度
  height: 2000, // 诗人列表高度（按需扩展）
  margin: { top: 100, right: 100, bottom: 50, left: 150 },
  poetBarHeight: 40, // 每个诗人条的高度
  poetBarSpacing: 15, // 诗人之间的间距
  avatarSize: 44, // 头像尺寸
  singleRowLayout: true, // 单行布局：所有诗人曲线叠加在同一行
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
};

// 单行布局：一行固定高度，其余纵向空间留给人生曲线
export const updateTimelineHeight = () => {
  timelineConfig.height = timelineConfig.margin.top + 500 + timelineConfig.margin.bottom;
};
