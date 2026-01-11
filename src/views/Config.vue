<template>
  <div class="config-container">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="人员配置" name="users">
        <div class="users-config">
          <el-table :data="users" height="300" border style="width: 100%">
            <el-table-column prop="name" label="姓名" width="120">
              <template #default="{ row }">
                <el-input v-model="row.name" placeholder="请输入姓名" />
              </template>
            </el-table-column>

            <el-table-column prop="desc" label="备注">
              <template #default="{ row }">
                <el-input
                  type="textarea"
                  v-model="row.desc"
                  placeholder="请输入备注"
                />
              </template>
            </el-table-column>

            <el-table-column label="操作" width="120">
              <template #default="{ $index }">
                <el-button type="danger" @click="removeUser($index)"
                  >删除</el-button
                >
              </template>
            </el-table-column>
          </el-table>
          <div class="actions">
            <el-button type="primary" @click="addUser">添加人员</el-button>
            <el-button type="success" @click="saveUsers">保存</el-button>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="班次设置" name="schedules">
        <div class="schedules-config">
          <el-table :data="schedules" height="300" border style="width: 100%">
            <el-table-column prop="key" label="班次代码" width="120">
              <template #default="{ row }">
                <el-input
                  v-model="row.value"
                  :disabled="row.value == 'vacation'"
                  placeholder="请输入代码"
                />
              </template>
            </el-table-column>
            <el-table-column prop="label" label="班次内容">
              <template #default="{ row }">
                <el-input
                  v-model="row.label"
                  :disabled="row.value == 'vacation'"
                  placeholder="请输入班次名称"
                />
              </template>
            </el-table-column>

            <el-table-column prop="label" label="班次标记颜色">
              <template #default="{ row }">
                <el-color-picker v-model="row.color" size="large" />
              </template>
            </el-table-column>

            <el-table-column label="操作" width="120">
              <template #default="{ $index }">
                <el-button
                  type="danger"
                  :disabled="$index == 0"
                  @click="removeSchedule($index)"
                  >删除</el-button
                >
              </template>
            </el-table-column>
          </el-table>
          <div class="actions">
            <el-button type="primary" @click="addSchedule">添加班次</el-button>
            <el-button type="success" @click="saveSchedules">保存</el-button>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="规则设置" name="rules">
        <div class="rules-config">
          <div class="rule-section">
            <h3>连续工作规则</h3>
            <el-form :model="ruleForm" label-width="150px">
              <!-- <el-form-item label="最大连续上班天数">
                <el-input-number
                  v-model="ruleForm.maxConsecutiveDays"
                  :min="1"
                  :max="14"
                />
              </el-form-item> -->
              <el-form-item label="月休息天数" label-width="150px">
                <el-input-number
                  v-model="ruleForm.restDays"
                  :min="1"
                  :max="20"
                />
              </el-form-item>
            </el-form>
          </div>

          <div class="rule-section">
            <h3>相邻班次限制</h3>
            <el-table
              :data="noLinkRules"
              height="180"
              border
              style="width: 100%"
            >
              <el-table-column label="前一天班次">
                <template #default="{ row }">
                  <el-select v-model="row.last" placeholder="选择班次">
                    <el-option
                      v-for="item in schedules"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="本次班次不能为">
                <template #default="{ row }">
                  <el-select v-model="row.now" placeholder="选择班次">
                    <el-option
                      v-for="item in schedules"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120">
                <template #default="{ $index }">
                  <el-button type="danger" @click="removeNoLinkRule($index)"
                    >删除</el-button
                  >
                </template>
              </el-table-column>
            </el-table>
            <div class="actions">
              <el-button type="primary" @click="addNoLinkRule"
                >添加规则</el-button
              >
              <el-button type="success" @click="saveRules">保存</el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import User from "../service/users";
import Schedule from "../service/schedules";
import Rule from "../service/rules";

const activeTab = ref("users");
const users = ref([]);
const schedules = ref([]);
const noLinkRules = ref([]);
const ruleForm = ref({
  maxConsecutiveDays: 0,
  restDays: 0,
});

// Users
const addUser = () => {
  users.value.push({
    name: "",
    desc: "",
  });
};

const removeUser = (index: number) => {
  users.value.splice(index, 1);
};

const saveUsers = async () => {
  await User.setUsers(users.value);
  ElMessage({
    message: "保存成功",
    type: "success",
  });
};

// Schedules
const addSchedule = () => {
  schedules.value.push({
    value: "",
    label: "",
    color: "#409EFF",
  });
};

const removeSchedule = (index: number) => {
  schedules.value.splice(index, 1);
};

const saveSchedules = async () => {
  await Schedule.setSchedules(schedules.value);
  ElMessage({
    message: "保存成功",
    type: "success",
  });
};

// Rules
const addNoLinkRule = () => {
  noLinkRules.value.push({
    last: "",
    now: "",
  });
};

const removeNoLinkRule = (index: number) => {
  noLinkRules.value.splice(index, 1);
};

const saveRules = async () => {
  // TODO: Implement rule saving logic
  await Rule.setNoLink(noLinkRules.value);
  await Rule.setRest(ruleForm.value.restDays);
  ElMessage({
    message: "保存成功",
    type: "success",
  });
};

onMounted(async () => {
  console.log("Config mounted");
  users.value = await User.getUsers();
  schedules.value = await Schedule.getSchedules();
  noLinkRules.value = await Rule.getNoLink();
  ruleForm.value = {
    maxConsecutiveDays: await Rule.getMaxConsecutiveDays(),
    restDays: await Rule.getRest(),
  };
});
</script>

<style lang="less" scoped>
.config-container {
  padding: 20px;

  .actions {
    margin-top: 20px;
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }

  .rule-section {
    margin-bottom: 30px;

    h3 {
      margin-bottom: 20px;
      font-size: 16px;
      font-weight: 500;
    }
  }

  :deep(.el-tabs__content) {
    padding: 20px 0;
  }
}
</style>
