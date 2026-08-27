export interface UserProfile {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

export interface UpdateProfileRequest {
  username: string;
}
