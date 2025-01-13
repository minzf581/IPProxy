import dayjs from 'dayjs';

/**
 * 格式化日期时间
 * @param date 日期时间字符串或Date对象
 * @param format 格式化模式，默认为 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期时间字符串
 */
export const formatDateTime = (date: string | Date, format: string = 'YYYY-MM-DD HH:mm:ss'): string => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

/**
 * 格式化日期
 * @param date 日期字符串或Date对象
 * @param format 格式化模式，默认为 'YYYY-MM-DD'
 * @returns 格式化后的日期字符串
 */
export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD'): string => {
  if (!date) return '-';
  return dayjs(date).format(format);
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
