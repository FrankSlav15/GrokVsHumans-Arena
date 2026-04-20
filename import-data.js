const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)

async function importData() {
  const dataDir = '/tmp/old-grokvs/data'
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'))

  for (const file of files) {
    const filePath = path.join(dataDir, file)
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    
    if (Array.isArray(data)) {
      const { error } = await supabase.from('threads').insert(data)
      if (error) console.error(`Error importing ${file}:`, error.message)
      else console.log(`Imported ${file} (${data.length} records)`)
    }
  }
  console.log('Import complete!')
}

importData()