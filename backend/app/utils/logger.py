"""
统一日志系统
提供结构化日志功能,支持文件输出和控制台输出
"""
import logging
import os
from logging.handlers import RotatingFileHandler
from pathlib import Path


def setup_logger(name: str, level: int = logging.INFO) -> logging.Logger:
    """
    配置并返回一个logger实例
    
    Args:
        name: logger名称,通常使用 __name__
        level: 日志级别,默认INFO
        
    Returns:
        配置好的logger实例
    """
    logger = logging.getLogger(name)
    
    # 避免重复添加handler
    if logger.handlers:
        return logger
    
    logger.setLevel(level)
    
    # 创建日志目录
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # 日志格式
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # 文件handler - 使用RotatingFileHandler自动轮转
    file_handler = RotatingFileHandler(
        log_dir / 'app.log',
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setLevel(level)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    # 控制台handler - 仅在开发环境
    if os.getenv('ENVIRONMENT', 'development') == 'development':
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.DEBUG)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
    
    return logger


# 便捷函数:获取模块级logger
def get_logger(name: str) -> logging.Logger:
    """获取logger实例的便捷方法"""
    return setup_logger(name)
