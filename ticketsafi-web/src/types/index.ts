export interface TicketTier {
  id: string;
  name: string;
  description: string;
  price: string; // We will format this as string "1,500.00" from backend
  available_qty: number;
}

export interface Event {
  id: string;
  title: string;
  date: string; 
  location: string;
  price: string; 
  imageUrl: string;
  category: 'Concert' | 'Nightlife' | 'Festival' | 'Theatre';
  isSellingFast?: boolean;
  description?: string; // Added for details page
  tiers?: TicketTier[]; // Added for details page
  organizer_name?: string;
}