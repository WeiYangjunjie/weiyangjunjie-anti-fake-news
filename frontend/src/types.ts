
export enum UserRole {
  GUEST = 'GUEST',
  READER = 'READER',
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN'
}

export enum NewsStatus {
  UNKNOWN = 'UNKNOWN',
  FAKE = 'FAKE',
  NOT_FAKE = 'NOT_FAKE'
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  password?: string; // Added for mock auth
}

export interface Comment {
  id: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  content: string;
  imageUrl?: string;
  createdAt: string;
  isDeleted: boolean;
}

export interface NewsItem {
  id: string;
  topic: string;
  shortDetail: string;
  fullDetail: string;
  status: NewsStatus;
  reporter: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  voteCounts: {
    fake: number;
    notFake: number;
    total: number;
  };
  userVote?: NewsStatus | null;
  _count: {
    comments: number;
  };
  isDeleted: boolean;
}

export type Language = 'en' | 'zh';
