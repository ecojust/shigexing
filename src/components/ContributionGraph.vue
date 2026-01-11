# 创建一个新的组件用于显示贡献热图
<template>
  <div class="contribution-graph">
    <div class="months">
      <div v-for="month in months" :key="month" class="month-label">
        {{ month }}
      </div>
    </div>
    <div class="graph-container">
      <div
        v-for="(weekday, index) in weekdays"
        :key="index"
        class="weekday-label"
      >
        {{ weekday }}
      </div>
      <div class="cells">
        <div
          v-for="(day, index) in days"
          :key="index"
          class="cell"
          :style="{ backgroundColor: getCellColor(day.value) }"
          :title="getCellTitle(day)"
        ></div>
      </div>
    </div>
    <div class="legend">
      <span>Less</span>
      <div class="legend-cells">
        <div
          v-for="(level, index) in colorLevels"
          :key="index"
          class="legend-cell"
          :style="{ backgroundColor: level }"
        ></div>
      </div>
      <span>More</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import dayjs from "dayjs";

const props = defineProps({
  planData: {
    type: Object,
    required: true,
  },
  schedules: {
    type: Array,
    required: true,
  },
});

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const weekdays = ["Mon", "Wed", "Fri"];

const colorLevels = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];

// 计算要显示的天数数据
const days = computed(() => {
  const result = [];
  const startDate = dayjs().subtract(51, "week").startOf("week");

  for (let week = 0; week < 52; week++) {
    for (let day = 0; day < 7; day++) {
      const currentDate = startDate.add(week * 7 + day, "day");
      const dateStr = currentDate.format("YYYY-MM-DD");

      // 获取所有用户在这一天的排班情况
      const daySchedules = Object.values(props.planData)
        .map((userPlan) => {
          const dayKey = currentDate.date().toString();
          return userPlan[dayKey];
        })
        .filter(Boolean);

      result.push({
        date: dateStr,
        value: daySchedules.length, // 使用当天排班的人数作为活跃度
      });
    }
  }

  return result;
});

// 获取单元格的颜色
const getCellColor = (value) => {
  if (!value) return colorLevels[0];
  const index = Math.min(Math.floor(value / 2), colorLevels.length - 1);
  return colorLevels[index];
};

// 获取单元格的提示文本
const getCellTitle = (day) => {
  return `${day.value} contributions on ${day.date}`;
};
</script>

<style scoped>
.contribution-graph {
  padding: 20px;
  font-size: 12px;
}

.months {
  display: flex;
  margin-left: 20px;
  padding-bottom: 10px;
}

.month-label {
  width: calc(100% / 12);
  text-align: center;
  color: #7d8590;
}

.graph-container {
  display: flex;
  gap: 2px;
}

.weekday-label {
  color: #7d8590;
  width: 20px;
  text-align: right;
  padding-right: 4px;
}

.cells {
  display: grid;
  grid-template-columns: repeat(52, 1fr);
  gap: 2px;
  flex: 1;
}

.cell {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background-color: #161b22;
}

.legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 20px;
  color: #7d8590;
}

.legend-cells {
  display: flex;
  gap: 2px;
}

.legend-cell {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}
</style>
