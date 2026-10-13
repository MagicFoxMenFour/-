import { ROLES } from '../data/roles';
import { FilmGroup, Participant, Task } from '../types';

export interface WorkspaceExportResult {
  success: boolean;
  type: 'sheets' | 'docs' | 'tasks';
  title: string;
  url?: string;
  count?: number;
  error?: string;
}

export async function createGoogleSheetRoster(
  groups: FilmGroup[],
  participants: Participant[],
  tasks: Task[],
  token: string
): Promise<WorkspaceExportResult> {
  try {
    // 1. Create a new Google Spreadsheet
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: `Кинолаборатория — Составы групп (${new Date().toLocaleDateString('ru-RU')})`,
        },
        sheets: [
          {
            properties: {
              title: 'Съёмочные группы',
            },
          },
          {
            properties: {
              title: 'Задачи кинопроизводства',
            },
          },
        ],
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(err?.error?.message || 'Ошибка создания Google Таблицы');
    }

    const createdSheet = await createRes.json();
    const spreadsheetId = createdSheet.spreadsheetId;

    // 2. Prepare Group Roster rows
    const rosterValues: string[][] = [
      ['Группа', 'Проект', 'Жанр', 'ID участника', 'ФИО', 'Роль', 'VK ID', 'Ссылка VK', 'Пожелания по напарникам', 'Стоп-лист (не хочет работать)', 'Навыки'],
    ];

    for (const group of groups) {
      const members = participants.filter((p) => p.groupId === group.id);
      if (members.length === 0) {
        rosterValues.push([group.name, group.projectTitle, group.genre, '-', 'Нет участников', '-', '-', '-', '-', '-', '-']);
      } else {
        for (const m of members) {
          const roleDef = ROLES[m.role];
          const prefs = m.preferredWithIds
            .map((id) => participants.find((p) => p.id === id)?.name || id)
            .join(', ');
          const avoided = (m.avoidedWithIds || [])
            .map((id) => participants.find((p) => p.id === id)?.name || id)
            .join(', ');
          rosterValues.push([
            group.name,
            group.projectTitle,
            group.genre,
            m.id,
            m.name,
            roleDef?.title || m.role,
            m.vkId,
            m.vkUrl,
            prefs || 'Без предпочтений',
            avoided || 'Нет',
            (m.skills || []).join(', '),
          ]);
        }
      }
    }

    // Add unassigned bench
    const bench = participants.filter((p) => !p.groupId);
    if (bench.length > 0) {
      for (const m of bench) {
        const roleDef = ROLES[m.role];
        const prefs = m.preferredWithIds
          .map((id) => participants.find((p) => p.id === id)?.name || id)
          .join(', ');
        const avoided = (m.avoidedWithIds || [])
          .map((id) => participants.find((p) => p.id === id)?.name || id)
          .join(', ');
        rosterValues.push([
          'Резерв (Нераспределённые)',
          '-',
          '-',
          m.id,
          m.name,
          roleDef?.title || m.role,
          m.vkId,
          m.vkUrl,
          prefs || 'Без предпочтений',
          avoided || 'Нет',
          (m.skills || []).join(', '),
        ]);
      }
    }

    // 3. Prepare Tasks rows
    const taskValues: string[][] = [
      ['ID задачи', 'Название задачи', 'Съёмочная группа', 'Исполнитель', 'Роль', 'Этап', 'Статус', 'Дедлайн', 'Ссылка на материал'],
    ];

    const stageTitles: Record<string, string> = {
      development: 'Девелопмент',
      pre_production: 'Пре-продакшн',
      production: 'Съёмочный период',
      post_production: 'Пост-продакшн',
    };

    const statusTitles: Record<string, string> = {
      todo: 'К выполнению',
      in_progress: 'В процессе',
      review: 'На проверке',
      done: 'Выполнено',
    };

    for (const t of tasks) {
      const group = groups.find((g) => g.id === t.groupId);
      const assignee = participants.find((p) => p.id === t.assignedToId);
      const roleDef = ROLES[t.role];
      taskValues.push([
        t.id,
        t.title,
        group?.name || 'Общая',
        assignee?.name || t.assignedToId,
        roleDef?.shortTitle || t.role,
        stageTitles[t.stage] || t.stage,
        statusTitles[t.status] || t.status,
        t.deadline,
        t.deliverableUrl || '-',
      ]);
    }

    // Append Roster
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Съёмочные группы'!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: rosterValues }),
      }
    );

    // Append Tasks
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Задачи кинопроизводства'!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: taskValues }),
      }
    );

    return {
      success: true,
      type: 'sheets',
      title: 'Google Таблица создана',
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      count: rosterValues.length - 1,
    };
  } catch (error: any) {
    console.error('Error creating Google Sheet:', error);
    return {
      success: false,
      type: 'sheets',
      title: 'Ошибка экспорта в Google Sheets',
      error: error.message || 'Не удалось создать таблицу в Google Sheets',
    };
  }
}

