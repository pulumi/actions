import * as envalid from 'envalid';

export const environmentVariables = envalid.cleanEnv(
  process.env,
  {
    CI: envalid.str(),
    GITHUB_WORKFLOW: envalid.str(),
    GITHUB_RUN_ID: envalid.str(),
    GITHUB_RUN_NUMBER: envalid.str(),
    GITHUB_ACTION: envalid.str(),
    GITHUB_ACTIONS: envalid.str(),
    GITHUB_ACTOR: envalid.str(),
    GITHUB_REPOSITORY: envalid.str(),
    GITHUB_EVENT_NAME: envalid.str(),
    GITHUB_EVENT_PATH: envalid.str(),
    GITHUB_WORKSPACE: envalid.str(),
    GITHUB_SHA: envalid.str(),
    GITHUB_REF: envalid.str(),
    GITHUB_HEAD_REF: envalid.str(),
    GITHUB_BASE_REF: envalid.str(),
    GITHUB_SERVER_URL: envalid.str(),
    GITHUB_API_URL: envalid.str(),
    GITHUB_GRAPHQL_URL: envalid.str(),
  }, { strict: true }
);

export type EnvironmentVariables = typeof environmentVariables;
