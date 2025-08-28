import { supabaseAdmin } from '@/lib/supabase';

export interface CollectedData {
  source: string;
  source_id?: string;
  title?: string;
  content?: string;
  url?: string;
  author?: string;
  metadata?: any;
  trend_score?: number;
}

export abstract class BaseCollector {
  protected source: string;

  constructor(source: string) {
    this.source = source;
  }

  abstract collect(): Promise<CollectedData[]>;

  protected async saveData(data: CollectedData[]): Promise<void> {
    try {
      const { error } = await supabaseAdmin.from('collected_data').insert(
        data.map(item => ({
          ...item,
          source: this.source,
          collected_at: new Date().toISOString(),
        }))
      );

      if (error) {
        console.error(`Error saving ${this.source} data:`, error);
        await this.logError(`Failed to save data: ${error.message}`);
      } else {
        await this.logInfo(`Successfully saved ${data.length} items`);
      }
    } catch (error) {
      console.error(`Error in saveData for ${this.source}:`, error);
      await this.logError(`Exception in saveData: ${error}`);
    }
  }

  protected async logInfo(message: string, details?: any): Promise<void> {
    await supabaseAdmin.from('system_logs').insert({
      log_level: 'info',
      component: `collector_${this.source}`,
      message,
      details,
    });
  }

  protected async logError(message: string, details?: any): Promise<void> {
    await supabaseAdmin.from('system_logs').insert({
      log_level: 'error',
      component: `collector_${this.source}`,
      message,
      details,
    });
  }

  protected async getLastFetchTime(): Promise<Date | null> {
    const { data } = await supabaseAdmin
      .from('data_sources')
      .select('last_fetched_at')
      .eq('name', this.source)
      .single();

    return data?.last_fetched_at ? new Date(data.last_fetched_at) : null;
  }

  protected async updateLastFetchTime(): Promise<void> {
    await supabaseAdmin
      .from('data_sources')
      .update({ last_fetched_at: new Date().toISOString() })
      .eq('name', this.source);
  }

  async collectAndSave(): Promise<CollectedData[]> {
    try {
      await this.logInfo(`Starting collection for ${this.source}`);
      const data = await this.collect();
      
      if (data.length > 0) {
        await this.saveData(data);
        await this.updateLastFetchTime();
      }

      await this.logInfo(`Collection completed for ${this.source}`, {
        items_collected: data.length,
      });

      return data;
    } catch (error) {
      await this.logError(`Collection failed for ${this.source}`, { error });
      throw error;
    }
  }
}