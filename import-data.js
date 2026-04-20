const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient(
  'https://lrnsatuxwefptqweunpk.supabase.co',
  'sb_publishable_fKA7NXh8T2m42XTJvndu8w_PsgKNYJ3'
)

async function importFile(filename, type) {
  const data = JSON.parse(fs.readFileSync(`/tmp/old-grokvs/data/${filename}`, 'utf8'))
  const items = Object.values(data)

  for (const item of items) {
    const threadPost = item.threadPosts?.[0] || {}
    
    const { error } = await supabase.from('threads').insert({
      type: type,
      title: item.title,
      description: item.description,
      content: threadPost.text || item.description,
      image: item.image,
      tags: item.tags,
      x_link: item.xLink,
      author: threadPost.author || threadPost.username,
      votes_human: 0,
      votes_grok: 0
    })
    
    if (error) console.error(`${filename} error:`, error.message)
    else console.log(`Imported ${filename}:`, item.title)
  }
}

async function main() {
  await importFile('battles.json', 'battle')
  await importFile('memes.json', 'meme')
  await importFile('categories.json', 'ai_content')
  console.log('All imports complete!')
}

main()