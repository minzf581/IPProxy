import os
import ast
import sys
from pathlib import Path

def extract_imports(file_path):
    """从Python文件中提取所有导入语句"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            tree = ast.parse(file.read())
    except Exception as e:
        print(f"无法解析文件 {file_path}: {e}")
        return set()

    imports = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for name in node.names:
                imports.add(name.name.split('.')[0])
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                imports.add(node.module.split('.')[0])
    return imports

def find_python_files(start_path):
    """递归查找所有Python文件"""
    python_files = []
    for root, _, files in os.walk(start_path):
        for file in files:
            if file.endswith('.py'):
                python_files.append(os.path.join(root, file))
    return python_files

def get_stdlib_modules():
    """获取Python标准库模块列表"""
    return sys.stdlib_module_names

def main():
    # 获取项目根目录
    project_root = Path(__file__).parent
    
    # 查找所有Python文件
    python_files = find_python_files(project_root)
    
    # 收集所有导入
    all_imports = set()
    for file in python_files:
        imports = extract_imports(file)
        all_imports.update(imports)
    
    # 获取标准库模块
    stdlib_modules = get_stdlib_modules()
    
    # 过滤掉标准库模块和本地模块
    third_party_imports = {
        imp for imp in all_imports 
        if imp not in stdlib_modules 
        and not any(
            os.path.exists(os.path.join(project_root, *imp.split('.'))) 
            for ext in ['.py', '']
        )
    }
    
    print("发现的第三方依赖:")
    for imp in sorted(third_party_imports):
        print(f"- {imp}")

if __name__ == '__main__':
    main() 