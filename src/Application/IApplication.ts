import * as Koa from 'koa';
import * as Router from 'koa-router';
import { IApplicationOptions } from './IApplicationOptions';
import { IoCContainer } from '../IoC';

export interface IApplication {
  options: IApplicationOptions;
  server: Koa;
  container: IoCContainer;
  router: Router;
}