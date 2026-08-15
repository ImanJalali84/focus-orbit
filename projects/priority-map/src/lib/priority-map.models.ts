export interface PriorityMapCategory {
  id: string;
  name: string;
  color: string;
}

export interface PriorityMapBand {
  id: string;
  name: string;
  min: number;
  max: number;
}

export interface PriorityMapTask {
  id: string;
  title: string;
  categoryId: string;
  priority: number;
  done?: boolean;
}
