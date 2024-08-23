import { MiddlewareConsumer, Module, NestModule, Scope } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule, WinstonModuleOptions } from 'nest-winston';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { envValidation } from './srv-shared/common/utils';
import { AlsMiddleware } from './srv-shared/als/als.middleware';
import winstonConfig from './srv-shared/config/winston.config';
import databaseConfig from './srv-shared/config/database.config';
import { TraceLoggingInterceptor } from './srv-shared/common/interceptors';
import {
  AllExceptionFilter,
  HttpExceptionFilter,
} from './srv-shared/common/filters';
import { AlsModule } from './srv-shared/als/als.module';
import { AuthModule } from './srv-shared/auth/auth.module';
import { SrvEnvVariablesDto } from 'src/config/validation-dto';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `./env/${process.env.NODE_ENV || 'development'}.env`,
      isGlobal: true,
      load: [databaseConfig, winstonConfig],
      validate: (config) => envValidation(config, SrvEnvVariablesDto),
    }),
    AuthModule,
    AlsModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          ...configService.get<DataSourceOptions>('database'),
          autoLoadEntities: true,
        };
      },
      inject: [ConfigService],
    }),

    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return configService.get<WinstonModuleOptions>(
            'winston',
        ) as WinstonModuleOptions;
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TraceLoggingInterceptor,
      scope: Scope.REQUEST,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AlsMiddleware).forRoutes('*');
  }
}
