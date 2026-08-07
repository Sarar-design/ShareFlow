export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  rating: number;
  reviewsCount: number;
  level: number;
  xp: number;
  maxXp: number;
  badges: string[];
  followers: number;
  following: number;
  isFollowing?: boolean;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ownerId: string;
  ownerName: string;
  distance: number;
  rentalPeriod: string;
  category: string;
  type: 'izposoja' | 'prošnja' | 'izmenjava'| 'prodaja' | 'oddaja' ;
  rating: number;
  reviewsCount: number;
  availableDates: { [date: string]: { selected: boolean; selectedColor?: string } };
  price?: string;
  status?: 'active' | 'archived';
  archivedAt?: string;
  tags?: string[]; 
  likesCount?: number; 
}

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  imageUrl: string;
  interestedFriends: number;
  spotsLeft?: number;
}

export interface Reservation {
  id: string;
  itemId: string;
  userId: string;        
  ownerId?: string;      
  status: 'potrjena' | 'aktivna' | 'končana';
  startDate: string;
  endDate: string;
  remainingTime?: string;
  rated?: boolean;
}

export interface Review {
  id: string;
  userId: string;        
  reviewerId: string;    
  reviewerName?: string; 
  reservationId: string;
  rating: number;
  text: string;
  date?: string;
  createdAt?: any;       
}

