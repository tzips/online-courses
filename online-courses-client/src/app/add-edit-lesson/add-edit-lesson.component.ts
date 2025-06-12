import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Lesson } from '../interfaces/lesson.interface';
import { LessonService } from '../services/lesson.service';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-add-edit-lesson',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule
  ],
  templateUrl: './add-edit-lesson.component.html',
  styleUrl: './add-edit-lesson.component.css'
})
export class AddEditLessonDialogComponent implements OnInit {
  lessonForm: FormGroup;
  isEditMode: boolean;
  lessonToEdit: Lesson | undefined;
  courseId: number; // זה ה-courseId שהדיאלוג קיבל כ-Input

  constructor(
    private fb: FormBuilder,
    private lessonService: LessonService,
    public dialogRef: MatDialogRef<AddEditLessonDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEditMode = data.isEdit;
    this.lessonToEdit = data.lesson;
    this.courseId = data.courseId;

    this.lessonForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.isEditMode && this.lessonToEdit) {
      this.lessonForm.patchValue(this.lessonToEdit);
    }
  }

  onSubmit(): void {
    if (this.lessonForm.valid) {
      // יצרנו את lessonData עם title, content, וגם courseId מהדיאלוג
      const lessonData = { ...this.lessonForm.value, courseId: this.courseId };

      if (this.isEditMode && this.lessonToEdit && this.lessonToEdit.id !== undefined) {
        this.lessonService.updateLesson(this.courseId, this.lessonToEdit.id, lessonData).subscribe({
          next: (res) => {
            this.dialogRef.close(true);
          },
          error: (err) => console.error('Error updating lesson:', err)
        });
      } else {
        // **התיקון כאן עבור addLesson:**
        // מעבירים את courseId כפרמטר הראשון,
        // ואת lessonData (שכבר מכיל title, content, ו-courseId) כפרמטר השני.
        this.lessonService.addLesson(this.courseId, lessonData).subscribe({ // שים לב ש-lessonData כבר מכיל courseId
          next: (res) => {
            this.dialogRef.close(true);
          },
          error: (err) => console.error('Error adding lesson:', err)
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
