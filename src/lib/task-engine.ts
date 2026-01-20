// ============================================
// Task Engine - Motor de Geração de Tarefas
// ============================================

import { TaskTemplate, TaskInstance } from '@/types/marketplace-ops';

/**
 * Gera task instances a partir de templates para um mês específico
 */
export function generateTasksForMonth(
  templates: TaskTemplate[],
  year: number,
  month: number // 0-11 (Janeiro = 0)
): TaskInstance[] {
  const tasks: TaskInstance[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  templates
    .filter((template) => template.enabled)
    .forEach((template) => {
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay(); // 0 = Domingo

        // Verifica se este dia da semana está nos daysOfWeek do template
        if (template.daysOfWeek.includes(dayOfWeek)) {
          const dateISO = date.toISOString().split('T')[0];
          
          // ID determinístico para evitar duplicação
          const taskId = `${template.id}:${dateISO}`;

          const task: TaskInstance = {
            id: taskId,
            templateId: template.id,
            dateISO,
            ownerId: template.ownerId,
            marketplaceId: template.marketplaceId,
            title: template.title,
            timeHHMM: template.timeHHMM,
            type: template.type,
            severity: template.severity,
            DoD: template.DoD,
            descriptionMarkdown: template.descriptionMarkdown,
            stepsState: template.steps.map((step) => ({
              label: step.label,
              checked: false,
            })),
            status: 'TODO',
            evidenceLink: null,
            notes: '',
            completedAt: null,
          };

          tasks.push(task);
        }
      }
    });

  return tasks;
}

/**
 * Aplica templates para o mês atual
 */
export function applyCurrentMonth(templates: TaskTemplate[]): TaskInstance[] {
  const now = new Date();
  return generateTasksForMonth(templates, now.getFullYear(), now.getMonth());
}

/**
 * Aplica templates para o próximo mês
 */
export function applyNextMonth(templates: TaskTemplate[]): TaskInstance[] {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return generateTasksForMonth(templates, nextMonth.getFullYear(), nextMonth.getMonth());
}

/**
 * UPSERT: insere novas tasks e não duplica existentes
 */
export function upsertTasks(
  existingTasks: TaskInstance[],
  newTasks: TaskInstance[]
): TaskInstance[] {
  const taskMap = new Map<string, TaskInstance>();

  // Adiciona tasks existentes
  existingTasks.forEach((task) => {
    taskMap.set(task.id, task);
  });

  // Adiciona/sobrescreve com novas tasks (mas preserva status se já existe)
  newTasks.forEach((newTask) => {
    const existing = taskMap.get(newTask.id);
    if (existing) {
      // Preserva status e dados de execução se já existe
      taskMap.set(newTask.id, {
        ...newTask,
        status: existing.status,
        evidenceLink: existing.evidenceLink,
        notes: existing.notes,
        completedAt: existing.completedAt,
        stepsState: existing.stepsState,
      });
    } else {
      // Nova task
      taskMap.set(newTask.id, newTask);
    }
  });

  return Array.from(taskMap.values());
}
