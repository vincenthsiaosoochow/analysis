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
    # 如果 API key 未配置，抛出错误
    if not settings.DASHSCOPE_API_KEY:
        raise ValueError("Server configuration error: DASHSCOPE_API_KEY mismatch")
    
    # 创建 OpenAI 客户端（通义千问兼容 OpenAI API）
    print(f"[DEBUG] Initializing Qwen Client. Model: {settings.QIANWEN_MODEL}, Base URL: {settings.QIANWEN_BASE_URL}")
    if settings.DASHSCOPE_API_KEY:
        print(f"[DEBUG] API Key present: {settings.DASHSCOPE_API_KEY[:4]}***")
    else:
        print("[ERROR] DASHSCOPE_API_KEY is missing!")

    client = OpenAI(
        api_key=settings.DASHSCOPE_API_KEY,
        base_url=settings.QIANWEN_BASE_URL,
        timeout=60.0,  # 设置明确的超时时间
        max_retries=1
    )
    
    # 构建分析提示词
    system_prompt = """你是拥有20年艺术史研究+10年艺术品投资顾问经验的专家，也是一位严格的内容安全审查员。

    首先，请**严格检查**提交的图片是否包含以下内容：
    1. 色情、裸露或性暗示内容（经典艺术裸体除外，但需严格区分）；
    2. 极度暴力、血腥或恐怖内容；
    3. 违反法律法规的内容。

    如果检测到上述违规内容，请**立即**返回以下 JSON 格式，不要输出任何其他分析内容：
    {
      "error": "nsfw_detected",
      "reason": "涉及违规内容"
    }

    如果图片内容安全，请对这幅画作进行**专业、结构化、可落地的分析**，输出需分三大模块，每个模块下分点阐述，使用专业术语且逻辑清晰。
    你的回复必须严格遵循 JSON 格式。所有文本应使用流畅、专业的中文。"""
    
    user_prompt = """分析这幅画作。输出需分三大模块，每个模块下分点阐述：

### 模块1：核心艺术分析（深度+分维度）
必须覆盖以下6个维度，结合画面细节展开，禁止空泛：
1. **艺术风格与流派**：判断流派+该流派核心特征+画作契合点；
2. **色彩运用**：主色调/对比色+搭配逻辑+情绪/氛围传递；
3. **笔触与肌理**：创作技法+笔触质感+视觉体验；
4. **构图布局**：视觉重心+动静关系+空间层次+构图创新点；
5. **题材与意境**：具象/抽象判断+情感/文化内涵（如中西融合）；
6. **艺术价值**：创作创新点+在艺术史/艺术家生涯中的定位。

### 模块2：艺术家核心信息
基于画作风格/特征，精准识别艺术家（若无法识别则注明“暂无法匹配精准艺术家，以下为同流派典型艺术家参考”），并分析：
1. **基础信息**：姓名、国籍、生卒年、艺术生涯阶段；
2. **市场定位**：该艺术家在全球/国内艺术市场的梯队（如一线/二线、蓝筹/成长型）；
3. **代表作品**：3-5幅核心代表作+对应市场成交价格区间（注明“参考价”）；
4. **风格演变**：该艺术家不同阶段的风格特征+这幅画所属阶段的市场认可度。

### 模块3：资产配置/投资价值分析
基于艺术特征+艺术家市场表现，提供客观的投资参考（非投资建议）：
1. **投资价值评级**：分S（稀缺核心）/A（优质成长）/B（稳健收藏）/C（小众潜力）/D（谨慎）五级，说明评级依据；
2. **市场行情**：该艺术家同类作品近3年拍卖成交均价、成交量变化、涨跌趋势；
3. **收藏建议**：
   - 适合人群：（如高净值人群配置/入门级收藏/机构收藏）；
   - 配置比例：建议在艺术品投资组合中的占比（如5%-10%）；
   - 持有周期：短期（1-3年）/中期（3-5年）/长期（5年以上）更优；
4. **风险提示**：
   - 核心风险点：（如艺术家作品流通量过大/真伪鉴定难度高/市场热度波动）；
   - 规避建议：（如优先选择来源清晰的作品/关注权威拍卖行成交数据）；
5. **同类替代标的**：推荐2-3个同流派/同梯队的替代艺术家（注明核心优势）。

### 重要声明
本分析仅为客观参考，不构成任何投资建议，艺术品投资存在真伪、市场波动、流动性等风险，投资决策请咨询专业艺术品投资机构。

请用流畅的中文输出，每个模块标题加粗，分点清晰，数据标注“参考值”“近3年”等限定词，避免绝对化表述。请严格按照以下 JSON 格式返回：
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
    "styleAndSchool": "艺术风格与流派分析",
    "colorUsage": "色彩运用分析",
    "brushworkTexture": "笔触与肌理分析",
    "compositionLayout": "构图布局分析",
    "themeAndMood": "题材与意境分析",
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
    "marketTrends": "市场行情",
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
        
        # 检查是否包含违规标记
        if result.get("error") == "nsfw_detected":
            print(f"[WARN] NSFW content detected: {result.get('reason')}")
            raise ValueError("NSFW_DETECTED")
        
        return result
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        # Only log if it's not our intentional NSFW error (which is expected)
        if str(e) != "NSFW_DETECTED":
            print(f"[ERROR] 通义千问 API 调用失败: {str(e)}")
            print(f"[ERROR] 堆栈信息:\n{error_details}")
        
        # Re-raise the exception to be handled by the caller
        raise e


def _get_mock_analysis() -> Dict[str, Any]:
    """
    返回模拟分析数据（用于开发测试）
    """
    return {
        "title": "未知作品",
        "artist": "未知艺术家",
        # ... kept for compatibility if imported elsewhere, but unused logic
    }
