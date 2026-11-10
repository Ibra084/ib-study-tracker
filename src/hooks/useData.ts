import {createContext,useContext} from 'react';
import {useMutation,useQueryClient} from '@tanstack/react-query';
import {api} from '../lib/api';
import type {State,Session,Item} from '../types';
export const DataContext=createContext<State|null>(null);
export function useData(){const data=useContext(DataContext);if(!data)throw new Error('Data provider missing');return data;}
type Change={path:string;method?:string;body:unknown};
function optimistic(previous:State,change:Change):State|null{
 if(change.path==='sessions'){const entry=change.body as Session;return {...previous,sessions:change.method==='DELETE'?previous.sessions.filter(s=>s.id!==entry.id):[entry,...previous.sessions.filter(s=>s.id!==entry.id)]};}
 if(change.path==='items'){
 if(change.method==='DELETE'){const {id}=change.body as {id:string};return {...previous,items:previous.items.filter(i=>i.id!==id)};}
 const list=([] as Item[]).concat(change.body as Item|Item[]);const changed=new Map(list.map(i=>[i.id,i]));
 return {...previous,items:[...previous.items.map(i=>changed.get(i.id)||i),...list.filter(i=>!previous.items.some(p=>p.id===i.id))]};
 }
 return null;
}
export function useSave(){const client=useQueryClient();return useMutation({
 mutationFn:({path,method='POST',body}:Change)=>api(path,method,body),
 onMutate:async(change)=>{await client.cancelQueries({queryKey:['state']});const previous=client.getQueryData<State>(['state']);
 const next=previous&&optimistic(previous,change);if(next)client.setQueryData<State>(['state'],next);return {previous};},
 onError:(_error,_variables,context)=>{if(context?.previous)client.setQueryData(['state'],context.previous);},
 onSettled:()=>client.invalidateQueries({queryKey:['state']}),
 });}
// Saves one item or a batch. Data is validated again on the server.
export function useItemSave(){const save=useSave();return {...save,put:(body:Item|Item[])=>save.mutateAsync({path:'items',method:'PUT',body}),remove:(id:string)=>save.mutateAsync({path:'items',method:'DELETE',body:{id}})};}
