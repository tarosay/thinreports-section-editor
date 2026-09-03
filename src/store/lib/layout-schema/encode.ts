import _cloneDeep from 'lodash.clonedeep';
import { DeepReadonly } from 'utility-types';
import { AnyItemSchema, AnySectionSchema, CellContentItemSchema, GraphicItemSchema, LayoutSchema, StackViewItemSchema, StackViewRowSchema, TableCellSchema, TableItemSchema, TableRowSchema, TextItemSchema } from './schema-types';
import { deepChangeToKebabCase } from '@/lib/deep-change-case';
import { Report, SectionUid, ItemUid, StackViewItem, StackViewRowUid, GraphicItem, AnyUid, TextItem, TableItem, TableRowUid, TableCellUid } from '@/types';
import { SCHEMA_VERSION, EDITOR_VERSION } from '@/versions';

class EntityNotFoundError extends Error {
  constructor (type: string, uid: AnyUid) {
    super(`${type}(${uid}) is not found.`);
    this.name = 'EntityNotFoundError';
  }
}

class SchemaEncoder {
  private state: DeepReadonly<Report>;

  constructor (state: DeepReadonly<Report>) {
    this.state = state;
  }

  encode (): DeepReadonly<LayoutSchema> {
    return {
      schemaVersion: SCHEMA_VERSION,
      lastModifiedBy: EDITOR_VERSION,
      title: this.state.title,
      report: {
        orientation: this.state.orientation,
        paperType: this.state.paperType,
        width: this.state.width,
        height: this.state.height,
        margin: this.state.margin
      },
      sections: [
        ...this.sections(this.state.sections.headers),
        ...this.sections(this.state.sections.details),
        ...this.sections(this.state.sections.footers)
      ],
      state: {
        layoutGuides: this.state.layoutGuides
      }
    };
  }

  sections (sectionUids: DeepReadonly<SectionUid[]>): DeepReadonly<AnySectionSchema[]> {
    return sectionUids.map(uid => this.section(uid));
  }

  section (sectionUid: DeepReadonly<SectionUid>): DeepReadonly<AnySectionSchema> {
    const section = this.state.entities.sections[sectionUid];
    if (!section) throw new EntityNotFoundError('section', sectionUid);

    const { uid, items, ...attributes } = section;
    return {
      ...attributes,
      items: this.items(items)
    };
  }

  items (itemUids: DeepReadonly<ItemUid[]>): DeepReadonly<AnyItemSchema[]> {
    return itemUids.map(itemUid => {
      const item = this.state.entities.items[itemUid];
      if (!item) throw new EntityNotFoundError('item', itemUid);

      if (item.type === 'stack-view') {
        return this.stackViewItem(item);
      } else if (item.type === 'table') {
        return this.tableItem(item);
      } else {
        return this.item(item);
      }
    });
  }

  graphicItems (itemUids: DeepReadonly<ItemUid[]>): DeepReadonly<GraphicItemSchema[]> {
    return itemUids.map(itemUid => {
      const item = this.state.entities.items[itemUid];
      if (!item || item.type === 'stack-view' || item.type === 'table') throw new EntityNotFoundError('item', itemUid);

      return this.item(item);
    });
  }

  item (item: DeepReadonly<GraphicItem>): DeepReadonly<GraphicItemSchema> {
    if (item.type === 'text') {
      return this.textItem(item);
    } else {
      const { uid, ...attributes } = item;
      return attributes;
    }
  }

  textItem (item: DeepReadonly<TextItem>): DeepReadonly<TextItemSchema> {
    const { uid, contentHeight, ...schemaAttributes } = item;
    return schemaAttributes;
  }

  tableItem (table: DeepReadonly<TableItem>): DeepReadonly<TableItemSchema> {
    const { uid, rows, ...attributes } = table;
    return {
      ...attributes,
      rows: this.tableRows(rows)
    };
  }

  tableRows (rowUids: DeepReadonly<TableRowUid[]>): DeepReadonly<TableRowSchema[]> {
    return rowUids.map(rowUid => {
      const row = this.state.entities.tableRows[rowUid];
      if (!row) throw new EntityNotFoundError('table-row', rowUid);

      const { uid, cells, ...attributes } = row;
      return {
        ...attributes,
        cells: this.tableCells(cells)
      };
    });
  }

  tableCells (cellUids: DeepReadonly<TableCellUid[]>): DeepReadonly<TableCellSchema[]> {
    return cellUids.map((cellUid): DeepReadonly<TableCellSchema> => {
      const cell = this.state.entities.tableCells[cellUid];
      if (!cell) throw new EntityNotFoundError('table-cell', cellUid);

      const { uid, content, ...attributes } = cell;
      if (content === null) return attributes;

      const contentItem = this.state.entities.items[content];
      if (!contentItem || contentItem.type === 'stack-view' || contentItem.type === 'table') {
        throw new EntityNotFoundError('table-cell-content', content);
      }

      return {
        ...attributes,
        content: this.item(contentItem) as DeepReadonly<CellContentItemSchema>
      };
    });
  }

  stackViewItem (stackView: DeepReadonly<StackViewItem>): DeepReadonly<StackViewItemSchema> {
    const { uid, rows, ...attributes } = stackView;
    return {
      ...attributes,
      rows: this.stackViewItemRows(rows)
    };
  }

  stackViewItemRows (rowUids: DeepReadonly<StackViewRowUid[]>): DeepReadonly<StackViewRowSchema[]> {
    return rowUids.map(rowUid => {
      const row = this.state.entities.stackViewRows[rowUid];
      if (!row) throw new EntityNotFoundError('stack-view-row', rowUid);

      const { uid, items, ...attributes } = row;
      return {
        ...attributes,
        items: this.graphicItems(items)
      };
    });
  }
}

export default (state: Report) => {
  const encoder = new SchemaEncoder(_cloneDeep(state));
  return deepChangeToKebabCase(encoder.encode());
};
