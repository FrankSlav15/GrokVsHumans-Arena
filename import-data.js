const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabase = createClient(
  'https://lrnsatuxwefptqweunpk.supabase.co',
  'sb_publishable_fKA7NXh8T2m42XTJvndu8w_PsgKNYJ3'
)

async function importBattles() {
  const data = JSON.parse(fs.readFileSync('/tmp/old-grokvs/data/battles.json', 'utf8'))
  const battles = Object.values(data)

  for (const battle of battles) {
    const threadPost = battle.threadPosts?.[0] || {}
    
    const { error } = await supabase.from('threads').insert({
      type: 'battle',
      title: battle.title,
      description: battle.description,
      content: threadPost.text || battle.description,
      image: battle.image,
      tags: battle.tags,
      x_link: battle.xLink,
      author: threadPost.author || threadPost.username,
      votes_human: 0,
      votes_grok: 0
    })
    
    if (error) console.error('Battle error:', error.message)
    else console.log('Imported battle:', battle.title)
  }
}

async function importMemes() {
  const data = JSON.parse(fs.readFileSync('/tmp/old-grokvs/data/memes.json', 'utf8'))
  const memes = Object.values(data)

  for (const meme of memes) {
    const { error } = await supabase.from('threads').insert({
      type: 'meme',
      title: meme.title,
      description: meme.description,
      content: meme.description,
      image: meme.image,
      tags: meme.tags,
      x_link: meme.xLink,
      author: null,
      votes_human: 0,
      votes_grok: 0
    })
    
    if (error) console.error('Meme error:', error.message)
    else console.log('Imported meme:', meme.title)
  }
}

async function main() {
  await importBattles()
  await importMemes()
  console.log('All imports complete!')
}

main()