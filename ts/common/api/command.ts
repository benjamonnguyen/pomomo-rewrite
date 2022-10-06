export enum ECommand {
  TIMER_UPDATE,
}

export interface CommandMessage {
  commandType: ECommand;
  payload: IPayload;
  targetGuildId: string;
  options?: any;
}

export interface IPayload {}

export interface TimerUpdatePayload {}
