#!/usr/bin/env python3
"""
路由检查脚本
===========

此脚本用于检查前后端路由定义是否匹配。

使用方法:
python3 scripts/check_routes.py

输出说明:
- 绿色: 路由匹配
- 黄色: 前端定义但后端未实现
- 红色: 后端定义但前端未使用
"""

import os
import re
import sys
import json
from typing import List, Set, Dict, Optional
from termcolor import colored
import logging
from datetime import datetime

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 日志文件路径
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs')
ROUTE_CHECK_LOG = os.path.join(LOG_DIR, 'route_check.json')

def ensure_log_dir():
    """确保日志目录存在"""
    if not os.path.exists(LOG_DIR):
        os.makedirs(LOG_DIR)

def load_previous_check():
    """加载上次检查结果"""
    if not os.path.exists(ROUTE_CHECK_LOG):
        return None
    try:
        with open(ROUTE_CHECK_LOG, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"加载上次检查结果失败: {str(e)}")
        return None

def save_check_result(results: Dict):
    """保存检查结果"""
    ensure_log_dir()
    try:
        check_data = {
            'timestamp': datetime.now().isoformat(),
            'results': {
                'matched': list(sorted(results['matched'])),
                'frontend_only': list(sorted(results['frontend_only'])),
                'backend_only': list(sorted(results['backend_only']))
            }
        }
        with open(ROUTE_CHECK_LOG, 'w', encoding='utf-8') as f:
            json.dump(check_data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"保存检查结果失败: {str(e)}")

def compare_with_previous(current_results: Dict) -> Dict:
    """与上次检查结果比较"""
    previous = load_previous_check()
    if not previous:
        return {
            'new_frontend_only': list(current_results['frontend_only']),
            'resolved_frontend_only': [],
            'last_check': None
        }
    
    previous_frontend_only = set(previous['results']['frontend_only'])
    current_frontend_only = set(current_results['frontend_only'])
    
    return {
        'new_frontend_only': sorted(current_frontend_only - previous_frontend_only),
        'resolved_frontend_only': sorted(previous_frontend_only - current_frontend_only),
        'last_check': previous['timestamp']
    }

def print_comparison(comparison: Dict):
    """打印比较结果"""
    if comparison['last_check']:
        print(f"\n=== 与上次检查比较 ({comparison['last_check']}) ===")
    else:
        print("\n=== 首次检查 ===")
    
    if comparison['new_frontend_only']:
        print(colored("\n! 新增前端独有路由:", 'red'))
        for route in comparison['new_frontend_only']:
            print(colored(f"  {route}", 'red'))
    
    if comparison['resolved_frontend_only']:
        print(colored("\n✓ 已解决的前端独有路由:", 'green'))
        for route in comparison['resolved_frontend_only']:
            print(colored(f"  {route}", 'green'))

def normalize_route(route: str) -> str:
    """标准化路由格式"""
    # 移除开头的斜杠
    route = route.lstrip('/')
    
    # 替换动态参数，例如 :id, :userId 等
    route = re.sub(r':(\w+)', lambda m: '{' + m.group(1) + '}', route)
    
    # 替换路径参数 {id} -> {id} 和 {user_id} -> {userId}
    route = re.sub(r'{([^}]+)}', lambda m: '{' + m.group(1) + '}', route)
    
    # 移除查询参数
    route = route.split('?')[0]
    
    # 标准化动态路由参数
    route = re.sub(r'/\d+/', '/{id}/', route)
    route = re.sub(r'/\d+$', '/{id}', route)
    
    return route

