// スマブラSPのステージ一覧（主要なステージ）
export interface Stage {
  id: string
  name: string
  category: 'legal' | 'counterpick' | 'casual'
}

export const stages: Stage[] = [
  // 法的ステージ（競技用）
  { id: 'battlefield', name: '戦場', category: 'legal' },
  { id: 'final-destination', name: '終点', category: 'legal' },
  { id: 'small-battlefield', name: '小戦場', category: 'legal' },
  { id: 'pokemon-stadium-2', name: 'ポケモンスタジアム2', category: 'legal' },
  { id: 'town-and-city', name: '村と街', category: 'legal' },
  
  // カウンターピックステージ
  { id: 'smashville', name: 'すま村', category: 'counterpick' },
  { id: 'kalos-pokemon-league', name: 'カロスポケモンリーグ', category: 'counterpick' },
  { id: 'yoshis-story', name: 'ヨッシーストーリー', category: 'counterpick' },
  { id: 'lylat-cruise', name: 'ライラットクルーズ', category: 'counterpick' },
  
  // カジュアルステージ
  { id: 'mario-circuit', name: 'マリオサーキット', category: 'casual' },
  { id: 'gerudo-valley', name: 'ゲルドの谷', category: 'casual' },
  { id: 'dream-land', name: 'プププランド', category: 'casual' },
  { id: 'fountain-of-dreams', name: '夢の泉', category: 'casual' },
]

export function getStageName(stageId: string): string {
  const stage = stages.find(s => s.id === stageId)
  return stage ? stage.name : '不明'
}

export function getStagesByCategory(category: 'legal' | 'counterpick' | 'casual'): Stage[] {
  return stages.filter(s => s.category === category)
}
