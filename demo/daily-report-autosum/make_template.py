"""Generate the sample workbook: python3 demo/daily-report-autosum/make_template.py"""
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from openpyxl.workbook.properties import CalcProperties
HEADERS=['日期','門市','人員','品項','數量','營收']
REPORTS=[[
['2026-10-01','東區店','小安','筆記本',3,360],['2026-10-01','西區店','小晴','原子筆',10,200]],[
['2026-10-02','東區店','小安','原子筆',8,160],['2026-10-02','西區店','小宇','筆記本',2,240]],[
['2026-10-03','東區店','小宇','筆記本',4,480],['2026-10-03','西區店','小晴','原子筆',5,100]]]
def main():
    w=Workbook(); w.remove(w.active)
    for i,rows in enumerate(REPORTS,1):
        s=w.create_sheet(f'日報{i}'); s.append(HEADERS)
        for row in rows: s.append(row)
    merged=w.create_sheet('合併明細'); merged.append(HEADERS)
    for i,rows in enumerate(REPORTS,1):
        for r in range(2,len(rows)+2): merged.append([f"='日報{i}'!{col}{r}" for col in 'ABCDEF'])
    s=w.create_sheet('彙總'); s.append(['門市／日期','2026-10-01','2026-10-02','2026-10-03','總營收'])
    for r,store in enumerate(['東區店','西區店'],2):
        s.cell(r,1,store)
        for c in range(2,5):
            col=chr(64+c); s.cell(r,c,f'=SUMIFS(合併明細!$F$2:$F$7,合併明細!$B$2:$B$7,$A{r},合併明細!$A$2:$A$7,{col}$1)')
        s.cell(r,5,f'=SUM(B{r}:D{r})')
    s.append([]); s.append(['人員','數量','營收'])
    for r,name in enumerate(['小安','小晴','小宇'],6):
        s.cell(r,1,name)
        for c,col in [(2,'E'),(3,'F')]: s.cell(r,c,f'=SUMIFS(合併明細!${col}$2:${col}$7,合併明細!$C$2:$C$7,A{r})')
    s['A10']='範例共 6 筆，數量 32，營收 1540；公式範圍到第 7 列，新增資料請延伸範圍。'
    for sheet in w:
        sheet.freeze_panes='B2'; sheet.auto_filter.ref=sheet.dimensions
        for cell in sheet[1]: cell.font=Font(bold=True,color='FFFFFF'); cell.fill=PatternFill('solid',fgColor='164E63')
        for col in 'ABCDEF': sheet.column_dimensions[col].width=22
    w.calculation=CalcProperties(calcId=191029,fullCalcOnLoad=True)
    w.save(Path(__file__).with_name('template.xlsx'))
if __name__=='__main__': main()
