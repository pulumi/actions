import * as exec from './exec';

export async function isAvailable(): Promise<Boolean> {
  const res = await exec.exec(`pulumi`, [], true)
  return (res.stderr != '' && !res.success) ? false : res.success;
}
