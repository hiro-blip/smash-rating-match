import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface MatchingQueueEntry {
  id: string
  user_id: string
  username: string
  rating: number
  main_fighter: string | null
  min_rating: number
  max_rating: number
  status: 'waiting' | 'matched' | 'cancelled'
  matched_with: string | null
  room_code?: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  username: string
  friend_code: string | null
  bio: string | null
  comments: string | null
  avatar_url: string | null
  main_fighter: string | null
  created_at: string
  updated_at: string
}

export interface Rating {
  id: string
  user_id: string
  rating: number
  wins: number
  losses: number
  created_at: string
  updated_at: string
}

export interface Match {
  id: string
  user_id: string
  opponent_name: string
  opponent_rating: number
  my_fighter: string | null
  opponent_fighter: string | null
  stage: string | null
  result: 'win' | 'lose'
  rating_change: number
  old_rating: number
  new_rating: number
  created_at: string
}
