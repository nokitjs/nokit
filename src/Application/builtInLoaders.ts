import { ControllerLoader } from '../Controller';
import { ILoaderInfo } from '../Loader/ILoaderInfo';
import { InfoLoader } from '../Info';
import { ServiceLoader } from '../Service';
import { StaticLoader } from '../Static';
import { ViewLoader } from '../View';

export const builtLoaders: ILoaderInfo[] = [
  {
    name: 'info',
    loader: InfoLoader,
    options: null,
  },
  {
    name: 'service',
    loader: ServiceLoader,
    options: { path: './src/**/*.service.{ts,js}' },
  },
  {
    name: 'controller',
    loader: ControllerLoader,
    options: { path: './src/**/*.controller.{ts,js}' },
  },
  {
    name: 'view',
    loader: ViewLoader,
    options: { path: './views' },
  },
  {
    name: 'static',
    loader: StaticLoader,
    options: { path: './public' },
  },
];