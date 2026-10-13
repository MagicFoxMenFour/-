import { ROLES } from '../data/roles';
import { FilmGroup, Participant, RoleType } from '../types';

export function runAutoBalance(
  participants: Participant[],
  groups: FilmGroup[]
): { updatedParticipants: Participant[]; changesSummary: string[] } {
  const updated: Participant[] = JSON.parse(JSON.stringify(participants));
  const changesSummary: string[] = [];

  // Helper to check if participant p has anti-preference clash with any member in target group
  const hasAvoidConflictWithGroup = (p: Participant, targetGroupId: string): boolean => {
    const groupMembers = updated.filter((m) => m.groupId === targetGroupId && m.id !== p.id);
    for (const member of groupMembers) {
      if ((p.avoidedWithIds || []).includes(member.id)) return true;
      if ((member.avoidedWithIds || []).includes(p.id)) return true;
    }
    return false;
  };

  // 1. Resolve critical avoided-partner conflicts: people who do not want to work together
  for (const group of groups) {
    const groupMembers = updated.filter((p) => p.groupId === group.id);
    for (let i = 0; i < groupMembers.length; i++) {
      const p1 = groupMembers[i];
      for (let j = i + 1; j < groupMembers.length; j++) {
        const p2 = groupMembers[j];
        const p1AvoidsP2 = (p1.avoidedWithIds || []).includes(p2.id);
        const p2AvoidsP1 = (p2.avoidedWithIds || []).includes(p1.id);

        if (p1AvoidsP2 || p2AvoidsP1) {
          // We need to move one of them out of this group!
          // Try to move p2 first to another group that doesn't have an avoid conflict
          const altGroup = groups.find((g) => {
            if (g.id === group.id) return false;
            const targetMembers = updated.filter((m) => m.groupId === g.id);
            const roleDef = ROLES[p2.role];
            const currentRoleCount = targetMembers.filter((m) => m.role === p2.role).length;
            if (currentRoleCount >= (roleDef?.maxPerGroup || 1) || targetMembers.length >= 11) return false;
            return !hasAvoidConflictWithGroup(p2, g.id);
          });

          if (altGroup) {
            p2.groupId = altGroup.id;
            changesSummary.push(
              `Устранён конфликт стоп-листа: ${p2.name} переведён(а) из «${group.name}» в «${altGroup.name}» (несовместимость с ${p1.name})`
            );
          } else {
            p2.groupId = null;
            changesSummary.push(
              `Устранён конфликт стоп-листа: ${p2.name} переведён(а) из «${group.name}» в резерв (несовместимость с ${p1.name})`
            );
          }
        }
      }
    }
  }

  // 2. Resolve missing DOP in groups if any free DOP exists in reserve
  for (const group of groups) {
    const groupMembers = updated.filter((p) => p.groupId === group.id);
    const hasDop = groupMembers.some((p) => p.role === 'dop');

    if (!hasDop) {
      // Find candidate DOP in bench without avoided conflict
      const freeDop = updated.find(
        (p) => !p.groupId && p.role === 'dop' && !hasAvoidConflictWithGroup(p, group.id)
      );
      if (freeDop) {
        freeDop.groupId = group.id;
        changesSummary.push(
          `Назначен оператор-постановщик ${freeDop.name} в «${group.name}» из резерва`
        );
      }
    }
  }

  // 3. Resolve duplicate roles (e.g. 2 directors in one group)
  for (const group of groups) {
    const groupMembers = updated.filter((p) => p.groupId === group.id);
    const directors = groupMembers.filter((p) => p.role === 'director');

    if (directors.length > 1) {
      // Leave first director, reassign or move the second
      const secondDirector = directors[1];

      // Check if second director has editing/producing skills
      if (
        (secondDirector.skills || []).some((s) => s.toLowerCase().includes('монтаж')) &&
        !groupMembers.some((p) => p.role === 'editor')
      ) {
        secondDirector.role = 'editor';
        changesSummary.push(
          `В «${group.name}» второй режиссёр ${secondDirector.name} переназначен(а) на роль Режиссёра монтажа`
        );
      } else {
        // Find a group without director and without avoid conflict, or move to bench
        const groupWithoutDir = groups.find((g) => {
          const m = updated.filter((p) => p.groupId === g.id);
          return (
            !m.some((p) => p.role === 'director') &&
            !hasAvoidConflictWithGroup(secondDirector, g.id)
          );
        });

        if (groupWithoutDir) {
          secondDirector.groupId = groupWithoutDir.id;
          changesSummary.push(
            `Режиссёр ${secondDirector.name} переведён(а) из «${group.name}» в «${groupWithoutDir.name}»`
          );
        } else {
          secondDirector.groupId = null;
          changesSummary.push(
            `Второй режиссёр ${secondDirector.name} временно переведён(а) в резерв лаборатории для индивидуального проекта`
          );
        }
      }
    }
  }

  // 4. Try to satisfy partner preferences where possible without violating role or avoided constraints
  for (const p of updated) {
    if (!p.groupId && p.preferredWithIds.length > 0) {
      const preferredPartner = updated.find(
        (partner) => p.preferredWithIds.includes(partner.id) && partner.groupId !== null
      );

      if (preferredPartner && preferredPartner.groupId) {
        const targetGroupMembers = updated.filter((m) => m.groupId === preferredPartner.groupId);
        const roleDef = ROLES[p.role];
        const currentRoleCount = targetGroupMembers.filter((m) => m.role === p.role).length;

        if (
          currentRoleCount < (roleDef?.maxPerGroup || 1) &&
          targetGroupMembers.length < 11 &&
          !hasAvoidConflictWithGroup(p, preferredPartner.groupId)
        ) {
          p.groupId = preferredPartner.groupId;
          changesSummary.push(
            `Участник ${p.name} объединён с желаемым напарником ${preferredPartner.name}`
          );
        }
      }
    }
  }

  return { updatedParticipants: updated, changesSummary };
}
