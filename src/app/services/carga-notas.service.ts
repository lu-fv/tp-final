import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CourseGrade, ExamGrade } from '../core/models';

@Injectable({
  providedIn: 'root',
})
export class CargaNotasService {
  private http = inject(HttpClient);

  private baseUrl = 'http://localhost:3000';
  private resource = 'course_grades';

  addCourseGrade(courseGrade: CourseGrade): Observable<boolean> {
    return this.http
      .post<boolean>(`${this.baseUrl}/${this.resource}`, courseGrade)
      .pipe(map((cg) => cg));
  }
  addExamGrade(examGrade: ExamGrade): Observable<boolean> {
    return this.http
      .post<boolean>(`${this.baseUrl}/exam_grades`, examGrade)
      .pipe(map((eg) => eg));
  }
  getlastId(): Observable<number> {
    return this.http
      .get<CourseGrade[]>(`${this.baseUrl}/${this.resource}`)
      .pipe(
        map((grades) =>{
          
          return grades.length > 0
            ? Math.max(...grades.map((g) => Number(g.id)))
            : 0
          }
        )
      );
  }

  getlastExamGradeId(): Observable<number> {  
    return this.http
      .get<ExamGrade[]>(`${this.baseUrl}/exam_grades`)
      .pipe(
        map((grades) =>{
          return grades.length > 0
            ? Math.max(...grades.map((g) => Number(g.id)))
            : 0
          }
        )
      );
  }

 
  updateCourseGrade(id: string, payload: any) {
    return this.http.put(`${this.baseUrl}/course_grades/${id}`, payload);
  }
  deleteCourseGrade(id: string) {
    return this.http.delete(`${this.baseUrl}/course_grades/${id}`);
  }


  updateExamGrade(id: string, payload: any) {
    return this.http.put(`${this.baseUrl}/exam_grades/${id}`, payload);
  }
  deleteExamGrade(id: string) {
    return this.http.delete(`${this.baseUrl}/exam_grades/${id}`);
  }

  
}
