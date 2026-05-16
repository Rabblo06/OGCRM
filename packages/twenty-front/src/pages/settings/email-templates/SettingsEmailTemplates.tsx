import { useState } from 'react';

import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import {
  type EmailTemplate,
  useEmailTemplates,
} from '@/activities/emails/hooks/useEmailTemplates';
import { styled } from '@linaria/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { H2Title, IconEdit, IconMail, IconPlus, IconTrash } from 'twenty-ui/display';
import { Button, TextArea, TextInput } from 'twenty-ui/input';
import { Section } from 'twenty-ui/layout';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledTemplateList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  margin-top: ${themeCssVariables.spacing[4]};
`;

const StyledTemplateRow = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledTemplateInfo = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
`;

const StyledTemplateName = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledTemplateSubject = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledTemplateActions = styled.div`
  display: flex;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  margin-top: ${themeCssVariables.spacing[4]};
`;

const StyledFormActions = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledEmpty = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
  margin-top: ${themeCssVariables.spacing[6]};
  padding: ${themeCssVariables.spacing[8]};
  text-align: center;
`;

type FormState = {
  name: string;
  subject: string;
  body: string;
};

const emptyForm: FormState = { name: '', subject: '', body: '' };

export const SettingsEmailTemplates = () => {
  const { t } = useLingui();
  const { templates, createTemplate, updateTemplate, deleteTemplate } =
    useEmailTemplates();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleOpenEdit = (template: EmailTemplate) => {
    setEditingId(template.id);
    setForm({ name: template.name, subject: template.subject, body: template.body });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      updateTemplate(editingId, form.name, form.subject, form.body);
    } else {
      createTemplate(form.name, form.subject, form.body);
    }
    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const innerContent = (
    <>
      <Section>
        <H2Title
          title={t`Email Templates`}
          description={t`Save reusable email templates to quickly fill in the compose form.`}
        />

        {!showForm && (
          <Button
            Icon={IconPlus}
            title={t`New Template`}
            variant="secondary"
            onClick={handleOpenCreate}
          />
        )}

        {showForm && (
          <StyledForm>
            <TextInput
              label={t`Template name`}
              placeholder={t`e.g. Follow-up, Introduction`}
              value={form.name}
              onChange={(value) => setForm((f) => ({ ...f, name: value }))}
              fullWidth
            />
            <TextInput
              label={t`Subject`}
              placeholder={t`Email subject line`}
              value={form.subject}
              onChange={(value) => setForm((f) => ({ ...f, subject: value }))}
              fullWidth
            />
            <TextArea
              label={t`Body`}
              placeholder={t`Email body text`}
              value={form.body}
              onChange={(value) => setForm((f) => ({ ...f, body: value }))}
              minRows={5}
            />
            <StyledFormActions>
              <Button
                title={editingId ? t`Update Template` : t`Save Template`}
                accent="blue"
                onClick={handleSave}
                disabled={!form.name.trim()}
              />
              <Button
                title={t`Cancel`}
                variant="secondary"
                onClick={handleCancel}
              />
            </StyledFormActions>
          </StyledForm>
        )}

        {!showForm && (
          <StyledTemplateList>
            {templates.length === 0 ? (
              <StyledEmpty>
                <IconMail size={32} />
                <div>
                  <Trans>No templates yet.</Trans>
                </div>
                <div>
                  <Trans>Click "New Template" to create your first one.</Trans>
                </div>
              </StyledEmpty>
            ) : (
              templates.map((template) => (
                <StyledTemplateRow key={template.id}>
                  <StyledTemplateInfo>
                    <StyledTemplateName>{template.name}</StyledTemplateName>
                    {template.subject && (
                      <StyledTemplateSubject>
                        {template.subject}
                      </StyledTemplateSubject>
                    )}
                  </StyledTemplateInfo>
                  <StyledTemplateActions>
                    <Button
                      Icon={IconEdit}
                      size="small"
                      variant="secondary"
                      title={t`Edit`}
                      onClick={() => handleOpenEdit(template)}
                    />
                    <Button
                      Icon={IconTrash}
                      size="small"
                      variant="secondary"
                      title={t`Delete`}
                      onClick={() => deleteTemplate(template.id)}
                    />
                  </StyledTemplateActions>
                </StyledTemplateRow>
              ))
            )}
          </StyledTemplateList>
        )}
      </Section>
    </>
  );

  return (
    <SubMenuTopBarContainer
      title={t`Email Templates`}
      links={[
        {
          children: <Trans>Workspace</Trans>,
          href: getSettingsPath(SettingsPath.Workspace),
        },
        { children: <Trans>Email Templates</Trans> },
      ]}
    >
      <SettingsPageContainer>{innerContent}</SettingsPageContainer>
    </SubMenuTopBarContainer>
  );
};
