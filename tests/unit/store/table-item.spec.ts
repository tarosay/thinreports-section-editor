import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';
import decodeSchema from '@/store/lib/layout-schema/decode';
import layoutJsonSchema from '@/store/lib/layout-schema/schema.json';
import { report, root } from '@/store';
import { AnySection, TableItem } from '@/types';

const findDetailSection = (): AnySection => {
  const section = report.getters.sections().find(s => s.type === 'detail');
  if (!section) throw new Error('detail section is not found');
  return section;
};

const findTable = (): TableItem => {
  const table = report.getters.tables()[0];
  if (!table) throw new Error('table is not found');
  return table;
};

const EMPTY_SCHEMA = {
  'schema-version': '1.0',
  'last-modified-by': 'test',
  title: '',
  report: {
    orientation: 'portrait',
    'paper-type': 'A4',
    width: 0,
    height: 0,
    margin: [20, 20, 20, 20]
  },
  state: { 'layout-guides': [] },
  sections: []
};

describe('table item', () => {
  beforeEach(() => {
    // Start from an empty report so that each example is independent.
    root.actions.loadSchema(JSON.stringify(EMPTY_SCHEMA), 'test.tlf');
    report.actions.addNewDetail();

    report.actions.drawNewTableItem({
      targetType: 'section',
      targetUid: findDetailSection().uid,
      bounds: { x1: 10, y1: 20, x2: 310, y2: 80 }
    });
  });

  it('creates a table with columns, a header row and a body row', () => {
    const table = findTable();

    expect(table.type).toBe('table');
    expect(table.x).toBe(10);
    expect(table.y).toBe(20);
    expect(table.columns.length).toBe(3);
    expect(table.rows.length).toBe(2);

    const rows = table.rows.map(uid => report.getters.findTableRow(uid));
    expect(rows.map(row => row.type)).toEqual(['header', 'body']);

    // Every row has one cell per column.
    rows.forEach(row => expect(row.cells.length).toBe(3));

    // A header cell holds a static text, a body cell holds a text-block.
    const headerCell = report.getters.findTableCell(rows[0].cells[0]);
    const bodyCell = report.getters.findTableCell(rows[1].cells[0]);

    expect(report.getters.findItem(headerCell.content!).type).toBe('text');
    expect(report.getters.findItem(bodyCell.content!).type).toBe('text-block');
  });

  it('computes its size from columns and rows', () => {
    const table = findTable();

    const expectedWidth = table.columns.reduce((w, column) => w + column.width, 0);
    const expectedHeight = table.rows.reduce((h, uid) => h + report.getters.findTableRow(uid).height, 0);

    expect(report.getters.widthOfTable(table.uid)).toBe(expectedWidth);
    expect(report.getters.heightOfTable(table.uid)).toBe(expectedHeight);
  });

  it('renames the column of its cells when a column is renamed', () => {
    const table = findTable();
    const columnId = table.columns[0].id;

    report.actions.updateTableColumn({ tableUid: table.uid, columnId, key: 'id', value: 'name' });

    expect(findTable().columns[0].id).toBe('name');

    findTable().rows.forEach(rowUid => {
      const cell = report.getters.findTableCell(report.getters.findTableRow(rowUid).cells[0]);
      expect(cell.columnId).toBe('name');
    });
  });

  it('adds and removes a column with its cells', () => {
    const table = findTable();

    report.actions.activateEntity({ uid: table.uid, type: 'item' });
    report.actions.addColumnToActiveTable();

    expect(findTable().columns.length).toBe(4);
    findTable().rows.forEach(rowUid => {
      expect(report.getters.findTableRow(rowUid).cells.length).toBe(4);
    });

    report.actions.removeColumnFromActiveTable({ columnId: findTable().columns[3].id });

    expect(findTable().columns.length).toBe(3);
    findTable().rows.forEach(rowUid => {
      expect(report.getters.findTableRow(rowUid).cells.length).toBe(3);
    });
  });

  it('encodes and decodes a table without losing anything', () => {
    const table = findTable();
    const bodyRow = report.getters.findTableRow(table.rows[1]);
    const cellUid = bodyRow.cells[0];

    report.actions.updateTableCellStyle({ uid: cellUid, key: 'backgroundColor', value: '#eeeeee' });
    report.actions.updateTableCellStyle({ uid: cellUid, key: 'backgroundPattern', value: 'forward-diagonal' });
    report.actions.updateTableCellStyle({ uid: cellUid, key: 'borderBottom', value: { width: 1.5 } });
    report.actions.updateTableCell({ uid: cellUid, key: 'colSpan', value: 2 });

    const encoded = JSON.parse(report.getters.toSchemaJSON());
    const encodedTable = encoded.sections
      .flatMap((section: { items: Array<{ type: string }> }) => section.items)
      .find((item: { type: string }) => item.type === 'table');

    expect(encodedTable).toBeTruthy();
    expect(encodedTable.columns.length).toBe(3);
    expect(encodedTable.rows.length).toBe(2);

    const encodedCell = encodedTable.rows[1].cells[0];
    expect(encodedCell['column-id']).toBe(encodedTable.columns[0].id);
    expect(encodedCell['col-span']).toBe(2);
    expect(encodedCell.style['background-color']).toBe('#eeeeee');
    expect(encodedCell.style['background-pattern']).toBe('forward-diagonal');
    expect(encodedCell.style['border-bottom']).toEqual({ width: 1.5 });
    expect(encodedCell.content.type).toBe('text-block');

    // The encoded schema must satisfy the layout JSON schema.
    const ajv = new Ajv({ strict: false });
    const validate = ajv.compile(layoutJsonSchema);

    expect(validate(encoded)).toBe(true);

    // Decoding it again has to produce the same schema.
    root.actions.loadSchema(JSON.stringify(encoded), 'test.tlf');
    expect(JSON.parse(report.getters.toSchemaJSON())).toEqual(encoded);

    expect(decodeSchema(encoded).entities).toBeTruthy();
  });

  it('writes a template file which the generator can read', () => {
    const outDir = process.env.TABLE_FIXTURE_DIR;
    if (!outDir) return;

    const section = findDetailSection();
    report.actions.updateDetailSection({ sectionUid: section.uid, key: 'id', value: 'main' });

    const table = findTable();
    report.actions.updateTableItem({ uid: table.uid, key: 'id', value: 'items' });

    const columnIds = ['name', 'qty', 'price'];
    table.columns.forEach((column, index) => {
      report.actions.updateTableColumn({ tableUid: table.uid, columnId: column.id, key: 'id', value: columnIds[index] });
    });

    const [headerRowUid, bodyRowUid] = findTable().rows;

    // Header cells: a caption and a background color.
    report.getters.findTableRow(headerRowUid).cells.forEach((cellUid, index) => {
      const cell = report.getters.findTableCell(cellUid);
      report.actions.updateTableCellStyle({ uid: cellUid, key: 'backgroundColor', value: '#e8eef5' });
      report.actions.updateTextItem({
        uid: cell.content!,
        key: 'texts',
        value: [['Name', 'Qty', 'Price'][index]]
      });
    });

    // Body cells refer to their column by id.
    report.getters.findTableRow(bodyRowUid).cells.forEach(cellUid => {
      const cell = report.getters.findTableCell(cellUid);
      report.actions.updateTextBlockItem({ uid: cell.content!, key: 'id', value: cell.columnId });
    });

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'editor-table.tlf'), report.getters.toSchemaJSON(), 'utf-8');
  });
});
