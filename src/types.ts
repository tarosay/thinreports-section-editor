type Uid<B> = string & B;

export type ToolType = 'select' | ItemType;
export type CanvasType = 'section' | 'stack-view-row';

enum SectionUidBrand { _ = 'SectionId' }
enum StackViewRowUidBrand { _ = 'StackViewRowIdBrand' }
enum ItemUidBrand { _ = 'ItemId' }
enum TableRowUidBrand { _ = 'TableRowIdBrand' }
enum TableCellUidBrand { _ = 'TableCellIdBrand' }

export type SectionUid = Uid<SectionUidBrand>;
export type StackViewRowUid = Uid<StackViewRowUidBrand>;
export type ItemUid = Uid<ItemUidBrand>;
export type TableRowUid = Uid<TableRowUidBrand>;
export type TableCellUid = Uid<TableCellUidBrand>;

export type AnyUid = SectionUid | StackViewRowUid | ItemUid | TableRowUid | TableCellUid;
export type CanvasUid = SectionUid | StackViewRowUid;

export type Section = {
  uid: SectionUid;
  id: string;
  type: SectionType;
  height: number;
  items: ItemUid[];
}

export type SectionType = 'header' | 'detail' | 'footer';

export type HeaderSection = Section & {
  type: 'header';
  display: boolean;
  autoStretch: boolean;
  everyPage: boolean;
}

export type DetailSection = Section & {
  type: 'detail';
  autoStretch: boolean;
}

export type FooterSection = Section & {
  type: 'footer';
  display: boolean;
  autoStretch: boolean;
}

export type AnySection = HeaderSection | DetailSection | FooterSection;

export type Item = CommonItemAttrs & {
  uid: ItemUid;
  type: ItemType;
};
export type CommonItemAttrs = {
  id: string;
  description: string;
  display: boolean;
  followStretch: 'none' | 'y' | 'height';
  affectBottomMargin: boolean;
}

export type ItemType = 'rect' | 'ellipse' | 'line' | 'text' | 'text-block' | 'image-block' | 'image' | 'stack-view' | 'table';
export type TypeDetectedItem<T extends ItemType | undefined> =
  T extends 'rect' ? RectItem :
  T extends 'ellipse' ? EllipseItem :
  T extends 'line' ? LineItem :
  T extends 'text' ? TextItem :
  T extends 'text-block' ? TextBlockItem :
  T extends 'image' ? ImageBlockItem :
  T extends 'image-block' ? ImageItem :
  T extends 'stack-view' ? StackViewItem :
  T extends 'table' ? TableItem :
  AnyItem;

export type GraphicItem = RectItem | EllipseItem | LineItem | TextItem | TextBlockItem | ImageBlockItem | ImageItem;
export type AnyItem = GraphicItem | StackViewItem | TableItem;

// Items which can be placed into a table cell.
export type CellContentItem = TextItem | TextBlockItem | ImageBlockItem | ImageItem;
export type CellContentItemType = CellContentItem['type'];

type OmitUid<T> = T extends { uid: string } ? Omit<T, 'uid'> : never;

export type CopiedGraphicItem = OmitUid<GraphicItem>;

export type CopiedStackViewRow = Omit<StackViewRow, 'uid' | 'items'> & {
  items: CopiedGraphicItem[];
}
export type CopiedStackViewItem = Omit<StackViewItem, 'uid' | 'rows'> & {
  rows: CopiedStackViewRow[];
}
export type CopiedTableCell = Omit<TableCell, 'uid' | 'content'> & {
  content: CopiedGraphicItem | null;
};

export type CopiedTableRow = Omit<TableRow, 'uid' | 'cells'> & {
  cells: CopiedTableCell[];
};

export type CopiedTableItem = Omit<TableItem, 'uid' | 'rows'> & {
  rows: CopiedTableRow[];
};

export type CopiedAnyItem = CopiedGraphicItem | CopiedStackViewItem | CopiedTableItem;

