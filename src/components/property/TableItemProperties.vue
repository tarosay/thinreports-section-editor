<template>
  <div>
    <PropertyCaption caption="Table" />
    <IdProperty
      :value="item.id"
      @change="update('id', $event)"
    />
    <DescriptionProperty
      :value="item.description"
      @change="update('description', $event)"
    />
    <DisplayProperty
      :value="item.display"
      @change="update('display', $event)"
    />
    <LeftProperty
      :value="item.x"
      @change="update('x', Number($event))"
    />
    <TopProperty
      :value="item.y"
      @change="update('y', Number($event))"
    />
    <FollowStretchProperty
      :value="item.followStretch"
      @change="update('followStretch', $event)"
    />
    <AffectBottomMarginProperty
      :value="item.affectBottomMargin"
      @change="update('affectBottomMargin', $event)"
    />

    <PropertyCaption caption="Default border" />
    <StrokeWidthProperty
      :value="item.style.borderWidth"
      @change="updateStyle('borderWidth', Number($event))"
    />
    <StrokeColorProperty
      :value="item.style.borderColor"
      @change="updateStyle('borderColor', $event)"
    />
    <StrokeTypeProperty
      :value="item.style.borderStyle"
      @change="updateStyle('borderStyle', $event)"
    />

    <PropertyCaption caption="Columns" />
    <div
      v-for="column in item.columns"
      :key="column.id"
      class="uk-flex uk-flex-middle th-column-row"
    >
      <input
        type="text"
        class="uk-input th-column-id"
        :value="column.id"
        @change="updateColumn(column.id, 'id', $event.target.value)"
      >
      <input
        type="text"
        class="uk-input th-column-width"
        :value="column.width"
        @change="updateColumn(column.id, 'width', Number($event.target.value))"
      >
      <button
        class="uk-button uk-button-default th-mini-button"
        :disabled="item.columns.length <= 1"
        @click="removeColumn(column.id)"
      >
        <span class="mdi mdi-close" />
      </button>
    </div>
    <button
      class="uk-button uk-button-default th-add-button"
      @click="addColumn"
    >
      Add column
    </button>

    <PropertyCaption caption="Rows" />
    <div class="uk-flex">
      <button
        v-for="type in rowTypes"
        :key="type"
        class="uk-button uk-button-default th-add-button"
        @click="addRow(type)"
      >
        + {{ type }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, toRefs } from 'vue';
import PropertyCaption from './PropertyCaption.vue';
import AffectBottomMarginProperty from './properties/AffectBottomMarginProperty.vue';
import DescriptionProperty from './properties/DescriptionProperty.vue';
import DisplayProperty from './properties/DisplayProperty.vue';
import FollowStretchProperty from './properties/FollowStretchProperty.vue';
import IdProperty from './properties/IdProperty.vue';
import LeftProperty from './properties/LeftProperty.vue';
import StrokeColorProperty from './properties/StrokeColorProperty.vue';
import StrokeTypeProperty from './properties/StrokeTypeProperty.vue';
import StrokeWidthProperty from './properties/StrokeWidthProperty.vue';
import TopProperty from './properties/TopProperty.vue';
import { report } from '@/store';
import { TableItem, TableRowType } from '@/types';

export default defineComponent({
  components: {
    PropertyCaption,
    IdProperty,
    DescriptionProperty,
    DisplayProperty,
    LeftProperty,
    TopProperty,
    FollowStretchProperty,
    AffectBottomMarginProperty,
    StrokeWidthProperty,
    StrokeColorProperty,
    StrokeTypeProperty
  },
  props: {
    item: {
      type: Object as () => TableItem,
      required: true
    }
  },
  setup (props) {
    const { item } = toRefs(props);

    const rowTypes: TableRowType[] = ['header', 'body', 'footer'];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update = (key: any, value: any) => {
      report.actions.updateTableItem({ uid: item.value.uid, key, value });
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateStyle = (key: any, value: any) => {
      report.actions.updateTableItem({
        uid: item.value.uid,
        key: 'style',
        value: { ...item.value.style, [key]: value }
      });
    };
    const updateColumn = (columnId: string, key: 'id' | 'width', value: string | number) => {
      report.actions.updateTableColumn({ tableUid: item.value.uid, columnId, key, value });
    };
    const addColumn = () => {
      report.actions.activateEntity({ uid: item.value.uid, type: 'item' });
      report.actions.addColumnToActiveTable();
    };
    const removeColumn = (columnId: string) => {
      report.actions.activateEntity({ uid: item.value.uid, type: 'item' });
      report.actions.removeColumnFromActiveTable({ columnId });
    };
    const addRow = (type: TableRowType) => {
      report.actions.addTableRow({ tableUid: item.value.uid, type, activate: false });
    };

    return {
      rowTypes,
      update,
      updateStyle,
      updateColumn,
      addColumn,
      removeColumn,
      addRow
    };
  }
});
</script>

<style scoped>
.th-column-row {
  margin-bottom: 4px;
}

.th-column-id {
  font-size: 0.8rem;
  height: 24px;
  width: 140px;
  margin-right: 4px;
}

.th-column-width {
  font-size: 0.8rem;
  height: 24px;
  width: 60px;
  margin-right: 4px;
}

.th-mini-button {
  font-size: 0.7rem;
  height: 24px;
  line-height: 24px;
  padding: 0 6px;
}

.th-add-button {
  font-size: 0.7rem;
  height: 26px;
  line-height: 26px;
  padding: 0 8px;
  margin-right: 4px;
  margin-top: 4px;
}
</style>
