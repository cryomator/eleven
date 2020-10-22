
export class Logger {
  private tags = "";
  constructor(protected readonly verbose = false) { }
  public async log(...message: any[]) {
    return Promise.resolve().then(() => console.log(`[log]${this.tags} ${this.stringify(message)}`))
  }
  public async trace(...message: any[]) {
    return Promise.resolve().then(() => console.trace(`[trace]${this.tags} ${this.stringify(message)}`))
  }
  public async info(...message: any[]) {
    return Promise.resolve().then(() => console.info(`[info]${this.tags} ${this.stringify(message)}`))
  }
  public async error(...message: any[]) {
    return Promise.resolve().then(() => console.error(`[error]${this.tags} ${this.stringify(message)}`))
  }
  public async warning(...message: any[]) {
    return Promise.resolve().then(() => console.warn(`[warning]${this.tags} ${this.stringify(message)}`))
  }
  public async debug(...message: any[]) {
    if (!this.verbose) return;
    return Promise.resolve().then(() => console.debug(`[debug]${this.tags} ${this.stringify(message)}`))
  }
  private stringify(message: any[]) {
    return message.map((v) => {
      if (typeof v === "string") return v;
      if (v instanceof Error) return v.stack ?? v.message;
      return JSON.stringify(v, undefined, 1)?.replace(/\n\s*/g, "") ?? v
    }).filter(Boolean).join(" ")
  }
  public wrap(...tag: string[]) {
    const l = new Logger(this.verbose);
    l.tags = this.tags + tag.map((t) => `[${t}]`).join('');
    return l;
  }
}
export namespace Logger { }

export default Logger;
