export class ApiError extends Error {constructor(public status:number,message:string){super(message);}}
export async function api<T>(path:string,method='GET',body?:unknown):Promise<T>{
 const response=await fetch(`/api/${path}`,{method,credentials:'same-origin',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 let data;try{data=await response.json();}catch{throw new ApiError(response.status,'The API is unavailable. Start this app with vercel dev or open its deployed URL.');}
 if(!response.ok){if(response.status===401&&path!=='login')window.dispatchEvent(new Event('auth-expired'));throw new ApiError(response.status,data.error?.message||'Request failed. Please retry.');}return data;
}
export function download(content:string,name:string,type:string){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function csvCell(value:unknown){let text=String(value??'');if(/^[=+\-@\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}
