import hashlib
import json
import time
from base64 import b64encode
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad
import requests
from flask import current_app

class APIClient:
    def __init__(self, app_key=None, app_secret=None, base_url=None):
        self.app_key = app_key or current_app.config['IPIPV_APP_KEY']
        self.app_secret = app_secret or current_app.config['IPIPV_APP_SECRET']
        self.base_url = base_url or current_app.config['IPIPV_API_BASE_URL']

    def _generate_sign(self, params):
        """生成API签名"""
        sorted_params = dict(sorted(params.items()))
        sign_str = '&'.join([f"{k}={v}" for k, v in sorted_params.items()])
        sign_str += f"&key={self.app_secret}"
        return hashlib.md5(sign_str.encode()).hexdigest().upper()

    def _encrypt_data(self, data):
        """AES加密数据"""
        key = self.app_secret[:16].encode()
        iv = b'0123456789abcdef'
        cipher = AES.new(key, AES.MODE_CBC, iv)
        padded_data = pad(json.dumps(data).encode(), AES.block_size)
        encrypted_data = cipher.encrypt(padded_data)
        return b64encode(encrypted_data).decode()

    def make_request(self, endpoint, method='POST', params=None, data=None):
        """发送API请求"""
        url = f"{self.base_url}{endpoint}"
        params = params or {}
        
        # 添加公共参数
        params.update({
            'appKey': self.app_key,
            'timestamp': str(int(time.time() * 1000)),
            'version': 'v2'
        })
        
        # 加密请求数据
        if data:
            params['data'] = self._encrypt_data(data)
        
        # 生成签名
        params['sign'] = self._generate_sign(params)
        
        try:
            response = requests.request(
                method=method,
                url=url,
                params=params if method == 'GET' else None,
                json=params if method == 'POST' else None,
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            current_app.logger.error(f"API request failed: {str(e)}")
            raise

    # API方法封装
    def get_app_info(self):
        """获取应用信息"""
        return self.make_request('/api/open/app/info/v2')

    def open_dynamic_proxy(self, data):
        """开通动态代理"""
        return self.make_request('/api/open/app/instance/open/v2', data=data)

    def renew_dynamic_proxy(self, data):
        """续费动态代理"""
        return self.make_request('/api/open/app/instance/renew/v2', data=data)

    def release_dynamic_proxy(self, data):
        """释放动态代理"""
        return self.make_request('/api/open/app/instance/release/v2', data=data)

    def get_instance_info(self, instance_id):
        """获取实例信息"""
        return self.make_request(
            '/api/open/app/instance/v2',
            data={'instanceId': instance_id}
        )

    def add_whitelist_ip(self, ip, proxy_type):
        """添加白名单IP"""
        return self.make_request(
            '/api/open/app/proxy/addIpWhiteList/v2',
            data={'ip': ip, 'proxyType': proxy_type}
        )

    def delete_whitelist_ip(self, ip, proxy_type):
        """删除白名单IP"""
        return self.make_request(
            '/api/open/app/proxy/delIpWhiteList/v2',
            data={'ip': ip, 'proxyType': proxy_type}
        )
