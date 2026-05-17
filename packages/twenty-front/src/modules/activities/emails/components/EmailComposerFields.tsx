import { useState } from 'react';

import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';

import { EmailAttachmentsField } from '@/activities/emails/components/EmailAttachmentsField';
import { useEmailTemplates } from '@/activities/emails/hooks/useEmailTemplates';
import { type EmailComposerState } from '@/activities/emails/types/EmailComposerState';
import { FormAdvancedTextFieldInput } from '@/object-record/record-field/ui/form-types/components/FormAdvancedTextFieldInput';
import { FormMultiTextFieldInput } from '@/object-record/record-field/ui/form-types/components/FormMultiTextFieldInput';
import { FormTextFieldInput } from '@/object-record/record-field/ui/form-types/components/FormTextFieldInput';
import { GET_MY_CONNECTED_ACCOUNTS } from '@/settings/accounts/graphql/queries/getMyConnectedAccounts';
import { Select } from '@/ui/input/components/Select';
import { t } from '@lingui/core/macro';
import { IconLayoutGrid } from 'twenty-ui/display';
import { Button, type SelectOption } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledFieldsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[2]};
`;

const StyledToRow = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
`;

const StyledCcBccToggle = styled.button`
  all: unset;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.xs};
  position: absolute;
  right: 0;
  top: 0;

  &:hover {
    color: ${themeCssVariables.font.color.secondary};
  }
`;

const StyledTemplateDropdownWrapper = styled.div`
  position: relative;
`;

const StyledTemplateDropdown = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  box-shadow: ${themeCssVariables.boxShadow.light};
  left: 0;
  margin-top: ${themeCssVariables.spacing[1]};
  max-height: 220px;
  overflow-y: auto;
  position: absolute;
  top: 100%;
  width: 260px;
  z-index: 100;
`;

const StyledTemplateItem = styled.button`
  all: unset;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  width: 100%;

  &:hover {
    background: ${themeCssVariables.background.tertiary};
  }
`;

const StyledTemplateItemName = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: 500;
`;

const StyledTemplateItemSubject = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledTemplateEmpty = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[3]};
  text-align: center;
`;

type EmailComposerFieldsProps = {
  composerState: EmailComposerState;
};

export const EmailComposerFields = ({
  composerState,
}: EmailComposerFieldsProps) => {
  const { data: accountsData } = useQuery<{
    myConnectedAccounts: { id: string; handle: string }[];
  }>(GET_MY_CONNECTED_ACCOUNTS);

  const { templates } = useEmailTemplates();
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateFill, setTemplateFill] = useState<{
    key: string;
    subject: string;
    body: string;
  } | null>(null);

  const accountOptions: SelectOption<string>[] =
    accountsData?.myConnectedAccounts?.map((account) => ({
      label: account.handle,
      value: account.id,
    })) ?? [];

  const hasMultipleAccounts = accountOptions.length > 1;

  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    composerState.setSubject(template.subject);
    composerState.setBody(template.body);
    setTemplateFill({ key: templateId, subject: template.subject, body: template.body });
    setShowTemplates(false);
  };

  return (
    <StyledFieldsContainer>
      {hasMultipleAccounts && (
        <Select
          dropdownId="email-composer-from-account"
          label={t`From`}
          fullWidth
          value={composerState.connectedAccountId}
          options={accountOptions}
          onChange={(value) => composerState.setConnectedAccountId(value)}
        />
      )}
      <StyledToRow>
        <FormMultiTextFieldInput
          label={t`To`}
          defaultValue={composerState.defaultTo}
          onChange={composerState.setTo}
          placeholder={t`Recipients`}
        />
        {!composerState.showCcBcc && (
          <StyledCcBccToggle onClick={() => composerState.setShowCcBcc(true)}>
            {t`Cc/Bcc`}
          </StyledCcBccToggle>
        )}
      </StyledToRow>
      {composerState.showCcBcc && (
        <>
          <FormMultiTextFieldInput
            label={t`Cc`}
            defaultValue=""
            onChange={composerState.setCc}
            placeholder={t`Cc`}
          />
          <FormMultiTextFieldInput
            label={t`Bcc`}
            defaultValue=""
            onChange={composerState.setBcc}
            placeholder={t`Bcc`}
          />
        </>
      )}
      <FormTextFieldInput
        key={templateFill ? `subject-${templateFill.key}` : 'subject-default'}
        label={t`Subject`}
        defaultValue={templateFill ? templateFill.subject : composerState.defaultSubject}
        onChange={composerState.setSubject}
        placeholder={t`Subject`}
      />
      <StyledTemplateDropdownWrapper>
        <Button
          Icon={IconLayoutGrid}
          title={t`Use Template`}
          size="small"
          variant="secondary"
          onClick={() => setShowTemplates((v) => !v)}
        />
        {showTemplates && (
          <StyledTemplateDropdown>
            {templates.length === 0 ? (
              <StyledTemplateEmpty>{t`No templates saved yet`}</StyledTemplateEmpty>
            ) : (
              templates.map((template) => (
                <StyledTemplateItem
                  key={template.id}
                  type="button"
                  onClick={() => handleSelectTemplate(template.id)}
                >
                  <StyledTemplateItemName>{template.name}</StyledTemplateItemName>
                  {template.subject && (
                    <StyledTemplateItemSubject>
                      {template.subject}
                    </StyledTemplateItemSubject>
                  )}
                </StyledTemplateItem>
              ))
            )}
          </StyledTemplateDropdown>
        )}
      </StyledTemplateDropdownWrapper>
      <FormAdvancedTextFieldInput
        key={templateFill ? `body-${templateFill.key}` : 'body-default'}
        defaultValue={templateFill ? templateFill.body : ''}
        onChange={composerState.setBody}
        placeholder={t`Type something or press "/" to see commands`}
        minHeight={120}
        maxWidth={600}
        contentType="html"
      />
      <EmailAttachmentsField
        label={t`Attachments`}
        files={composerState.files}
        onChange={composerState.setFiles}
      />
    </StyledFieldsContainer>
  );
};
