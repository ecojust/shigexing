/**
 * 数据处理模块
 * 处理和整合各种时间轴数据
 */

import tangTimeline from "../../timeline/tang.js";
import northSongTimeline from "../../timeline/northsong.js";
import southSongTimeline from "../../timeline/southsong.js";
import fiveDynastiesTimeline from "../../timeline/fivedynasties.js";

/**
 * 合并所有朝代的帝皇数据
 * @returns {Array} 所有帝皇数据的数组
 */
export const getAllEmperors = () => {
  const allEmperors = [];

  // 唐朝皇帝
  tangTimeline.forEach((emperor) => {
    allEmperors.push({
      name: emperor.title,
      fullName: emperor.name,
      dynasty: "唐朝",
      start: emperor.from,
      end: emperor.to,
      description: emperor.description,
      color: 0xff6b9d,
    });
  });

  // 五代十国
  fiveDynastiesTimeline.forEach((emperor) => {
    allEmperors.push({
      name: emperor.title,
      fullName: emperor.name,
      dynasty: "五代十国",
      start: emperor.from,
      end: emperor.to,
      description: emperor.description,
      color: 0x6c5ce7,
    });
  });

  // 北宋皇帝
  northSongTimeline.forEach((emperor) => {
    allEmperors.push({
      name: emperor.title,
      fullName: emperor.name,
      dynasty: "北宋",
      start: emperor.from,
      end: emperor.to,
      description: emperor.description,
      color: 0x0fb9b1,
    });
  });

  // 南宋皇帝
  southSongTimeline.forEach((emperor) => {
    allEmperors.push({
      name: emperor.title,
      fullName: emperor.name,
      dynasty: "南宋",
      start: emperor.from,
      end: emperor.to,
      description: emperor.description,
      color: 0x3867d6,
    });
  });

  return allEmperors;
};

/**
 * 按出生年份排序诗人数据
 * @param {Array} poets - 诗人数据数组
 * @returns {Array} 排序后的诗人数据
 */
export const sortPoetsByBirth = (poets) => {
  return [...poets].sort((a, b) => a.birth - b.birth);
};

/**
 * 根据搜索条件过滤诗人
 * @param {Array} poets - 诗人数据数组
 * @param {string} query - 搜索关键词
 * @returns {Array} 过滤后的诗人数据
 */
export const filterPoets = (poets, query) => {
  if (!query.trim()) return poets;

  return poets.filter(
    (poet) =>
      poet.name.includes(query) ||
      poet.dynasty.includes(query) ||
      poet.category.includes(query)
  );
};

/**
 * 查找指定名称的诗人
 * @param {Array} poets - 诗人数据数组
 * @param {string} name - 诗人姓名
 * @returns {Object|null} 找到的诗人对象或null
 */
export const findPoetByName = (poets, name) => {
  return poets.find((poet) => poet.name.includes(name)) || null;
};
