// プロフィール管理

import { supabase } from './supabase'

export interface UserProfile {
  user_id: string
  username: string
  avatar_url: string
  main_fighter: string | null
  friend_code: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

/**
 * ユーザーのプロフィールを取得
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // レコードが存在しない
        return null
      }
      console.error('Error fetching profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return null
  }
}

/**
 * プロフィールを作成または更新
 */
export async function upsertUserProfile(profile: {
  user_id: string
  username: string
  avatar_url?: string
  main_fighter?: string
  friend_code?: string
  bio?: string
}): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: profile.user_id,
        username: profile.username,
        avatar_url: profile.avatar_url || '👤',
        main_fighter: profile.main_fighter || null,
        friend_code: profile.friend_code || null,
        bio: profile.bio || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Error upserting profile:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in upsertUserProfile:', error)
    return { success: false, error }
  }
}

/**
 * localStorageからSupabaseにプロフィールを移行
 */
export async function migrateProfileToSupabase(userId: string): Promise<boolean> {
  try {
    // localStorageからプロフィールを取得
    const savedProfile = localStorage.getItem(`profile_${userId}`)
    if (!savedProfile) {
      return false
    }

    const data = JSON.parse(savedProfile)
    
    // Supabaseに保存
    const result = await upsertUserProfile({
      user_id: userId,
      username: data.username || 'プレイヤー',
      avatar_url: data.profileImage || '👤',
      main_fighter: data.mainFighter || '',
      friend_code: data.friendCode || '',
      bio: data.bio || ''
    })

    if (result.success) {
      console.log('Profile migrated to Supabase successfully')
      return true
    }

    return false
  } catch (error) {
    console.error('Error migrating profile:', error)
    return false
  }
}
