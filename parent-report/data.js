export const students = [
  { id: 'maria', name: 'Мария Волкова', grade: '7 класс' },
  { id: 'ilya', name: 'Илья Морозов', grade: '7 класс' },
];

export const periods = [
  { id: 'nov-09', start: '2026-11-09', end: '2026-11-22', nextStart: '2026-11-23', nextEnd: '2026-12-06' },
  { id: 'oct-26', start: '2026-10-26', end: '2026-11-08', nextStart: '2026-11-09', nextEnd: '2026-11-22' },
];

const lessonDays = [0, 2, 4, 7, 9, 11];
const homeworkTitles = ['Дроби', 'Операции с дробями', 'Пропорции', 'Проценты', 'Задачи на проценты', 'Смешанный тренинг'];
const checkTitles = ['Дроби и пропорции', 'Проценты и задачи'];
const eventTitles = ['Математический клуб', 'Командная викторина'];

// Homework records contain status and a teacher's quality score out of 100.
const examples = [
  {
    student: 'maria', period: 'nov-09',
    activity: [4, 5, null, 4, 5, 4],
    homework: [['в срок', 94], ['в срок', 86], ['позже срока', 75], ['в срок', 93], ['не сдано', null], ['в срок', 90]],
    checks: [[5, 'Уверенно приводит дроби к общему знаменателю и понятно записывает ход решения.'],
      [4, 'Верно выбирает способ решения. В задачах на проценты стоит проверять, какая величина принята за 100%.']],
    events: [true, false],
  },
  {
    student: 'maria', period: 'oct-26',
    activity: [3, null, 4, 4, 3, 4],
    homework: [['в срок', 86], ['позже срока', 72], ['в срок', 82], ['в срок', 83], ['не сдано', null], ['позже срока', 78]],
    checks: [[4, 'Верно выполняет операции с дробями. Стоит подписывать промежуточные результаты.'],
      [3, 'Понимает, что такое процент. Пока не всегда выделяет исходную величину в условии задачи.']],
    events: [false, false],
  },
  {
    student: 'ilya', period: 'nov-09',
    activity: [3, 2, 3, 4, 3, 4],
    homework: [['в срок', 83], ['в срок', 79], ['в срок', 87], ['в срок', 85], ['в срок', 92], ['в срок', 90]],
    checks: [[4, 'Правильно составляет пропорции. Полезно перечитывать условие перед записью ответа.'],
      [5, 'Аккуратно решает задачи на проценты и проверяет результат подстановкой.']],
    events: [true, true],
  },
  {
    student: 'ilya', period: 'oct-26',
    activity: [2, 3, 3, null, 4, 3],
    homework: [['в срок', 71], ['в срок', 78], ['позже срока', 76], ['в срок', 80], ['в срок', 85], ['в срок', 88]],
    checks: [[3, 'Важно записывать каждый шаг при приведении к общему знаменателю.'],
      [4, 'Уверенно находит процент от числа. В сложных задачах помогает краткая схема условия.']],
    events: [true, false],
  },
];

function dateFrom(start, offset) {
  const date = new Date(start + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export const tables = { lessons: [], homework: [], checks: [], events: [] };

for (const example of examples) {
  const period = periods.find(({ id }) => id === example.period);
  const row = (day) => ({ student: example.student, date: dateFrom(period.start, day) });

  example.activity.forEach((activity, i) => {
    tables.lessons.push({ ...row(lessonDays[i]), attended: activity !== null, activity });
    const [status, quality] = example.homework[i];
    tables.homework.push({ ...row(lessonDays[i] + 1), title: homeworkTitles[i], status, quality });
  });
  example.checks.forEach(([grade, comment], i) => {
    tables.checks.push({ ...row([4, 11][i]), title: checkTitles[i], grade, comment });
  });
  example.events.forEach((attended, i) => {
    tables.events.push({ ...row([5, 12][i]), title: eventTitles[i], attended });
  });
}
