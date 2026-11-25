import { describe, expect, it } from 'vitest';
import type { Task } from '../src/types';
import { computeDragReorder, computeSlotMove } from '../src/utils/reorder';

function makeTask(id: string, timeSlot: Task['timeSlot'], order: number): Task {
  return {
    id,
    title: id,
    date: '2026-11-24',
    timeSlot,
    priority: 'medium',
    estimatedPomodoros: 1,
    completedPomodoros: 0,
    completed: false,
    order,
    createdAt: 1,
    updatedAt: 1,
  };
}

describe('task reorder helpers', () => {
  it('drags a task downward past the immediately following item and past the last item', () => {
    const tasks = [
      makeTask('A', 'morning', 0),
      makeTask('B', 'morning', 1),
      makeTask('C', 'morning', 2),
    ];

    const moveDownOne = computeDragReorder(tasks, 'A', 'B');
    expect(moveDownOne?.orderedIds).toEqual(['B', 'A', 'C']);

    const moveToEnd = computeDragReorder(tasks, 'A', 'C');
    expect(moveToEnd?.orderedIds).toEqual(['B', 'C', 'A']);

    const moveUp = computeDragReorder(tasks, 'C', 'A');
    expect(moveUp?.orderedIds).toEqual(['C', 'A', 'B']);
  });

  it('returns null when drag target causes no change (prevents localStorage spam)', () => {
    const tasks = [makeTask('A', 'morning', 0), makeTask('B', 'morning', 1)];
    expect(computeDragReorder(tasks, 'A', 'A')).toBeNull();
  });

  it('swaps adjacent tasks within the same timeSlot even when other slots have interleaved orders', () => {
    const tasks = [
      makeTask('M1', 'morning', 0),
      makeTask('A1', 'afternoon', 1),
      makeTask('M2', 'morning', 2),
    ];

    const movedDown = computeSlotMove(tasks, 'M1', 'down');
    expect(movedDown).toEqual(['M2', 'A1', 'M1']);

    const movedUp = computeSlotMove(tasks, 'M2', 'up');
    expect(movedUp).toEqual(['M2', 'A1', 'M1']);

    expect(computeSlotMove(tasks, 'A1', 'up')).toBeNull();
  });
});
