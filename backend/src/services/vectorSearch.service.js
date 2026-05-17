const { ChromaClient } = require('chromadb')

const COLLECTION_NAME = 'klypup_docs'
let collection = null

async function getCollection() {
  if (collection) return collection
  const client = new ChromaClient({ path: process.env.CHROMADB_URL || 'http://localhost:8000' })
  collection = await client.getOrCreateCollection({ name: COLLECTION_NAME })
  return collection
}

async function searchDocuments(query, companies = []) {
  try {
    const col = await getCollection()
    const queryParams = {
      queryTexts: [query],
      nResults: 4,
    }
    if (companies.length > 0) {
      queryParams.where = { company: { $in: companies.map((c) => c.toUpperCase()) } }
    }

    const results = await col.query(queryParams)

    const documents = results.documents[0] ?? []
    const metadatas = results.metadatas[0] ?? []
    const distances = results.distances[0] ?? []

    return documents.map((text, i) => ({
      text,
      company: metadatas[i]?.company ?? null,
      source: metadatas[i]?.source ?? 'Financial Filing',
      relevanceScore: parseFloat((1 - distances[i]).toFixed(3)),
    }))
  } catch (err) {
    console.warn('ChromaDB search failed:', err.message)
    return []
  }
}

module.exports = { searchDocuments }
