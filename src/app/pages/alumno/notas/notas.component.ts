
import { Component, inject } from '@angular/core';
import { NgIf, NgFor, AsyncPipe, DatePipe } from '@angular/common';
import { combineLatest, map } from 'rxjs';

import { StudentAcademicService } from '../../../services/student-academic.service';
import { AuthService } from '../../../core/auth.service';

import { Subject, Course, CourseGrade, ExamTable, ExamGrade} from '../../../core/models';



export type RowCursada = {
  tipo: 'Cursada';
  codigo: string;
  materia: string;
  detalle: string;          
  condicion: string;        
  p1: number | null;
  p2: number | null;
  promedio: number | null;
};

export type RowExamen = {
  tipo: 'Examen';
  codigo: string;
  materia: string;
  detalle: string;          
  condicion: string;        
  nota: number | null;
  fecha: string | null;
};

@Component({
  standalone: true,
  selector: 'app-notas',
  imports: [NgIf, NgFor, AsyncPipe, DatePipe],
  templateUrl: './notas.component.html',
  styleUrls: ['./notas.component.css']
})
export class NotasComponent {

  private aca = inject(StudentAcademicService);
  private auth = inject(AuthService);

  vm$ = combineLatest({
    subjects: this.aca.materias$(),
    courses:  this.aca.cursos$(),
    examTables: this.aca.mesasExamen$(),
    courseGrades: this.aca.notas$(Number(this.auth.user()?.studentId)),
    examGrades:   this.aca.notasExamen$(Number(this.auth.user()?.studentId))
  }).pipe(
    map(({ subjects, courses, examTables, courseGrades, examGrades }) => {

      // ---- MAPAS ÚTILES ----
      const subjectById = new Map<number, Subject>();
      subjects.forEach(s => subjectById.set(Number(s.id), s));

      const courseById = new Map<number, Course>();
      courses.forEach(c => courseById.set(Number(c.id), c));

      const examTableById = new Map<number, ExamTable>();
      examTables.forEach(et => examTableById.set(Number(et.id), et));

  
      const rowsCursada: RowCursada[] =
        courseGrades.map(g => {
          const c = courseById.get(Number(g.courseId));
          if (!c) return null;

          const subj = subjectById.get(Number(c.subjectId));
          if (!subj) return null;

          return {
            tipo: 'Cursada',
            codigo: subj.codigo,
            materia: subj.nombre,
            detalle: `Comisión ${c.comision}`,
            condicion: g.condicion ?? '--',
            p1: g.parcial1 ?? null,
            p2: g.parcial2 ?? null,
            promedio: g.promedio ?? null
          };
        }).filter(Boolean) as RowCursada[];

  
      const rowsExamen: RowExamen[] = examGrades.map(eg => {
        const et = examTableById.get(Number(eg.examTableId));
        if (!et) return null;

        const subj = subjectById.get(Number(et.subjectId));
        if (!subj) return null;

        return {
          tipo: 'Examen',
          codigo: subj.codigo,
          materia: subj.nombre,
          detalle: `${et.turno} - ${et.periodo}`,
          condicion: eg.resultado ?? '--',
          nota: eg.nota ?? null,
          fecha: et.fecha ?? null,   
        };
      }).filter(Boolean) as RowExamen[];




    
      rowsCursada.sort((a, b) => a.codigo.localeCompare(b.codigo));

      rowsExamen.sort((a, b) => {
        const code = a.codigo.localeCompare(b.codigo);
        if (code !== 0) return code;

        const fa = a.fecha ? new Date(a.fecha).getTime() : 0;
        const fb = b.fecha ? new Date(b.fecha).getTime() : 0;
        return fb - fa; 
      });

    
      return {
        rowsCursada,
        rowsExamen
      };
    })
  );
}
