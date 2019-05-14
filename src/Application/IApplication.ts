import * as Koa from 'koa';
import { IApplicationOptions } from './IApplicationOptions';

export interface IApplication {
  options: IApplicationOptions;
  server: Koa;
}