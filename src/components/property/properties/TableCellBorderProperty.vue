<template>
  <div>
    <SelectProperty
      :label="label"
      :value="mode"
      :options="modeOptions"
      @change="changeMode"
    />
    <template v-if="mode === 'custom'">
      <TextProperty
        label="- width"
        :value="width"
        @change="changeWidth"
      />
      <TextProperty
        label="- color"
        :value="color"
        @change="changeColor"
      />
      <SelectProperty
        label="- style"
        :value="style"
        :options="styleOptions"
        @change="changeStyle"
      />
    </template>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, toRefs } from 'vue';
import SelectProperty from './base/SelectProperty.vue';
import TextProperty from './base/TextProperty.vue';
import { ItemBorderStyle, TableCellBorder } from '@/types';

type Mode = 'inherit' | 'none' | 'custom';

export default defineComponent({
  components: {
    SelectProperty,
    TextProperty
  },
  props: {
    label: {
      type: String,
      required: true
    },
    value: {
      type: [Object, String] as unknown as () => TableCellBorder,
      default: null
    },
    defaults: {
      type: Object as () => ItemBorderStyle,
      required: true
    }
  },
  emits: ['change'],
  setup (props, { emit }) {
    const { value, defaults } = toRefs(props);

    const modeOptions = [
      { label: 'Inherit', value: 'inherit' },
      { label: 'None', value: 'none' },
      { label: 'Custom', value: 'custom' }
    ];
    const styleOptions = [
      { label: 'solid', value: 'solid' },
      { label: 'dashed', value: 'dashed' },
      { label: 'dotted', value: 'dotted' }
    ];

    const mode = computed((): Mode => {
      if (value.value === 'none') return 'none';
      if (value.value && typeof value.value === 'object') return 'custom';
      return 'inherit';
    });

    const custom = computed(() => {
      return (value.value && typeof value.value === 'object') ? value.value : {};
    });

    const width = computed((): number => custom.value.width ?? defaults.value.borderWidth);
    const color = computed((): string => custom.value.color ?? defaults.value.borderColor);
    const style = computed((): string => custom.value.style ?? defaults.value.borderStyle);

    const emitCustom = (attributes: Record<string, unknown>) => {
      emit('change', {
        width: width.value,
        color: color.value,
        style: style.value,
        ...attributes
      });
    };

    const changeMode = (newMode: Mode) => {
      switch (newMode) {
        case 'inherit': emit('change', null); break;
        case 'none': emit('change', 'none'); break;
        case 'custom': emitCustom({}); break;
      }
    };
    const changeWidth = (newValue: string) => emitCustom({ width: Number(newValue) });
    const changeColor = (newValue: string) => emitCustom({ color: newValue });
    const changeStyle = (newValue: string) => emitCustom({ style: newValue });

    return {
      mode,
      modeOptions,
      styleOptions,
      width,
      color,
      style,
      changeMode,
      changeWidth,
      changeColor,
      changeStyle
    };
  }
});
</script>

<style scoped></style>
