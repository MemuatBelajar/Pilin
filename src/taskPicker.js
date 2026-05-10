export function getDeadlineTime(task) {
  return task.deadline ? new Date(`${task.deadline}T23:59:59`).getTime() : null
}

export function isUrgent(task) {
  const deadlineTime = getDeadlineTime(task)
  if (!deadlineTime) return false

  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  tomorrow.setHours(23, 59, 59, 999)

  return deadlineTime <= tomorrow.getTime()
}

const PRIORITY_BY_MOOD = {
  lelah: ['ringan'],
  cukup: ['sedang', 'ringan', 'berat'],
  semangat: ['berat', 'sedang', 'ringan'],
}

export function chooseTask(tasks, mood) {
  const unfinished = tasks.filter((task) => !task.done)
  if (unfinished.length === 0 || !mood) return null

  const urgentTasks = unfinished
    .filter(isUrgent)
    .sort((a, b) => getDeadlineTime(a) - getDeadlineTime(b))

  if (urgentTasks.length > 0) return urgentTasks[0]

  const priority = PRIORITY_BY_MOOD[mood]
  for (const energy of priority) {
    const match = unfinished.find((task) => task.energy === energy)
    if (match) return match
  }

  if (mood === 'lelah') return null

  return unfinished[0]
}
