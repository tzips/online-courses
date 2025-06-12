// src/app/course-admin/course-management/course-management.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CourseFormComponent } from '../../course-form/course-form.component'; // **שינוי: ייבוא CourseFormComponent המאוחד**
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service'; // ייבוא AuthService
import { Course, ServerMessageResponse } from '../../interfaces/course.interface';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // לייבוא ספינר
import { Observable, Subscription, of, combineLatest } from 'rxjs'; // ייבוא Observable, Subscription, of, combineLatest
import { switchMap, catchError, tap, filter, map, take } from 'rxjs/operators'; // ייבוא אופרטורים
import { ConfirmationDialogComponent } from '../../components/confirmation-dialog/confirmation-dialog.component'; // ייבוא דיאלוג האישור

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './course-management.component.html',
  styleUrls: ['./course-management.component.css']
})
export class CourseManagementComponent implements OnInit, OnDestroy { // הוספת OnDestroy
  teacherCourses$: Observable<Course[]>; // שינוי ל-Observable
  isLoading: boolean = true;
  error: string | null = null;
  currentTeacherId: number | null = null; // ID של המורה המחובר
  private subscriptions: Subscription = new Subscription(); // לניהול מנויים

  constructor(
    private dialog: MatDialog,
    private courseService: CourseService,
    private snackBar: MatSnackBar,
    private authService: AuthService // הזרקת AuthService
  ) {
    this.teacherCourses$ = of([]); // אתחול
  }

  ngOnInit(): void {
    this.subscriptions.add(
      combineLatest([
        this.authService.userId$,
        this.authService.currentUserRole$
      ]).pipe(
        filter(([userId, role]) => userId !== null && role === 'teacher'), // רק אם מורה מחובר
        tap(([userId, role]) => {
          this.currentTeacherId = userId; // שמור את ID המורה
          this.loadTeacherCourses(); // טען את הקורסים של המורה
        })
      ).subscribe()
    );
  }

  loadTeacherCourses(): void {
    if (!this.currentTeacherId) {
      this.error = 'שגיאה: מזהה מורה לא זמין. אנא התחבר כמורה.';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.teacherCourses$ = this.courseService.getAllCourses().pipe(
      map(allCourses => allCourses.filter(course => course.teacherId === this.currentTeacherId)), // סינון לפי ID המורה
      tap(courses => {
        console.log('קורסי המורה נטענו בהצלחה:', courses);
        this.isLoading = false;
      }),
      catchError((error) => {
        console.error('שגיאה בטעינת קורסי המורה:', error);
        this.snackBar.open('שגיאה בטעינת קורסים. אנא נסה שוב.', 'סגור', { duration: 3000 });
        this.error = 'שגיאה בטעינת קורסים.';
        this.isLoading = false;
        return of([]);
      })
    );
  }

  openAddCourseDialog(): void {
    if (!this.currentTeacherId) {
      this.snackBar.open('שגיאה: לא ניתן להוסיף קורס ללא מזהה מורה.', 'סגור', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(CourseFormComponent, { // פתיחת CourseFormComponent
      width: '500px',
      data: { isNew: true, teacherId: this.currentTeacherId } // העבר את teacherId
    });

    this.subscriptions.add(
      dialogRef.afterClosed().subscribe(result => {
        if (result) { // אם הטופס נסגר עם נתונים (לא בוטל)
          // ה-result הוא אובייקט הקורס החדש מהטופס
          this.courseService.createCourse(result).subscribe({
            next: (response: ServerMessageResponse) => {
              this.snackBar.open(response.message || 'הקורס נוסף בהצלחה!', 'סגור', { duration: 3000 });
              this.loadTeacherCourses(); // רענן את רשימת הקורסים
            },
            error: (error) => {
              console.error('שגיאה בהוספת הקורס:', error);
              this.snackBar.open('שגיאה בהוספת הקורס: ' + (error.error?.message || error.message), 'סגור', { duration: 3000 });
            }
          });
        } else if (result === false) { // אם הדיאלוג נסגר עם false (בוטל)
          this.snackBar.open('הוספת הקורס בוטלה.', 'סגור', { duration: 3000 });
        }
      })
    );
  }

  openEditCourseDialog(courseId: number): void {
    // שלוף את פרטי הקורס המלאים לפני פתיחת הדיאלוג
    this.courseService.getCourse(courseId).pipe(
      take(1), // וודא שלוקחים רק את הערך הראשון
      switchMap(courseToEdit => {
        if (!courseToEdit) {
          this.snackBar.open('שגיאה: קורס לא נמצא לעריכה.', 'סגור', { duration: 3000 });
          return of(null); // מחזיר Observable ריק
        }

        const dialogRef = this.dialog.open(CourseFormComponent, { // פתיחת CourseFormComponent
          width: '500px',
          data: { isNew: false, course: courseToEdit } // העבר את אובייקט הקורס המלא
        });

        return dialogRef.afterClosed().pipe(
          filter(result => !!result), // רק אם הטופס נסגר עם נתונים (לא בוטל)
          switchMap((result: Course) => {
            // ה-result הוא אובייקט הקורס המעודכן מהטופס
            return this.courseService.updateCourse(courseId, result).pipe(
              tap((response: ServerMessageResponse) => {
                this.snackBar.open(response.message || 'הקורס עודכן בהצלחה!', 'סגור', { duration: 3000 });
                this.loadTeacherCourses(); // רענן את רשימת הקורסים
              }),
              catchError((error) => {
                console.error('שגיאה בעדכון הקורס:', error);
                this.snackBar.open('שגיאה בעדכון הקורס: ' + (error.error?.message || error.message), 'סגור', { duration: 3000 });
                return of(null); // מחזיר Observable ריק
              })
            );
          })
        );
      })
    ).subscribe();
  }

  deleteCourse(courseId: number): void {
    // החלף את confirm() בדיאלוג MatDialog מותאם אישית
    const confirmDialogRef = this.dialog.open(ConfirmationDialogComponent, { // נניח שיש לך ConfirmationDialogComponent
      data: {
        title: 'מחיקת קורס',
        message: 'האם אתה בטוח שברצונך למחוק קורס זה? פעולה זו אינה הפיכה.',
        confirmText: 'מחק',
        cancelText: 'ביטול'
      }
    });

    this.subscriptions.add(
      confirmDialogRef.afterClosed().subscribe(confirmed => {
        if (confirmed) {
          this.courseService.deleteCourse(courseId).subscribe({
            next: (response: ServerMessageResponse) => {
              this.snackBar.open(response.message || 'הקורס נמחק בהצלחה!', 'סגור', { duration: 3000 });
              this.loadTeacherCourses(); // רענן את רשימת הקורסים
            },
            error: (error) => {
              console.error('שגיאה במחיקת הקורס:', error);
              this.snackBar.open('שגיאה במחיקת הקורס: ' + (error.error?.message || error.message), 'סגור', { duration: 3000 });
            }
          });
        } else {
          this.snackBar.open('מחיקת הקורס בוטלה.', 'סגור', { duration: 3000 });
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe(); // נקה את כל המנויים
  }
}
