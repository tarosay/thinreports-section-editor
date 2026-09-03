import { v4 as uuid } from 'uuid';
import { computeTextFontAndLineSize } from '../../lib/text-font-and-line-size';
import {
  CellContentItem,
  CellContentItemType,
  ItemUid,
  TableCell,
  TableCellStyle,
  TableCellUid,
  TableColumn,
  TableRow,
  TableRowType,
  TableRowUid,
  TextBlockItem,
  TextItem
} from '@/types';

export const DEFAULT_COLUMN_WIDTH = 100;
export const DEFAULT_ROW_HEIGHT = 24;

export const defaultCellStyle = (): TableCellStyle => ({
  backgroundColor: 'none',
  backgroundPattern: 'none',
  backgroundPatternColor: '#999999',
  backgroundPatternSpacing: 4,
  backgroundPatternWidth: 0.5,
  padding: [1, 4, 1, 4],
  borderTop: null,
  borderRight: null,
  borderBottom: null,
  borderLeft: null
});

const textStyle = (fontSize = 10) => ({
  fontFamily: ['Helvetica'] as TextItem['style']['fontFamily'],
  color: '#000000',
  fontStyle: [] as TextItem['style']['fontStyle'],
  textAlign: 'left' as const,
  verticalAlign: 'middle' as const,
  letterSpacing: '' as const,
  ...computeTextFontAndLineSize({ fontSize, lineHeightRatio: '' })
});

// The bounds of a cell content are computed from the cell itself when it is
// rendered, so the values below are only placeholders.
const contentBounds = { x: 0, y: 0, width: 0, height: 0 };

export const buildTextItem = (texts: string[] = ['']): TextItem => ({
  uid: uuid() as ItemUid,
  type: 'text',
  id: '',
  ...contentBounds,
  description: '',
  display: true,
  followStretch: 'none',
  affectBottomMargin: true,
  texts,
  style: textStyle(),
  contentHeight: 0
});

export const buildTextBlockItem = (id = ''): TextBlockItem => ({
  uid: uuid() as ItemUid,
  type: 'text-block',
  id,
  ...contentBounds,
  description: '',
  referenceId: '',
  value: '',
  multipleLine: true,
  display: true,
  format: { base: '', type: '' },
  followStretch: 'none',
  affectBottomMargin: true,
  style: {
    ...textStyle(),
    verticalAlign: 'top',
    overflow: 'truncate',
    wordWrap: 'break-word'
  }
});

export const buildCellContent = (type: CellContentItemType, id = ''): CellContentItem => {
  switch (type) {
    case 'text': return buildTextItem(['']);
    case 'text-block': return buildTextBlockItem(id);
    case 'image-block':
      return {
        uid: uuid() as ItemUid,
        type: 'image-block',
        id: id || 'image',
        ...contentBounds,
        description: '',
        display: true,
        followStretch: 'none',
        affectBottomMargin: true,
        style: { positionX: 'left', positionY: 'top' }
      };
    default:
      throw new Error(`Unsupported cell content type: ${type}`);
  }
};

export const buildCell = ({ columnId, content }: { columnId: string; content: ItemUid | null }): TableCell => ({
  uid: uuid() as TableCellUid,
  columnId,
  colSpan: 1,
  rowSpan: 1,
  display: true,
  style: defaultCellStyle(),
  content
});

export const buildRow = ({ id, type, height }: { id: string; type: TableRowType; height?: number }): TableRow => ({
  uid: uuid() as TableRowUid,
  id,
  type,
  height: height ?? DEFAULT_ROW_HEIGHT,
  autoStretch: type === 'body',
  display: true,
  cells: []
});

export const buildColumn = (index: number, width = DEFAULT_COLUMN_WIDTH): TableColumn => ({
  id: `column${index}`,
  width
});
