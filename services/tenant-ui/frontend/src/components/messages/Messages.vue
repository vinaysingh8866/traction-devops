<template>
  <MainCardContent
    :title="$t('messages.messages')"
    :refresh-callback="loadTable"
  >
    <p class="pt-0">
      <i class="pi pi-info-circle mr-1"></i>
      {{ $t('messages.disclaimer') }}
    </p>
    <DataTable
      v-model:expandedRows="expandedRows"
      v-model:selection="selectedMessage"
      v-model:filters="filter"
      :loading="loading"
      :paginator="true"
      :rows="TABLE_OPT.ROWS_DEFAULT"
      :rows-per-page-options="TABLE_OPT.ROWS_OPTIONS"
      :value="formattedMessages"
      :global-filter-fields="['content']"
      selection-mode="single"
      data-key="message_id"
      filter-display="menu"
      @row-click="onRowClick"
    >
      <template #header>
        <div class="flex justify-content-between">
          <div class="flex justify-content-start">
            <CreateMessage
              v-if="
                stringOrBooleanTruthy(config.frontend.showWritableComponents)
              "
              @success="loadTable"
            />
          </div>
          <div class="flex justify-content-end">
            <IconField icon-position="left">
              <InputIcon><i class="pi pi-search" /></InputIcon>
              <InputText
                v-model="filter.content.value"
                placeholder="Search Messages"
              />
            </IconField>
          </div>
        </div>
      </template>
      <template #empty>{{ $t('common.noRecordsFound') }}</template>
      <template #loading>{{ $t('common.loading') }}</template>
      <Column
        sortable
        field="connection"
        header="Connection"
        filter-field="connection"
        :show-filter-match-modes="false"
      >
        <template #body="{ data }">
          <div>
            <LoadingLabel :value="data.connection" />
          </div>
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            class="p-column-filter"
            placeholder="Search By Connection"
            @input="filterCallback()"
          />
        </template>
      </Column>
      <Column
        :sortable="true"
        field="state"
        header="State"
        filter-field="state"
        :show-filter-match-modes="false"
      >
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            class="p-column-filter"
            placeholder="Search By State"
            @input="filterCallback()"
          />
        </template>
      </Column>
      <Column
        :sortable="true"
        field="content"
        header="Content"
        filter-field="content"
        :show-filter-match-modes="false"
      >
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            class="p-column-filter"
            placeholder="Search By Content"
            @input="filterCallback()"
          />
        </template>
      </Column>
      <Column
        :sortable="true"
        field="created_at"
        header="Sent"
        filter-field="created_at"
        :show-filter-match-modes="false"
      >
        <template #body="{ data }">
          {{ data.created_at }}
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            class="p-column-filter"
            placeholder="Search By Time"
            @input="filterCallback()"
          />
        </template>
      </Column>
    </DataTable>
    <Sidebar
      v-model:visible="sidebarVisible"
      :position="'right'"
      :full-screen="false"
      class="wider-sidebar"
    >
      <MessageChatList
        :connection-id="selectedMessageDetails.connection_id"
        :connection-name="selectedMessageDetails.connection"
      />
      <div
        v-if="stringOrBooleanTruthy(config.frontend.showWritableComponents)"
        class="p-inputgroup flex-1 send-message"
      >
        <InputText
          v-model="message"
          type="text"
          placeholder="Send Message"
          autofocus
          @keydown="onKeydown"
        />
        <Button icon="pi pi-send" @click="sendMessage" />
      </div>
    </Sidebar>
  </MainCardContent>
</template>

