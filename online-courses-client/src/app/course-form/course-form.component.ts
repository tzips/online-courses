// src/app/course-form/course-form.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Course } from '../interfaces/course.interface'; // וודא שהנתיב נכון

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, // חיוני לטפסים ריאקטיביים
    MatDialogModule,     // עבור דיאלוג
    MatFormFieldModule,  // עבור שדות טופס
    MatInputModule,      // עבור קלט טקסט
    MatButtonModule      // עבור כפתורים
  ],
  templateUrl: './course-form.component.html',
  styleUrls: ['./course-form.component.css'] // או .css
})
export class CourseFormComponent implements OnInit {
  courseForm: FormGroup;
  isNew: boolean; // דגל המציין אם זה טופס חדש או עריכה

  constructor(
    public dialogRef: MatDialogRef<CourseFormComponent>,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    // הזרקת נתונים לדיאלוג:
    // data יכיל: { isNew: boolean, course?: Course, teacherId?: number }
    @Inject(MAT_DIALOG_DATA) public data: { isNew: boolean; course?: Course; teacherId?: number }
  ) {
    this.isNew = data.isNew;

    this.courseForm = this.fb.group({
      id: [data.course?.id || null], // ID קיים לעריכה, או null לחדש
      title: [data.course?.title || '', Validators.required],
      description: [data.course?.description || '', Validators.required],
      // שדה teacherId:
      // - אם זה קורס חדש (isNew=true), נקבל את teacherId מה-data.
      // - אם זה עריכת קורס (isNew=false), נקבל את teacherId מהקורס הקיים.
      // - השדה יהיה מושבת (disabled) כי השרת משתמש ב-req.userId.
      teacherId: [{ value: data.course?.teacherId || data.teacherId, disabled: true }, Validators.required]
    });
  }

  ngOnInit(): void {
    // אין צורך ב-logic נוסף ב-OnInit מכיוון שהטופס מאותחל בקונסטרוקטור
  }

  onCancel(): void {
    this.dialogRef.close(false); // סגור את הדיאלוג והחזר false (בוטל)
  }

  onSubmit(): void {
    if (this.courseForm.valid) {
      // חשוב: השתמש ב-getRawValue() כדי לקבל את הערכים של שדות מושבתים (disabled)
      const formValue = this.courseForm.getRawValue();
      this.dialogRef.close(formValue); // סגור את הדיאלוג והחזר את נתוני הטופס
    } else {
      this.courseForm.markAllAsTouched();
      this.snackBar.open('אנא מלא את כל השדות הנדרשים כראוי.', 'סגור', { duration: 3000 });
    }
  }
}
