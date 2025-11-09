// スマブラSPのファイター一覧
export interface Fighter {
  id: string
  name: string
  number: string
}

export const fighters: Fighter[] = [
  { id: '1', number: '01', name: 'マリオ' },
  { id: '2', number: '02', name: 'ドンキーコング' },
  { id: '3', number: '03', name: 'リンク' },
  { id: '4', number: '04', name: 'サムス' },
  { id: '4ε', number: '04ε', name: 'ダークサムス' },
  { id: '5', number: '05', name: 'ヨッシー' },
  { id: '6', number: '06', name: 'カービィ' },
  { id: '7', number: '07', name: 'フォックス' },
  { id: '8', number: '08', name: 'ピカチュウ' },
  { id: '9', number: '09', name: 'ルイージ' },
  { id: '10', number: '10', name: 'ネス' },
  { id: '11', number: '11', name: 'キャプテン・ファルコン' },
  { id: '12', number: '12', name: 'プリン' },
  { id: '13', number: '13', name: 'ピーチ' },
  { id: '13ε', number: '13ε', name: 'デイジー' },
  { id: '14', number: '14', name: 'クッパ' },
  { id: '15', number: '15', name: 'アイスクライマー' },
  { id: '16', number: '16', name: 'シーク' },
  { id: '17', number: '17', name: 'ゼルダ' },
  { id: '18', number: '18', name: 'ドクターマリオ' },
  { id: '19', number: '19', name: 'ピチュー' },
  { id: '20', number: '20', name: 'ファルコ' },
  { id: '21', number: '21', name: 'マルス' },
  { id: '21ε', number: '21ε', name: 'ルキナ' },
  { id: '22', number: '22', name: 'こどもリンク' },
  { id: '23', number: '23', name: 'ガノンドロフ' },
  { id: '24', number: '24', name: 'ミュウツー' },
  { id: '25', number: '25', name: 'ロイ' },
  { id: '25ε', number: '25ε', name: 'クロム' },
  { id: '26', number: '26', name: 'Mr.ゲーム&ウォッチ' },
  { id: '27', number: '27', name: 'メタナイト' },
  { id: '28', number: '28', name: 'ピット' },
  { id: '28ε', number: '28ε', name: 'ブラックピット' },
  { id: '29', number: '29', name: 'ゼロスーツサムス' },
  { id: '30', number: '30', name: 'ワリオ' },
  { id: '31', number: '31', name: 'スネーク' },
  { id: '32', number: '32', name: 'アイク' },
  { id: '33', number: '33', name: 'ポケモントレーナー' },
  { id: '33-1', number: '33-1', name: 'ゼニガメ' },
  { id: '33-2', number: '33-2', name: 'フシギソウ' },
  { id: '33-3', number: '33-3', name: 'リザードン' },
  { id: '36', number: '36', name: 'ディディーコング' },
  { id: '37', number: '37', name: 'リュカ' },
  { id: '38', number: '38', name: 'ソニック' },
  { id: '39', number: '39', name: 'デデデ' },
  { id: '40', number: '40', name: 'ピクミン&オリマー' },
  { id: '41', number: '41', name: 'ルカリオ' },
  { id: '42', number: '42', name: 'ロボット' },
  { id: '43', number: '43', name: 'トゥーンリンク' },
  { id: '44', number: '44', name: 'ウルフ' },
  { id: '45', number: '45', name: 'むらびと' },
  { id: '46', number: '46', name: 'ロックマン' },
  { id: '47', number: '47', name: 'Wii Fitトレーナー' },
  { id: '48', number: '48', name: 'ロゼッタ&チコ' },
  { id: '49', number: '49', name: 'リトル・マック' },
  { id: '50', number: '50', name: 'ゲッコウガ' },
  { id: '51-53', number: '51-53', name: 'Miiファイター' },
  { id: '54', number: '54', name: 'パルテナ' },
  { id: '55', number: '55', name: 'パックマン' },
  { id: '56', number: '56', name: 'ルフレ' },
  { id: '57', number: '57', name: 'シュルク' },
  { id: '58', number: '58', name: 'クッパJr.' },
  { id: '59', number: '59', name: 'ダックハント' },
  { id: '60', number: '60', name: 'リュウ' },
  { id: '60ε', number: '60ε', name: 'ケン' },
  { id: '61', number: '61', name: 'クラウド' },
  { id: '62', number: '62', name: 'カムイ' },
  { id: '63', number: '63', name: 'ベヨネッタ' },
  { id: '64', number: '64', name: 'インクリング' },
  { id: '65', number: '65', name: 'リドリー' },
  { id: '66', number: '66', name: 'シモン' },
  { id: '66ε', number: '66ε', name: 'リヒター' },
  { id: '67', number: '67', name: 'キングクルール' },
  { id: '68', number: '68', name: 'しずえ' },
  { id: '69', number: '69', name: 'ガオガエン' },
  { id: '70', number: '70', name: 'パックンフラワー' },
  { id: '71', number: '71', name: 'ジョーカー' },
  { id: '72', number: '72', name: '勇者' },
  { id: '73', number: '73', name: 'バンジョー&カズーイ' },
  { id: '74', number: '74', name: 'テリー' },
  { id: '75', number: '75', name: 'ベレト/ベレス' },
  { id: '76', number: '76', name: 'ミェンミェン' },
  { id: '77', number: '77', name: 'スティーブ/アレックス' },
  { id: '78', number: '78', name: 'セフィロス' },
  { id: '79', number: '79', name: 'ホムラ/ヒカリ' },
  { id: '80', number: '80', name: 'カズヤ' },
  { id: '81', number: '81', name: 'ソラ' },
]

// ファイターIDから名前を取得
export function getFighterName(fighterId: string): string {
  const fighter = fighters.find(f => f.id === fighterId)
  return fighter ? fighter.name : '不明'
}

// ファイターを番号順にソート
export function getSortedFighters(): Fighter[] {
  return [...fighters].sort((a, b) => {
    const numA = parseFloat(a.number.replace('ε', '.5'))
    const numB = parseFloat(b.number.replace('ε', '.5'))
    return numA - numB
  })
}
