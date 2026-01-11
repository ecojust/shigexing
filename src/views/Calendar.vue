<template>
  <div class="calendar-container">
    <!-- <ContributionGraph :plan-data="realPlan" :schedules="workTypes" /> -->
    <div class="calendar-header">
      <button class="nav-button" @click="previousMonth">&lt;</button>
      <span class="month-title">{{ currentYear }}年{{ currentMonth }}月</span>
      <button class="nav-button" @click="nextMonth">&gt;</button>

      <el-button class="start-button" circle round @click="startScheduling">
        <el-icon><CaretRight /></el-icon>
      </el-button>

      <el-button class="setting-button" circle round @click="showSettings">
        <el-icon><Setting /></el-icon>
      </el-button>
    </div>
    <div class="calendar-table-container">
      <el-table :data="tableData" border style="width: 100%">
        <el-table-column prop="name" label="Name" width="80" fixed>
          <template #header>
            <div class="date-header" style="width: 120px">Name</div>
          </template>
          <template #default="scope">
            <div class="cell-content" style="width: 120px">
              <b class="user-name">{{ scope.row.name }}</b>

              <div style="text-align: center">
                <div class="work-details" v-for="t in workTypes" :key="t.value">
                  <span class="work-details-label">{{ t.label }}</span>
                  <span class="work-details-value">{{
                    getCount(scope.row.name, t.value)
                  }}</span>
                </div>
                <!-- <el-popover placement="right" width="200" trigger="click">
                  <template #reference>
                    <el-icon><Histogram /></el-icon>
                  </template>
                  <div
                    class="work-details"
                    v-for="t in workTypes"
                    :key="t.value"
                  >
                    <span class="work-details-label">{{ t.label }}</span>
                    <span class="work-details-value">{{
                      getCount(scope.row.name, t.value)
                    }}</span>
                  </div>
                </el-popover> -->
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="date"
          :label="day.day + ''"
          width="180"
          v-for="day in days"
          :key="day.day"
        >
          <template #header>
            <div class="date-header" style="width: 180px">
              <span class="day-number">{{ day.day }}</span>
              <span class="weekday">{{ day.weekday }}</span>
            </div>
          </template>
          <template #default="scope">
            <div class="cell-content" style="width: 180px">
              <div class="cell-rule">
                <span class="rule-name">个人计划</span>
                <el-select
                  @change="ruleChange"
                  v-model="planData[scope.row.name][`${day.day}`]"
                  class="plan-select"
                  placeholder="选择计划"
                  size="small"
                >
                  <el-option
                    v-for="type in workTypes"
                    :key="type.value"
                    :label="type.label"
                    :value="type.value"
                  />
                </el-select>
              </div>
              <div class="cell-rule">
                <span class="rule-name">实际：</span>

                <b
                  :style="{
                    background: renderworkTypeColor(
                      realPlan[scope.row.name][`${day.day}`]
                    ),
                  }"
                  >{{
                    renderworkType(realPlan[scope.row.name][`${day.day}`])
                  }}</b
                >
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 设置对话框 -->
    <el-dialog
      v-model="settingsVisible"
      title="排班设置"
      width="60%"
      :destroy-on-close="false"
      :close-on-click-modal="false"
      center
      align-center
    >
      <Config v-if="showConfig" />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeConfig">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElLoading } from "element-plus";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import random from "randomize";
import User from "../service/users";
import Schedule from "../service/schedules";
import Rule from "../service/rules";
import Config from "./Config.vue";
import ContributionGraph from "../components/ContributionGraph.vue";

const settingsVisible = ref(false);
const showConfig = ref(false);

const showSettings = () => {
  showConfig.value = true;
  settingsVisible.value = true;
};

// 设置为中文
dayjs.locale("zh-cn");
// 当前年份和月份
const currentYear = ref(dayjs().year());
const currentMonth = ref(dayjs().month() + 1);

const workTypes = ref(Schedule.getSchedules());
const tableData = ref([]);

// 计算当月的天数和对应的星期
const days = computed(() => {
  const daysInMonth = dayjs(
    `${currentYear.value}-${currentMonth.value}`
  ).daysInMonth();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = dayjs(`${currentYear.value}-${currentMonth.value}-${day}`);
    return {
      day,
      weekday: date.format("ddd"), // 星期几的中文简写
    };
  });
});

// 存储计划数据
const planData = ref({});
const realPlan = ref({});

const people = computed(() => tableData.value.map((item) => item.name));

const resetRules = () => {
  people.value.forEach((person) => {
    planData.value[person] = {};
  });
};

const resetPlans = () => {
  people.value.forEach((person) => {
    realPlan.value[person] = {};
  });
};

const initAll = async () => {
  const loadingInstance = ElLoading.service();
  workTypes.value = await Schedule.getSchedules();
  tableData.value = await User.getUsers();
  resetRules();
  resetPlans();
  loadingInstance.close();
};

const getCount = (person, type) => {
  let count = 0;
  days.value.forEach((day) => {
    if (
      realPlan.value[person] &&
      realPlan.value[person][`${day.day}`] === type
    ) {
      count++;
    }
  });
  return count;
};

const renderworkType = (value) => {
  const type = workTypes.value.find((type) => type.value === value);
  return type ? type.label : "请排班";
};

const renderworkTypeColor = (value) => {
  const type = workTypes.value.find((type) => type.value === value);
  return type ? type.color : "";
};

