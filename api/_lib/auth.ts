import {createHmac,timingSafeEqual,randomUUID} from 'node:crypto';
export const COOKIE='studyline_session';
export const MAX_AGE=30*24*60*60;
export function signToken(secret:string,now=Date.now()){
 const payload=Buffer.from(JSON.stringify({exp:Math.floor(now/1000)+MAX_AGE,nonce:randomUUID()})).toString('base64url');
 return `${payload}.${createHmac('sha256',secret).update(payload).digest('base64url')}`;
}
export function verifyToken(token:string|undefined,secret:string,now=Date.now()){
 if(!token||secret.length<32)return false;
 const parts=token.split('.');if(parts.length!==2)return false;
 const expected=createHmac('sha256',secret).update(parts[0]).digest();
 try {const signature=Buffer.from(parts[1],'base64url');if(signature.length!==expected.length||!timingSafeEqual(expected,signature))return false;
 const payload=JSON.parse(Buffer.from(parts[0],'base64url').toString());return typeof payload.exp==='number'&&payload.exp>Math.floor(now/1000)&&payload.exp<=Math.floor(now/1000)+MAX_AGE;
 }catch{return false;}
}
export function passcodeMatches(input:string,expected:string){const hash=(v:string)=>createHmac('sha256','studyline-constant-time').update(v).digest();return timingSafeEqual(hash(input),hash(expected));}
export function cookie(value:string,clear=false){return `${COOKIE}=${value}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${clear?0:MAX_AGE}`;}
