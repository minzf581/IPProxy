# IPIPV API 测试

这个项目包含了IPIPV API的自动化测试用例。

## 安装依赖

```bash
pip install -r requirements.txt
```

## 运行测试

```bash
# 运行所有测试
pytest -v tests/test_ipipv_api.py

# 运行特定测试
pytest -v tests/test_ipipv_api.py -k test_get_regions
```

## 测试用例

1. 获取区域列表 (`test_get_regions`)
2. 获取国家列表 (`test_get_countries`)
3. 获取城市列表 (`test_get_cities`)
4. 获取区域库存 (`test_get_region_stock`)
5. 获取国家库存 (`test_get_country_stock`)
6. 获取城市库存 (`test_get_city_stock`)
7. 获取静态代理类型列表 (`test_get_static_types`)

## 配置

测试配置在 `tests/test_ipipv_api.py` 文件中的 `API_CONFIG` 字典中定义：

```python
API_CONFIG = {
    'base_url': 'https://sandbox.ipipv.com',  # 沙箱环境URL
    'app_key': 'AK20241120145620',
    'app_secret': 'bf3ffghlt0hpc4omnvc2583jt0fag6a4',
    'version': 'v2',
    'encrypt': 'AES'
}
```

请根据实际情况修改配置。 