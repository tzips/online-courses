// src/app/course-details/course-details.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'; // ודא ש-Router מיובא
import { CommonModule } from '@angular/common';
import { Course } from '../interfaces/course.interface';
import { Lesson } from '../interfaces/lesson.interface';
import { CourseService } from '../services/course.service';
import { LessonService } from '../services/lesson.service';
import { AuthService } from '../services/auth.service';
import { Observable, forkJoin, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddEditLessonDialogComponent } from '../add-edit-lesson/add-edit-lesson.component';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-course-details',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatListModule
  ],
  templateUrl: './course-details.component.html',
  styleUrl: './course-details.component.css'
})
export class CourseDetailsComponent implements OnInit {
  courseId: number | null = null;
  course: Course | undefined;
  lessons: Lesson[] = [];
  currentUserRole$: Observable<string | null>;
  isTeacher$: Observable<boolean>;

  constructor(
    private route: ActivatedRoute,
    private router: Router, // ודא ש-Router מוזרק כאן
    private courseService: CourseService,
    private lessonService: LessonService,
    private authService: AuthService,
    public dialog: MatDialog
  ) {
    this.currentUserRole$ = this.authService.currentUserRole$;
    this.isTeacher$ = this.currentUserRole$.pipe(
      map(role => role === 'teacher')
    );
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const idParam = params.get('id');
        this.courseId = idParam ? +idParam : null;

        if (this.courseId !== null) {
          return forkJoin([
            this.courseService.getCourse(this.courseId),
            this.lessonService.getLessonsByCourseId(this.courseId)
          ]);
        }
        return of([undefined, [] as Lesson[]] as [Course | undefined, Lesson[]]);
      })
    ).subscribe(([course, lessons]) => {
      this.course = course;
      this.lessons = lessons;
      if (!this.course) {
        console.warn('Course not found!');
      }
    }, error => {
      console.error('Error loading course or lessons:', error);
    });
  }

  addLesson(): void {
    if (this.courseId === null) return;

    const dialogRef = this.dialog.open(AddEditLessonDialogComponent, {
      width: '400px',
      data: { courseId: this.courseId, isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadLessonsForCourse(this.courseId!);
      }
    });
  }

  editLesson(lesson: Lesson): void {
    if (this.courseId === null) return;

    const dialogRef = this.dialog.open(AddEditLessonDialogComponent, {
      width: '400px',
      data: { lesson: lesson, courseId: this.courseId, isEdit: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadLessonsForCourse(this.courseId!);
      }
    });
  }

  deleteLesson(lessonId: number): void {
    if (this.courseId === null) return;

    if (confirm('האם אתה בטוח שברצונך למחוק שיעור זה?')) {
      this.lessonService.deleteLesson(this.courseId, lessonId).subscribe({
        next: () => {
          console.log('Lesson deleted successfully!');
          this.loadLessonsForCourse(this.courseId!);
        },
        error: (err) => console.error('Error deleting lesson:', err)
      });
    }
  }

  private loadLessonsForCourse(courseId: number): void {
    this.lessonService.getLessonsByCourseId(courseId).subscribe(lessons => {
      this.lessons = lessons;
    }, error => {
      console.error('Error reloading lessons:', error);
    });
  }

  // **פונקציה חדשה לחזרה לרשימת הקורסים**
  goBack(): void {
    this.router.navigate(['/courses']); // נווט חזרה לנתיב /courses
  }
}