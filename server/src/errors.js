export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const route = (handler) => (req, res, next) => handler(req, res, next).catch(next);
