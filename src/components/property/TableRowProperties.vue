<template>
  <div>
    <PropertyCaption caption="TableRow" />
    <IdProperty
      :value="row.id"
      @change="update('id', $event)"
    />
    <SelectProperty
      label="type"
      :value="row.type"
      :options="typeOptions"
      @change="update('type', $event)"
    />
    <DisplayProperty
      :value="row.display"
      @change="update('display', $event)"
    />
    <HeightProperty
      :value="row.height"
      @change="update('height', Number($event))"
    />
    <AutoStretchProperty
      :value="row.autoStretch"
      @change="update('autoStretch', $event)"
    />

    <div class="uk-flex th-buttons">
      <button
        class="uk-button uk-button-default th-mini-button"
        @click="move('up')"
      >
        Move up
      </button>
      <button
        class="uk-button uk-button-default th-mini-button"
        @click="move('down')"
      >
        Move down
      </button>
      <button
        class="uk-button uk-button-default th-mini-button"
        @click="remove"
      >
        Delete
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, toRefs } from 'vue';
import PropertyCaption from './PropertyCaption.vue';
import AutoStretchProperty from './properties/AutoStretchProperty.vue';
import DisplayProperty from './properties/DisplayProperty.vue';
import HeightProperty from './properties/HeightProperty.vue';
import IdProperty from './properties/IdProperty.vue';
import SelectProperty from './properties/base/SelectProperty.vue';
import { report } from '@/store';
import { TableRow } from '@/types';

export default defineComponent({
  components: {
    PropertyCaption,
    IdProperty,
    DisplayProperty,
    HeightProperty,
    AutoStretchProperty,
    SelectProperty
  },
  props: {
    row: {
      type: Object as () => TableRow,
      required: true
    }
  },
  setup (props) {
    const { row } = toRefs(props);

    const typeOptions = [
      { label: 'header', value: 'header' },
      { label: 'body', value: 'body' },
      { label: 'footer', value: 'footer' }
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update = (key: any, value: any) => {
      report.actions.updateTableRow({ uid: row.value.uid, key, value });
    };
    const move = (direction: 'up' | 'down') => {
      report.actions.moveActiveTableRow({ direction });
    };
    const remove = () => {
      report.actions.removeActiveTableRow();
    };

    return {
      typeOptions,
      update,
      move,
      remove
    };
  }
});
</script>

<style scoped>
.th-buttons {
  margin-top: 12px;
}

.th-mini-button {
  font-size: 0.7rem;
  height: 26px;
  line-height: 26px;
  padding: 0 8px;
  margin-right: 4px;
}
</style>
