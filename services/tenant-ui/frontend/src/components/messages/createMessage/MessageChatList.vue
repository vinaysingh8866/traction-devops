<template>
  <div class="title">
    <h2>
      {{ $t('connect.message.messageConnection', [props.connectionName]) }}
    </h2>
  </div>
  <div class="container">
    <div
      v-for="item in filteredMessages"
      :key="item.message_id"
      :class="item.state === 'received' ? 'theirs' : 'mine'"
      class="message"
    >
      <div class="bubble">
        {{ item.content }}
      </div>
      <div class="time" :class="{ display: item.displayTime }">
        {{ formatTime(item.sent_time) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Vue
import {
  computed,
  ref,
  PropType,
  watch,
  onUpdated,
  onMounted,
  defineProps,
} from 'vue';
import { storeToRefs } from 'pinia';

// State
import { useMessageStore } from '../../../store';

// Other components
import { MESSAGES } from '../../../helpers/constants';
import { Message } from '../../../store/messageStore';

/**
 * formatTime
 * Format the time to be displayed in the chat window.
 * @param time string
 */
const formatTime = (time: string) => {
  const date: any = new Date(time);
  const now: any = new Date();
  if (now - date > MESSAGES.TIME_LONG) {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-CA', options);
  } else {
    return date.toLocaleTimeString();
  }
};

// Props
const props = defineProps({
  connectionId: {
    type: String as PropType<string>,
    required: true,
  },
  connectionName: {
    type: String as PropType<string>,
    required: true,
  },
});

// Array to contain the messages
const messageStore = useMessageStore();
const { messages, newMessage } = storeToRefs(messageStore);

const filteredMessages = computed(() => {
  return messages.value
    .filter((message) => message.connection_id === props.connectionId)
    .filter(filterMessages)
    .sort(sortMessages)
    .map(displayTime);
});

/**
 * Remove unwanted messages. In this case
 * it is the message that is sent to the
 * connection to let us know that the
 * message was received.
 * TBD: This should be done in the backend.
 * @param message of type Message
 * @return boolean
 */
const filterMessages = (message: Message) => {
  if (message.content.match(/received your message/)) {
    return false;
  } else {
    return true;
  }
};

/**
 * Sort the messages by date. Oldest to newest.
 * @param messageA Message currently looking at
 * @param messageB Message next in line
 * @return number
 */
const sortMessages = (messageA: Message, messageB: Message) => {
  const dateA = new Date(messageA.sent_time);
  const dateB = new Date(messageB.sent_time);
  return dateA.valueOf() - dateB.valueOf();
};

/**
 * Run through all the messages and flag as to whether
 * the time should be displayed or not.
 * @param message Message
 * @param index number
 * @param wholeArray Array<Message>
 * @return Message
 */
const displayTime = (
  message: Message,
  index: number,
  wholeArray: Array<Message>
) => {
  if (index === wholeArray.length - 1) {
    message.displayTime = true;
    return message;
  }

  const dateA = new Date(message.sent_time);
  const dateB = new Date(wholeArray[index + 1].sent_time);
  const now = new Date();

  let old = false;
  if (now.valueOf() - dateA.valueOf() > MESSAGES.TIME_LONG) {
    old = true;
  } else {
    old = false;
  }

  if (old && dateB.valueOf() - dateA.valueOf() > MESSAGES.TIME_LONG) {
    message.displayTime = true;
  }

  if (!old && dateB.valueOf() - dateA.valueOf() > MESSAGES.TIME_SHORT) {
    message.displayTime = true;
  }

  return message;
};

/**
 * Listen for new messages on the messageStore
 */
watch(newMessage, (newContent) => {
  if (newContent && newContent.connection_id === props.connectionId) {
    const now = new Date();
    const tempMessage: Message = {
      connection_id: newContent.connection_id,
      content: newContent.content,
      created_at: now.toISOString(),
      message_id: '',
      sent_time: now.toISOString(),
      state: 'sent',
      updated_at: now.toISOString(),
      displayTime: false,
    };
    messages.value.push(tempMessage);
  }
});

let mounted = false;

onMounted(() => {
  mounted = true;
  console.log('MessageChatList mounted');
});

/**
 * Scroll to the bottom of the chat window whenever
 * a new message is added.
 */
onUpdated(() => {
  const chat = document.querySelector('.p-sidebar-content');

  if (!chat) return; // Guard clause
  if (mounted) {
    // If first render no animation
    chat.scrollTop = chat.scrollHeight;
    mounted = false;
  } else {
    // Fancy animation
    chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
  }
});
</script>

<style scoped lang="scss">
h2 {
  color: #5d5d5d;
}
.title {
  position: absolute;
  background-color: #fff;
  width: 100%;
}
.container {
  margin: 5rem 0 5rem 0;
  display: flex;
  flex-direction: column;
}
.bubble {
  border-radius: 1rem;
  padding: 0.75rem 1.5rem 0.75rem 1.5rem;
  margin: 0.5rem;
}
.message {
  max-width: 60%;
  min-width: 20%;
}
.mine {
  align-self: flex-end;
}
.mine .bubble {
  background-color: #d8e6f1;
  color: #617786;
}
.theirs {
  align-self: flex-start;
}
.theirs .bubble {
  background-color: #6e889e;
  color: #fff;
}
.time {
  font-size: 0.75rem;
  color: #818181;
  margin-top: -0.5rem;
  display: none;
}
.mine .time {
  text-align: right;
}

.time.display {
  display: block;
}
</style>
