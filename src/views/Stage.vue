<template>
  <div class="stage">
    <Timeline />
  </div>
</template>

<script setup>
import Timeline from "@/components/TimelineSvg.vue";
</script>

<style lang="less">
.stage {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>