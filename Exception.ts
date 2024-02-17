class Exception extends Error {
  message: string;
  isDeveloperError: boolean;
  errorCode: number | string;
  statusCode: number | string;

  constructor() {
    super();

    this.isDeveloperError = false;
    this.stack = undefined;
  }
}

export default Exception;
