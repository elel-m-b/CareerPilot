import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Resume, ResumeDetail } from '../models/resume.model';

@Injectable({
  providedIn: 'root'
})
export class ResumeService {
  private apiUrl = `${environment.apiUrl}/resumes`;

  constructor(private http: HttpClient) {}

  uploadResume(file: File): Observable<Resume> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Resume>(`${this.apiUrl}/upload`, formData);
  }

  getUserResumes(): Observable<Resume[]> {
    return this.http.get<Resume[]>(this.apiUrl);
  }

  getResumeDetail(id: number): Observable<ResumeDetail> {
    return this.http.get<ResumeDetail>(`${this.apiUrl}/${id}`);
  }

  deleteResume(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
