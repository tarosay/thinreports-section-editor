<template>
  <g>
    <defs v-if="patternId">
      <pattern
        :id="patternId"
        :width="cell.style.backgroundPatternSpacing"
        :height="cell.style.backgroundPatternSpacing"
        patternUnits="userSpaceOnUse"
      >
        <path
          :d="patternPath"
          :stroke="cell.style.backgroundPatternColor"
          :stroke-width="cell.style.backgroundPatternWidth"
          fill="none"
        />
      </pattern>
    </defs>

    <rect
      v-if="backgroundColor"
      :x="bounds.x"
      :y="bounds.y"
      :width="bounds.width"
      :height="bounds.height"
      :fill="backgroundColor"
      stroke="none"
    />
    <rect
      v-if="patternId"
      :x="bounds.x"
      :y="bounds.y"
      :width="bounds.width"
      :height="bounds.height"
      :fill="`url(#${patternId})`"
      stroke="none"
    />

    <line
      v-for="border in borders"
      :key="border.side"
      :x1="border.x1"
      :y1="border.y1"
      :x2="border.x2"
      :y2="border.y2"
      :stroke="border.color"
      :stroke-width="border.width"
      :stroke-dasharray="border.dashArray"
    />

    <g v-if="content">
      <g v-if="content.type === 'text'">
        <text
          v-for="(text, index) in content.texts"
          :key="index"
          :x="textX"
          :y="textY(index)"
          :style="textStyle"
          dominant-baseline="text-before-edge"
          class="th-table-cell-text"
        >
          {{ text || ' ' }}
        </text>
      </g>
      <g v-else>
        <rect
          :x="contentBounds.x"
          :y="contentBounds.y"
          :width="contentBounds.width"
          :height="contentBounds.height"
          class="th-table-cell-block"
        />
        <ItemIdLabel
          :label="content.id"
          :x="contentBounds.x"
          :y="contentBounds.y"
        />
      </g>
    </g>

    <rect
      :x="bounds.x"
      :y="bounds.y"
      :width="bounds.width"
      :height="bounds.height"
      class="th-table-cell-selector"
      @pointerdown.stop="activate"
    />
    <rect
      v-if="isActive"
      :x="bounds.x"
      :y="bounds.y"
      :width="bounds.width"
      :height="bounds.height"
      class="th-table-cell-highlighter"
      :stroke-width="highlightWidth"
    />
  </g>
</template>

<script lang="ts">
import { computed, defineComponent, toRefs } from 'vue';
import { inverseScale } from '../../lib/inverse-scale';
import { calcDiv, calcPlus, calcMinus, calcMul } from '../../lib/strict-calculator';
import { editor, report } from '../../store';
import ItemIdLabel from './ItemIdLabel.vue';
import { BoundingBox, ItemBorderStyle, TableCell, TableCellBorder, TableItem } from '@/types';

type ResolvedBorder = {
  side: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width: number;
  dashArray: string | undefined;
};

const DASH_ARRAY = {
  solid: undefined,
  dashed: '2,2',
  dotted: '1,2'
} as const;

