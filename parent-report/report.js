import { periods, students, tables } from './data.js';

const shortDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const longDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' });
const date = (iso, formatter = shortDate) => formatter.format(new Date(iso + 'T00:00:00Z'));
const dateRange = (start, end) => `${date(start, longDate)} – ${date(end, longDate)} ${end.slice(0, 4)}`;
const average = (items) => items.length ? items.reduce((sum, value) => sum + value, 0) / items.length : null;
const share = (count, total) => total ? count / total : null;
const percent = (ratio) => ratio === null ? '—' : `${Math.round(ratio * 100)}%`;
const level = (ratio) => ratio === null ? null : Math.round(ratio * 5);
const toText = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => toText[char]);

const studentSelect = document.querySelector('#student');
const periodSelect = document.querySelector('#period');
const printButton = document.querySelector('#print');
const params = new URLSearchParams(location.search);

function setOptions(select, items, label, preferred) {
  for (const item of items) select.add(new Option(label(item), item.id));
  if (items.some(({ id }) => id === preferred)) select.value = preferred;
}

setOptions(studentSelect, students, ({ name }) => name, params.get('student'));
setOptions(periodSelect, periods, ({ start, end }) => dateRange(start, end), params.get('period'));

function getRows(student, { start, end }) {
  return Object.fromEntries(Object.entries(tables).map(([name, rows]) => [
    name, rows.filter((row) => row.student === student && row.date >= start && row.date <= end),
  ]));
}

function getReport(rows) {
  const attended = rows.lessons.filter((row) => row.attended);
  const submitted = rows.homework.filter((row) => row.quality !== null);
  const onTime = submitted.filter((row) => row.status === 'в срок');
  const eventCount = rows.events.filter((row) => row.attended).length;
  const quality = average(submitted.map((row) => row.quality / 100));
  const gradeAverage = average(rows.checks.map((row) => row.grade / 5));
  const mastery = average([quality, gradeAverage].filter((value) => value !== null));
  const activity = average(attended.map((row) => row.activity / 5));
  const best = rows.checks.reduce((best, row) => row.grade > best.grade ? row : best);
  const weakest = rows.checks.reduce((weakest, row) => row.grade < weakest.grade ? row : weakest);
  const missing = rows.homework.find((row) => row.status === 'не сдано');
  const topicFocus = weakest.title === 'Проценты и задачи'
    ? 'Решить три задачи на проценты. В каждой сначала подписать, какую величину принимаем за 100%.'
    : 'Разобрать три примера на дроби. Записывать общий знаменатель и каждый шаг решения.';
  const habitFocus = missing
    ? `Вернуться к заданию «${missing.title}» и согласовать с учителем срок сдачи.`
    : 'Перед сдачей домашней работы перечитывать условие и проверять один ответ подстановкой.';
  const activitiesFocus = eventCount < rows.events.length
    ? 'Выбрать одно мероприятие на ближайшие две недели и заранее внести его в расписание.'
    : 'На каждом уроке попробовать задать один вопрос или предложить свой способ решения.';

  return {
    metrics: [
      ['Посещаемость', percent(share(attended.length, rows.lessons.length)),
        `${attended.length} из ${rows.lessons.length} уроков`],
      ['Домашние задания', percent(share(submitted.length, rows.homework.length)),
        `Сдано ${submitted.length} из ${rows.homework.length}`],
      ['Качество ДЗ', percent(quality), 'Средний балл за сданные работы'],
    ],
    ratings: [
      ['Освоение материалов', level(mastery)],
      ['Активность на уроках', level(activity)],
      ['Соблюдение сроков', level(share(onTime.length, rows.homework.length))],
      ['Вовлечённость во внешкольные мероприятия', level(share(eventCount, rows.events.length))],
    ],
    feedback: [
      ['Что получилось', `Хороший результат по теме «${best.title}» — ${best.grade} из 5. Выполнено ${submitted.length} из ${rows.homework.length} домашних заданий, и это помогает закрепить материал.`],
      ['Что подтянуть', `Начать стоит с темы «${weakest.title}» (${weakest.grade} из 5). Достаточно короткой практики с проверкой каждого шага.${missing ? ' Одно задание пока не сдано.' : ''}`],
      ['На что опереться', `Посещено ${attended.length} из ${rows.lessons.length} уроков. Эта регулярность помогает двигаться дальше и спокойно разбирать сложные темы.`],
    ],
    focus: [topicFocus, habitFocus, activitiesFocus],
  };
}

