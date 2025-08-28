// Test new article writer API
async function testNewAPI() {
  try {
    console.log('Testing new article writer API...');
    console.log('Topic: AIエージェントの業務活用');
    console.log('---');
    
    const response = await fetch('http://localhost:3003/api/agents/article-writer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: 'AIエージェントの業務活用'
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('API Error:', data);
      return;
    }
    
    console.log('✅ Success! Article generated');
    console.log('---');
    console.log('Title:', data.article?.title);
    console.log('Meta Description:', data.article?.meta_description);
    console.log('Keywords:', data.article?.keywords?.join(', '));
    console.log('Word Count:', data.article?.word_count);
    console.log('---');
    console.log('Article Content (first 2000 chars):');
    console.log(data.article?.content?.substring(0, 2000));
    console.log('...');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testNewAPI();