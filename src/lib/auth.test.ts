import {describe,it,expect} from 'vitest';
import {signToken,verifyToken,passcodeMatches,cookie,MAX_AGE} from '../../api/_lib/auth';
const secret='test-only-secret-at-least-thirty-two-characters';
describe('authentication',()=>{
 it('accepts a valid signed token',()=>{expect(verifyToken(signToken(secret,100000),secret,100001)).toBe(true);});
 it('rejects tampering, a wrong key, malformed and missing tokens',()=>{const token=signToken(secret);expect(verifyToken(token+'x',secret)).toBe(false);expect(verifyToken(token,secret+'x')).toBe(false);expect(verifyToken('broken',secret)).toBe(false);expect(verifyToken(undefined,secret)).toBe(false);expect(verifyToken(token+'.extra',secret)).toBe(false);});
 it('expires at exactly 30 days',()=>{expect(verifyToken(signToken(secret,100000),secret,100000+MAX_AGE*1000)).toBe(false);});
 it('compares passcodes and sets all cookie restrictions',()=>{expect(passcodeMatches('secret','secret')).toBe(true);expect(passcodeMatches('other','secret')).toBe(false);expect(cookie('token')).toContain('HttpOnly; Secure; SameSite=Strict; Path=/');expect(cookie('',true)).toContain('Max-Age=0');});
});
