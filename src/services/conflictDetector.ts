import { ROLES } from '../data/roles';
import { ConflictItem, FilmGroup, Participant, RoleType } from '../types';

export function detectConflicts(
  participants: Participant[],
  groups: FilmGroup[]
): ConflictItem[] {
  const conflicts: ConflictItem[] = [];
  const participantMap = new Map<string, Participant>(
    participants.map((p) => [p.id, p])
  );
  const groupMap = new Map<string, FilmGroup>(groups.map((g) => [g.id, g]));

  // Check each group for role constraints and capacity
  for (const group of groups) {
    const groupMembers = participants.filter((p) => p.groupId === group.id);

    // 1. Role counts
    const roleCounts: Partial<Record<RoleType, Participant[]>> = {};
    for (const member of groupMembers) {
      if (!roleCounts[member.role]) {
        roleCounts[member.role] = [];
      }
      roleCounts[member.role]!.push(member);
    }

    // Duplicate roles check (e.g. 2 directors)
    for (const [roleKey, members] of Object.entries(roleCounts)) {
      const role = roleKey as RoleType;
      if (role === 'actor') continue; // Actors have free schedule across projects and no role duplication limits
      const roleDef = ROLES[role];
      if (members && members.length > roleDef.maxPerGroup) {
        for (let i = roleDef.maxPerGroup; i < members.length; i++) {
          const conflictingMember = members[i];
          conflicts.push({
            id: `conf-dup-${group.id}-${conflictingMember.id}`,
            type: 'duplicate_role',
            severity: 'error',
            groupId: group.id,
            groupName: group.name,
            participantId: conflictingMember.id,
            participantName: conflictingMember.name,
            role,
            message: `Превышен лимит роли: в «${group.name}» сразу ${members.length} на роли ${roleDef.shortTitle} (допустимо: ${roleDef.maxPerGroup})`,
            detail: `Участники: ${members.map((m) => m.name).join(', ')}. В одной съёмочной группе не может быть нескольких ${roleDef.shortTitle.toLowerCase()}ов.`,
            suggestedActionTitle: `Сменить роль или переместить ${conflictingMember.name}`,
            actionType: 'reassign_role',
          });
        }
      }
    }

    // 2. Missing essential roles check (Director, DOP, Screenwriter, Editor, Producer, Sound Designer)
    // Роль гримёра (makeup_artist) является опциональной для студенческих съёмок, система не ругается на её отсутствие
    for (const [roleKey, roleDef] of Object.entries(ROLES)) {
      const role = roleKey as RoleType;
      if (role === 'makeup_artist') continue;
      if (roleDef.essential && (!roleCounts[role] || roleCounts[role]!.length === 0)) {
        conflicts.push({
          id: `conf-missing-${group.id}-${role}`,
          type: 'missing_role',
          severity: 'warning',
          groupId: group.id,
          groupName: group.name,
          role,
          message: `В «${group.name}» отсутствует ключевая роль: ${roleDef.title}`,
          detail: `Для полноценного съёмочного процесса группе необходим ${roleDef.shortTitle.toLowerCase()}. Поищите свободного кандидата в резерве.`,
          suggestedActionTitle: `Назначить ${roleDef.shortTitle.toLowerCase()}а в команду`,
          actionType: 'fill_role',
        });
      }
    }

    // 3. Overcapacity check (standard crew is 10 people)
    if (groupMembers.length > 11) {
      conflicts.push({
        id: `conf-overcap-${group.id}`,
        type: 'overcapacity',
        severity: 'warning',
        groupId: group.id,
        groupName: group.name,
        message: `Переполнение группы «${group.name}»: ${groupMembers.length} человек (рекомендуемый максимум — 10-11)`,
        detail: `Слишком большая группа затрудняет коммуникацию и распределение съёмочных задач на площадке.`,
        suggestedActionTitle: `Переместить участника в резерв или другую группу`,
        actionType: 'move_group',
      });
    }
  }

  // 4. Broken preferences check
  for (const member of participants) {
    if (!member.groupId || member.preferredWithIds.length === 0) continue;

    const myGroup = groupMap.get(member.groupId);
    if (!myGroup) continue;

    for (const partnerId of member.preferredWithIds) {
      const partner = participantMap.get(partnerId);
      if (!partner) continue;

      // Check if partner is not in the same group
      if (partner.groupId !== member.groupId) {
        const partnerGroupName = partner.groupId
          ? groupMap.get(partner.groupId)?.name || 'другой группе'
          : 'скамейке запасных (резерве)';

        conflicts.push({
          id: `conf-pref-${member.id}-${partner.id}`,
          type: 'broken_preference',
          severity: 'warning',
          groupId: member.groupId,
          groupName: myGroup.name,
          participantId: member.id,
          participantName: member.name,
          relatedParticipantId: partner.id,
          relatedParticipantName: partner.name,
          message: `Несоответствие пожеланий: ${member.name} хотел(а) работать с ${partner.name}`,
          detail: `${member.name} распределён(а) в «${myGroup.name}», а желаемый напарник ${partner.name} находится в «${partnerGroupName}».`,
          suggestedActionTitle: `Объединить ${member.name} и ${partner.name}`,
          actionType: 'move_group',
        });
      }
    }
  }

  // 5. Avoided partners check (CRITICAL CONFLICT: people who definitely do not want to work together are in the same group)
  const handledAvoidedPairs = new Set<string>();

  for (const member of participants) {
    if (!member.groupId || !member.avoidedWithIds || member.avoidedWithIds.length === 0) continue;

    const myGroup = groupMap.get(member.groupId);
    if (!myGroup) continue;

    for (const avoidedId of member.avoidedWithIds) {
      const avoidedPerson = participantMap.get(avoidedId);
      if (!avoidedPerson || !avoidedPerson.groupId) continue;

      // If they are in the same group, it's an avoided_partner_conflict!
      if (avoidedPerson.groupId === member.groupId) {
        const pairKey = [member.id, avoidedPerson.id].sort().join(':::');
        if (handledAvoidedPairs.has(pairKey)) continue;
        handledAvoidedPairs.add(pairKey);

        const isMutual = (avoidedPerson.avoidedWithIds || []).includes(member.id);

        conflicts.push({
          id: `conf-avoid-${pairKey}`,
          type: 'avoided_partner_conflict',
          severity: 'error',
          groupId: member.groupId,
          groupName: myGroup.name,
          participantId: member.id,
          participantName: member.name,
          relatedParticipantId: avoidedPerson.id,
          relatedParticipantName: avoidedPerson.name,
          message: isMutual
            ? `Критический конфликт стоп-листа: ${member.name} и ${avoidedPerson.name} взаимно не хотят работать вместе!`
            : `Нежелательное соседство: ${member.name} категорически не хочет работать с ${avoidedPerson.name}!`,
          detail: isMutual
            ? `Оба участника внесли друг друга в список исключений («Точно не хочу работать»), но распределены в одну группу «${myGroup.name}».`
            : `${member.name} указал(а) ${avoidedPerson.name} в стоп-листе исключений, но они сейчас в одной группе «${myGroup.name}».`,
          suggestedActionTitle: `Развести участников по разным группам`,
          actionType: 'separate_members',
        });
      }
    }
  }

  return conflicts;
}
