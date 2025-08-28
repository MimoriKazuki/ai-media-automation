#!/usr/bin/env node

/**
 * Test script for article generation pipeline
 * Usage: npx tsx scripts/test-pipeline.ts
 */

import { config } from 'dotenv';
import { DataCollectionOrchestrator } from '../lib/collectors';
import { EnhancedArticlePipeline } from '../lib/pipeline/enhanced';
import { automationScheduler } from '../lib/automation/scheduler';

// Load environment variables
config({ path: '.env.local' });

async function testDataCollection() {
  console.log('\n========================================');
  console.log('Testing Data Collection');
  console.log('========================================\n');

  const collector = new DataCollectionOrchestrator();
  await collector.initialize();
  
  console.log('Starting data collection from all sources...');
  const result = await collector.collectAll();
  
  console.log('\nCollection Results:');
  console.log('- Total collected:', result.totalCollected);
  console.log('- By source:', result.bySource);
  
  if (result.data.length > 0) {
    console.log('\nSample data (first 3 items):');
    result.data.slice(0, 3).forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.title}`);
      console.log(`   Source: ${item.source}`);
      console.log(`   URL: ${item.url}`);
      console.log(`   Score: ${item.trend_score || 'N/A'}`);
    });
  }

  return result;
}

async function testArticleGeneration() {
  console.log('\n========================================');
  console.log('Testing Article Generation Pipeline');
  console.log('========================================\n');

  const pipeline = new EnhancedArticlePipeline({
    articlesPerRun: 2, // Generate only 2 articles for testing
    qualityThreshold: 70,
    autoPublishThreshold: 85,
    minDataPoints: 3,
  });

  console.log('Running enhanced pipeline...');
  const result = await pipeline.run();

  console.log('\nPipeline Results:');
  console.log('- Success:', result.success);
  console.log('- Articles generated:', result.articlesGenerated);
  console.log('- Articles published:', result.articlesPublished);
  console.log('- Trends analyzed:', result.trends.length);

  if (result.trends.length > 0) {
    console.log('\nTop trends:');
    result.trends.slice(0, 5).forEach((trend, index) => {
      console.log(`\n${index + 1}. ${trend.keyword}`);
      console.log(`   Score: ${trend.aggregatedScore.toFixed(2)}`);
      console.log(`   Data points: ${trend.dataPoints.length}`);
      console.log(`   Sources: ${trend.sources.join(', ')}`);
      console.log(`   Hot topic: ${trend.isHotTopic ? 'Yes' : 'No'}`);
    });
  }

  return result;
}

async function testAutomationScheduler() {
  console.log('\n========================================');
  console.log('Testing Automation Scheduler');
  console.log('========================================\n');

  console.log('Getting scheduler status...');
  const status = await automationScheduler.getStatus();

  console.log('\nScheduler Status:');
  console.log('- Running:', status.isRunning);
  console.log('- Last collection:', status.lastCollectionRun || 'Never');
  console.log('- Last generation:', status.lastGenerationRun || 'Never');
  console.log('- Last learning:', status.lastLearningRun || 'Never');
  
  console.log('\nConfiguration:');
  console.log('- Collection interval:', status.config.collectInterval, 'minutes');
  console.log('- Generation interval:', status.config.generateInterval, 'hours');
  console.log('- Learning interval:', status.config.learningInterval, 'days');
  console.log('- Articles per run:', status.config.articlesPerRun);
  
  console.log('\nStats (last 24h):');
  console.log('- Articles created:', status.stats.articlesLast24h);
  console.log('- Average quality:', status.stats.averageQuality.toFixed(2));
  console.log('- Status breakdown:', status.stats.statusBreakdown);

  return status;
}

async function testFullCycle() {
  console.log('\n========================================');
  console.log('Testing Full Automation Cycle');
  console.log('========================================\n');

  // Step 1: Collect data
  console.log('Step 1: Collecting data...');
  const collectionResult = await testDataCollection();

  if (collectionResult.totalCollected === 0) {
    console.log('\n❌ No data collected. Stopping test.');
    return;
  }

  // Step 2: Generate articles
  console.log('\nStep 2: Generating articles...');
  const generationResult = await testArticleGeneration();

  if (!generationResult.success) {
    console.log('\n❌ Article generation failed. Stopping test.');
    return;
  }

  // Step 3: Check scheduler status
  console.log('\nStep 3: Checking scheduler...');
  const schedulerStatus = await testAutomationScheduler();

  console.log('\n========================================');
  console.log('✅ Full cycle test completed successfully!');
  console.log('========================================');
  
  console.log('\nSummary:');
  console.log('- Data collected:', collectionResult.totalCollected);
  console.log('- Articles generated:', generationResult.articlesGenerated);
  console.log('- Articles published:', generationResult.articlesPublished);
  console.log('- Scheduler ready:', !schedulerStatus.isRunning);
}

// Main execution
async function main() {
  console.log('🚀 AI Media Automation - Pipeline Test');
  console.log('======================================');
  
  const args = process.argv.slice(2);
  const testType = args[0] || 'full';

  try {
    switch (testType) {
      case 'collect':
        await testDataCollection();
        break;
      case 'generate':
        await testArticleGeneration();
        break;
      case 'scheduler':
        await testAutomationScheduler();
        break;
      case 'full':
      default:
        await testFullCycle();
        break;
    }
    
    console.log('\n✅ Test completed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}