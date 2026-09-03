# thinreports-section-editor

Thinreports の Section Format 用テンプレート（`.tlf`）を作る GUI アプリ。
Electron + Vue 3 + TypeScript。

## このリポジトリだけでは完結しない

```
Editor (このリポジトリ)  ──書き出し──▶  .tlf (JSON)  ──読み込み──▶  Generator  ──▶  PDF
```

- [thinreports-generator](https://github.com/thinreports/thinreports-generator) … PDF を生成する Ruby ライブラリ

**両者にコードの依存は無い。`.tlf` の JSON スキーマだけが契約。**

したがって **スキーマを変えるときは必ず Generator 側も同時に直す。**
エディタだけ直すと Generator が読めないテンプレートができ、Generator だけ直すと
エディタで作れない機能になる。

## 開発環境

```
node -v     # >= 16
npm -v      # >= 8
npm install
```

| コマンド | 何をするか |
|---|---|
| `npm run electron:serve` | 開発モードでアプリを起動（ホットリロードあり） |
| `npm run test:unit` | jest |
| `npm run lint` | eslint（自動修正あり） |
| `npm run test:lint` | eslint（修正しない） |
| `npm run build` | webpack ビルド。**型チェックはここで走る** |
| `npm run electron:build` | 配布パッケージを作る（`dist_electron/`） |

**`npm run lint` が通っても型エラーは残る。** 型は `npm run build` で確認すること。

`npm run electron:build` は OS ごとに、その OS 上でしか作れない。3 OS 分そろえるなら
`.github/workflows/build-dev.yml` を使う。

## アーキテクチャ

```
src/
├── background.ts          Electron のメインプロセス。ファイル I/O は全部ここ (ipcMain)
├── types.ts               ★ 状態の型定義。ここが全体の設計図
├── store/
│   ├── index.ts           reactive な単一 state を各ストアで分割して持つ
│   ├── report/            レポート本体（getters / mutations / actions）
│   ├── editor/ operator/ history/ metadata/ root/
│   └── lib/layout-schema/ ★ .tlf との相互変換
│       ├── encode.ts      state → スキーマ
│       ├── decode.ts      スキーマ → state
│       ├── schema-types.ts
│       └── schema.json    JSON Schema（ajv 用）
└── components/
    ├── SectionCanvas.vue  セクション1つ分のキャンバス（SVG）
    ├── items/             アイテムの描画コンポーネント
    ├── property/          右ペインのプロパティ
    ├── toolbar/           上のツールバー
    └── tree-view/         左ペイン
```

### 覚えておくべき決まりごと

- **状態は正規化されている。** `entities.sections` / `entities.items` / `entities.stackViewRows` /
  `entities.tableRows` / `entities.tableCells` に実体を置き、親は uid の配列だけ持つ
- **内部は camelCase、`.tlf` は kebab-case。** `encode.ts` の最後で `deepChangeToKebabCase`、
  `decode.ts` の最初で `deepChangeToCamelCase` を通す。**スキーマの型を書くときは camelCase で書く**
- **キャンバスは SVG。** 座標は左上原点で、`.tlf` と同じ。Generator 側は Prawn の
  左下原点に変換して描くので、**エディタで見た目が合っていても PDF がずれることがある**
- **選択状態は `activeEntity` 1つだけ。** `{ type: 'section' | 'item' | 'stack-view-row' |
  'table-row' | 'table-cell', uid }`。プロパティペインはこれを見て出し分ける
- **履歴は `@SaveHistory()` デコレータ。** action に付けると state のスナップショットを積む。
  入れ子の action は外側だけが積む（ロックしている）

### アイテムの種類を増やすとき

`stack-view` と `table` が先行実装なので、どちらかを雛形にする。触る場所は最低これだけある。

1. `types.ts` … アイテムの型、`ItemType`、`AnyItem`、必要なら `entities` と `ActiveEntity`
2. `store/report/index.ts` … `createState` に entities を足す
3. `store/report/getters.ts` … 検索・サイズ計算・アクティブ判定、`itemBounds` の分岐、コピー
4. `store/report/mutations.ts` … `addItem` の分岐、追加・削除・更新
5. `store/report/actions.ts` … `drawNew<Type>Item`、編集用 action、`removeItem` と `pasteItem` の分岐
6. `store/lib/layout-schema/` … `schema-types.ts` / `schema.json` / `encode.ts` / `decode.ts`
7. `components/items/` … 描画コンポーネント
8. `components/SectionCanvas.vue` … コンポーネント登録
9. `components/LayerItemDrawer.vue` / `LayerItemDragger.vue` … 作成と移動の分岐
10. `components/toolbar/ToolSelect.vue` と `components/icons/ItemIcon.vue` … ツールボタン
11. `components/property/` … プロパティペインと `ItemProperties.vue` / `PropertyPane.vue` への登録
12. `tests/unit/` … テスト
13. **Generator 側にも同じスキーマを実装する**

実例として `table` の実装がある。[docs/table-item.md](docs/table-item.md) を読むこと。

## 初めてこのリポジトリに触る人へ

git や GitHub に不慣れな利用者向けの導入手順が、Generator 側のリポジトリの
`docs/getting-started-ja.md` にある。環境構築から表の使い方、改造の始め方までを
**Claude Code に貼り付ける文章**の形で書いてある。利用者が詰まっていたら、まずこれを案内すること。

## テストの書き方

`tests/unit/store/table-item.spec.ts` が参考になる。ストアは import するだけで使えるが、
**state はテスト間で共有される**ので、`beforeEach` で空のスキーマを `root.actions.loadSchema`
して初期化すること。しないと前のテストの結果が積み上がる。

エンコード結果は `schema.json` に対して ajv で検証できる。**スキーマを変えたら
`schema.json` も直したか、この検証で確かめられる。**

## コーディング上の慣習

- eslint の `import/order` が厳しい。import の並び順で落ちる
- Vue SFC は Composition API（`defineComponent` + `setup`）
- プロパティ入力は `components/property/properties/base/` の
  `TextProperty` / `SelectProperty` / `CheckProperty` を組み合わせて作る