<script setup lang="ts">
// Vue
import { computed, onMounted, ref } from 'vue';
// PrimeVue
import { FilterMatchMode } from 'primevue/api';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import InputText from 'primevue/inputtext';
import InputIcon from 'primevue/inputicon';
import IconField from 'primevue/iconfield';
import Sidebar from 'primevue/sidebar';
import Button from 'primevue/button';
import { useToast } from 'vue-toastification';
// State
import { useConnectionStore, useMessageStore } from '@/store';
import { Message } from '@/store/messageStore';
import { storeToRefs } from 'pinia';
// Other components
import { formatDateLong, stringOrBooleanTruthy } from '@/helpers';
import { TABLE_OPT } from '@/helpers/constants';
import MainCardContent from '../layout/mainCard/MainCardContent.vue';
import CreateMessage from './createMessage/CreateMessage.vue';
import LoadingLabel from '../common/LoadingLabel.vue';
import MessageChatList from './createMessage/MessageChatList.vue';

// State
import { useConfigStore } from '@/store/configStore';
const { config } = storeToRefs(useConfigStore());

const toast = useToast();

const messageStore = useMessageStore();
const { listConnections, findConnectionName } = useConnectionStore();

const { loading, messages, selectedMessage, newMessage } =
  storeToRefs(messageStore);
const { connections } = storeToRefs(useConnectionStore());

const sidebarVisible = ref(false);
const selectedMessageDetails = ref({
  connection_id: '',
  connection: '',
  message_id: '',
  content: '',
});

const message = ref(''); // Store new message

// Function to handle row click and show the sidebar
const onRowClick = (event: any) => {
  if (!event || !event.data) {
    console.error('Row click event data is undefined', { event });
    return;
  }

  const data = event.data;

  console.log('Row clicked:', data);

  if (!data || !data.connection_id || !data.connection) {
    console.error('Data missing connection_id or connection:', { data });
    return;
  }

  selectedMessageDetails.value = {
    connection_id: data.connection_id,
    connection: data.connection,
    message_id: data.message_id,
    content: data.content,
  };
  console.log('Selected message details:', selectedMessageDetails.value); // Debugging log
  sidebarVisible.value = true;
};

const sendMessage = () => {
  // No empty messages
  if (message.value.length === 0) return;

  messageStore.sendMessage(selectedMessageDetails.value.connection_id, {
    content: message.value,
  });
  newMessage.value = {
    connection_id: selectedMessageDetails.value.connection_id,
    content: message.value,
  }; // Update newMessage with the new message details
  message.value = ''; // Blank the form
};

/**
 * When the user hits enter, send the message.
 * @param event KeyboardEvent
 */
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    sendMessage();
  }
};

// Fetch messages only once when the component mounts
const loadTable = async () => {
  try {
    await messageStore.listMessages();
  } catch (err) {
    toast.error(`Failure: ${err}`);
  }

  if (!connections.value || !connections.value.length) {
    try {
      await listConnections();
    } catch (err) {
      console.error(err);
      toast.error(`Failure: ${err}`);
    }
  }
};

const expandedRows = ref([]);
const formattedMessages = computed(() =>
  messages.value.map((msg: Message) => ({
    message_id: msg.message_id,
    connection_id: msg.connection_id,
    connection: findConnectionName(msg.connection_id),
    state: msg.state,
    content: msg.content,
    sent_time: msg.sent_time,
    created_at: formatDateLong(msg.created_at),
  }))
);

const filter = ref({
  content: {
    value: null,
    matchMode: FilterMatchMode.CONTAINS,
  },
  cred_def_id: {
    value: null,
    matchMode: FilterMatchMode.CONTAINS,
  },
  connection: {
    value: null,
    matchMode: FilterMatchMode.CONTAINS,
  },
  credential_definition_id: {
    value: null,
    matchMode: FilterMatchMode.CONTAINS,
  },
  state: {
    value: null,
    matchMode: FilterMatchMode.CONTAINS,
  },
  created_at: {
    value: null,
    matchMode: FilterMatchMode.CONTAINS,
  },
});

onMounted(() => {
  loadTable();
});
</script>

<style>
.send-message {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  width: 90% !important;
  margin: 1rem 1rem 2rem 1.6rem;
}

.wider-sidebar {
  width: 32.8rem !important; /* Adjusted width for the sidebar */
}
</style>
