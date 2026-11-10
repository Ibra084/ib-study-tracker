import {describe,it,expect} from 'vitest';
import {readFile} from 'node:fs/promises';
import {schemaStatements} from '../../api/_lib/schema';
describe('database schema',()=>{
 it('keeps db/schema.sql in sync with the API schema',async()=>{expect((await readFile(new URL('../../db/schema.sql',import.meta.url),'utf8')).replace(/\r\n/g,'\n')).toBe(schemaStatements.join(';\n')+';\n');});
});
