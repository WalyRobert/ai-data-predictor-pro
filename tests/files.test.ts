import {it,expect} from 'vitest';
import ExcelJS from 'exceljs';
import {parseCSV,readDataset} from '../services/files';
it('lê separador entre aspas, aspas escapadas, nova linha e BOM',()=>{
 expect(parseCSV('\uFEFFnome;classe\r\n"a;b";"sim"\r\n"a""b\nc";não')).toEqual([{nome:'a;b',classe:'sim'},{nome:'a"b\nc',classe:'não'}]);
});
it('rejeita cabeçalho duplicado, linha desalinhada e aspas abertas',()=>{
 expect(()=>parseCSV('a,a\n1,2')).toThrow();expect(()=>parseCSV('a,b\n1')).toThrow();expect(()=>parseCSV('a,b\n"x,2')).toThrow();
});
it('lê XLSX real preservando rótulos de texto e rejeita XLS',async()=>{
 const wb=new ExcelJS.Workbook();const sheet=wb.addWorksheet('Exemplo');sheet.addRows([['x','classe'],[1,'002'],[2,'A']]);const bytes=await wb.xlsx.writeBuffer();
 const fake={name:'dados.xlsx',size:bytes.byteLength,arrayBuffer:async()=>bytes} as File;
 expect(await readDataset(fake)).toEqual([{x:'1',classe:'002'},{x:'2',classe:'A'}]);
 await expect(readDataset({name:'dados.xls',size:10} as File)).rejects.toThrow(/XLS/);
});
