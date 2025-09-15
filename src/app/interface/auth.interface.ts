export type TRoles = "sup-admin" | "admin";

export interface IUserJWTPayload {
  _id: string;
  email: string;
  role: TRoles;
}

export interface IUser {
  role: TRoles;
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
}
