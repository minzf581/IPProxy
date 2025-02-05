async def test_3_get_proxy_info(self, ipproxy_service, test_user):
        """测试获取代理信息"""
        username = await test_user  # 等待test_user协程完成
        
        # 先创建产品
        create_product_response = await ipproxy_service._make_request("open/app/product/create/v2", {
            "proxyType": 104,  # DYNAMIC_FOREIGN类型
            "productNo": "out_dynamic_1",
            "username": username,
            "appUsername": username,
            "count": 1,
            "autoRenew": 0
        })
        logger.info(f"产品创建: {truncate_response(create_product_response)}")
        
        # 获取代理信息
        response = await ipproxy_service._make_request("open/app/proxy/info/v2", {
            "version": "v2",
            "encrypt": "AES",
            "appUsername": username,
            "proxyType": 104,  # DYNAMIC_FOREIGN类型
            "productNo": "out_dynamic_1"  # 添加产品编号
        })
        logger.info(f"代理信息: {truncate_response(response)}")
        if not response:
            logger.error("获取代理信息失败")
            assert False
        assert response is not None
        assert "list" in response
        assert len(response["list"]) > 0 