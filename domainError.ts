// Request Errors: wrong request, parameters, request body, missing or invalid headers => 1001+
// Authentication Errors: Verifiying an identity, authorizing an action => 1101+
// Session Errors: You as a logged in entity, access, permissions, restrictions you bear(as defined in you session) => 1201+

// --------- Application Error
// Other Errors: => 1501+

export type TypeDomainError = {
  errorCode: number | string;
  statusCode: number | string;
  message: string;
};

export const domainError = {
  NOT_FOUND: {
    errorCode: 1001,
    statusCode: 400,
    message: "resource not found",
  },

  INVALID_OR_MISSING_PARAMETER: {
    errorCode: 1002,
    statusCode: 400,
    message: "invalid or missing parameter",
  },

  INVALID_OR_MISSING_HEADER: {
    errorCode: 1003,
    statusCode: 400,
    message: "invalid or missing header",
  },

  // Authentic Errors
  INVALID_CREDENTIALS: {
    errorCode: 1101,
    statusCode: 401,
    message: "invalid credentials",
  },

  INVALID_BEARER_TOKEN: {
    errorCode: 1102,
    statusCode: 401,
    message: "invalid bearer token",
  },
};
