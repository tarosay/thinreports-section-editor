# table アイテム（エディタ側）

Section Format の表アイテムを、エディタでどう持ち、どう編集させているか。

**スキーマそのものの仕様は Generator 側のドキュメントが正**なので、まず
[thinreports-generator の docs/table-item.md](https://github.com/thinreports/thinreports-generator/blob/main/docs/table-item.md)
を読むこと。ここではエディタ固有の話だけを書く。

## 状態の持ち方

`stack-view` と同じく正規化して持つ。

```
TableItem   (entities.items)
  ├ columns: TableColumn[]        ← インライン。正規化しない（順序と幅だけの単純な値）
  └ rows: TableRowUid[]
       └ TableRow  (entities.tableRows)
            └ cells: TableCellUid[]
                 └ TableCell  (entities.tableCells)
                      └ content: ItemUid | null   ← entities.items を指す
```

**セルの content は「普通のアイテム」として `entities.items` に入る。** ただし
セクションや stack-view-row の `items` 配列には属さない。所属先が無いアイテムなので、
親を辿る処理（`bringItemLayerTo` など）はこれを見つけられない。**content を
`activeEntity` にしない**設計にしてあるのはそのため。content の編集は、セルを選んだときの
プロパティペインの中で行う。

content の x/y/width/height は**意味を持たない**。描画時にセルとパディングから計算するので、
プロパティペインに出る座標欄は無視してよい（将来は隠したほうがよい）。

## 描画

```
components/items/
├── TableItem.vue       表全体。選択中は Modifier、非選択時は ItemEntity でくるむ
├── TableItemRows.vue   行とセルの矩形を計算し、TableItemCell を並べる
└── TableItemCell.vue   背景・網掛け・罫線・content・選択判定
```

- **セルの矩形計算は `TableItemRows.vue` に集約**している。行の上端を積み上げ、
  列オフセット（`report.getters.columnOffsetsOfTable`）と col-span / row-span から
  1セルずつの矩形を出す
- **網掛けは SVG の `<pattern>`** で描く。Generator 側は Prawn にパターンが無いので
  線分を自前で計算している。**同じ見た目になるよう両方を合わせる必要がある**
- 罫線は4辺それぞれ、セルの指定（`null`=表の既定 / `'none'`=引かない / オブジェクト）を
  解決してから `<line>` で描く
- 行の選択は、表の左端に出る細い帯（row handle）をクリックさせている

**エディタは行の自動伸縮を再現していない。** 行は常に schema の height で描かれる。
実際の PDF では内容に応じて伸びるので、**ここは見た目が食い違う**。

## 編集操作の入口

| 操作 | action |
|---|---|
| 表を作る | `drawNewTableItem` |
| 行を足す / 消す / 動かす | `addTableRow` / `removeActiveTableRow` / `moveActiveTableRow` |
| 列を足す / 消す / 直す | `addColumnToActiveTable` / `removeColumnFromActiveTable` / `updateTableColumn` |
| セルを直す | `updateTableCell` / `updateTableCellStyle` |
| セルの中身を差し替える | `changeTableCellContent` |

**列 ID を変えたら、その列を参照している全セルの `columnId` も直す必要がある。**
`updateTableColumn` がまとめてやっている。ここを忘れると、セルがどの列にも属さなくなり
描画されなくなる。

行やセルを消すときは、**content のアイテムも `entities.items` から消す**こと
（`removeTableCell` がやっている）。残すと `.tlf` には出ないが state に溜まり続ける。

## 未実装 / 粗いところ

改造の入口になりそうな順に並べる。

- **セル結合が数値入力**。範囲をドラッグして結合する UI が無い
- **列幅も数値入力**。境界をドラッグして変えられない
- **行の自動伸縮がキャンバスに反映されない**（上記）
- content のプロパティに意味の無い座標欄が出る
- ツリービュー（左ペイン）に表の行・セルが出ない
- ラベルが英語のまま。`src/locales/` の i18n に載せていない
- セル内に置ける content は1つだけ
