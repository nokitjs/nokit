import * as Koa from 'koa';
import * as Router from 'koa-router';
import { IApplicationOptions } from './IApplicationOptions';
import { Container } from '../IoC';

export interface IApplication {
  options: IApplicationOptions;
  server: Koa;
  container: Container;
  router: Router;
}