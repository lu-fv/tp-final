import { Component, inject } from '@angular/core';
import {
  NgIf,
  NgFor,
  NgClass,
  AsyncPipe,
  DatePipe,
  CurrencyPipe,
} from '@angular/common';
import {
  BehaviorSubject,
  combineLatest,
  map,
  firstValueFrom,
  switchMap,
} from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { AuthService } from '../../../core/auth.service';
import {
  StudentAcademicService,
} from '../../../services/student-academic.service';
import {
  Subject,
  ExamTable,
  ExamGrade,
  Student,
} from '../../../core/models';

// @ts-ignore
import jsPDF from 'jspdf';
// @ts-ignore
import html2canvas from 'html2canvas';

type RowAcademico = {
  tipo: string;
  codigo: string;
  materia: string;
  detalle: string;
  condicion: string;
  nota: number | null;
  fecha: string | null;
};

@Component({
  standalone: true,
  selector: 'app-certificados',
  imports: [NgIf, NgFor, NgClass, AsyncPipe, DatePipe, CurrencyPipe],
  templateUrl: './certificados.component.html',
  styleUrls: ['./certificados.component.css'],
})
export class CertificadosComponent {
  private auth = inject(AuthService);
  private aca = inject(StudentAcademicService);
  private http = inject(HttpClient);

  private refresh$ = new BehaviorSubject<void>(undefined);

  /** ViewModel para la pantalla */
  vm$ = this.refresh$.pipe(
    map(() => Number(this.auth.user()?.studentId)),
    switchMap((sid) =>
      combineLatest({
        student: this.aca.student$(sid),
        subjects: this.aca.materias$(),
        examTables: this.aca.mesasExamen$(),
        examGrades: this.aca.notasExamen$(sid),
      })
    ),
    map(({ student, subjects, examTables, examGrades }) => {
      const subjectById = new Map<number, Subject>();
      subjects.forEach((s) => subjectById.set(Number(s.id), s));

      const examTableById = new Map<number, ExamTable>();
      examTables.forEach((t) => examTableById.set(Number(t.id), t));

      const rows: RowAcademico[] = examGrades
        .map((eg: ExamGrade): RowAcademico | null => {
          const t = examTableById.get(Number(eg.examTableId));
          if (!t) return null;

          const subj = subjectById.get(Number(t.subjectId));
          if (!subj) return null;

          return {
            tipo: 'Examen',
            codigo: subj.codigo,
            materia: subj.nombre,
            detalle: `${t.turno} - ${t.periodo}`,
            condicion: eg.resultado ?? '',
            nota: eg.nota ?? null,
            // fecha REAL de la mesa
            fecha: t.fecha ?? null,
          };
        })
        .filter((r): r is RowAcademico => !!r);

      return {
        student,
        rows,
      };
    })
  );

  // ============================================================
  //  CERTIFICADO ACADÉMICO – PDF
  // ============================================================