export default defineComponent({
  components: {
    ItemIdLabel
  },
  props: {
    cell: {
      type: Object as () => TableCell,
      required: true
    },
    table: {
      type: Object as () => TableItem,
      required: true
    },
    bounds: {
      type: Object as () => BoundingBox,
      required: true
    }
  },
  setup (props) {
    const { cell, table, bounds } = toRefs(props);

    const isActive = computed((): boolean => report.getters.isActiveTableCell(cell.value.uid));

    const highlightWidth = computed((): number => inverseScale(2, editor.getters.zoomRate()));

    const backgroundColor = computed((): string | null => {
      const color = cell.value.style.backgroundColor;
      return !color || color === 'none' ? null : color;
    });

    const patternId = computed((): string | null => {
      const pattern = cell.value.style.backgroundPattern;
      return !pattern || pattern === 'none' ? null : `th-pattern-${cell.value.uid}`;
    });

    const patternPath = computed((): string => {
      const size = cell.value.style.backgroundPatternSpacing;

      switch (cell.value.style.backgroundPattern) {
        case 'horizontal': return `M 0,0 L ${size},0`;
        case 'vertical': return `M 0,0 L 0,${size}`;
        case 'grid': return `M 0,0 L ${size},0 M 0,0 L 0,${size}`;
        case 'forward-diagonal': return `M 0,${size} L ${size},0`;
        case 'backward-diagonal': return `M 0,0 L ${size},${size}`;
        case 'cross-diagonal': return `M 0,${size} L ${size},0 M 0,0 L ${size},${size}`;
        default: return '';
      }
    });

    const resolveBorder = (value: TableCellBorder): ItemBorderStyle | null => {
      if (value === 'none') return null;

      if (value && typeof value === 'object') {
        return {
          borderWidth: value.width ?? table.value.style.borderWidth,
          borderColor: value.color ?? table.value.style.borderColor,
          borderStyle: value.style ?? table.value.style.borderStyle
        };
      }

      return table.value.style;
    };

    const borders = computed((): ResolvedBorder[] => {
      const { x, y, width, height } = bounds.value;

      const sides = [
        { side: 'top', value: cell.value.style.borderTop, points: [x, y, x + width, y] },
        { side: 'right', value: cell.value.style.borderRight, points: [x + width, y, x + width, y + height] },
        { side: 'bottom', value: cell.value.style.borderBottom, points: [x, y + height, x + width, y + height] },
        { side: 'left', value: cell.value.style.borderLeft, points: [x, y, x, y + height] }
      ];

      return sides.reduce((results: ResolvedBorder[], { side, value, points }) => {
        const border = resolveBorder(value);
        if (!border || border.borderWidth <= 0 || border.borderColor === 'none') return results;

        results.push({
          side,
          x1: points[0],
          y1: points[1],
          x2: points[2],
          y2: points[3],
          color: border.borderColor,
          width: border.borderWidth,
          dashArray: DASH_ARRAY[border.borderStyle]
        });
        return results;
      }, []);
    });

    const content = computed(() => {
      return cell.value.content ? report.getters.findItem(cell.value.content) : null;
    });

    const contentBounds = computed((): BoundingBox => {
      const [top, right, bottom, left] = cell.value.style.padding;

      return {
        x: calcPlus(bounds.value.x, left),
        y: calcPlus(bounds.value.y, top),
        width: Math.max(calcMinus(bounds.value.width, calcPlus(left, right)), 0),
        height: Math.max(calcMinus(bounds.value.height, calcPlus(top, bottom)), 0)
      };
    });

    const textStyle = computed(() => {
      const item = content.value;
      if (!item || item.type !== 'text') return {};

      const style = item.style;
      const anchor = style.textAlign === 'center' ? 'middle' : (style.textAlign === 'right' ? 'end' : 'start');

      return {
        fontSize: `${style.fontSize}px`,
        fontFamily: style.fontFamily.join(','),
        fill: style.color,
        fontWeight: style.fontStyle.includes('bold') ? 'bold' : 'normal',
        fontStyle: style.fontStyle.includes('italic') ? 'italic' : 'normal',
        textAnchor: anchor
      };
    });

    const textX = computed((): number => {
      const item = content.value;
      if (!item || item.type !== 'text') return contentBounds.value.x;

      switch (item.style.textAlign) {
        case 'center': return calcPlus(contentBounds.value.x, calcDiv(contentBounds.value.width, 2));
        case 'right': return calcPlus(contentBounds.value.x, contentBounds.value.width);
        default: return contentBounds.value.x;
      }
    });

    const textY = (index: number): number => {
      const item = content.value;
      if (!item || item.type !== 'text') return contentBounds.value.y;

      const lineHeight = item.style.lineHeight;
      const contentHeight = calcMul(lineHeight, item.texts.length);

      let top = contentBounds.value.y;
      if (item.style.verticalAlign === 'middle') {
        top = calcPlus(top, calcDiv(calcMinus(contentBounds.value.height, contentHeight), 2));
      } else if (item.style.verticalAlign === 'bottom') {
        top = calcMinus(calcPlus(top, contentBounds.value.height), contentHeight);
      }

      return calcPlus(top, calcMul(lineHeight, index));
    };

    const activate = () => {
      report.actions.activateEntity({ uid: cell.value.uid, type: 'table-cell' });
    };

    return {
      isActive,
      highlightWidth,
      backgroundColor,
      patternId,
      patternPath,
      borders,
      content,
      contentBounds,
      textStyle,
      textX,
      textY,
      activate
    };
  }
});
</script>

<style scoped>
.th-table-cell-selector {
  fill: #ffffff;
  fill-opacity: 0;
  stroke: none;
  cursor: pointer;
}

.th-table-cell-highlighter {
  fill: none;
  stroke: var(--th-active-color);
  pointer-events: none;
}

.th-table-cell-block {
  stroke: none;
  fill: var(--th-active-color);
  fill-opacity: 0.2;
  pointer-events: none;
}

.th-table-cell-text {
  text-rendering: 'geometricPrecision';
  white-space: 'pre';
  pointer-events: none;
}
</style>
