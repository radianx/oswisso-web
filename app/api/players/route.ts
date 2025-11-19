import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET() {
  const { data, error } = await supabase
    .from('global_players')
    .select('nickname')
    .order('nickname', { ascending: true })

  if (error) {
    return NextResponse.json({ message: 'Error fetching players' }, { status: 500 })
  }

  // Extract nicknames
  const nicknames = data.map((p: any) => p.nickname)

  return NextResponse.json(nicknames)
}
