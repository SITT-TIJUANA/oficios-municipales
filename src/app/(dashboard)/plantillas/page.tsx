import { createClient } from '@/lib/supabase/server'
import PlantillasPanel from '@/components/plantillas/PlantillasPanel'

export default async function PlantillasPage() {
  const supabase = await createClient()
  const { data: plantillas } = await supabase
    .from('plantillas_reporte')
    .select('*')
    .eq('activo', true)
    .order('created_at', { ascending: false })

  return <PlantillasPanel plantillas={plantillas ?? []} />
}
