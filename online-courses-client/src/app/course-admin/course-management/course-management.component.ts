// src/app/course-admin/course-management/course-management.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CourseFormComponent } from '../../course-form/course-form.component';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';
import { Course, ServerMessageResponse } from '../../interfaces/course.interface';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, Subscription, of, combineLatest } from 'rxjs';
import { switchMap, catchError, tap, filter, map, take } from 'rxjs/operators';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './course-management.component.html',
  styleUrls: ['./course-management.component.css']
})
export class CourseManagementComponent implements OnInit, OnDestroy {
  teacherCourses$: Observable<Course[]>;
  error: string | null = null;
  currentTeacherId: number | null = null;
  private subscriptions: Subscription = new Subscription();

  private _isLoading: boolean = true;

  constructor(
    private dialog: MatDialog,
    private courseService: CourseService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.teacherCourses$ = of([]);
  }

  get isLoading(): boolean {
    return this._isLoading;
  }

  set isLoading(value: boolean) {
    if (this._isLoading !== value) {
      this._isLoading = value;
      this.cdr.detectChanges();
    }
  }

  ngOnInit(): void {
    this.subscriptions.add(
      combineLatest([
        this.authService.userId$,
        this.authService.currentUserRole$
      ]).pipe(
        filter(([userId, role]) => userId !== null && role === 'teacher'),
        switchMap(([userId, role]) => {
          this.currentTeacherId = userId;
          this.loadTeacherCourses().subscribe({
            error: (err) => {
              console.error('Error loading initial teacher courses:', err);
            },
          });
          return of([]);
        }),
        catchError(err => {
          console.error('Error in initial teacher course loading stream:', err);
          this.snackBar.open('שגיאה בטעינת קורסים עבור המורה. אנא התחבר שוב.', 'סגור', { duration: 5000 });
          this.isLoading = false;
          return of([]);
        })
      ).subscribe()
    );
  }

  loadTeacherCourses(): Observable<Course[]> {
    if (this.currentTeacherId === null) {
      this.error = 'שגיאה: מזהה מורה לא זמין. אנא התחבר כמורה.';
      this.isLoading = false;
      return of([]);
    }

    this.isLoading = true;
    this.error = null;

    const coursesObservable = this.courseService.getAllCourses().pipe(
      take(1),
      map((allCourses: Course[]) => {
        const filteredCourses = allCourses.filter((course: Course) => course.teacherId === this.currentTeacherId);
        return filteredCourses;
      }),
      tap(courses => {
        this.isLoading = false;
      }),
      catchError((error) => {
        console.error('שגיאה בטעינת קורסי המורה (מ-getAllCourses):', error);
        this.snackBar.open('שגיאה בטעינת קורסים. אנא נסה שוב.', 'סגור', { duration: 3000 });
        this.error = 'שגיאה בטעינת קורסים.';
        this.isLoading = false;
        return of([]);
      })
    );

    this.teacherCourses$ = coursesObservable;
    return coursesObservable;
  }

