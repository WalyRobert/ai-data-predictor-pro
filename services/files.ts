import ExcelJS from 'exceljs';
import type {DataRow} from '../types';
export function rowsFromCells(cells:string[][]):DataRow[]{
 const headers=cells[0]?.map(s=>s.trim().replace(/^\uFEFF/,''));
 if(!headers||headers.length<2||headers.length>30||headers.some(s=>!s)||new Set(headers).size!==headers.length)throw Error('Use 2 a 30 cabeçalhos únicos e não vazios.');
 const records=cells.slice(1).filter(row=>row.some(v=>v.trim()!==''));
 if(!records.length||records.length>1000)throw Error('Use até 1000 linhas de dados, além do cabeçalho.');
 return records.map(row=>{if(row.length!==headers.length)throw Error('Uma linha tem quantidade de campos diferente do cabeçalho.');return Object.fromEntries(headers.map((h,i)=>[h,row[i]]));});
}
export function parseCSV(text:string):DataRow[]{
 // CSV with quoted separators, escaped quotes, CRLF and embedded newlines.
 text=text.replace(/^\uFEFF/,'');
 const count=(delimiter:string)=>{let quoted=false,total=0;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"')i++;else quoted=!quoted;}else if(!quoted&&c==='\n')break;else if(!quoted&&c===delimiter)total++;}return total;};
 const delimiter=[',',';','\t'].sort((a,b)=>count(b)-count(a))[0];
 const rows:string[][]=[];let row:string[]=[],field='',quoted=false,closed=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else {quoted=false;closed=true;}}else field+=c;continue;}
  if(c==='"'){if(field||closed)throw Error('Aspas inválidas no CSV.');quoted=true;}
  else if(c===delimiter){row.push(field);field='';closed=false;}
  else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);rows.push(row);row=[];field='';closed=false;}
  else {if(closed)throw Error('Texto após o fechamento de aspas no CSV.');field+=c;}
 }
 if(quoted)throw Error('CSV com aspas não fechadas.');
 if(field||row.length){row.push(field);rows.push(row);}
 return rowsFromCells(rows);
}
export async function readDataset(file:File):Promise<DataRow[]>{
 if(file.size>1024*1024)throw Error('Limite: 1 MB por arquivo.');
 if(file.name.toLowerCase().endsWith('.csv'))return parseCSV(await file.text());
 if(!file.name.toLowerCase().endsWith('.xlsx'))throw Error('Use CSV ou XLSX. O formato XLS antigo não é suportado.');
 const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(await file.arrayBuffer());const sheet=workbook.worksheets[0];
 if(!sheet||sheet.rowCount<2||sheet.rowCount>1001||sheet.columnCount>30)throw Error('Planilha vazia ou acima de 1000 linhas / 30 colunas.');
 const cells=Array.from({length:sheet.rowCount},(_,i)=>Array.from({length:sheet.columnCount},(_,j)=>sheet.getRow(i+1).getCell(j+1).text));
 return rowsFromCells(cells);
}
