import { useCallback, useState } from 'react';

import { v4 } from 'uuid';

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

const STORAGE_KEY = 'crmpro_email_templates';

const loadTemplates = (): EmailTemplate[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EmailTemplate[]) : [];
  } catch {
    return [];
  }
};

const saveTemplates = (templates: EmailTemplate[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
};

export const useEmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>(loadTemplates);

  const createTemplate = useCallback(
    (name: string, subject: string, body: string): EmailTemplate => {
      const newTemplate: EmailTemplate = { id: v4(), name, subject, body };
      const updated = [...templates, newTemplate];
      saveTemplates(updated);
      setTemplates(updated);
      return newTemplate;
    },
    [templates],
  );

  const updateTemplate = useCallback(
    (id: string, name: string, subject: string, body: string): void => {
      const updated = templates.map((t) =>
        t.id === id ? { ...t, name, subject, body } : t,
      );
      saveTemplates(updated);
      setTemplates(updated);
    },
    [templates],
  );

  const deleteTemplate = useCallback(
    (id: string): void => {
      const updated = templates.filter((t) => t.id !== id);
      saveTemplates(updated);
      setTemplates(updated);
    },
    [templates],
  );

  return { templates, createTemplate, updateTemplate, deleteTemplate };
};
