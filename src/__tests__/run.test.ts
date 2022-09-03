import * as pulumiCli from "../libs/pulumi-cli";
import { login } from '../login';

const spy = jest.spyOn(pulumiCli, 'run');

describe('main.login', () => {
  beforeEach(() => {
    spy.mockClear();
  });
  it('should read self-hosted backend config', async () => {
    const cloudUrl = "s3://my_region.aws.com";    
    await login(cloudUrl, "");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('--non-interactive', 'login', cloudUrl);
  })
  it('should login when an access token is provided', async () => {
    const accessToken = "my_access_token";    
    await login("", accessToken);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('--non-interactive', 'login');
  })
  it('should not login when nothing provided', async () => {
    await login("", "");
    expect(spy).not.toHaveBeenCalled();
  })
  it('should login with cloud url when both are specified', async () => {
    const cloudLogin = "my login url";    
    const accessToken = "my access token";    
    await login(cloudLogin, accessToken);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('--non-interactive', 'login', cloudLogin);
  })
})