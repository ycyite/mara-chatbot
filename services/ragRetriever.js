const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');

class RAGRetriever {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.knowledgeBase = [];
    this.embeddings = [];
  }

  /**
   * Initialize knowledge base from JSON files
   */
  async initialize() {
    try {
      const dataPath = path.join(__dirname, '..', 'data', 'knowledge.json');
      const rawData = await fs.readFile(dataPath, 'utf-8');
      this.knowledgeBase = JSON.parse(rawData);
      console.log(`Loaded ${this.knowledgeBase.length} knowledge entries`);

      // Pre-compute embeddings for all knowledge chunks
      // In production, you'd store these in a vector database
      // For demo, we'll compute on-demand to save initial costs
    } catch (error) {
      console.error('Failed to load knowledge base:', error.message);
      this.knowledgeBase = this.getDefaultKnowledge();
    }
  }

  /**
   * Get default knowledge if file doesn't exist
   */
  getDefaultKnowledge() {
    return [
      {
        topic: 'fees',
        content: 'McMaster full-time students (6+ units) are automatically charged for gym and bus pass fees. Remote students may qualify for exemptions by contacting the MSU Student Council or Parking and Transit Office.',
        source: 'McMaster Fee Policy',
        metadata: { category: 'fees', keywords: ['gym', 'bus pass', 'tuition', 'remote'] }
      },
      {
        topic: 'remote_learning',
        content: 'McMaster offers degree completion programs for remote learners. Remote students have access to online resources, virtual advising, and student support services.',
        source: 'Remote Learning Guidelines',
        metadata: { category: 'academics', keywords: ['remote', 'online', 'distance'] }
      },
      {
        topic: 'wellness',
        content: 'Student Wellness Centre provides counseling and mental health support. Available 8am-10pm daily. Services include individual counseling, crisis support, and wellness workshops.',
        source: 'Student Services',
        metadata: { category: 'wellness', keywords: ['mental health', 'counseling', 'support', 'stress'] }
      },
      {
        topic: 'registration',
        content: 'Course registration opens based on your level and program. Contact your academic advisor for registration assistance. Full-time status requires 6+ units per semester.',
        source: 'Registrar Office',
        metadata: { category: 'academics', keywords: ['registration', 'courses', 'enrollment'] }
      }
    ];
  }

  /**
   * Search knowledge base using semantic similarity
   */
  async search(query, topK = 3) {
    try {
      // For production: use vector database like Pinecone or Weaviate
      // For demo: use keyword matching + optional embedding similarity

      // Simple keyword-based search
      const results = this.keywordSearch(query, topK);

      // If we have very few results, could enhance with embedding search
      if (results.length < 2 && process.env.OPENAI_API_KEY) {
        // Optional: implement embedding-based search
        // const embeddingResults = await this.embeddingSearch(query, topK);
        // results = this.mergeResults(results, embeddingResults);
      }

      return results;
    } catch (error) {
      console.error('RAG search error:', error);
      return [];
    }
  }

  /**
   * Keyword-based search (fallback/demo mode)
   */
  keywordSearch(query, topK) {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 3);

    const scored = this.knowledgeBase.map(entry => {
      let score = 0;

      // Check topic match
      if (queryLower.includes(entry.topic)) {
        score += 5;
      }

      // Check keyword matches
      if (entry.metadata && entry.metadata.keywords) {
        entry.metadata.keywords.forEach(keyword => {
          if (queryLower.includes(keyword.toLowerCase())) {
            score += 3;
          }
        });
      }

      // Check content matches
      queryWords.forEach(word => {
        if (entry.content.toLowerCase().includes(word)) {
          score += 1;
        }
      });

      return { ...entry, score };
    });

    return scored
      .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Embedding-based search (production mode)
   */
  async embeddingSearch(query, topK) {
    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);

      // Compare with knowledge base embeddings
      // In production: query vector database
      // For demo: compute similarity with cached embeddings

      const similarities = this.knowledgeBase.map((entry, idx) => {
        // Placeholder - would use actual embeddings
        const similarity = Math.random(); // Replace with cosine similarity
        return { entry, similarity, index: idx };
      });

      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK)
        .map(item => item.entry);
    } catch (error) {
      console.error('Embedding search error:', error);
      return [];
    }
  }

  /**
   * Generate embedding for text
   */
  async generateEmbedding(text) {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Embedding generation error:', error);
      return null;
    }
  }

  /**
   * Format retrieved documents for LLM context
   */
  formatContext(results) {
    if (results.length === 0) {
      return 'No specific information found in knowledge base. Provide general guidance.';
    }

    return results
      .map((result, idx) => `[Source ${idx + 1}: ${result.source}]\n${result.content}`)
      .join('\n\n');
  }

  /**
   * Add new knowledge entry (for dynamic updates)
   */
  addKnowledge(topic, content, source, metadata) {
    this.knowledgeBase.push({
      topic,
      content,
      source,
      metadata
    });
  }
}

module.exports = new RAGRetriever();