export type BoundsItem = Item & Bounds;

export type RectItem = BoundsItem & {
  type: 'rect';
  borderRadius: number;
  style: ItemBorderStyle & {
    fillColor: string;
  };
};

export type EllipseItemBounds = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
};
export type EllipseItemBase = Item & {
  type: 'ellipse';
  style: ItemBorderStyle & {
    fillColor: string;
  };
};
export type EllipseItem = EllipseItemBase & EllipseItemBounds;

export type LineItem = Item & {
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  style: ItemBorderStyle;
}

export type TextItem = BoundsItem & {
  type: 'text';
  texts: string[];
  style: TextItemStyle;
  contentHeight: number;
};
export type TextItemStyle = ItemTextStyle;

export type TextOverflowStyle = 'truncate' | 'fit' | 'expand';
export type TextWordWrapStyle = 'break-word' | 'none';

export type TextBlockItem = BoundsItem & {
  type: 'text-block';
  referenceId: '';
  value: string;
  multipleLine: boolean;
  format: {
    base: string;
  } & (TextBlockFormatNone | TextBlockFormatDatetime | TextBlockFormatNumber | TextBlockFormatPadding);
  style: ItemTextStyle & {
    overflow: TextOverflowStyle;
    wordWrap: TextWordWrapStyle;
  };
};

type TextBlockFormatNone = {
  type: '';
};

type TextBlockFormatDatetime = {
  type: 'datetime';
  datetime: {
    format: string;
  };
}

type TextBlockFormatNumber = {
  type: 'number';
  number: {
    delimiter: string;
    precision: number;
  };
};

type TextBlockFormatPadding = {
  type: 'padding';
  padding: {
    length: number;
    char: string;
    direction: 'L' | 'R';
  };
};

export type HorizontalAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'middle' | 'bottom';

export type ImageBlockItem = BoundsItem & {
  type: 'image-block';
  style: {
    positionX: HorizontalAlign;
    positionY: VerticalAlign;
  };
};

export type ImageItem = BoundsItem & {
  type: 'image';
  data: ImageData;
};

export type StackViewItemBounds = {
  x: number;
  y: number;
  width: number;
};
export type StackViewItem = Item & StackViewItemBounds & {
  type: 'stack-view';
  rows: StackViewRowUid[];
  followStretch: Omit<Item['followStretch'], 'height'>;
};

export type StackViewRow = {
  uid: StackViewRowUid;
  id: string;
  height: number;
  autoStretch: boolean;
  display: boolean;
  items: ItemUid[];
};

export type TableItemBounds = {
  x: number;
  y: number;
};
export type TableItem = Item & TableItemBounds & {
  type: 'table';
  columns: TableColumn[];
  rows: TableRowUid[];
  style: ItemBorderStyle;
};

export type TableColumn = {
  id: string;
  width: number;
};

export type TableRowType = 'header' | 'body' | 'footer';

export type TableRow = {
  uid: TableRowUid;
  id: string;
  type: TableRowType;
  height: number;
  autoStretch: boolean;
  display: boolean;
  cells: TableCellUid[];
};

export type TableCellPattern =
  'none' | 'horizontal' | 'vertical' | 'grid' |
  'forward-diagonal' | 'backward-diagonal' | 'cross-diagonal';

// null means that the cell inherits the default border of the table,
// 'none' means that no border is drawn.
export type TableCellBorder = null | 'none' | {
  width?: number;
  color?: string;
  style?: ItemBorderStyle['borderStyle'];
};

export type TableCellStyle = {
  backgroundColor: string;
  backgroundPattern: TableCellPattern;
  backgroundPatternColor: string;
  backgroundPatternSpacing: number;
  backgroundPatternWidth: number;
  padding: [number, number, number, number];
  borderTop: TableCellBorder;
  borderRight: TableCellBorder;
  borderBottom: TableCellBorder;
  borderLeft: TableCellBorder;
};

