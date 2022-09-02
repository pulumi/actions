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
    expect(spy).toHaveBeenCalledWith('login', cloudUrl);
  })
  it('should login when nothing is provided', async () => {
    await login("", "");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('login');
  })
  it('should not login when only token is provided', async () => {
    const accessToken = "my_access_token";    
    await login("", accessToken);
    expect(spy).not.toHaveBeenCalled();
  })
  it('should prefer cloud url to accessToken when both are specified', async () => {
    const cloudLogin = "my login url";    
    const accessToken = "my access token";    
    await login(cloudLogin, accessToken);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('login', cloudLogin);
  })
})