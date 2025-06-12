import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';
import { Instructor } from '../interfaces/user.interface'; // שינוי כאן: ייבוא ממשק המורה
import { Course } from '../interfaces/course.interface';     // שינוי כאן: ייבוא ממשק הקורס
import { Student } from '../interfaces/student.interface';   // וודא שהנתיב נכון לממשק הסטודנט (הוא לא שונה)

@Injectable({
  providedIn: 'root'
})
export class InstructorService {

  // נתונים מוקפצים לדוגמה.
  // שימו לב לוודא ש-instructorId בקורסים תואם ל-ID של מורים,
  // ו-registeredStudentIds בקורסים תואם ל-ID של סטודנטים.
  private mockInstructors: Instructor[] = [
    { id: 'i1', firstName: 'דוד', lastName: 'כהן', email: 'david@example.com', taughtCourseIds: ['c101', 'c103'] },
    { id: 'i2', firstName: 'אפרת', lastName: 'שקד', email: 'efrat@example.com', taughtCourseIds: ['c102'] },
  ];

  private mockCourses: Course[] = [
    { id: 'c101', name: 'מבוא לתכנות', description: 'קורס בסיסי בפייתון.', instructorId: 'i1', registeredStudentIds: ['s1', 's2'] },
    { id: 'c102', name: 'מבני נתונים', description: 'קורס מתקדם באלגוריתמים.', instructorId: 'i2', registeredStudentIds: ['s1', 's3'] },
    { id: 'c103', name: 'עיצוב ממשק משתמש', description: 'עקרונות UI/UX.', instructorId: 'i1', registeredStudentIds: ['s2'] },
  ];

  private mockStudents: Student[] = [
    { id: 's1', firstName: 'נועה', lastName: 'לוי', email: 'noa@example.com', registeredCourseIds: ['c101', 'c102'] },
    { id: 's2', firstName: 'איתי', lastName: 'כהן', email: 'itay@example.com', registeredCourseIds: ['c101', 'c103'] },
    { id: 's3', firstName: 'שרה', lastName: 'ישראלי', email: 'sara@example.com', registeredCourseIds: ['c102'] },
  ];

  constructor() { }

  getInstructorById(instructorId: string): Observable<Instructor | undefined> {
    return of(this.mockInstructors.find(i => i.id === instructorId)).pipe(
      delay(500)
    );
  }

  getCoursesTaughtByInstructor(instructorId: string): Observable<Course[]> {
    const courses = this.mockCourses.filter(c => c.instructorId === instructorId);
    return of(courses).pipe(
      delay(500)
    );
  }

  getStudentsByIds(studentIds: string[]): Observable<Student[]> {
    const students = this.mockStudents.filter(s => studentIds.includes(s.id));
    return of(students).pipe(
      delay(500)
    );
  }

  getInstructorProfile(instructorId: string): Observable<{ instructor: Instructor; courses: CourseWithStudents[] }> {
    return this.getInstructorById(instructorId).pipe(
      switchMap(instructor => {
        if (!instructor) {
          throw new Error('Instructor not found');
        }
        return this.getCoursesTaughtByInstructor(instructor.id).pipe(
          switchMap(courses => {
            const courseObservables = courses.map(course => {
              if (course.registeredStudentIds && course.registeredStudentIds.length > 0) {
                return this.getStudentsByIds(course.registeredStudentIds).pipe(
                  map(students => ({ ...course, students }))
                );
              } else {
                return of({ ...course, students: [] });
              }
            });
            return forkJoin(courseObservables).pipe(
              map(coursesWithStudents => ({ instructor, courses: coursesWithStudents }))
            );
          })
        );
      })
    );
  }
}

// ממשק עזר לטיפוס נתונים של קורס עם רשימת סטודנטים
// שימו לב ש-CourseWithStudents מרחיב את הממשק Course הקיים שלך
export interface CourseWithStudents extends Course {
  students: Student[];
}