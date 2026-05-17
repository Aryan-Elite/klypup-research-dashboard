require('dotenv').config()
const fs = require('fs')
const path = require('path')
const OpenAI = require('openai')
const { ChromaClient } = require('chromadb')

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const COLLECTION_NAME = 'klypup_docs'
const CHUNK_SIZE = 500
const CHUNK_OVERLAP = 100

const DOCUMENTS = [
  { file: 'nvidia_q3_2024.txt',      company: 'NVDA', source: 'NVIDIA Q3 FY2025 Earnings Report' },
  { file: 'apple_annual_2024.txt',   company: 'AAPL', source: 'Apple FY2024 Annual Results' },
  { file: 'tesla_q3_2024.txt',       company: 'TSLA', source: 'Tesla Q3 2024 Earnings Report' },
  { file: 'amd_q3_2024.txt',         company: 'AMD',  source: 'AMD Q3 2024 Earnings Report' },
  { file: 'microsoft_q1_2025.txt',   company: 'MSFT', source: 'Microsoft Q1 FY2025 Earnings Report' },
]

function chunkText(text) {
  const words = text.split(/\s+/)
  const chunks = []
  let i = 0
  while (i < words.length) {
    chunks.push(words.slice(i, i + CHUNK_SIZE).join(' '))
    i += CHUNK_SIZE - CHUNK_OVERLAP
  }
  return chunks
}

async function embedTexts(texts) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  })
  return response.data.map((d) => d.embedding)
}

async function seed() {
  const client = new ChromaClient({ path: process.env.CHROMADB_URL || 'http://localhost:8000' })

  try {
    await client.deleteCollection({ name: COLLECTION_NAME })
    console.log('Deleted existing collection')
  } catch (_) {}

  const collection = await client.createCollection({ name: COLLECTION_NAME })
  console.log('Created collection:', COLLECTION_NAME)

  const docsDir = path.join(__dirname, '../../documents')

  for (const doc of DOCUMENTS) {
    const filePath = path.join(docsDir, doc.file)
    const text = fs.readFileSync(filePath, 'utf-8')
    const chunks = chunkText(text)
    console.log(`\n${doc.company}: ${chunks.length} chunks from ${doc.file}`)

    const embeddings = await embedTexts(chunks)
    const ids = chunks.map((_, i) => `${doc.company}_chunk_${i}`)
    const metadatas = chunks.map(() => ({ company: doc.company, source: doc.source }))

    await collection.add({ ids, embeddings, documents: chunks, metadatas })
    console.log(`  Stored ${chunks.length} chunks for ${doc.company}`)
  }

  console.log('\nSeeding complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
