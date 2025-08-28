import Parser from 'rss-parser';
import { BaseCollector, CollectedData } from './base';
import { supabaseAdmin } from '@/lib/supabase';

const parser = new Parser();

export class RSSCollector extends BaseCollector {
  private feedUrl: string;
  private category: string;

  constructor(name: string, feedUrl: string, category: string) {
    super(name);
    this.feedUrl = feedUrl;
    this.category = category;
  }

  async collect(): Promise<CollectedData[]> {
    try {
      const feed = await parser.parseURL(this.feedUrl);
      const lastFetch = await this.getLastFetchTime();
      
      const items: CollectedData[] = [];
      
      for (const item of feed.items || []) {
        // Skip if we've already processed this item
        if (lastFetch && item.pubDate) {
          const itemDate = new Date(item.pubDate);
          if (itemDate <= lastFetch) {
            continue;
          }
        }

        // Check if item already exists
        const { data: existing } = await supabaseAdmin
          .from('collected_data')
          .select('id')
          .eq('source', this.source)
          .eq('url', item.link || '')
          .single();

        if (!existing) {
          items.push({
            source: this.source,
            source_id: item.guid || item.link,
            title: item.title,
            content: item.contentSnippet || item.content || item.summary,
            url: item.link,
            author: item.creator || item.author || feed.title,
            metadata: {
              category: this.category,
              pubDate: item.pubDate,
              categories: item.categories,
            },
          });
        }
      }

      return items;
    } catch (error) {
      console.error(`RSS collection error for ${this.source}:`, error);
      await this.logError(`RSS collection failed: ${error}`);
      return [];
    }
  }
}

export class RSSCollectorManager {
  private collectors: RSSCollector[] = [];

  async initialize() {
    // Load RSS sources from database
    const { data: sources } = await supabaseAdmin
      .from('data_sources')
      .select('*')
      .eq('type', 'rss')
      .eq('is_active', true);

    if (sources) {
      for (const source of sources) {
        const config = source.configuration as any;
        if (config?.url) {
          this.collectors.push(
            new RSSCollector(
              source.name,
              config.url,
              config.category || 'General'
            )
          );
        }
      }
    }
  }

  async collectAll(): Promise<CollectedData[]> {
    const allData: CollectedData[] = [];
    
    for (const collector of this.collectors) {
      try {
        const data = await collector.collectAndSave();
        allData.push(...data);
      } catch (error) {
        console.error(`Error in RSS collector:`, error);
      }
    }

    return allData;
  }
}