import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResumeAnalysis } from '../models/analysis.model';

@Injectable({
  providedIn: 'root'
})
export class AnalysisService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  analyzeResume(resumeId: number): Observable<ResumeAnalysis> {
    return this.http.post<ResumeAnalysis>(`${this.apiUrl}/resumes/${resumeId}/analyze`, {});
  }

  getResumeAnalyses(resumeId: number): Observable<ResumeAnalysis[]> {
    return this.http.get<ResumeAnalysis[]>(`${this.apiUrl}/resumes/${resumeId}/analyses`);
  }

  getUserAnalysisHistory(): Observable<ResumeAnalysis[]> {
    return this.http.get<ResumeAnalysis[]>(`${this.apiUrl}/analyses`);
  }

  getAnalysisById(id: number): Observable<ResumeAnalysis> {
    return this.http.get<ResumeAnalysis>(`${this.apiUrl}/analyses/${id}`);
  }

  deleteAnalysis(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/analyses/${id}`);
  }
}
