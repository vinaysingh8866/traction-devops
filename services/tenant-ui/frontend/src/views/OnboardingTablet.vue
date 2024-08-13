<template>
  <div class="main-container">
    <div class="onboarding-tablet">
      <section>
        <form class="onboarding-form" @submit.prevent>
          <InputText
            id="studentId"
            v-model="studentId"
            required
            placeholder="Student ID"
            :class="errorSt ? 'errorSt' : ''"
          />

          <Button
            :icon="!loadingSt ? 'pi pi-search' : 'pi pi-spin pi-spinner'"
            class="searchBtn"
            @click="handleIdLookUp"
          />
          <Card v-if="studentInfo" class="mt-4">
            <template #title>
              <div class="flex align-items-center">
                <img
                  src="/tablet/capefearlogo.jpg"
                  alt=""
                  class="capefearlogo mr-2"
                />
                <span> {{ $t('Cape Fear Student ID') }}</span>
              </div>
            </template>
            <template #content>
              <div class="flex justify-content-between">
                <div>
                  <p class="m-0 font-bold">
                    {{ studentInfo.fullName }}
                  </p>
                  <p class="my-2">
                    {{ $t('Student ID:') }} {{ studentInfo.studentsId }}
                  </p>
                  <p class="mt-0">{{ $t('Expiration: 2025/07/01') }}</p>
                </div>
                <div>
                  <Button
                    v-if="invitation_url"
                    icon="pi pi-refresh"
                    class="btnArrow"
                    @click="refresh"
                  />
                  <Button
                    v-else
                    :icon="
                      !loadingQrCode
                        ? 'pi pi-arrow-circle-right'
                        : 'pi pi-spin pi-spinner'
                    "
                    class="btnArrow"
                    @click="generateQRcode"
                  />
                </div>
              </div>
            </template>
          </Card>
          <Card v-if="errorSt" class="mt-4">
            <template #content>
              <p>{{ $t('No matching student IDs.') }}</p>
            </template>
          </Card>
        </form>
        <div v-if="invitation_url" class="qrCode">
          <QRCode :qr-content="invitation_url" />
        </div>
      </section>
    </div>
    <footer class="flex align-center justify-content-end px-8">
      <img src="/tablet/digicred-dark.svg" alt="" />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Card from 'primevue/card';
import QRCode from '@/components/common/QRCode.vue';
import {
  useStudentStore,
  useConnectionStore,
  useTokenStore,
  useConfigStore,
} from '@/store';
import { storeToRefs } from 'pinia';

const studentId = ref('');
const studentInfo: any = ref('');
const loadingSt = ref(false);
const loadingQrCode = ref(false);
const errorSt = ref(false);
const webHookUrl = ref(null);
const invitation_url = ref('');

const { idLookup } = useStudentStore();
const { createInvitation } = useConnectionStore();

const handleIdLookUp = async () => {
  studentInfo.value = '';
  invitation_url.value = '';
  errorSt.value = false;
  loadingSt.value = true;
  let response;
  try {
    if (webHookUrl.value) {
      response = await idLookup(studentId.value, webHookUrl.value);
    } else {
      response = await idLookup(studentId.value);
    }
    if (response && response.studentIdCred) {
      studentInfo.value = response.studentIdCred;
    } else {
      errorSt.value = true;
    }
  } catch (err: any) {
    errorSt.value = true;
  }
  loadingSt.value = false;
};

const generateQRcode = async () => {
  loadingQrCode.value = true;
  try {
    const result: any = await createInvitation(
      `${studentInfo.value.fullName.value} -studentID- ${studentId.value}`,
      false
    );
    if (result && result.invitation_url) {
      invitation_url.value = result.invitation_url;
      console.log(`Invitation URL: ${result.invitation_url}`);
    }
  } catch (err: any) {
    console.error('Error during invitation creation:', err.message);
  }
  loadingQrCode.value = false;
};
const refresh = async () => {
  studentId.value = '';
  studentInfo.value = '';
  loadingSt.value = false;
  errorSt.value = false;
  invitation_url.value = '';
};

/* hardcode login cape fear */
const tokenStore = useTokenStore();
const { config } = storeToRefs(useConfigStore());
onMounted(async () => {
  const walletIdCapeFear =
    config.value?.frontend?.walletIdOnboardingTabletCapeFear;
  const walletKeyCapeFear =
    config.value?.frontend?.walletKeyOnboardingTabletCapeFear;
  await tokenStore.login(walletIdCapeFear, walletKeyCapeFear, false);
});
</script>

<style scoped>
.main-container {
  position: fixed;
  width: 100%;
  height: 100%;
  min-height: 100%;
}
.onboarding-tablet {
  min-height: calc(100% - 80px);
  height: calc(100% - 80px);
  background-color: antiquewhite;
  padding: 40px;
  display: flex;
  align-items: center;
  background: url('/tablet/capefear-background.png');
  background-size: cover;
  background-position: center;
}
.onboarding-tablet > section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
}
/* form */
form input {
  width: 400px;
  border: none;
  border-bottom: 1px solid #6666cc;
  border-radius: 2px 0 0 2px;
}
form button {
  background-color: #6666cc !important;
  border-radius: 0 2px 2px 0;
  border: none;
}
form
  button.searchBtn.p-button:not(.p-button-rounded):not(.p-button-text):not(
    .p-button-link
  ):hover {
  background-color: #6666cc !important;
}
form button:hover,
form button:focus,
form input:hover,
form input:focus {
  box-shadow: none;
}
form input,
form button {
  height: 40px;
}
form .errorSt {
  border: 1px solid red !important;
  border-right: none !important;
}
form .capefearlogo {
  width: 50px;
}
/* btnArrow */
.btnArrow {
  width: 30px;
  height: 30px;
  background-color: unset !important;
}
.btnArrow :deep(span.p-button-icon) {
  font-size: 16px !important;
  color: #6666cc;
}
form
  button.btnArrow.p-button:not(.p-button-rounded):not(.p-button-text):not(
    .p-button-link
  ):hover {
  background-color: unset !important;
}
/* footer */
footer {
  position: relative;
  height: 80px;
  background: #424242;
}
footer img {
  width: 150px;
}
/* qrCode */
.qrCode :deep(.qr-container .field) {
  display: none !important;
}
.qrCode :deep(.qr-container) {
  padding: 20px !important;
  background-color: #fff;
}
.qrCode :deep(.qr-image) {
  margin: 0 !important;
  width: 300px !important;
  height: 300px !important;
}
/* media */
@media (max-width: 880px) {
  .onboarding-tablet > section {
    flex-direction: column;
  }
  .qrCode :deep(.qr-container) {
    margin-top: 20px !important;
  }
}
@media (max-width: 550px) {
  form input {
    width: 250px !important;
  }
}
</style>
