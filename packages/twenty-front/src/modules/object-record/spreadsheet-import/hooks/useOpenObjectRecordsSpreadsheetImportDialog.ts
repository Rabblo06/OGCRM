import { contextStoreCurrentViewIdComponentState } from '@/context-store/states/contextStoreCurrentViewIdComponentState';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useGenerateDepthRecordGqlFieldsFromObject } from '@/object-record/graphql/record-gql-fields/hooks/useGenerateDepthRecordGqlFieldsFromObject';
import { useBatchCreateManyRecords } from '@/object-record/hooks/useBatchCreateManyRecords';
import { useBuildSpreadsheetImportFields } from '@/object-record/spreadsheet-import/hooks/useBuildSpreadSheetImportFields';
import { buildRecordFromImportedStructuredRow } from '@/object-record/spreadsheet-import/utils/buildRecordFromImportedStructuredRow';
import { spreadsheetImportFilterAvailableFieldMetadataItems } from '@/object-record/spreadsheet-import/utils/spreadsheetImportFilterAvailableFieldMetadataItems';
import { spreadsheetImportGetUnicityTableHook } from '@/object-record/spreadsheet-import/utils/spreadsheetImportGetUnicityTableHook';
import { SPREADSHEET_IMPORT_CREATE_RECORDS_BATCH_SIZE } from '@/spreadsheet-import/constants/SpreadsheetImportCreateRecordsBatchSize';
import { useOpenSpreadsheetImportDialog } from '@/spreadsheet-import/hooks/useOpenSpreadsheetImportDialog';
import { spreadsheetImportCreatedRecordsProgressState } from '@/spreadsheet-import/states/spreadsheetImportCreatedRecordsProgressState';
import { type SpreadsheetImportDialogOptions } from '@/spreadsheet-import/types';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { useAtomComponentStateCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateCallbackState';
import { useGetViewFromState } from '@/views/hooks/useGetViewFromState';
import { useSaveCurrentViewFields } from '@/views/hooks/useSaveCurrentViewFields';
import { useStore } from 'jotai';
import { type ViewField } from '@/views/types/ViewField';

export const useOpenObjectRecordsSpreadsheetImportDialog = (
  objectNameSingular: string,
) => {
  const apolloCoreClient = useApolloCoreClient();
  const { openSpreadsheetImportDialog } = useOpenSpreadsheetImportDialog();
  const { buildSpreadsheetImportFields } = useBuildSpreadsheetImportFields();

  const { enqueueErrorSnackBar } = useSnackBar();

  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular,
  });

  const setSpreadsheetImportCreatedRecordsProgress = useSetAtomState(
    spreadsheetImportCreatedRecordsProgressState,
  );

  const abortController = new AbortController();

  const { recordGqlFields } = useGenerateDepthRecordGqlFieldsFromObject({
    objectNameSingular,
    depth: 0,
  });

  const { batchCreateManyRecords } = useBatchCreateManyRecords({
    objectNameSingular,
    recordGqlFields,
    mutationBatchSize: SPREADSHEET_IMPORT_CREATE_RECORDS_BATCH_SIZE,
    setBatchedRecordsCount: setSpreadsheetImportCreatedRecordsProgress,
    abortController,
  });

  const { saveViewFields } = useSaveCurrentViewFields();
  const { getViewFromState } = useGetViewFromState();
  const store = useStore();
  const currentViewIdCallbackState = useAtomComponentStateCallbackState(
    contextStoreCurrentViewIdComponentState,
  );

  const openObjectRecordsSpreadsheetImportDialog = (
    options?: Omit<
      SpreadsheetImportDialogOptions,
      'fields' | 'isOpen' | 'onClose'
    >,
  ) => {
    const availableFieldMetadataItemsToImport =
      spreadsheetImportFilterAvailableFieldMetadataItems(
        objectMetadataItem.updatableFields,
      );

    const spreadsheetImportFields = buildSpreadsheetImportFields(
      availableFieldMetadataItemsToImport,
    );

    openSpreadsheetImportDialog({
      ...options,
      onSubmit: async (data) => {
        const createInputs = data.validStructuredRows.map((record) => {
          const fieldMapping: Record<string, any> =
            buildRecordFromImportedStructuredRow({
              importedStructuredRow: record,
              fieldMetadataItems: availableFieldMetadataItemsToImport,
              spreadsheetImportFields,
            });

          return fieldMapping;
        });

        try {
          await batchCreateManyRecords({
            recordsToCreate: createInputs,
            upsert: true,
          });
          await apolloCoreClient.refetchQueries({
            updateCache: (cache) => {
              cache.evict({ fieldName: objectMetadataItem.namePlural });
            },
          });

          const usedFieldNames = new Set(
            createInputs.flatMap((input) => Object.keys(input)),
          );
          const usedFieldMetadataIds = new Set(
            availableFieldMetadataItemsToImport
              .filter((field) => usedFieldNames.has(field.name))
              .map((field) => field.id),
          );
          if (usedFieldMetadataIds.size > 0) {
            const currentViewId = store.get(currentViewIdCallbackState);
            if (currentViewId) {
              const currentView = getViewFromState(currentViewId);
              if (currentView) {
                const viewFieldsToShow = currentView.viewFields
                  .filter(
                    (viewField: ViewField) =>
                      usedFieldMetadataIds.has(viewField.fieldMetadataId) &&
                      !viewField.isVisible,
                  )
                  .map((viewField: ViewField) => ({ ...viewField, isVisible: true }));
                if (viewFieldsToShow.length > 0) {
                  await saveViewFields(viewFieldsToShow);
                }
              }
            }
          }
        } catch (error: any) {
          enqueueErrorSnackBar({
            apolloError: error,
          });
        }
      },
      spreadsheetImportFields,
      availableFieldMetadataItems: availableFieldMetadataItemsToImport,
      onAbortSubmit: () => {
        abortController.abort();
      },
      tableHook: spreadsheetImportGetUnicityTableHook(objectMetadataItem),
    });
  };

  return {
    openObjectRecordsSpreadsheetImportDialog,
  };
};
