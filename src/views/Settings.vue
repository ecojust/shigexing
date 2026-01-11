<template>
  <div class="settings-container">
    <h1>设置</h1>
    <div class="settings-content">
      <div class="setting-item">
        <label>主题设置</label>
        <select v-model="theme">
          <option value="light">浅色</option>
          <option value="dark">深色</option>
          <option value="auto">自动</option>
        </select>
      </div>

      <div class="setting-item">
        <label>语言设置</label>
        <select v-model="language">
          <option value="zh">中文</option>
          <option value="en">English</option>
        </select>
      </div>

      <div class="setting-item">
        <label>通知设置</label>
        <input type="checkbox" v-model="notifications" />
        <span>启用通知</span>
      </div>

      <!-- 文件操作测试 -->
      <div class="setting-item">
        <h3>文件操作测试</h3>
        <textarea
          v-model="fileContent"
          placeholder="输入要保存的内容"
        ></textarea>
        <div class="file-actions">
          <button @click="saveFile">保存到文件</button>
          <button @click="readFile">读取文件</button>
        </div>
      </div>
    </div>

    <div class="actions">
      <button @click="saveSettings" class="save-btn">保存设置</button>
      <router-link to="/" class="back-btn">返回日历</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { invoke } from "@tauri-apps/api/tauri";

const theme = ref("light");
const language = ref("zh");
const notifications = ref(true);
const fileContent = ref("");

const saveSettings = () => {
  // 这里可以添加保存设置的逻辑
  alert("设置已保存");
};

const saveFile = async () => {
  try {
    // 保存到用户的文档目录下
    const result = await invoke("write_file", {
      path: "./test.txt",
      content: fileContent.value,
    });
    alert("文件保存成功！");
  } catch (error) {
    alert(`保存失败: ${error}`);
  }
};

const readFile = async () => {
  try {
    const content = await invoke("read_file", {
      path: "./test.txt",
    });
    fileContent.value = content as string;
  } catch (error) {
    alert(`读取失败: ${error}`);
  }
};
</script>

<style scoped>
.settings-container {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 30px;
  text-align: center;
}

.settings-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.setting-item {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.setting-item label {
  min-width: 100px;
  font-weight: 500;
}

.setting-item select,
.setting-item input[type="checkbox"] {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.setting-item textarea {
  width: 100%;
  height: 100px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}

.file-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.file-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #4caf50;
  color: white;
  cursor: pointer;
}

.file-actions button:hover {
  background-color: #45a049;
}

.actions {
  margin-top: 30px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.save-btn,
.back-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.save-btn {
  background-color: #007bff;
  color: white;
}

.save-btn:hover {
  background-color: #0056b3;
}

.back-btn {
  background-color: #6c757d;
  color: white;
}

.back-btn:hover {
  background-color: #545b62;
}
</style>
