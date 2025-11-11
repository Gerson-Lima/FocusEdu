import type { ButtonType } from "../constants/buttons";

export type ReportItem = {
  name: string; // matéria
  category: ButtonType;
  topics: string[]; // tópicos dentro da categoria
  date: string; // ISO date (YYYY-MM-DD)
};

export const report: ReportItem[] = [
  {
    name: "Aula de Cálculo I",
    category: "Aulas",
    topics: ["Limites", "Continuidade", "Derivadas"],
    date: "2025-10-31",
  },
  {
    name: "Aula de Programação",
    category: "Aulas",
    topics: ["TypeScript", "Tipos", "Interfaces"],
    date: "2025-10-31",
  },
  {
    name: "Entregar trabalho de Química",
    category: "Tarefas",
    topics: ["Ligações iônicas", "Ligações covalentes", "Entrega no AVA"],
    date: "2025-11-02",
  },
  {
    name: "Revisar resumo de História",
    category: "Tarefas",
    topics: ["Capítulo 3", "Capítulo 4", "Revisão"],
    date: "2025-11-05"
  },
  {
    name: "Prova de Álgebra Linear",
    category: "Avaliações",
    topics: ["Sistemas lineares", "Matrizes", "Documentação"],
    date: "2025-11-10"
  },
  {
    name: "Apresentação de Projeto - Engenharia de Software",
    category: "Avaliações",
    topics: ["Pitch 10min", "Perguntas 5min", "Equipe 2"],
    date: "2025-11-15",
  },
  {
    name: "Aula de Física Experimental",
    category: "Aulas",
    topics: ["Queda livre", "EPIs"],
    date: "2025-11-01",
  },
  {
    name: "Checklist TCC - Capítulo Metodologia",
    category: "Tarefas",
    topics: ["Normas ABNT", "Alinhamento com orientador"],
    date: "2025-11-20",
  }
];
