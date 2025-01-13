import axios from 'axios';

// 检查是否在 GitHub Pages 环境
const isGitHubPages = window.location.hostname === 'minzf581.github.io';
const baseURL = isGitHubPages ? 'https://sandbox.ipipv.com' : 'http://localhost:3001';

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export default api;
