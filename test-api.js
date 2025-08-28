// Test API for article generation
async function testAPI() {
  try {
    console.log('Testing article generation API...');
    
    const response = await fetch('http://localhost:3003/api/agents/research-team', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: 'AIエージェントの業務活用',
        mode: 'research'
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('API Error:', data);
      return;
    }
    
    console.log('Success! Article generated:');
    console.log('Title:', data.workflow?.finalArticle?.seo_title || 'No title');
    console.log('Quality Score:', data.workflow?.quality_score || 'N/A');
    console.log('\n--- First 500 characters of content ---');
    const article = data.workflow?.finalArticle;
    if (article) {
      console.log(JSON.stringify(article, null, 2).substring(0, 500));
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAPI();