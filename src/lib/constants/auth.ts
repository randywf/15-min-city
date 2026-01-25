export type UserCredential = {
  username: string;
  password: string;
  role?: string;
};

export const USER_CREDENTIALS: UserCredential[] = [
  {
    username: "guest",
    password: "guest123",
    role: "guest",
  },
  {
    username: "adil.waris@uni-muenster.de",
    password: "adil123",
    role: "admin",
  },
  {
    username: "student@uni-muenster.de",
    password: "ifgi2025",
    role: "student",
  },
];
