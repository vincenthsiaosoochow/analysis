"""
统一日志系统
生产环境(容器)仅输出到 stdout,由 fluent-bit 等日志收集器统一处理
开发环境额外输出到本地日志文件
"""
import logging
import os


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

    # 日志格式
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # NOTE: 生产环境只用 StreamHandler 输出到 stdout
    # 容器中写日志文件会占用磁盘且重启后丢失,无意义
    console_handler = logging.StreamHandler()
    console_handler.setLevel(level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # 仅开发环境添加文件handler
    if os.getenv('ENVIRONMENT', 'development') == 'development':
        from logging.handlers import RotatingFileHandler
        from pathlib import Path

        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)
        file_handler = RotatingFileHandler(
            log_dir / 'app.log',
            maxBytes=5 * 1024 * 1024,  # 5MB
            backupCount=2,
            encoding='utf-8'
        )
        file_handler.setLevel(level)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    return logger


# 便捷函数:获取模块级logger
def get_logger(name: str) -> logging.Logger:
    """获取logger实例的便捷方法"""
    return setup_logger(name)
