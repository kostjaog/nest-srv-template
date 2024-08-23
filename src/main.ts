import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: { credentials: true, origin: true },
  });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const config = new DocumentBuilder()
      .setTitle('C-Movements')
      .setDescription('Api сервиса движений')
      .setVersion('1.0')
      .build();
  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [],
  });

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      supportedSubmitMethods: ['get'],
    },
  });

  const appPort = process.env.APP_PORT || 3000;
  await app.listen(appPort);
  app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        stopAtFirstError: true,
        transform: true,
      }),
  );
  console.log(`Server is running on port ${appPort}`);
  console.log(`Server log level is ${process.env.LOG_LEVEL}`);
}
bootstrap();
