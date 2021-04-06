import * as rt from 'runtypes';

const envVars = rt.Record({
  GITHUB_WORKSPACE: rt.String,
  PULUMI_ACCESS_TOKEN: rt.String.optional(),
});

export type EnvironmentVariables = rt.Static<typeof envVars>;

export function makeEnv(): EnvironmentVariables {
  return envVars.check({
    GITHUB_WORKSPACE: process.env.GITHUB_WORKSPACE,
    PULUMI_ACCESS_TOKEN: process.env.PULUMI_ACCESS_TOKEN,
  });
}
