import * as XLSX from 'xlsx';
import { ROLES } from '../data/roles';
import { ConflictItem, FilmGroup, Participant, Task } from '../types';

export function exportFilmLabToExcel(
  groups: FilmGroup[],
  participants: Participant[],
  tasks: Task[],
  conflicts: ConflictItem[]
) {
  // 1. Sheet 1: Film Groups & Members
  const rosterRows: any[] = [];
  for (const group of groups) {
    const members = participants.filter((p) => p.groupId === group.id);
    if (members.length === 0) {
      rosterRows.push({
        'Съёмочная группа': group.name,
        'Проект': group.projectTitle,
        'Жанр': group.genre,
        'Этап': group.stage,
        'ID участника': '-',
        'ФИО участника': 'Нет участников в группе',
        'Роль': '-',
        'Лимит роли в группе': '-',
        'VK ID': '-',
        'Ссылка VK': '-',
        'Пожелания по напарникам': '-',
        'Задач выполнено': '0%',
      });
    } else {
      for (const m of members) {
        const roleDef = ROLES[m.role];
        const memberTasks = tasks.filter((t) => t.assignedToId === m.id);
        const doneTasks = memberTasks.filter((t) => t.status === 'done');
        const progress = memberTasks.length > 0 ? `${Math.round((doneTasks.length / memberTasks.length) * 100)}% (${doneTasks.length}/${memberTasks.length})` : 'Нет задач';
        const partnerNames = m.preferredWithIds
          .map((id) => participants.find((p) => p.id === id)?.name || id)
          .join(', ');
        const avoidedNames = (m.avoidedWithIds || [])
          .map((id) => participants.find((p) => p.id === id)?.name || id)
          .join(', ');

        rosterRows.push({
          'Съёмочная группа': group.name,
          'Проект': group.projectTitle,
          'Жанр': group.genre,
          'Этап': group.stage,
          'ID участника': m.id,
          'ФИО участника': m.name,
          'Роль (закреплена куратором)': roleDef?.title || m.role,
          'Желаемые роли (из ЛК)': (m.desiredRoles || []).map((r) => ROLES[r]?.shortTitle || r).join(', ') || 'Не указаны',
          'Лимит роли в группе': `макс ${roleDef?.maxPerGroup || 1}`,
          'VK ID': m.vkId,
          'Ссылка VK': m.vkUrl,
          'Пожелания по напарникам': partnerNames || 'Без предпочтений',
          'Стоп-лист (не хочет работать)': avoidedNames || 'Нет',
          'Задач выполнено': progress,
        });
      }
    }
  }

  // Add bench
  const bench = participants.filter((p) => !p.groupId);
  for (const m of bench) {
    const roleDef = ROLES[m.role];
    const avoidedNames = (m.avoidedWithIds || [])
      .map((id) => participants.find((p) => p.id === id)?.name || id)
      .join(', ');

    rosterRows.push({
      'Съёмочная группа': 'Резерв (Нераспределённые)',
      'Проект': 'На распределении',
      'Жанр': '-',
      'Этап': 'Резерв',
      'ID участника': m.id,
      'ФИО участника': m.name,
      'Роль (закреплена куратором)': roleDef?.title || m.role,
          'Желаемые роли (из ЛК)': (m.desiredRoles || []).map((r) => ROLES[r]?.shortTitle || r).join(', ') || 'Не указаны',
      'Лимит роли в группе': `макс ${roleDef?.maxPerGroup || 1}`,
      'VK ID': m.vkId,
      'Ссылка VK': m.vkUrl,
      'Пожелания по напарникам': m.preferredWithIds.map((id) => participants.find((p) => p.id === id)?.name || id).join(', ') || 'Без предпочтений',
      'Стоп-лист (не хочет работать)': avoidedNames || 'Нет',
      'Задач выполнено': '-',
    });
  }

  // 2. Sheet 2: Tasks & Deadlines
  const stageNames: Record<string, string> = {
    development: 'Девелопмент',
    pre_production: 'Пре-продакшн',
    production: 'Съёмочный период',
    post_production: 'Пост-продакшн',
  };

  const statusNames: Record<string, string> = {
    todo: 'К выполнению',
    in_progress: 'В процессе',
    review: 'На проверке',
    done: 'Выполнено',
  };

  const taskRows = tasks.map((t) => {
    const group = groups.find((g) => g.id === t.groupId);
    const assignee = participants.find((p) => p.id === t.assignedToId);
    const roleDef = ROLES[t.role];
    return {
      'ID задачи': t.id,
      'Название задачи': t.title,
      'Съёмочная группа': group?.name || 'Общая',
      'Проект': group?.projectTitle || '-',
      'Исполнитель': assignee?.name || 'Не назначен',
      'VK исполнителя': assignee?.vkUrl || '-',
      'Роль': roleDef?.shortTitle || t.role,
      'Этап кинопроизводства': stageNames[t.stage] || t.stage,
      'Статус': statusNames[t.status] || t.status,
      'Дедлайн': t.deadline,
      'Ссылка на материалы': t.deliverableUrl || 'Не прикреплено',
      'Комментарии/заметки': t.deliverableNotes || t.description,
    };
  });

  // 3. Sheet 3: Conflict & Consistency Audit
  const conflictRows = conflicts.map((c) => ({
    'ID конфликта': c.id,
    'Тип нарушения':
      c.type === 'duplicate_role'
        ? 'Дублирование роли'
        : c.type === 'missing_role'
        ? 'Отсутствует ключевая роль'
        : c.type === 'broken_preference'
        ? 'Нарушено пожелание участника'
        : 'Переполнение группы',
    'Важность': c.severity === 'error' ? 'Критическая (Ошибка)' : 'Внимание (Предупреждение)',
    'Съёмочная группа': c.groupName,
    'Участник': c.participantName || '-',
    'Связанный участник': c.relatedParticipantName || '-',
    'Описание несоответствия': c.message,
    'Подробности': c.detail,
    'Рекомендуемое действие': c.suggestedActionTitle,
  }));

  // Create workbook
  const wb = XLSX.utils.book_new();

  const wsRoster = XLSX.utils.json_to_sheet(rosterRows);
  const wsTasks = XLSX.utils.json_to_sheet(taskRows);
  const wsConflicts = XLSX.utils.json_to_sheet(
    conflictRows.length > 0
      ? conflictRows
      : [{ 'Статус': 'Конфликтов не обнаружено. Все съёмочные группы сбалансированы.' }]
  );

  // Set column widths
  wsRoster['!cols'] = [
    { wch: 26 },
    { wch: 24 },
    { wch: 22 },
    { wch: 16 },
    { wch: 12 },
    { wch: 22 },
    { wch: 24 },
    { wch: 18 },
    { wch: 20 },
    { wch: 30 },
    { wch: 30 },
    { wch: 16 },
  ];

  wsTasks['!cols'] = [
    { wch: 12 },
    { wch: 36 },
    { wch: 24 },
    { wch: 24 },
    { wch: 20 },
    { wch: 28 },
    { wch: 16 },
    { wch: 20 },
    { wch: 16 },
    { wch: 14 },
    { wch: 30 },
    { wch: 40 },
  ];

  wsConflicts['!cols'] = [
    { wch: 20 },
    { wch: 24 },
    { wch: 22 },
    { wch: 24 },
    { wch: 20 },
    { wch: 20 },
    { wch: 45 },
    { wch: 45 },
    { wch: 35 },
  ];

  XLSX.utils.book_append_sheet(wb, wsRoster, 'Съёмочные группы');
  XLSX.utils.book_append_sheet(wb, wsTasks, 'План задач');
  XLSX.utils.book_append_sheet(wb, wsConflicts, 'Аудит конфликтов');

  const fileName = `Кинолаборатория_Отчет_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
