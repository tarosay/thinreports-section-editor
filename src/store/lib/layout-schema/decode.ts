import { v4 as uuid } from 'uuid';
import { AnyItemSchema, AnySectionSchema, CellContentItemSchema, GraphicItemSchema, LayoutSchema, StackViewItemSchema, StackViewRowSchema, TableCellSchema, TableItemSchema, TableRowSchema, TextItemSchema } from './schema-types';
import { deepChangeToCamelCase } from '@/lib/deep-change-case';
import { computeContentHeight } from '@/store/report/builders/text-item-builder';
import { Report, SectionUid, AnySection, AnyItem, ItemUid, StackViewItem, StackViewRowUid, GraphicItem, TextItem, TableItem, TableRowUid, TableCellUid } from '@/types';

class SchemaDecoder {
  private layoutSchema: LayoutSchema;

  private itemEntities: Report['entities']['items'];
  private sectionEntities: Report['entities']['sections'];
  private stackViewRowEntities: Report['entities']['stackViewRows'];
  private tableRowEntities: Report['entities']['tableRows'];
  private tableCellEntities: Report['entities']['tableCells'];

  constructor (layoutSchema: LayoutSchema) {
    this.layoutSchema = layoutSchema;

    this.itemEntities = {};
    this.sectionEntities = {};
    this.stackViewRowEntities = {};
    this.tableRowEntities = {};
    this.tableCellEntities = {};
  }

  decode (): Omit<Report, 'activeEntity'> {
    const reportSchema = this.layoutSchema.report;

    return {
      type: 'section',
      title: this.layoutSchema.title,
      paperType: reportSchema.paperType,
      width: reportSchema.width,
      height: reportSchema.height,
      orientation: reportSchema.orientation,
      margin: reportSchema.margin,
      sections: this.sections(this.layoutSchema.sections),
      entities: {
        items: this.itemEntities,
        sections: this.sectionEntities,
        stackViewRows: this.stackViewRowEntities,
        tableRows: this.tableRowEntities,
        tableCells: this.tableCellEntities
      },
      layoutGuides: this.layoutSchema.state.layoutGuides
    };
  }

  sections (sectionSchemas: AnySectionSchema[]): Report['sections'] {
    const headerUids: SectionUid[] = [];
    const detailUids: SectionUid[] = [];
    const footerUids: SectionUid[] = [];

    sectionSchemas.forEach(sectionSchema => {
      const section = this.section(sectionSchema);

      switch (sectionSchema.type) {
        case 'header':
          headerUids.push(section.uid);
          break;
        case 'detail':
          detailUids.push(section.uid);
          break;
        case 'footer':
          footerUids.push(section.uid);
          break;
      }
      this.sectionEntities[section.uid] = section;
    });

    return {
      headers: headerUids,
      details: detailUids,
      footers: footerUids
    };
  }

  section (sectionSchema: AnySectionSchema): AnySection {
    return {
      uid: uuid() as SectionUid,
      ...sectionSchema,
      items: this.items(sectionSchema.items)
    };
  }

  items (itemSchemas: AnyItemSchema[]): ItemUid[] {
    const itemUids: ItemUid[] = [];

    itemSchemas.forEach(itemSchema => {
      let item: AnyItem;

      switch (itemSchema.type) {
        case 'stack-view':
          item = this.stackViewItem(itemSchema);
          break;
        case 'table':
          item = this.tableItem(itemSchema);
          break;
        default:
          item = this.item(itemSchema);
      }

      itemUids.push(item.uid);
      this.itemEntities[item.uid] = item;
    });

    return itemUids;
  }

  item (itemSchema: GraphicItemSchema): GraphicItem {
    if (itemSchema.type === 'text') {
      return this.textItem(itemSchema);
    } else {
      return {
        uid: uuid() as ItemUid,
        ...itemSchema
      };
    }
  }

  textItem (schema: TextItemSchema): TextItem {
    return {
      uid: uuid() as ItemUid,
      ...schema,
      contentHeight: computeContentHeight({
        texts: schema.texts,
        fontSize: schema.style.fontSize,
        lineHeight: schema.style.lineHeight
      })
    };
  }

  tableItem (itemSchema: TableItemSchema): TableItem {
    return {
      uid: uuid() as ItemUid,
      ...itemSchema,
      rows: this.tableRows(itemSchema.rows)
    };
  }

  tableRows (rowSchemas: TableRowSchema[]): TableRowUid[] {
    return rowSchemas.map(rowSchema => {
      const row = {
        uid: uuid() as TableRowUid,
        ...rowSchema,
        cells: this.tableCells(rowSchema.cells)
      };

      this.tableRowEntities[row.uid] = row;
      return row.uid;
    });
  }

  tableCells (cellSchemas: TableCellSchema[]): TableCellUid[] {
    return cellSchemas.map(cellSchema => {
      const { content, ...attributes } = cellSchema;
      const cell = {
        uid: uuid() as TableCellUid,
        ...attributes,
        content: content ? this.cellContent(content) : null
      };

      this.tableCellEntities[cell.uid] = cell;
      return cell.uid;
    });
  }

  cellContent (contentSchema: CellContentItemSchema): ItemUid {
    const item = this.item(contentSchema);
    this.itemEntities[item.uid] = item;
    return item.uid;
  }

  stackViewItem (itemSchema: StackViewItemSchema): StackViewItem {
    return {
      uid: uuid() as ItemUid,
      ...itemSchema,
      rows: this.stackViewRows(itemSchema.rows)
    };
  }

  stackViewRows (rowSchemas: StackViewRowSchema[]): StackViewRowUid[] {
    const rowUids: StackViewRowUid[] = [];

    rowSchemas.forEach(rowSchema => {
      const row = {
        uid: uuid() as StackViewRowUid,
        ...rowSchema,
        items: this.items(rowSchema.items)
      };

      rowUids.push(row.uid);
      this.stackViewRowEntities[row.uid] = row;
    });

    return rowUids;
  }
}

export default (schema: unknown) => {
  const layoutSchema = deepChangeToCamelCase(schema) as LayoutSchema;
  const decoder = new SchemaDecoder(layoutSchema);
  return decoder.decode();
};
