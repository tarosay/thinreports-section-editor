<template>
  <g>
    <g v-if="isActive">
      <StackViewItemModifier
        :item-bounds="bounds"
        @modifierDrag="dragStart"
        @modifierClick="activate"
      />
      <TableItemRows
        :table="item"
        :item-bounds="bounds"
        :table-active="true"
      />
    </g>
    <g v-else>
      <ItemEntity
        :item="item"
        @itemClick="activate"
      >
        <TableItemRows
          :table="item"
          :item-bounds="bounds"
          :table-active="false"
        />
      </ItemEntity>
    </g>
  </g>
</template>

<script lang="ts">
import { computed, defineComponent, toRefs } from 'vue';
import { report } from '../../store';
import ItemEntity from './ItemEntity.vue';
import StackViewItemModifier from './StackViewItemModifier.vue';
import TableItemRows from './TableItemRows.vue';
import { BoundingBox, TableItem } from '@/types';

export default defineComponent({
  components: {
    ItemEntity,
    StackViewItemModifier,
    TableItemRows
  },
  props: {
    item: {
      type: Object as () => TableItem,
      required: true
    }
  },
  emits: ['itemDragStart'],
  setup (props, { emit }) {
    const { item } = toRefs(props);

    const isActive = computed((): boolean => {
      return report.getters.isActiveTableTree(item.value.uid);
    });
    const bounds = computed((): BoundingBox => {
      return {
        x: item.value.x,
        y: item.value.y,
        width: report.getters.widthOfTable(item.value.uid),
        height: report.getters.heightOfTable(item.value.uid)
      };
    });

    const dragStart = () => {
      emit('itemDragStart', item.value);
    };
    const activate = () => {
      report.actions.activateEntity({ uid: item.value.uid, type: 'item' });
    };

    return {
      isActive,
      bounds,
      dragStart,
      activate
    };
  }
});
</script>
