<template>
  <div>
    <PropertyCaption caption="TableCell" />
    <TextProperty
      label="column"
      :value="cell.columnId"
      @change="update('columnId', $event)"
    />
    <TextProperty
      label="col-span"
      :value="cell.colSpan"
      @change="update('colSpan', toSpan($event))"
    />
    <TextProperty
      label="row-span"
      :value="cell.rowSpan"
      @change="update('rowSpan', toSpan($event))"
    />
    <DisplayProperty
      :value="cell.display"
      @change="update('display', $event)"
    />

    <PropertyCaption caption="Background" />
    <TextProperty
      label="color"
      :value="cell.style.backgroundColor"
      placeholder="none"
      @change="updateStyle('backgroundColor', $event)"
    />
    <SelectProperty
      label="pattern"
      :value="cell.style.backgroundPattern"
      :options="patternOptions"
      @change="updateStyle('backgroundPattern', $event)"
    />
    <template v-if="cell.style.backgroundPattern !== 'none'">
      <TextProperty
        label="- color"
        :value="cell.style.backgroundPatternColor"
        @change="updateStyle('backgroundPatternColor', $event)"
      />
      <TextProperty
        label="- spacing"
        :value="cell.style.backgroundPatternSpacing"
        @change="updateStyle('backgroundPatternSpacing', Number($event))"
      />
      <TextProperty
        label="- width"
        :value="cell.style.backgroundPatternWidth"
        @change="updateStyle('backgroundPatternWidth', Number($event))"
      />
    </template>

    <PropertyCaption caption="Padding" />
    <TextProperty
      v-for="(side, index) in paddingSides"
      :key="side"
      :label="side"
      :value="cell.style.padding[index]"
      @change="updatePadding(index, Number($event))"
    />

    <PropertyCaption caption="Border" />
    <TableCellBorderProperty
      v-for="side in borderSides"
      :key="side.key"
      :label="side.label"
      :value="cell.style[side.key]"
      :defaults="tableBorderStyle"
      @change="updateStyle(side.key, $event)"
    />

    <PropertyCaption caption="Content" />
    <SelectProperty
      label="type"
      :value="contentType"
      :options="contentTypeOptions"
      @change="changeContent"
    />
    <TextItemProperties
      v-if="content && content.type === 'text'"
      :item="content"
    />
    <TextBlockItemProperties
      v-if="content && content.type === 'text-block'"
      :item="content"
    />
    <ImageBlockItemProperties
      v-if="content && content.type === 'image-block'"
      :item="content"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, toRefs } from 'vue';
import ImageBlockItemProperties from './ImageBlockItemProperties.vue';
import PropertyCaption from './PropertyCaption.vue';
import TextBlockItemProperties from './TextBlockItemProperties.vue';
import TextItemProperties from './TextItemProperties.vue';
import DisplayProperty from './properties/DisplayProperty.vue';
import TableCellBorderProperty from './properties/TableCellBorderProperty.vue';
import SelectProperty from './properties/base/SelectProperty.vue';
import TextProperty from './properties/base/TextProperty.vue';
import { report } from '@/store';
import { CellContentItemType, ItemBorderStyle, TableCell } from '@/types';

const DEFAULT_BORDER: ItemBorderStyle = {
  borderWidth: 0.5,
  borderColor: '#000000',
  borderStyle: 'solid'
};

export default defineComponent({
  components: {
    PropertyCaption,
    DisplayProperty,
    TextProperty,
    SelectProperty,
    TableCellBorderProperty,
    TextItemProperties,
    TextBlockItemProperties,
    ImageBlockItemProperties
  },
  props: {
    cell: {
      type: Object as () => TableCell,
      required: true
    }
  },
  setup (props) {
    const { cell } = toRefs(props);

    const paddingSides = ['top', 'right', 'bottom', 'left'];
    const borderSides = [
      { key: 'borderTop', label: 'top' },
      { key: 'borderRight', label: 'right' },
      { key: 'borderBottom', label: 'bottom' },
      { key: 'borderLeft', label: 'left' }
    ] as const;

    const patternOptions = [
      { label: 'none', value: 'none' },
      { label: 'horizontal', value: 'horizontal' },
      { label: 'vertical', value: 'vertical' },
      { label: 'grid', value: 'grid' },
      { label: 'forward-diagonal', value: 'forward-diagonal' },
      { label: 'backward-diagonal', value: 'backward-diagonal' },
      { label: 'cross-diagonal', value: 'cross-diagonal' }
    ];

    const contentTypeOptions = [
      { label: 'none', value: 'none' },
      { label: 'text', value: 'text' },
      { label: 'text-block', value: 'text-block' },
      { label: 'image-block', value: 'image-block' }
    ];

    const content = computed(() => {
      return cell.value.content ? report.getters.findItem(cell.value.content) : null;
    });

    const contentType = computed((): string => content.value ? content.value.type : 'none');

    const tableBorderStyle = computed((): ItemBorderStyle => {
      const table = report.getters.activeTable();
      return table ? table.style : DEFAULT_BORDER;
    });

    const toSpan = (value: string): number => {
      const span = Number(value);
      return Number.isFinite(span) && span >= 1 ? Math.floor(span) : 1;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update = (key: any, value: any) => {
      report.actions.updateTableCell({ uid: cell.value.uid, key, value });
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateStyle = (key: any, value: any) => {
      report.actions.updateTableCellStyle({ uid: cell.value.uid, key, value });
    };
    const updatePadding = (index: number, value: number) => {
      const padding = [...cell.value.style.padding] as [number, number, number, number];
      padding[index] = value;
      updateStyle('padding', padding);
    };
    const changeContent = (type: CellContentItemType | 'none') => {
      report.actions.changeTableCellContent({ uid: cell.value.uid, type });
    };

    return {
      paddingSides,
      borderSides,
      patternOptions,
      contentTypeOptions,
      content,
      contentType,
      tableBorderStyle,
      toSpan,
      update,
      updateStyle,
      updatePadding,
      changeContent
    };
  }
});
</script>

<style scoped></style>
