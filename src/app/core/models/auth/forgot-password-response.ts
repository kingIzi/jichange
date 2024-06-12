export class ForgotPasswordResponse {
  user_otp_sno!: number | string;
  code!: number | string;
  mobile_no!: number | string;
  posted_date!: string;
}
