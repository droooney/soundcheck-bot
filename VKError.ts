export interface IVKError {
  error_msg: string;
}

export default class VKError extends Error {
  vkError: IVKError;

  constructor(error: IVKError) {
    super(error.error_msg);

    this.name = this.constructor.name;
    this.vkError = error;

    Error.captureStackTrace(this, this.constructor);
  }
}
