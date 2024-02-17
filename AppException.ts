import Exception from "./Exception";
import { TypeDomainError } from "./domainError";

class AppException extends Exception {
  message: string;
  errorCode: number | string;
  statusCode: number | string;

  constructor(domainErrorObject: TypeDomainError, message = "") {
    super();

    this.message = message || domainErrorObject.message || "";
    this.errorCode = domainErrorObject.errorCode || "";
    this.statusCode = domainErrorObject.statusCode || 400;
  }
}

export default AppException;
