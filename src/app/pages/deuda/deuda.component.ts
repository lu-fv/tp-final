import { Component, inject } from '@angular/core';
import { NgIf, NgFor, AsyncPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { BehaviorSubject, combineLatest, map, firstValueFrom, switchMap } from 'rxjs';

import { AuthService } from '../../core/auth.service';
import { StudentAcademicService, DebtPayment } from '../../services/student-academic.service';
import { Subject, Course } from '../../core/models';

type Cuota = {
  nro: number;
  vence: string;
  pagada: boolean;
  pagoId?: string | number;
  amount: number;
};

type RowDeuda = {
  subjectCode: string;
  subjectName: string;
  course: Course;
  cuotas: Cuota[];
  total: number;
  totalPendiente: number;
};

@Component({
  standalone: true,
  selector: 'app-deuda',
  imports: [NgIf, NgFor, AsyncPipe, CurrencyPipe, DatePipe],
  templateUrl: './deuda.component.html',
  styleUrls: ['./deuda.component.css'],
})
export class DeudaComponent {
  private auth = inject(AuthService);
  private aca  = inject(StudentAcademicService);

  private refresh$ = new BehaviorSubject<void>(undefined);

  // UI modal QR
  showQR = false;
  qrMonto = 0;
  qrDetalle = '';

  readonly CUOTA = 20000;

  vm$ = this.refresh$.pipe(
    // Cada vez que refrescamos, recalculamos usando el studentId
    switchMap(() => {
      const sid = Number(this.auth.user()?.studentId);

      return combineLatest({
        subjects : this.aca.materias$(),
        courses  : this.aca.cursos$(),
        enrolls  : this.aca.inscripcionesCursada$(sid),
        payments : this.aca.payments$(sid),
      });
    }),
    map(({ subjects, courses, enrolls, payments }) => {
      // Solo inscripciones activas
      const activos = enrolls.filter(e => e.estado === 'inscripto');

      const subjectById = new Map<number, Subject>();
      subjects.forEach(s => subjectById.set(Number(s.id), s));

      const paymentsKey = (p: DebtPayment) => `${p.courseId}#${p.installment}`;
      const paidSet = new Map<string, DebtPayment>();
      payments.forEach(p => paidSet.set(paymentsKey(p), p));

      const rows: RowDeuda[] = activos
        .map(enr => {
          const course = courses.find(c => String(c.id) === String(enr.courseId));
          if (!course) return null;

          const subj = subjectById.get(Number(course.subjectId));
          if (!subj) return null;

          const dueDates = this.aca.buildInstallmentDueDates(course);

          const cuotas: Cuota[] = dueDates.map((d, i) => {
            const nro = i + 1;
            const key = `${course.id}#${nro}`;
            const pago = paidSet.get(key);

            return {
              nro,
              vence: d,
              pagada: !!pago,
              pagoId: pago?.id,
              amount: this.CUOTA,
            };
          });

          const total = cuotas.reduce((acc, c) => acc + c.amount, 0);
          const totalPendiente = cuotas
            .filter(c => !c.pagada)
            .reduce((a, c) => a + c.amount, 0);

          return {
            subjectCode: subj.codigo,
            subjectName: subj.nombre,
            course,
            cuotas,
            total,
            totalPendiente,
          };
        })
        .filter(Boolean) as RowDeuda[];

      const granTotal = rows.reduce((a, r) => a + r.totalPendiente, 0);

      return { rows, granTotal };
    })
  );

  // Paga todas las cuotas pendientes de una materia
  async pagarTodo(row: RowDeuda) {
    const sid = Number(this.auth.user()?.studentId);
    const pendientes = row.cuotas.filter(c => !c.pagada);
    if (!pendientes.length) return;

    for (const c of pendientes) {
      const payload: DebtPayment = {
        studentId : sid,
        courseId  : row.course.id as any,
        installment: c.nro,
        amount    : c.amount,
        date      : new Date().toISOString(),
        concept   : `Cursada ${row.subjectCode} - cuota ${c.nro}`,
      };
      await firstValueFrom(this.aca.pay$(payload));
    }

    const monto = pendientes.reduce((a, c) => a + c.amount, 0);
    this.mostrarQR(monto, `Pago total ${row.subjectCode} - ${row.subjectName}`);

    this.refresh$.next();
  }

  // Paga solo la cuota vencida más vieja pendiente
  async pagarPorCuota(row: RowDeuda) {
  const sid = Number(this.auth.user()?.studentId);
    const hoy = new Date();

    const pendientesVencidas = row.cuotas
      .filter(c => !c.pagada && new Date(c.vence) <= hoy)
      .sort((a, b) => new Date(a.vence).getTime() - new Date(b.vence).getTime());

    // Si no hay vencidas, pagar la más próxima pendiente
    const target = row.cuotas.find(c => !c.pagada);
     if (!target) return;

    const payload: DebtPayment = {
    studentId : sid,
    courseId  : row.course.id as any,
    installment: target.nro,
    amount    : target.amount,
    date      : new Date().toISOString(),
    concept   : `Cursada ${row.subjectCode} - cuota ${target.nro}`
  };

  await firstValueFrom(this.aca.pay$(payload));

  this.mostrarQR(
    target.amount,
    `Cuota ${target.nro} - ${row.subjectCode} - ${row.subjectName}`
  );

  this.refresh$.next();
}

  private mostrarQR(monto: number, detalle: string) {
    this.qrMonto = monto;
    this.qrDetalle = detalle;
    this.showQR = true;
  }

  cerrarQR() {
    this.showQR = false;
  }
}
