export interface TicketTier {
  id: string;
  name: string;
  description: string;
  price: string;
  available_qty: number;
}

export interface Store {
    id: string;
    name: string;
    slug: string;
    logo_image: string | null;
}

export interface Event {
  id: string;
  title: string;
  date: string; 
  location: string;
  price: string; 
  imageUrl: string;
  category: 'CONCERT' | 'FESTIVAL' | 'NIGHTLIFE' | 'THEATRE' | 'SPORTS' | 'ARTS' | 'OTHER';
  isSellingFast?: boolean;
  description?: string;
  tiers?: TicketTier[];
  organizer_name?: string;
  store?: Store | null; 
}


export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[]; // The actual array of data
}