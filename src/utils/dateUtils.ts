import dayjs from 'dayjs';

/**
 * 格式化日期时间
 * @param date 日期时间字符串或Date对象
 * @returns 格式化后的日期时间字符串
 */
export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

/**
 * 格式化日期
 * @param date 日期字符串或Date对象
 * @returns 格式化后的日期字符串
 */
export const formatDate = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

/**
 * 格式化时间
 * @param date 时间字符串或Date对象
 * @returns 格式化后的时间字符串
 */
export const formatTime = (date: string | Date): string => {
  return dayjs(date).format('HH:mm:ss');
};

/**
 * 格式化时长
 * @param minutes 分钟数
 * @returns 格式化后的时长字符串
 */
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours}小时${remainingMinutes > 0 ? ` ${remainingMinutes}分钟` : ''}`;
  }
  return `${minutes}分钟`;
};

/**
 * 获取相对时间
 * @param date 日期时间字符串或Date对象
 * @returns 相对时间字符串，如"3小时前"
 */
export const getRelativeTime = (date: string | Date): string => {
  if (!date) return '-';
  const now = dayjs();
  const target = dayjs(date);
  const diffMinutes = now.diff(target, 'minute');
  
  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  
  const diffHours = now.diff(target, 'hour');
  if (diffHours < 24) return `${diffHours}小时前`;
  
  const diffDays = now.diff(target, 'day');
  if (diffDays < 30) return `${diffDays}天前`;
  
  const diffMonths = now.diff(target, 'month');
  if (diffMonths < 12) return `${diffMonths}个月前`;
  
  return `${now.diff(target, 'year')}年前`;
};

/**
 * 获取日期范围
 * @param type 范围类型：'today' | 'week' | 'month' | 'year'
 * @returns [开始日期, 结束日期]
 */
export const getDateRange = (type: 'today' | 'week' | 'month' | 'year'): [Date, Date] => {
  const now = dayjs();
  
  switch (type) {
    case 'today':
      return [
        now.startOf('day').toDate(),
        now.endOf('day').toDate()
      ];
    case 'week':
      return [
        now.startOf('week').toDate(),
        now.endOf('week').toDate()
      ];
    case 'month':
      return [
        now.startOf('month').toDate(),
        now.endOf('month').toDate()
      ];
    case 'year':
      return [
        now.startOf('year').toDate(),
        now.endOf('year').toDate()
      ];
  }
};