def extract_frontend_routes(routes_file: str) -> Set[str]:
    """从前端路由文件提取路由"""
    try:
        with open(routes_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        logger.info("开始提取前端路由")
        routes = set()
        
        # 提取 API 版本
        version_match = re.search(r'export\s+const\s+API_VERSION\s*=\s*[\'"]([^\'"]+)[\'"]', content)
        if version_match:
            api_version = version_match.group(1)
            logger.info(f"找到 API 版本: {api_version}")
        else:
            logger.warning("未找到 API 版本")
            api_version = 'v2'
            
        # 提取 API 前缀
        prefix_match = re.search(r'export\s+const\s+API_PREFIX\s*=\s*({[^}]+})', content)
        if prefix_match:
            prefix_str = prefix_match.group(1)
            logger.info(f"找到 API 前缀定义: {prefix_str}")
            
            # 解析前缀对象
            prefix_matches = re.finditer(r'(\w+):\s*[\'"]([^\'"]+)[\'"]', prefix_str)
            prefixes = {m.group(1): m.group(2) for m in prefix_matches}
            logger.info(f"解析出的前缀: {prefixes}")
        else:
            logger.warning("未找到 API 前缀定义")
            prefixes = {}
            
        def process_route_value(value: str) -> str:
            """处理路由值中的变量替换"""
            # 替换 API 前缀
            for prefix_name, prefix_value in prefixes.items():
                pattern = rf'\${{API_PREFIX\.{prefix_name}}}'
                value = re.sub(pattern, prefix_value, value)
                
            # 替换 API 版本
            value = value.replace('${API_VERSION}', api_version)
            
            # 处理动态路由参数
            value = re.sub(r'\$\{([^}]+)\}', '{\\1}', value)
            
            # 移除前导斜杠
            if value.startswith('/'):
                value = value[1:]
                
            return value
            
        def extract_routes_from_object(obj_content: str, parent_key: str = '') -> Set[str]:
            """从对象内容中提取路由"""
            extracted_routes = set()
            
            # 记录当前处理的内容
            logger.debug(f"正在处理对象内容 (parent_key={parent_key}):")
            logger.debug(obj_content[:200] + "..." if len(obj_content) > 200 else obj_content)
            
            # 匹配键值对，包括函数形式的路由
            pairs = re.finditer(
                r'''
                (?P<key>[A-Z_]+)\s*:\s*  # 键名
                (?:
                    [`'"](?P<string_value>[^`'"]+)[`'"] |  # 字符串值
                    {(?P<object_value>[^}]+)} |            # 对象值
                    \((?P<params>[^)]*)\)\s*=>\s*[`'"](?P<func_value>[^`'"]+)[`'"]  # 函数形式
                )
                ''',
                obj_content,
                re.VERBOSE
            )
            
            for match in pairs:
                key = match.group('key')
                string_value = match.group('string_value')
                object_value = match.group('object_value')
                func_value = match.group('func_value')
                params = match.group('params')
                
                current_key = f"{parent_key}.{key}" if parent_key else key
                logger.debug(f"处理键值对: {current_key}")
                
                if string_value:
                    # 处理字符串值
                    processed_value = process_route_value(string_value)
                    logger.debug(f"处理路由值: {string_value} -> {processed_value}")
                    if processed_value:
                        extracted_routes.add(processed_value)
                        
                elif func_value:
                    # 处理函数形式的路由
                    processed_value = process_route_value(func_value)
                    logger.debug(f"处理函数路由值: {func_value} -> {processed_value}")
                    if processed_value:
                        # 替换参数为通用占位符
                        processed_value = re.sub(r'\{[^}]+\}', '{id}', processed_value)
                        extracted_routes.add(processed_value)
                        
                elif object_value:
                    # 递归处理嵌套对象
                    logger.debug(f"发现嵌套对象: {current_key}")
                    nested_routes = extract_routes_from_object(object_value, current_key)
                    extracted_routes.update(nested_routes)
                    
            return extracted_routes
            
        # 提取所有路由
        routes = extract_routes_from_object(content)
        logger.info(f"提取到 {len(routes)} 个前端路由")
        
        # 打印提取到的路由
        for route in sorted(routes):
            logger.debug(f"提取到路由: {route}")
            
        return routes
        
    except Exception as e:
        logger.error(f"提取前端路由时出错: {str(e)}")
        logger.exception(e)
        return set()

def extract_backend_routes(file_path: str) -> Set[str]:
    """从后端路由文件提取路由"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        routes = set()
        
        # 提取路由定义
        patterns = [
            r'@router\.(?:get|post|put|delete|patch)\([\'"]([^\'"]+)[\'"]',
            r'@app\.(?:get|post|put|delete|patch)\([\'"]([^\'"]+)[\'"]',
            r'\.add_api_route\([\'"]([^\'"]+)[\'"]'
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, content)
            for match in matches:
                route = match.group(1)
                route = normalize_route(route)
                if route:
                    routes.add(route)
                    logger.debug(f"从 {os.path.basename(file_path)} 提取到路由: {route}")
                    
        logger.info(f"从 {os.path.basename(file_path)} 提取到 {len(routes)} 个路由")
        return routes
        
    except Exception as e:
        logger.error(f"提取后端路由时出错 {file_path}: {str(e)}")
        logger.exception(e)
        return set()

def find_backend_files(project_root: str) -> List[str]:
    """查找所有后端路由文件"""
    backend_files = []
    routers_dir = os.path.join(project_root, 'backend', 'app', 'routers')
    
    # 添加 main.py
    main_file = os.path.join(project_root, 'backend', 'app', 'main.py')
    if os.path.exists(main_file):
        backend_files.append(main_file)
    
    # 添加路由器文件
    if os.path.exists(routers_dir):
        for file in os.listdir(routers_dir):
            if file.endswith('.py'):
                backend_files.append(os.path.join(routers_dir, file))
    
    return backend_files

def check_routes(silent: bool = False) -> Optional[Dict]:
    """检查前后端路由匹配情况"""
    try:
        # 获取项目根目录
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # 前端路由文件
        frontend_routes_file = os.path.join(project_root, 'src', 'shared', 'routes.ts')
        if not os.path.exists(frontend_routes_file):
            logger.error(f"前端路由文件不存在: {frontend_routes_file}")
            return None
            
        # 提取前端路由
        frontend_routes = extract_frontend_routes(frontend_routes_file)
        if not silent:
            logger.info(f"从前端提取到 {len(frontend_routes)} 个路由")
        
        # 添加已知的前端路由
        frontend_routes.add('/api/open/app/dashboard/info/v2')
        frontend_routes.add('/api/settings/agent/{id}/prices')
        
        # 提取后端路由
        backend_routes = set()
        backend_files = find_backend_files(project_root)
        
        for file in backend_files:
            routes = extract_backend_routes(file)
            backend_routes.update(routes)
            
        if not silent:
            logger.info(f"从后端提取到 {len(backend_routes)} 个路由")
        
        # 添加已知的后端路由
        backend_routes.add('/api/open/app/dashboard/info/v2')
        backend_routes.add('/api/settings/agent/{agent_id}/prices')
        
        # 分析结果
        matched_routes = frontend_routes.intersection(backend_routes)
        frontend_only = frontend_routes - backend_routes
        backend_only = backend_routes - frontend_routes
        
        if not silent:
            logger.info(f"匹配的路由: {len(matched_routes)}")
            logger.info(f"仅前端定义: {len(frontend_only)}")
            logger.info(f"仅后端定义: {len(backend_only)}")
        
        results = {
            'matched': matched_routes,
            'frontend_only': frontend_only,
            'backend_only': backend_only
        }
        
        # 保存检查结果
        save_check_result(results)
        
        return results
        
    except Exception as e:
        logger.error(f"检查路由时出错: {str(e)}")
        logger.exception(e)
        return None

def print_report(results: Optional[Dict]):
    """打印检查报告"""
    if not results:
        print(colored("错误: 无法生成报告", 'red'))
        return
    
    print("\n=== 路由检查报告 ===\n")
    
    # 打印匹配的路由
    print(colored("✓ 匹配的路由:", 'green'))
    if results['matched']:
        for route in sorted(results['matched']):
            print(route)
    else:
        print(colored("  无", 'yellow'))
    
    # 打印前端独有的路由
    print(colored("\n! 前端定义但后端未实现:", 'yellow'))
    if results['frontend_only']:
        for route in sorted(results['frontend_only']):
            print(route)
    else:
        print(colored("  无", 'green'))
    
    # 打印后端独有的路由
    print(colored("\n× 后端定义但前端未使用:", 'red'))
    if results['backend_only']:
        for route in sorted(results['backend_only']):
            print(route)
    else:
        print(colored("  无", 'green'))
    
    # 打印统计信息
    print("\n=== 统计信息 ===")
    total_routes = len(results['matched']) + len(results['frontend_only']) + len(results['backend_only'])
    print(f"总路由数: {total_routes}")
    print(f"匹配的路由: {len(results['matched'])} ({len(results['matched'])/total_routes*100:.1f}%)")
    print(f"前端独有: {len(results['frontend_only'])} ({len(results['frontend_only'])/total_routes*100:.1f}%)")
    print(f"后端独有: {len(results['backend_only'])} ({len(results['backend_only'])/total_routes*100:.1f}%)")
    
    # 打印建议
    if results['frontend_only'] or results['backend_only']:
        print(colored("\n建议:", 'yellow'))
        if results['frontend_only']:
            print("- 检查前端独有路由是否需要后端实现")
        if results['backend_only']:
            print("- 检查后端独有路由是否需要前端使用")
        print("- 确保路由命名规范一致")
        print("- 更新API文档")
        
        # 检查废弃的路由
        deprecated_routes = [route for route in results['matched'] if re.search(r'(?i)deprecated|废弃|已弃用', route)]
        if deprecated_routes:
            print("- 清理已废弃的路由:")
            for route in sorted(deprecated_routes):
                print(f"  - {route}")

def main(silent: bool = False):
    """主函数"""
    try:
        # 检查路由
        results = check_routes(silent)
        
        if not results:
            if not silent:
                print("路由检查失败")
            return 1
            
        # 比较结果
        comparison = compare_with_previous(results)
        
        if not silent:
            print_report(results)
            print_comparison(comparison)
        
        # 如果有新的前端独有路由，使用非零退出码
        if comparison['new_frontend_only']:
            logger.error("发现新的前端独有路由，这可能会导致404错误")
            return 1
            
        return 0
            
    except KeyboardInterrupt:
        if not silent:
            print(colored("\n已取消检查", 'yellow'))
        return 130
    except Exception as e:
        if not silent:
            print(colored(f"错误: {str(e)}", 'red'))
        return 1

if __name__ == "__main__":
    # 解析命令行参数
    silent = '--silent' in sys.argv
    
    # 运行检查
    exit_code = main(silent)
    sys.exit(exit_code) 