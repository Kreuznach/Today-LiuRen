/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AIT_APP_NAME?: string
  readonly VITE_AIT_REWARDED_DETAIL_AD_GROUP_ID?: string
  readonly VITE_AIT_REWARDED_EXTRA_QUESTION_AD_GROUP_ID?: string
  readonly VITE_AIT_BANNER_AD_GROUP_ID?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
