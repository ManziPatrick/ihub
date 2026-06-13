import type { ApolloServerPlugin } from '@apollo/server';

const SLOW_THRESHOLD_MS = 500;
const trackedOperations = ['GetCourses', 'GetCoursesSummary', 'GetCoursesLiteSummary', 'GetCourse', 'GetCourseLite'];

export const monitoringPlugin: ApolloServerPlugin = {
  async requestDidStart(requestContext: any) {
    const operationName = requestContext.request?.operationName || 'anonymous';
    const requestStart = Date.now();

    const shouldTrack = trackedOperations.some((op: string) => operationName.startsWith(op));
    if (!shouldTrack) return {};

    return {
      async willResolveField({ info }: any) {
        const fieldStart = Date.now();
        return () => {
          const duration = Date.now() - fieldStart;
          if (duration > SLOW_THRESHOLD_MS) {
            console.log(
              `[PERF] ${operationName}.${info.parentType}.${info.fieldName} took ${duration}ms`
            );
          }
        };
      },

      async willSendResponse() {
        const totalDuration = Date.now() - requestStart;
        let size = 0;
        try {
          size = JSON.stringify(requestContext.response?.body).length;
        } catch {}
        const sizeKB = (size / 1024).toFixed(1);
        console.log(`[GRAPHQL] ${operationName} | ${totalDuration}ms | ${sizeKB} KB`);
      },
    };
  },
};
