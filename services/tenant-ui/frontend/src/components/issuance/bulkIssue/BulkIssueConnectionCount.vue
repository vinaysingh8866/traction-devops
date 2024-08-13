<template>
  <div class="mb-5 flex flex-column">
    <span class="mb-2">
      {{
        t('bulkIssue.totalConnections', {
          count: activeConnections?.length,
        })
      }}
    </span>
    <span>
      {{ t('bulkIssue.connectionsWithStudentId', { count: metaDataCount }) }}
    </span>
  </div>

  <div class="flex align-items-center">
    <Button
      :label="t('bulkIssue.sendOffer')"
      icon="pi pi-send"
      :disabled="_isActive"
      @click="submit"
    />
    <span v-if="_isLoading" class="ml-2">
      <i class="pi pi-spin pi-spinner" style="font-size: 1.2em" />
    </span>
  </div>

  <div v-if="_isActive && !_isLoading" class="mt-5 flex flex-column font-bold">
    <span class="mb-2">
      {{ `${t('bulkIssue.successfulOffers')}:` }} {{ successful.length }}
    </span>
    <span class="mb-2">
      {{ `${t('bulkIssue.failedOffers')}:` }} {{ failed.length }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useConnectionStore, useIssuerStore } from '@/store';
import { storeToRefs } from 'pinia';
import Button from 'primevue/button';
import useGetItem from '@/composables/useGetItem';
import { useI18n } from 'vue-i18n';
import { useStudentStore } from '@/store';
import { useSisApi } from '@/store/sisApi';
import { API_PATH } from '@/helpers/constants';

const { t } = useI18n();
const { connections } = storeToRefs(useConnectionStore());
const connectionStore = useConnectionStore();
const activeConnections = ref();
const metaStudentInfo = ref<any[]>([]);
const metaDataCount = ref<number>(0);
const transcriptContent = ref();
const { getStudentInfo } = useStudentStore();
const _isLoading = ref(false);
const _isActive = ref(false);
const payload = ref();
const sisApi = useSisApi();
const credentialDefinitionId = ref();
const issuerStore = useIssuerStore();
const successful = ref<string[]>([]);
const failed = ref<any[]>([]);
const emits = defineEmits(['update:failedList']);

// Get Metadata
const fetchMetadata = async (connection_id: string) => {
  const { item, fetchItem } = useGetItem(
    API_PATH.CONNECTIONS_METADATA(connection_id)
  );
  await fetchItem();
  if (item.value?.results?.student_id) {
    metaDataCount.value++;
    metaStudentInfo.value.push({
      first_name: item.value.results.first_name,
      last_name: item.value.results.last_name,
      student_id: item.value.results.student_id,
      expiration: item.value.results.expiration,
      connection_id,
    });
  }
};

// Get Transcript
const getTranscript = async (studentInfo: any) => {
  transcriptContent.value = await getStudentInfo(studentInfo.student_id);
  // There is a transcript but it's empty
  if (transcriptContent.value?.courseTranscript?.length === 0) {
    transcriptContent.value = false;
  }
  await createPayload(studentInfo);
  await sendOffer(payload.value, studentInfo);
};

// Submit Button
const submit = async () => {
  _isLoading.value = true;
  _isActive.value = true;
  if (metaStudentInfo.value) {
    const promises = metaStudentInfo.value.map((studentInfo: any) => {
      return getTranscript(studentInfo);
    });
    Promise.all(promises)
      .then(() => {
        _isLoading.value = false;
      })
      .catch((error) => {
        console.error('###Error fetching transcripts:', error);
      });
  } else {
    console.log('There are no connections with metadata!');
  }
};

// Create payload
const createPayload = async (studentInfo: any) => {
  const GPA =
    transcriptContent.value?.studentCumulativeTranscript[0]?.cumulativeGradePointAverage?.toString() ??
    '';
  payload.value = {
    auto_issue: true,
    auto_remove: false,
    connection_id: studentInfo.connection_id,
    cred_def_id: credentialDefinitionId.value,
    credential_preview: {
      '@type': 'issue-credential/1.0/credential-preview',
      attributes: [
        {
          name: 'Last',
          value: studentInfo?.last_name,
        },
        {
          name: 'First',
          value: studentInfo?.first_name,
        },
        {
          name: 'Expiration',
          value: '20250101',
        },
        {
          name: 'StudentID',
          value: studentInfo?.student_id,
        },
        {
          name: 'Middle',
          value: '',
        },
        {
          name: 'Transcript',
          value: JSON.stringify(transcriptContent.value?.courseTranscript),
        },
        {
          name: 'School',
          value: 'Cape Fear Community College',
        },
        {
          name: 'GPA',
          value: GPA,
        },
      ],
    },
    trace: false,
  };
};

// Helper function to check if the expiration date is valid
const isExpired = (expiration: string): boolean => {
  const expirationDate = new Date(
    `${expiration.substring(0, 4)}-${expiration.substring(4, 6)}-${expiration.substring(6, 8)}`
  );
  const today = new Date();
  return expirationDate < today;
};

const sendOffer = async (payload: any, studentInfo: any) => {
  try {
    if (isExpired(studentInfo?.expiration)) {
      throw new Error('Expired');
    }
    await issuerStore.offerCredential(payload);
    successful.value.push(payload.connection_id);
  } catch (error) {
    let reason = 'Unknown error';
    // Add other specific failure reasons here as needed
    if (error instanceof Error && error.message === 'Expired') {
      reason = 'Student ID Expired';
    }
    if (
      error instanceof Error &&
      error.message === 'Request failed with status code 422'
    ) {
      reason = 'Student ID Not Found';
    }
    failed.value.push({ studentInfo, date: new Date().toISOString(), reason });
    emits('update:failedList', failed.value);
  }
};

onMounted(async () => {
  credentialDefinitionId.value = (
    await sisApi.getHttp(`metadata/transcript-credential-definition-id`)
  ).data?.transcriptCredentialDefinitionId;
  await connectionStore.listConnections().catch((err) => {
    console.error(`Failure: ${err}`);
  });
  activeConnections.value = connections.value.filter(
    (connection: any) => connection.state === 'active'
  );
  const fetchAllMetadata = activeConnections.value.map((connection: any) => {
    fetchMetadata(connection?.connection_id);
  });
  await Promise.all(fetchAllMetadata);
});
</script>
