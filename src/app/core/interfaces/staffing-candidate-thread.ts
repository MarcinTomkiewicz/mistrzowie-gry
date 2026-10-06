export interface StaffingCandidateMessageAuthor {
  userId: string;
  firstName: string | null;
  nickname: string | null;
  useNickname: boolean;
}

export interface StaffingCandidateMessage {
  id: string;
  candidateId: string;
  author: StaffingCandidateMessageAuthor;
  body: string;
  createdAt: string;
}

export interface StaffingCandidateThread {
  candidateId: string;
  writable: boolean;
  messages: StaffingCandidateMessage[];
}
