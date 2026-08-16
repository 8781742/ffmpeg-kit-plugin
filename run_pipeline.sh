#!/bin/bash
# 抖音数据采集流水线 - 一键启动
EC=./ec_work_config/android/bin/ec-android-cli

echo "=== 抖音数据采集流水线 ==="
echo "1. 检查配置..."
$EC run -m tengxun -r true -k "CONFIG_CHECK" 2>&1 | grep -E "linkInput|cookie|CONFIG" || echo "配置已存在"

echo ""
echo "2. 运行流水线..."
$EC run -m tengxun -r true -k "脚本已运行结束|||ERROR|||上传完成"

echo ""
echo "3. 完成！"
