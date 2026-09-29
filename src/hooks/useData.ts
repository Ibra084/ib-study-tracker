import {createContext,useContext} from 'react';
import {useMutation,useQueryClient} from '@tanstack/react-query';
import {api} from '../lib/api';
import type {State,Session} from '../types';
export const DataContext=createContext<State|null>(null);
export function useData(){const data=useContext(DataContext);if(!data)throw new Error('Data provider missing');return data;}
type Change={path:string;method?:string;body:unknown};
export function useSave(){const client=useQueryClient();return useMutation({
 mutationFn:({path,method='POST',body}:Change)=>api(path,method,body),
 onMutate:async(change)=>{await client.cancelQueries({queryKey:['state']});const previous=client.getQueryData<State>(['state']);
 if(previous&&change.path==='sessions'){const entry=change.body as Session;client.setQueryData<State>(['state'],{...previous,sessions:change.method==='DELETE'?previous.sessions.filter(s=>s.id!==entry.id):[entry,...previous.sessions.filter(s=>s.id!==entry.id)]});}return {previous};},
 onError:(_error,_variables,context)=>{if(context?.previous)client.setQueryData(['state'],context.previous);},
 onSettled:()=>client.invalidateQueries({queryKey:['state']}),
 });}