  async descargarCertificadoAcademico() {
    const vm: any = await firstValueFrom(this.vm$);
    const stud: Student = vm.student;
    const rows: RowAcademico[] = vm.rows;

    const pdf = new jsPDF('p', 'pt', 'a4');
    const logo = 'assets/utn-logo.png';

    const encabezado = `
      <div style="display:flex; align-items:flex-start; margin-bottom:24px;">
        <img src="${logo}" style="width:70px; margin-right:20px;" />
        <div>
          <div style="font-size:14px; font-weight:bold;">Universidad Tecnológica Nacional</div>
          <div style="font-size:12px;">Facultad Regional Mar del Plata</div>
          <div style="font-size:12px;">Tecnicatura Universitaria en Programación</div>
        </div>
      </div>

      <h3 style="text-align:center; margin:12px 0 24px 0;">
        CERTIFICADO ACADÉMICO
      </h3>
    `;

    const intro = `
      <p style="font-size:11px; line-height:1.6; text-align:justify;">
        Se deja constancia que <strong>${stud.apellido}, ${stud.nombre}</strong>, 
        DNI <strong>${stud.dni}</strong>, legajo <strong>${stud.legajo}</strong>, ha obtenido las
        siguientes calificaciones en exámenes finales de la carrera Tecnicatura Universitaria
        en Programación.
      </p>
      <br/>
    `;

      const estilosTabla = `
  <style>
    table { 
      width: 100%; 
      border-collapse: collapse; 
      font-size: 9px;
      table-layout: fixed;
    }

    th {
      background: #0A5275; 
      color: white;
      padding: 4px 2px;
      border: 1px solid #dddddd;
      text-align: center;
    }

    td {
      padding: 4px 2px;
      border: 1px solid #dddddd;
      text-align: center;
      word-wrap: break-word;
    }

    th:nth-child(1) { width: 8%; }   /* Tipo      */
    th:nth-child(2) { width: 10%; }  /* Código    */
    th:nth-child(3) { width: 27%; }  /* Materia   */
    th:nth-child(4) { width: 23%; }  /* Detalle   */
    th:nth-child(5) { width: 12%; }  /* Condición */
    th:nth-child(6) { width: 8%; }   /* Nota      */
    th:nth-child(7) { width: 12%; }  /* Fecha     */

    /* 👉 Evita que la fecha se parta en dos líneas */
    td:nth-child(7) { white-space: nowrap; }
  </style>
`;



    let filas = '';
    rows.forEach((r) => {
      filas += `
        <tr>
          <td>${r.tipo}</td>
          <td>${r.codigo}</td>
          <td>${r.materia}</td>
          <td>${r.detalle}</td>
          <td>${r.condicion}</td>
          <td>${r.nota ?? ''}</td>
          <td>${r.fecha ?? ''}</td>
        </tr>
      `;
    });

    const tabla = `
      ${estilosTabla}
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Código</th>
            <th>Materia</th>
            <th>Detalle</th>
            <th>Condición</th>
            <th>Nota</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${filas}
        </tbody>
      </table>
      <br/>
    `;

    const pie = `
      <p style="font-size:11px; margin-top:18px;">
        Se expide el presente certificado a pedido del interesado en Mar del Plata,
        a los ${new Date().toLocaleDateString('es-AR')}.
      </p>

      <br/><br/><br/>

      <p style="text-align:center; font-size:11px;">
        _________________________________<br/>
        Firma y sello
      </p>
    `;

    // 👉 Contenedor central para que no quede “pegado” a la izquierda
      const contenido = `
    <div style="width:520px; margin:0 auto; font-family:Arial, sans-serif;">
      ${encabezado}
      ${intro}
      ${tabla}
      ${pie}
    </div>
  `;



    await pdf.html(contenido, {
      callback: (doc: any) => doc.save('certificado_academico.pdf'),
      margin: [40, 40, 40, 40],
      html2canvas: { scale: 0.95 },
    });
  }

  // ============================================================
  //  CERTIFICADO DE ALUMNO REGULAR – PDF
  // ============================================================

  async descargarCertificadoRegular() {
    const vm: any = await firstValueFrom(this.vm$);
    const stud: Student = vm.student;

    // Validamos condición REAL del alumno desde students del json
    if ((stud.condicion ?? '').toLowerCase() !== 'regular') {
      alert('El alumno no se encuentra en condición de REGULAR.');
      return;
    }

    const pdf = new jsPDF('p', 'pt', 'a4');
    const logo = 'assets/utn-logo.png';

    const encabezado = `
      <div style="display:flex; align-items:flex-start; margin-bottom:24px;">
        <img src="${logo}" style="width:70px; margin-right:20px;" />
        <div>
          <div style="font-size:14px; font-weight:bold;">Universidad Tecnológica Nacional</div>
          <div style="font-size:12px;">Facultad Regional Mar del Plata</div>
          <div style="font-size:12px;">Tecnicatura Universitaria en Programación</div>
        </div>
      </div>

      <h3 style="text-align:center; margin:12px 0 24px 0;">
        CERTIFICADO DE ALUMNO REGULAR
      </h3>
    `;

    const cuerpo = `
      <p style="font-size:11px; line-height:1.6; text-align:justify;">
        Se deja constancia que <strong>${stud.apellido}, ${stud.nombre}</strong>,
        DNI <strong>${stud.dni}</strong>, legajo <strong>${stud.legajo}</strong>, 
        se encuentra en condición de <strong>ALUMNO REGULAR</strong> de la carrera
        Tecnicatura Universitaria en Programación.
      </p>

      <br/>

      <p style="font-size:11px; margin-top:8px;">
        Se expide el presente certificado a pedido del interesado en Mar del Plata,
        a los ${new Date().toLocaleDateString('es-AR')}.
      </p>

      <br/><br/><br/>

      <p style="text-align:center; font-size:11px;">
        _________________________________<br/>
        Firma y sello
      </p>
    `;

    const contenido = `
      <div style="width:480px; margin:0 auto; font-family:Arial, sans-serif;">
        ${encabezado}
        ${cuerpo}
      </div>
    `;

    await pdf.html(contenido, {
      callback: (doc: any) => doc.save('alumno_regular.pdf'),
      margin: [40, 40, 40, 40],
      html2canvas: { scale: 0.95 },
    });
  }
}
