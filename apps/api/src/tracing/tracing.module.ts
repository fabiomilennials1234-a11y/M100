import { Global, Module } from '@nestjs/common';
import { NoopTracingProvider } from './noop-tracing.provider';
import { LangfuseTracingProvider } from './langfuse-tracing.provider';
import { TRACING_PROVIDER } from './tracing.constants';
import { EventListenerService } from './event-listener.service';

export { TRACING_PROVIDER };

@Global()
@Module({
  providers: [
    {
      provide: TRACING_PROVIDER,
      useFactory: () => {
        const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
        const secretKey = process.env.LANGFUSE_SECRET_KEY;

        if (publicKey && secretKey) {
          return new LangfuseTracingProvider({
            publicKey,
            secretKey,
            baseUrl: process.env.LANGFUSE_HOST,
          });
        }

        return new NoopTracingProvider();
      },
    },
    EventListenerService,
  ],
  exports: [TRACING_PROVIDER],
})
export class TracingModule {}
