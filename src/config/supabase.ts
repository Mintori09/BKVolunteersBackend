import { createClient } from '@supabase/supabase-js'
import config from './config'

const hasSupabaseCredentials =
    Boolean(config.supabase.url) && Boolean(config.supabase.serviceRoleKey)

export const isSupabaseStorageEnabled = hasSupabaseCredentials

export const supabaseAdmin = hasSupabaseCredentials
    ? createClient(config.supabase.url as string, config.supabase.serviceRoleKey as string, {
          auth: {
              autoRefreshToken: false,
              persistSession: false,
          },
      })
    : null
