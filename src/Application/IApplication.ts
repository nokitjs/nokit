import * as Koa from 'koa';
import { IApplicationOptions } from './IApplicationOptions';
import { IoCContainer } from '../IoC';

export interface IApplication {
  options: IApplicationOptions;
  server: Koa;
  container: IoCContainer;
}