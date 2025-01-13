/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @returns 是否复制成功
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      // 对于 HTTPS 环境，使用现代的 Clipboard API
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 对于非 HTTPS 环境，使用传统方法
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        textArea.remove();
        return true;
      } catch (err) {
        console.error('复制失败:', err);
        textArea.remove();
        return false;
      }
    }
  } catch (err) {
    console.error('复制失败:', err);
    return false;
  }
};
