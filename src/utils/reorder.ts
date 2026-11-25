import type { Task, TimeSlot } from '../types';

export interface DragReorderResult {
  orderedIds: string[];
  slotPatch?: Record<string, TimeSlot>;
}

export function computeDragReorder(
  dayTasks: Task[],
  draggingId: string,
  targetId: string,
): DragReorderResult | null {
  if (!draggingId || draggingId === targetId) return null;

  const draggingIdx = dayTasks.findIndex((t) => t.id === draggingId);
  const targetIdx = dayTasks.findIndex((t) => t.id === targetId);
  if (draggingIdx === -1 || targetIdx === -1) return null;

  const draggingTask = dayTasks[draggingIdx];
  const targetTask = dayTasks[targetIdx];

  const ids = dayTasks.map((t) => t.id);
  const withoutDragging = ids.filter((id) => id !== draggingId);
  const targetPos = withoutDragging.indexOf(targetId);

  // Moving downward inserts AFTER target; moving upward inserts BEFORE target
  const insertAt = draggingIdx < targetIdx ? targetPos + 1 : targetPos;
  withoutDragging.splice(insertAt, 0, draggingId);

  const slotChanged = draggingTask.timeSlot !== targetTask.timeSlot;
  const orderChanged = withoutDragging.some((id, i) => id !== ids[i]);

  if (!slotChanged && !orderChanged) return null;

  return {
    orderedIds: withoutDragging,
    slotPatch: slotChanged ? { [draggingId]: targetTask.timeSlot } : undefined,
  };
}

export function computeSlotMove(
  dayTasks: Task[],
  taskId: string,
  direction: 'up' | 'down',
): string[] | null {
  const current = dayTasks.find((t) => t.id === taskId);
  if (!current) return null;

  const sameSlot = dayTasks.filter((t) => t.timeSlot === current.timeSlot);
  const slotIdx = sameSlot.findIndex((t) => t.id === taskId);
  const swapSlotIdx = direction === 'up' ? slotIdx - 1 : slotIdx + 1;
  if (swapSlotIdx < 0 || swapSlotIdx >= sameSlot.length) return null;

  const partnerId = sameSlot[swapSlotIdx].id;
  const ids = dayTasks.map((t) => t.id);
  const a = ids.indexOf(taskId);
  const b = ids.indexOf(partnerId);
  if (a === -1 || b === -1) return null;

  const nextIds = [...ids];
  [nextIds[a], nextIds[b]] = [nextIds[b], nextIds[a]];
  return nextIds;
}
