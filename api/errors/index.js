class DefaultError extends Error {
  constructor({ name, code, message }) {
    super(message);
    this.name = name;
    this.code = code;
  }
}

class AuthError extends DefaultError {
  constructor(message = "Unauthorized") {
    super({ name: "AuthError", code: 401, message });
  }
}

class NotFoundError extends DefaultError {
  constructor(message) {
    super({ name: "NotFoundError", code: 404, message });
  }
}

module.exports = {
  DefaultError,
  AuthError,
  NotFoundError,
};