let restDays = 0;
let rule1 = [];
const startScheduling = async () => {
  resetPlans();
  restDays = await Rule.getRest();
  rule1 = await Schedule.getSchedules();
  people.value.forEach((person) => {
    days.value.forEach((day) => {
      autoSchedule(day.day, person);
    });
  });
  console.log("排班完成", realPlan.value);
};

const autoSchedule = (day, person) => {
  // 如果有个人计划，设置为"个人计划"
  if (planData.value[person][day]) {
    realPlan.value[person][`${day}`] = planData.value[person][day];
    console.log("有个人计划，按计划排班", person, planData.value[person][day]);
    return;
  } else {
    const radomValue = random(workTypes.value.map((type) => type.value));
    realPlan.value[person][`${day}`] = radomValue;

    switch (day) {
      default:
        var lastday = day - 1;
        //1.互斥规则
        for (var r in rule1) {
          if (
            realPlan.value[person][`${lastday}`] == r.last &&
            radomValue == r.now
          ) {
            autoSchedule(day, person);
            return;
          }
        }

        // 2.休假天数规则
        let vacationDays = 0;
        const vacationDaykey = "vacation";
        const daysCount = days.value.length;

        // 统计所有已经排班的休假天数（包括当前和之前的天数）
        for (let d = 1; d <= daysCount; d++) {
          if (realPlan.value[person][`${d}`] === vacationDaykey) {
            vacationDays++;
          }
        }
        const remainingDays = daysCount - day + 1; // 包括当前天在内的剩余天数
        const remainingVacations = restDays - vacationDays;
        // 如果已经达到或超过休假天数限制，不能再安排休假
        if (vacationDays >= restDays && radomValue === vacationDaykey) {
          autoSchedule(day, person);
          return;
        }

        // 如果剩余天数等于剩余休假天数，必须安排休假，再不休就没得休了
        if (remainingVacations > 0 && remainingVacations === remainingDays) {
          realPlan.value[person][`${day}`] = vacationDaykey;
          console.log(
            `${day} 剩余天数(${remainingDays})等于剩余休假天数(${remainingVacations})，必须安排休息`
          );
          return;
        }

        // 如果剩余休假天数大于0但小于剩余天数，根据概率决定是否安排休假
        if (remainingVacations > 0 && remainingVacations < remainingDays) {
          const probability = remainingVacations / remainingDays;
          if (Math.random() < probability && radomValue !== vacationDaykey) {
            realPlan.value[person][`${day}`] = vacationDaykey;
            console.log(`${day} 根据概率(${probability})自动安排休息`);
            return;
          }
        }
        console.log(`${day} 没有个人计划，自动排班${radomValue}`);

        return;
    }
  }
};

const previousMonth = () => {
  const date = dayjs(`${currentYear.value}-${currentMonth.value}-01`).subtract(
    1,
    "month"
  );
  currentYear.value = date.year();
  currentMonth.value = date.month() + 1;
  initAll();
};

const nextMonth = () => {
  const date = dayjs(`${currentYear.value}-${currentMonth.value}-01`).add(
    1,
    "month"
  );
  currentYear.value = date.year();
  currentMonth.value = date.month() + 1;
  initAll();
};

const ruleChange = (value) => {
  console.log("Selected plan:", planData.value);
};

const closeConfig = () => {
  settingsVisible.value = false;
  showConfig.value = false;
  initAll();
};

onMounted(() => {
  initAll();
});
</script>

<style lang="less">
// 变量定义
@primary-color: #409eff;
@border-color: #ddd;
@text-color: #333;
@text-light-color: #666;
@background-color: #fff;

.calendar-container {
  max-width: 1200px;
  margin: 0 auto;
  height: 100vh;
  border: 1px solid @border-color;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;

  .calendar-header {
    padding: 20px;
    background: @background-color;
    border-bottom: 1px solid @border-color;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;

    position: relative;

    .nav-button {
      border: none;
      background: none;
      font-size: 18px;
      cursor: pointer;
      padding: 5px 10px;
    }

    .month-title {
      font-size: 18px;
      font-weight: bold;
      color: black;
    }
    .start-button {
      position: absolute;
      right: 50px;
      background: #44c662;
      color: white;
    }
    .setting-button {
      position: absolute;
      right: 10px;
      background: #4466ff;
      color: white;
    }
  }

  .calendar-table-container {
    flex: 1;
    padding: 0 20px;
    overflow: hidden;

    .date-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;

      .day-number {
        font-size: 14px;
        font-weight: bold;
        color: @text-color;
      }

      .weekday {
        font-size: 12px;
        color: @text-light-color;
      }
    }

    .cell-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      .cell-rule {
        display: flex;
        align-items: center;
        gap: 8px;
        .rule-name {
          font-size: 12px;
          color: @text-color;
          width: 80px;
        }
        b {
          font-size: 12px;
          color: @text-color;
          width: 180px;
          border-radius: 4px;
          display: inline-block;
          text-align: center;
        }
      }
    }

    .plan-select {
      width: 100%;
    }
  }

  .configuration {
    padding: 20px;
    background: #f9f9f9;
    border-top: 1px solid @border-color;
    display: flex;
    justify-content: space-between;

    .work-type {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .el-tag {
        font-size: 12px;
      }
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      align-items: center;

      .el-button {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }
}

.work-details {
  display: flex;
  flex-direction: roww;
  justify-content: space-between;
}
</style>
