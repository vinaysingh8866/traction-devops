<template>
  <MainCardContent :title="t('bulkIssue.bulkIssue')">
    <Panel class="mb-5" header="Bulk Offer Summary">
      <BulkIssueConnectionCount @update:failed-list="handleFailedList" />
    </Panel>
    <BulkIssueFailedReport :received-list="failedList" />
  </MainCardContent>
</template>
<script setup lang="ts">
import MainCardContent from '@/components/layout/mainCard/MainCardContent.vue';
import Panel from 'primevue/panel';
import BulkIssueConnectionCount from '@/components/issuance/bulkIssue/BulkIssueConnectionCount.vue';
import { useI18n } from 'vue-i18n';
import BulkIssueFailedReport from '@/components/issuance/bulkIssue/BulkIssueFailedReport.vue';
import { ref } from 'vue';

const { t } = useI18n();
// Handle the emitted value and update sharedMyList
const failedList = ref();
const handleFailedList = (val: any) => {
  failedList.value = val;
};
</script>
