
declare global {
  interface Error {
    statusCode?: number;
    errors?: any;
  }
  interface BigInt {
    toJSON(): string;
  }
}
export {};
