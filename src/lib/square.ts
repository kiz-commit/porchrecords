import { SquareClient, SquareEnvironment } from "square";
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config({ path: '.env.local' });

// Determine environment based on SQUARE_ENVIRONMENT variable
const environment = process.env.SQUARE_ENVIRONMENT === 'production' 
  ? SquareEnvironment.Production 
  : SquareEnvironment.Sandbox;

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment,
});

// Rate limiting wrapper for Square API calls
class RateLimitedSquareClient {
  private client: SquareClient;
  private lastCallTime = 0;
  private minInterval = 100; // Minimum 100ms between calls (10 calls per second)

  constructor(client: SquareClient) {
    this.client = client;
  }

  private async delayIfNeeded() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    
    if (timeSinceLastCall < this.minInterval) {
      const delay = this.minInterval - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastCallTime = Date.now();
  }

  async catalog() {
    const catalog = this.client.catalog;
    
    return {
      ...catalog,
      searchItems: async (request: any) => {
        await this.delayIfNeeded();
        return catalog.searchItems(request);
      },
      search: async (request: any) => {
        await this.delayIfNeeded();
        return catalog.search(request);
      },
      object: {
        ...catalog.object,
        get: async (request: any) => {
          await this.delayIfNeeded();
          return catalog.object.get(request);
        },
        delete: async (request: any) => {
          await this.delayIfNeeded();
          return catalog.object.delete(request);
        }
      },
      batchUpsert: async (request: any) => {
        await this.delayIfNeeded();
        return catalog.batchUpsert(request);
      }
    };
  }

  async inventory() {
    const inventory = this.client.inventory;
    
    return {
      ...inventory,
      batchGetCounts: async (request: any) => {
        await this.delayIfNeeded();
        return inventory.batchGetCounts(request);
      },
      batchCreateChanges: async (request: any) => {
        await this.delayIfNeeded();
        return inventory.batchCreateChanges(request);
      }
    };
  }

  async orders() {
    const orders = this.client.orders;
    
    return {
      ...orders,
      search: async (request: any) => {
        await this.delayIfNeeded();
        return orders.search(request);
      },
      update: async (request: any) => {
        await this.delayIfNeeded();
        return orders.update(request);
      },
      create: async (request: any) => {
        await this.delayIfNeeded();
        return orders.create(request);
      }
    };
  }
}

// Export rate-limited client
export default new RateLimitedSquareClient(client); 