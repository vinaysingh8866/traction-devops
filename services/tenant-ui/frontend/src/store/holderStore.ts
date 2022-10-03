import { defineStore } from 'pinia';
import { ref } from 'vue';
import { fetchItem } from './utils/fetchItem';
import { fetchList } from './utils/fetchList.js';

export const useHolderStore = defineStore('holder', () => {
  // state
  const credentials: any = ref(null);
  const selectedCredential: any = ref(null);
  const presentations: any = ref(null);
  const selectedPresentation: any = ref(null);
  const loading: any = ref(false);
  const error: any = ref(null);

  // getters

  // actions

  async function listCredentials() {
    selectedCredential.value = null;
    return fetchList(
      '/tenant/v1/holder/credentials/',
      credentials,
      error,
      loading
    );
  }

  async function listPresentations() {
    selectedPresentation.value = null;
    return fetchList(
      '/tenant/v1/holder/presentations/',
      presentations,
      error,
      loading
    );
  }

  async function getCredential(id: string, params: any = {}) {
    const getloading: any = ref(false);
    return fetchItem(
      '/tenant/v1/holder/credentials/',
      id,
      error,
      getloading,
      params
    );
  }

  async function getPresentation(id: string, params: any = {}) {
    const getloading: any = ref(false);
    return fetchItem(
      '/tenant/v1/holder/presentations/',
      id,
      error,
      getloading,
      params
    );
  }

  return {
    credentials,
    presentations,
    selectedCredential,
    selectedPresentation,
    loading,
    error,
    listCredentials,
    listPresentations,
    getCredential,
    getPresentation,
  };
});

export default {
  useHolderStore,
};
