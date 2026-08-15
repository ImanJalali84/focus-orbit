import type {
  PriorityMapBand,
  PriorityMapCategory,
  PriorityMapTask
} from '@iman_jalali/priority-map';

export type Category = PriorityMapCategory;
export type PriorityBand = PriorityMapBand;

export interface PlannerTask extends PriorityMapTask {
  description: string;
  done: boolean;
  createdAt: string;
  dueDate?: string;
}

export interface PlannerState {
  categories: Category[];
  priorityBands: PriorityBand[];
  tasks: PlannerTask[];
}
