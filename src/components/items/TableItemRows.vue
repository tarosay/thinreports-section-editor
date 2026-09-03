<template>
  <g>
    <TableItemCell
      v-for="{ cell, bounds } in cellsWithBounds"
      :key="cell.uid"
      :cell="cell"
      :table="table"
      :bounds="bounds"
    />

    <g v-if="tableActive">
      <rect
        v-for="{ row, bounds } in rowsWithBounds"
        :key="`handle-${row.uid}`"
        :x="bounds.x - handleWidth"
        :y="bounds.y"
        :width="handleWidth"
        :height="bounds.height"
        :class="['th-table-row-handle', { active: isActiveRow(row.uid) }]"
        @pointerdown.stop="activateRow(row.uid)"
      />
    </g>
  </g>
</template>

<script lang="ts">
import { computed, defineComponent, toRefs } from 'vue';
import { inverseScale } from '../../lib/inverse-scale';
import { calcPlus } from '../../lib/strict-calculator';
import { editor, report } from '../../store';
import TableItemCell from './TableItemCell.vue';
import { BoundingBox, TableCell, TableItem, TableRow, TableRowUid } from '@/types';

type RowWithBounds = {
  row: TableRow;
  bounds: BoundingBox;
};

type CellWithBounds = {
  cell: TableCell;
  bounds: BoundingBox;
};

export default defineComponent({
  components: {
    TableItemCell
  },
  props: {
    table: {
      type: Object as () => TableItem,
      required: true
    },
    itemBounds: {
      type: Object as () => BoundingBox,
      required: true
    },
    tableActive: {
      type: Boolean,
      required: true
    }
  },
  setup (props) {
    const { table, itemBounds } = toRefs(props);

    const handleWidth = computed((): number => inverseScale(6, editor.getters.zoomRate()));

    const columnOffsets = computed(() => report.getters.columnOffsetsOfTable(table.value.uid));

    const rowsWithBounds = computed((): RowWithBounds[] => {
      const results: RowWithBounds[] = [];
      let top = itemBounds.value.y;

      table.value.rows.forEach(rowUid => {
        const row = report.getters.findTableRow(rowUid);

        results.push({
          row,
          bounds: {
            x: itemBounds.value.x,
            y: top,
            width: itemBounds.value.width,
            height: row.height
          }
        });
        top = calcPlus(top, row.height);
      });

      return results;
    });

    const columnIndexOf = (columnId: string): number => {
      return table.value.columns.findIndex(column => column.id === columnId);
    };

    const spanWidth = (columnId: string, colSpan: number): number => {
      const index = columnIndexOf(columnId);
      if (index === -1) return 0;

      return table.value.columns
        .slice(index, index + Math.max(colSpan, 1))
        .reduce((width, column) => calcPlus(width, column.width), 0);
    };

    const spanHeight = (rowIndex: number, rowSpan: number): number => {
      return rowsWithBounds.value
        .slice(rowIndex, rowIndex + Math.max(rowSpan, 1))
        .reduce((height, { bounds }) => calcPlus(height, bounds.height), 0);
    };

    const cellsWithBounds = computed((): CellWithBounds[] => {
      const results: CellWithBounds[] = [];

      rowsWithBounds.value.forEach(({ row, bounds }, rowIndex) => {
        row.cells.forEach(cellUid => {
          const cell = report.getters.findTableCell(cellUid);
          if (!cell.display) return;

          const offset = columnOffsets.value[cell.columnId];
          if (offset === undefined) return;

          results.push({
            cell,
            bounds: {
              x: calcPlus(bounds.x, offset),
              y: bounds.y,
              width: spanWidth(cell.columnId, cell.colSpan),
              height: spanHeight(rowIndex, cell.rowSpan)
            }
          });
        });
      });

      return results;
    });

    const isActiveRow = (uid: TableRowUid): boolean => report.getters.isActiveTableRow(uid);

    const activateRow = (uid: TableRowUid) => {
      report.actions.activateEntity({ uid, type: 'table-row' });
    };

    return {
      handleWidth,
      rowsWithBounds,
      cellsWithBounds,
      isActiveRow,
      activateRow
    };
  }
});
</script>

<style scoped>
.th-table-row-handle {
  fill: #cccccc;
  stroke: none;
  cursor: pointer;
}

.th-table-row-handle.active {
  fill: var(--th-active-color);
}
</style>