  openAddCourseDialog(): void {
    if (this.currentTeacherId === null) {
      this.snackBar.open('שגיאה: לא ניתן להוסיף קורס ללא מזהה מורה מחובר.', 'סגור', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(CourseFormComponent, {
      width: '500px',
      data: { isNew: true, teacherId: this.currentTeacherId }
    });

    this.subscriptions.add(
      dialogRef.afterClosed().pipe(
        tap(resultFromDialog => { // DEBUG: See raw result
          console.log('CourseManagementComponent: Add Dialog closed with result:', resultFromDialog);
        }),
        filter(result => { // DEBUG: Check filter logic
          console.log('CourseManagementComponent: Add Filter check - result:', result, 'is truthy:', !!result);
          return !!result;
        }),
        tap(() => console.log('CourseManagementComponent: Add After filter, proceeding to switchMap (should NOT log on cancel)')), // DEBUG: Should only log on save
        tap(() => this.isLoading = true),
        switchMap(newCourseData => {
          console.log('CourseManagementComponent: Attempting to call addCourse with data:', newCourseData); // DEBUG: Should only log on save
          return this.courseService.addCourse(newCourseData).pipe(
            tap(response => {
              const isServerMessageResponse = (res: Course | ServerMessageResponse): res is ServerMessageResponse => {
                return (res as ServerMessageResponse).message !== undefined;
              };

              if (isServerMessageResponse(response)) {
                this.snackBar.open(response.message || 'הקורס נוסף בהצלחה!', 'סגור', { duration: 3000 });
              } else {
                this.snackBar.open('הקורס נוסף בהצלחה!', 'סגור', { duration: 3000 });
              }
              this.loadTeacherCourses().subscribe();
            }),
            catchError(error => {
              console.error('שגיאה בהוספת הקורס:', error);
              this.snackBar.open('שגיאה בהוספת הקורס: ' + (error.error?.message || error.message), 'סגור', { duration: 5000 });
              this.isLoading = false;
              return of(null);
            })
          );
        })
      ).subscribe({
          error: (err) => {
            console.error('Add course dialog stream error:', err);
            this.isLoading = false;
          },
          complete: () => {
            this.isLoading = false;
          }
        })
    );
  }

  openEditCourseDialog(courseId: number): void {
    this.courseService.getCourse(courseId).pipe(
      take(1),
      switchMap(courseToEdit => {
        if (!courseToEdit) {
          this.snackBar.open('שגיאה: קורס לא נמצא לעריכה.', 'סגור', { duration: 3000 });
          return of(null);
        }

        const courseToEditCopy = { ...courseToEdit }; // יוצר עותק שטוח של הקורס

        const dialogRef = this.dialog.open(CourseFormComponent, {
          width: '500px',
          data: { isNew: false, course: courseToEditCopy, teacherId: this.currentTeacherId } // מעביר את העותק
        });

        return dialogRef.afterClosed().pipe(
          tap(resultFromDialog => { // DEBUG: See raw result
            console.log('CourseManagementComponent: Edit Dialog closed with result:', resultFromDialog);
          }),
          filter(result => { // DEBUG: Check filter logic
            console.log('CourseManagementComponent: Edit Filter check - result:', result, 'is truthy:', !!result);
            return !!result;
          }),
          tap(() => console.log('CourseManagementComponent: Edit After filter, proceeding to switchMap (should NOT log on cancel)')), // DEBUG: Should only log on save
          tap(() => this.isLoading = true),
          switchMap((updatedCourseData: Course) => {
            console.log('CourseManagementComponent: Attempting to call updateCourse with data:', updatedCourseData); // DEBUG: Should only log on save
            return this.courseService.updateCourse(courseId, updatedCourseData).pipe(
              tap(response => {
                const isServerMessageResponse = (res: Course | ServerMessageResponse): res is ServerMessageResponse => {
                  return (res as ServerMessageResponse).message !== undefined;
                };

                if (isServerMessageResponse(response)) {
                  this.snackBar.open(response.message || 'הקורס עודכן בהצלחה!', 'סגור', { duration: 3000 });
                } else {
                  this.snackBar.open('הקורס עודכן בהצלחה!', 'סגור', { duration: 3000 });
                }
                this.loadTeacherCourses().subscribe();
              }),
              catchError(error => {
                console.error('שגיאה בעדכון הקורס:', error);
                this.snackBar.open('שגיאה בעדכון הקורס: ' + (error.error?.message || error.message), 'סגור', { duration: 5000 });
                this.isLoading = false;
                return of(null);
              })
            );
          })
        );
      })
    ).subscribe({
        error: (err) => {
          console.error('Edit course dialog stream error:', err);
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  deleteCourse(courseId: number): void {
    const confirmDialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'מחיקת קורס',
        message: 'האם אתה בטוח שברצונך למחוק קורס זה? פעולה זו אינה הפיכה.',
        confirmText: 'מחק',
        cancelText: 'ביטול'
      }
    });

    this.subscriptions.add(
      confirmDialogRef.afterClosed().pipe(
        filter(confirmed => confirmed),
        tap(() => this.isLoading = true),
        switchMap(() => {
          return this.courseService.deleteCourse(courseId).pipe(
            tap(response => {
              const isServerMessageResponse = (res: void | ServerMessageResponse): res is ServerMessageResponse => {
                return (res as ServerMessageResponse).message !== undefined;
              };

              if (isServerMessageResponse(response)) {
                this.snackBar.open(response.message || 'הקורס נמחק בהצלחה!', 'סגור', { duration: 3000 });
              } else {
                this.snackBar.open('הקורס נמחק בהצלחה!', 'סגור', { duration: 3000 });
              }
              this.loadTeacherCourses().subscribe();
            }),
            catchError(error => {
              console.error('שגיאה במחיקת הקורס:', error);
              this.snackBar.open('שגיאה במחיקת הקורס: ' + (error.error?.message || error.message), 'סגור', { duration: 5000 });
              this.isLoading = false;
              return of(null);
            })
          );
        })
      ).subscribe({
          error: (err) => {
            console.error('Delete course dialog stream error:', err);
            this.isLoading = false;
          },
          complete: () => {
            this.isLoading = false;
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}