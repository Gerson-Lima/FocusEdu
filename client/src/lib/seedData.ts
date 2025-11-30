import { createCourse, createActivity } from './firebaseServices';
import type { ActivityCategory, ActivityStatus } from '@/types/firebase';

const SAMPLE_COURSES = [
  'Lógica Matemática',
  'Álgebra Linear',
  'Cálculo I',
  'Programação I',
  'Estruturas de Dados',
];

const CATEGORIES: ActivityCategory[] = [
  'atividade',
  'prova',
  'tarefa',
  'leitura',
  'revisao',
  'projeto',
];

const STATUSES: ActivityStatus[] = ['concluida', 'pendente', 'atrasada'];

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!;
}

function getRandomDate(daysOffset: number): number {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.getTime();
}

export async function seedData(userId: string) {
  try {
    console.log('Starting seed data generation...');

    // Create courses
    const courseIds: string[] = [];
    for (const courseName of SAMPLE_COURSES) {
      const courseId = await createCourse({
        userId,
        name: courseName,
        createdAt: Date.now(),
      });
      courseIds.push(courseId);
      console.log(`Created course: ${courseName}`);
    }

    // Create sample activities
    const activityTemplates = [
      { title: 'Lista de Exercícios 1', description: 'Resolver exercícios do capítulo 1' },
      { title: 'Prova Parcial', description: 'Avaliação sobre os primeiros tópicos' },
      { title: 'Trabalho em Grupo', description: 'Projeto em equipe sobre o tema X' },
      { title: 'Leitura do Capítulo 3', description: 'Ler e fazer resumo' },
      { title: 'Revisão para Prova Final', description: 'Revisar todo o conteúdo' },
      { title: 'Projeto Final', description: 'Desenvolvimento do projeto integrador' },
      { title: 'Apresentação de Seminário', description: 'Apresentar tema escolhido' },
      { title: 'Lista de Exercícios 2', description: 'Exercícios avançados' },
      { title: 'Estudo de Caso', description: 'Análise de caso real' },
      { title: 'Prova Final', description: 'Avaliação final da disciplina' },
    ];

    let activitiesCreated = 0;

    for (const courseId of courseIds) {
      // Create 3-5 activities per course
      const numActivities = 3 + Math.floor(Math.random() * 3);

      for (let i = 0; i < numActivities; i++) {
        const template = getRandomItem(activityTemplates);
        const status = getRandomItem(STATUSES);
        const category = getRandomItem(CATEGORIES);

        // Generate dates
        const daysOffset = Math.floor(Math.random() * 60) - 30; // -30 to +30 days
        const dueDate = getRandomDate(daysOffset);

        let completedAt: number | undefined;
        if (status === 'concluida') {
          // Completed 1-5 days before due date
          completedAt = dueDate - (1 + Math.floor(Math.random() * 5)) * 24 * 60 * 60 * 1000;
        }

        const createdAt = Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000;

        const activityId = await createActivity({
          userId,
          courseId,
          title: template.title,
          description: template.description,
          category,
          status,
          dueDate,
          completedAt,
          createdAt,
        });

        // Also add to `activity` collection as a report entry
        // createActivity will store the report-friendly fields (name, topics, date) in the same document

        activitiesCreated++;
      }
    }

    console.log(`Seed data created successfully!`);
    console.log(`- ${courseIds.length} courses`);
    console.log(`- ${activitiesCreated} activities`);

    return {
      success: true,
      coursesCreated: courseIds.length,
      activitiesCreated,
    };
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
}
