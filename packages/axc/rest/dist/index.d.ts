import type { ApplicationServicesFactory } from '@axc/application-services';
import type { HttpHandler } from '@azure/functions';
import { Hono } from 'hono';
export declare function createRestApp(applicationServicesFactory: ApplicationServicesFactory): Hono;
export declare const restHandlerCreator: (applicationServicesFactory: ApplicationServicesFactory) => HttpHandler;
