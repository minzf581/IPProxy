<template>
  <router-view />
</template>

<script setup>
// App root component
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  height: 100vh;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

/* Element Plus 暗色模式适配 */
html.dark {
  color-scheme: dark;
}
</style>
