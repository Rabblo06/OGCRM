import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { styled } from '@linaria/react';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { H2Title, IconCheck, IconUsers } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import { Section } from 'twenty-ui/layout';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type SettingsEnterpriseProps = {
  isAdminPanelTab?: boolean;
};

const SEAT_OPTIONS = [5, 7, 10, 15, 20];
const STORAGE_KEY = 'crmpro_enterprise_seats';

const StyledSeatGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};
  margin-top: ${themeCssVariables.spacing[4]};
`;

const StyledSeatOption = styled.button<{ isSelected: boolean }>`
  align-items: center;
  background-color: ${({ isSelected }) =>
    isSelected
      ? themeCssVariables.color.blue
      : themeCssVariables.background.secondary};
  border: 2px solid
    ${({ isSelected }) =>
      isSelected
        ? themeCssVariables.color.blue
        : themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${({ isSelected }) =>
    isSelected ? '#ffffff' : themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  font-family: inherit;
  gap: ${themeCssVariables.spacing[1]};
  justify-content: center;
  min-width: 90px;
  padding: ${themeCssVariables.spacing[4]} ${themeCssVariables.spacing[5]};
  transition: all 0.15s ease;

  &:hover {
    border-color: ${themeCssVariables.color.blue};
  }
`;

const StyledSeatNumber = styled.span`
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
`;

const StyledSeatLabel = styled.span`
  font-size: ${themeCssVariables.font.size.sm};
  opacity: 0.8;
`;

const StyledStatusRow = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledStatusDot = styled.div`
  background-color: ${themeCssVariables.color.green};
  border-radius: 50%;
  flex-shrink: 0;
  height: 10px;
  width: 10px;
`;

const StyledStatusText = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: 500;
`;

const StyledStatusSub = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  margin-top: 2px;
`;

const StyledButtonRow = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  margin-top: ${themeCssVariables.spacing[4]};
`;

export const SettingsEnterprise = ({
  isAdminPanelTab = false,
}: SettingsEnterpriseProps = {}) => {
  const { t } = useLingui();

  const storedSeats = localStorage.getItem(STORAGE_KEY);
  const [activatedSeats, setActivatedSeats] = useState<number | null>(
    storedSeats ? parseInt(storedSeats, 10) : null,
  );
  const [selectedSeats, setSelectedSeats] = useState<number | null>(
    activatedSeats,
  );
  const [isChanging, setIsChanging] = useState(false);

  const handleActivate = () => {
    if (!selectedSeats) return;
    localStorage.setItem(STORAGE_KEY, String(selectedSeats));
    setActivatedSeats(selectedSeats);
    setIsChanging(false);
  };

  const showSelector = !activatedSeats || isChanging;

  const renderContent = () => {
    if (showSelector) {
      return (
        <Section>
          <H2Title
            title={t`Enterprise License`}
            description={t`How many users do you need to use the app?`}
          />
          <StyledSeatGrid>
            {SEAT_OPTIONS.map((count) => (
              <StyledSeatOption
                key={count}
                isSelected={selectedSeats === count}
                onClick={() => setSelectedSeats(count)}
                type="button"
              >
                <StyledSeatNumber>{count}</StyledSeatNumber>
                <StyledSeatLabel>
                  <Trans>users</Trans>
                </StyledSeatLabel>
              </StyledSeatOption>
            ))}
          </StyledSeatGrid>
          <StyledButtonRow>
            <Button
              Icon={IconCheck}
              title={t`Activate License`}
              accent="blue"
              disabled={!selectedSeats}
              onClick={handleActivate}
            />
            {isChanging && (
              <Button
                title={t`Cancel`}
                variant="secondary"
                onClick={() => {
                  setSelectedSeats(activatedSeats);
                  setIsChanging(false);
                }}
              />
            )}
          </StyledButtonRow>
        </Section>
      );
    }

    return (
      <Section>
        <H2Title
          title={t`Enterprise License`}
          description={t`Your enterprise features are active on this self-hosted instance.`}
        />
        <StyledStatusRow>
          <StyledStatusDot />
          <div>
            <StyledStatusText>
              <Trans>Active (Self-hosted)</Trans>
            </StyledStatusText>
            <StyledStatusSub>
              {activatedSeats} <Trans>users licensed</Trans>
            </StyledStatusSub>
          </div>
        </StyledStatusRow>
        <StyledButtonRow>
          <Button
            Icon={IconUsers}
            title={t`Change seat count`}
            variant="secondary"
            onClick={() => setIsChanging(true)}
          />
        </StyledButtonRow>
      </Section>
    );
  };

  const innerContent = renderContent();

  if (isAdminPanelTab) {
    return innerContent;
  }

  return (
    <SubMenuTopBarContainer
      title={t`Enterprise`}
      links={[
        {
          children: <Trans>Workspace</Trans>,
          href: getSettingsPath(SettingsPath.Workspace),
        },
        { children: <Trans>Enterprise</Trans> },
      ]}
    >
      <SettingsPageContainer>{innerContent}</SettingsPageContainer>
    </SubMenuTopBarContainer>
  );
};
