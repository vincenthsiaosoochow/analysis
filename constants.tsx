
import { FeaturedItem, ArtworkAnalysis } from './types';

export const FEATURED_ARTWORKS: FeaturedItem[] = [
  {
    id: '1',
    title: '星月夜',
    artist: '文森特·梵高',
    tag: '印象派',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAx2ubdWmOWYitgC5mJ_5zfYlvTpeo6h2RUT50DmYfdDNk3xOPaBUHjpR3ITZmV-EY0mkN5ZQcly0dW2_oIk1tpiX6WJI_H_loOHDt4guOxLIqUl563n16QoGO73Nei4Um-DyQ5MlzK5TDK0937wmUWRNQkq4JI8hE_ibqAUhGei49E6pS58IvU6HNMax3qtBffxWTxUP67_7lERxPk-QagTjGQ8Mp1-mT-6VUITtqaoOY9oBvc5r3RAHOFbofUteAXcs46YKnS7gk',
  },
  {
    id: '2',
    title: '维纳斯的诞生',
    artist: '桑德罗·波提切利',
    tag: '文艺复兴',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCC9WXGFUxw9bFCrJiuAJDTNLyYckGMsjtOPnNawAizA_GPtf75J6qkZyn-6SB_zlHx7IlqzyP0tHpWdrEoRmr0Q2vpX1wZ_cOebXCeMWsbJZ5heKTxcRfy4g3d-eRq2K6sxtPukR7LL7U60DPsnMLCdBuVq-DIVURMhuCEtVfbfc1inUV3vUvDsC5r0Vuq6qftwp6M3PNn_bHQyMHJuFF9WVdE9yv3UsQ7fBr_kA34HZD16OacIqPwRAFbIpBv6aXvHeG4zMErJeY',
  },
];

export const GLOBAL_ANALYSES: ArtworkAnalysis[] = [
  {
    id: 'rec1',
    title: '记忆的永恒',
    artist: '萨尔瓦多·达利',
    style: '超现实主义',
    period: '1931',
    origin: '西班牙',
    palette: ['#8B4513', '#D2B48C', '#4682B4', '#DAA520'],
    composition: '扭曲的时钟散布在荒凉的海岸线上。',
    interpretation: '探讨了时间的流动性与潜意识的梦境。',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmCm7RAKGWsSjWTUUs9dHZq2kd2M6KjDC6Y5gGTXpsk1G6Y14ArO4S558S4sjbZ5u9H8GD9_800H5AtTbPC36JAG7cBCoegr76jDVQ9hzrapc0KGvb8OH7bMeEcAwLbsiC9Sg5xil4Nk1XCLEy7XBmY261kfBgPO70MIdfMbiTcMywry7RhqR6NCWc9dHqbotu7gooNvnQsMxiX58g9MJr6FI59yJln2AuBV-fLim4mQBCq6yX0Bsv6p42iZbKh5wVCL0vQfVnVPk',
    authorName: '艺术探路者',
    authorAvatar: 'https://picsum.photos/seed/p1/100/100',
    isSaved: false,
    likes: 1250
  },
  {
    id: 'rec2',
    title: '戴珍珠耳环的少女',
    artist: '扬·维米尔',
    style: '荷兰黄金时代',
    period: '1665',
    origin: '荷兰',
    palette: ['#000000', '#F5DEB3', '#4169E1', '#800000'],
    composition: '侧身回眸的少女，光影集中在面部和珍珠上。',
    interpretation: '捕捉了一个永恒而神秘的瞬间。',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDth419Id1_ec6aKJn93Pe5bDioXds5UilIKYUN4qidXN9z4kcpF6xT60WXwkjPTBCnQNcbUl0Pih4YCXSs7PIGWp0Z0j0qSGWQsreNDX4rG3CYZBzRe08oiru9uDVXqDdj68-zl-r0FH2cBL8ivtmO5Z60xcWeIpPMheBCVSN6urkD5x210zeVMonM2jcUiq46wbohf4DeSy-MJIFKbMD_XG6AAKNXnry9TMu1BT8_lXXgFcrqTYxnguH1M2mBA9E1zHk1VnL7yQg',
    authorName: 'VermeerFan',
    authorAvatar: 'https://picsum.photos/seed/p2/100/100',
    isSaved: true,
    likes: 3400
  },
    {
    id: 'rec3',
    title: '呐喊',
    artist: '爱德华·蒙克',
    style: '表现主义',
    period: '1893',
    origin: '挪威',
    palette: ['#FF4500', '#191970', '#8B4513', '#FFD700'],
    composition: '强烈的波浪线条和极具张力的色彩对比。',
    interpretation: '象征了现代人类面对存在的焦虑。',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvxYoDBhykq_yh1QllgppsEqy8kPc29uTntRXpzfWSKB7XuXccsXjVYaBcFjVjt-t80dzscsoGcIqJ7vAMR57Ke6yKENtMDkAVGvpKhEHCw2PjNVU-g1BE5aeyoGSIqCO5vI9UxnuBYe8uf74XElQenKE51MOSXM_AaloKMhOM1pRymPfRcoW4-QvNXVuUtxW9bqt63X1NMMYVUzfk3s5JTHdmAa6FpTkCQSVqVp9VKYT0L5IYg8QzAbPpALy_4R0I1nCHqFmfsSA',
    authorName: '深度画师',
    authorAvatar: 'https://picsum.photos/seed/p3/100/100',
    isSaved: false,
    likes: 2100
  }
];
