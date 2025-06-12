// src/app/services/course.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Course } from '../interfaces/course.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = `${environment.apiUrl}/courses`;

  constructor(private http: HttpClient) { }

  getAllCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(this.apiUrl);
  }

  getCourse(id: number): Observable<Course> {
    return this.http.get<Course>(`${this.apiUrl}/${id}`);
  }

  addCourse(course: Omit<Course, 'id'>): Observable<Course> {
    return this.http.post<Course>(this.apiUrl, course);
  }

  updateCourse(id: number, course: Course): Observable<Course> {
    return this.http.put<Course>(`${this.apiUrl}/${id}`, course);
  }

  deleteCourse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  enrollStudent(courseId: number, studentId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${courseId}/enroll`, { studentId });
  }

  unenrollStudent(courseId: number, studentId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${courseId}/unenroll`, { body: { userId: studentId } }); // שינוי ל-DELETE עם body
  }

  getEnrolledCoursesByStudent(studentId: number): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/student/${studentId}`);
  }

  // הפונקציה getCoursesByTeacherId הוסרה מכאן
}