function ratingRow(label, value) {
  const dots = Array.from({ length: 5 }, (_, i) =>
    `<span class="dot${i < value ? ' filled' : ''}"></span>`).join('');
  const equivalent = value === null ? 'нет данных' : `${value} из 5`;
  return `<li><span>${label}</span><span class="rating-score"><span class="dots" aria-hidden="true">${dots}</span><small>${equivalent}</small></span></li>`;
}

function renderReport(student, period, rows) {
  const { metrics, ratings, feedback, focus } = getReport(rows);
  document.querySelector('#report').innerHTML = `
    <header class="sheet-heading">
      <div>
        <p class="sheet-eyebrow">Двухнедельный отчёт</p>
        <h1 id="report-title">Родительский отчёт</h1>
        <p class="student-name">${escape(student.name)} <span>· ${escape(student.grade)}</span></p>
      </div>
      <div class="sheet-period"><span>Учебный период</span><strong>${dateRange(period.start, period.end)}</strong></div>
    </header>
    <div class="sheet-body">
      <section class="report-metrics" aria-label="Показатели за период">
        ${metrics.map(([label, value, detail]) => `<div class="report-metric"><p>${label}</p><strong>${value}</strong><small>${detail}</small></div>`).join('')}
      </section>
      <section class="sheet-section">
        <h2>Проверочные работы</h2>
        <div class="assessment-grid">${rows.checks.map(({ date: day, title, grade, comment }) => `
          <article class="assessment">
            <div class="assessment-heading"><div><p class="assessment-date">${date(day)}</p><h3>${escape(title)}</h3></div><strong aria-label="Оценка ${grade} из 5">${grade}/5</strong></div>
            <p>${escape(comment)}</p>
          </article>`).join('')}
        </div>
      </section>
      <section class="sheet-section feedback">
        <h2>Обратная связь за период</h2>
        ${feedback.map(([label, paragraph]) => `<p><strong>${label}.</strong> ${escape(paragraph)}</p>`).join('')}
      </section>
      <div class="sheet-columns">
        <section class="sheet-section">
          <h2>Учебные привычки</h2>
          <ul class="rating-list">${ratings.map(([label, value]) => ratingRow(label, value)).join('')}</ul>
        </section>
        <section class="sheet-section">
          <h2>Фокус следующих двух недель</h2>
          <p class="focus-period">${dateRange(period.nextStart, period.nextEnd)}</p>
          <ol class="focus-list">${focus.map((item) => `<li>${escape(item)}</li>`).join('')}</ol>
        </section>
      </div>
    </div>
    <footer class="sheet-footer">Спасибо за доверие, включённость и ваш вклад в развитие ребёнка. Поддержка дома помогает закреплять учебные привычки и замечать прогресс.</footer>
    <p class="sheet-stamp">Демонстрационный отчёт · вымышленные данные</p>`;
}

function sourceTable(title, headings, rows) {
  return `<div class="table-wrap"><table><caption>${title}</caption><thead><tr>${headings.map((value) =>
    `<th scope="col">${value}</th>`).join('')}</tr></thead><tbody>${rows.map((row) =>
    `<tr>${row.map((value) => `<td>${escape(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function renderSources({ lessons, homework, checks, events }) {
  document.querySelector('#source-tables').innerHTML = [
    sourceTable('Посещаемость и активность', ['Дата', 'Посещение', 'Активность'],
      lessons.map((row) => [date(row.date), row.attended ? 'Присутствие' : 'Пропуск', row.activity === null ? '—' : `${row.activity}/5`])),
    sourceTable('Домашние задания', ['Срок сдачи', 'Тема', 'Статус', 'Качество'],
      homework.map((row) => [date(row.date), row.title, row.status, row.quality === null ? '—' : `${row.quality}%`])),
    sourceTable('Проверочные работы', ['Дата', 'Тема', 'Оценка', 'Комментарий учителя'],
      checks.map((row) => [date(row.date), row.title, `${row.grade}/5`, row.comment])),
    sourceTable('Внешкольные мероприятия', ['Дата', 'Мероприятие', 'Участие'],
      events.map((row) => [date(row.date), row.title, row.attended ? 'Да' : 'Нет'])),
  ].join('');
}

function render() {
  const student = students.find(({ id }) => id === studentSelect.value);
  const period = periods.find(({ id }) => id === periodSelect.value);
  const rows = getRows(student.id, period);
  renderReport(student, period, rows);
  renderSources(rows);
}

studentSelect.addEventListener('change', render);
periodSelect.addEventListener('change', render);
printButton.addEventListener('click', async () => {
  await document.fonts.ready;
  const previousTitle = document.title;
  document.title = `Родительский отчёт - ${studentSelect.selectedOptions[0].text} - ${periodSelect.selectedOptions[0].text}`;
  window.print();
  document.title = previousTitle;
});

render();
printButton.disabled = false;
