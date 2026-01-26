export default class UserEntity {
  public id?: string;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public password!: string;
  public age?: number;
  public createdAt?: Date;
  public updatedAt?: Date;
  public currentTokenId?: string | null;
  public isVerified: boolean = false;
  public verificationToken?: string | null;
  public verificationTokenExpires?: Date | null;

  constructor(props: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    age?: number;
    createdAt?: Date;
    updatedAt?: Date;
    currentTokenId?: string;
    isVerified?: boolean;
    verificationToken?: string;
    verificationTokenExpires?: Date;
  }) {
    Object.assign(this, props);
  }
}
