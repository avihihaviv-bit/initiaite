import { RESTAURANTS, RESTAURANT_DISHES, dishesForRestaurant, findDishById, findRestaurantById } from '@/data/restaurants';
import type { Restaurant, RestaurantDish, RestaurantSearchQuery } from '@/types';

/**
 * Abstraction over restaurant + menu lookup. Mock implementation searches a
 * small local dataset; a real implementation would call a restaurant/menu
 * API (e.g. Google Places + a nutrition-mapping service) behind this same
 * interface.
 */
export interface RestaurantServiceInterface {
  search(query: RestaurantSearchQuery): Promise<Restaurant[]>;
  getDishes(restaurantId: string): Promise<RestaurantDish[]>;
  getDishById(id: string): Promise<RestaurantDish | undefined>;
  getRestaurantById(id: string): Promise<Restaurant | undefined>;
}

const NETWORK_DELAY_MS = 320;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

class MockRestaurantService implements RestaurantServiceInterface {
  async search({ text, city, cuisine }: RestaurantSearchQuery): Promise<Restaurant[]> {
    await delay(NETWORK_DELAY_MS);
    let results = [...RESTAURANTS];

    if (text && text.trim()) {
      const q = normalize(text);
      results = results.filter((r) => {
        if (normalize(r.name).includes(q)) return true;
        if (r.cuisine.some((c) => normalize(c).includes(q))) return true;
        const dishes = dishesForRestaurant(r.id);
        return dishes.some((d) => normalize(d.name).includes(q));
      });
    }
    if (city) {
      results = results.filter((r) => normalize(r.city) === normalize(city));
    }
    if (cuisine) {
      results = results.filter((r) => r.cuisine.some((c) => normalize(c) === normalize(cuisine)));
    }
    return results;
  }

  async getDishes(restaurantId: string): Promise<RestaurantDish[]> {
    await delay(150);
    return dishesForRestaurant(restaurantId);
  }

  async getDishById(id: string): Promise<RestaurantDish | undefined> {
    await delay(80);
    return findDishById(id);
  }

  async getRestaurantById(id: string): Promise<Restaurant | undefined> {
    await delay(80);
    return findRestaurantById(id);
  }
}

export const restaurantService: RestaurantServiceInterface = new MockRestaurantService();

export function allCuisines(): string[] {
  const set = new Set<string>();
  RESTAURANTS.forEach((r) => r.cuisine.forEach((c) => set.add(c)));
  return Array.from(set).sort();
}

export function allCities(): string[] {
  return Array.from(new Set(RESTAURANTS.map((r) => r.city))).sort();
}

export { RESTAURANT_DISHES };