export type TableCell = {
  uid: TableCellUid;
  columnId: string;
  colSpan: number;
  rowSpan: number;
  display: boolean;
  style: TableCellStyle;
  content: ItemUid | null;
};

export type BuiltinFontFamily = 'Helvetica' | 'Courier New' | 'Times New Roman' | 'IPAMincho' | 'IPAPMincho' | 'IPAGothic' | 'IPAPGothic';

export type FontAndLineSize = {
  fontSize: number;
  lineHeight: number;
  lineHeightRatio: number | '';
};

export type ItemTextStyle = FontAndLineSize & {
  fontFamily: [BuiltinFontFamily];
  color: string;
  fontStyle: Array<'bold' | 'italic' | 'underline' | 'linethrough'>;
  textAlign: HorizontalAlign;
  verticalAlign: VerticalAlign;
  letterSpacing: number | '';
};

export type ItemBorderStyle = {
  borderWidth: number;
  borderColor: string;
  borderStyle: 'solid' | 'dashed' | 'dotted';
};

export type ImageData = {
  mimeType: 'image/png' | 'image/jpeg';
  base64: string;
};

export type Coords = {
  x: number;
  y: number;
};

export type BoundingPoints = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type BoundingBox = Coords & Size;

export type Size = {
  width: number;
  height: number;
};

// Deprecated. Use BoundingBox instead.
export type Bounds = BoundingBox;

export type ActiveSecitionEntity = {
  type: 'section';
  uid: SectionUid;
};

export type ActiveStackViewRowEntity = {
  type: 'stack-view-row';
  uid: StackViewRowUid;
};

export type ActiveItemEntity = {
  type: 'item';
  uid: ItemUid;
};

export type ActiveTableRowEntity = {
  type: 'table-row';
  uid: TableRowUid;
};

export type ActiveTableCellEntity = {
  type: 'table-cell';
  uid: TableCellUid;
};

export type ActiveEntity =
  ActiveSecitionEntity | ActiveStackViewRowEntity | ActiveItemEntity |
  ActiveTableRowEntity | ActiveTableCellEntity;

export type RootState = {
  report: Report;
  history: History;
  operator: Operator;
  editor: Editor;
  metadata: Metadata;
}

export type Report = {
  type: 'section';
  title: string;
  paperType: 'A3' | 'A4' | 'A5' | 'B4' | 'B5' | 'B4_ISO' | 'B5_ISO' | 'user';
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  margin: [number, number, number, number];

  entities: {
    sections: {
      [key in SectionUid]?: AnySection
    };
    items: {
      [key in ItemUid]?: AnyItem
    };
    stackViewRows: {
      [key in StackViewRowUid]?: StackViewRow;
    };
    tableRows: {
      [key in TableRowUid]?: TableRow;
    };
    tableCells: {
      [key in TableCellUid]?: TableCell;
    };
  };

  sections: {
    headers: SectionUid[];
    details: SectionUid[];
    footers: SectionUid[];
  };

  activeEntity: ActiveEntity | null;

  layoutGuides: Array<{
    type: 'x' | 'y';
    position: number;
  }>;
};

export type History = {
  histories: string[];
  pointer: number | null;
}

export type Operator = {
  itemDrawer: ItemDrawer;
  itemDragger: ItemDragger;
};

export type ItemDrawer = {
  active: boolean;
  itemType: ItemType | null;
  targetType: CanvasType | null;
  targetUid: CanvasUid | null;
  translation: Translation | null;
};

export type ItemDragger = {
  active: boolean;
  itemUid: ItemUid | null;
  translation: Translation | null;
};

export type Translation = {
  x: number;
  y: number;
}

export type Editor = {
  activeTool: ToolType;
  clipboard: CopiedAnyItem | null;
  zoomRate: number;
};

export type Metadata = {
  filename: string | null;
  lastSavedHistoryPointer: History['pointer'];
}
