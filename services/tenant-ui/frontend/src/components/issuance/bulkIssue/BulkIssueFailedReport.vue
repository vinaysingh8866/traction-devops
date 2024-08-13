<template>
  <DataTable
    v-if="receivedList"
    v-model:filters="sortField"
    :value="receivedList"
    :paginator="true"
    :rows="TABLE_OPT.ROWS_DEFAULT"
    :rows-per-page-options="TABLE_OPT.ROWS_OPTIONS"
    sort-field="date"
    :sort-order="-1"
    filter-display="menu"
  >
    <template #header>
      <div class="flex justify-content-between">
        <div class="flex justify-content-start">{{ $t('Failed Reports') }}</div>
      </div>
    </template>
    <template #empty>{{ $t('common.noRecordsFound') }}</template>
    <template #loading>{{ $t('common.loading') }}</template>
    <Column :sortable="true" field="date" header="Date">
      <template #body="{ data }"> {{ formatDateLong(data?.date) }}</template>
    </Column>
    <Column field="studentInfo.student_id" header="Student ID" />
    <Column field="studentInfo.connection_id" header="Connection ID" />
    <Column field="full_name" header="Full Name">
      <template #body="{ data }">
        {{
          `${data?.studentInfo?.first_name} ${data?.studentInfo?.last_name}`
        }}</template
      >
    </Column>
    <Column field="reason" header="Reason" />
  </DataTable>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { TABLE_OPT } from '@/helpers/constants';
import { FilterMatchMode } from 'primevue/api';
import { formatDateLong } from '@/helpers';

const props = defineProps<{
  receivedList: [];
}>();

// Sorting
const sortField = ref({
  state: {
    value: null,
    matchMode: FilterMatchMode.CONTAINS,
  },
});
</script>
