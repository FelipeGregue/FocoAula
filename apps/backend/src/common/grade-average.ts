import { Grade, Subject } from './domain.types';

export function gradeAverages(subjects: Subject[], grades: Grade[]) {
  return subjects.map((subject) => {
    const subjectGrades = grades.filter((grade) => grade.subjectId === subject.id);
    const totalWeight = subjectGrades.reduce((sum, grade) => sum + grade.weight, 0);
    const average =
      totalWeight === 0
        ? 0
        : subjectGrades.reduce((sum, grade) => sum + grade.score * grade.weight, 0) /
          totalWeight;

    return {
      subjectId: subject.id,
      subjectName: subject.name,
      color: subject.color,
      average: Number(average.toFixed(2)),
      assessments: subjectGrades.length,
    };
  });
}
