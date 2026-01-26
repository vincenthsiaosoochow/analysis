"""
通义千问服务
集成阿里云通义千问 API 进行艺术品图像分析
"""
import json
import base64
from typing import Dict, Any
from openai import OpenAI

from app.config import settings


def analyze_artwork_with_qianwen(image_base64: str) -> Dict[str, Any]:
    """
    使用通义千问 API 分析艺术品图片
    
    Args:
        image_base64: base64 编码的图片数据
    
    Returns:
        分析结果字典
    """
    # 如果 API key 未配置，返回模拟数据
    if not settings.DASHSCOPE_API_KEY:
        return _get_mock_analysis()
    
    # 创建 OpenAI 客户端（通义千问兼容 OpenAI API）
    client = OpenAI(
        api_key=settings.DASHSCOPE_API_KEY,
        base_url=settings.QIANWEN_BASE_URL
    )
    
    # 构建分析提示词
    system_prompt = """你是拥有20年艺术史研究+10年艺术品投资顾问经验的专家，现对用户上传的画作进行专业、结构化、可落地的分析。
你的回复必须严格遵循 JSON 格式。所有文本应使用流畅、专业的中文。
在分析时，请结合画面细节，避免空泛表述。"""
    
    user_prompt = """分析这幅画作。输出需分三大模块：

### 模块1：核心艺术分析
必须覆盖风格流派、色彩运用、笔触肌理、构图布局、题材意境、艺术价值6个维度。

### 模块2：艺术家核心信息
识别艺术家并分析其基础信息、市场定位、代表作（含参考价）、风格演变。

### 模块3：资产配置/投资价值分析
提供投资评级（S/A/B/C/D）、行情趋势、收藏建议、风险提示、同类替代标的。

重要声明：本分析仅为客观参考，不构成任何投资建议。

请以如下 JSON 格式返回：
{
  "title": "作品标题",
  "artist": "艺术家姓名",
  "artistGender": "男/女/未知",
  "style": "艺术风格",
  "period": "创作时期",
  "origin": "起源地",
  "palette": ["颜色1", "颜色2", "颜色3", "颜色4"],
  "composition": "构图描述",
  "interpretation": "作品解读",
  "coreAnalysis": {
    "styleAndSchool": "风格流派分析",
    "colorUsage": "色彩运用分析",
    "brushworkTexture": "笔触肌理分析",
    "compositionLayout": "构图布局分析",
    "themeAndMood": "题材意境分析",
    "artisticValue": "艺术价值分析"
  },
  "artistInfo": {
    "basics": "艺术家基础信息",
    "marketPosition": "市场定位",
    "representativeWorks": "代表作品及参考价",
    "styleEvolution": "风格演变"
  },
  "investmentAnalysis": {
    "rating": "S/A/B/C/D",
    "ratingReason": "评级依据",
    "marketTrends": "市场行情趋势",
    "collectionAdvice": "收藏建议",
    "riskAlert": "风险提示",
    "alternatives": "同类替代标的"
  }
}"""
    
    try:
        # 处理 base64 图片数据
        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]
        
        # 调用通义千问 API
        response = client.chat.completions.create(
            model=settings.QIANWEN_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        },
                        {
                            "type": "text",
                            "text": user_prompt
                        }
                    ]
                }
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        # 解析响应
        result_text = response.choices[0].message.content
        result = json.loads(result_text)
        
        return result
        
    except Exception as e:
        print(f"通义千问 API 调用失败: {str(e)}")
        # 如果 API 调用失败，返回模拟数据
        return _get_mock_analysis()


def _get_mock_analysis() -> Dict[str, Any]:
    """
    返回模拟分析数据（用于开发测试）
    """
    return {
        "title": "未知作品",
        "artist": "未知艺术家",
        "artistGender": "未知",
        "style": "现代艺术",
        "period": "当代",
        "origin": "未知",
        "palette": ["#2C3E50", "#E74C3C", "#ECF0F1", "#3498DB"],
        "composition": "画面构图均衡，视觉中心明确",
        "interpretation": "这是一幅富有表现力的作品，体现了艺术家对色彩和形式的独特理解",
        "coreAnalysis": {
            "styleAndSchool": "作品展现出现代主义风格，注重形式与色彩的结合",
            "colorUsage": "色彩运用大胆，对比强烈，营造出独特的视觉效果",
            "brushworkTexture": "笔触流畅自然，肌理丰富，体现出艺术家的技法功底",
            "compositionLayout": "构图严谨，层次分明，引导观者视线",
            "themeAndMood": "主题深刻，意境悠远，引发观者思考",
            "artisticValue": "作品具有较高的艺术价值，展现了独特的艺术语言"
        },
        "artistInfo": {
            "basics": "艺术家信息待识别",
            "marketPosition": "市场定位有待进一步分析",
            "representativeWorks": "代表作品信息待补充",
            "styleEvolution": "风格演变轨迹待研究"
        },
        "investmentAnalysis": {
            "rating": "C",
            "ratingReason": "由于缺乏详细信息，暂给予中等评级",
            "marketTrends": "市场趋势有待进一步观察",
            "collectionAdvice": "建议谨慎收藏，需进一步了解艺术家背景",
            "riskAlert": "信息不足可能导致投资风险，请谨慎决策",
            "alternatives": "可关注同类型现代艺术作品"
        }
    }
