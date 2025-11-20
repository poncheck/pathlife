export interface Photo {
  id: string;
  immichId: string;
  immichUrl: string;
  thumbnailUrl: string | null;
  takenAt: string;
  selected: boolean;
  metadata: string | null;
  diaryEntryId: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  stravaId: string;
  name: string;
  type: string;
  distance: number | null;
  movingTime: number | null;
  elapsedTime: number | null;
  totalElevation: number | null;
  startDate: string;
  endDate: string | null;
  polyline: string | null;
  metadata: string | null;
  diaryEntryId: string;
  createdAt: string;
}

export interface Location {
  id: string;
  traccarId: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  timestamp: string;
  speed: number | null;
  altitude: number | null;
  metadata: string | null;
  diaryEntryId: string;
  createdAt: string;
}

export interface DiaryEntry {
  id: string;
  date: string;
  description: string | null;
  photos: Photo[];
  activities: Activity[];
  locations: Location[];
  createdAt: string;
  updatedAt: string;
}

export interface SyncLog {
  id: string;
  source: string;
  status: string;
  message: string | null;
  itemCount: number;
  timestamp: string;
}
