// src/app/services/lesson.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Lesson } from '../interfaces/lesson.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LessonService {
  // נגדיר את ה-apiUrl כבסיס ה-API הכללי, ללא הנתיב הספציפי של lessons
  // כי הוא ישתנה בהתאם לקינון.
  // זה אמור להיות לדוגמה: http://localhost:3000/api
  private baseUrl = environment.apiUrl; // נקרא לזה baseUrl כדי שיהיה ברור שזה הבסיס

  constructor(private http: HttpClient) { }

  // **השינוי העיקרי כאן:**
  // בונה את ה-URL כך שיתאים לניתוב המקונן ב-Backend: /api/courses/:courseId/lessons
  getLessonsByCourseId(courseId: number): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.baseUrl}/courses/${courseId}/lessons`);
  }

  // **עדכון לפונקציות נוספות אם הן מקוננות תחת קורסים ב-Backend:**
  // (רוב הסיכויים שכן, בהתבסס על מבנה ה-Backend שלך)

  // כדי לקבל שיעור בודד, צריך גם את courseId
  getLessonById(courseId: number, lessonId: number): Observable<Lesson> {
    return this.http.get<Lesson>(`${this.baseUrl}/courses/${courseId}/lessons/${lessonId}`);
  }

  // כדי להוסיף שיעור, צריך גם את courseId ב-URL
  addLesson(courseId: number, lesson: Omit<Lesson, 'id'>): Observable<{ message: string, lessonId: number }> {
    const { title, content } = lesson; // ה-courseId מגיע כפרמטר נפרד
    return this.http.post<{ message: string, lessonId: number }>(`${this.baseUrl}/courses/${courseId}/lessons`, { title, content });
  }

  // כדי לעדכן שיעור, צריך גם את courseId ב-URL
  updateLesson(courseId: number, lessonId: number, lesson: Lesson): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/courses/${courseId}/lessons/${lessonId}`, lesson);
  }

  // כדי למחוק שיעור, צריך גם את courseId ב-URL
  deleteLesson(courseId: number, lessonId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/courses/${courseId}/lessons/${lessonId}`);
  }
}