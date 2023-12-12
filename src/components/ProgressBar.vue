<script lang="ts" setup>
defineProps<{ progress: number }>();
</script>

<template>
  <div class="shell">
    <div class="bar" :style="{ width: progress + '%' }">
      <span>{{ progress }}%</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "@/assets/styles/variables/_colors.scss";
.shell {
  height: 20px;
  width: 100%;
  border: 1px solid $progress-bar-border-color;
  border-radius: 13px;
  padding: 3px;
  margin: 20px auto;
}

.bar {
  background: $progress-bar-background-color;
  height: 20px;
  width: 15px;
  border-radius: 9px;
  span {
    float: right;
    padding: 4px 5px;
    color: $progress-bar-font-color;
    font-size: 0.7em;
  }
}
</style>
