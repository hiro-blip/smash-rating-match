import Image from 'next/image'
import { getFighterName, getFighterImagePath } from '@/lib/fighters'

interface FighterIconProps {
  fighterId: string
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  className?: string
}

export default function FighterIcon({ 
  fighterId, 
  size = 'md', 
  showName = true,
  className = '' 
}: FighterIconProps) {
  const fighterName = getFighterName(fighterId)
  const imagePath = getFighterImagePath(fighterId)
  
  // サイズの定義
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }
  
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-base',
    lg: 'text-xl'
  }
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* ファイター画像 */}
      {imagePath ? (
        <div className={`${sizeClasses[size]} relative flex-shrink-0`}>
          <Image
            src={imagePath}
            alt={fighterName}
            fill
            className="object-contain"
            sizes={size === 'sm' ? '40px' : size === 'md' ? '48px' : '64px'}
          />
        </div>
      ) : (
        <div className={`${sizeClasses[size]} bg-slate-700 rounded flex items-center justify-center flex-shrink-0`}>
          <span className="text-xl">🎮</span>
        </div>
      )}
      
      {/* ファイター名 */}
      {showName && (
        <span className={`${textSizeClasses[size]} font-semibold`}>
          {fighterName}
        </span>
      )}
    </div>
  )
}