export async function createGoogleDocPassport(
  groups: FilmGroup[],
  participants: Participant[],
  tasks: Task[],
  token: string
): Promise<WorkspaceExportResult> {
  try {
    // 1. Create a document
    const createRes = await fetch('https://docs.google.com/v1/documents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `Кинолаборатория — Производственный паспорт (${new Date().toLocaleDateString('ru-RU')})`,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(err?.error?.message || 'Ошибка создания Google Документа');
    }

    const createdDoc = await createRes.json();
    const documentId = createdDoc.documentId;

    // 2. Build text to insert
    let bodyText = `КИНОЛАБОРАТОРИЯ: ПРОИЗВОДСТВЕННЫЙ ПАСПОРТ ПРОЕКТОВ\nДата формирования: ${new Date().toLocaleString('ru-RU')}\n\n`;

    for (const group of groups) {
      bodyText += `════════════════════════════════════════════════════════════\n`;
      bodyText += `${group.name.toUpperCase()}\n`;
      bodyText += `Фильм: «${group.projectTitle}»\n`;
      bodyText += `Жанр: ${group.genre}\n`;
      bodyText += `Логлайн: ${group.logline}\n`;
      bodyText += `Текущий этап: ${group.stage}\n\n`;
      bodyText += `СОСТАВ СЪЁМОЧНОЙ ГРУППЫ:\n`;

      const members = participants.filter((p) => p.groupId === group.id);
      if (members.length === 0) {
        bodyText += `  • Участники не назначены\n`;
      } else {
        for (const m of members) {
          const roleDef = ROLES[m.role];
          bodyText += `  • [${m.id}] ${m.name} — ${roleDef?.title || m.role}\n`;
          bodyText += `    VK: ${m.vkUrl} (ID: ${m.vkId})\n`;
          if (m.skills?.length) {
            bodyText += `    Навыки: ${(m.skills || []).join(', ')}\n`;
          }
        }
      }

      bodyText += `\nКЛЮЧЕВЫЕ ЗАДАЧИ:\n`;
      const groupTasks = tasks.filter((t) => t.groupId === group.id);
      if (groupTasks.length === 0) {
        bodyText += `  • Задач пока нет\n`;
      } else {
        for (const t of groupTasks) {
          const assignee = participants.find((p) => p.id === t.assignedToId);
          bodyText += `  [${t.status.toUpperCase()}] ${t.title} — Ответственный: ${assignee?.name || 'Не назначен'} (Дедлайн: ${t.deadline})\n`;
        }
      }
      bodyText += `\n\n`;
    }

    // 3. Insert text via batchUpdate
    await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: bodyText,
            },
          },
        ],
      }),
    });

    return {
      success: true,
      type: 'docs',
      title: 'Google Документ сформирован',
      url: `https://docs.google.com/document/d/${documentId}`,
    };
  } catch (error: any) {
    console.error('Error creating Google Doc:', error);
    return {
      success: false,
      type: 'docs',
      title: 'Ошибка экспорта в Google Docs',
      error: error.message || 'Не удалось сформировать Google Документ',
    };
  }
}

export async function syncToGoogleTasks(
  tasks: Task[],
  participants: Participant[],
  groups: FilmGroup[],
  token: string
): Promise<WorkspaceExportResult> {
  try {
    // 1. Create a dedicated tasklist
    const listRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `Кинолаборатория: Съёмочный план (${new Date().toLocaleDateString('ru-RU')})`,
      }),
    });

    if (!listRes.ok) {
      const err = await listRes.json();
      throw new Error(err?.error?.message || 'Ошибка создания списка Google Задач');
    }

    const taskList = await listRes.json();
    const listId = taskList.id;

    // 2. Insert tasks into the list
    let count = 0;
    for (const task of tasks) {
      const group = groups.find((g) => g.id === task.groupId);
      const assignee = participants.find((p) => p.id === task.assignedToId);
      const roleDef = ROLES[task.role];

      const notes = [
        `Группа: ${group?.name || 'Общая'} («${group?.projectTitle || ''}»)`,
        `Ответственный: ${assignee?.name || 'Не назначен'} (Роль: ${roleDef?.title || task.role})`,
        `VK: ${assignee?.vkUrl || '-'}`,
        task.description,
      ].join('\n');

      const taskPayload: any = {
        title: `[${group?.name?.split(':')[0] || 'Кино'}] ${task.title}`,
        notes,
        status: task.status === 'done' ? 'completed' : 'needsAction',
      };

      if (task.deadline) {
        taskPayload.due = new Date(task.deadline).toISOString();
      }

      const postRes = await fetch(`https://tasks.googleapis.com/tasks/v1/users/@me/lists/${listId}/tasks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskPayload),
      });

      if (postRes.ok) count++;
    }

    return {
      success: true,
      type: 'tasks',
      title: 'Google Задачи синхронизированы',
      url: 'https://tasks.google.com',
      count,
    };
  } catch (error: any) {
    console.error('Error syncing Google Tasks:', error);
    return {
      success: false,
      type: 'tasks',
      title: 'Ошибка синхронизации Google Задач',
      error: error.message || 'Не удалось отправить задачи в Google Tasks',
    };
  }
}
