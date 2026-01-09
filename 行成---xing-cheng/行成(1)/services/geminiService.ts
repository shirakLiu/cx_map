// Google GenAI is blocked in China.
// We use a local "Oracle" simulation to generate lore based on coordinates.
// This ensures the app functions perfectly without a VPN.

const LORE_TEMPLATES = [
  "此地名为【{adjective}】，相传三百年前曾有异人在此驻足，留下了一缕不灭的神识。",
  "脚下的土地隐约透着温热，古籍记载这里是地脉的汇聚之点，名为“{element}之眼”。",
  "听老一辈人说，每逢月圆之夜，附近的古树会发出奇异的微光，似是在诉说一段往事。",
  "这里曾是一处被遗忘的古战场，虽然时光掩埋了痕迹，但风中依然能听到金戈铁马的回响。",
  "地质勘探显示此地磁场异常，而在行者的眼中，这是灵气复苏的征兆。",
  "原本平凡的街道，在“天眼”观测下竟呈现出{pattern}的阵法排列。",
  "这里是现实与记忆的交汇点，若是静下心来，或许能听到来自另一个维度的低语。"
];

const ADJECTIVES = ["忘忧角", "观星台", "聚灵阵", "回音壁", "藏风谷", "无名地"];
const ELEMENTS = ["苍穹", "幽冥", "星辰", "厚土", "烈火", "流水"];
const PATTERNS = ["北斗七星", "九宫八卦", "四象神兽", "双龙戏珠"];

export const generateLocationLore = async (lat: number, lng: number): Promise<string> => {
  // Simulate network delay for "Divining" effect
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Use coordinates to create a consistent "seed" for this location
  // This means the lore will stay the same if the user stays in the same spot
  const seed = Math.floor(lat * 10000) + Math.floor(lng * 10000);
  
  const templateIndex = seed % LORE_TEMPLATES.length;
  const adjIndex = seed % ADJECTIVES.length;
  const eleIndex = seed % ELEMENTS.length;
  const patIndex = seed % PATTERNS.length;

  let lore = LORE_TEMPLATES[templateIndex];
  
  // Fill in the blanks
  lore = lore.replace("{adjective}", ADJECTIVES[adjIndex]);
  lore = lore.replace("{element}", ELEMENTS[eleIndex]);
  lore = lore.replace("{pattern}", PATTERNS[patIndex]);

  return lore;
};